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
    alpha,
    Grid,
    FormControl,
    InputLabel,
    Select,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Hive as HiveIcon,
    Search as SearchIcon,
    Visibility as ViewIcon,
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
    { value: 'ativa', label: 'Ativa', color: 'success' },
    { value: 'inativa', label: 'Inativa', color: 'default' },
    { value: 'quarentena', label: 'Em Quarentena', color: 'warning' },
    { value: 'morta', label: 'Morta/Abandonada', color: 'error' },
];

const tipoCaixaOptions = [
    { value: 'langstroth', label: 'Langstroth' },
    { value: 'top_bar', label: 'Top Bar' },
    { value: 'warre', label: 'Warré' },
    { value: 'inpa', label: 'INPA' },
    { value: 'af', label: 'AF (Africanizada)' },
    { value: 'outro', label: 'Outro' },
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
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null, nome: '' });
    const [detailDialog, setDetailDialog] = useState({ open: false, colmeia: null });

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
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
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

    const filteredColmeias = colmeias.filter(colmeia => {
        const matchesSearch = colmeia.identificador.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (colmeia.nome && colmeia.nome.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesApiario = !filterApiario || colmeia.apiario === parseInt(filterApiario);
        const matchesStatus = !filterStatus || colmeia.status === filterStatus;
        return matchesSearch && matchesApiario && matchesStatus;
    });

    const getStatusChip = (status) => {
        const option = statusOptions.find(o => o.value === status);
        return option ? (
            <Chip label={option.label} color={option.color} size="small" />
        ) : status;
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                <CircularProgress color="primary" size={60} />
            </Box>
        );
    }

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    Colmeias
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenDialog()}
                >
                    Nova Colmeia
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {/* Filtros */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={4}>
                        <TextField
                            fullWidth
                            placeholder="Buscar por identificador ou nome..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon color="action" />
                                    </InputAdornment>
                                ),
                            }}
                            size="small"
                        />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Apiário</InputLabel>
                            <Select
                                value={filterApiario}
                                onChange={(e) => setFilterApiario(e.target.value)}
                                label="Apiário"
                            >
                                <MenuItem value="">Todos</MenuItem>
                                {apiarios.map(api => (
                                    <MenuItem key={api.id} value={api.id}>{api.nome}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Status</InputLabel>
                            <Select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                label="Status"
                            >
                                <MenuItem value="">Todos</MenuItem>
                                {statusOptions.map(opt => (
                                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                                ))}
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
                                <TableCell>Identificador</TableCell>
                                <TableCell>Nome</TableCell>
                                <TableCell>Apiário</TableCell>
                                <TableCell>Espécie</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell align="right">Abelhas Est.</TableCell>
                                <TableCell>Última Inspeção</TableCell>
                                <TableCell align="center">Ações</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredColmeias
                                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                .map((colmeia) => (
                                    <TableRow key={colmeia.id} hover>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <HiveIcon sx={{ color: theme.palette.primary.main, mr: 1 }} />
                                                <Typography fontWeight={600}>{colmeia.identificador}</Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>{colmeia.nome || '-'}</TableCell>
                                        <TableCell>{colmeia.apiario_nome}</TableCell>
                                        <TableCell>{colmeia.especie_nome || '-'}</TableCell>
                                        <TableCell>{getStatusChip(colmeia.status)}</TableCell>
                                        <TableCell align="right">
                                            {colmeia.quantidade_abelhas_estimada?.toLocaleString('pt-BR')}
                                        </TableCell>
                                        <TableCell>
                                            {colmeia.data_ultima_inspecao
                                                ? new Date(colmeia.data_ultima_inspecao).toLocaleDateString('pt-BR')
                                                : '-'}
                                        </TableCell>
                                        <TableCell align="center">
                                            <IconButton
                                                size="small"
                                                onClick={() => setDetailDialog({ open: true, colmeia })}
                                                sx={{ color: theme.palette.info.main }}
                                            >
                                                <ViewIcon />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleOpenDialog(colmeia)}
                                                sx={{ color: theme.palette.primary.main }}
                                            >
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={() => setDeleteConfirm({
                                                    open: true,
                                                    id: colmeia.id,
                                                    nome: colmeia.identificador
                                                })}
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
                    count={filteredColmeias.length}
                    page={page}
                    onPageChange={(e, newPage) => setPage(newPage)}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={(e) => {
                        setRowsPerPage(parseInt(e.target.value, 10));
                        setPage(0);
                    }}
                    labelRowsPerPage="Linhas por página"
                    labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
                />
            </Paper>

            {filteredColmeias.length === 0 && !loading && (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                    <HiveIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                        Nenhuma colmeia encontrada
                    </Typography>
                </Box>
            )}

            {/* Dialog de Criação/Edição */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                <form onSubmit={handleSubmit}>
                    <DialogTitle>
                        {editingId ? 'Editar Colmeia' : 'Nova Colmeia'}
                    </DialogTitle>
                    <DialogContent>
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Identificador/Código"
                                    name="identificador"
                                    value={formData.identificador}
                                    onChange={handleChange}
                                    required
                                    helperText="Ex: C001, CLM-001"
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Nome/Apelido"
                                    name="nome"
                                    value={formData.nome}
                                    onChange={handleChange}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth required>
                                    <InputLabel>Apiário</InputLabel>
                                    <Select
                                        name="apiario"
                                        value={formData.apiario}
                                        onChange={handleChange}
                                        label="Apiário"
                                    >
                                        {apiarios.map(api => (
                                            <MenuItem key={api.id} value={api.id}>{api.nome}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Espécie</InputLabel>
                                    <Select
                                        name="especie"
                                        value={formData.especie}
                                        onChange={handleChange}
                                        label="Espécie"
                                    >
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
                                    <Select
                                        name="tipo_caixa"
                                        value={formData.tipo_caixa}
                                        onChange={handleChange}
                                        label="Tipo de Caixa"
                                    >
                                        {tipoCaixaOptions.map(opt => (
                                            <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth required>
                                    <InputLabel>Status</InputLabel>
                                    <Select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleChange}
                                        label="Status"
                                    >
                                        {statusOptions.map(opt => (
                                            <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <TextField
                                    fullWidth
                                    label="Qtd. Abelhas Estimada"
                                    name="quantidade_abelhas_estimada"
                                    type="number"
                                    value={formData.quantidade_abelhas_estimada}
                                    onChange={handleChange}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <TextField
                                    fullWidth
                                    label="Número de Quadros"
                                    name="numero_quadros"
                                    type="number"
                                    value={formData.numero_quadros}
                                    onChange={handleChange}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <TextField
                                    fullWidth
                                    label="Peso Estimado (kg)"
                                    name="peso_estimado_kg"
                                    type="number"
                                    value={formData.peso_estimado_kg}
                                    onChange={handleChange}
                                    inputProps={{ step: '0.1' }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <TextField
                                    fullWidth
                                    label="Data de Instalação"
                                    name="data_instalacao"
                                    type="date"
                                    value={formData.data_instalacao}
                                    onChange={handleChange}
                                    InputLabelProps={{ shrink: true }}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <TextField
                                    fullWidth
                                    label="Idade da Rainha (meses)"
                                    name="idade_rainha_meses"
                                    type="number"
                                    value={formData.idade_rainha_meses}
                                    onChange={handleChange}
                                />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <TextField
                                    fullWidth
                                    label="Última Troca de Rainha"
                                    name="data_ultima_troca_rainha"
                                    type="date"
                                    value={formData.data_ultima_troca_rainha}
                                    onChange={handleChange}
                                    InputLabelProps={{ shrink: true }}
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
                                    rows={3}
                                />
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions sx={{ p: 2 }}>
                        <Button onClick={handleCloseDialog} disabled={saving}>
                            Cancelar
                        </Button>
                        <Button type="submit" variant="contained" disabled={saving}>
                            {saving ? <CircularProgress size={24} /> : editingId ? 'Salvar' : 'Criar'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* Dialog de Detalhes */}
            <Dialog
                open={detailDialog.open}
                onClose={() => setDetailDialog({ open: false, colmeia: null })}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <HiveIcon sx={{ color: theme.palette.primary.main, mr: 1 }} />
                        Detalhes da Colmeia {detailDialog.colmeia?.identificador}
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
                                <Typography fontWeight={600} color="primary">
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
                    <Button onClick={() => setDetailDialog({ open: false, colmeia: null })}>
                        Fechar
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Dialog de Confirmação de Exclusão */}
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
                <DialogActions>
                    <Button onClick={() => setDeleteConfirm({ open: false, id: null, nome: '' })}>
                        Cancelar
                    </Button>
                    <Button onClick={handleDelete} color="error" variant="contained">
                        Excluir
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar */}
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
