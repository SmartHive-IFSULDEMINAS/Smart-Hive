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
    Switch,
    FormControlLabel,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Search as SearchIcon,
} from '@mui/icons-material';
import {
    getInspecoes,
    createInspecao,
    updateInspecao,
    deleteInspecao,
    getColmeias,
} from '../services/api';

const condicaoOptions = [
    { value: 'excelente', label: 'Excelente', color: 'success' },
    { value: 'boa', label: 'Boa', color: 'success' },
    { value: 'regular', label: 'Regular', color: 'warning' },
    { value: 'ruim', label: 'Ruim', color: 'error' },
    { value: 'critica', label: 'Crítica', color: 'error' },
];

const quantidadeOptions = [
    { value: 'abundante', label: 'Abundante' },
    { value: 'moderada', label: 'Moderada' },
    { value: 'baixa', label: 'Baixa' },
    { value: 'ausente', label: 'Ausente' },
];

const initialFormData = {
    colmeia: '',
    data: new Date().toISOString().slice(0, 16),
    inspetor: '',
    condicao_geral: 'boa',
    presenca_rainha: true,
    rainha_marcada: false,
    quantidade_crias: 'moderada',
    quantidade_mel: 'moderada',
    quantidade_polen: 'moderada',
    presenca_pragas: false,
    tipo_pragas: '',
    presenca_doencas: false,
    tipo_doencas: '',
    alimentacao_artificial: false,
    tipo_alimentacao: '',
    temperatura_ambiente: '',
    umidade_ambiente: '',
    observacoes: '',
    acoes_realizadas: '',
    proxima_inspecao: '',
};

