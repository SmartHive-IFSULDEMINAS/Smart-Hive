"""
Converte o log bruto do sensor (formato CSV posicional vindo da serial)
para o JSON aceito pelo endpoint de importacao da plataforma
(POST /api/iot/colmeia/upload-json/).

Formato de entrada esperado, uma leitura por linha:
    timestamp_ou_status,colmeia_identificador,temperatura,umidade,pressao,nivel_ruido

Exemplo de linha valida:
    2026-08-18T09:30:00-03:00,CLM-001,17.27,67.08,825.87,41.2

Exemplo de linha sem sincronismo de horario:
    Sem Conexao NTP,CLM-001,17.27,67.08,825.87,41.2

Uso:
    # Descarta linhas sem timestamp valido
    python converter_leituras_serial.py entrada.txt saida.json

    # Em vez de descartar, distribui as linhas sem timestamp valido
    # uniformemente entre INICIO e FIM (assume intervalo de amostragem
    # constante ao longo do periodo), preservando a ordem do arquivo
    python converter_leituras_serial.py entrada.txt saida.json \
        --distribuir-entre "2026-08-21T14:36:00-03:00" "2026-08-25T10:55:00-03:00"
"""
import sys
import json
import argparse
from datetime import datetime


def parse_timestamp(raw):
    raw = raw.strip()
    if not raw or "ntp" in raw.lower():
        return None
    for fmt in ("%Y-%m-%dT%H:%M:%S%z", "%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M:%S"):
        try:
            return datetime.strptime(raw, fmt)
        except ValueError:
            continue
    try:
        # aceita "...Z" e variantes ISO 8601 que strptime acima nao cobre
        return datetime.fromisoformat(raw.replace("Z", "+00:00"))
    except ValueError:
        return None


def parse_bound(raw):
    dt = parse_timestamp(raw)
    if dt is None:
        raise ValueError(f"nao foi possivel interpretar o limite de data/hora: {raw!r}")
    return dt


def converter(linhas, distribuir_entre=None):
    """
    linhas: lista de linhas brutas do arquivo.
    distribuir_entre: tupla (inicio: datetime, fim: datetime) opcional.
        Quando informado, linhas sem timestamp valido recebem um timestamp
        sintetico distribuido uniformemente entre inicio e fim, na ordem em
        que aparecem no arquivo, em vez de serem descartadas.
    """
    registros = []  # (numero, campos, timestamp_valido_ou_None)
    ignoradas = []

    for numero, linha in enumerate(linhas, start=1):
        linha = linha.strip()
        if not linha:
            continue

        campos = [c.strip() for c in linha.split(",")]
        if len(campos) != 6:
            ignoradas.append((numero, linha, f"esperado 6 campos, recebido {len(campos)}"))
            continue

        timestamp_raw, colmeia_identificador, temperatura, umidade, pressao, nivel_ruido = campos

        try:
            valores = {
                "colmeia_identificador": colmeia_identificador,
                "temperatura": float(temperatura),
                "umidade": float(umidade),
                "pressao": float(pressao),
                "nivel_ruido": float(nivel_ruido),
            }
        except ValueError as exc:
            ignoradas.append((numero, linha, f"valor numerico invalido: {exc}"))
            continue

        timestamp = parse_timestamp(timestamp_raw)
        registros.append((numero, linha, valores, timestamp))

    leituras = []

    if distribuir_entre is None:
        for numero, linha, valores, timestamp in registros:
            if timestamp is None:
                ignoradas.append((numero, linha, "sem timestamp valido (NTP indisponivel ou formato desconhecido)"))
                continue
            leituras.append({**valores, "timestamp": timestamp.isoformat()})
    else:
        inicio, fim = distribuir_entre
        sem_timestamp = [r for r in registros if r[3] is None]
        total = len(sem_timestamp)
        duracao = fim - inicio

        posicao = 0
        for numero, linha, valores, timestamp in registros:
            if timestamp is not None:
                leituras.append({**valores, "timestamp": timestamp.isoformat()})
                continue

            fracao = posicao / (total - 1) if total > 1 else 0
            timestamp_sintetico = inicio + duracao * fracao
            leituras.append({**valores, "timestamp": timestamp_sintetico.isoformat()})
            posicao += 1

    return leituras, ignoradas


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("entrada", help="arquivo .txt com o log bruto")
    parser.add_argument("saida", help="arquivo .json de saida")
    parser.add_argument(
        "--distribuir-entre",
        nargs=2,
        metavar=("INICIO", "FIM"),
        help="em vez de descartar linhas sem timestamp valido, distribui-as uniformemente entre INICIO e FIM (ISO 8601)",
    )
    args = parser.parse_args()

    distribuir_entre = None
    if args.distribuir_entre:
        inicio = parse_bound(args.distribuir_entre[0])
        fim = parse_bound(args.distribuir_entre[1])
        if fim <= inicio:
            print("Erro: FIM deve ser depois de INICIO.")
            sys.exit(1)
        distribuir_entre = (inicio, fim)

    with open(args.entrada, "r", encoding="utf-8") as f:
        linhas = f.readlines()

    leituras, ignoradas = converter(linhas, distribuir_entre=distribuir_entre)

    with open(args.saida, "w", encoding="utf-8") as f:
        json.dump({"leituras": leituras}, f, indent=2, ensure_ascii=False)

    print(f"Leituras convertidas: {len(leituras)}")
    print(f"Leituras ignoradas: {len(ignoradas)}")
    for numero, linha, motivo in ignoradas:
        print(f"  linha {numero}: {motivo} -> {linha}")
    print(f"Arquivo gerado: {args.saida}")


if __name__ == "__main__":
    main()
