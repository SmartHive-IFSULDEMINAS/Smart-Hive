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
    Hive as HiveIcon,
    Search as SearchIcon,
    Visibility as ViewIcon,
    Sensors as SensorsIcon,
    Thermostat as ThermostatIcon,
    VolumeUp as VolumeUpIcon,
    LightMode as LightModeIcon,
    AccessTime as AccessTimeIcon,
    WaterDrop as WaterDropIcon,
    Compress as CompressIcon,
    Scale as ScaleIcon,
    MoreVert as MoreVertIcon,
    FilterList as FilterListIcon,
    FileDownload as FileDownloadIcon,
} from '@mui/icons-material';
import {
    getColmeias,
    createColmeia,
    updateColmeia,
    deleteColmeia,
    getApiarios,
    getEspecies,
} from '../services/api';

const statusOptions = [
    { value: 'ativa',      label: 'Ativa',             color: 'success' },
    { value: 'inativa',    label: 'Inativa',            color: 'default' },
    { value: 'quarentena', label: 'Em Quarentena',      color: 'warning' },
    { value: 'morta',      label: 'Morta/Abandonada',   color: 'error' },
];

const tipoCaixaOptions = [
    { value: 'langstroth', label: 'Langstroth' },
    { value: 'top_bar',    label: 'Top Bar' },
    { value: 'warre',      label: 'Warré' },
    { value: 'inpa',       label: 'INPA' },
    { value: 'af',         label: 'AF (Africanizada)' },
    { value: 'outro',      label: 'Outro' },
];

const initialFormData = {
    apiario: '',
    especie: '',
    identificador: '',
    nome: '',
    tipo_caixa: 'langstroth',
    quantidade_abelhas_estimada: 50000,
    status: 'ativa',
    data_instalacao: new Date().toISOString().split('T')[0],
    idade_rainha_meses: '',
    data_ultima_troca_rainha: '',
    numero_quadros: 10,
    peso_estimado_kg: '',
    observacoes: '',
};

