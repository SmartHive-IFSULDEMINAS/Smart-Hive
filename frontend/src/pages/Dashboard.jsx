import React, { useState, useEffect } from 'react';
import {
    Box,
    Grid,
    Card,
    CardContent,
    Typography,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Skeleton,
    Alert,
    useTheme,
    alpha,
    Fade,
    Grow,
    IconButton,
    Tooltip,
    Divider,
    Tabs,
    Tab,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from '@mui/material';
import {
    Hive as HiveIcon,
    Place as PlaceIcon,
    LocalFlorist as HoneyIcon,
    Healing as TreatmentIcon,
    Warning as WarningIcon,
    Search as InspectionIcon,
    TrendingUp as TrendingUpIcon,
    TrendingDown as TrendingDownIcon,
    Refresh as RefreshIcon,
    CalendarToday as CalendarIcon,
    Assessment as AssessmentIcon,
    Sensors as SensorsIcon,
    Thermostat as ThermostatIcon,
    VolumeUp as VolumeUpIcon,
    LightMode as LightModeIcon,
    AccessTime as AccessTimeIcon,
    WaterDrop as WaterDropIcon,
    Compress as CompressIcon,
    Scale as ScaleIcon,
} from '@mui/icons-material';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    Legend,
    LineChart,
    Line,
} from 'recharts';
import { getDashboard, getDashboardComparativo, getDashboardPrevisao } from '../services/api';

