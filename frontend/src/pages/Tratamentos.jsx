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
    Skeleton,
    Alert,
    Snackbar,
    InputAdornment,
    useTheme,
    alpha,
    Grid,
    FormControl,
    InputLabel,
    Select,
    Collapse,
    Tooltip,
    Menu as MuiMenu,
    Divider,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Search as SearchIcon,
    CheckCircle as CheckIcon,
    Healing as TreatmentIcon,
    MoreVert as MoreVertIcon,
    FilterList as FilterListIcon,
    FileDownload as FileDownloadIcon,
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
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null });
    const [finalizarDialog, setFinalizarDialog] = useState({ open: false, id: null, resultado: '' });
    const [actionMenu, setActionMenu] = useState({ anchor: null, trat: null });

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

    const tratamentosEmAndamento = tratamentos.filter(t => t.status === 'em_andamento').length;

    const closeActionMenu = () => setActionMenu({ anchor: null, trat: null });

    return (
        <Box>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {/* Toolbar */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2.5, gap: 1, flexWrap: 'wrap' }}>
                <TreatmentIcon sx={{ color: 'primary.main' }} />
                <Box sx={{ flex: 1, minWidth: 120 }}>
                    <Typography variant="h5" fontWeight={700} sx={{ lineHeight: 1.2 }}>Tratamentos</Typography>
                    {tratamentosEmAndamento > 0 && (
                        <Typography variant="caption" color="warning.main">
                            {tratamentosEmAndamento} em andamento
                        </Typography>
                    )}
                </Box>
                <TextField
                    placeholder="Buscar por colmeia ou medicamento..."
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
                    size="small"
                    sx={{ width: { xs: '100%', sm: 260 } }}
                    InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: 'text.disabled' }} /></InputAdornment> }}
                />
                <Tooltip title="Filtros">
                    <IconButton size="small" onClick={() => setFiltersOpen(v => !v)}
                        color={filtersOpen ? 'primary' : 'default'}
                        sx={{ border: '1px solid', borderColor: filtersOpen ? 'primary.main' : 'divider' }}>
                        <FilterListIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Exportar">
                    <IconButton size="small" sx={{ border: '1px solid', borderColor: 'divider' }}>
                        <FileDownloadIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
                <Button variant="contained" startIcon={<AddIcon />} size="small" onClick={() => handleOpenDialog()}>
                    Novo Tratamento
                </Button>
            </Box>

            {/* Collapsible filter */}
            <Collapse in={filtersOpen}>
                <Paper sx={{ p: 2, mb: 2, border: '1px solid', borderColor: 'divider' }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid size={{ xs: 12, sm: 5 }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Status</InputLabel>
                                <Select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(0); }} label="Status">
                                    <MenuItem value="">Todos</MenuItem>
                                    {statusOptions.map(opt => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Grid>
                        {filterStatus && (
                            <Grid size={{ xs: 12, sm: 3 }}>
                                <Button size="small" variant="outlined" onClick={() => { setFilterStatus(''); setPage(0); }} fullWidth>Limpar</Button>
                            </Grid>
                        )}
                    </Grid>
                </Paper>
            </Collapse>

            {/* Active filter chips */}
            {(searchTerm || filterStatus) && (
                <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                    {searchTerm && <Chip label={`Busca: "${searchTerm}"`} size="small" onDelete={() => { setSearchTerm(''); setPage(0); }} variant="outlined" />}
                    {filterStatus && <Chip label={`Status: ${statusOptions.find(o => o.value === filterStatus)?.label}`} size="small" onDelete={() => { setFilterStatus(''); setPage(0); }} variant="outlined" />}
                </Box>
            )}

            {/* Table */}
            <Paper sx={{ border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
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
                                <TableCell align="center" sx={{ width: 48 }}>Ações</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading
                                ? Array.from({ length: rowsPerPage }).map((_, i) => (
                                    <TableRow key={i}>
                                        {[1,2,3,4,5,6,7,8].map(c => <TableCell key={c}><Skeleton height={20} /></TableCell>)}
                                    </TableRow>
                                ))
                                : filteredTratamentos
                                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                    .map((trat) => (
                                        <TableRow key={trat.id} hover>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <TreatmentIcon sx={{ color: 'error.light', mr: 1, fontSize: 18 }} />
                                                    <Typography variant="body2" fontWeight={600}>{trat.colmeia_identificador}</Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell><Typography variant="body2">{trat.apiario_nome}</Typography></TableCell>
                                            <TableCell><Typography variant="body2">{trat.tipo_tratamento_display}</Typography></TableCell>
                                            <TableCell><Typography variant="body2">{new Date(trat.data_inicio).toLocaleDateString('pt-BR')}</Typography></TableCell>
                                            <TableCell><Typography variant="body2">{trat.medicamento || '-'}</Typography></TableCell>
                                            <TableCell>{getStatusChip(trat.status)}</TableCell>
                                            <TableCell align="right">
                                                <Typography variant="body2">
                                                    {trat.custo ? `R$ ${parseFloat(trat.custo).toFixed(2)}` : '-'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="center" sx={{ p: '4px' }}>
                                                <IconButton size="small" onClick={(e) => setActionMenu({ anchor: e.currentTarget, trat })} sx={{ color: 'text.disabled' }}>
                                                    <MoreVertIcon fontSize="small" />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))
                            }
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
                    labelRowsPerPage="Linhas:"
                    labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
                />
            </Paper>

            {/* Empty state */}
            {filteredTratamentos.length === 0 && !loading && (
                <Box sx={{ textAlign: 'center', py: 10, mt: 1, borderRadius: 2, border: '1px dashed', borderColor: 'divider' }}>
                    <TreatmentIcon sx={{ fontSize: 52, color: alpha(theme.palette.primary.main, 0.25), mb: 2 }} />
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                        {(searchTerm || filterStatus) ? 'Nenhum tratamento encontrado para os filtros aplicados' : 'Nenhum tratamento cadastrado'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        {(searchTerm || filterStatus) ? 'Tente ajustar os filtros' : 'Comece registrando o primeiro tratamento'}
                    </Typography>
                    {!(searchTerm || filterStatus) && (
                        <Button variant="outlined" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>Novo Tratamento</Button>
                    )}
                </Box>
            )}

            {/* Action menu */}
            <MuiMenu
                anchorEl={actionMenu.anchor}
                open={Boolean(actionMenu.anchor)}
                onClose={closeActionMenu}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
                {actionMenu.trat?.status === 'em_andamento' && (
                    <MenuItem onClick={() => { setFinalizarDialog({ open: true, id: actionMenu.trat.id, resultado: '' }); closeActionMenu(); }}>
                        <CheckIcon fontSize="small" sx={{ mr: 1.5, color: 'success.main' }} /> Finalizar
                    </MenuItem>
                )}
                <MenuItem onClick={() => { handleOpenDialog(actionMenu.trat); closeActionMenu(); }}>
                    <EditIcon fontSize="small" sx={{ mr: 1.5, color: 'primary.main' }} /> Editar
                </MenuItem>
                <Divider />
                <MenuItem sx={{ color: 'error.main' }} onClick={() => { setDeleteConfirm({ open: true, id: actionMenu.trat.id }); closeActionMenu(); }}>
                    <DeleteIcon fontSize="small" sx={{ mr: 1.5 }} /> Excluir
                </MenuItem>
            </MuiMenu>

            {/* Dialog de Criação/Edição */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                <form onSubmit={handleSubmit}>
                    <DialogTitle>{editingId ? 'Editar Tratamento' : 'Novo Tratamento'}</DialogTitle>
                    <DialogContent>
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <FormControl fullWidth required>
                                    <InputLabel>Colmeia</InputLabel>
                                    <Select name="colmeia" value={formData.colmeia} onChange={handleChange} label="Colmeia">
                                        {colmeias.map(col => (
                                            <MenuItem key={col.id} value={col.id}>{col.identificador} - {col.apiario_nome}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <FormControl fullWidth required>
                                    <InputLabel>Tipo de Tratamento</InputLabel>
                                    <Select name="tipo_tratamento" value={formData.tipo_tratamento} onChange={handleChange} label="Tipo de Tratamento">
                                        {tipoTratamentoOptions.map(opt => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 4 }}>
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
                            <Grid size={{ xs: 12, sm: 4 }}>
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
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <FormControl fullWidth>
                                    <InputLabel>Status</InputLabel>
                                    <Select name="status" value={formData.status} onChange={handleChange} label="Status">
                                        {statusOptions.map(opt => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField fullWidth label="Medicamento/Produto" name="medicamento" value={formData.medicamento} onChange={handleChange} />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField fullWidth label="Dosagem" name="dosagem" value={formData.dosagem} onChange={handleChange} />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField fullWidth label="Frequência de Aplicação" name="frequencia_aplicacao" value={formData.frequencia_aplicacao} onChange={handleChange} />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
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
                            <Grid size={12}>
                                <TextField fullWidth label="Motivo/Diagnóstico" name="motivo" value={formData.motivo} onChange={handleChange} multiline rows={2} required />
                            </Grid>
                            <Grid size={12}>
                                <TextField fullWidth label="Resultado" name="resultado" value={formData.resultado} onChange={handleChange} multiline rows={2} />
                            </Grid>
                            <Grid size={12}>
                                <TextField fullWidth label="Observações" name="observacoes" value={formData.observacoes} onChange={handleChange} multiline rows={2} />
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions sx={{ p: 2 }}>
                        <Button onClick={handleCloseDialog} disabled={saving}>Cancelar</Button>
                        <Button type="submit" variant="contained" disabled={saving}>
                            {saving ? 'Salvando...' : editingId ? 'Salvar' : 'Registrar'}
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
