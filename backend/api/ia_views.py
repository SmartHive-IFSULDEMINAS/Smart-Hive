"""
Views para o módulo de IA — classificação espectral de pólen (AS7341)
"""
import csv
import io
import os
import logging
import numpy as np
from pathlib import Path

logger = logging.getLogger(__name__)

from django.utils import timezone
from django.utils.dateparse import parse_datetime
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import ClassificacaoPolen

# ── Carregamento lazy dos modelos (evita import no topo que quebraria se
#    scikit-learn não estiver instalado no ambiente de desenvolvimento) ─────────

_normalizer = None
_knn = None
_kmeans = None
_load_error = None

SENSOR_COLUMNS = ['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'NIR', 'CLEAR']


def _models_dir() -> Path:
    """
    Resolve o diretório dos modelos .pkl.

    Prioridade:
    1. Variável de ambiente IA_MODELS_DIR
    2. ../IA-smart_hive/models  (relativo ao backend/ — funciona em dev local)
    """
    env_path = os.environ.get('IA_MODELS_DIR')
    if env_path:
        return Path(env_path)
    # BASE_DIR aponta para backend/; sobe um nível para a raiz do projeto
    base = Path(__file__).resolve().parent.parent.parent
    return base / 'IA-smart_hive' / 'models'


def _load_models():
    """Carrega os três artefatos ML uma única vez (singleton)."""
    global _normalizer, _knn, _kmeans, _load_error

    if _normalizer is not None or _load_error is not None:
        return  # já tentou carregar

    try:
        import joblib
    except ImportError:
        _load_error = "Biblioteca 'joblib' não instalada. Execute: pip install scikit-learn"
        return

    models_path = _models_dir()

    required = {
        'normalizer': models_path / 'normalizer.pkl',
        'knn': models_path / 'knn_ref.pkl',
        'kmeans': models_path / 'kmeans_8.pkl',
    }

    for name, path in required.items():
        if not path.exists():
            _load_error = (
                f"Arquivo de modelo não encontrado: {path}. "
                f"Certifique-se de que os modelos foram treinados e que "
                f"IA_MODELS_DIR está configurado corretamente."
            )
            return

    try:
        _normalizer = joblib.load(required['normalizer'])
        _knn = joblib.load(required['knn'])
        _kmeans = joblib.load(required['kmeans'])
    except Exception as exc:
        _load_error = f"Erro ao carregar modelos: {exc}"


def _prever(raw_values):
    """
    Roda a normalização L1 + predição KNN/KMeans sobre uma amostra.
    Compartilhado entre classificar_polen (uma amostra via API) e
    importar_csv_polen (várias amostras de um CSV) para não duplicar a
    lógica de inferência entre os dois caminhos.

    raw_values: lista de 10 floats, na ordem de SENSOR_COLUMNS.
    Retorna (knn_pred: int, kmeans_pred: int, norm_dict: dict).
    Lança a exceção original em caso de erro -- quem chama decide como
    reportar (Response 500 numa amostra única, ou "linha ignorada" num lote).
    """
    X_raw = np.array(raw_values, dtype=float).reshape(1, -1)
    X_norm = _normalizer.transform(X_raw)
    knn_pred = int(_knn.predict(X_norm)[0])
    kmeans_pred = int(_kmeans.predict(X_norm)[0])
    norm_dict = {col: round(float(X_norm[0][i]), 6) for i, col in enumerate(SENSOR_COLUMNS)}
    return knn_pred, kmeans_pred, norm_dict


# ── Endpoints ─────────────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([AllowAny])
def classificar_polen(request):
    """
    Classifica uma amostra de pólen a partir dos 10 canais espectrais do AS7341.

    Aceita dois formatos de entrada:

    Formato A — objeto com chaves por canal (recomendado):
        {
            "F1": 2, "F2": 8, "F3": 5, "F4": 13,
            "F5": 23, "F6": 20, "F7": 21, "F8": 5,
            "NIR": 61, "CLEAR": 2
        }

    Formato B — array ordenado de 10 valores:
        { "canais": [2, 8, 5, 13, 23, 20, 21, 5, 61, 2] }

    Retorno:
        {
            "success": true,
            "knn": { "classe": 3, "label": "TIPO: 3" },
            "kmeans": { "cluster": 1, "label": "CLUSTER 1" },
            "canais_normalizados": { "F1": 0.007, ... },
            "canais_brutos": { "F1": 2, ... }
        }
    """
    _load_models()

    if _load_error:
        return Response(
            {'success': False, 'error': _load_error},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    # ── Extrair valores brutos ─────────────────────────────────────────────
    data = request.data

    if 'canais' in data:
        # Formato B
        canais = data['canais']
        if not isinstance(canais, (list, tuple)) or len(canais) != 10:
            return Response(
                {'success': False, 'error': '"canais" deve ser uma lista com exatamente 10 valores.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        raw_values = [float(v) for v in canais]
        raw_dict = dict(zip(SENSOR_COLUMNS, raw_values))
    else:
        # Formato A
        missing = [col for col in SENSOR_COLUMNS if col not in data]
        if missing:
            return Response(
                {
                    'success': False,
                    'error': f'Canais ausentes: {missing}. '
                             f'Envie todos os 10 canais: {SENSOR_COLUMNS}',
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            raw_values = [float(data[col]) for col in SENSOR_COLUMNS]
        except (TypeError, ValueError) as exc:
            return Response(
                {'success': False, 'error': f'Valor inválido nos canais: {exc}'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        raw_dict = {col: raw_values[i] for i, col in enumerate(SENSOR_COLUMNS)}

    # ── Log dos dados recebidos ────────────────────────────────────────────
    logger.info(
        "[IA-Polen] Canais brutos recebidos: %s | dispositivo: %s",
        dict(zip(['F1','F2','F3','F4','F5','F6','F7','F8','NIR','CLEAR'], raw_values)),
        data.get('dispositivo_id', 'N/A'),
    )

    # ── Normalização L1 + predição ─────────────────────────────────────────
    try:
        knn_pred, kmeans_pred, norm_dict = _prever(raw_values)
        logger.info(
            "[IA-Polen] Resultado — KNN: TIPO %d | KMeans: CLUSTER %d | normalizado: %s",
            knn_pred, kmeans_pred, norm_dict,
        )
    except Exception as exc:
        return Response(
            {'success': False, 'error': f'Erro durante a predição: {exc}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    # ── Salvar no banco ────────────────────────────────────────────────────
    dispositivo_id = data.get('dispositivo_id', '')
    notas = data.get('notas', '')
    # "id" enviado pelo dispositivo no payload -- não confundir com a chave
    # primária do registro (ClassificacaoPolen.id, gerada pelo Django).
    payload_id_raw = data.get('id')
    payload_id = str(payload_id_raw) if payload_id_raw is not None else ''

    classificacao = ClassificacaoPolen.objects.create(
        requisicao_raw=dict(data),
        canal_f1=raw_values[0],
        canal_f2=raw_values[1],
        canal_f3=raw_values[2],
        canal_f4=raw_values[3],
        canal_f5=raw_values[4],
        canal_f6=raw_values[5],
        canal_f7=raw_values[6],
        canal_f8=raw_values[7],
        canal_nir=raw_values[8],
        canal_clear=raw_values[9],
        knn_classe=knn_pred,
        kmeans_cluster=kmeans_pred,
        dispositivo_id=dispositivo_id,
        payload_id=payload_id,
        notas=notas,
    )

    return Response(
        {
            'success': True,
            'id': classificacao.id,
            'payload_id': payload_id,
            'knn': {
                'classe': knn_pred,
                'label': f'TIPO: {knn_pred}',
            },
            'kmeans': {
                'cluster': kmeans_pred,
                'label': f'CLUSTER {kmeans_pred}',
            },
            'canais_normalizados': norm_dict,
            'canais_brutos': raw_dict,
        },
        status=status.HTTP_200_OK,
    )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def importar_csv_polen(request):
    """
    Importa um lote de amostras de pólen gravadas localmente (offline) via
    CSV, rodando o mesmo pipeline de classificação (normalização L1 + KNN +
    KMeans) usado em classificar_polen. Cada registro criado fica marcado
    com origem='csv', para diferenciar de classificações feitas ao vivo.

    POST /api/ia/polen/upload-csv/  (multipart/form-data, campo "arquivo_csv")

    Cabeçalho esperado (nomes de coluna, sem diferenciar maiúsc./minúsc.):
        DATA,ID,TIPO,ESPECIE,NOTAS,F1,F2,F3,F4,F5,F6,F7,F8,NIR,CLEAR

    Apenas F1..CLEAR são obrigatórias. DATA (timestamp real da coleta),
    ID (equivalente ao "id" do payload em tempo real), TIPO, ESPECIE e
    NOTAS são opcionais. Linhas inválidas são ignoradas (com o motivo
    reportado), sem abortar o restante do arquivo.
    """
    _load_models()

    if _load_error:
        return Response(
            {'success': False, 'error': _load_error},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    arquivo = request.FILES.get('arquivo_csv')
    if arquivo is None:
        return Response(
            {'success': False, 'error': 'arquivo_csv é obrigatório'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        texto = arquivo.read().decode('utf-8-sig')
    except UnicodeDecodeError:
        return Response(
            {'success': False, 'error': 'Arquivo CSV com codificação inválida (esperado UTF-8)'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    leitor = csv.DictReader(io.StringIO(texto))
    if leitor.fieldnames is None:
        return Response(
            {'success': False, 'error': 'CSV vazio ou sem cabeçalho'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Mapa case-insensitive: "f1" -> "F1" (nome real da coluna no arquivo)
    colunas = {nome.strip().upper(): nome for nome in leitor.fieldnames}

    faltando = [col for col in SENSOR_COLUMNS if col not in colunas]
    if faltando:
        return Response(
            {
                'success': False,
                'error': f'Colunas obrigatórias ausentes no CSV: {faltando}. '
                         f'Esperado pelo menos: {SENSOR_COLUMNS}',
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    ids_criados = []
    ignoradas = []

    for numero_linha, linha in enumerate(leitor, start=2):  # linha 1 é o cabeçalho
        try:
            raw_values = [float(linha[colunas[col]]) for col in SENSOR_COLUMNS]
        except (KeyError, TypeError, ValueError) as exc:
            ignoradas.append({'linha': numero_linha, 'motivo': f'canal inválido ou ausente: {exc}'})
            continue

        try:
            knn_pred, kmeans_pred, _ = _prever(raw_values)
        except Exception as exc:
            ignoradas.append({'linha': numero_linha, 'motivo': f'erro na predição: {exc}'})
            continue

        # Timestamp real da coleta (coluna DATA), se presente e válida --
        # auto_now_add só respeita valor explícito numa segunda gravação
        # (ver comentário abaixo), não no create().
        timestamp_real = None
        if 'DATA' in colunas:
            valor_data = (linha.get(colunas['DATA']) or '').strip()
            if valor_data:
                parsed = parse_datetime(valor_data.replace(' ', 'T', 1)) or parse_datetime(valor_data)
                if parsed is not None:
                    if timezone.is_naive(parsed):
                        parsed = timezone.make_aware(parsed, timezone.get_current_timezone())
                    timestamp_real = parsed
                else:
                    ignoradas.append({
                        'linha': numero_linha,
                        'motivo': f'DATA "{valor_data}" não reconhecida, usando hora da importação',
                    })

        payload_id = ''
        if 'ID' in colunas:
            payload_id = (linha.get(colunas['ID']) or '').strip()

        partes_notas = []
        if 'TIPO' in colunas and (linha.get(colunas['TIPO']) or '').strip():
            partes_notas.append(f"TIPO original do CSV: {linha[colunas['TIPO']].strip()}")
        if 'ESPECIE' in colunas and (linha.get(colunas['ESPECIE']) or '').strip():
            partes_notas.append(f"Espécie: {linha[colunas['ESPECIE']].strip()}")
        if 'NOTAS' in colunas and (linha.get(colunas['NOTAS']) or '').strip():
            partes_notas.append(linha[colunas['NOTAS']].strip())
        notas = ' | '.join(partes_notas)

        classificacao = ClassificacaoPolen.objects.create(
            requisicao_raw=dict(linha),
            canal_f1=raw_values[0],
            canal_f2=raw_values[1],
            canal_f3=raw_values[2],
            canal_f4=raw_values[3],
            canal_f5=raw_values[4],
            canal_f6=raw_values[5],
            canal_f7=raw_values[6],
            canal_f8=raw_values[7],
            canal_nir=raw_values[8],
            canal_clear=raw_values[9],
            knn_classe=knn_pred,
            kmeans_cluster=kmeans_pred,
            payload_id=payload_id,
            notas=notas,
            origem='csv',
        )

        if timestamp_real is not None:
            # auto_now_add só força o valor na criação (add=True); numa
            # segunda gravação explícita ele respeita o valor atribuído.
            classificacao.timestamp = timestamp_real
            classificacao.save(update_fields=['timestamp'])

        ids_criados.append(classificacao.id)

    return Response(
        {
            'success': True,
            'total_linhas': len(ids_criados) + len(ignoradas),
            'total_processado': len(ids_criados),
            'total_ignorado': len(ignoradas),
            'ids_criados': ids_criados,
            'ignoradas': ignoradas,
        },
        status=status.HTTP_200_OK,
    )


@api_view(['GET'])
@permission_classes([AllowAny])
def status_modelos(request):
    """
    Verifica se os modelos de IA estão carregados e prontos.

    GET /api/ia/status/
    """
    _load_models()

    if _load_error:
        return Response(
            {
                'status': 'indisponivel',
                'modelos_carregados': False,
                'erro': _load_error,
                'models_dir': str(_models_dir()),
            },
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    return Response(
        {
            'status': 'pronto',
            'modelos_carregados': True,
            'canais': SENSOR_COLUMNS,
            'models_dir': str(_models_dir()),
        },
        status=status.HTTP_200_OK,
    )
