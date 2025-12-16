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
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Search as SearchIcon,
    CheckCircle as CheckIcon,
    Healing as TreatmentIcon,
} from '@mui/icons-material';
import {
    getTratamentos,
    createTratamento,
    updateTratamento,
    deleteTratamento,
    finalizarTratamento,
    getColmeias,
} from '../services/api';

const tipoTratamentoOptions = [
    { value: 'preventivo', label: 'Preventivo' },
    { value: 'curativo', label: 'Curativo' },
    { value: 'alimentacao', label: 'Alimentação Suplementar' },
    { value: 'controle_pragas', label: 'Controle de Pragas' },
    { value: 'outro', label: 'Outro' },
];

const statusOptions = [
    { value: 'em_andamento', label: 'Em Andamento', color: 'warning' },
    { value: 'concluido', label: 'Concluído', color: 'success' },
    { value: 'cancelado', label: 'Cancelado', color: 'error' },
];

const initialFormData = {
    colmeia: '',
    tipo_tratamento: 'preventivo',
    data_inicio: new Date().toISOString().split('T')[0],
    data_fim: '',
    medicamento: '',
    dosagem: '',
    frequencia_aplicacao: '',
    motivo: '',
    status: 'em_andamento',
    resultado: '',
    custo: '',
    observacoes: '',
};

