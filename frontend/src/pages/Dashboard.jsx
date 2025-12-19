import { useState, useEffect } from 'react';
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
    CircularProgress,
    Alert,
    useTheme,
    alpha,
    Fade,
    Grow,
    IconButton,
    Tooltip,
} from '@mui/material';
import {
    Hive as HiveIcon,
    Place as PlaceIcon,
    LocalFlorist as HoneyIcon,
    Healing as TreatmentIcon,
    Warning as WarningIcon,
    Search as InspectionIcon,
    TrendingUp as TrendingIcon,
    Refresh as RefreshIcon,
    CalendarToday as CalendarIcon,
    Assessment as AssessmentIcon,
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
} from 'recharts';
import { getDashboard } from '../services/api';

// Componente de Card de Estatística melhorado
const StatCard = ({ title, value, subtitle, icon, color, trend, delay = 0 }) => {
    const theme = useTheme();

    return (
        <Grow in={true} timeout={600 + delay}>
            <Card
                sx={{
                    height: '100%',
                    background: `linear-gradient(145deg, ${color}15 0%, ${color}05 50%, ${color}08 100%)`,
                    border: `2px solid ${alpha(color, 0.2)}`,
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: `0 12px 40px ${alpha(color, 0.3)}`,
                        borderColor: alpha(color, 0.4),
                    },
                }}
            >
                {/* Padrão de fundo decorativo */}
                <Box
                    sx={{
                        position: 'absolute',
                        right: -40,
                        top: -40,
                        width: 160,
                        height: 160,
                        borderRadius: '50%',
                        background: `radial-gradient(circle, ${alpha(color, 0.15)} 0%, transparent 70%)`,
                        opacity: 0.6,
                    }}
                />
                <Box
                    sx={{
                        position: 'absolute',
                        right: 20,
                        top: 20,
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        background: `radial-gradient(circle, ${alpha(color, 0.1)} 0%, transparent 70%)`,
                    }}
                />
                
                <CardContent sx={{ position: 'relative', zIndex: 1, p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box sx={{ flex: 1 }}>
                            <Typography 
                                variant="overline" 
                                sx={{ 
                                    color: alpha(color, 0.8),
                                    fontWeight: 600,
                                    letterSpacing: 1.2,
                                    fontSize: '0.7rem',
                                    textTransform: 'uppercase',
                                }}
                            >
                                {title}
                            </Typography>
                            <Typography 
                                variant="h3" 
                                component="div" 
                                sx={{ 
                                    fontWeight: 800, 
                                    color: color,
                                    mt: 0.5,
                                    mb: 1,
                                    fontSize: { xs: '2rem', sm: '2.5rem' },
                                    background: `linear-gradient(135deg, ${color} 0%, ${alpha(color, 0.7)} 100%)`,
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                }}
                            >
                                {value}
                            </Typography>
                            {subtitle && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                                    {trend && <TrendingIcon sx={{ fontSize: 16, color: alpha(color, 0.7) }} />}
                                    <Typography 
                                        variant="body2" 
                                        sx={{ 
                                            color: theme.palette.text.secondary,
                                            fontWeight: 500,
                                        }}
                                    >
                                        {subtitle}
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                        <Box
                            sx={{
                                backgroundColor: alpha(color, 0.2),
                                borderRadius: 3,
                                p: 2,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: `2px solid ${alpha(color, 0.3)}`,
                                boxShadow: `0 4px 12px ${alpha(color, 0.2)}`,
                            }}
                        >
                            {icon}
                        </Box>
                    </Box>
                </CardContent>
            </Card>
        </Grow>
    );
};

const COLORS = ['#4CAF50', '#F4A100', '#F44336', '#9E9E9E', '#2196F3'];

export default function Dashboard() {
    const theme = useTheme();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchDashboard();
    }, []);

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

    if (loading) {
        return (
            <Box 
                sx={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    minHeight: 400,
                    gap: 2,
                }}
            >
                <CircularProgress 
                    size={60} 
                    sx={{ 
                        color: theme.palette.primary.main,
                    }} 
                />
                <Typography variant="body1" color="text.secondary">
                    Carregando dados do apiário...
                </Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Alert 
                severity="error" 
                sx={{ 
                    mb: 2,
                    borderRadius: 2,
                }}
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

    return (
        <Box sx={{ position: 'relative' }}>
            {/* Header com título e ações */}
            <Box 
                sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    mb: 4,
                    flexWrap: 'wrap',
                    gap: 2,
                }}
            >
                <Box>
                    <Typography 
                        variant="h3" 
                        sx={{ 
                            fontWeight: 800,
                            mb: 0.5,
                            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            fontSize: { xs: '2rem', md: '2.5rem' },
                        }}
                    >
                        Visão Geral do Apiário
                    </Typography>
                    <Typography 
                        variant="body1" 
                        color="text.secondary"
                        sx={{ 
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                        }}
                    >
                        <CalendarIcon sx={{ fontSize: 18 }} />
                        {new Date().toLocaleDateString('pt-BR', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                        })}
                    </Typography>
                </Box>
                <Tooltip title="Atualizar dados">
                    <IconButton
                        onClick={() => fetchDashboard(true)}
                        disabled={refreshing}
                        sx={{
                            backgroundColor: alpha(theme.palette.primary.main, 0.1),
                            '&:hover': {
                                backgroundColor: alpha(theme.palette.primary.main, 0.2),
                            },
                        }}
                    >
                        <RefreshIcon 
                            sx={{ 
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

            {/* Cards de Estatísticas */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Apiários"
                        value={data?.total_apiarios || 0}
                        subtitle={`${data?.apiarios_ativos || 0} ativos`}
                        icon={<PlaceIcon sx={{ color: theme.palette.secondary.main, fontSize: 32 }} />}
                        color={theme.palette.secondary.main}
                        trend
                        delay={0}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Colmeias"
                        value={data?.total_colmeias || 0}
                        subtitle={`${data?.colmeias_ativas || 0} ativas`}
                        icon={<HiveIcon sx={{ color: theme.palette.primary.main, fontSize: 32 }} />}
                        color={theme.palette.primary.main}
                        trend
                        delay={100}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Produção Anual"
                        value={`${parseFloat(data?.producao_ano_kg || 0).toFixed(1)}`}
                        subtitle={`${parseFloat(data?.producao_mes_kg || 0).toFixed(1)} kg este mês`}
                        icon={<HoneyIcon sx={{ color: '#FF9800', fontSize: 32 }} />}
                        color="#FF9800"
                        trend
                        delay={200}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Atenção"
                        value={data?.tratamentos_em_andamento || 0}
                        subtitle={`${data?.colmeias_em_quarentena || 0} em quarentena`}
                        icon={<WarningIcon sx={{ color: theme.palette.error.main, fontSize: 32 }} />}
                        color={theme.palette.error.main}
                        delay={300}
                    />
                </Grid>
            </Grid>

            {/* Gráficos */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={8}>
                    <Fade in={true} timeout={800}>
                        <Card
                            sx={{
                                background: `linear-gradient(145deg, ${theme.palette.background.paper} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
                                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                                borderRadius: 3,
                                overflow: 'hidden',
                            }}
                        >
                            <CardContent sx={{ p: 3 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                                    <AssessmentIcon sx={{ color: theme.palette.primary.main }} />
                                    <Typography variant="h6" sx={{ fontWeight: 700, flex: 1 }}>
                                        Evolução da Produção
                                    </Typography>
                                    <Chip 
                                        label="12 meses" 
                                        size="small" 
                                        sx={{ 
                                            backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                            color: theme.palette.primary.main,
                                        }}
                                    />
                                </Box>
                                <Box sx={{ height: 320 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={data?.producao_por_mes || []}>
                                            <defs>
                                                <linearGradient id="colorProducao" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.4} />
                                                    <stop offset="50%" stopColor={theme.palette.primary.main} stopOpacity={0.2} />
                                                    <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid 
                                                strokeDasharray="3 3" 
                                                stroke={alpha(theme.palette.text.secondary, 0.1)}
                                                vertical={false}
                                            />
                                            <XAxis
                                                dataKey="mes"
                                                tick={{ fontSize: 11, fill: theme.palette.text.secondary }}
                                                stroke={alpha(theme.palette.text.secondary, 0.3)}
                                            />
                                            <YAxis
                                                tick={{ fontSize: 11, fill: theme.palette.text.secondary }}
                                                stroke={alpha(theme.palette.text.secondary, 0.3)}
                                                unit=" kg"
                                            />
                                            <RechartsTooltip
                                                contentStyle={{
                                                    borderRadius: 12,
                                                    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                                                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                                                    backgroundColor: theme.palette.background.paper,
                                                }}
                                                formatter={(value) => [`${parseFloat(value).toFixed(1)} kg`, 'Produção']}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="producao_kg"
                                                stroke={theme.palette.primary.main}
                                                strokeWidth={3}
                                                fillOpacity={1}
                                                fill="url(#colorProducao)"
                                                dot={{ fill: theme.palette.primary.main, r: 4 }}
                                                activeDot={{ r: 6 }}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </Box>
                            </CardContent>
                        </Card>
                    </Fade>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Fade in={true} timeout={1000}>
                        <Card
                            sx={{
                                height: '100%',
                                background: `linear-gradient(145deg, ${theme.palette.background.paper} 0%, ${alpha(theme.palette.secondary.main, 0.02)} 100%)`,
                                border: `1px solid ${alpha(theme.palette.secondary.main, 0.1)}`,
                                borderRadius: 3,
                            }}
                        >
                            <CardContent sx={{ p: 3 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                                    <HiveIcon sx={{ color: theme.palette.secondary.main }} />
                                    <Typography variant="h6" sx={{ fontWeight: 700, flex: 1 }}>
                                        Status das Colmeias
                                    </Typography>
                                </Box>
                                <Box sx={{ height: 280, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                    {statusData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={statusData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={70}
                                                    outerRadius={100}
                                                    paddingAngle={3}
                                                    dataKey="value"
                                                >
                                                    {statusData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <RechartsTooltip 
                                                    formatter={(value) => [value, 'Colmeias']}
                                                    contentStyle={{
                                                        borderRadius: 8,
                                                        border: 'none',
                                                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                                    }}
                                                />
                                                <Legend 
                                                    formatter={(value, entry) => (
                                                        <span style={{ color: entry.color, fontWeight: 600 }}>
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

            {/* Tabelas */}
            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Fade in={true} timeout={1200}>
                        <Card
                            sx={{
                                background: `linear-gradient(145deg, ${theme.palette.background.paper} 0%, ${alpha('#2196F3', 0.02)} 100%)`,
                                border: `1px solid ${alpha('#2196F3', 0.1)}`,
                                borderRadius: 3,
                            }}
                        >
                            <CardContent sx={{ p: 3 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                    <InspectionIcon sx={{ color: '#2196F3' }} />
                                    <Typography variant="h6" sx={{ fontWeight: 700, flex: 1 }}>
                                        Próximas Inspeções
                                    </Typography>
                                </Box>
                                {data?.proximas_inspecoes?.length > 0 ? (
                                    <TableContainer>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 600 }}>Colmeia</TableCell>
                                                    <TableCell sx={{ fontWeight: 600 }}>Apiário</TableCell>
                                                    <TableCell sx={{ fontWeight: 600 }}>Condição</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {data.proximas_inspecoes.map((insp, index) => (
                                                    <TableRow 
                                                        key={insp.id}
                                                        sx={{
                                                            '&:hover': {
                                                                backgroundColor: alpha('#2196F3', 0.05),
                                                            },
                                                        }}
                                                    >
                                                        <TableCell>
                                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
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
                                                                sx={{
                                                                    fontWeight: 600,
                                                                    backgroundColor: 
                                                                        insp.condicao_geral === 'excelente' ? alpha('#4CAF50', 0.2) :
                                                                        insp.condicao_geral === 'boa' ? alpha('#4CAF50', 0.15) :
                                                                        insp.condicao_geral === 'regular' ? alpha('#F4A100', 0.2) :
                                                                        alpha('#F44336', 0.2),
                                                                    color:
                                                                        insp.condicao_geral === 'excelente' ? '#4CAF50' :
                                                                        insp.condicao_geral === 'boa' ? '#4CAF50' :
                                                                        insp.condicao_geral === 'regular' ? '#F4A100' :
                                                                        '#F44336',
                                                                }}
                                                            />
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                ) : (
                                    <Box sx={{ py: 4, textAlign: 'center' }}>
                                        <Typography color="text.secondary">
                                            Nenhuma inspeção agendada
                                        </Typography>
                                    </Box>
                                )}
                            </CardContent>
                        </Card>
                    </Fade>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Fade in={true} timeout={1400}>
                        <Card
                            sx={{
                                background: `linear-gradient(145deg, ${theme.palette.background.paper} 0%, ${alpha('#FF9800', 0.02)} 100%)`,
                                border: `1px solid ${alpha('#FF9800', 0.1)}`,
                                borderRadius: 3,
                            }}
                        >
                            <CardContent sx={{ p: 3 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                    <HoneyIcon sx={{ color: '#FF9800' }} />
                                    <Typography variant="h6" sx={{ fontWeight: 700, flex: 1 }}>
                                        Últimas Produções
                                    </Typography>
                                </Box>
                                {data?.ultimas_producoes?.length > 0 ? (
                                    <TableContainer>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 600 }}>Colmeia</TableCell>
                                                    <TableCell sx={{ fontWeight: 600 }}>Apiário</TableCell>
                                                    <TableCell align="right" sx={{ fontWeight: 600 }}>Quantidade</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {data.ultimas_producoes.map((prod) => (
                                                    <TableRow 
                                                        key={prod.id}
                                                        sx={{
                                                            '&:hover': {
                                                                backgroundColor: alpha('#FF9800', 0.05),
                                                            },
                                                        }}
                                                    >
                                                        <TableCell>
                                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
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
                                                                sx={{
                                                                    fontWeight: 700,
                                                                    backgroundColor: alpha('#FF9800', 0.2),
                                                                    color: '#FF9800',
                                                                }}
                                                            />
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                ) : (
                                    <Box sx={{ py: 4, textAlign: 'center' }}>
                                        <Typography color="text.secondary">
                                            Nenhuma produção registrada
                                        </Typography>
                                    </Box>
                                )}
                            </CardContent>
                        </Card>
                    </Fade>
                </Grid>

                {/* Gráfico de Colmeias por Apiário */}
                <Grid item xs={12}>
                    <Fade in={true} timeout={1600}>
                        <Card
                            sx={{
                                background: `linear-gradient(145deg, ${theme.palette.background.paper} 0%, ${alpha(theme.palette.secondary.main, 0.02)} 100%)`,
                                border: `1px solid ${alpha(theme.palette.secondary.main, 0.1)}`,
                                borderRadius: 3,
                            }}
                        >
                            <CardContent sx={{ p: 3 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                                    <PlaceIcon sx={{ color: theme.palette.secondary.main }} />
                                    <Typography variant="h6" sx={{ fontWeight: 700, flex: 1 }}>
                                        Distribuição de Colmeias por Apiário
                                    </Typography>
                                </Box>
                                <Box sx={{ height: 320 }}>
                                    {data?.colmeias_por_apiario?.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={data.colmeias_por_apiario} layout="vertical">
                                                <CartesianGrid 
                                                    strokeDasharray="3 3" 
                                                    stroke={alpha(theme.palette.text.secondary, 0.1)}
                                                    horizontal={true}
                                                    vertical={false}
                                                />
                                                <XAxis 
                                                    type="number" 
                                                    tick={{ fontSize: 11, fill: theme.palette.text.secondary }}
                                                    stroke={alpha(theme.palette.text.secondary, 0.3)}
                                                />
                                                <YAxis
                                                    type="category"
                                                    dataKey="apiario__nome"
                                                    width={180}
                                                    tick={{ fontSize: 11, fill: theme.palette.text.secondary }}
                                                    stroke={alpha(theme.palette.text.secondary, 0.3)}
                                                />
                                                <RechartsTooltip
                                                    contentStyle={{
                                                        borderRadius: 8,
                                                        border: 'none',
                                                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                                    }}
                                                    formatter={(value) => [value, 'Colmeias']}
                                                />
                                                <Bar
                                                    dataKey="total"
                                                    fill={theme.palette.secondary.main}
                                                    radius={[0, 12, 12, 0]}
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
        </Box>
    );
}
