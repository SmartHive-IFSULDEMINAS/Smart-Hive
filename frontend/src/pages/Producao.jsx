import { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Typography,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    IconButton,
    Chip,
    CircularProgress,
    Alert,
    Snackbar,
    InputAdornment,
    useTheme,
    Grid,
    FormControl,
    InputLabel,
    Select,
    Card,
    CardContent,
    alpha,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Search as SearchIcon,
    LocalFlorist as HoneyIcon,
    TrendingUp as TrendingIcon,
} from '@mui/icons-material';
import {
    getProducoes,
    createProducao,
    updateProducao,
    deleteProducao,
    getProducaoRelatorio,
    getColmeias,
} from '../services/api';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
} from 'recharts';

const qualidadeOptions = [
    { value: 'extra', label: 'Extra', color: '#4CAF50' },
    { value: 'primeira', label: 'Primeira', color: '#2196F3' },
    { value: 'segunda', label: 'Segunda', color: '#FF9800' },
    { value: 'industrial', label: 'Industrial', color: '#9E9E9E' },
];

const tipoMelOptions = [
    { value: 'florada_silvestre', label: 'Florada Silvestre' },
    { value: 'laranjeira', label: 'Laranjeira' },
    { value: 'eucalipto', label: 'Eucalipto' },
    { value: 'assa_peixe', label: 'Assa-Peixe' },
    { value: 'cipo_uva', label: 'Cipó-Uva' },
    { value: 'multifloral', label: 'Multifloral' },
    { value: 'outro', label: 'Outro' },
];

const COLORS = ['#4CAF50', '#2196F3', '#FF9800', '#9E9E9E', '#F44336', '#9C27B0'];

const initialFormData = {
    colmeia: '',
    data_colheita: new Date().toISOString().split('T')[0],
    quantidade_kg: '',
    tipo_mel: 'multifloral',
    qualidade: 'primeira',
    numero_quadros_colhidos: '',
    umidade_mel: '',
    observacoes: '',
};

