import { useEffect, useState } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Tabs,
    Tab,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    TableContainer,
    Paper,
    Skeleton,
    Grid,
    Chip,
} from '@mui/material';
import {
    Assessment as AssessmentIcon,
    TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { getDashboardComparativo, getDashboardPrevisao } from '../services/api';

export default function Analises() {
    const [activeTab, setActiveTab] = useState('comparativo');
    const [comparativoPeriodo, setComparativoPeriodo] = useState(30);
    const [previsaoBaseDias, setPrevisaoBaseDias] = useState(90);
    const [comparativoData, setComparativoData] = useState(null);
    const [previsaoData, setPrevisaoData] = useState(null);
    const [loadingComparativo, setLoadingComparativo] = useState(false);
    const [loadingPrevisao, setLoadingPrevisao] = useState(false);

    useEffect(() => {
        fetchComparativo(comparativoPeriodo);
    }, [comparativoPeriodo]);

    useEffect(() => {
        fetchPrevisao(previsaoBaseDias);
    }, [previsaoBaseDias]);

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

    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <AssessmentIcon color="primary" />
                <Typography variant="h5" fontWeight={700}>
                    Análises
                </Typography>
            </Box>

            <Card sx={{ mb: 2.5 }}>
                <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                    <Tabs
                        value={activeTab}
                        onChange={(_, value) => setActiveTab(value)}
                        variant="scrollable"
                        scrollButtons="auto"
                    >
                        <Tab value="comparativo" label="Comparativo entre Apiários" />
                        <Tab value="previsao" label="Previsão de Produção" />
                    </Tabs>
                </CardContent>
            </Card>

            {activeTab === 'comparativo' && (
                <Card>
                    <CardContent sx={{ p: { xs: 1.5, sm: 2.5 } }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 2, flexWrap: 'wrap' }}>
                            <Typography variant="h6" fontWeight={700}>Comparativo entre Apiários</Typography>
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
                <Card>
                    <CardContent sx={{ p: { xs: 1.5, sm: 2.5 } }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 2, flexWrap: 'wrap' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <TrendingUpIcon color="primary" />
                                <Typography variant="h6" fontWeight={700}>Previsão de Produção</Typography>
                            </Box>
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
            )}
        </Box>
    );
}
