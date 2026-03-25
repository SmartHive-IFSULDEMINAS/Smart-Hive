"""
Views para o módulo de IA — classificação espectral de pólen (AS7341)
"""
import os
import numpy as np
from pathlib import Path

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
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

    # ── Normalização L1 + predição ─────────────────────────────────────────
    X_raw = np.array(raw_values, dtype=float).reshape(1, -1)
    X_norm = _normalizer.transform(X_raw)

    knn_pred = int(_knn.predict(X_norm)[0])
    kmeans_pred = int(_kmeans.predict(X_norm)[0])

    norm_dict = {col: round(float(X_norm[0][i]), 6) for i, col in enumerate(SENSOR_COLUMNS)}

    # ── Salvar no banco ────────────────────────────────────────────────────
    dispositivo_id = data.get('dispositivo_id', '')
    notas = data.get('notas', '')
    ClassificacaoPolen.objects.create(
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
        notas=notas,
    )

    return Response(
        {
            'success': True,
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
