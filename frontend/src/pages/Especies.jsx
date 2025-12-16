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
    MenuItem,
    IconButton,
    Chip,
    CircularProgress,
    Alert,
    Snackbar,
    InputAdornment,
    useTheme,
    alpha,
    Rating,
    FormControl,
    InputLabel,
    Select,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    BugReport as BugIcon,
    Search as SearchIcon,
} from '@mui/icons-material';
import { getEspecies, createEspecie, updateEspecie, deleteEspecie } from '../services/api';

const agressividadeLabels = {
    1: 'Muito Dócil',
    2: 'Dócil',
    3: 'Moderada',
    4: 'Agressiva',
    5: 'Muito Agressiva',
};

const initialFormData = {
    nome: '',
    nome_cientifico: '',
    descricao: '',
    caracteristicas: '',
    nivel_agressividade: 3,
    producao_media_anual_kg: '',
    cor_identificacao: '#F4A100',
};

export default function Especies() {
    const theme = useTheme();
    const [especies, setEspecies] = useState([]);
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
        fetchEspecies();
    }, []);

    const fetchEspecies = async () => {
        try {
            setLoading(true);
            const response = await getEspecies();
            setEspecies(response.data.results || response.data);
            setError(null);
        } catch (err) {
            setError('Erro ao carregar espécies');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (especie = null) => {
        if (especie) {
            setEditingId(especie.id);
            setFormData({
                nome: especie.nome,
                nome_cientifico: especie.nome_cientifico || '',
                descricao: especie.descricao || '',
                caracteristicas: especie.caracteristicas || '',
                nivel_agressividade: especie.nivel_agressividade,
                producao_media_anual_kg: especie.producao_media_anual_kg || '',
                cor_identificacao: especie.cor_identificacao || '#F4A100',
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
                producao_media_anual_kg: formData.producao_media_anual_kg || null,
            };

            if (editingId) {
                await updateEspecie(editingId, dataToSend);
                setSnackbar({ open: true, message: 'Espécie atualizada com sucesso!', severity: 'success' });
            } else {
                await createEspecie(dataToSend);
                setSnackbar({ open: true, message: 'Espécie criada com sucesso!', severity: 'success' });
            }
            handleCloseDialog();
            fetchEspecies();
        } catch (err) {
            setSnackbar({ open: true, message: 'Erro ao salvar espécie', severity: 'error' });
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        try {
            await deleteEspecie(deleteConfirm.id);
            setSnackbar({ open: true, message: 'Espécie excluída com sucesso!', severity: 'success' });
            setDeleteConfirm({ open: false, id: null, nome: '' });
            fetchEspecies();
        } catch (err) {
            setSnackbar({ open: true, message: 'Erro ao excluir espécie', severity: 'error' });
            console.error(err);
        }
    };

    const filteredEspecies = especies.filter(esp =>
        esp.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (esp.nome_cientifico && esp.nome_cientifico.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const getAgressividadeColor = (nivel) => {
        if (nivel <= 2) return theme.palette.success.main;
        if (nivel === 3) return theme.palette.warning.main;
        return theme.palette.error.main;
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
                    Espécies de Abelhas
                </Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
                    Nova Espécie
                </Button>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <TextField
                fullWidth
                placeholder="Buscar espécies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ mb: 3 }}
                InputProps={{
                    startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>,
                }}
            />

            <Grid container spacing={3}>
                {filteredEspecies.map((especie) => (
                    <Grid item xs={12} sm={6} md={4} key={especie.id}>
                        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <Box
                                sx={{
                                    height: 8,
                                    background: especie.cor_identificacao || theme.palette.primary.main,
                                }}
                            />
                            <CardContent sx={{ flex: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                                    <Box
                                        sx={{
                                            width: 48,
                                            height: 48,
                                            borderRadius: 2,
                                            backgroundColor: alpha(especie.cor_identificacao || theme.palette.primary.main, 0.15),
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            mr: 2,
                                        }}
                                    >
                                        <BugIcon sx={{ color: especie.cor_identificacao || theme.palette.primary.main }} />
                                    </Box>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                            {especie.nome}
                                        </Typography>
                                        {especie.nome_cientifico && (
                                            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                                {especie.nome_cientifico}
                                            </Typography>
                                        )}
                                    </Box>
                                </Box>

                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        Agressividade
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Rating
                                            value={especie.nivel_agressividade}
                                            max={5}
                                            readOnly
                                            size="small"
                                            sx={{
                                                '& .MuiRating-iconFilled': {
                                                    color: getAgressividadeColor(especie.nivel_agressividade),
                                                },
                                            }}
                                        />
                                        <Chip
                                            label={agressividadeLabels[especie.nivel_agressividade]}
                                            size="small"
                                            sx={{
                                                backgroundColor: alpha(getAgressividadeColor(especie.nivel_agressividade), 0.15),
                                                color: getAgressividadeColor(especie.nivel_agressividade),
                                            }}
                                        />
                                    </Box>
                                </Box>

                                {especie.producao_media_anual_kg && (
                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            Produção Média Anual
                                        </Typography>
                                        <Typography variant="h6" color="primary" sx={{ fontWeight: 600 }}>
                                            {especie.producao_media_anual_kg} kg
                                        </Typography>
                                    </Box>
                                )}

                                {especie.descricao && (
                                    <Typography variant="body2" color="text.secondary" sx={{
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        display: '-webkit-box',
                                        WebkitLineClamp: 3,
                                        WebkitBoxOrient: 'vertical',
                                    }}>
                                        {especie.descricao}
                                    </Typography>
                                )}
                            </CardContent>

                            <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
                                <IconButton
                                    size="small"
                                    onClick={() => handleOpenDialog(especie)}
                                    sx={{ color: theme.palette.primary.main }}
                                >
                                    <EditIcon />
                                </IconButton>
                                <IconButton
                                    size="small"
                                    onClick={() => setDeleteConfirm({ open: true, id: especie.id, nome: especie.nome })}
                                    sx={{ color: theme.palette.error.main }}
                                >
                                    <DeleteIcon />
                                </IconButton>
                            </CardActions>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {filteredEspecies.length === 0 && !loading && (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                    <BugIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                        {searchTerm ? 'Nenhuma espécie encontrada' : 'Nenhuma espécie cadastrada'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        {searchTerm ? 'Tente uma busca diferente' : 'Clique no botão acima para adicionar uma espécie'}
                    </Typography>
                </Box>
            )}

            {/* Dialog de Criação/Edição */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <form onSubmit={handleSubmit}>
                    <DialogTitle>{editingId ? 'Editar Espécie' : 'Nova Espécie'}</DialogTitle>
                    <DialogContent>
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Nome Popular"
                                    name="nome"
                                    value={formData.nome}
                                    onChange={handleChange}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Nome Científico"
                                    name="nome_cientifico"
                                    value={formData.nome_cientifico}
                                    onChange={handleChange}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Nível de Agressividade</InputLabel>
                                    <Select
                                        name="nivel_agressividade"
                                        value={formData.nivel_agressividade}
                                        onChange={handleChange}
                                        label="Nível de Agressividade"
                                    >
                                        {[1, 2, 3, 4, 5].map(n => (
                                            <MenuItem key={n} value={n}>{n} - {agressividadeLabels[n]}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Produção Média Anual (kg)"
                                    name="producao_media_anual_kg"
                                    type="number"
                                    value={formData.producao_media_anual_kg}
                                    onChange={handleChange}
                                    inputProps={{ step: '0.01', min: '0' }}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <TextField
                                        label="Cor de Identificação"
                                        name="cor_identificacao"
                                        type="color"
                                        value={formData.cor_identificacao}
                                        onChange={handleChange}
                                        sx={{ width: 120 }}
                                        InputLabelProps={{ shrink: true }}
                                    />
                                    <Box
                                        sx={{
                                            width: 40,
                                            height: 40,
                                            borderRadius: 1,
                                            backgroundColor: formData.cor_identificacao,
                                            border: '1px solid',
                                            borderColor: 'divider',
                                        }}
                                    />
                                </Box>
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
                                    label="Características"
                                    name="caracteristicas"
                                    value={formData.caracteristicas}
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
                            {saving ? <CircularProgress size={24} /> : editingId ? 'Salvar' : 'Criar'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* Dialog de Confirmação de Exclusão */}
            <Dialog open={deleteConfirm.open} onClose={() => setDeleteConfirm({ open: false, id: null, nome: '' })}>
                <DialogTitle>Confirmar Exclusão</DialogTitle>
                <DialogContent>
                    <Typography>Tem certeza que deseja excluir a espécie <strong>{deleteConfirm.nome}</strong>?</Typography>
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
