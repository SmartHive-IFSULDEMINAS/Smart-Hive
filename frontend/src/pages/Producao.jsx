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
    Grid,
    FormControl,
    InputLabel,
    Select,
    Card,
    CardContent,
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
    LocalFlorist as HoneyIcon,
    TrendingUp as TrendingIcon,
    MoreVert as MoreVertIcon,
    FilterList as FilterListIcon,
    FileDownload as FileDownloadIcon,
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
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
} from 'recharts';
import { tint } from '../theme';

const qualidadeOptions = [
    { value: 'extra', label: 'Extra', color: 'var(--chart-green)' },
    { value: 'primeira', label: 'Primeira', color: 'var(--chart-blue)' },
    { value: 'segunda', label: 'Segunda', color: 'var(--chart-orange)' },
    { value: 'industrial', label: 'Industrial', color: 'var(--chart-gray)' },
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

const COLORS = ['var(--chart-green)', 'var(--chart-blue)', 'var(--chart-orange)', 'var(--chart-gray)', 'var(--chart-red)', 'var(--chart-purple)'];

const darkTooltipStyle = {
    background: 'var(--chart-tooltip-bg)',
    border: '1px solid var(--chart-tooltip-border)',
    borderRadius: 10,
    fontSize: 13,
};

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
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [filterQualidade, setFilterQualidade] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null });
    const [actionMenu, setActionMenu] = useState({ anchor: null, prod: null });

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

    const filteredProducoes = producoes.filter(prod => {
        const matchesSearch = prod.colmeia_identificador.toLowerCase().includes(searchTerm.toLowerCase()) ||
            prod.apiario_nome.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesQualidade = !filterQualidade || prod.qualidade === filterQualidade;
        return matchesSearch && matchesQualidade;
    });

    const getQualidadeChip = (qualidade) => {
        const option = qualidadeOptions.find(o => o.value === qualidade);
        return option ? (
            <Chip label={option.label} size="small" sx={{ bgcolor: tint(option.color, 0.15), color: option.color }} />
        ) : qualidade;
    };

    const closeActionMenu = () => setActionMenu({ anchor: null, prod: null });

    const totalKg = parseFloat(relatorio?.total?.total_kg || 0);
    const totalRegistros = relatorio?.total?.total_registros || 0;
    const mediaKg = totalRegistros ? (totalKg / totalRegistros).toFixed(1) : 0;

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
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {/* Toolbar */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2.5, gap: 1, flexWrap: 'wrap' }}>
                <HoneyIcon sx={{ color: 'primary.main' }} />
                <Typography variant="h5" fontWeight={700} sx={{ flex: 1, minWidth: 120 }}>Produção de Mel</Typography>
                <TextField
                    placeholder="Buscar por colmeia ou apiário..."
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
                    size="small"
                    sx={{ width: { xs: '100%', sm: 240 } }}
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
                    Registrar Colheita
                </Button>
            </Box>

            {/* Summary cards */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                {[
                    { label: 'Produção Total', value: loading ? null : `${totalKg.toFixed(1)} kg`, icon: <HoneyIcon />, color: theme.palette.primary.main },
                    { label: 'Total de Colheitas', value: loading ? null : totalRegistros, icon: <TrendingIcon />, color: 'var(--chart-blue)' },
                    { label: 'Média por Colheita', value: loading ? null : `${mediaKg} kg`, icon: <HoneyIcon />, color: 'var(--chart-green)' },
                ].map((stat, i) => (
                    <Grid size={{ xs: 12, sm: 4 }} key={i}>
                        <Card sx={{ position: 'relative', overflow: 'hidden', '&::before': { content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: stat.color } }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                                    <Box>
                                        <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.7rem', letterSpacing: 1 }}>{stat.label}</Typography>
                                        {stat.value === null
                                            ? <Skeleton width={80} height={40} />
                                            : <Typography variant="h4" fontWeight={700} color="text.primary">{stat.value}</Typography>
                                        }
                                    </Box>
                                    <Box sx={{ width: 34, height: 34, borderRadius: 1.5, bgcolor: tint(stat.color, 0.12), display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color }}>
                                        {stat.icon}
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Charts */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Card>
                        <CardContent>
                            <Typography variant="subtitle1" fontWeight={600} gutterBottom>Produção por Tipo de Mel</Typography>
                            <Box sx={{ height: 220 }}>
                                {loading ? (
                                    <Skeleton variant="rectangular" height="100%" sx={{ borderRadius: 1 }} />
                                ) : porTipoData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={porTipoData} layout="vertical">
                                            <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="0" horizontal={false} />
                                            <XAxis type="number" unit=" kg" tick={{ fill: 'var(--chart-text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} />
                                            <YAxis type="category" dataKey="name" width={110} tick={{ fill: 'var(--chart-text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} />
                                            <RechartsTooltip
                                                formatter={(v) => [`${v} kg`, 'Produção']}
                                                contentStyle={darkTooltipStyle}
                                                labelStyle={{ color: 'var(--chart-text)', fontWeight: 600 }}
                                                itemStyle={{ color: 'var(--chart-text-secondary)' }}
                                            />
                                            <Bar dataKey="value" fill={theme.palette.primary.main} radius={[0, 4, 4, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                                        <Typography variant="body2" color="text.secondary">Nenhum dado disponível</Typography>
                                    </Box>
                                )}
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Card>
                        <CardContent>
                            <Typography variant="subtitle1" fontWeight={600} gutterBottom>Produção por Qualidade</Typography>
                            <Box sx={{ height: 220 }}>
                                {loading ? (
                                    <Skeleton variant="rectangular" height="100%" sx={{ borderRadius: 1 }} />
                                ) : porQualidadeData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={porQualidadeData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value">
                                                {porQualidadeData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip
                                                formatter={(v) => [`${v} kg`, 'Produção']}
                                                contentStyle={darkTooltipStyle}
                                                labelStyle={{ color: 'var(--chart-text)', fontWeight: 600 }}
                                                itemStyle={{ color: 'var(--chart-text-secondary)' }}
                                            />
                                            <Legend wrapperStyle={{ fontSize: 12, color: 'var(--chart-text-secondary)' }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                                        <Typography variant="body2" color="text.secondary">Nenhum dado disponível</Typography>
                                    </Box>
                                )}
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Collapsible filter */}
            <Collapse in={filtersOpen}>
                <Paper sx={{ p: 2, mb: 2, border: '1px solid', borderColor: 'divider' }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid size={{ xs: 12, sm: 5 }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Qualidade</InputLabel>
                                <Select value={filterQualidade} onChange={(e) => { setFilterQualidade(e.target.value); setPage(0); }} label="Qualidade">
                                    <MenuItem value="">Todas</MenuItem>
                                    {qualidadeOptions.map(opt => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Grid>
                        {filterQualidade && (
                            <Grid size={{ xs: 12, sm: 3 }}>
                                <Button size="small" variant="outlined" onClick={() => { setFilterQualidade(''); setPage(0); }} fullWidth>Limpar</Button>
                            </Grid>
                        )}
                    </Grid>
                </Paper>
            </Collapse>

            {/* Active filter chips */}
            {(searchTerm || filterQualidade) && (
                <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                    {searchTerm && <Chip label={`Busca: "${searchTerm}"`} size="small" onDelete={() => { setSearchTerm(''); setPage(0); }} variant="outlined" />}
                    {filterQualidade && <Chip label={`Qualidade: ${qualidadeOptions.find(o => o.value === filterQualidade)?.label}`} size="small" onDelete={() => { setFilterQualidade(''); setPage(0); }} variant="outlined" />}
                </Box>
            )}

            {/* Table */}
            <Paper sx={{ border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
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
                                <TableCell align="center" sx={{ width: 48 }}>Ações</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading
                                ? Array.from({ length: rowsPerPage }).map((_, i) => (
                                    <TableRow key={i}>
                                        {[1,2,3,4,5,6,7].map(c => <TableCell key={c}><Skeleton height={20} /></TableCell>)}
                                    </TableRow>
                                ))
                                : filteredProducoes
                                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                    .map((prod) => (
                                        <TableRow key={prod.id} hover>
                                            <TableCell><Typography variant="body2">{new Date(prod.data_colheita).toLocaleDateString('pt-BR')}</Typography></TableCell>
                                            <TableCell><Typography variant="body2" fontWeight={600}>{prod.colmeia_identificador}</Typography></TableCell>
                                            <TableCell><Typography variant="body2">{prod.apiario_nome}</Typography></TableCell>
                                            <TableCell align="right">
                                                <Typography variant="body2" fontWeight={600} color="primary.main">{prod.quantidade_kg} kg</Typography>
                                            </TableCell>
                                            <TableCell><Typography variant="body2">{tipoMelOptions.find(o => o.value === prod.tipo_mel)?.label || prod.tipo_mel}</Typography></TableCell>
                                            <TableCell>{getQualidadeChip(prod.qualidade)}</TableCell>
                                            <TableCell align="center" sx={{ p: '4px' }}>
                                                <IconButton size="small" onClick={(e) => setActionMenu({ anchor: e.currentTarget, prod })} sx={{ color: 'text.disabled' }}>
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
                    count={filteredProducoes.length}
                    page={page}
                    onPageChange={(e, newPage) => setPage(newPage)}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                    labelRowsPerPage="Linhas:"
                    labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
                />
            </Paper>

            {/* Empty state */}
            {filteredProducoes.length === 0 && !loading && (
                <Box sx={{ textAlign: 'center', py: 10, mt: 1, borderRadius: 2, border: '1px dashed', borderColor: 'divider' }}>
                    <HoneyIcon sx={{ fontSize: 52, color: tint(theme.palette.primary.main, 0.25), mb: 2 }} />
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                        {(searchTerm || filterQualidade) ? 'Nenhum registro encontrado para os filtros aplicados' : 'Nenhum registro de produção'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        {(searchTerm || filterQualidade) ? 'Tente ajustar os filtros' : 'Comece registrando a primeira colheita'}
                    </Typography>
                    {!(searchTerm || filterQualidade) && (
                        <Button variant="outlined" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>Registrar Colheita</Button>
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
                <MenuItem onClick={() => { handleOpenDialog(actionMenu.prod); closeActionMenu(); }}>
                    <EditIcon fontSize="small" sx={{ mr: 1.5, color: 'primary.main' }} /> Editar
                </MenuItem>
                <Divider />
                <MenuItem sx={{ color: 'error.main' }} onClick={() => { setDeleteConfirm({ open: true, id: actionMenu.prod.id }); closeActionMenu(); }}>
                    <DeleteIcon fontSize="small" sx={{ mr: 1.5 }} /> Excluir
                </MenuItem>
            </MuiMenu>

            {/* Dialog de Criação/Edição */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <form onSubmit={handleSubmit}>
                    <DialogTitle>{editingId ? 'Editar Produção' : 'Registrar Colheita'}</DialogTitle>
                    <DialogContent>
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid size={12}>
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
                                <TextField
                                    fullWidth label="Data da Colheita" name="data_colheita" type="date"
                                    value={formData.data_colheita} onChange={handleChange}
                                    InputLabelProps={{ shrink: true }} required
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth label="Quantidade (kg)" name="quantidade_kg" type="number"
                                    value={formData.quantidade_kg} onChange={handleChange}
                                    inputProps={{ step: '0.01', min: '0' }} required
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <FormControl fullWidth>
                                    <InputLabel>Tipo de Mel</InputLabel>
                                    <Select name="tipo_mel" value={formData.tipo_mel} onChange={handleChange} label="Tipo de Mel">
                                        {tipoMelOptions.map(opt => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <FormControl fullWidth>
                                    <InputLabel>Qualidade</InputLabel>
                                    <Select name="qualidade" value={formData.qualidade} onChange={handleChange} label="Qualidade">
                                        {qualidadeOptions.map(opt => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField fullWidth label="Quadros Colhidos" name="numero_quadros_colhidos" type="number" value={formData.numero_quadros_colhidos} onChange={handleChange} />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField fullWidth label="Umidade do Mel (%)" name="umidade_mel" type="number" value={formData.umidade_mel} onChange={handleChange} inputProps={{ step: '0.1' }} />
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
