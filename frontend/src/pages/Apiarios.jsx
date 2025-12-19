import { useState, useEffect } from 'react';
import {
    Box,
    Grid,
    Card,
    CardContent,
    CardActions,
    Typography,
    Button,
    Fab,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Switch,
    FormControlLabel,
    IconButton,
    Chip,
    CircularProgress,
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
                    Apiários
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenDialog()}
                >
                    Novo Apiário
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <TextField
                fullWidth
                placeholder="Buscar apiários..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ mb: 3 }}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <SearchIcon color="action" />
                        </InputAdornment>
                    ),
                }}
            />

            <Grid container spacing={3}>
                {filteredApiarios.map((apiario) => (
                    <Grid item xs={12} sm={6} md={4} key={apiario.id}>
                        <Card
                            sx={{
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                border: apiario.ativo ? 'none' : `2px solid ${alpha(theme.palette.error.main, 0.3)}`,
                            }}
                        >
                            <CardContent sx={{ flex: 1 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Box
                                            sx={{
                                                width: 48,
                                                height: 48,
                                                borderRadius: 2,
                                                backgroundColor: alpha(theme.palette.secondary.main, 0.1),
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                mr: 2,
                                            }}
                                        >
                                            <PlaceIcon sx={{ color: theme.palette.secondary.main }} />
                                        </Box>
                                        <Box>
                                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                                {apiario.nome}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {apiario.localizacao}
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Chip
                                        label={apiario.ativo ? 'Ativo' : 'Inativo'}
                                        color={apiario.ativo ? 'success' : 'error'}
                                        size="small"
                                    />
                                </Box>

                                <Box sx={{ display: 'flex', gap: 3, mt: 2, flexWrap: 'wrap' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <HiveIcon sx={{ fontSize: 20, color: theme.palette.primary.main, mr: 0.5 }} />
                                        <Typography variant="body2">
                                            <strong>{apiario.total_colmeias || 0}</strong> colmeias
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Typography variant="body2" color="text.secondary">
                                            {apiario.colmeias_ativas || 0} ativas
                                        </Typography>
                                    </Box>
                                </Box>

                                {/* Sensores IoT do Apiário */}
                                {apiario.sensor_iot_ativo && (
                                    <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${alpha('#000', 0.1)}` }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                            <SensorsIcon sx={{ fontSize: 16, color: '#2196F3', mr: 0.5 }} />
                                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                                                Sensores IoT
                                            </Typography>
                                        </Box>
                                        {apiario.temperatura_atual && (
                                            <Chip
                                                icon={<ThermostatIcon />}
                                                label={`${parseFloat(apiario.temperatura_atual).toFixed(1)}°C`}
                                                size="small"
                                                sx={{
                                                    height: 24,
                                                    fontSize: '0.7rem',
                                                    backgroundColor: alpha('#F44336', 0.2),
                                                    color: '#F44336',
                                                    mr: 0.5,
                                                    mb: 0.5,
                                                }}
                                            />
                                        )}
                                        {apiario.latitude && apiario.longitude && (
                                            <Chip
                                                icon={<LocationOnIcon />}
                                                label={`${parseFloat(apiario.latitude).toFixed(4)}, ${parseFloat(apiario.longitude).toFixed(4)}`}
                                                size="small"
                                                sx={{
                                                    height: 24,
                                                    fontSize: '0.7rem',
                                                    backgroundColor: alpha('#4CAF50', 0.2),
                                                    color: '#4CAF50',
                                                    mr: 0.5,
                                                    mb: 0.5,
                                                }}
                                            />
                                        )}
                                        {apiario.data_ultima_leitura_sensor && (
                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                                <AccessTimeIcon sx={{ fontSize: 12, verticalAlign: 'middle', mr: 0.5 }} />
                                                {new Date(apiario.data_ultima_leitura_sensor).toLocaleString('pt-BR')}
                                            </Typography>
                                        )}
                                    </Box>
                                )}

                                {apiario.responsavel && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                                        <PersonIcon sx={{ fontSize: 18, color: 'text.secondary', mr: 1 }} />
                                        <Typography variant="body2" color="text.secondary">
                                            {apiario.responsavel}
                                        </Typography>
                                    </Box>
                                )}

                                {apiario.telefone_contato && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                        <PhoneIcon sx={{ fontSize: 18, color: 'text.secondary', mr: 1 }} />
                                        <Typography variant="body2" color="text.secondary">
                                            {apiario.telefone_contato}
                                        </Typography>
                                    </Box>
                                )}
                            </CardContent>

                            <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
                                <IconButton
                                    size="small"
                                    onClick={() => handleOpenDialog(apiario)}
                                    sx={{ color: theme.palette.primary.main }}
                                >
                                    <EditIcon />
                                </IconButton>
                                <IconButton
                                    size="small"
                                    onClick={() => setDeleteConfirm({ open: true, id: apiario.id, nome: apiario.nome })}
                                    sx={{ color: theme.palette.error.main }}
                                >
                                    <DeleteIcon />
                                </IconButton>
                            </CardActions>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {filteredApiarios.length === 0 && !loading && (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                    <PlaceIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                        {searchTerm ? 'Nenhum apiário encontrado' : 'Nenhum apiário cadastrado'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        {searchTerm ? 'Tente uma busca diferente' : 'Clique no botão acima para adicionar seu primeiro apiário'}
                    </Typography>
                </Box>
            )}

            {/* Dialog de Criação/Edição */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <form onSubmit={handleSubmit}>
                    <DialogTitle>
                        {editingId ? 'Editar Apiário' : 'Novo Apiário'}
                    </DialogTitle>
                    <DialogContent>
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Nome do Apiário"
                                    name="nome"
                                    value={formData.nome}
                                    onChange={handleChange}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Localização/Endereço"
                                    name="localizacao"
                                    value={formData.localizacao}
                                    onChange={handleChange}
                                    required
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField
                                    fullWidth
                                    label="Latitude"
                                    name="latitude"
                                    type="number"
                                    value={formData.latitude}
                                    onChange={handleChange}
                                    inputProps={{ step: 'any' }}
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField
                                    fullWidth
                                    label="Longitude"
                                    name="longitude"
                                    type="number"
                                    value={formData.longitude}
                                    onChange={handleChange}
                                    inputProps={{ step: 'any' }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Responsável"
                                    name="responsavel"
                                    value={formData.responsavel}
                                    onChange={handleChange}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Telefone de Contato"
                                    name="telefone_contato"
                                    value={formData.telefone_contato}
                                    onChange={handleChange}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Data de Criação"
                                    name="data_criacao"
                                    type="date"
                                    value={formData.data_criacao}
                                    onChange={handleChange}
                                    InputLabelProps={{ shrink: true }}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={formData.ativo}
                                            onChange={handleChange}
                                            name="ativo"
                                            color="primary"
                                        />
                                    }
                                    label="Apiário Ativo"
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Descrição"
                                    name="descricao"
                                    value={formData.descricao}
                                    onChange={handleChange}
                                    multiline
                                    rows={2}
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
                        <Button onClick={handleCloseDialog} disabled={saving}>
                            Cancelar
                        </Button>
                        <Button type="submit" variant="contained" disabled={saving}>
                            {saving ? <CircularProgress size={24} /> : editingId ? 'Salvar' : 'Criar'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* Dialog de Confirmação de Exclusão */}
            <Dialog open={deleteConfirm.open} onClose={() => setDeleteConfirm({ open: false, id: null, nome: '' })}>
                <DialogTitle>Confirmar Exclusão</DialogTitle>
                <DialogContent>
                    <Typography>
                        Tem certeza que deseja excluir o apiário <strong>{deleteConfirm.nome}</strong>?
                    </Typography>
                    <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                        Esta ação não pode ser desfeita e todas as colmeias associadas serão removidas.
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
