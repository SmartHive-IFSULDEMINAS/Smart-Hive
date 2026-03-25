import { useState, useEffect, useCallback } from 'react';
import {
    Box, Grid, Card, CardContent, Typography, Chip, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, Paper, Skeleton, Alert,
    useTheme, alpha, Fade, Grow, IconButton, Tooltip, Button, Dialog,
    DialogTitle, DialogContent, DialogActions, TextField, Divider,
    CircularProgress,
} from '@mui/material';
import {
    Biotech as BiotechIcon,
    Refresh as RefreshIcon,
    PlayArrow as TestIcon,
    Delete as DeleteIcon,
    CheckCircle as OkIcon,
    Error as ErrorIcon,
    QueryStats as StatsIcon,
    ScatterPlot as ClusterIcon,
    Hub as KnnIcon,
} from '@mui/icons-material';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
    ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
    getClassificacoes, getClassificacaoEstatisticas,
    classificarPolen, deleteClassificacao, getIAStatus,
} from '../services/api';

// ── Paleta de cores para classes/clusters ─────────────────────────────────────
const CLASS_COLORS = [
    '#F4A100', '#2E7D32', '#1565C0', '#AD1457',
    '#6A1B9A', '#00838F', '#EF6C00', '#37474F',
];

const darkTooltipStyle = {
    backgroundColor: 'rgba(30,30,30,0.95)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8,
    color: '#E8EAED',
};

// ── Componente de card de estatística ─────────────────────────────────────────
function StatCard({ title, value, icon, color, delay = 0 }) {
    const theme = useTheme();
    return (
        <Grow in timeout={400 + delay}>
            <Card sx={{
                height: '100%',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                    content: '""', position: 'absolute',
                    top: 0, left: 0, right: 0, height: '2px',
                    background: color, borderRadius: '12px 12px 0 0',
                },
            }}>
                <CardContent sx={{ p: 2.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                        <Typography variant="overline" sx={{ color: 'text.secondary', letterSpacing: '0.08em', lineHeight: 1.3 }}>
                            {title}
                        </Typography>
                        <Box sx={{
                            width: 34, height: 34, borderRadius: '9px',
                            backgroundColor: alpha(color, 0.15),
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <Box sx={{ color, display: 'flex', fontSize: 18 }}>{icon}</Box>
                        </Box>
                    </Box>
                    <Typography variant="h4" fontWeight={700} sx={{ color }}>
                        {value ?? '—'}
                    </Typography>
                </CardContent>
            </Card>
        </Grow>
    );
}

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
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleClose = () => {
        setChannels(initialChannels);
        setDispositivo('');
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
            const res = await classificarPolen(payload);
            setResult(res.data);
            onSuccess();
        } catch (err) {
            setError(err.response?.data?.error || 'Erro ao classificar');
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
                        <TextField
                            label="ID do Dispositivo (opcional)"
                            size="small"
                            fullWidth
                            sx={{ mt: 2 }}
                            value={dispositivo}
                            onChange={e => setDispositivo(e.target.value)}
                        />
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

// ── Página principal ──────────────────────────────────────────────────────────
export default function IAPolen() {
    const theme = useTheme();

    const [stats, setStats] = useState(null);
    const [classificacoes, setClassificacoes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [iaOnline, setIaOnline] = useState(null);
    const [testOpen, setTestOpen] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [statusRes, statsRes, listRes] = await Promise.all([
                getIAStatus().catch(() => ({ data: { modelos_carregados: false } })),
                getClassificacaoEstatisticas(),
                getClassificacoes({ limit: 20, ordering: '-timestamp' }),
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
    }, []);

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
                        {iaOnline !== null && (
                            <Chip
                                icon={iaOnline ? <OkIcon /> : <ErrorIcon />}
                                label={iaOnline ? 'Modelos prontos' : 'Modelos indisponíveis'}
                                color={iaOnline ? 'success' : 'error'}
                                size="small"
                            />
                        )}
                        <Tooltip title="Testar manualmente">
                            <Button
                                variant="contained"
                                size="small"
                                startIcon={<TestIcon />}
                                onClick={() => setTestOpen(true)}
                                disabled={!iaOnline}
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

            {/* ── Cards de resumo ──────────────────────────────────────── */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <StatCard
                        title="Total de Classificações"
                        value={loading ? <Skeleton width={60} /> : stats?.total ?? 0}
                        icon={<StatsIcon />}
                        color={theme.palette.primary.main}
                        delay={0}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <StatCard
                        title="Tipo Mais Frequente (KNN)"
                        value={loading ? <Skeleton width={60} /> : tipoMaisComum?.knn_classe ? `Tipo ${tipoMaisComum.knn_classe}` : '—'}
                        icon={<KnnIcon />}
                        color={theme.palette.secondary.main}
                        delay={100}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <StatCard
                        title="Clusters Distintos"
                        value={loading ? <Skeleton width={60} /> : clusterData.length}
                        icon={<ClusterIcon />}
                        color="#F57C00"
                        delay={200}
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
                                            <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.3)} />
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
                                    <ClusterIcon sx={{ color: '#F57C00' }} />
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
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <BiotechIcon sx={{ color: 'primary.main' }} />
                            <Typography variant="h6" fontWeight={600}>Histórico de Classificações</Typography>
                        </Box>
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
                                                            bgcolor: alpha(CLASS_COLORS[(c.knn_classe - 1) % CLASS_COLORS.length], 0.15),
                                                            color: CLASS_COLORS[(c.knn_classe - 1) % CLASS_COLORS.length],
                                                            fontWeight: 700,
                                                            border: `1px solid ${alpha(CLASS_COLORS[(c.knn_classe - 1) % CLASS_COLORS.length], 0.4)}`,
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
        </Box>
    );
}