export default function Producao() {
    const theme = useTheme();
    const [producoes, setProducoes] = useState([]);
    const [colmeias, setColmeias] = useState([]);
    const [relatorio, setRelatorio] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState(initialFormData);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [producoesRes, colmeiasRes, relatorioRes] = await Promise.all([
                getProducoes(),
                getColmeias(),
                getProducaoRelatorio(),
            ]);
            setProducoes(producoesRes.data.results || producoesRes.data);
            setColmeias(colmeiasRes.data.results || colmeiasRes.data);
            setRelatorio(relatorioRes.data);
            setError(null);
        } catch (err) {
            setError('Erro ao carregar dados');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (producao = null) => {
        if (producao) {
            setEditingId(producao.id);
            setFormData({
                colmeia: producao.colmeia,
                data_colheita: producao.data_colheita,
                quantidade_kg: producao.quantidade_kg,
                tipo_mel: producao.tipo_mel,
                qualidade: producao.qualidade,
                numero_quadros_colhidos: producao.numero_quadros_colhidos || '',
                umidade_mel: producao.umidade_mel || '',
                observacoes: producao.observacoes || '',
            });
        } else {
            setEditingId(null);
            setFormData(initialFormData);
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingId(null);
        setFormData(initialFormData);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            const dataToSend = {
                ...formData,
                numero_quadros_colhidos: formData.numero_quadros_colhidos || null,
                umidade_mel: formData.umidade_mel || null,
            };

            if (editingId) {
                await updateProducao(editingId, dataToSend);
                setSnackbar({ open: true, message: 'Produção atualizada com sucesso!', severity: 'success' });
            } else {
                await createProducao(dataToSend);
                setSnackbar({ open: true, message: 'Produção registrada com sucesso!', severity: 'success' });
            }
            handleCloseDialog();
            fetchData();
        } catch (err) {
            setSnackbar({ open: true, message: 'Erro ao salvar produção', severity: 'error' });
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        try {
            await deleteProducao(deleteConfirm.id);
            setSnackbar({ open: true, message: 'Produção excluída com sucesso!', severity: 'success' });
            setDeleteConfirm({ open: false, id: null });
            fetchData();
        } catch (err) {
            setSnackbar({ open: true, message: 'Erro ao excluir produção', severity: 'error' });
            console.error(err);
        }
    };

    const filteredProducoes = producoes.filter(prod =>
        prod.colmeia_identificador.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prod.apiario_nome.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getQualidadeChip = (qualidade) => {
        const option = qualidadeOptions.find(o => o.value === qualidade);
        return option ? (
            <Chip
                label={option.label}
                size="small"
                sx={{ bgcolor: alpha(option.color, 0.15), color: option.color }}
            />
        ) : qualidade;
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                <CircularProgress color="primary" size={60} />
            </Box>
        );
    }

    const porTipoData = relatorio?.por_tipo?.map(item => ({
        name: tipoMelOptions.find(o => o.value === item.tipo_mel)?.label || item.tipo_mel,
        value: parseFloat(item.total_kg) || 0,
    })) || [];

    const porQualidadeData = relatorio?.por_qualidade?.map(item => ({
        name: qualidadeOptions.find(o => o.value === item.qualidade)?.label || item.qualidade,
        value: parseFloat(item.total_kg) || 0,
    })) || [];

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    Produção de Mel
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenDialog()}
                >
                    Registrar Colheita
                </Button>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {/* Cards de resumo */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={4}>
                    <Card sx={{ background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)` }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box>
                                    <Typography color="text.secondary" variant="body2">Produção Total</Typography>
                                    <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                                        {parseFloat(relatorio?.total?.total_kg || 0).toFixed(1)} kg
                                    </Typography>
                                </Box>
                                <HoneyIcon sx={{ fontSize: 40, color: theme.palette.primary.main, opacity: 0.5 }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Card sx={{ background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)` }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box>
                                    <Typography color="text.secondary" variant="body2">Total de Colheitas</Typography>
                                    <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.secondary.main }}>
                                        {relatorio?.total?.total_registros || 0}
                                    </Typography>
                                </Box>
                                <TrendingIcon sx={{ fontSize: 40, color: theme.palette.secondary.main, opacity: 0.5 }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Card sx={{ background: `linear-gradient(135deg, ${alpha('#2196F3', 0.1)} 0%, ${alpha('#2196F3', 0.05)} 100%)` }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box>
                                    <Typography color="text.secondary" variant="body2">Média por Colheita</Typography>
                                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#2196F3' }}>
                                        {relatorio?.total?.total_registros
                                            ? (parseFloat(relatorio.total.total_kg) / relatorio.total.total_registros).toFixed(1)
                                            : 0} kg
                                    </Typography>
                                </Box>
                                <HoneyIcon sx={{ fontSize: 40, color: '#2196F3', opacity: 0.5 }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Gráficos */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                                Produção por Tipo de Mel
                            </Typography>
                            <Box sx={{ height: 250 }}>
                                {porTipoData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={porTipoData} layout="vertical">
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis type="number" unit=" kg" />
                                            <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                                            <Tooltip formatter={(value) => [`${value} kg`, 'Produção']} />
                                            <Bar dataKey="value" fill={theme.palette.primary.main} radius={[0, 4, 4, 0]} />
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
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                                Produção por Qualidade
                            </Typography>
                            <Box sx={{ height: 250 }}>
                                {porQualidadeData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={porQualidadeData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={50}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {porQualidadeData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value) => [`${value} kg`, 'Produção']} />
                                            <Legend />
                                        </PieChart>
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

            {/* Filtro e Tabela */}
            <Paper sx={{ p: 2, mb: 2 }}>
                <TextField
                    fullWidth
                    placeholder="Buscar por colmeia ou apiário..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                        startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>,
                    }}
                    size="small"
                />
            </Paper>

            <Paper>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Data</TableCell>
                                <TableCell>Colmeia</TableCell>
                                <TableCell>Apiário</TableCell>
                                <TableCell align="right">Quantidade</TableCell>
                                <TableCell>Tipo</TableCell>
                                <TableCell>Qualidade</TableCell>
                                <TableCell align="center">Ações</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredProducoes
                                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                .map((prod) => (
                                    <TableRow key={prod.id} hover>
                                        <TableCell>{new Date(prod.data_colheita).toLocaleDateString('pt-BR')}</TableCell>
                                        <TableCell fontWeight={600}>{prod.colmeia_identificador}</TableCell>
                                        <TableCell>{prod.apiario_nome}</TableCell>
                                        <TableCell align="right">
                                            <Typography fontWeight={600} color="primary">{prod.quantidade_kg} kg</Typography>
                                        </TableCell>
                                        <TableCell>
                                            {tipoMelOptions.find(o => o.value === prod.tipo_mel)?.label || prod.tipo_mel}
                                        </TableCell>
                                        <TableCell>{getQualidadeChip(prod.qualidade)}</TableCell>
                                        <TableCell align="center">
                                            <IconButton size="small" onClick={() => handleOpenDialog(prod)} sx={{ color: theme.palette.primary.main }}>
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton size="small" onClick={() => setDeleteConfirm({ open: true, id: prod.id })} sx={{ color: theme.palette.error.main }}>
                                                <DeleteIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    component="div"
                    count={filteredProducoes.length}
                    page={page}
                    onPageChange={(e, newPage) => setPage(newPage)}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                    labelRowsPerPage="Linhas por página"
                    labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
                />
            </Paper>

            {/* Dialog de Criação/Edição */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <form onSubmit={handleSubmit}>
                    <DialogTitle>{editingId ? 'Editar Produção' : 'Registrar Colheita'}</DialogTitle>
                    <DialogContent>
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={12}>
                                <FormControl fullWidth required>
                                    <InputLabel>Colmeia</InputLabel>
                                    <Select name="colmeia" value={formData.colmeia} onChange={handleChange} label="Colmeia">
                                        {colmeias.map(col => (
                                            <MenuItem key={col.id} value={col.id}>{col.identificador} - {col.apiario_nome}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Data da Colheita"
                                    name="data_colheita"
                                    type="date"
                                    value={formData.data_colheita}
                                    onChange={handleChange}
                                    InputLabelProps={{ shrink: true }}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Quantidade (kg)"
                                    name="quantidade_kg"
                                    type="number"
                                    value={formData.quantidade_kg}
                                    onChange={handleChange}
                                    inputProps={{ step: '0.01', min: '0' }}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Tipo de Mel</InputLabel>
                                    <Select name="tipo_mel" value={formData.tipo_mel} onChange={handleChange} label="Tipo de Mel">
                                        {tipoMelOptions.map(opt => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Qualidade</InputLabel>
                                    <Select name="qualidade" value={formData.qualidade} onChange={handleChange} label="Qualidade">
                                        {qualidadeOptions.map(opt => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Quadros Colhidos"
                                    name="numero_quadros_colhidos"
                                    type="number"
                                    value={formData.numero_quadros_colhidos}
                                    onChange={handleChange}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Umidade do Mel (%)"
                                    name="umidade_mel"
                                    type="number"
                                    value={formData.umidade_mel}
                                    onChange={handleChange}
                                    inputProps={{ step: '0.1' }}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Observações"
                                    name="observacoes"
                                    value={formData.observacoes}
                                    onChange={handleChange}
                                    multiline
                                    rows={2}
                                />
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions sx={{ p: 2 }}>
                        <Button onClick={handleCloseDialog} disabled={saving}>Cancelar</Button>
                        <Button type="submit" variant="contained" disabled={saving}>
                            {saving ? <CircularProgress size={24} /> : editingId ? 'Salvar' : 'Registrar'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* Dialog de Confirmação de Exclusão */}
            <Dialog open={deleteConfirm.open} onClose={() => setDeleteConfirm({ open: false, id: null })}>
                <DialogTitle>Confirmar Exclusão</DialogTitle>
                <DialogContent><Typography>Tem certeza que deseja excluir este registro de produção?</Typography></DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteConfirm({ open: false, id: null })}>Cancelar</Button>
                    <Button onClick={handleDelete} color="error" variant="contained">Excluir</Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar */}
            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>{snackbar.message}</Alert>
            </Snackbar>
        </Box>
    );
}