export default function Inspecoes() {
    const theme = useTheme();
    const [inspecoes, setInspecoes] = useState([]);
    const [colmeias, setColmeias] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState(initialFormData);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCondicao, setFilterCondicao] = useState('');
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
            const [inspecoesRes, colmeiasRes] = await Promise.all([
                getInspecoes(),
                getColmeias(),
            ]);
            setInspecoes(inspecoesRes.data.results || inspecoesRes.data);
            setColmeias(colmeiasRes.data.results || colmeiasRes.data);
            setError(null);
        } catch (err) {
            setError('Erro ao carregar dados');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (inspecao = null) => {
        if (inspecao) {
            setEditingId(inspecao.id);
            setFormData({
                colmeia: inspecao.colmeia,
                data: new Date(inspecao.data).toISOString().slice(0, 16),
                inspetor: inspecao.inspetor || '',
                condicao_geral: inspecao.condicao_geral,
                presenca_rainha: inspecao.presenca_rainha,
                rainha_marcada: inspecao.rainha_marcada,
                quantidade_crias: inspecao.quantidade_crias,
                quantidade_mel: inspecao.quantidade_mel,
                quantidade_polen: inspecao.quantidade_polen,
                presenca_pragas: inspecao.presenca_pragas,
                tipo_pragas: inspecao.tipo_pragas || '',
                presenca_doencas: inspecao.presenca_doencas,
                tipo_doencas: inspecao.tipo_doencas || '',
                alimentacao_artificial: inspecao.alimentacao_artificial,
                tipo_alimentacao: inspecao.tipo_alimentacao || '',
                temperatura_ambiente: inspecao.temperatura_ambiente || '',
                umidade_ambiente: inspecao.umidade_ambiente || '',
                observacoes: inspecao.observacoes || '',
                acoes_realizadas: inspecao.acoes_realizadas || '',
                proxima_inspecao: inspecao.proxima_inspecao || '',
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
        const { name, value, checked, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            const dataToSend = {
                ...formData,
                temperatura_ambiente: formData.temperatura_ambiente || null,
                umidade_ambiente: formData.umidade_ambiente || null,
                proxima_inspecao: formData.proxima_inspecao || null,
            };

            if (editingId) {
                await updateInspecao(editingId, dataToSend);
                setSnackbar({ open: true, message: 'Inspeção atualizada com sucesso!', severity: 'success' });
            } else {
                await createInspecao(dataToSend);
                setSnackbar({ open: true, message: 'Inspeção registrada com sucesso!', severity: 'success' });
            }
            handleCloseDialog();
            fetchData();
        } catch (err) {
            setSnackbar({ open: true, message: 'Erro ao salvar inspeção', severity: 'error' });
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        try {
            await deleteInspecao(deleteConfirm.id);
            setSnackbar({ open: true, message: 'Inspeção excluída com sucesso!', severity: 'success' });
            setDeleteConfirm({ open: false, id: null });
            fetchData();
        } catch (err) {
            setSnackbar({ open: true, message: 'Erro ao excluir inspeção', severity: 'error' });
            console.error(err);
        }
    };

    const filteredInspecoes = inspecoes.filter(insp => {
        const matchesSearch = insp.colmeia_identificador.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (insp.inspetor && insp.inspetor.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesCondicao = !filterCondicao || insp.condicao_geral === filterCondicao;
        return matchesSearch && matchesCondicao;
    });

    const getCondicaoChip = (condicao) => {
        const option = condicaoOptions.find(o => o.value === condicao);
        return option ? (
            <Chip label={option.label} color={option.color} size="small" />
        ) : condicao;
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
                    Inspeções
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenDialog()}
                >
                    Nova Inspeção
                </Button>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {/* Filtros */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            placeholder="Buscar por colmeia ou inspetor..."
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
                            <InputLabel>Condição</InputLabel>
                            <Select
                                value={filterCondicao}
                                onChange={(e) => setFilterCondicao(e.target.value)}
                                label="Condição"
                            >
                                <MenuItem value="">Todas</MenuItem>
                                {condicaoOptions.map(opt => (
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
                                <TableCell>Data</TableCell>
                                <TableCell>Colmeia</TableCell>
                                <TableCell>Apiário</TableCell>
                                <TableCell>Inspetor</TableCell>
                                <TableCell>Condição</TableCell>
                                <TableCell align="center">Rainha</TableCell>
                                <TableCell align="center">Pragas</TableCell>
                                <TableCell align="center">Doenças</TableCell>
                                <TableCell align="center">Ações</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredInspecoes
                                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                .map((insp) => (
                                    <TableRow key={insp.id} hover>
                                        <TableCell>
                                            {new Date(insp.data).toLocaleDateString('pt-BR', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </TableCell>
                                        <TableCell fontWeight={600}>{insp.colmeia_identificador}</TableCell>
                                        <TableCell>{insp.apiario_nome}</TableCell>
                                        <TableCell>{insp.inspetor || '-'}</TableCell>
                                        <TableCell>{getCondicaoChip(insp.condicao_geral)}</TableCell>
                                        <TableCell align="center">
                                            <Chip
                                                label={insp.presenca_rainha ? 'Sim' : 'Não'}
                                                color={insp.presenca_rainha ? 'success' : 'error'}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell align="center">
                                            <Chip
                                                label={insp.presenca_pragas ? 'Sim' : 'Não'}
                                                color={insp.presenca_pragas ? 'error' : 'success'}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell align="center">
                                            <Chip
                                                label={insp.presenca_doencas ? 'Sim' : 'Não'}
                                                color={insp.presenca_doencas ? 'error' : 'success'}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell align="center">
                                            <IconButton
                                                size="small"
                                                onClick={() => handleOpenDialog(insp)}
                                                sx={{ color: theme.palette.primary.main }}
                                            >
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={() => setDeleteConfirm({ open: true, id: insp.id })}
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
                    count={filteredInspecoes.length}
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

            {/* Dialog de Criação/Edição */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                <form onSubmit={handleSubmit}>
                    <DialogTitle>
                        {editingId ? 'Editar Inspeção' : 'Nova Inspeção'}
                    </DialogTitle>
                    <DialogContent>
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth required>
                                    <InputLabel>Colmeia</InputLabel>
                                    <Select
                                        name="colmeia"
                                        value={formData.colmeia}
                                        onChange={handleChange}
                                        label="Colmeia"
                                    >
                                        {colmeias.map(col => (
                                            <MenuItem key={col.id} value={col.id}>
                                                {col.identificador} - {col.apiario_nome}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Data e Hora"
                                    name="data"
                                    type="datetime-local"
                                    value={formData.data}
                                    onChange={handleChange}
                                    InputLabelProps={{ shrink: true }}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Inspetor/Responsável"
                                    name="inspetor"
                                    value={formData.inspetor}
                                    onChange={handleChange}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth required>
                                    <InputLabel>Condição Geral</InputLabel>
                                    <Select
                                        name="condicao_geral"
                                        value={formData.condicao_geral}
                                        onChange={handleChange}
                                        label="Condição Geral"
                                    >
                                        {condicaoOptions.map(opt => (
                                            <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            {/* Checkboxes */}
                            <Grid item xs={6} sm={3}>
                                <FormControlLabel
                                    control={<Switch checked={formData.presenca_rainha} onChange={handleChange} name="presenca_rainha" />}
                                    label="Rainha Presente"
                                />
                            </Grid>
                            <Grid item xs={6} sm={3}>
                                <FormControlLabel
                                    control={<Switch checked={formData.rainha_marcada} onChange={handleChange} name="rainha_marcada" />}
                                    label="Rainha Marcada"
                                />
                            </Grid>
                            <Grid item xs={6} sm={3}>
                                <FormControlLabel
                                    control={<Switch checked={formData.presenca_pragas} onChange={handleChange} name="presenca_pragas" color="error" />}
                                    label="Presença de Pragas"
                                />
                            </Grid>
                            <Grid item xs={6} sm={3}>
                                <FormControlLabel
                                    control={<Switch checked={formData.presenca_doencas} onChange={handleChange} name="presenca_doencas" color="error" />}
                                    label="Presença de Doenças"
                                />
                            </Grid>

                            {formData.presenca_pragas && (
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Tipo de Pragas"
                                        name="tipo_pragas"
                                        value={formData.tipo_pragas}
                                        onChange={handleChange}
                                    />
                                </Grid>
                            )}
                            {formData.presenca_doencas && (
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Tipo de Doenças"
                                        name="tipo_doencas"
                                        value={formData.tipo_doencas}
                                        onChange={handleChange}
                                    />
                                </Grid>
                            )}

                            {/* Quantidades */}
                            <Grid item xs={12} sm={4}>
                                <FormControl fullWidth>
                                    <InputLabel>Qtd. Crias</InputLabel>
                                    <Select name="quantidade_crias" value={formData.quantidade_crias} onChange={handleChange} label="Qtd. Crias">
                                        {quantidadeOptions.map(opt => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <FormControl fullWidth>
                                    <InputLabel>Qtd. Mel</InputLabel>
                                    <Select name="quantidade_mel" value={formData.quantidade_mel} onChange={handleChange} label="Qtd. Mel">
                                        {quantidadeOptions.map(opt => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <FormControl fullWidth>
                                    <InputLabel>Qtd. Pólen</InputLabel>
                                    <Select name="quantidade_polen" value={formData.quantidade_polen} onChange={handleChange} label="Qtd. Pólen">
                                        {quantidadeOptions.map(opt => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
                                    </Select>
                                </FormControl>
                            </Grid>

                            {/* Clima */}
                            <Grid item xs={6} sm={3}>
                                <TextField
                                    fullWidth
                                    label="Temperatura (°C)"
                                    name="temperatura_ambiente"
                                    type="number"
                                    value={formData.temperatura_ambiente}
                                    onChange={handleChange}
                                    inputProps={{ step: '0.1' }}
                                />
                            </Grid>
                            <Grid item xs={6} sm={3}>
                                <TextField
                                    fullWidth
                                    label="Umidade (%)"
                                    name="umidade_ambiente"
                                    type="number"
                                    value={formData.umidade_ambiente}
                                    onChange={handleChange}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Próxima Inspeção"
                                    name="proxima_inspecao"
                                    type="date"
                                    value={formData.proxima_inspecao}
                                    onChange={handleChange}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>

                            {/* Alimentação */}
                            <Grid item xs={12} sm={4}>
                                <FormControlLabel
                                    control={<Switch checked={formData.alimentacao_artificial} onChange={handleChange} name="alimentacao_artificial" />}
                                    label="Alimentação Artificial"
                                />
                            </Grid>
                            {formData.alimentacao_artificial && (
                                <Grid item xs={12} sm={8}>
                                    <TextField
                                        fullWidth
                                        label="Tipo de Alimentação"
                                        name="tipo_alimentacao"
                                        value={formData.tipo_alimentacao}
                                        onChange={handleChange}
                                    />
                                </Grid>
                            )}

                            {/* Textos */}
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
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Ações Realizadas"
                                    name="acoes_realizadas"
                                    value={formData.acoes_realizadas}
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
                <DialogContent>
                    <Typography>Tem certeza que deseja excluir esta inspeção?</Typography>
                </DialogContent>
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
