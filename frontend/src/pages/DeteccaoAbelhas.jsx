import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Box, Grid, Card, CardContent, Typography, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, Paper, Skeleton, Alert,
    useTheme, Fade, Grow, IconButton, Tooltip,
} from '@mui/material';
import {
    CameraAlt as CameraIcon,
    Refresh as RefreshIcon,
    Delete as DeleteIcon,
    QueryStats as StatsIcon,
    BugReport as BeeIcon,
    Spa as PollenIcon,
} from '@mui/icons-material';
import {
    BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
    ResponsiveContainer, Legend,
} from 'recharts';
import {
    getDeteccoesAbelha, getDeteccaoAbelhaEstatisticas, deleteDeteccaoAbelha,
} from '../services/api';
import { tint } from '../theme';

const darkTooltipStyle = {
    backgroundColor: 'var(--chart-tooltip-bg)',
    border: '1px solid var(--chart-tooltip-border)',
    borderRadius: 8,
    color: 'var(--chart-text)',
};

function StatCard({ title, value, icon, color, delay = 0 }) {
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
                            backgroundColor: tint(color, 0.15),
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

export default function DeteccaoAbelhas() {
    const theme = useTheme();

    const [stats, setStats] = useState(null);
    const [deteccoes, setDeteccoes] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [statsRes, listRes] = await Promise.all([
                getDeteccaoAbelhaEstatisticas(),
                getDeteccoesAbelha({ limit: 30, ordering: '-captured_at' }),
            ]);
            setStats(statsRes.data);
            const results = listRes.data.results ?? listRes.data;
            setDeteccoes(results);
        } catch {
            // mantém estado anterior
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleDelete = async (id) => {
        await deleteDeteccaoAbelha(id);
        fetchData();
    };

    // ── dados para gráficos ───────────────────────────────────────────────
    const porColmeiaData = (stats?.por_colmeia ?? []).map(d => ({
        name: d.colmeia__identificador,
        abelhas: d.total_abelhas || 0,
        polen: d.total_polen || 0,
    }));

    const historicoData = useMemo(() => (
        [...deteccoes]
            .sort((a, b) => new Date(a.captured_at) - new Date(b.captured_at))
            .map(d => ({
                horario: new Date(d.captured_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }),
                abelhas: d.bee_count,
                polen: d.pollen_count,
            }))
    ), [deteccoes]);

    return (
        <Box sx={{ p: { xs: 2, md: 3 } }}>
            {/* ── Cabeçalho ───────────────────────────────────────────── */}
            <Fade in timeout={300}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <CameraIcon sx={{ color: 'primary.main', fontSize: 32 }} />
                        <Box>
                            <Typography variant="h5" fontWeight={700}>Detecção de Abelhas</Typography>
                            <Typography variant="body2" color="text.secondary">
                                Contagem por visão computacional (câmera + YOLO) via pipeline SmartHive
                            </Typography>
                        </Box>
                    </Box>
                    <Tooltip title="Atualizar">
                        <IconButton onClick={fetchData} disabled={loading}>
                            <RefreshIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Fade>

            {/* ── Cards de resumo ──────────────────────────────────────── */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <StatCard
                        title="Total de Detecções"
                        value={loading ? <Skeleton width={60} /> : stats?.total_deteccoes ?? 0}
                        icon={<StatsIcon />}
                        color={theme.palette.primary.main}
                        delay={0}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <StatCard
                        title="Total de Abelhas"
                        value={loading ? <Skeleton width={60} /> : stats?.total_abelhas ?? 0}
                        icon={<BeeIcon />}
                        color={theme.palette.secondary.main}
                        delay={100}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <StatCard
                        title="Abelhas com Pólen"
                        value={loading ? <Skeleton width={60} /> : stats?.total_polen ?? 0}
                        icon={<PollenIcon />}
                        color="var(--chart-orange)"
                        delay={200}
                    />
                </Grid>
            </Grid>

            {/* ── Gráficos ─────────────────────────────────────────────── */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, md: 5 }}>
                    <Fade in timeout={700}>
                        <Card sx={{ height: '100%' }}>
                            <CardContent sx={{ p: 3 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                    <BeeIcon sx={{ color: 'primary.main' }} />
                                    <Typography variant="h6" fontWeight={600}>Abelhas por Colmeia</Typography>
                                </Box>
                                {loading ? (
                                    <Skeleton variant="rectangular" height={280} />
                                ) : porColmeiaData.length === 0 ? (
                                    <Box sx={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Typography color="text.secondary">Nenhuma detecção ainda</Typography>
                                    </Box>
                                ) : (
                                    <ResponsiveContainer width="100%" height={280}>
                                        <BarChart data={porColmeiaData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke={tint(theme.palette.divider, 0.3)} />
                                            <XAxis dataKey="name" tick={{ fontSize: 12, fill: theme.palette.text.secondary }} />
                                            <YAxis tick={{ fontSize: 12, fill: theme.palette.text.secondary }} allowDecimals={false} />
                                            <RechartsTooltip contentStyle={darkTooltipStyle} />
                                            <Legend />
                                            <Bar dataKey="abelhas" name="Abelhas" fill={theme.palette.primary.main} radius={[4, 4, 0, 0]} />
                                            <Bar dataKey="polen" name="Com Pólen" fill="var(--chart-orange)" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </CardContent>
                        </Card>
                    </Fade>
                </Grid>

                <Grid size={{ xs: 12, md: 7 }}>
                    <Fade in timeout={900}>
                        <Card sx={{ height: '100%' }}>
                            <CardContent sx={{ p: 3 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                    <StatsIcon sx={{ color: 'var(--chart-orange)' }} />
                                    <Typography variant="h6" fontWeight={600}>Histórico Recente</Typography>
                                </Box>
                                {loading ? (
                                    <Skeleton variant="rectangular" height={280} />
                                ) : historicoData.length === 0 ? (
                                    <Box sx={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Typography color="text.secondary">Nenhuma detecção ainda</Typography>
                                    </Box>
                                ) : (
                                    <ResponsiveContainer width="100%" height={280}>
                                        <LineChart data={historicoData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke={tint(theme.palette.divider, 0.3)} />
                                            <XAxis dataKey="horario" tick={{ fontSize: 11, fill: theme.palette.text.secondary }} />
                                            <YAxis tick={{ fontSize: 12, fill: theme.palette.text.secondary }} allowDecimals={false} />
                                            <RechartsTooltip contentStyle={darkTooltipStyle} />
                                            <Legend />
                                            <Line type="monotone" dataKey="abelhas" name="Abelhas" stroke={theme.palette.primary.main} strokeWidth={2} dot={false} />
                                            <Line type="monotone" dataKey="polen" name="Com Pólen" stroke="var(--chart-orange)" strokeWidth={2} dot={false} />
                                        </LineChart>
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
                            <CameraIcon sx={{ color: 'primary.main' }} />
                            <Typography variant="h6" fontWeight={600}>Detecções Recentes</Typography>
                        </Box>
                        {loading ? (
                            [...Array(5)].map((_, i) => <Skeleton key={i} height={48} sx={{ mb: 0.5 }} />)
                        ) : deteccoes.length === 0 ? (
                            <Alert severity="info">
                                Nenhuma detecção registrada ainda. O pipeline de visão computacional (repo <code>hive/</code>) envia
                                automaticamente pra <code>POST /api/iot/colmeia/deteccoes/</code> depois de processar cada imagem.
                            </Alert>
                        ) : (
                            <TableContainer component={Paper} variant="outlined">
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell><b>Capturada em</b></TableCell>
                                            <TableCell><b>Colmeia</b></TableCell>
                                            <TableCell><b>Apiário</b></TableCell>
                                            <TableCell align="center"><b>Abelhas</b></TableCell>
                                            <TableCell align="center"><b>Com Pólen</b></TableCell>
                                            <TableCell />
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {deteccoes.map((d) => (
                                            <TableRow key={d.id} hover>
                                                <TableCell>
                                                    <Typography variant="body2">
                                                        {new Date(d.captured_at).toLocaleString('pt-BR')}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>{d.colmeia_identificador}</TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {d.apiario_nome || '—'}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="center">{d.bee_count}</TableCell>
                                                <TableCell align="center">{d.pollen_count}</TableCell>
                                                <TableCell align="right">
                                                    <Tooltip title="Excluir">
                                                        <IconButton size="small" color="error" onClick={() => handleDelete(d.id)}>
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
        </Box>
    );
}