export default function Tratamentos() {
    const theme = useTheme();
    const [tratamentos, setTratamentos] = useState([]);
    const [colmeias, setColmeias] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState(initialFormData);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null });
    const [finalizarDialog, setFinalizarDialog] = useState({ open: false, id: null, resultado: '' });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [tratamentosRes, colmeiasRes] = await Promise.all([
                getTratamentos(),
                getColmeias(),
            ]);
            setTratamentos(tratamentosRes.data.results || tratamentosRes.data);
            setColmeias(colmeiasRes.data.results || colmeiasRes.data);
            setError(null);
        } catch (err) {
            setError('Erro ao carregar dados');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (tratamento = null) => {
        if (tratamento) {
            setEditingId(tratamento.id);
            setFormData({
                colmeia: tratamento.colmeia,
                tipo_tratamento: tratamento.tipo_tratamento,
                data_inicio: tratamento.data_inicio,
                data_fim: tratamento.data_fim || '',
                medicamento: tratamento.medicamento || '',
                dosagem: tratamento.dosagem || '',
                frequencia_aplicacao: tratamento.frequencia_aplicacao || '',
                motivo: tratamento.motivo,
                status: tratamento.status,
                resultado: tratamento.resultado || '',
                custo: tratamento.custo || '',
                observacoes: tratamento.observacoes || '',
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
                data_fim: formData.data_fim || null,
                custo: formData.custo || null,
            };

            if (editingId) {
                await updateTratamento(editingId, dataToSend);
                setSnackbar({ open: true, message: 'Tratamento atualizado com sucesso!', severity: 'success' });
            } else {
                await createTratamento(dataToSend);
                setSnackbar({ open: true, message: 'Tratamento registrado com sucesso!', severity: 'success' });
            }
            handleCloseDialog();
            fetchData();
        } catch (err) {
            setSnackbar({ open: true, message: 'Erro ao salvar tratamento', severity: 'error' });
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        try {
            await deleteTratamento(deleteConfirm.id);
            setSnackbar({ open: true, message: 'Tratamento excluído com sucesso!', severity: 'success' });
            setDeleteConfirm({ open: false, id: null });
            fetchData();
        } catch (err) {
            setSnackbar({ open: true, message: 'Erro ao excluir tratamento', severity: 'error' });
            console.error(err);
        }
    };

    const handleFinalizar = async () => {
        try {
            await finalizarTratamento(finalizarDialog.id, { resultado: finalizarDialog.resultado });
            setSnackbar({ open: true, message: 'Tratamento finalizado com sucesso!', severity: 'success' });
            setFinalizarDialog({ open: false, id: null, resultado: '' });
            fetchData();
        } catch (err) {
            setSnackbar({ open: true, message: 'Erro ao finalizar tratamento', severity: 'error' });
            console.error(err);
        }
    };

    const filteredTratamentos = tratamentos.filter(trat => {
        const matchesSearch = trat.colmeia_identificador.toLowerCase().includes(searchTerm.toLowerCase()) ||
            trat.medicamento?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = !filterStatus || trat.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const getStatusChip = (status) => {
        const option = statusOptions.find(o => o.value === status);
        return option ? <Chip label={option.label} color={option.color} size="small" /> : status;
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                <CircularProgress color="primary" size={60} />
            </Box>
        );
    }

    const tratamentosEmAndamento = tratamentos.filter(t => t.status === 'em_andamento').length;

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        Tratamentos
                    </Typography>
                    {tratamentosEmAndamento > 0 && (
                        <Typography variant="body2" color="warning.main" sx={{ mt: 0.5 }}>
                            {tratamentosEmAndamento} tratamento(s) em andamento
                        </Typography>
                    )}
                </Box>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
                    Novo Tratamento
                </Button>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {/* Filtros */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            placeholder="Buscar por colmeia ou medicamento..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            InputProps={{
                                startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>,
                            }}
                            size="small"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Status</InputLabel>
                            <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} label="Status">
                                <MenuItem value="">Todos</MenuItem>
                                {statusOptions.map(opt => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>
            </Paper>

            {/* Tabela */}
            <Paper>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Colmeia</TableCell>
                                <TableCell>Apiário</TableCell>
                                <TableCell>Tipo</TableCell>
                                <TableCell>Data Início</TableCell>
                                <TableCell>Medicamento</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell align="right">Custo</TableCell>
                                <TableCell align="center">Ações</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredTratamentos
                                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                .map((trat) => (
                                    <TableRow key={trat.id} hover>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <TreatmentIcon sx={{ color: theme.palette.error.main, mr: 1, fontSize: 20 }} />
                                                <Typography fontWeight={600}>{trat.colmeia_identificador}</Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>{trat.apiario_nome}</TableCell>
                                        <TableCell>{trat.tipo_tratamento_display}</TableCell>
                                        <TableCell>{new Date(trat.data_inicio).toLocaleDateString('pt-BR')}</TableCell>
                                        <TableCell>{trat.medicamento || '-'}</TableCell>
                                        <TableCell>{getStatusChip(trat.status)}</TableCell>
                                        <TableCell align="right">
                                            {trat.custo ? `R$ ${parseFloat(trat.custo).toFixed(2)}` : '-'}
                                        </TableCell>
                                        <TableCell align="center">
                                            {trat.status === 'em_andamento' && (
                                                <IconButton
                                                    size="small"
                                                    onClick={() => setFinalizarDialog({ open: true, id: trat.id, resultado: '' })}
                                                    sx={{ color: theme.palette.success.main }}
                                                    title="Finalizar Tratamento"
                                                >
                                                    <CheckIcon />
                                                </IconButton>
                                            )}
                                            <IconButton
                                                size="small"
                                                onClick={() => handleOpenDialog(trat)}
                                                sx={{ color: theme.palette.primary.main }}
                                            >
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={() => setDeleteConfirm({ open: true, id: trat.id })}
                                                sx={{ color: theme.palette.error.main }}
                                            >
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
                    count={filteredTratamentos.length}
                    page={page}
                    onPageChange={(e, newPage) => setPage(newPage)}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                    labelRowsPerPage="Linhas por página"
                    labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
                />
            </Paper>

            {filteredTratamentos.length === 0 && !loading && (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                    <TreatmentIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">Nenhum tratamento encontrado</Typography>
                </Box>
            )}

            {/* Dialog de Criação/Edição */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                <form onSubmit={handleSubmit}>
                    <DialogTitle>{editingId ? 'Editar Tratamento' : 'Novo Tratamento'}</DialogTitle>
                    <DialogContent>
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={12} sm={6}>
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
                                <FormControl fullWidth required>
                                    <InputLabel>Tipo de Tratamento</InputLabel>
                                    <Select name="tipo_tratamento" value={formData.tipo_tratamento} onChange={handleChange} label="Tipo de Tratamento">
                                        {tipoTratamentoOptions.map(opt => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <TextField
                                    fullWidth
                                    label="Data de Início"
                                    name="data_inicio"
                                    type="date"
                                    value={formData.data_inicio}
                                    onChange={handleChange}
                                    InputLabelProps={{ shrink: true }}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <TextField
                                    fullWidth
                                    label="Data de Término"
                                    name="data_fim"
                                    type="date"
                                    value={formData.data_fim}
                                    onChange={handleChange}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <FormControl fullWidth>
                                    <InputLabel>Status</InputLabel>
                                    <Select name="status" value={formData.status} onChange={handleChange} label="Status">
                                        {statusOptions.map(opt => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth label="Medicamento/Produto" name="medicamento" value={formData.medicamento} onChange={handleChange} />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth label="Dosagem" name="dosagem" value={formData.dosagem} onChange={handleChange} />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth label="Frequência de Aplicação" name="frequencia_aplicacao" value={formData.frequencia_aplicacao} onChange={handleChange} />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Custo (R$)"
                                    name="custo"
                                    type="number"
                                    value={formData.custo}
                                    onChange={handleChange}
                                    inputProps={{ step: '0.01', min: '0' }}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField fullWidth label="Motivo/Diagnóstico" name="motivo" value={formData.motivo} onChange={handleChange} multiline rows={2} required />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField fullWidth label="Resultado" name="resultado" value={formData.resultado} onChange={handleChange} multiline rows={2} />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField fullWidth label="Observações" name="observacoes" value={formData.observacoes} onChange={handleChange} multiline rows={2} />
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

            {/* Dialog de Finalizar */}
            <Dialog open={finalizarDialog.open} onClose={() => setFinalizarDialog({ open: false, id: null, resultado: '' })} maxWidth="sm" fullWidth>
                <DialogTitle>Finalizar Tratamento</DialogTitle>
                <DialogContent>
                    <Typography sx={{ mb: 2 }}>Descreva o resultado do tratamento:</Typography>
                    <TextField
                        fullWidth
                        label="Resultado"
                        value={finalizarDialog.resultado}
                        onChange={(e) => setFinalizarDialog({ ...finalizarDialog, resultado: e.target.value })}
                        multiline
                        rows={3}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setFinalizarDialog({ open: false, id: null, resultado: '' })}>Cancelar</Button>
                    <Button onClick={handleFinalizar} variant="contained" color="success">Finalizar</Button>
                </DialogActions>
            </Dialog>

            {/* Dialog de Confirmação de Exclusão */}
            <Dialog open={deleteConfirm.open} onClose={() => setDeleteConfirm({ open: false, id: null })}>
                <DialogTitle>Confirmar Exclusão</DialogTitle>
                <DialogContent><Typography>Tem certeza que deseja excluir este tratamento?</Typography></DialogContent>
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
