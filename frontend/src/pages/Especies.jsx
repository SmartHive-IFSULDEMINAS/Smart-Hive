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
    Skeleton,
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

    return (
        <Box>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {/* Toolbar */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1, flexWrap: 'wrap' }}>
                <BugIcon sx={{ color: 'primary.main' }} />
                <Typography variant="h5" fontWeight={700} sx={{ flex: 1, minWidth: 100 }}>Espécies de Abelhas</Typography>
                <TextField
                    placeholder="Buscar espécies..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    size="small"
                    sx={{ width: { xs: '100%', sm: 220 } }}
                    slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: 'text.disabled' }} /></InputAdornment> } }}
                />
                <Button variant="contained" startIcon={<AddIcon />} size="small" onClick={() => handleOpenDialog()}>
                    Nova Espécie
                </Button>
            </Box>

            {/* Card grid */}
            <Grid container spacing={2.5}>
                {loading
                    ? Array.from({ length: 6 }).map((_, i) => (
                        <Grid item xs={12} sm={6} md={4} key={i}>
                            <Card sx={{ border: '1px solid', borderColor: 'divider' }}>
                                <Skeleton variant="rectangular" height={8} />
                                <CardContent>
                                    <Box sx={{ display: 'flex', mb: 2 }}>
                                        <Skeleton variant="rounded" width={48} height={48} sx={{ mr: 2, borderRadius: 2 }} />
                                        <Box sx={{ flex: 1 }}>
                                            <Skeleton width="55%" height={24} />
                                            <Skeleton width="75%" height={18} />
                                        </Box>
                                    </Box>
                                    <Skeleton height={16} sx={{ mb: 1 }} />
                                    <Skeleton width="50%" height={16} />
                                </CardContent>
                            </Card>
                        </Grid>
                    ))
                    : filteredEspecies.map((especie) => (
                        <Grid item xs={12} sm={6} md={4} key={especie.id}>
                            <Card sx={{
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                border: '1px solid',
                                borderColor: 'divider',
                                transition: 'border-color 0.2s',
                                '&:hover': { borderColor: 'primary.main' },
                            }}>
                                <Box sx={{ height: 4, background: especie.cor_identificacao || theme.palette.primary.main }} />
                                <CardContent sx={{ flex: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                                        <Box sx={{
                                            width: 44, height: 44, borderRadius: 2,
                                            bgcolor: alpha(especie.cor_identificacao || theme.palette.primary.main, 0.15),
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 1.5, flexShrink: 0,
                                        }}>
                                            <BugIcon sx={{ color: especie.cor_identificacao || 'primary.main', fontSize: 22 }} />
                                        </Box>
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <Typography variant="subtitle1" fontWeight={600} sx={{ lineHeight: 1.2 }}>{especie.nome}</Typography>
                                            {especie.nome_cientifico && (
                                                <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                                    {especie.nome_cientifico}
                                                </Typography>
                                            )}
                                        </Box>
                                    </Box>

                                    <Box sx={{ mb: 1.5 }}>
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>Agressividade</Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Rating
                                                value={especie.nivel_agressividade}
                                                max={5}
                                                readOnly
                                                size="small"
                                                sx={{ '& .MuiRating-iconFilled': { color: getAgressividadeColor(especie.nivel_agressividade) } }}
                                            />
                                            <Chip
                                                label={agressividadeLabels[especie.nivel_agressividade]}
                                                size="small"
                                                sx={{
                                                    bgcolor: alpha(getAgressividadeColor(especie.nivel_agressividade), 0.15),
                                                    color: getAgressividadeColor(especie.nivel_agressividade),
                                                    height: 20, fontSize: '0.7rem',
                                                }}
                                            />
                                        </Box>
                                    </Box>

                                    {especie.producao_media_anual_kg && (
                                        <Box sx={{ mb: 1.5 }}>
                                            <Typography variant="caption" color="text.secondary">Produção Média Anual</Typography>
                                            <Typography variant="h6" color="primary.main" fontWeight={600}>
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

                                <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 1.5, pt: 0 }}>
                                    <IconButton size="small" onClick={() => handleOpenDialog(especie)} sx={{ color: 'primary.main' }}>
                                        <EditIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton size="small" onClick={() => setDeleteConfirm({ open: true, id: especie.id, nome: especie.nome })} sx={{ color: 'error.main' }}>
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                </CardActions>
                            </Card>
                        </Grid>
                    ))
                }
            </Grid>

            {/* Empty state */}
            {filteredEspecies.length === 0 && !loading && (
                <Box sx={{ textAlign: 'center', py: 10, borderRadius: 2, border: '1px dashed', borderColor: 'divider' }}>
                    <BugIcon sx={{ fontSize: 52, color: alpha(theme.palette.primary.main, 0.25), mb: 2 }} />
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                        {searchTerm ? 'Nenhuma espécie encontrada' : 'Nenhuma espécie cadastrada'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        {searchTerm ? 'Tente uma busca diferente' : 'Comece adicionando uma espécie de abelha'}
                    </Typography>
                    {!searchTerm && (
                        <Button variant="outlined" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>Nova Espécie</Button>
                    )}
                </Box>
            )}

            {/* Dialog de Criação/Edição */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <form onSubmit={handleSubmit}>
                    <DialogTitle>{editingId ? 'Editar Espécie' : 'Nova Espécie'}</DialogTitle>
                    <DialogContent>
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={12}>
                                <TextField fullWidth label="Nome Popular" name="nome" value={formData.nome} onChange={handleChange} required />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField fullWidth label="Nome Científico" name="nome_cientifico" value={formData.nome_cientifico} onChange={handleChange} />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Nível de Agressividade</InputLabel>
                                    <Select name="nivel_agressividade" value={formData.nivel_agressividade} onChange={handleChange} label="Nível de Agressividade">
                                        {[1, 2, 3, 4, 5].map(n => (
                                            <MenuItem key={n} value={n}>{n} - {agressividadeLabels[n]}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth label="Produção Média Anual (kg)" name="producao_media_anual_kg" type="number"
                                    value={formData.producao_media_anual_kg} onChange={handleChange}
                                    slotProps={{ input: { step: '0.01', min: '0' } }}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <TextField
                                        label="Cor de Identificação" name="cor_identificacao" type="color"
                                        value={formData.cor_identificacao} onChange={handleChange}
                                        sx={{ width: 120 }} slotProps={{ inputLabel: { shrink: true } }}
                                    />
                                    <Box sx={{ width: 40, height: 40, borderRadius: 1, bgcolor: formData.cor_identificacao, border: '1px solid', borderColor: 'divider' }} />
                                    <Typography variant="caption" color="text.secondary">{formData.cor_identificacao}</Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12}>
                                <TextField fullWidth label="Descrição" name="descricao" value={formData.descricao} onChange={handleChange} multiline rows={2} />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField fullWidth label="Características" name="caracteristicas" value={formData.caracteristicas} onChange={handleChange} multiline rows={2} />
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
