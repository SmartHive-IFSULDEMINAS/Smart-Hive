from datetime import timedelta

from django.contrib.auth import get_user_model
from django.db.models import Q
from django.utils import timezone

from .models import AlertaRuidoConfig, LeituraSensor, Notificacao, ProducaoMel

User = get_user_model()


def _usuarios_alerta_ativos():
    return User.objects.filter(
        is_active=True,
        ativo=True,
    ).filter(
        Q(role__in=['dono', 'gestor']) | Q(is_superuser=True)
    ).distinct()


def _prioridade_por_desvio(desvio_percentual):
    if desvio_percentual >= 60:
        return 'critica'
    if desvio_percentual >= 35:
        return 'alta'
    return 'media'


def _processar_alerta_media(
    *,
    usuario,
    config,
    colmeia,
    apiario,
    tipo_notificacao,
    titulo,
    label,
    unidade,
    valor_atual,
    valores_anteriores,
    percentual_limite,
):
    if valor_atual is None:
        return

    janela = config.janela_media
    if len(valores_anteriores) < janela:
        return

    media = sum(valores_anteriores) / janela
    if media <= 0:
        return

    desvio_percentual = abs((valor_atual - media) / media) * 100
    if desvio_percentual < percentual_limite:
        return

    inicio_cooldown = timezone.now() - timedelta(minutes=config.cooldown_minutos)
    alerta_recente = Notificacao.objects.filter(
        usuario=usuario,
        colmeia=colmeia,
        tipo=tipo_notificacao,
        created_at__gte=inicio_cooldown,
    ).exists()

    if alerta_recente:
        return

    direcao = 'acima' if valor_atual > media else 'abaixo'
    prioridade = _prioridade_por_desvio(desvio_percentual)

    Notificacao.objects.create(
        titulo=f'{titulo} na colmeia {colmeia.identificador}',
        mensagem=(
            f'{label} atual: {valor_atual:.1f} {unidade}. '
            f'Média das últimas {janela} leituras: {media:.1f} {unidade} '
            f'({desvio_percentual:.1f}% {direcao} da média).'
        ),
        tipo=tipo_notificacao,
        prioridade=prioridade,
        usuario=usuario,
        colmeia=colmeia,
        apiario=apiario,
    )


def gerar_alertas_sensores(colmeia, leitura):
    metricas = [
        {
            'field': 'nivel_ruido',
            'flag_field': 'ativo',
            'percent_field': 'percentual_desvio',
            'tipo': 'alerta_ruido',
            'titulo': 'Ruído anormal',
            'label': 'Ruído',
            'unidade': 'dB',
        },
        {
            'field': 'temperatura',
            'flag_field': 'alertar_temperatura',
            'percent_field': 'desvio_temperatura',
            'tipo': 'alerta_temperatura',
            'titulo': 'Temperatura anormal',
            'label': 'Temperatura',
            'unidade': '°C',
        },
        {
            'field': 'luminosidade',
            'flag_field': 'alertar_luminosidade',
            'percent_field': 'desvio_luminosidade',
            'tipo': 'alerta_luminosidade',
            'titulo': 'Luminosidade anormal',
            'label': 'Luminosidade',
            'unidade': 'lux',
        },
        {
            'field': 'umidade',
            'flag_field': 'alertar_umidade',
            'percent_field': 'desvio_umidade',
            'tipo': 'alerta_umidade',
            'titulo': 'Umidade anormal',
            'label': 'Umidade',
            'unidade': '%',
        },
        {
            'field': 'pressao',
            'flag_field': 'alertar_pressao',
            'percent_field': 'desvio_pressao',
            'tipo': 'alerta_pressao',
            'titulo': 'Pressão anormal',
            'label': 'Pressão',
            'unidade': 'hPa',
        },
        {
            'field': 'peso',
            'flag_field': 'alertar_peso',
            'percent_field': 'desvio_peso',
            'tipo': 'alerta_peso',
            'titulo': 'Peso anormal',
            'label': 'Peso',
            'unidade': 'kg',
        },
    ]

    usuarios = _usuarios_alerta_ativos()
    if not usuarios.exists():
        return

    for usuario in usuarios:
        config, _ = AlertaRuidoConfig.objects.get_or_create(usuario=usuario)

        for metrica in metricas:
            if not getattr(config, metrica['flag_field'], False):
                continue

            valor_atual = getattr(leitura, metrica['field'])
            if valor_atual is None:
                continue

            leituras_anteriores = list(
                LeituraSensor.objects.filter(
                    colmeia=colmeia,
                    **{f"{metrica['field']}__isnull": False},
                )
                .exclude(id=leitura.id)
                .order_by('-timestamp')[: config.janela_media]
            )

            valores_anteriores = [
                float(getattr(item, metrica['field']))
                for item in leituras_anteriores
                if getattr(item, metrica['field']) is not None
            ]

            _processar_alerta_media(
                usuario=usuario,
                config=config,
                colmeia=colmeia,
                apiario=colmeia.apiario,
                tipo_notificacao=metrica['tipo'],
                titulo=metrica['titulo'],
                label=metrica['label'],
                unidade=metrica['unidade'],
                valor_atual=float(valor_atual),
                valores_anteriores=valores_anteriores,
                percentual_limite=float(getattr(config, metrica['percent_field'], 25)),
            )


def gerar_alerta_producao(producao):
    usuarios = _usuarios_alerta_ativos()
    if not usuarios.exists():
        return

    colmeia = producao.colmeia
    apiario = colmeia.apiario
    valor_atual = float(producao.quantidade_kg)

    for usuario in usuarios:
        config, _ = AlertaRuidoConfig.objects.get_or_create(usuario=usuario)

        if not config.alertar_producao:
            continue

        producoes_anteriores = list(
            ProducaoMel.objects.filter(colmeia=colmeia)
            .exclude(id=producao.id)
            .order_by('-data_colheita', '-created_at')[: config.janela_media]
        )

        valores_anteriores = [float(item.quantidade_kg) for item in producoes_anteriores]

        _processar_alerta_media(
            usuario=usuario,
            config=config,
            colmeia=colmeia,
            apiario=apiario,
            tipo_notificacao='alerta_producao',
            titulo='Produção fora do padrão',
            label='Produção',
            unidade='kg',
            valor_atual=valor_atual,
            valores_anteriores=valores_anteriores,
            percentual_limite=float(config.desvio_producao),
        )
