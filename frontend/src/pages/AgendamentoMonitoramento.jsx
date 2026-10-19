import { useState, useEffect, useCallback } from 'react';
import {
    Box, Card, CardContent, Typography, Grid, TextField, FormControlLabel, Switch, Button,
    Skeleton, Alert, Snackbar, Chip, CircularProgress,
} from '@mui/material';
import { Schedule as ScheduleIcon } from '@mui/icons-material';
import StatusBlock from '../components/StatusBlock';
import { useAuth } from '../contexts/AuthContext';
import { getAgendamentoMonitoramento, updateAgendamentoMonitoramento } from '../services/api';

// Só exibe o estado; quem liga/desliga o monitoramento é o agendador do Pi
const STATUS_POLL_MS = 10000;

const formatarDataHora = (iso, fuso) => {
    if (!iso) return '—';
    const data = new Date(iso);
    const hoje = new Date();
    const mesmoDia = data.toLocaleDateString('pt-BR', { timeZone: fuso }) === hoje.toLocaleDateString('pt-BR', { timeZone: fuso });
    return data.toLocaleString('pt-BR', {
        timeZone: fuso,
        ...(mesmoDia ? {} : { day: '2-digit', month: '2-digit' }),
        hour: '2-digit',
        minute: '2-digit',
    }) + (mesmoDia ? ' (hoje)' : '');
};

// Mesma regra do backend: início anterior ao encerramento, no mesmo dia
const validar = ({ hora_inicio: inicio, hora_fim: fim }) => {
    const erros = {};
    if (!inicio) erros.hora_inicio = 'Informe o horário de início';
    if (!fim) erros.hora_fim = 'Informe o horário de encerramento';
    if (inicio && fim) {
        if (inicio === fim) erros.hora_fim = 'Deve ser diferente do horário de início';
        else if (inicio > fim) erros.hora_fim = 'Deve ser depois do início, no mesmo dia (não pode passar da meia-noite)';
    }
    return erros;
};

function descreverSituacao(dados) {
    const { situacao, pi, habilitado, hora_inicio: inicio, hora_fim: fim, proximo_evento: proximo, fuso_horario: fuso } = dados;
    const proximoTexto = proximo ? formatarDataHora(proximo.em, fuso) : null;
    switch (situacao) {
        case 'executando':
            return {
                status: 'ok',
                title: 'Monitoramento em execução',
                description: habilitado
                    ? `Será encerrado às ${fim}.`
                    : 'Agendamento desativado: o monitoramento roda continuamente.',
            };
        case 'aguardando_inicio':
            return { status: 'neutral', title: 'Aguardando o horário de início', description: `Inicia às ${inicio}.` };
        case 'encerrado_agendamento':
            return {
                status: 'neutral',
                title: 'Encerrado pelo agendamento',
                description: `Fora do horário de funcionamento. Próximo início: ${proximoTexto}.`
                    + (pi.mensagem ? ` Observação do último encerramento: ${pi.mensagem}.` : ''),
            };
        case 'encerrando':
            return {
                status: 'warning',
                title: 'Encerrando o monitoramento',
                description: 'Aguardando o processo concluir o trabalho em andamento.',
            };
        case 'falha_inicio':
            return { status: 'error', title: 'Falha ao iniciar o monitoramento', description: pi.mensagem || 'O Pi não informou o motivo.' };
        case 'falha_encerramento':
            return { status: 'error', title: 'Falha ao encerrar o monitoramento', description: pi.mensagem || 'O Pi não informou o motivo.' };
        case 'sem_comando':
            return {
                status: 'warning',
                title: 'Monitoramento não configurado no Raspberry Pi',
                description: pi.mensagem || 'Defina MONITORAMENTO_CMD no Pi.',
            };
        case 'pi_offline':
            return {
                status: 'warning',
                title: 'Raspberry Pi sem contato',
                description: `Último contato: ${formatarDataHora(pi.ultimo_relato, fuso)}. Enquanto estiver sem conexão, o Pi segue a última configuração que recebeu.`,
            };
        case 'pi_sem_relato':
            return {
                status: 'neutral',
                title: 'O agendador do Raspberry Pi ainda não se conectou',
                description: 'Instale ou atualize os agentes no Pi (camera-pi/install.sh) para o agendamento entrar em vigor.',
            };
        default:
            return {
                status: 'neutral',
                title: 'Monitoramento parado',
                description: pi.mensagem || (habilitado ? '' : 'O Pi deve iniciar o monitoramento contínuo em instantes.'),
            };
    }
}