// ─── StatCard — Enterprise Dark design ────────────────────────────────────────
const StatCard = ({ title, value, subtitle, icon, color, trend, delay = 0 }) => {
    const theme = useTheme();

    return (
        <Grow in timeout={500 + delay}>
            <Card
                sx={{
                    height: '100%',
                    position: 'relative',
                    overflow: 'hidden',
                    // Accent bar on top
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0, left: 0, right: 0,
                        height: '2px',
                        background: color,
                        borderRadius: '12px 12px 0 0',
                    },
                }}
            >
                <CardContent sx={{ p: 2.5 }}>
                    {/* Top row: label + icon badge */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Typography
                            variant="overline"
                            sx={{ color: 'text.secondary', letterSpacing: '0.08em', lineHeight: 1.3 }}
                        >
                            {title}
                        </Typography>
                        <Box
                            sx={{
                                width: 34,
                                height: 34,
                                borderRadius: '9px',
                                backgroundColor: alpha(color, 0.15),
                                border: `1px solid ${alpha(color, 0.25)}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                            }}
                        >
                            {React.cloneElement(icon, { sx: { fontSize: 18, color } })}
                        </Box>
                    </Box>

                    {/* Value */}
                    <Typography
                        variant="h3"
                        sx={{
                            fontWeight: 800,
                            fontSize: { xs: '1.65rem', sm: '1.9rem' },
                            color: 'text.primary',
                            lineHeight: 1.1,
                            mb: 1.5,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                        }}
                    >
                        {value}
                    </Typography>

                    {/* Bottom row: subtitle + trend */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                        {subtitle && (
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.78rem' }}>
                                {subtitle}
                            </Typography>
                        )}
                        {trend && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, flexShrink: 0 }}>
                                <TrendingUpIcon sx={{ fontSize: 14, color: theme.palette.success.main }} />
                                <Typography
                                    variant="caption"
                                    sx={{ color: theme.palette.success.main, fontWeight: 600, fontSize: '0.7rem' }}
                                >
                                    Atualizado
                                </Typography>
                            </Box>
                        )}
                    </Box>
                </CardContent>
            </Card>
        </Grow>
    );
};

// ─── Section header ───────────────────────────────────────────────────────────
const SectionHeader = ({ title, icon, badge }) => (
    <Box sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        mb: 2.5,
        pb: 1.5,
        borderBottom: '1px solid',
        borderColor: 'divider',
    }}>
        {React.cloneElement(icon, { sx: { color: 'primary.main', fontSize: 20 } })}
        <Typography variant="subtitle1" fontWeight={700} sx={{ flex: 1, letterSpacing: '-0.01em' }}>
            {title}
        </Typography>
        {badge}
    </Box>
);

// ─── Dark tooltip style for Recharts ─────────────────────────────────────────
const darkTooltipStyle = {
    background: '#1A1D27',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 10,
    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    color: '#E8EAED',
    fontSize: 12,
};

const COLORS = ['#4CAF50', '#F4A100', '#F44336', '#9E9E9E', '#2196F3'];

// ─── Dashboard skeleton ───────────────────────────────────────────────────────
const DashboardSkeleton = () => (
    <Box>
        <Skeleton variant="text" width={320} height={44} sx={{ mb: 0.5 }} />
        <Skeleton variant="text" width={240} height={22} sx={{ mb: 3 }} />
        <Grid container spacing={3} sx={{ mb: 3 }}>
            {[1, 2, 3, 4].map(i => (
                <Grid size={{ xs: 12, sm: 6, md: 3 }} key={i}>
                    <Skeleton variant="rounded" height={120} sx={{ borderRadius: 2 }} />
                </Grid>
            ))}
        </Grid>
        <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
                <Skeleton variant="rounded" height={480} sx={{ borderRadius: 2 }} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
                <Skeleton variant="rounded" height={480} sx={{ borderRadius: 2 }} />
            </Grid>
        </Grid>
    </Box>
);

// ─── Main component ───────────────────────────────────────────────────────────
export default function Dashboard() {
    const theme = useTheme();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('geral');
    const [comparativoPeriodo, setComparativoPeriodo] = useState(30);
    const [previsaoBaseDias, setPrevisaoBaseDias] = useState(90);
    const [comparativoData, setComparativoData] = useState(null);
    const [previsaoData, setPrevisaoData] = useState(null);
    const [loadingComparativo, setLoadingComparativo] = useState(false);
    const [loadingPrevisao, setLoadingPrevisao] = useState(false);

    useEffect(() => {
        fetchDashboard();
    }, []);

    useEffect(() => {
        fetchComparativo(comparativoPeriodo);
    }, [comparativoPeriodo]);

    useEffect(() => {
        fetchPrevisao(previsaoBaseDias);
    }, [previsaoBaseDias]);

    const fetchDashboard = async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }
            const response = await getDashboard();
            setData(response.data);
            setError(null);
        } catch (err) {
            setError('Erro ao carregar dados do dashboard');
            console.error(err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const fetchComparativo = async (periodoDias = 30) => {
        try {
            setLoadingComparativo(true);
            const response = await getDashboardComparativo({ periodo_dias: periodoDias });
            setComparativoData(response.data);
        } catch (err) {
            console.error('Erro ao carregar comparativo:', err);
        } finally {
            setLoadingComparativo(false);
        }
    };

    const fetchPrevisao = async (baseDias = 90) => {
        try {
            setLoadingPrevisao(true);
            const response = await getDashboardPrevisao({ base_dias: baseDias });
            setPrevisaoData(response.data);
        } catch (err) {
            console.error('Erro ao carregar previsão:', err);
        } finally {
            setLoadingPrevisao(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await Promise.all([
            fetchDashboard(true),
            fetchComparativo(comparativoPeriodo),
            fetchPrevisao(previsaoBaseDias),
        ]);
        setRefreshing(false);
    };

    if (loading) return <DashboardSkeleton />;

    if (error) {
        return (
            <Alert
                severity="error"
                sx={{ mb: 2, borderRadius: 2 }}
                action={
                    <IconButton onClick={() => fetchDashboard()} size="small">
                        <RefreshIcon />
                    </IconButton>
                }
            >
                {error}
            </Alert>
        );
    }

    const statusData = data?.colmeias_por_status?.map(item => ({
        name: item.status === 'ativa' ? 'Ativas' :
            item.status === 'inativa' ? 'Inativas' :
                item.status === 'quarentena' ? 'Quarentena' : 'Mortas',
        value: item.total,
        color: item.status === 'ativa' ? '#4CAF50' :
            item.status === 'inativa' ? '#9E9E9E' :
                item.status === 'quarentena' ? '#F4A100' : '#F44336',
    })) || [];

    const hasSensorValue = (value) => value !== null && value !== undefined && value !== '';

    const getTemperatureColor = (value) => {
        if (value > 35) return '#EF9A9A';
        if (value < 20) return '#64B5F6';
        return '#81C784';
    };

    return (
        <Box sx={{ position: 'relative' }}>
            {/* ─── Header ──────────────────────────────────────────────────── */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3.5, flexWrap: 'wrap', gap: 2 }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5 }}>
                        Visão Geral do Apiário
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <CalendarIcon sx={{ fontSize: 15 }} />
                        {new Date().toLocaleDateString('pt-BR', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                        })}
                    </Typography>
                </Box>
                <Tooltip title="Atualizar dados">
                    <IconButton
                        onClick={handleRefresh}
                        disabled={refreshing}
                        size="small"
                        sx={{
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                            '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.18) },
                        }}
                    >
                        <RefreshIcon
                            fontSize="small"
                            sx={{
                                color: 'primary.main',
                                animation: refreshing ? 'spin 1s linear infinite' : 'none',
                                '@keyframes spin': {
                                    '0%': { transform: 'rotate(0deg)' },
                                    '100%': { transform: 'rotate(360deg)' },
                                },
                            }}
                        />
                    </IconButton>
                </Tooltip>
            </Box>

            {/* ─── KPI Cards ────────────────────────────────────────────────── */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <StatCard
                        title="Apiários"
                        value={data?.total_apiarios || 0}
                        subtitle={`${data?.apiarios_ativos || 0} ativos`}
                        icon={<PlaceIcon />}
                        color={theme.palette.secondary.main}
                        trend
                        delay={0}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <StatCard
                        title="Colmeias"
                        value={data?.total_colmeias || 0}
                        subtitle={`${data?.colmeias_ativas || 0} ativas`}
                        icon={<HiveIcon />}
                        color={theme.palette.primary.main}
                        trend
                        delay={100}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <StatCard
                        title="Produção Anual"
                        value={`${parseFloat(data?.producao_ano_kg || 0).toFixed(1)} kg`}
                        subtitle={`${parseFloat(data?.producao_mes_kg || 0).toFixed(1)} kg este mês`}
                        icon={<HoneyIcon />}
                        color="#FF9800"
                        trend
                        delay={200}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <StatCard
                        title="Atenção"
                        value={data?.tratamentos_em_andamento || 0}
                        subtitle={`${data?.colmeias_em_quarentena || 0} em quarentena`}
                        icon={<WarningIcon />}
                        color={theme.palette.error.main}
                        delay={300}
                    />
                </Grid>
            </Grid>

            <Card sx={{ mb: 3 }}>
                <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                    <Tabs
                        value={activeTab}
                        onChange={(_, value) => setActiveTab(value)}
                        variant="scrollable"
                        scrollButtons="auto"
                    >
                        <Tab value="geral" label="Visão Geral" />
                        <Tab value="comparativo" label="Comparativo entre Apiários" />
                        <Tab value="previsao" label="Previsão de Produção" />
                    </Tabs>
                </CardContent>
            </Card>

            {activeTab === 'geral' && (
                <>
            {/* ─── Charts ───────────────────────────────────────────────────── */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Fade in timeout={900}>
                        <Card>
                            <CardContent sx={{ p: 3 }}>
                                <SectionHeader
                                    title="Evolução da Produção"
                                    icon={<AssessmentIcon />}
                                    badge={<Chip label="12 meses" size="small" variant="outlined" />}
                                />
                                <Box sx={{ height: 420 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={data?.producao_por_mes || []}>
                                            <defs>
                                                <linearGradient id="colorProducao" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%"  stopColor={theme.palette.primary.main} stopOpacity={0.35} />
                                                    <stop offset="50%" stopColor={theme.palette.primary.main} stopOpacity={0.12} />
                                                    <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid
                                                stroke="rgba(255,255,255,0.05)"
                                                strokeDasharray="0"
                                                vertical={false}
                                            />
                                            <XAxis
                                                dataKey="mes"
                                                tick={{ fontSize: 11, fill: theme.palette.text.secondary }}
                                                stroke="rgba(255,255,255,0.08)"
                                            />
                                            <YAxis
                                                tick={{ fontSize: 11, fill: theme.palette.text.secondary }}
                                                stroke="rgba(255,255,255,0.08)"
                                                unit=" kg"
                                            />
                                            <RechartsTooltip
                                                contentStyle={darkTooltipStyle}
                                                labelStyle={{ color: '#E8EAED', fontWeight: 600 }}
                                                itemStyle={{ color: 'rgba(232,234,237,0.75)' }}
                                                formatter={(value) => [`${parseFloat(value).toFixed(1)} kg`, 'Produção']}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="producao_kg"
                                                stroke={theme.palette.primary.main}
                                                strokeWidth={2}
                                                fillOpacity={1}
                                                fill="url(#colorProducao)"
                                                dot={{ fill: theme.palette.primary.main, r: 3, strokeWidth: 0 }}
                                                activeDot={{ r: 5, strokeWidth: 0 }}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </Box>
                            </CardContent>
                        </Card>
                    </Fade>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                    <Fade in timeout={1000}>
                        <Card sx={{ height: '100%' }}>
                            <CardContent sx={{ p: 3 }}>
                                <SectionHeader
                                    title="Status das Colmeias"
                                    icon={<HiveIcon />}
                                />
                                <Box sx={{ height: 420, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                    {statusData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={statusData}
                                                    cx="50%"
                                                    cy="42%"
                                                    innerRadius={90}
                                                    outerRadius={155}
                                                    paddingAngle={3}
                                                    dataKey="value"
                                                >
                                                    {statusData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <RechartsTooltip
                                                    contentStyle={darkTooltipStyle}
                                                    labelStyle={{ color: '#E8EAED', fontWeight: 600 }}
                                                    itemStyle={{ color: 'rgba(232,234,237,0.75)' }}
                                                    formatter={(value) => [value, 'Colmeias']}
                                                />
                                                <Legend
                                                    formatter={(value, entry) => (
                                                        <span style={{ color: entry.color, fontWeight: 600, fontSize: 13 }}>
                                                            {value}
                                                        </span>
                                                    )}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <Typography color="text.secondary">Nenhuma colmeia cadastrada</Typography>
                                    )}
                                </Box>
                            </CardContent>
                        </Card>
                    </Fade>
                </Grid>
            </Grid>

            {/* ─── Tables ───────────────────────────────────────────────────── */}
            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Fade in timeout={1100}>
                        <Card sx={{ height: '100%' }}>
                            <CardContent sx={{ p: 3 }}>
                                <SectionHeader
                                    title="Próximas Inspeções"
                                    icon={<InspectionIcon />}
                                />
                                {data?.proximas_inspecoes?.length > 0 ? (
                                    <TableContainer>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>Colmeia</TableCell>
                                                    <TableCell>Apiário</TableCell>
                                                    <TableCell>Condição</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {data.proximas_inspecoes.map((insp) => (
                                                    <TableRow key={insp.id}>
                                                        <TableCell>
                                                            <Typography variant="body2" fontWeight={600}>
                                                                {insp.colmeia_identificador}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Typography variant="body2" color="text.secondary">
                                                                {insp.apiario_nome}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Chip
                                                                label={insp.condicao_geral_display}
                                                                size="small"
                                                                color={
                                                                    insp.condicao_geral === 'excelente' || insp.condicao_geral === 'boa' ? 'success' :
                                                                        insp.condicao_geral === 'regular' ? 'warning' : 'error'
                                                                }
                                                            />
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                ) : (
                                    <Box sx={{ py: 5, textAlign: 'center' }}>
                                        <Typography variant="body2" color="text.secondary">
                                            Nenhuma inspeção agendada
                                        </Typography>
                                    </Box>
                                )}
                            </CardContent>
                        </Card>
                    </Fade>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                    <Fade in timeout={1200}>
                        <Card sx={{ height: '100%' }}>
                            <CardContent sx={{ p: 3 }}>
                                <SectionHeader
                                    title="Últimas Produções"
                                    icon={<HoneyIcon />}
                                />
                                {data?.ultimas_producoes?.length > 0 ? (
                                    <TableContainer>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>Colmeia</TableCell>
                                                    <TableCell>Apiário</TableCell>
                                                    <TableCell align="right">Quantidade</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {data.ultimas_producoes.map((prod) => (
                                                    <TableRow key={prod.id}>
                                                        <TableCell>
                                                            <Typography variant="body2" fontWeight={600}>
                                                                {prod.colmeia_identificador}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Typography variant="body2" color="text.secondary">
                                                                {prod.apiario_nome}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell align="right">
                                                            <Chip
                                                                label={`${prod.quantidade_kg} kg`}
                                                                size="small"
                                                                color="warning"
                                                            />
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                ) : (
                                    <Box sx={{ py: 5, textAlign: 'center' }}>
                                        <Typography variant="body2" color="text.secondary">
                                            Nenhuma produção registrada
                                        </Typography>
                                    </Box>
                                )}
                            </CardContent>
                        </Card>
                    </Fade>
                </Grid>

                {/* Bar chart — distribution by apiary */}
                <Grid size={12}>
                    <Fade in timeout={1300}>
                        <Card>
                            <CardContent sx={{ p: 3 }}>
                                <SectionHeader
                                    title="Distribuição de Colmeias por Apiário"
                                    icon={<PlaceIcon />}
                                />
                                <Box sx={{ height: 300 }}>
                                    {data?.colmeias_por_apiario?.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={data.colmeias_por_apiario} layout="vertical">
                                                <CartesianGrid
                                                    stroke="rgba(255,255,255,0.05)"
                                                    strokeDasharray="0"
                                                    horizontal={false}
                                                />
                                                <XAxis
                                                    type="number"
                                                    tick={{ fontSize: 11, fill: theme.palette.text.secondary }}
                                                    stroke="rgba(255,255,255,0.08)"
                                                />
                                                <YAxis
                                                    type="category"
                                                    dataKey="apiario__nome"
                                                    width={160}
                                                    tick={{ fontSize: 11, fill: theme.palette.text.secondary }}
                                                    stroke="rgba(255,255,255,0.08)"
                                                />
                                                <RechartsTooltip
                                                    contentStyle={darkTooltipStyle}
                                                    labelStyle={{ color: '#E8EAED', fontWeight: 600 }}
                                                    itemStyle={{ color: 'rgba(232,234,237,0.75)' }}
                                                    formatter={(value) => [value, 'Colmeias']}
                                                />
                                                <Bar
                                                    dataKey="total"
                                                    fill={theme.palette.secondary.main}
                                                    radius={[0, 8, 8, 0]}
                                                    maxBarSize={28}
                                                />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                                            <Typography color="text.secondary">Nenhum dado disponível</Typography>
                                        </Box>
                                    )}
                                </Box>
                            </CardContent>
                        </Card>
                    </Fade>
                </Grid>
            </Grid>

            {/* ─── IoT Section ──────────────────────────────────────────────── */}
            {data?.colmeias_iot && data.colmeias_iot.length > 0 && (
                <Fade in timeout={800}>
                    <Card sx={{ mt: 4 }}>
                        <CardContent sx={{ p: 3 }}>
                            <SectionHeader
                                title="Monitoramento IoT em Tempo Real"
                                icon={<SensorsIcon />}
                                badge={
                                    <Chip
                                        label={`${data?.total_colmeias_iot || 0} sensores`}
                                        size="small"
                                        color="info"
                                        variant="outlined"
                                    />
                                }
                            />
                            <Grid container spacing={2}>
                                {data.colmeias_iot.map((colmeia) => (
                                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={colmeia.id}>
                                        <Paper
                                            sx={{
                                                p: { xs: 1.5, sm: 2 },
                                                border: '1px solid',
                                                borderColor: alpha('#2196F3', 0.2),
                                                borderRadius: 2,
                                                '&:hover': {
                                                    borderColor: alpha('#2196F3', 0.4),
                                                    transform: 'translateY(-1px)',
                                                },
                                                transition: 'border-color 0.2s ease, transform 0.2s ease',
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                                <Box>
                                                    <Typography variant="subtitle2" fontWeight={700}>
                                                        {colmeia.identificador}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {colmeia.apiario_nome}
                                                    </Typography>
                                                </Box>
                                                <Box sx={{
                                                    width: 28, height: 28, borderRadius: '7px',
                                                    bgcolor: alpha('#2196F3', 0.12),
                                                    border: `1px solid ${alpha('#2196F3', 0.25)}`,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                }}>
                                                    <SensorsIcon sx={{ fontSize: 16, color: '#64B5F6' }} />
                                                </Box>
                                            </Box>

                                            {[
                                                {
                                                    key: 'temperatura_atual',
                                                    label: 'Temperatura',
                                                    icon: <ThermostatIcon />,
                                                    color: getTemperatureColor(Number(colmeia.temperatura_atual)),
                                                    format: (value) => `${Number(value).toFixed(1)}°C`,
                                                },
                                                {
                                                    key: 'nivel_ruido',
                                                    label: 'Ruído',
                                                    icon: <VolumeUpIcon />,
                                                    color: '#FFB74D',
                                                    format: (value) => `${Number(value).toFixed(1)} dB`,
                                                },
                                                {
                                                    key: 'luminosidade',
                                                    label: 'Luminosidade',
                                                    icon: <LightModeIcon />,
                                                    color: '#FFC107',
                                                    format: (value) => `${Number(value).toFixed(0)} lux`,
                                                },
                                                {
                                                    key: 'umidade',
                                                    label: 'Umidade',
                                                    icon: <WaterDropIcon />,
                                                    color: '#64B5F6',
                                                    format: (value) => `${Number(value).toFixed(1)}%`,
                                                },
                                                {
                                                    key: 'pressao',
                                                    label: 'Pressão',
                                                    icon: <CompressIcon />,
                                                    color: '#CE93D8',
                                                    format: (value) => `${Number(value).toFixed(1)} hPa`,
                                                },
                                                {
                                                    key: 'peso',
                                                    label: 'Peso',
                                                    icon: <ScaleIcon />,
                                                    color: '#90A4AE',
                                                    format: (value) => `${Number(value).toFixed(1)} kg`,
                                                },
                                            ].some((metric) => hasSensorValue(colmeia[metric.key])) ? (
                                                <Grid container spacing={1.2}>
                                                    {[
                                                        {
                                                            key: 'temperatura_atual',
                                                            label: 'Temperatura',
                                                            icon: <ThermostatIcon />,
                                                            color: getTemperatureColor(Number(colmeia.temperatura_atual)),
                                                            format: (value) => `${Number(value).toFixed(1)}°C`,
                                                        },
                                                        {
                                                            key: 'nivel_ruido',
                                                            label: 'Ruído',
                                                            icon: <VolumeUpIcon />,
                                                            color: '#FFB74D',
                                                            format: (value) => `${Number(value).toFixed(1)} dB`,
                                                        },
                                                        {
                                                            key: 'luminosidade',
                                                            label: 'Luminosidade',
                                                            icon: <LightModeIcon />,
                                                            color: '#FFC107',
                                                            format: (value) => `${Number(value).toFixed(0)} lux`,
                                                        },
                                                        {
                                                            key: 'umidade',
                                                            label: 'Umidade',
                                                            icon: <WaterDropIcon />,
                                                            color: '#64B5F6',
                                                            format: (value) => `${Number(value).toFixed(1)}%`,
                                                        },
                                                        {
                                                            key: 'pressao',
                                                            label: 'Pressão',
                                                            icon: <CompressIcon />,
                                                            color: '#CE93D8',
                                                            format: (value) => `${Number(value).toFixed(1)} hPa`,
                                                        },
                                                        {
                                                            key: 'peso',
                                                            label: 'Peso',
                                                            icon: <ScaleIcon />,
                                                            color: '#90A4AE',
                                                            format: (value) => `${Number(value).toFixed(1)} kg`,
                                                        },
                                                    ]
                                                        .filter((metric) => hasSensorValue(colmeia[metric.key]))
                                                        .map((metric) => (
                                                            <Grid size={{ xs: 6, sm: 4 }} key={`${colmeia.id}-${metric.key}`}>
                                                                <Box
                                                                    sx={{
                                                                        p: 1,
                                                                        borderRadius: 1.5,
                                                                        textAlign: 'center',
                                                                        bgcolor: alpha(metric.color, 0.08),
                                                                        border: `1px solid ${alpha(metric.color, 0.24)}`,
                                                                        minHeight: 72,
                                                                    }}
                                                                >
                                                                    {React.cloneElement(metric.icon, { sx: { color: metric.color, fontSize: 18, mb: 0.25 } })}
                                                                    <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.65rem' }}>
                                                                        {metric.label}
                                                                    </Typography>
                                                                    <Typography variant="body2" fontWeight={700} sx={{ color: metric.color, fontSize: '0.78rem' }}>
                                                                        {metric.format(colmeia[metric.key])}
                                                                    </Typography>
                                                                </Box>
                                                            </Grid>
                                                        ))}
                                                </Grid>
                                            ) : (
                                                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 1, fontSize: '0.78rem' }}>
                                                    Aguardando primeira leitura...
                                                </Typography>
                                            )}

                                            {colmeia.data_ultima_leitura_sensor && (
                                                <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
                                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                        <AccessTimeIcon sx={{ fontSize: 12 }} />
                                                        {new Date(colmeia.data_ultima_leitura_sensor).toLocaleString('pt-BR')}
                                                    </Typography>
                                                </Box>
                                            )}

                                            {colmeia.sparklines && (
                                                <Box sx={{ mt: 1.25 }}>
                                                    {[
                                                        { key: 'temperatura', label: 'Temp.', color: '#81C784' },
                                                        { key: 'nivel_ruido', label: 'Ruído', color: '#FFB74D' },
                                                        { key: 'luminosidade', label: 'Luz', color: '#FFC107' },
                                                        { key: 'umidade', label: 'Umidade', color: '#64B5F6' },
                                                        { key: 'pressao', label: 'Pressão', color: '#CE93D8' },
                                                        { key: 'peso', label: 'Peso', color: '#90A4AE' },
                                                    ]
                                                        .filter((sensor) => (colmeia.sparklines[sensor.key] || []).length > 1)
                                                        .slice(0, 3)
                                                        .map((sensor) => (
                                                            <Box key={`${colmeia.id}-${sensor.key}`} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.3 }}>
                                                                <Typography variant="caption" color="text.secondary" sx={{ minWidth: 52, fontSize: '0.62rem' }}>
                                                                    {sensor.label}
                                                                </Typography>
                                                                <Box sx={{ flex: 1, height: 22 }}>
                                                                    <ResponsiveContainer width="100%" height="100%">
                                                                        <LineChart data={(colmeia.sparklines[sensor.key] || []).map((value, idx) => ({ idx, value }))}>
                                                                            <Line
                                                                                type="monotone"
                                                                                dataKey="value"
                                                                                stroke={sensor.color}
                                                                                strokeWidth={1.6}
                                                                                dot={false}
                                                                            />
                                                                        </LineChart>
                                                                    </ResponsiveContainer>
                                                                </Box>
                                                            </Box>
                                                        ))}
                                                </Box>
                                            )}
                                        </Paper>
                                    </Grid>
                                ))}
                            </Grid>
                        </CardContent>
                    </Card>
                </Fade>
            )}
                </>
            )}

            {activeTab === 'comparativo' && (
                <Card>
                    <CardContent sx={{ p: { xs: 1.5, sm: 2.5 } }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 2, flexWrap: 'wrap' }}>
                            <SectionHeader title="Comparativo entre Apiários" icon={<AssessmentIcon />} />
                            <FormControl size="small" sx={{ minWidth: 180 }}>
                                <InputLabel>Período</InputLabel>
                                <Select
                                    value={comparativoPeriodo}
                                    label="Período"
                                    onChange={(event) => setComparativoPeriodo(Number(event.target.value))}
                                >
                                    <MenuItem value={30}>Últimos 30 dias</MenuItem>
                                    <MenuItem value={90}>Últimos 90 dias</MenuItem>
                                    <MenuItem value={180}>Últimos 180 dias</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>

                        {loadingComparativo ? (
                            <Skeleton variant="rounded" height={240} sx={{ borderRadius: 2 }} />
                        ) : (
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Ranking</TableCell>
                                            <TableCell>Apiário</TableCell>
                                            <TableCell align="right">Produtividade (kg)</TableCell>
                                            <TableCell align="right">Perdas</TableCell>
                                            <TableCell align="right">Tratamentos</TableCell>
                                            <TableCell align="right">Custos (R$)</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {(comparativoData?.ranking || []).map((item, index) => (
                                            <TableRow key={item.apiario_id} hover>
                                                <TableCell>
                                                    <Chip label={`#${index + 1}`} size="small" color={index === 0 ? 'success' : 'default'} />
                                                </TableCell>
                                                <TableCell>{item.apiario_nome}</TableCell>
                                                <TableCell align="right">{item.produtividade_kg.toFixed(2)}</TableCell>
                                                <TableCell align="right">{item.perdas}</TableCell>
                                                <TableCell align="right">{item.tratamentos}</TableCell>
                                                <TableCell align="right">{item.custos.toFixed(2)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </CardContent>
                </Card>
            )}

            {activeTab === 'previsao' && (
                <Box>
                    <Card sx={{ mb: 2.5 }}>
                        <CardContent sx={{ p: { xs: 1.5, sm: 2.5 } }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 2, flexWrap: 'wrap' }}>
                                <SectionHeader title="Previsão de Produção" icon={<TrendingUpIcon />} />
                                <FormControl size="small" sx={{ minWidth: 180 }}>
                                    <InputLabel>Base histórica</InputLabel>
                                    <Select
                                        value={previsaoBaseDias}
                                        label="Base histórica"
                                        onChange={(event) => setPrevisaoBaseDias(Number(event.target.value))}
                                    >
                                        <MenuItem value={30}>30 dias</MenuItem>
                                        <MenuItem value={90}>90 dias</MenuItem>
                                        <MenuItem value={180}>180 dias</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>

                            {loadingPrevisao ? (
                                <Skeleton variant="rounded" height={180} sx={{ borderRadius: 2 }} />
                            ) : (
                                <Grid container spacing={2} sx={{ mb: 2 }}>
                                    <Grid size={{ xs: 12, sm: 4 }}>
                                        <Paper sx={{ p: 2, border: '1px solid', borderColor: 'divider' }}>
                                            <Typography variant="caption" color="text.secondary">Projeção total 7 dias</Typography>
                                            <Typography variant="h6" fontWeight={700}>{previsaoData?.resumo_apiarios?.['7']?.toFixed?.(2) || '0.00'} kg</Typography>
                                        </Paper>
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 4 }}>
                                        <Paper sx={{ p: 2, border: '1px solid', borderColor: 'divider' }}>
                                            <Typography variant="caption" color="text.secondary">Projeção total 30 dias</Typography>
                                            <Typography variant="h6" fontWeight={700}>{previsaoData?.resumo_apiarios?.['30']?.toFixed?.(2) || '0.00'} kg</Typography>
                                        </Paper>
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 4 }}>
                                        <Paper sx={{ p: 2, border: '1px solid', borderColor: 'divider' }}>
                                            <Typography variant="caption" color="text.secondary">Projeção total 90 dias</Typography>
                                            <Typography variant="h6" fontWeight={700}>{previsaoData?.resumo_apiarios?.['90']?.toFixed?.(2) || '0.00'} kg</Typography>
                                        </Paper>
                                    </Grid>
                                </Grid>
                            )}

                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Colmeia</TableCell>
                                            <TableCell>Apiário</TableCell>
                                            <TableCell align="right">7 dias (kg)</TableCell>
                                            <TableCell align="right">30 dias (kg)</TableCell>
                                            <TableCell align="right">90 dias (kg)</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {(previsaoData?.colmeias || []).map((item) => (
                                            <TableRow key={item.colmeia_id} hover>
                                                <TableCell>{item.colmeia_identificador}</TableCell>
                                                <TableCell>{item.apiario_nome}</TableCell>
                                                <TableCell align="right">{item.projecoes?.['7']?.toFixed?.(2) || '0.00'}</TableCell>
                                                <TableCell align="right">{item.projecoes?.['30']?.toFixed?.(2) || '0.00'}</TableCell>
                                                <TableCell align="right">{item.projecoes?.['90']?.toFixed?.(2) || '0.00'}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </CardContent>
                    </Card>
                </Box>
            )}
        </Box>
    );
}
