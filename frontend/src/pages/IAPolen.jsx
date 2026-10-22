import { useState, useEffect, useCallback, useRef } from 'react';
import {
    Box, Grid, Card, CardContent, Typography, Chip, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, Paper, Skeleton, Alert,
    useTheme, Fade, Grow, IconButton, Tooltip, Button, Dialog,
    DialogTitle, DialogContent, DialogActions, TextField, Divider,
    CircularProgress, Tabs, Tab,
} from '@mui/material';
import {
    Biotech as BiotechIcon,
    Refresh as RefreshIcon,
    PlayArrow as TestIcon,
    Delete as DeleteIcon,
    ScatterPlot as ClusterIcon,
    Hub as KnnIcon,
    UploadFile as UploadFileIcon,
} from '@mui/icons-material';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
    ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
    getClassificacoes, getClassificacaoEstatisticas,
    classificarPolen, deleteClassificacao, getIAStatus, importarCsvPolen,
} from '../services/api';
import StatFavo from '../components/StatFavo';
import StatusBlock from '../components/StatusBlock';
import { tint } from '../theme';

// ── Paleta de cores para classes/clusters ─────────────────────────────────────
const CLASS_COLORS = [
    'var(--chart-amber)', '#2E7D32', '#1565C0', '#AD1457',
    '#6A1B9A', '#00838F', '#EF6C00', '#37474F',
];

const darkTooltipStyle = {
    backgroundColor: 'var(--chart-tooltip-bg)',
    border: '1px solid var(--chart-tooltip-border)',
    borderRadius: 8,
    color: 'var(--chart-text)',
};

// ── Formulário de teste manual ────────────────────────────────────────────────
const CHANNEL_LABELS = [
    { key: 'F1', label: 'F1 — Violeta ~415nm' },
    { key: 'F2', label: 'F2 — Azul ~445nm' },
    { key: 'F3', label: 'F3 — Ciano ~480nm' },
    { key: 'F4', label: 'F4 — Verde ~515nm' },
    { key: 'F5', label: 'F5 — Verde-Amarelo ~555nm' },
    { key: 'F6', label: 'F6 — Amarelo ~590nm' },
    { key: 'F7', label: 'F7 — Laranja ~630nm' },
    { key: 'F8', label: 'F8 — Vermelho ~680nm' },
    { key: 'NIR', label: 'NIR — Infravermelho ~910nm' },
    { key: 'CLEAR', label: 'CLEAR — Luminosidade' },
];

const initialChannels = Object.fromEntries(CHANNEL_LABELS.map(c => [c.key, '']));

