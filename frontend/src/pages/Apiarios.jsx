import { useState, useEffect } from 'react';
import {
    Box,
    Grid,
    Card,
    CardContent,
    CardActions,
    Typography,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Switch,
    FormControlLabel,
    IconButton,
    Chip,
    Skeleton,
    Alert,
    Snackbar,
    InputAdornment,
    useTheme,
    alpha,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Place as PlaceIcon,
    Hive as HiveIcon,
    Phone as PhoneIcon,
    Person as PersonIcon,
    Search as SearchIcon,
    Thermostat as ThermostatIcon,
    LocationOn as LocationOnIcon,
    Sensors as SensorsIcon,
    AccessTime as AccessTimeIcon,
} from '@mui/icons-material';
import { getApiarios, createApiario, updateApiario, deleteApiario } from '../services/api';

const initialFormData = {
    nome: '',
    localizacao: '',
    latitude: '',
    longitude: '',
    descricao: '',
    responsavel: '',
    telefone_contato: '',
    data_criacao: new Date().toISOString().split('T')[0],
    ativo: true,
    observacoes: '',
};

export default function Apiarios() {
    const theme = useTheme();
    const [apiarios, setApiarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState(initialFormData);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null, nome: '' });

    useEffect(() => {
        fetchApiarios();
    }, []);

    const fetchApiarios = async () => {
        try {
            setLoading(true);
            const response = await getApiarios();
            setApiarios(response.data.results || response.data);
            setError(null);
        } catch (err) {
            setError('Erro ao carregar apiários');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (apiario = null) => {
        if (apiario) {
            setEditingId(apiario.id);
            setFormData({
                nome: apiario.nome,
                localizacao: apiario.localizacao,
                latitude: apiario.latitude || '',
                longitude: apiario.longitude || '',
                descricao: apiario.descricao || '',
                responsavel: apiario.responsavel || '',
                telefone_contato: apiario.telefone_contato || '',
                data_criacao: apiario.data_criacao,
                ativo: apiario.ativo,
                observacoes: apiario.observacoes || '',
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
                latitude: formData.latitude || null,
                longitude: formData.longitude || null,
            };

            if (editingId) {
                await updateApiario(editingId, dataToSend);
                setSnackbar({ open: true, message: 'Apiário atualizado com sucesso!', severity: 'success' });
            } else {
                await createApiario(dataToSend);
                setSnackbar({ open: true, message: 'Apiário criado com sucesso!', severity: 'success' });
            }
            handleCloseDialog();
            fetchApiarios();
        } catch (err) {
            setSnackbar({ open: true, message: 'Erro ao salvar apiário', severity: 'error' });
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        try {
            await deleteApiario(deleteConfirm.id);
            setSnackbar({ open: true, message: 'Apiário excluído com sucesso!', severity: 'success' });
            setDeleteConfirm({ open: false, id: null, nome: '' });
            fetchApiarios();
        } catch (err) {
            setSnackbar({ open: true, message: 'Erro ao excluir apiário', severity: 'error' });
            console.error(err);
        }
    };

    const filteredApiarios = apiarios.filter(apiario =>
        apiario.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apiario.localizacao.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Box>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {/* Toolbar */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1, flexWrap: 'wrap' }}>
                <PlaceIcon sx={{ color: 'primary.main' }} />
                <Typography variant="h5" fontWeight={700} sx={{ flex: 1, minWidth: 100 }}>Apiários</Typography>
                <TextField
                    placeholder="Buscar apiários..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    size="small"
                    sx={{ width: { xs: '100%', sm: 220 } }}
                    slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: 'text.disabled' }} /></InputAdornment> } }}
                />
                <Button variant="contained" startIcon={<AddIcon />} size="small" onClick={() => handleOpenDialog()}>
                    Novo Apiário
                </Button>
            </Box>

            {/* Card grid */}
            <Grid container spacing={2.5}>
                {loading
                    ? Array.from({ length: 6 }).map((_, i) => (
                        <Grid item xs={12} sm={6} md={4} key={i}>
                            <Card sx={{ border: '1px solid', borderColor: 'divider' }}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        <Skeleton variant="rounded" width={48} height={48} sx={{ mr: 2, borderRadius: 2 }} />
                                        <Box sx={{ flex: 1 }}>
                                            <Skeleton width="60%" height={24} />
                                            <Skeleton width="80%" height={18} />
                                        </Box>
                                    </Box>
                                    <Skeleton height={16} sx={{ mb: 1 }} />
                                    <Skeleton width="40%" height={16} />
                                </CardContent>
                            </Card>
                        </Grid>
                    ))
                    : filteredApiarios.map((apiario) => (
                        <Grid item xs={12} sm={6} md={4} key={apiario.id}>
                            <Card sx={{
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                border: '1px solid',
                                borderColor: apiario.ativo ? 'divider' : alpha(theme.palette.error.main, 0.3),
                                transition: 'border-color 0.2s',
                                '&:hover': { borderColor: apiario.ativo ? 'primary.main' : alpha(theme.palette.error.main, 0.5) },
                            }}>
                                <CardContent sx={{ flex: 1 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Box sx={{
                                                width: 44, height: 44, borderRadius: 2,
                                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 1.5,
                                            }}>
                                                <PlaceIcon sx={{ color: 'primary.main', fontSize: 22 }} />
                                            </Box>
                                            <Box>
                                                <Typography variant="subtitle1" fontWeight={600} sx={{ lineHeight: 1.2 }}>{apiario.nome}</Typography>
                                                <Typography variant="caption" color="text.secondary">{apiario.localizacao}</Typography>
                                            </Box>
                                        </Box>
                                        <Chip label={apiario.ativo ? 'Ativo' : 'Inativo'} color={apiario.ativo ? 'success' : 'error'} size="small" />
                                    </Box>

                                    <Box sx={{ display: 'flex', gap: 2.5, mb: 1.5 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <HiveIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                                            <Typography variant="body2"><strong>{apiario.total_colmeias || 0}</strong> colmeias</Typography>
                                        </Box>
                                        <Typography variant="body2" color="text.secondary">{apiario.colmeias_ativas || 0} ativas</Typography>
                                    </Box>

                                    {apiario.sensor_iot_ativo && (
                                        <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                <SensorsIcon sx={{ fontSize: 14, color: '#64B5F6', mr: 0.5 }} />
                                                <Typography variant="caption" color="text.secondary" fontWeight={600}>Sensores IoT</Typography>
                                            </Box>
                                            {apiario.temperatura_atual && (
                                                <Chip icon={<ThermostatIcon />} label={`${parseFloat(apiario.temperatura_atual).toFixed(1)}°C`}
                                                    size="small" sx={{ height: 22, fontSize: '0.7rem', bgcolor: alpha('#EF9A9A', 0.15), color: '#EF9A9A', mr: 0.5, mb: 0.5 }} />
                                            )}
                                            {apiario.latitude && apiario.longitude && (
                                                <Chip icon={<LocationOnIcon />}
                                                    label={`${parseFloat(apiario.latitude).toFixed(4)}, ${parseFloat(apiario.longitude).toFixed(4)}`}
                                                    size="small" sx={{ height: 22, fontSize: '0.7rem', bgcolor: alpha('#81C784', 0.15), color: '#81C784', mr: 0.5, mb: 0.5 }} />
                                            )}
                                            {apiario.data_ultima_leitura_sensor && (
                                                <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.5 }}>
                                                    <AccessTimeIcon sx={{ fontSize: 11, verticalAlign: 'middle', mr: 0.5 }} />
                                                    {new Date(apiario.data_ultima_leitura_sensor).toLocaleString('pt-BR')}
                                                </Typography>
                                            )}
                                        </Box>
                                    )}

                                    {(apiario.responsavel || apiario.telefone_contato) && (
                                        <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
                                            {apiario.responsavel && (
                                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                                    <PersonIcon sx={{ fontSize: 15, color: 'text.disabled', mr: 0.75 }} />
                                                    <Typography variant="body2" color="text.secondary">{apiario.responsavel}</Typography>
                                                </Box>
                                            )}
                                            {apiario.telefone_contato && (
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <PhoneIcon sx={{ fontSize: 15, color: 'text.disabled', mr: 0.75 }} />
                                                    <Typography variant="body2" color="text.secondary">{apiario.telefone_contato}</Typography>
                                                </Box>
                                            )}
                                        </Box>
                                    )}
                                </CardContent>

                                <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 1.5, pt: 0 }}>
                                    <IconButton size="small" onClick={() => handleOpenDialog(apiario)} sx={{ color: 'primary.main' }}>
                                        <EditIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton size="small" onClick={() => setDeleteConfirm({ open: true, id: apiario.id, nome: apiario.nome })} sx={{ color: 'error.main' }}>
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                </CardActions>
                            </Card>
                        </Grid>
                    ))
                }
            </Grid>

            {/* Empty state */}
            {filteredApiarios.length === 0 && !loading && (
                <Box sx={{ textAlign: 'center', py: 10, borderRadius: 2, border: '1px dashed', borderColor: 'divider' }}>
                    <PlaceIcon sx={{ fontSize: 52, color: alpha(theme.palette.primary.main, 0.25), mb: 2 }} />
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                        {searchTerm ? 'Nenhum apiário encontrado' : 'Nenhum apiário cadastrado'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        {searchTerm ? 'Tente uma busca diferente' : 'Comece adicionando seu primeiro apiário'}
                    </Typography>
                    {!searchTerm && (
                        <Button variant="outlined" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>Novo Apiário</Button>
                    )}
                </Box>
            )}

            {/* Dialog de Criação/Edição */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <form onSubmit={handleSubmit}>
                    <DialogTitle>{editingId ? 'Editar Apiário' : 'Novo Apiário'}</DialogTitle>
                    <DialogContent>
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={12}>
                                <TextField fullWidth label="Nome do Apiário" name="nome" value={formData.nome} onChange={handleChange} required />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField fullWidth label="Localização/Endereço" name="localizacao" value={formData.localizacao} onChange={handleChange} required />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField fullWidth label="Latitude" name="latitude" type="number" value={formData.latitude} onChange={handleChange} slotProps={{ input: { step: 'any' } }} />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField fullWidth label="Longitude" name="longitude" type="number" value={formData.longitude} onChange={handleChange} slotProps={{ input: { step: 'any' } }} />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth label="Responsável" name="responsavel" value={formData.responsavel} onChange={handleChange} />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth label="Telefone de Contato" name="telefone_contato" value={formData.telefone_contato} onChange={handleChange} />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth label="Data de Criação" name="data_criacao" type="date" value={formData.data_criacao} onChange={handleChange} slotProps={{ inputLabel: { shrink: true } }} required />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <FormControlLabel control={<Switch checked={formData.ativo} onChange={handleChange} name="ativo" color="primary" />} label="Apiário Ativo" />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField fullWidth label="Descrição" name="descricao" value={formData.descricao} onChange={handleChange} multiline rows={2} />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField fullWidth label="Observações" name="observacoes" value={formData.observacoes} onChange={handleChange} multiline rows={2} />
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions sx={{ p: 2 }}>
                        <Button onClick={handleCloseDialog} disabled={saving}>Cancelar</Button>
                        <Button type="submit" variant="contained" disabled={saving}>
                            {saving ? 'Salvando...' : editingId ? 'Salvar' : 'Criar'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* Dialog de Confirmação de Exclusão */}
            <Dialog open={deleteConfirm.open} onClose={() => setDeleteConfirm({ open: false, id: null, nome: '' })}>
                <DialogTitle>Confirmar Exclusão</DialogTitle>
                <DialogContent>
                    <Typography>Tem certeza que deseja excluir o apiário <strong>{deleteConfirm.nome}</strong>?</Typography>
                    <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                        Esta ação não pode ser desfeita e todas as colmeias associadas serão removidas.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteConfirm({ open: false, id: null, nome: '' })}>Cancelar</Button>
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
