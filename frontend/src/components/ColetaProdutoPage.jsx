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
    Tooltip,
    Menu as MuiMenu,
    Divider,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Search as SearchIcon,
    TrendingUp as TrendingIcon,
    MoreVert as MoreVertIcon,
    FileDownload as FileDownloadIcon,
} from '@mui/icons-material';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
} from 'recharts';
import {
    getColetasProduto,
    createColetaProduto,
    updateColetaProduto,
    deleteColetaProduto,
    exportColetasProduto,
    getColmeias,
} from '../services/api';
import { tint } from '../theme';

const darkTooltipStyle = {
    background: 'var(--chart-tooltip-bg)',
    border: '1px solid var(--chart-tooltip-border)',
    borderRadius: 10,
    fontSize: 13,
};

const buildInitialFormData = () => ({
    colmeia: '',
    data_coleta: new Date().toISOString().split('T')[0],
    quantidade_g: '',
    observacoes: '',
});

export default function ColetaProdutoPage({ tipoProduto, titulo, icone }) {
    const theme = useTheme();
    const [coletas, setColetas] = useState([]);
    const [colmeias, setColmeias] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState(buildInitialFormData());
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null });
    const [actionMenu, setActionMenu] = useState({ anchor: null, coleta: null });
    const [exportMenuAnchor, setExportMenuAnchor] = useState(null);
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tipoProduto]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [coletasRes, colmeiasRes] = await Promise.all([
                getColetasProduto({ tipo_produto: tipoProduto }),
                getColmeias(),
            ]);
            setColetas(coletasRes.data.results || coletasRes.data);
            setColmeias(colmeiasRes.data.results || colmeiasRes.data);
            setError(null);
        } catch (err) {
            setError('Erro ao carregar dados');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (coleta = null) => {
        if (coleta) {
            setEditingId(coleta.id);
            setFormData({
                colmeia: coleta.colmeia,
                data_coleta: coleta.data_coleta,
                quantidade_g: coleta.quantidade_g,
                observacoes: coleta.observacoes || '',
            });
        } else {
            setEditingId(null);
            setFormData(buildInitialFormData());
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingId(null);
        setFormData(buildInitialFormData());
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            const dataToSend = { ...formData, tipo_produto: tipoProduto };

            if (editingId) {
                await updateColetaProduto(editingId, dataToSend);
                setSnackbar({ open: true, message: 'Coleta atualizada com sucesso!', severity: 'success' });
            } else {
                await createColetaProduto(dataToSend);
                setSnackbar({ open: true, message: 'Coleta registrada com sucesso!', severity: 'success' });
            }
            handleCloseDialog();
            fetchData();
        } catch (err) {
            setSnackbar({ open: true, message: 'Erro ao salvar coleta', severity: 'error' });
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        try {
            await deleteColetaProduto(deleteConfirm.id);
            setSnackbar({ open: true, message: 'Coleta excluída com sucesso!', severity: 'success' });
            setDeleteConfirm({ open: false, id: null });
            fetchData();
        } catch (err) {
            setSnackbar({ open: true, message: 'Erro ao excluir coleta', severity: 'error' });
            console.error(err);
        }
    };

    const handleExport = async (format) => {
        setExportMenuAnchor(null);
        try {
            setExporting(true);
            const response = await exportColetasProduto({ tipo_produto: tipoProduto, format });
            const blob = new Blob([response.data]);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            const extensao = format === 'pdf' ? 'pdf' : 'xlsx';
            link.href = url;
            link.download = `coletas_${tipoProduto}_${new Date().toISOString().split('T')[0]}.${extensao}`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            setSnackbar({ open: true, message: 'Erro ao gerar relatório', severity: 'error' });
            console.error(err);
        } finally {
            setExporting(false);
        }
    };

    const filteredColetas = coletas.filter(coleta => {
        const identificador = coleta.colmeia_identificador || '';
        const apiario = coleta.apiario_nome || '';
        return identificador.toLowerCase().includes(searchTerm.toLowerCase()) ||
            apiario.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const porMesData = Object.values(
        coletas.reduce((acc, item) => {
            const data = new Date(item.data_coleta);
            const chave = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
            if (!acc[chave]) {
                acc[chave] = {
                    chave,
                    mes: data.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
                    quantidade: 0,
                };
            }
            acc[chave].quantidade += parseFloat(item.quantidade_g || 0);
            return acc;
        }, {})
    ).sort((a, b) => a.chave.localeCompare(b.chave));

    const closeActionMenu = () => setActionMenu({ anchor: null, coleta: null });

    const totalG = coletas.reduce((acc, item) => acc + parseFloat(item.quantidade_g || 0), 0);
    const totalRegistros = coletas.length;
    const mediaG = totalRegistros ? (totalG / totalRegistros).toFixed(1) : 0;

    return (
        <Box>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {/* Toolbar */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2.5, gap: 1, flexWrap: 'wrap' }}>
                {icone}
                <Typography variant="h5" fontWeight={700} sx={{ flex: 1, minWidth: 120 }}>{titulo}</Typography>
                <TextField
                    placeholder="Buscar por colmeia ou apiário..."
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
                    size="small"
                    sx={{ width: { xs: '100%', sm: 240 } }}
                    InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: 'text.disabled' }} /></InputAdornment> }}
                />
                <Tooltip title="Exportar relatório">
                    <IconButton
                        size="small"
                        onClick={(e) => setExportMenuAnchor(e.currentTarget)}
                        disabled={exporting}
                        sx={{ border: '1px solid', borderColor: 'divider' }}
                    >
                        <FileDownloadIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
                <MuiMenu anchorEl={exportMenuAnchor} open={Boolean(exportMenuAnchor)} onClose={() => setExportMenuAnchor(null)}>
                    <MenuItem onClick={() => handleExport('excel')}>Exportar Excel</MenuItem>
                    <MenuItem onClick={() => handleExport('pdf')}>Exportar PDF</MenuItem>
                </MuiMenu>
                <Button variant="contained" startIcon={<AddIcon />} size="small" onClick={() => handleOpenDialog()}>
                    Registrar Coleta
                </Button>
            </Box>

            {/* Summary cards */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                {[
                    { label: 'Total Coletado', value: loading ? null : `${totalG.toFixed(1)} g`, icon: icone, color: theme.palette.primary.main },
                    { label: 'Total de Coletas', value: loading ? null : totalRegistros, icon: <TrendingIcon />, color: 'var(--chart-blue)' },
                    { label: 'Média por Coleta', value: loading ? null : `${mediaG} g`, icon: icone, color: 'var(--chart-green)' },
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

            {/* Chart: coletas por mês */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>Coletas por Mês</Typography>
                    <Box sx={{ height: 220 }}>
                        {loading ? (
                            <Skeleton variant="rectangular" height="100%" sx={{ borderRadius: 1 }} />
                        ) : porMesData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={porMesData}>
                                    <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="0" vertical={false} />
                                    <XAxis dataKey="mes" tick={{ fill: 'var(--chart-text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <YAxis unit=" g" tick={{ fill: 'var(--chart-text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <RechartsTooltip
                                        formatter={(v) => [`${v.toFixed(1)} g`, 'Quantidade']}
                                        contentStyle={darkTooltipStyle}
                                        labelStyle={{ color: 'var(--chart-text)', fontWeight: 600 }}
                                        itemStyle={{ color: 'var(--chart-text-secondary)' }}
                                    />
                                    <Bar dataKey="quantidade" fill={theme.palette.primary.main} radius={[4, 4, 0, 0]} />
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

            {/* Active filter chips */}
            {searchTerm && (
                <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                    <Chip label={`Busca: "${searchTerm}"`} size="small" onDelete={() => { setSearchTerm(''); setPage(0); }} variant="outlined" />
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
                                <TableCell>Observações</TableCell>
                                <TableCell align="center" sx={{ width: 48 }}>Ações</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading
                                ? Array.from({ length: rowsPerPage }).map((_, i) => (
                                    <TableRow key={i}>
                                        {[1, 2, 3, 4, 5, 6].map(c => <TableCell key={c}><Skeleton height={20} /></TableCell>)}
                                    </TableRow>
                                ))
                                : filteredColetas
                                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                    .map((coleta) => (
                                        <TableRow key={coleta.id} hover>
                                            <TableCell><Typography variant="body2">{new Date(coleta.data_coleta).toLocaleDateString('pt-BR')}</Typography></TableCell>
                                            <TableCell><Typography variant="body2" fontWeight={600}>{coleta.colmeia_identificador}</Typography></TableCell>
                                            <TableCell><Typography variant="body2">{coleta.apiario_nome}</Typography></TableCell>
                                            <TableCell align="right">
                                                <Typography variant="body2" fontWeight={600} color="primary.main">{coleta.quantidade_g} g</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 220 }}>
                                                    {coleta.observacoes || '—'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="center" sx={{ p: '4px' }}>
                                                <IconButton size="small" onClick={(e) => setActionMenu({ anchor: e.currentTarget, coleta })} sx={{ color: 'text.disabled' }}>
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
                    count={filteredColetas.length}
                    page={page}
                    onPageChange={(e, newPage) => setPage(newPage)}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                    labelRowsPerPage="Linhas:"
                    labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
                />
            </Paper>

            {/* Empty state */}
            {filteredColetas.length === 0 && !loading && (
                <Box sx={{ textAlign: 'center', py: 10, mt: 1, borderRadius: 2, border: '1px dashed', borderColor: 'divider' }}>
                    <Box sx={{ fontSize: 52, color: tint(theme.palette.primary.main, 0.25), mb: 2, display: 'flex', justifyContent: 'center', '& svg': { fontSize: 52 } }}>
                        {icone}
                    </Box>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                        {searchTerm ? 'Nenhum registro encontrado para os filtros aplicados' : 'Nenhum registro de coleta'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        {searchTerm ? 'Tente ajustar os filtros' : 'Comece registrando a primeira coleta'}
                    </Typography>
                    {!searchTerm && (
                        <Button variant="outlined" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>Registrar Coleta</Button>
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
                <MenuItem onClick={() => { handleOpenDialog(actionMenu.coleta); closeActionMenu(); }}>
                    <EditIcon fontSize="small" sx={{ mr: 1.5, color: 'primary.main' }} /> Editar
                </MenuItem>
                <Divider />
                <MenuItem sx={{ color: 'error.main' }} onClick={() => { setDeleteConfirm({ open: true, id: actionMenu.coleta.id }); closeActionMenu(); }}>
                    <DeleteIcon fontSize="small" sx={{ mr: 1.5 }} /> Excluir
                </MenuItem>
            </MuiMenu>

            {/* Dialog de Criação/Edição */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <form onSubmit={handleSubmit}>
                    <DialogTitle>{editingId ? 'Editar Coleta' : 'Registrar Coleta'}</DialogTitle>
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
                                    fullWidth label="Data da Coleta" name="data_coleta" type="date"
                                    value={formData.data_coleta} onChange={handleChange}
                                    InputLabelProps={{ shrink: true }} required
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth label="Quantidade (g)" name="quantidade_g" type="number"
                                    value={formData.quantidade_g} onChange={handleChange}
                                    inputProps={{ step: '0.01', min: '0' }} required
                                />
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
                <DialogContent><Typography>Tem certeza que deseja excluir este registro de coleta?</Typography></DialogContent>
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
