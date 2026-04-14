import { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Box,
    Card,
    CardContent,
    Chip,
    FormControl,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Skeleton,
    Tab,
    Tabs,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    useMediaQuery,
    useTheme,
    alpha,
} from '@mui/material';
import {
    GraphicEq as NoiseIcon,
    Hive as HiveIcon,
    Timeline as TimelineIcon,
    ViewList as ListIcon,
} from '@mui/icons-material';
import {
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { getColmeias, getColmeiaLeiturasSensor } from '../services/api';

const PERIOD_OPTIONS = [
    { value: '24h', label: 'Últimas 24h' },
    { value: '7d', label: 'Últimos 7 dias' },
    { value: '30d', label: 'Últimos 30 dias' },
    { value: 'all', label: 'Todo período' },
];

const getPeriodStartDate = (period) => {
    const now = new Date();
    switch (period) {
        case '24h':
            return new Date(now.getTime() - 24 * 60 * 60 * 1000);
        case '7d':
            return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        case '30d':
            return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        default:
            return null;
    }
};

export default function HistoricoRuido() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [loading, setLoading] = useState(true);
    const [loadingReadings, setLoadingReadings] = useState(false);
    const [error, setError] = useState(null);
    const [colmeias, setColmeias] = useState([]);
    const [selectedColmeia, setSelectedColmeia] = useState('');
    const [period, setPeriod] = useState('7d');
    const [viewMode, setViewMode] = useState('grafico');
    const [readings, setReadings] = useState([]);

    useEffect(() => {
        const loadColmeias = async () => {
            try {
                setLoading(true);
                const response = await getColmeias();
                const items = response.data.results || response.data;
                setColmeias(items);
                if (items.length > 0) {
                    setSelectedColmeia(String(items[0].id));
                }
                setError(null);
            } catch (err) {
                setError('Erro ao carregar colmeias para histórico de ruído.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        loadColmeias();
    }, []);

    useEffect(() => {
        if (!selectedColmeia) {
            setReadings([]);
            return;
        }

        const loadReadings = async () => {
            try {
                setLoadingReadings(true);
                const response = await getColmeiaLeiturasSensor(selectedColmeia, { limit: 500, offset: 0 });
                const sensorReadings = response.data?.leituras || [];
                const noiseOnly = sensorReadings
                    .filter((item) => item.nivel_ruido !== null && item.nivel_ruido !== undefined)
                    .map((item) => ({
                        ...item,
                        nivel_ruido: Number(item.nivel_ruido),
                    }))
                    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

                setReadings(noiseOnly);
                setError(null);
            } catch (err) {
                setError('Erro ao carregar histórico de ruído da colmeia.');
                console.error(err);
            } finally {
                setLoadingReadings(false);
            }
        };

        loadReadings();
    }, [selectedColmeia]);

    const filteredReadings = useMemo(() => {
        const startDate = getPeriodStartDate(period);
        if (!startDate) {
            return readings;
        }
        return readings.filter((item) => new Date(item.timestamp) >= startDate);
    }, [readings, period]);

    const chartData = useMemo(
        () =>
            filteredReadings.map((item) => ({
                timestamp: new Date(item.timestamp).toLocaleString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                }),
                nivel_ruido: item.nivel_ruido,
                timestampFull: new Date(item.timestamp).toLocaleString('pt-BR'),
            })),
        [filteredReadings]
    );

    const stats = useMemo(() => {
        if (filteredReadings.length === 0) {
            return { media: 0, maximo: 0, minimo: 0, atual: 0 };
        }

        const values = filteredReadings.map((item) => item.nivel_ruido);
        const total = values.reduce((acc, value) => acc + value, 0);

        return {
            media: total / values.length,
            maximo: Math.max(...values),
            minimo: Math.min(...values),
            atual: values[values.length - 1],
        };
    }, [filteredReadings]);

    if (loading) {
        return (
            <Box>
                <Skeleton variant="text" width={280} height={40} sx={{ mb: 1 }} />
                <Skeleton variant="rounded" height={340} sx={{ borderRadius: 2 }} />
            </Box>
        );
    }

    return (
        <Box>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5, flexWrap: 'wrap' }}>
                <NoiseIcon sx={{ color: 'primary.main' }} />
                <Typography variant="h5" fontWeight={700} sx={{ flex: 1 }}>
                    Histórico de Ruído
                </Typography>
                <Chip
                    icon={<HiveIcon sx={{ fontSize: '1rem !important' }} />}
                    label={`${filteredReadings.length} leituras`}
                    size="small"
                    variant="outlined"
                />
            </Box>

            <Paper sx={{ p: 2, mb: 2, border: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 240 }, flex: 1 }}>
                        <InputLabel>Colmeia</InputLabel>
                        <Select
                            value={selectedColmeia}
                            label="Colmeia"
                            onChange={(event) => setSelectedColmeia(event.target.value)}
                        >
                            {colmeias.map((colmeia) => (
                                <MenuItem key={colmeia.id} value={String(colmeia.id)}>
                                    {colmeia.identificador} {colmeia.apiario_nome ? `• ${colmeia.apiario_nome}` : ''}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 220 }, flex: { sm: '0 0 auto' } }}>
                        <InputLabel>Período</InputLabel>
                        <Select value={period} label="Período" onChange={(event) => setPeriod(event.target.value)}>
                            {PERIOD_OPTIONS.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                    {option.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>
            </Paper>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 2, mb: 2.5 }}>
                <Card><CardContent><Typography variant="caption" color="text.secondary">Ruído atual</Typography><Typography variant="h6" fontWeight={700}>{stats.atual.toFixed(1)} dB</Typography></CardContent></Card>
                <Card><CardContent><Typography variant="caption" color="text.secondary">Média</Typography><Typography variant="h6" fontWeight={700}>{stats.media.toFixed(1)} dB</Typography></CardContent></Card>
                <Card><CardContent><Typography variant="caption" color="text.secondary">Máximo</Typography><Typography variant="h6" fontWeight={700}>{stats.maximo.toFixed(1)} dB</Typography></CardContent></Card>
                <Card><CardContent><Typography variant="caption" color="text.secondary">Mínimo</Typography><Typography variant="h6" fontWeight={700}>{stats.minimo.toFixed(1)} dB</Typography></CardContent></Card>
            </Box>

            <Paper sx={{ border: '1px solid', borderColor: 'divider' }}>
                <Tabs
                    value={viewMode}
                    onChange={(_, value) => setViewMode(value)}
                    variant={isMobile ? 'scrollable' : 'standard'}
                    scrollButtons="auto"
                    sx={{ px: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}
                >
                    <Tab icon={<TimelineIcon />} iconPosition="start" value="grafico" label="Visualização em gráfico" />
                    <Tab icon={<ListIcon />} iconPosition="start" value="lista" label="Visualização em lista" />
                </Tabs>

                <Box sx={{ p: { xs: 1.5, sm: 2.5 } }}>
                    {loadingReadings ? (
                        <Skeleton variant="rounded" height={320} sx={{ borderRadius: 2 }} />
                    ) : filteredReadings.length === 0 ? (
                        <Alert severity="info">Sem leituras de ruído para o período selecionado.</Alert>
                    ) : viewMode === 'grafico' ? (
                        <Box sx={{ height: { xs: 280, sm: 360 } }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.text.secondary, 0.2)} />
                                    <XAxis dataKey="timestamp" tick={{ fontSize: 11, fill: theme.palette.text.secondary }} />
                                    <YAxis unit=" dB" tick={{ fontSize: 11, fill: theme.palette.text.secondary }} />
                                    <Tooltip
                                        formatter={(value) => [`${Number(value).toFixed(1)} dB`, 'Ruído']}
                                        labelFormatter={(_, payload) => payload?.[0]?.payload?.timestampFull || ''}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="nivel_ruido"
                                        stroke={theme.palette.primary.main}
                                        strokeWidth={2}
                                        dot={false}
                                        activeDot={{ r: 5 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </Box>
                    ) : (
                        <TableContainer sx={{ overflowX: 'auto' }}>
                            <Table size="small" sx={{ minWidth: 520 }}>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Data/Hora</TableCell>
                                        <TableCell align="right">Nível de Ruído (dB)</TableCell>
                                        <TableCell>Dispositivo</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredReadings
                                        .slice()
                                        .reverse()
                                        .map((item) => (
                                            <TableRow key={item.id} hover>
                                                <TableCell>{new Date(item.timestamp).toLocaleString('pt-BR')}</TableCell>
                                                <TableCell align="right">
                                                    <Typography fontWeight={600}>{item.nivel_ruido.toFixed(1)} dB</Typography>
                                                </TableCell>
                                                <TableCell>{item.dispositivo_id || '—'}</TableCell>
                                            </TableRow>
                                        ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </Box>
            </Paper>
        </Box>
    );
}