function Info({ label, value }) {
    return (
        <Grid size={{ xs: 6, md: 3 }}>
            <Typography variant="caption" color="text.secondary">{label}</Typography>
            <Typography variant="body2" fontWeight={600}>{value}</Typography>
        </Grid>
    );
}

export default function AgendamentoMonitoramento() {
    const { canManageApiarios } = useAuth();
    const [dados, setDados] = useState(null);
    const [form, setForm] = useState({ habilitado: false, hora_inicio: '07:00', hora_fim: '15:00' });
    const [errosForm, setErrosForm] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [erro, setErro] = useState(null);
    const [semCamera, setSemCamera] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const preencherForm = (d) => setForm({ habilitado: d.habilitado, hora_inicio: d.hora_inicio, hora_fim: d.hora_fim });

    const carregar = useCallback(async ({ inicial = false } = {}) => {
        try {
            const res = await getAgendamentoMonitoramento();
            setDados(res.data);
            if (inicial) preencherForm(res.data);
            setErro(null);
            setSemCamera(false);
        } catch (err) {
            if (err.response?.status === 404) setSemCamera(true);
            else setErro('Não foi possível consultar o estado do monitoramento. Tentando de novo...');
        } finally {
            if (inicial) setLoading(false);
        }
    }, []);

    useEffect(() => {
        const primeira = setTimeout(() => carregar({ inicial: true }), 0);
        const id = setInterval(() => carregar(), STATUS_POLL_MS);
        return () => {
            clearTimeout(primeira);
            clearInterval(id);
        };
    }, [carregar]);

    const alterar = (campo, valor) => {
        const novo = { ...form, [campo]: valor };
        setForm(novo);
        if (Object.keys(errosForm).length) setErrosForm(validar(novo));
    };

    const salvar = async (e) => {
        e.preventDefault();
        const erros = validar(form);
        setErrosForm(erros);
        if (Object.keys(erros).length) {
            setSnackbar({ open: true, message: 'Corrija os horários antes de salvar.', severity: 'error' });
            return;
        }
        try {
            setSaving(true);
            const res = await updateAgendamentoMonitoramento(form);
            setDados(res.data);
            preencherForm(res.data);
            setSnackbar({
                open: true,
                message: 'Agendamento salvo. O Raspberry Pi aplica a alteração em alguns segundos.',
                severity: 'success',
            });
        } catch (err) {
            const resposta = err.response?.data;
            if (resposta && (resposta.hora_inicio || resposta.hora_fim)) {
                setErrosForm({ hora_inicio: resposta.hora_inicio?.[0], hora_fim: resposta.hora_fim?.[0] });
            }
            const mensagem = resposta?.error || resposta?.hora_fim?.[0] || resposta?.hora_inicio?.[0]
                || resposta?.non_field_errors?.[0] || 'Erro ao salvar o agendamento';
            setSnackbar({ open: true, message: mensagem, severity: 'error' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Box>
                <Skeleton variant="text" width={320} height={40} sx={{ mb: 2 }} />
                <Skeleton variant="rounded" height={80} sx={{ mb: 2, borderRadius: 2 }} />
                <Skeleton variant="rounded" height={260} sx={{ borderRadius: 2 }} />
            </Box>
        );
    }

    const cabecalho = (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
            <ScheduleIcon sx={{ color: 'primary.main', fontSize: 32 }} />
            <Box>
                <Typography variant="h5" fontWeight={700}>Agendamento do Monitoramento</Typography>
                <Typography variant="body2" color="text.secondary">
                    Horário diário em que o Raspberry Pi executa o monitoramento das abelhas
                </Typography>
            </Box>
        </Box>
    );

    if (semCamera) {
        return (
            <Box>
                {cabecalho}
                <Alert severity="info">
                    Nenhum Raspberry Pi cadastrado. Cadastre-o em Django Admin → Câmeras e configure o Pi com o token gerado.
                </Alert>
            </Box>
        );
    }

    if (!dados) {
        return (
            <Box>
                {cabecalho}
                <Alert severity="error">{erro || 'Erro ao carregar o agendamento.'}</Alert>
            </Box>
        );
    }

    const situacao = descreverSituacao(dados);
    const fuso = dados.fuso_horario;
    const alterado = form.habilitado !== dados.habilitado
        || form.hora_inicio !== dados.hora_inicio
        || form.hora_fim !== dados.hora_fim;
    const aguardandoPi = dados.pi.online && !dados.pi.configuracao_aplicada;

    return (
        <Box>
            {cabecalho}

            {erro && <Alert severity="warning" sx={{ mb: 2 }}>{erro}</Alert>}

            <Box sx={{ mb: 2.5 }}>
                <StatusBlock
                    status={situacao.status}
                    title={situacao.title}
                    description={situacao.description}
                    extra={(
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                            {dados.situacao === 'encerrando' && <CircularProgress size={18} />}
                            <Chip
                                size="small"
                                label={dados.pi.online ? 'Pi online' : 'Pi offline'}
                                color={dados.pi.online ? 'success' : 'default'}
                                variant={dados.pi.online ? 'filled' : 'outlined'}
                            />
                        </Box>
                    )}
                />
            </Box>

            {aguardandoPi && (
                <Alert severity="info" sx={{ mb: 2.5 }}>
                    Aguardando o Raspberry Pi aplicar a última alteração (normalmente leva até 10 segundos).
                </Alert>
            )}

            <Card sx={{ mb: 2.5 }}>
                <CardContent>
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>Situação atual</Typography>
                    <Grid container spacing={2} sx={{ mt: 0.5 }}>
                        <Info
                            label="Horário configurado"
                            value={dados.habilitado ? `${dados.hora_inicio} às ${dados.hora_fim}, todos os dias` : 'Desativado (contínuo)'}
                        />
                        <Info
                            label={dados.proximo_evento?.tipo === 'encerramento' ? 'Próximo encerramento' : 'Próximo início'}
                            value={dados.proximo_evento ? formatarDataHora(dados.proximo_evento.em, fuso) : '—'}
                        />
                        <Info label="Último início" value={formatarDataHora(dados.pi.ultimo_inicio, fuso)} />
                        <Info label="Último encerramento" value={formatarDataHora(dados.pi.ultimo_encerramento, fuso)} />
                        <Info label="Último contato do Pi" value={formatarDataHora(dados.pi.ultimo_relato, fuso)} />
                        <Info label="Fuso horário" value={fuso} />
                        {dados.configurado_em && (
                            <Info
                                label="Alterado por"
                                value={`${dados.configurado_por ?? '—'} em ${formatarDataHora(dados.configurado_em, fuso)}`}
                            />
                        )}
                    </Grid>
                </CardContent>
            </Card>

            <form onSubmit={salvar} noValidate>
                <Card>
                    <CardContent>
                        <Typography variant="subtitle1" fontWeight={600} gutterBottom>Horário de funcionamento</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Com o agendamento ativo, o monitoramento roda todos os dias a partir do horário de início e
                            é encerrado com segurança no horário de encerramento. Desativado, roda continuamente.
                        </Typography>

                        {!canManageApiarios && (
                            <Alert severity="info" sx={{ mb: 2 }}>
                                Apenas dono ou gestor podem alterar o agendamento.
                            </Alert>
                        )}

                        <Grid container spacing={2}>
                            <Grid size={12}>
                                <FormControlLabel
                                    control={(
                                        <Switch
                                            checked={form.habilitado}
                                            onChange={(e) => alterar('habilitado', e.target.checked)}
                                            disabled={!canManageApiarios}
                                        />
                                    )}
                                    label={form.habilitado ? 'Agendamento ativo' : 'Agendamento desativado (monitoramento contínuo)'}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                <TextField
                                    fullWidth size="small" type="time" label="Início"
                                    value={form.hora_inicio}
                                    onChange={(e) => alterar('hora_inicio', e.target.value)}
                                    error={Boolean(errosForm.hora_inicio)}
                                    helperText={errosForm.hora_inicio || ' '}
                                    disabled={!canManageApiarios}
                                    required
                                    slotProps={{ inputLabel: { shrink: true }, htmlInput: { step: 60 } }}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                <TextField
                                    fullWidth size="small" type="time" label="Encerramento"
                                    value={form.hora_fim}
                                    onChange={(e) => alterar('hora_fim', e.target.value)}
                                    error={Boolean(errosForm.hora_fim)}
                                    helperText={errosForm.hora_fim || ' '}
                                    disabled={!canManageApiarios}
                                    required
                                    slotProps={{ inputLabel: { shrink: true }, htmlInput: { step: 60 } }}
                                />
                            </Grid>
                        </Grid>

                        {canManageApiarios && (
                            <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                                <Button type="submit" variant="contained" disabled={saving || !alterado}>
                                    {saving ? 'Salvando...' : 'Salvar'}
                                </Button>
                                <Button
                                    variant="text"
                                    disabled={saving || !alterado}
                                    onClick={() => { preencherForm(dados); setErrosForm({}); }}
                                >
                                    Desfazer alterações
                                </Button>
                            </Box>
                        )}
                    </CardContent>
                </Card>
            </form>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={5000}
                onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity={snackbar.severity} variant="filled" onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