export default function Colmeias() {
    const theme = useTheme();
    const [colmeias, setColmeias] = useState([]);
    const [apiarios, setApiarios] = useState([]);
    const [especies, setEspecies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState(initialFormData);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterApiario, setFilterApiario] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null, nome: '' });
    const [detailDialog, setDetailDialog] = useState({ open: false, colmeia: null });
    const [actionMenu, setActionMenu] = useState({ anchor: null, colmeia: null });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [colmeiasRes, apiariosRes, especiesRes] = await Promise.all([
                getColmeias(),
                getApiarios(),
                getEspecies(),
            ]);
            setColmeias(colmeiasRes.data.results || colmeiasRes.data);
            setApiarios(apiariosRes.data.results || apiariosRes.data);
            setEspecies(especiesRes.data.results || especiesRes.data);
            setError(null);
        } catch (err) {
            setError('Erro ao carregar dados');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (colmeia = null) => {
        if (colmeia) {
            setEditingId(colmeia.id);
            setFormData({
                apiario: colmeia.apiario,
                especie: colmeia.especie || '',
                identificador: colmeia.identificador,
                nome: colmeia.nome || '',
                tipo_caixa: colmeia.tipo_caixa,
                quantidade_abelhas_estimada: colmeia.quantidade_abelhas_estimada,
                status: colmeia.status,
                data_instalacao: colmeia.data_instalacao,
                idade_rainha_meses: colmeia.idade_rainha_meses || '',
                data_ultima_troca_rainha: colmeia.data_ultima_troca_rainha || '',
                numero_quadros: colmeia.numero_quadros,
                peso_estimado_kg: colmeia.peso_estimado_kg || '',
                observacoes: colmeia.observacoes || '',
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
                especie: formData.especie || null,
                idade_rainha_meses: formData.idade_rainha_meses || null,
                data_ultima_troca_rainha: formData.data_ultima_troca_rainha || null,
                peso_estimado_kg: formData.peso_estimado_kg || null,
            };
            if (editingId) {
                await updateColmeia(editingId, dataToSend);
                setSnackbar({ open: true, message: 'Colmeia atualizada com sucesso!', severity: 'success' });
            } else {
                await createColmeia(dataToSend);
                setSnackbar({ open: true, message: 'Colmeia criada com sucesso!', severity: 'success' });
            }
            handleCloseDialog();
            fetchData();
        } catch (err) {
            setSnackbar({ open: true, message: 'Erro ao salvar colmeia', severity: 'error' });
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        try {
            await deleteColmeia(deleteConfirm.id);
            setSnackbar({ open: true, message: 'Colmeia excluída com sucesso!', severity: 'success' });
            setDeleteConfirm({ open: false, id: null, nome: '' });
            fetchData();
        } catch (err) {
            setSnackbar({ open: true, message: 'Erro ao excluir colmeia', severity: 'error' });
            console.error(err);
        }
    };

    const handleActionMenuClose = () => setActionMenu({ anchor: null, colmeia: null });

    const filteredColmeias = colmeias.filter(colmeia => {
        const matchesSearch = colmeia.identificador.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (colmeia.nome && colmeia.nome.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesApiario = !filterApiario || colmeia.apiario === parseInt(filterApiario);
        const matchesStatus = !filterStatus || colmeia.status === filterStatus;
        return matchesSearch && matchesApiario && matchesStatus;
    });

    const getStatusChip = (status) => {
        const option = statusOptions.find(o => o.value === status);
        return option ? <Chip label={option.label} color={option.color} size="small" /> : status;
    };

    const hasActiveFilters = searchTerm || filterApiario || filterStatus;

    return (
        <Box>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {/* ─── Toolbar ──────────────────────────────────────────────────── */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2.5, gap: 1, flexWrap: 'wrap' }}>
                <HiveIcon sx={{ color: 'primary.main', flexShrink: 0 }} />
                <Typography variant="h5" fontWeight={700} sx={{ flex: 1, minWidth: 120 }}>
                    Colmeias
                </Typography>
                <TextField
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
                    size="small"
                    sx={{ width: { xs: '100%', sm: 220 } }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                            </InputAdornment>
                        ),
                    }}
                />
                <Tooltip title="Filtros">
                    <IconButton
                        size="small"
                        onClick={() => setFiltersOpen(v => !v)}
                        color={filtersOpen ? 'primary' : 'default'}
                        sx={{ border: '1px solid', borderColor: filtersOpen ? 'primary.main' : 'divider' }}
                    >
                        <FilterListIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Exportar">
                    <IconButton size="small" sx={{ border: '1px solid', borderColor: 'divider' }}>
                        <FileDownloadIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    size="small"
                    onClick={() => handleOpenDialog()}
                >
                    Nova Colmeia
                </Button>
            </Box>

            {/* ─── Collapsible filters ──────────────────────────────────────── */}
            <Collapse in={filtersOpen}>
                <Paper sx={{ p: 2, mb: 2, border: '1px solid', borderColor: 'divider' }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={5}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Apiário</InputLabel>
                                <Select
                                    value={filterApiario}
                                    onChange={(e) => { setFilterApiario(e.target.value); setPage(0); }}
                                    label="Apiário"
                                >
                                    <MenuItem value="">Todos</MenuItem>
                                    {apiarios.map(api => (
                                        <MenuItem key={api.id} value={api.id}>{api.nome}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={5}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Status</InputLabel>
                                <Select
                                    value={filterStatus}
                                    onChange={(e) => { setFilterStatus(e.target.value); setPage(0); }}
                                    label="Status"
                                >
                                    <MenuItem value="">Todos</MenuItem>
                                    {statusOptions.map(opt => (
                                        <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        {(filterApiario || filterStatus) && (
                            <Grid item xs={12} sm={2}>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() => { setFilterApiario(''); setFilterStatus(''); setPage(0); }}
                                    fullWidth
                                >
                                    Limpar
                                </Button>
                            </Grid>
                        )}
                    </Grid>
                </Paper>
            </Collapse>

            {/* ─── Active filter chips ──────────────────────────────────────── */}
            {hasActiveFilters && (
                <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                    {searchTerm && (
                        <Chip
                            label={`Busca: "${searchTerm}"`}
                            size="small"
                            onDelete={() => { setSearchTerm(''); setPage(0); }}
                            variant="outlined"
                        />
                    )}
                    {filterApiario && (
                        <Chip
                            label={`Apiário: ${apiarios.find(a => a.id === parseInt(filterApiario))?.nome || filterApiario}`}
                            size="small"
                            onDelete={() => { setFilterApiario(''); setPage(0); }}
                            color="primary"
                            variant="outlined"
                        />
                    )}
                    {filterStatus && (
                        <Chip
                            label={`Status: ${statusOptions.find(o => o.value === filterStatus)?.label}`}
                            size="small"
                            onDelete={() => { setFilterStatus(''); setPage(0); }}
                            variant="outlined"
                        />
                    )}
                </Box>
            )}

            {/* ─── Table ────────────────────────────────────────────────────── */}
            <Paper sx={{ border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Identificador</TableCell>
                                <TableCell>Nome</TableCell>
                                <TableCell>Apiário</TableCell>
                                <TableCell>Espécie</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell align="right">Abelhas Est.</TableCell>
                                <TableCell>Sensores IoT</TableCell>
                                <TableCell>Última Inspeção</TableCell>
                                <TableCell align="center" sx={{ width: 48 }}>Ações</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading
                                ? Array.from({ length: rowsPerPage }).map((_, i) => (
                                    <TableRow key={i}>
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(c => (
                                            <TableCell key={c}>
                                                <Skeleton variant="text" height={20} />
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                                : filteredColmeias
                                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                    .map((colmeia) => (
                                        <TableRow key={colmeia.id} hover>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <HiveIcon sx={{ color: 'primary.main', fontSize: 18 }} />
                                                    <Typography variant="body2" fontWeight={600}>
                                                        {colmeia.identificador}
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2">{colmeia.nome || '-'}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2">{colmeia.apiario_nome}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2">{colmeia.especie_nome || '-'}</Typography>
                                            </TableCell>
                                            <TableCell>{getStatusChip(colmeia.status)}</TableCell>
                                            <TableCell align="right">
                                                <Typography variant="body2">
                                                    {colmeia.quantidade_abelhas_estimada?.toLocaleString('pt-BR')}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                {colmeia.sensor_iot_ativo ? (
                                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                                        {colmeia.temperatura_atual && (
                                                            <Chip
                                                                icon={<ThermostatIcon />}
                                                                label={`${parseFloat(colmeia.temperatura_atual).toFixed(1)}°C`}
                                                                size="small"
                                                                sx={{
                                                                    height: 22, fontSize: '0.7rem',
                                                                    backgroundColor: alpha(
                                                                        colmeia.temperatura_atual > 35 ? '#F44336'
                                                                            : colmeia.temperatura_atual < 20 ? '#2196F3' : '#4CAF50',
                                                                        0.15
                                                                    ),
                                                                    color: colmeia.temperatura_atual > 35 ? '#EF9A9A'
                                                                        : colmeia.temperatura_atual < 20 ? '#64B5F6' : '#81C784',
                                                                }}
                                                            />
                                                        )}
                                                        {colmeia.nivel_ruido && (
                                                            <Chip icon={<VolumeUpIcon />}
                                                                label={`${parseFloat(colmeia.nivel_ruido).toFixed(1)} dB`}
                                                                size="small"
                                                                sx={{ height: 22, fontSize: '0.7rem', backgroundColor: alpha('#FF9800', 0.15), color: '#FFB74D' }}
                                                            />
                                                        )}
                                                        {colmeia.luminosidade && (
                                                            <Chip icon={<LightModeIcon />}
                                                                label={`${parseFloat(colmeia.luminosidade).toFixed(0)} lux`}
                                                                size="small"
                                                                sx={{ height: 22, fontSize: '0.7rem', backgroundColor: alpha('#FFC107', 0.15), color: '#FFC107' }}
                                                            />
                                                        )}
                                                        {colmeia.umidade && (
                                                            <Chip icon={<WaterDropIcon />}
                                                                label={`${parseFloat(colmeia.umidade).toFixed(1)}%`}
                                                                size="small"
                                                                sx={{ height: 22, fontSize: '0.7rem', backgroundColor: alpha('#2196F3', 0.15), color: '#64B5F6' }}
                                                            />
                                                        )}
                                                        {colmeia.pressao && (
                                                            <Chip icon={<CompressIcon />}
                                                                label={`${parseFloat(colmeia.pressao).toFixed(1)} hPa`}
                                                                size="small"
                                                                sx={{ height: 22, fontSize: '0.7rem', backgroundColor: alpha('#9C27B0', 0.15), color: '#CE93D8' }}
                                                            />
                                                        )}
                                                        {colmeia.peso && (
                                                            <Chip icon={<ScaleIcon />}
                                                                label={`${parseFloat(colmeia.peso).toFixed(1)} kg`}
                                                                size="small"
                                                                sx={{ height: 22, fontSize: '0.7rem', backgroundColor: alpha('#607D8B', 0.15), color: '#90A4AE' }}
                                                            />
                                                        )}
                                                        {colmeia.data_ultima_leitura_sensor && (
                                                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25, fontSize: '0.65rem' }}>
                                                                {new Date(colmeia.data_ultima_leitura_sensor).toLocaleString('pt-BR')}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                ) : (
                                                    <Typography variant="body2" color="text.disabled">Sem sensor</Typography>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2">
                                                    {colmeia.data_ultima_inspecao
                                                        ? new Date(colmeia.data_ultima_inspecao).toLocaleDateString('pt-BR')
                                                        : '-'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="center" sx={{ p: '4px' }}>
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => setActionMenu({ anchor: e.currentTarget, colmeia })}
                                                    sx={{ color: 'text.disabled', '&:hover': { color: 'text.secondary' } }}
                                                >
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
                    count={filteredColmeias.length}
                    page={page}
                    onPageChange={(e, newPage) => setPage(newPage)}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={(e) => {
                        setRowsPerPage(parseInt(e.target.value, 10));
                        setPage(0);
                    }}
                    labelRowsPerPage="Linhas:"
                    labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
                />
            </Paper>

            {/* ─── Empty state ──────────────────────────────────────────────── */}
            {filteredColmeias.length === 0 && !loading && (
                <Box sx={{
                    textAlign: 'center',
                    py: 10,
                    px: 3,
                    mt: 1,
                    borderRadius: 2,
                    border: '1px dashed',
                    borderColor: 'divider',
                }}>
                    <HiveIcon sx={{ fontSize: 52, color: alpha(theme.palette.primary.main, 0.25), mb: 2 }} />
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                        {hasActiveFilters ? 'Nenhuma colmeia encontrada para os filtros aplicados' : 'Nenhuma colmeia cadastrada'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        {hasActiveFilters
                            ? 'Tente ajustar os filtros ou limpar a busca'
                            : 'Comece adicionando sua primeira colmeia ao sistema'}
                    </Typography>
                    {!hasActiveFilters && (
                        <Button variant="outlined" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
                            Adicionar Colmeia
                        </Button>
                    )}
                </Box>
            )}

            {/* ─── Row action menu (3-dot) ──────────────────────────────────── */}
            <MuiMenu
                anchorEl={actionMenu.anchor}
                open={Boolean(actionMenu.anchor)}
                onClose={handleActionMenuClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
                <MenuItem onClick={() => {
                    setDetailDialog({ open: true, colmeia: actionMenu.colmeia });
                    handleActionMenuClose();
                }}>
                    <ViewIcon fontSize="small" sx={{ mr: 1.5, color: 'info.main' }} />
                    Ver detalhes
                </MenuItem>
                <MenuItem onClick={() => {
                    handleOpenDialog(actionMenu.colmeia);
                    handleActionMenuClose();
                }}>
                    <EditIcon fontSize="small" sx={{ mr: 1.5, color: 'primary.main' }} />
                    Editar
                </MenuItem>
                <Divider />
                <MenuItem
                    sx={{ color: 'error.main' }}
                    onClick={() => {
                        setDeleteConfirm({ open: true, id: actionMenu.colmeia.id, nome: actionMenu.colmeia.identificador });
                        handleActionMenuClose();
                    }}
                >
                    <DeleteIcon fontSize="small" sx={{ mr: 1.5 }} />
                    Excluir
                </MenuItem>
            </MuiMenu>

            {/* ─── Create / Edit dialog ─────────────────────────────────────── */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                <form onSubmit={handleSubmit}>
                    <DialogTitle>
                        {editingId ? 'Editar Colmeia' : 'Nova Colmeia'}
                    </DialogTitle>
                    <DialogContent>
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth label="Identificador/Código" name="identificador"
                                    value={formData.identificador} onChange={handleChange}
                                    required helperText="Ex: C001, CLM-001"
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth label="Nome/Apelido" name="nome"
                                    value={formData.nome} onChange={handleChange}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth required>
                                    <InputLabel>Apiário</InputLabel>
                                    <Select name="apiario" value={formData.apiario} onChange={handleChange} label="Apiário">
                                        {apiarios.map(api => (
                                            <MenuItem key={api.id} value={api.id}>{api.nome}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Espécie</InputLabel>
                                    <Select name="especie" value={formData.especie} onChange={handleChange} label="Espécie">
                                        <MenuItem value="">Não especificada</MenuItem>
                                        {especies.map(esp => (
                                            <MenuItem key={esp.id} value={esp.id}>{esp.nome}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Tipo de Caixa</InputLabel>
                                    <Select name="tipo_caixa" value={formData.tipo_caixa} onChange={handleChange} label="Tipo de Caixa">
                                        {tipoCaixaOptions.map(opt => (
                                            <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth required>
                                    <InputLabel>Status</InputLabel>
                                    <Select name="status" value={formData.status} onChange={handleChange} label="Status">
                                        {statusOptions.map(opt => (
                                            <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <TextField fullWidth label="Qtd. Abelhas Estimada" name="quantidade_abelhas_estimada"
                                    type="number" value={formData.quantidade_abelhas_estimada} onChange={handleChange} required />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <TextField fullWidth label="Número de Quadros" name="numero_quadros"
                                    type="number" value={formData.numero_quadros} onChange={handleChange} required />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <TextField fullWidth label="Peso Estimado (kg)" name="peso_estimado_kg"
                                    type="number" value={formData.peso_estimado_kg} onChange={handleChange}
                                    inputProps={{ step: '0.1' }} />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <TextField fullWidth label="Data de Instalação" name="data_instalacao"
                                    type="date" value={formData.data_instalacao} onChange={handleChange}
                                    InputLabelProps={{ shrink: true }} required />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <TextField fullWidth label="Idade da Rainha (meses)" name="idade_rainha_meses"
                                    type="number" value={formData.idade_rainha_meses} onChange={handleChange} />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <TextField fullWidth label="Última Troca de Rainha" name="data_ultima_troca_rainha"
                                    type="date" value={formData.data_ultima_troca_rainha} onChange={handleChange}
                                    InputLabelProps={{ shrink: true }} />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField fullWidth label="Observações" name="observacoes"
                                    value={formData.observacoes} onChange={handleChange}
                                    multiline rows={3} />
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions sx={{ p: 2, gap: 1 }}>
                        <Button onClick={handleCloseDialog} disabled={saving}>Cancelar</Button>
                        <Button type="submit" variant="contained" disabled={saving}>
                            {saving ? <CircularProgress size={20} /> : editingId ? 'Salvar' : 'Criar'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* ─── Detail dialog ────────────────────────────────────────────── */}
            <Dialog
                open={detailDialog.open}
                onClose={() => setDetailDialog({ open: false, colmeia: null })}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <HiveIcon sx={{ color: 'primary.main' }} />
                        Detalhes — {detailDialog.colmeia?.identificador}
                    </Box>
                </DialogTitle>
                <DialogContent>
                    {detailDialog.colmeia && (
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={6}>
                                <Typography variant="body2" color="text.secondary">Apiário</Typography>
                                <Typography fontWeight={600}>{detailDialog.colmeia.apiario_nome}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="body2" color="text.secondary">Espécie</Typography>
                                <Typography fontWeight={600}>{detailDialog.colmeia.especie_nome || 'Não especificada'}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="body2" color="text.secondary">Status</Typography>
                                {getStatusChip(detailDialog.colmeia.status)}
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="body2" color="text.secondary">Tipo de Caixa</Typography>
                                <Typography fontWeight={600}>{detailDialog.colmeia.tipo_caixa_display}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="body2" color="text.secondary">Qtd. Abelhas Estimada</Typography>
                                <Typography fontWeight={600}>
                                    {detailDialog.colmeia.quantidade_abelhas_estimada?.toLocaleString('pt-BR')}
                                </Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="body2" color="text.secondary">Produção Total</Typography>
                                <Typography fontWeight={600} color="primary.main">
                                    {parseFloat(detailDialog.colmeia.producao_total || 0).toFixed(2)} kg
                                </Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="body2" color="text.secondary">Data de Instalação</Typography>
                                <Typography fontWeight={600}>
                                    {new Date(detailDialog.colmeia.data_instalacao).toLocaleDateString('pt-BR')}
                                </Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="body2" color="text.secondary">Última Inspeção</Typography>
                                <Typography fontWeight={600}>
                                    {detailDialog.colmeia.data_ultima_inspecao
                                        ? new Date(detailDialog.colmeia.data_ultima_inspecao).toLocaleDateString('pt-BR')
                                        : 'Nunca inspecionada'}
                                </Typography>
                            </Grid>

                            {detailDialog.colmeia.sensor_iot_ativo && (
                                <>
                                    <Grid item xs={12}>
                                        <Box sx={{ mt: 1, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
                                                <SensorsIcon sx={{ color: 'info.main', fontSize: 20 }} />
                                                <Typography variant="subtitle2" fontWeight={700}>Sensores IoT</Typography>
                                                {detailDialog.colmeia.data_ultima_leitura_sensor && (
                                                    <Chip
                                                        icon={<AccessTimeIcon />}
                                                        label={new Date(detailDialog.colmeia.data_ultima_leitura_sensor).toLocaleString('pt-BR')}
                                                        size="small"
                                                        variant="outlined"
                                                        sx={{ ml: 'auto', fontSize: '0.65rem' }}
                                                    />
                                                )}
                                            </Box>
                                            <Grid container spacing={1.5}>
                                                {detailDialog.colmeia.temperatura_atual && (
                                                    <Grid item xs={12} sm={4}>
                                                        <Paper sx={{ p: 1.5, border: '1px solid', borderColor: alpha('#EF9A9A', 0.3) }}>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                                                <ThermostatIcon sx={{ color: '#EF9A9A', mr: 0.5, fontSize: 16 }} />
                                                                <Typography variant="caption" color="text.secondary">Temperatura</Typography>
                                                            </Box>
                                                            <Typography variant="h6" fontWeight={700} sx={{ color: '#EF9A9A' }}>
                                                                {parseFloat(detailDialog.colmeia.temperatura_atual).toFixed(1)}°C
                                                            </Typography>
                                                        </Paper>
                                                    </Grid>
                                                )}
                                                {detailDialog.colmeia.nivel_ruido && (
                                                    <Grid item xs={12} sm={4}>
                                                        <Paper sx={{ p: 1.5, border: '1px solid', borderColor: alpha('#FFB74D', 0.3) }}>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                                                <VolumeUpIcon sx={{ color: '#FFB74D', mr: 0.5, fontSize: 16 }} />
                                                                <Typography variant="caption" color="text.secondary">Ruído</Typography>
                                                            </Box>
                                                            <Typography variant="h6" fontWeight={700} sx={{ color: '#FFB74D' }}>
                                                                {parseFloat(detailDialog.colmeia.nivel_ruido).toFixed(1)} dB
                                                            </Typography>
                                                        </Paper>
                                                    </Grid>
                                                )}
                                                {detailDialog.colmeia.luminosidade && (
                                                    <Grid item xs={12} sm={4}>
                                                        <Paper sx={{ p: 1.5, border: '1px solid', borderColor: alpha('#FFC107', 0.3) }}>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                                                <LightModeIcon sx={{ color: '#FFC107', mr: 0.5, fontSize: 16 }} />
                                                                <Typography variant="caption" color="text.secondary">Luminosidade</Typography>
                                                            </Box>
                                                            <Typography variant="h6" fontWeight={700} sx={{ color: '#FFC107' }}>
                                                                {parseFloat(detailDialog.colmeia.luminosidade).toFixed(0)} lux
                                                            </Typography>
                                                        </Paper>
                                                    </Grid>
                                                )}
                                                {detailDialog.colmeia.umidade && (
                                                    <Grid item xs={12} sm={4}>
                                                        <Paper sx={{ p: 1.5, border: '1px solid', borderColor: alpha('#64B5F6', 0.3) }}>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                                                <WaterDropIcon sx={{ color: '#64B5F6', mr: 0.5, fontSize: 16 }} />
                                                                <Typography variant="caption" color="text.secondary">Umidade</Typography>
                                                            </Box>
                                                            <Typography variant="h6" fontWeight={700} sx={{ color: '#64B5F6' }}>
                                                                {parseFloat(detailDialog.colmeia.umidade).toFixed(1)}%
                                                            </Typography>
                                                        </Paper>
                                                    </Grid>
                                                )}
                                                {detailDialog.colmeia.pressao && (
                                                    <Grid item xs={12} sm={4}>
                                                        <Paper sx={{ p: 1.5, border: '1px solid', borderColor: alpha('#CE93D8', 0.3) }}>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                                                <CompressIcon sx={{ color: '#CE93D8', mr: 0.5, fontSize: 16 }} />
                                                                <Typography variant="caption" color="text.secondary">Pressão</Typography>
                                                            </Box>
                                                            <Typography variant="h6" fontWeight={700} sx={{ color: '#CE93D8' }}>
                                                                {parseFloat(detailDialog.colmeia.pressao).toFixed(1)} hPa
                                                            </Typography>
                                                        </Paper>
                                                    </Grid>
                                                )}
                                                {detailDialog.colmeia.peso && (
                                                    <Grid item xs={12} sm={4}>
                                                        <Paper sx={{ p: 1.5, border: '1px solid', borderColor: alpha('#90A4AE', 0.3) }}>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                                                <ScaleIcon sx={{ color: '#90A4AE', mr: 0.5, fontSize: 16 }} />
                                                                <Typography variant="caption" color="text.secondary">Peso</Typography>
                                                            </Box>
                                                            <Typography variant="h6" fontWeight={700} sx={{ color: '#90A4AE' }}>
                                                                {parseFloat(detailDialog.colmeia.peso).toFixed(1)} kg
                                                            </Typography>
                                                        </Paper>
                                                    </Grid>
                                                )}
                                            </Grid>
                                        </Box>
                                    </Grid>
                                </>
                            )}

                            {detailDialog.colmeia.observacoes && (
                                <Grid item xs={12}>
                                    <Typography variant="body2" color="text.secondary">Observações</Typography>
                                    <Typography>{detailDialog.colmeia.observacoes}</Typography>
                                </Grid>
                            )}
                        </Grid>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDetailDialog({ open: false, colmeia: null })}>Fechar</Button>
                </DialogActions>
            </Dialog>

            {/* ─── Delete confirmation ──────────────────────────────────────── */}
            <Dialog open={deleteConfirm.open} onClose={() => setDeleteConfirm({ open: false, id: null, nome: '' })}>
                <DialogTitle>Confirmar Exclusão</DialogTitle>
                <DialogContent>
                    <Typography>
                        Tem certeza que deseja excluir a colmeia <strong>{deleteConfirm.nome}</strong>?
                    </Typography>
                    <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                        Esta ação não pode ser desfeita.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ gap: 1 }}>
                    <Button onClick={() => setDeleteConfirm({ open: false, id: null, nome: '' })}>
                        Cancelar
                    </Button>
                    <Button onClick={handleDelete} color="error" variant="contained">
                        Excluir
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ─── Snackbar ─────────────────────────────────────────────────── */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
            >
                <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