function TestDialog({ open, onClose, onSuccess }) {
    const theme = useTheme();
    const [channels, setChannels] = useState(initialChannels);
    const [dispositivo, setDispositivo] = useState('');
    const [amostraId, setAmostraId] = useState('');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleClose = () => {
        setChannels(initialChannels);
        setDispositivo('');
        setAmostraId('');
        setResult(null);
        setError(null);
        onClose();
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError(null);
        setResult(null);
        try {
            const payload = {};
            for (const { key } of CHANNEL_LABELS) {
                const v = parseFloat(channels[key]);
                if (isNaN(v)) { setError(`Valor inválido no canal ${key}`); setLoading(false); return; }
                payload[key] = v;
            }
            if (dispositivo) payload.dispositivo_id = dispositivo;
            if (amostraId) payload.id = amostraId;
            const res = await classificarPolen(payload);
            setResult(res.data);
            onSuccess();
        } catch (err) {
            const data = err.response?.data;
            setError(data?.error || data?.detail || JSON.stringify(data) || 'Erro ao classificar. Verifique os logs do backend.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TestIcon color="primary" />
                Teste Manual de Classificação
            </DialogTitle>
            <DialogContent dividers>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                {result ? (
                    <Box>
                        <Alert severity="success" sx={{ mb: 2 }}>Classificação realizada e salva!</Alert>
                        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                            <Chip label={`ID do registro: ${result.id}`} size="small" />
                            <Chip
                                label={`ID do payload: ${result.payload_id || '— (não enviado)'}`}
                                size="small"
                                variant="outlined"
                            />
                        </Box>
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 6 }}>
                                <Card sx={{ border: `2px solid ${theme.palette.primary.main}` }}>
                                    <CardContent sx={{ textAlign: 'center', py: 2 }}>
                                        <Typography variant="overline" color="text.secondary">KNN — Espécie</Typography>
                                        <Typography variant="h4" color="primary.main" fontWeight={700}>
                                            TIPO {result.knn.classe}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid size={{ xs: 6 }}>
                                <Card sx={{ border: `2px solid ${theme.palette.secondary.main}` }}>
                                    <CardContent sx={{ textAlign: 'center', py: 2 }}>
                                        <Typography variant="overline" color="text.secondary">KMeans — Cluster</Typography>
                                        <Typography variant="h4" color="secondary.main" fontWeight={700}>
                                            {result.kmeans.label}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>
                        <Box sx={{ mt: 2 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                                Canais normalizados (L1):
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {Object.entries(result.canais_normalizados).map(([k, v]) => (
                                    <Chip key={k} label={`${k}: ${v.toFixed(4)}`} size="small" variant="outlined" />
                                ))}
                            </Box>
                        </Box>
                    </Box>
                ) : (
                    <Box>
                        <Grid container spacing={1.5}>
                            {CHANNEL_LABELS.map(({ key, label }) => (
                                <Grid key={key} size={{ xs: 6 }}>
                                    <TextField
                                        label={label}
                                        type="number"
                                        size="small"
                                        fullWidth
                                        value={channels[key]}
                                        onChange={e => setChannels(p => ({ ...p, [key]: e.target.value }))}
                                        inputProps={{ min: 0, step: 1 }}
                                    />
                                </Grid>
                            ))}
                        </Grid>
                        <Grid container spacing={1.5} sx={{ mt: 0.5 }}>
                            <Grid size={{ xs: 6 }}>
                                <TextField
                                    label="ID do Dispositivo (opcional)"
                                    size="small"
                                    fullWidth
                                    value={dispositivo}
                                    onChange={e => setDispositivo(e.target.value)}
                                />
                            </Grid>
                            <Grid size={{ xs: 6 }}>
                                <TextField
                                    label="ID da Amostra (opcional)"
                                    size="small"
                                    fullWidth
                                    value={amostraId}
                                    onChange={e => setAmostraId(e.target.value)}
                                    helperText='Enviado como "id" no payload'
                                />
                            </Grid>
                        </Grid>
                    </Box>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>Fechar</Button>
                {!result && (
                    <Button
                        variant="contained"
                        onClick={handleSubmit}
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={16} /> : <TestIcon />}
                    >
                        Classificar
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
}

// ── Upload de CSV (amostras gravadas localmente/offline) ──────────────────────
function UploadCsvDialog({ open, onClose, onSuccess }) {
    const fileInputRef = useRef(null);
    const [fileName, setFileName] = useState('');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleClose = () => {
        setFileName('');
        setResult(null);
        setError(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        onClose();
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        setFileName(file ? file.name : '');
    };

    const handleSubmit = async () => {
        const file = fileInputRef.current?.files?.[0];
        if (!file) { setError('Selecione um arquivo CSV.'); return; }

        setLoading(true);
        setError(null);
        setResult(null);
        try {
            const formData = new FormData();
            formData.append('arquivo_csv', file);
            const res = await importarCsvPolen(formData);
            setResult(res.data);
            onSuccess();
        } catch (err) {
            const data = err.response?.data;
            setError(data?.error || data?.detail || JSON.stringify(data) || 'Erro ao importar o CSV. Verifique os logs do backend.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <UploadFileIcon color="primary" />
                Importar CSV — Amostras Gravadas Localmente
            </DialogTitle>
            <DialogContent dividers>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                {result ? (
                    <Box>
                        <Alert severity={result.total_processado > 0 ? 'success' : 'warning'} sx={{ mb: 2 }}>
                            {result.total_processado} de {result.total_linhas} linha(s) importada(s) com sucesso.
                        </Alert>
                        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                            <Chip label={`Processadas: ${result.total_processado}`} color="success" size="small" />
                            <Chip label={`Ignoradas: ${result.total_ignorado}`} color={result.total_ignorado > 0 ? 'warning' : 'default'} size="small" />
                        </Box>
                        {result.ignoradas?.length > 0 && (
                            <Box>
                                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                                    Linhas ignoradas:
                                </Typography>
                                <Box sx={{ maxHeight: 180, overflowY: 'auto' }}>
                                    {result.ignoradas.map((item, i) => (
                                        <Typography key={i} variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                            Linha {item.linha}: {item.motivo}
                                        </Typography>
                                    ))}
                                </Box>
                            </Box>
                        )}
                    </Box>
                ) : (
                    <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Envie um CSV com as colunas <code>F1,F2,F3,F4,F5,F6,F7,F8,NIR,CLEAR</code> (obrigatórias)
                            e, opcionalmente, <code>DATA,ID,TIPO,ESPECIE,NOTAS</code>. A classificação (KNN/KMeans)
                            é calculada na importação; os registros ficam marcados como "Importado via CSV".
                        </Typography>
                        <Button
                            variant="outlined"
                            component="label"
                            startIcon={<UploadFileIcon />}
                            fullWidth
                        >
                            {fileName || 'Selecionar arquivo CSV'}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".csv,text/csv"
                                hidden
                                onChange={handleFileChange}
                            />
                        </Button>
                    </Box>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>Fechar</Button>
                {!result && (
                    <Button
                        variant="contained"
                        onClick={handleSubmit}
                        disabled={loading || !fileName}
                        startIcon={loading ? <CircularProgress size={16} /> : <UploadFileIcon />}
                    >
                        Importar
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function IAPolen() {
    const theme = useTheme();

    const [stats, setStats] = useState(null);
    const [classificacoes, setClassificacoes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [iaOnline, setIaOnline] = useState(null);
    const [testOpen, setTestOpen] = useState(false);
    const [uploadOpen, setUploadOpen] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [origemTab, setOrigemTab] = useState('todas');

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params = { limit: 20, ordering: '-timestamp' };
            if (origemTab !== 'todas') params.origem = origemTab;
            const [statusRes, statsRes, listRes] = await Promise.all([
                getIAStatus().catch(() => ({ data: { modelos_carregados: false } })),
                getClassificacaoEstatisticas(),
                getClassificacoes(params),
            ]);
            setIaOnline(statusRes.data.modelos_carregados);
            setStats(statsRes.data);
            const results = listRes.data.results ?? listRes.data;
            setClassificacoes(results);
            setHasMore(!!(listRes.data.next));
        } catch {
            // mantém estado anterior
        } finally {
            setLoading(false);
        }
    }, [origemTab]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleDelete = async (id) => {
        await deleteClassificacao(id);
        fetchData();
    };

    // ── dados para gráficos ───────────────────────────────────────────────
    const knnData = (stats?.distribuicao_knn ?? []).map(d => ({
        name: `Tipo ${d.knn_classe}`,
        total: d.total,
        fill: CLASS_COLORS[(d.knn_classe - 1) % CLASS_COLORS.length],
    }));

    const clusterData = (stats?.distribuicao_clusters ?? []).map(d => ({
        name: `Cluster ${d.kmeans_cluster}`,
        value: d.total,
        fill: CLASS_COLORS[d.kmeans_cluster % CLASS_COLORS.length],
    }));

    const tipoMaisComum = stats?.distribuicao_knn?.reduce((a, b) => a.total > b.total ? a : b, {});

    return (
        <Box sx={{ p: { xs: 2, md: 3 } }}>
            {/* ── Cabeçalho ───────────────────────────────────────────── */}
            <Fade in timeout={300}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <BiotechIcon sx={{ color: 'primary.main', fontSize: 32 }} />
                        <Box>
                            <Typography variant="h5" fontWeight={700}>IA — Análise de Pólen</Typography>
                            <Typography variant="body2" color="text.secondary">
                                Classificação espectral via sensor AS7341
                            </Typography>
                        </Box>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Tooltip title="Importar CSV de amostras gravadas localmente">
                            <Button
                                variant="outlined"
                                size="small"
                                startIcon={<UploadFileIcon />}
                                onClick={() => setUploadOpen(true)}
                            >
                                Importar CSV
                            </Button>
                        </Tooltip>
                        <Tooltip title="Testar manualmente">
                            <Button
                                variant="contained"
                                size="small"
                                startIcon={<TestIcon />}
                                onClick={() => setTestOpen(true)}
                            >
                                Testar
                            </Button>
                        </Tooltip>
                        <Tooltip title="Atualizar">
                            <IconButton onClick={fetchData} disabled={loading}>
                                <RefreshIcon />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>
            </Fade>

            {/* ── Status do sistema de IA ──────────────────────────────── */}
            {iaOnline !== null && (
                <Fade in timeout={400}>
                    <Box sx={{ mb: 3 }}>
                        <StatusBlock
                            status={iaOnline ? 'ok' : 'error'}
                            title={iaOnline ? 'Modelos prontos' : 'Modelos indisponíveis'}
                            description={
                                iaOnline
                                    ? 'O sistema está pronto para classificar novas amostras de pólen.'
                                    : 'Não foi possível carregar os modelos de IA. Classificações não vão funcionar até isso ser resolvido.'
                            }
                        />
                    </Box>
                </Fade>
            )}

            {/* ── Favo — os números que mais importam nesta tela ────────── */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 4 }}>
                    <StatFavo
                        label="Total de classificações"
                        value={loading ? <Skeleton width={40} /> : stats?.total ?? 0}
                        delay={0}
                    />
                </Grid>
                <Grid size={{ xs: 4 }}>
                    <StatFavo
                        label="Tipo mais frequente (KNN)"
                        value={loading ? <Skeleton width={40} /> : tipoMaisComum?.knn_classe ? `Tipo ${tipoMaisComum.knn_classe}` : '—'}
                        offset
                        delay={80}
                    />
                </Grid>
                <Grid size={{ xs: 4 }}>
                    <StatFavo
                        label="Clusters distintos"
                        value={loading ? <Skeleton width={40} /> : clusterData.length}
                        delay={160}
                    />
                </Grid>
            </Grid>

            {/* ── Gráficos ─────────────────────────────────────────────── */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                {/* Distribuição KNN */}
                <Grid size={{ xs: 12, md: 7 }}>
                    <Fade in timeout={700}>
                        <Card sx={{ height: '100%' }}>
                            <CardContent sx={{ p: 3 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                    <KnnIcon sx={{ color: 'primary.main' }} />
                                    <Typography variant="h6" fontWeight={600}>Distribuição por Espécie (KNN)</Typography>
                                </Box>
                                {loading ? (
                                    <Skeleton variant="rectangular" height={280} />
                                ) : knnData.length === 0 ? (
                                    <Box sx={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Typography color="text.secondary">Nenhuma classificação ainda</Typography>
                                    </Box>
                                ) : (
                                    <ResponsiveContainer width="100%" height={280}>
                                        <BarChart data={knnData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke={tint(theme.palette.divider, 0.3)} />
                                            <XAxis dataKey="name" tick={{ fontSize: 12, fill: theme.palette.text.secondary }} />
                                            <YAxis tick={{ fontSize: 12, fill: theme.palette.text.secondary }} allowDecimals={false} />
                                            <RechartsTooltip
                                                contentStyle={darkTooltipStyle}
                                                formatter={(v) => [v, 'Amostras']}
                                            />
                                            <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                                                {knnData.map((entry, i) => (
                                                    <Cell key={i} fill={entry.fill} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </CardContent>
                        </Card>
                    </Fade>
                </Grid>

                {/* Distribuição KMeans */}
                <Grid size={{ xs: 12, md: 5 }}>
                    <Fade in timeout={900}>
                        <Card sx={{ height: '100%' }}>
                            <CardContent sx={{ p: 3 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                    <ClusterIcon sx={{ color: 'var(--chart-orange)' }} />
                                    <Typography variant="h6" fontWeight={600}>Clusters KMeans</Typography>
                                </Box>
                                {loading ? (
                                    <Skeleton variant="rectangular" height={280} />
                                ) : clusterData.length === 0 ? (
                                    <Box sx={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Typography color="text.secondary">Nenhuma classificação ainda</Typography>
                                    </Box>
                                ) : (
                                    <ResponsiveContainer width="100%" height={280}>
                                        <PieChart>
                                            <Pie
                                                data={clusterData}
                                                cx="50%" cy="42%"
                                                innerRadius={70}
                                                outerRadius={110}
                                                paddingAngle={3}
                                                dataKey="value"
                                            >
                                                {clusterData.map((entry, i) => (
                                                    <Cell key={i} fill={entry.fill} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip contentStyle={darkTooltipStyle} formatter={(v) => [v, 'Amostras']} />
                                            <Legend formatter={(v, e) => (
                                                <span style={{ color: e.color, fontSize: 12, fontWeight: 600 }}>{v}</span>
                                            )} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                )}
                            </CardContent>
                        </Card>
                    </Fade>
                </Grid>
            </Grid>

            {/* ── Tabela de histórico ──────────────────────────────────── */}
            <Fade in timeout={1000}>
                <Card>
                    <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <BiotechIcon sx={{ color: 'primary.main' }} />
                            <Typography variant="h6" fontWeight={600}>Histórico de Classificações</Typography>
                        </Box>
                        <Tabs
                            value={origemTab}
                            onChange={(_, v) => setOrigemTab(v)}
                            sx={{ mb: 2, minHeight: 36, '& .MuiTab-root': { minHeight: 36, py: 0.5 } }}
                        >
                            <Tab value="todas" label="Todas" />
                            <Tab value="ao_vivo" label="Ao Vivo" />
                            <Tab value="csv" label="Importado (CSV)" />
                        </Tabs>
                        {loading ? (
                            [...Array(5)].map((_, i) => <Skeleton key={i} height={48} sx={{ mb: 0.5 }} />)
                        ) : classificacoes.length === 0 ? (
                            <Alert severity="info">
                                Nenhuma classificação registrada ainda. Use o endpoint <code>POST /api/ia/polen/classificar/</code> ou o botão "Testar" acima.
                            </Alert>
                        ) : (
                            <TableContainer component={Paper} variant="outlined">
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell><b>Data/Hora</b></TableCell>
                                            <TableCell align="center"><b>KNN Espécie</b></TableCell>
                                            <TableCell align="center"><b>KMeans Cluster</b></TableCell>
                                            <TableCell><b>Dispositivo</b></TableCell>
                                            <TableCell><b>ID do Payload</b></TableCell>
                                            <TableCell align="center"><b>Origem</b></TableCell>
                                            <TableCell align="center">F1</TableCell>
                                            <TableCell align="center">F4</TableCell>
                                            <TableCell align="center">NIR</TableCell>
                                            <TableCell align="center">CLEAR</TableCell>
                                            <TableCell />
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {classificacoes.map((c) => (
                                            <TableRow key={c.id} hover>
                                                <TableCell>
                                                    <Typography variant="body2">
                                                        {new Date(c.timestamp).toLocaleString('pt-BR')}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Chip
                                                        label={`TIPO ${c.knn_classe}`}
                                                        size="small"
                                                        sx={{
                                                            bgcolor: tint(CLASS_COLORS[(c.knn_classe - 1) % CLASS_COLORS.length], 0.15),
                                                            color: CLASS_COLORS[(c.knn_classe - 1) % CLASS_COLORS.length],
                                                            fontWeight: 700,
                                                            border: `1px solid ${tint(CLASS_COLORS[(c.knn_classe - 1) % CLASS_COLORS.length], 0.4)}`,
                                                        }}
                                                    />
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Chip
                                                        label={`C${c.kmeans_cluster}`}
                                                        size="small"
                                                        variant="outlined"
                                                        sx={{ color: CLASS_COLORS[c.kmeans_cluster % CLASS_COLORS.length], borderColor: CLASS_COLORS[c.kmeans_cluster % CLASS_COLORS.length] }}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {c.dispositivo_id || '—'}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {c.payload_id || '—'}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Chip
                                                        label={c.origem_display || (c.origem === 'csv' ? 'Importado (CSV)' : 'Ao Vivo')}
                                                        size="small"
                                                        variant={c.origem === 'csv' ? 'filled' : 'outlined'}
                                                        color={c.origem === 'csv' ? 'info' : 'default'}
                                                    />
                                                </TableCell>
                                                <TableCell align="center"><Typography variant="body2">{c.canal_f1}</Typography></TableCell>
                                                <TableCell align="center"><Typography variant="body2">{c.canal_f4}</Typography></TableCell>
                                                <TableCell align="center"><Typography variant="body2">{c.canal_nir}</Typography></TableCell>
                                                <TableCell align="center"><Typography variant="body2">{c.canal_clear}</Typography></TableCell>
                                                <TableCell align="right">
                                                    <Tooltip title="Excluir">
                                                        <IconButton size="small" color="error" onClick={() => handleDelete(c.id)}>
                                                            <DeleteIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </CardContent>
                </Card>
            </Fade>

            {/* ── Dialog de teste ──────────────────────────────────────── */}
            <TestDialog
                open={testOpen}
                onClose={() => setTestOpen(false)}
                onSuccess={fetchData}
            />
            <UploadCsvDialog
                open={uploadOpen}
                onClose={() => setUploadOpen(false)}
                onSuccess={fetchData}
            />
        </Box>
    );
}
