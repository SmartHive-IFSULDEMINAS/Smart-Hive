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
} from '@mui/material';
import {
    Hive as HiveIcon,
    Place as PlaceIcon,
    LocalFlorist as HoneyIcon,
    Healing as TreatmentIcon,
    Warning as WarningIcon,
    Search as InspectionIcon,
    TrendingUp as TrendingIcon,
} from '@mui/icons-material';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    Legend,
} from 'recharts';
import { getDashboard } from '../services/api';

const StatCard = ({ title, value, subtitle, icon, color, trend }) => {
    const theme = useTheme();

    return (
        <Card
            sx={{
                height: '100%',
                background: `linear-gradient(135deg, ${alpha(color, 0.1)} 0%, ${alpha(color, 0.05)} 100%)`,
                border: `1px solid ${alpha(color, 0.2)}`,
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            <Box
                sx={{
                    position: 'absolute',
                    right: -20,
                    top: -20,
                    width: 120,
                    height: 120,
                    borderRadius: '50%',
                    background: alpha(color, 0.1),
                }}
            />
            <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                        <Typography color="text.secondary" variant="body2" gutterBottom>
                            {title}
                        </Typography>
                        <Typography variant="h3" component="div" sx={{ fontWeight: 700, color: color }}>
                            {value}
                        </Typography>
                        {subtitle && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                {subtitle}
                            </Typography>
                        )}
                    </Box>
                    <Box
                        sx={{
                            backgroundColor: alpha(color, 0.15),
                            borderRadius: 2,
                            p: 1.5,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        {icon}
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );
};

const COLORS = ['#4CAF50', '#F4A100', '#F44336', '#9E9E9E'];

export default function Dashboard() {
    const theme = useTheme();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);

    useEffect(() => {
        fetchDashboard();
    }, []);

    const fetchDashboard = async () => {
        try {
            setLoading(true);
            const response = await getDashboard();
            setData(response.data);
            setError(null);
        } catch (err) {
            setError('Erro ao carregar dados do dashboard');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                <CircularProgress color="primary" size={60} />
            </Box>
        );
    }

    if (error) {
        return (
            <Alert severity="error" sx={{ mb: 2 }}>
                {error}
            </Alert>
        );
    }

    const statusData = data?.colmeias_por_status?.map(item => ({
        name: item.status === 'ativa' ? 'Ativas' :
            item.status === 'inativa' ? 'Inativas' :
                item.status === 'quarentena' ? 'Quarentena' : 'Mortas',
        value: item.total,
    })) || [];

    return (
        <Box>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
                Dashboard
            </Typography>

            {/* Stats Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Total de Apiários"
                        value={data?.total_apiarios || 0}
                        subtitle={`${data?.apiarios_ativos || 0} ativos`}
                        icon={<PlaceIcon sx={{ color: theme.palette.secondary.main, fontSize: 28 }} />}
                        color={theme.palette.secondary.main}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Total de Colmeias"
                        value={data?.total_colmeias || 0}
                        subtitle={`${data?.colmeias_ativas || 0} ativas`}
                        icon={<HiveIcon sx={{ color: theme.palette.primary.main, fontSize: 28 }} />}
                        color={theme.palette.primary.main}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Produção do Ano"
                        value={`${parseFloat(data?.producao_ano_kg || 0).toFixed(1)} kg`}
                        subtitle={`${parseFloat(data?.producao_mes_kg || 0).toFixed(1)} kg este mês`}
                        icon={<HoneyIcon sx={{ color: '#FF9800', fontSize: 28 }} />}
                        color="#FF9800"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Alertas"
                        value={data?.tratamentos_em_andamento || 0}
                        subtitle={`${data?.colmeias_em_quarentena || 0} em quarentena`}
                        icon={<WarningIcon sx={{ color: theme.palette.error.main, fontSize: 28 }} />}
                        color={theme.palette.error.main}
                    />
                </Grid>
            </Grid>

            {/* Charts */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={8}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                                Produção de Mel (Últimos 12 meses)
                            </Typography>
                            <Box sx={{ height: 300 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={data?.producao_por_mes || []}>
                                        <defs>
                                            <linearGradient id="colorProducao" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.3} />
                                                <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke={alpha('#000', 0.1)} />
                                        <XAxis
                                            dataKey="mes"
                                            tick={{ fontSize: 12 }}
                                            stroke={theme.palette.text.secondary}
                                        />
                                        <YAxis
                                            tick={{ fontSize: 12 }}
                                            stroke={theme.palette.text.secondary}
                                            unit=" kg"
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                borderRadius: 8,
                                                border: 'none',
                                                boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
                                            }}
                                            formatter={(value) => [`${value} kg`, 'Produção']}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="producao_kg"
                                            stroke={theme.palette.primary.main}
                                            strokeWidth={3}
                                            fillOpacity={1}
                                            fill="url(#colorProducao)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Card sx={{ height: '100%' }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                                Status das Colmeias
                            </Typography>
                            <Box sx={{ height: 260, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                {statusData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={statusData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={90}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {statusData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value) => [value, 'Colmeias']} />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <Typography color="text.secondary">Nenhuma colmeia cadastrada</Typography>
                                )}
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Tables */}
            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                                Próximas Inspeções
                            </Typography>
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
                                                    <TableCell>{insp.colmeia_identificador}</TableCell>
                                                    <TableCell>{insp.apiario_nome}</TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={insp.condicao_geral_display}
                                                            size="small"
                                                            color={
                                                                insp.condicao_geral === 'excelente' ? 'success' :
                                                                    insp.condicao_geral === 'boa' ? 'success' :
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
                                <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                                    Nenhuma inspeção agendada
                                </Typography>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                                Últimas Produções
                            </Typography>
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
                                                    <TableCell>{prod.colmeia_identificador}</TableCell>
                                                    <TableCell>{prod.apiario_nome}</TableCell>
                                                    <TableCell align="right">
                                                        <Typography sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
                                                            {prod.quantidade_kg} kg
                                                        </Typography>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            ) : (
                                <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                                    Nenhuma produção registrada
                                </Typography>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Colmeias por Apiário */}
                <Grid item xs={12}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                                Colmeias por Apiário
                            </Typography>
                            <Box sx={{ height: 300 }}>
                                {data?.colmeias_por_apiario?.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={data.colmeias_por_apiario} layout="vertical">
                                            <CartesianGrid strokeDasharray="3 3" stroke={alpha('#000', 0.1)} />
                                            <XAxis type="number" stroke={theme.palette.text.secondary} />
                                            <YAxis
                                                type="category"
                                                dataKey="apiario__nome"
                                                width={150}
                                                tick={{ fontSize: 12 }}
                                                stroke={theme.palette.text.secondary}
                                            />
                                            <Tooltip
                                                contentStyle={{
                                                    borderRadius: 8,
                                                    border: 'none',
                                                    boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
                                                }}
                                                formatter={(value) => [value, 'Colmeias']}
                                            />
                                            <Bar
                                                dataKey="total"
                                                fill={theme.palette.secondary.main}
                                                radius={[0, 8, 8, 0]}
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
                </Grid>
            </Grid>
        </Box>
    );
}
