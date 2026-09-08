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
    Grid,
    FormControl,
    InputLabel,
    Select,
    Card,
    CardContent,
    Tabs,
    Tab,
    Menu as MuiMenu,
    Divider,
    useTheme,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Search as SearchIcon,
    MoreVert as MoreVertIcon,
    AttachMoney as FinanceiroIcon,
    TrendingDown as CustoIcon,
    TrendingUp as ReceitaIcon,
    Lock as LockIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import {
    getCustos, createCusto, updateCusto, deleteCusto,
    getReceitas, createReceita, updateReceita, deleteReceita,
    getApiarios, getColmeias,
} from '../services/api';

const TIPO_CUSTO_OPTIONS = [
    { value: 'equipamento', label: 'Equipamento' },
    { value: 'medicamento', label: 'Medicamento' },
    { value: 'alimentacao', label: 'Alimentação' },
    { value: 'manutencao', label: 'Manutenção' },
    { value: 'transporte', label: 'Transporte' },
    { value: 'energia', label: 'Energia' },
    { value: 'agua', label: 'Água' },
    { value: 'outro', label: 'Outro' },
];

const TIPO_RECEITA_OPTIONS = [
    { value: 'venda_mel', label: 'Venda de Mel' },
    { value: 'venda_propolis', label: 'Venda de Própolis' },
    { value: 'venda_cera', label: 'Venda de Cera' },
    { value: 'venda_abelhas', label: 'Venda de Abelhas' },
    { value: 'servico_polinizacao', label: 'Serviço de Polinização' },
    { value: 'outro', label: 'Outro' },
];

const buildInitialCusto = () => ({
    descricao: '', tipo_custo: 'outro', valor: '', data: new Date().toISOString().split('T')[0],
    apiario: '', colmeia: '', fornecedor: '', nota_fiscal: '', observacoes: '',
});

const buildInitialReceita = () => ({
    descricao: '', tipo_receita: 'outro', valor: '', data: new Date().toISOString().split('T')[0],
    cliente: '', quantidade_kg: '', preco_unitario: '', observacoes: '',
});

export default function Financeiro() {
    const theme = useTheme();
    const { canViewReports } = useAuth();
    const [aba, setAba] = useState('custos');
    const [custos, setCustos] = useState([]);
    const [receitas, setReceitas] = useState([]);
    const [apiarios, setApiarios] = useState([]);
    const [colmeias, setColmeias] = useState([]);
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formCusto, setFormCusto] = useState(buildInitialCusto());
    const [formReceita, setFormReceita] = useState(buildInitialReceita());
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null });
    const [actionMenu, setActionMenu] = useState({ anchor: null, item: null });

    const isCustos = aba === 'custos';

    useEffect(() => {
        if (canViewReports) fetchData();
        else setLoading(false);
    }, [canViewReports]);

    useEffect(() => {
        setPage(0);
        setSearchTerm('');
    }, [aba]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [custosRes, receitasRes, apiariosRes, colmeiasRes] = await Promise.all([
                getCustos(), getReceitas(), getApiarios(), getColmeias(),
            ]);
            setCustos(custosRes.data.results || custosRes.data);
            setReceitas(receitasRes.data.results || receitasRes.data);
            setApiarios(apiariosRes.data.results || apiariosRes.data);
            setColmeias(colmeiasRes.data.results || colmeiasRes.data);
            setErro(null);
        } catch (err) {
            setErro('Erro ao carregar dados financeiros');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (item = null) => {
        if (item) {
            setEditingId(item.id);
            if (isCustos) {
                setFormCusto({
                    descricao: item.descricao, tipo_custo: item.tipo_custo, valor: item.valor, data: item.data,
                    apiario: item.apiario || '', colmeia: item.colmeia || '',
                    fornecedor: item.fornecedor || '', nota_fiscal: item.nota_fiscal || '', observacoes: item.observacoes || '',
                });
            } else {
                setFormReceita({
                    descricao: item.descricao, tipo_receita: item.tipo_receita, valor: item.valor, data: item.data,
                    cliente: item.cliente || '', quantidade_kg: item.quantidade_kg || '', preco_unitario: item.preco_unitario || '',
                    observacoes: item.observacoes || '',
                });
            }
        } else {
            setEditingId(null);
            setFormCusto(buildInitialCusto());
            setFormReceita(buildInitialReceita());
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingId(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            if (isCustos) {
                const dados = { ...formCusto, apiario: formCusto.apiario || null, colmeia: formCusto.colmeia || null };
                if (editingId) await updateCusto(editingId, dados);
                else await createCusto(dados);
            } else {
                const dados = {
                    ...formReceita,
                    quantidade_kg: formReceita.quantidade_kg || null,
                    preco_unitario: formReceita.preco_unitario || null,
                };
                if (editingId) await updateReceita(editingId, dados);
                else await createReceita(dados);
            }
            setSnackbar({ open: true, message: `${isCustos ? 'Custo' : 'Receita'} ${editingId ? 'atualizado(a)' : 'registrado(a)'} com sucesso!`, severity: 'success' });
            handleCloseDialog();
            fetchData();
        } catch (err) {
            setSnackbar({ open: true, message: err.response?.data?.error || `Erro ao salvar ${isCustos ? 'custo' : 'receita'}`, severity: 'error' });
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        try {
            if (isCustos) await deleteCusto(deleteConfirm.id);
            else await deleteReceita(deleteConfirm.id);
            setSnackbar({ open: true, message: 'Registro excluído com sucesso!', severity: 'success' });
            setDeleteConfirm({ open: false, id: null });
            fetchData();
        } catch (err) {
            setSnackbar({ open: true, message: 'Erro ao excluir registro', severity: 'error' });
            console.error(err);
        }
    };

    const closeActionMenu = () => setActionMenu({ anchor: null, item: null });

    const listaAtual = isCustos ? custos : receitas;
    const filteredLista = listaAtual.filter((item) =>
        item.descricao.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalValor = listaAtual.reduce((acc, item) => acc + parseFloat(item.valor || 0), 0);
    const totalRegistros = listaAtual.length;
    const mediaValor = totalRegistros ? (totalValor / totalRegistros).toFixed(2) : '0.00';

    const totalCustos = custos.reduce((acc, c) => acc + parseFloat(c.valor || 0), 0);
    const totalReceitas = receitas.reduce((acc, r) => acc + parseFloat(r.valor || 0), 0);
    const saldo = totalReceitas - totalCustos;

    if (!canViewReports) {
        return (
            <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
                    <FinanceiroIcon sx={{ color: 'primary.main' }} />
                    <Typography variant="h5" fontWeight={700}>Financeiro</Typography>
                </Box>
                <Alert severity="warning" icon={<LockIcon />}>
                    Acesso restrito a Donos e Gestores. Fale com um administrador do sistema se precisar de acesso.
                </Alert>
            </Box>
        );
    }

    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5, flexWrap: 'wrap' }}>
                <FinanceiroIcon sx={{ color: 'primary.main' }} />
                <Typography variant="h5" fontWeight={700} sx={{ flex: 1, minWidth: 120 }}>Financeiro</Typography>
                <TextField
                    placeholder="Buscar por descrição..."
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
                    size="small"
                    sx={{ width: { xs: '100%', sm: 220 } }}
                    InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: 'text.disabled' }} /></InputAdornment> }}
                />
                <Button variant="contained" startIcon={<AddIcon />} size="small" onClick={() => handleOpenDialog()}>
                    {isCustos ? 'Novo Custo' : 'Nova Receita'}
                </Button>
            </Box>

            {erro && <Alert severity="error" sx={{ mb: 2 }}>{erro}</Alert>}

            {/* Saldo geral */}
            <Grid container spacing={2} sx={{ mb: 2.5 }}>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <Card><CardContent>
                        <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.7rem', letterSpacing: 1 }}>Total Receitas</Typography>
                        {loading ? <Skeleton width={100} height={40} /> : <Typography variant="h5" fontWeight={700} color="success.main">R$ {totalReceitas.toFixed(2)}</Typography>}
                    </CardContent></Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <Card><CardContent>
                        <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.7rem', letterSpacing: 1 }}>Total Custos</Typography>
                        {loading ? <Skeleton width={100} height={40} /> : <Typography variant="h5" fontWeight={700} color="error.main">R$ {totalCustos.toFixed(2)}</Typography>}
                    </CardContent></Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <Card><CardContent>
                        <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.7rem', letterSpacing: 1 }}>Saldo</Typography>
                        {loading ? <Skeleton width={100} height={40} /> : (
                            <Typography variant="h5" fontWeight={700} color={saldo >= 0 ? 'success.main' : 'error.main'}>
                                R$ {saldo.toFixed(2)}
                            </Typography>
                        )}
                    </CardContent></Card>
                </Grid>
            </Grid>

            <Paper sx={{ mb: 2.5, border: '1px solid', borderColor: 'divider' }}>
                <Tabs value={aba} onChange={(_, v) => setAba(v)} sx={{ px: 1.5 }}>
                    <Tab icon={<CustoIcon fontSize="small" />} iconPosition="start" value="custos" label="Custos" />
                    <Tab icon={<ReceitaIcon fontSize="small" />} iconPosition="start" value="receitas" label="Receitas" />
                </Tabs>
            </Paper>

            {/* Summary cards da aba ativa */}
            <Grid container spacing={2} sx={{ mb: 2.5 }}>
                {[
                    { label: `Total ${isCustos ? 'Custos' : 'Receitas'}`, value: loading ? null : `R$ ${totalValor.toFixed(2)}`, color: isCustos ? theme.palette.error.main : theme.palette.success.main },
                    { label: 'Total de Registros', value: loading ? null : totalRegistros, color: '#64B5F6' },
                    { label: 'Média por Registro', value: loading ? null : `R$ ${mediaValor}`, color: '#81C784' },
                ].map((stat, i) => (
                    <Grid size={{ xs: 12, sm: 4 }} key={i}>
                        <Card sx={{ position: 'relative', overflow: 'hidden', '&::before': { content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: stat.color } }}>
                            <CardContent>
                                <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.7rem', letterSpacing: 1 }}>{stat.label}</Typography>
                                {stat.value === null ? <Skeleton width={80} height={40} /> : <Typography variant="h5" fontWeight={700}>{stat.value}</Typography>}
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Table */}
            <Paper sx={{ border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Data</TableCell>
                                <TableCell>Descrição</TableCell>
                                <TableCell>Categoria</TableCell>
                                <TableCell>{isCustos ? 'Fornecedor' : 'Cliente'}</TableCell>
                                <TableCell align="right">Valor</TableCell>
                                <TableCell align="center" sx={{ width: 48 }}>Ações</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: rowsPerPage }).map((_, i) => (
                                    <TableRow key={i}>{[1, 2, 3, 4, 5, 6].map((c) => <TableCell key={c}><Skeleton height={20} /></TableCell>)}</TableRow>
                                ))
                            ) : filteredLista.length === 0 ? (
                                <TableRow><TableCell colSpan={6}><Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>Nenhum registro encontrado</Typography></TableCell></TableRow>
                            ) : (
                                filteredLista.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((item) => (
                                    <TableRow key={item.id} hover>
                                        <TableCell>{new Date(item.data).toLocaleDateString('pt-BR')}</TableCell>
                                        <TableCell>{item.descricao}</TableCell>
                                        <TableCell>
                                            <Chip label={isCustos ? item.tipo_custo_display : item.tipo_receita_display} size="small" variant="outlined" />
                                        </TableCell>
                                        <TableCell>{isCustos ? (item.fornecedor || '—') : (item.cliente || '—')}</TableCell>
                                        <TableCell align="right">
                                            <Typography variant="body2" fontWeight={600} color={isCustos ? 'error.main' : 'success.main'}>
                                                {isCustos ? '- ' : ''}R$ {parseFloat(item.valor).toFixed(2)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="center" sx={{ p: '4px' }}>
                                            <IconButton size="small" onClick={(e) => setActionMenu({ anchor: e.currentTarget, item })} sx={{ color: 'text.disabled' }}>
                                                <MoreVertIcon fontSize="small" />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    component="div"
                    count={filteredLista.length}
                    page={page}
                    onPageChange={(e, newPage) => setPage(newPage)}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                    labelRowsPerPage="Linhas:"
                    labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
                />
            </Paper>

            {/* Action menu */}
            <MuiMenu
                anchorEl={actionMenu.anchor}
                open={Boolean(actionMenu.anchor)}
                onClose={closeActionMenu}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
                <MenuItem onClick={() => { handleOpenDialog(actionMenu.item); closeActionMenu(); }}>
                    <EditIcon fontSize="small" sx={{ mr: 1.5, color: 'primary.main' }} /> Editar
                </MenuItem>
                <Divider />
                <MenuItem sx={{ color: 'error.main' }} onClick={() => { setDeleteConfirm({ open: true, id: actionMenu.item.id }); closeActionMenu(); }}>
                    <DeleteIcon fontSize="small" sx={{ mr: 1.5 }} /> Excluir
                </MenuItem>
            </MuiMenu>

            {/* Dialog de criação/edição */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <form onSubmit={handleSubmit}>
                    <DialogTitle>{editingId ? 'Editar' : 'Registrar'} {isCustos ? 'Custo' : 'Receita'}</DialogTitle>
                    <DialogContent>
                        {isCustos ? (
                            <Grid container spacing={2} sx={{ mt: 1 }}>
                                <Grid size={12}>
                                    <TextField fullWidth required label="Descrição" value={formCusto.descricao} onChange={(e) => setFormCusto((p) => ({ ...p, descricao: e.target.value }))} />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <FormControl fullWidth required>
                                        <InputLabel>Tipo</InputLabel>
                                        <Select value={formCusto.tipo_custo} label="Tipo" onChange={(e) => setFormCusto((p) => ({ ...p, tipo_custo: e.target.value }))}>
                                            {TIPO_CUSTO_OPTIONS.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField fullWidth required type="number" label="Valor (R$)" value={formCusto.valor} onChange={(e) => setFormCusto((p) => ({ ...p, valor: e.target.value }))} inputProps={{ step: '0.01', min: '0' }} />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField fullWidth required type="date" label="Data" value={formCusto.data} onChange={(e) => setFormCusto((p) => ({ ...p, data: e.target.value }))} InputLabelProps={{ shrink: true }} />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField fullWidth label="Fornecedor" value={formCusto.fornecedor} onChange={(e) => setFormCusto((p) => ({ ...p, fornecedor: e.target.value }))} />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <FormControl fullWidth>
                                        <InputLabel>Apiário (opcional)</InputLabel>
                                        <Select value={formCusto.apiario} label="Apiário (opcional)" onChange={(e) => setFormCusto((p) => ({ ...p, apiario: e.target.value }))}>
                                            <MenuItem value="">Nenhum</MenuItem>
                                            {apiarios.map((a) => <MenuItem key={a.id} value={a.id}>{a.nome}</MenuItem>)}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <FormControl fullWidth>
                                        <InputLabel>Colmeia (opcional)</InputLabel>
                                        <Select value={formCusto.colmeia} label="Colmeia (opcional)" onChange={(e) => setFormCusto((p) => ({ ...p, colmeia: e.target.value }))}>
                                            <MenuItem value="">Nenhuma</MenuItem>
                                            {colmeias.map((c) => <MenuItem key={c.id} value={c.id}>{c.identificador}</MenuItem>)}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField fullWidth label="Nota Fiscal" value={formCusto.nota_fiscal} onChange={(e) => setFormCusto((p) => ({ ...p, nota_fiscal: e.target.value }))} />
                                </Grid>
                                <Grid size={12}>
                                    <TextField fullWidth label="Observações" value={formCusto.observacoes} onChange={(e) => setFormCusto((p) => ({ ...p, observacoes: e.target.value }))} multiline rows={2} />
                                </Grid>
                            </Grid>
                        ) : (
                            <Grid container spacing={2} sx={{ mt: 1 }}>
                                <Grid size={12}>
                                    <TextField fullWidth required label="Descrição" value={formReceita.descricao} onChange={(e) => setFormReceita((p) => ({ ...p, descricao: e.target.value }))} />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <FormControl fullWidth required>
                                        <InputLabel>Tipo</InputLabel>
                                        <Select value={formReceita.tipo_receita} label="Tipo" onChange={(e) => setFormReceita((p) => ({ ...p, tipo_receita: e.target.value }))}>
                                            {TIPO_RECEITA_OPTIONS.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField fullWidth required type="number" label="Valor (R$)" value={formReceita.valor} onChange={(e) => setFormReceita((p) => ({ ...p, valor: e.target.value }))} inputProps={{ step: '0.01', min: '0' }} />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField fullWidth required type="date" label="Data" value={formReceita.data} onChange={(e) => setFormReceita((p) => ({ ...p, data: e.target.value }))} InputLabelProps={{ shrink: true }} />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField fullWidth label="Cliente" value={formReceita.cliente} onChange={(e) => setFormReceita((p) => ({ ...p, cliente: e.target.value }))} />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField fullWidth type="number" label="Quantidade (kg, opcional)" value={formReceita.quantidade_kg} onChange={(e) => setFormReceita((p) => ({ ...p, quantidade_kg: e.target.value }))} inputProps={{ step: '0.01', min: '0' }} />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField fullWidth type="number" label="Preço Unitário (R$/kg, opcional)" value={formReceita.preco_unitario} onChange={(e) => setFormReceita((p) => ({ ...p, preco_unitario: e.target.value }))} inputProps={{ step: '0.01', min: '0' }} />
                                </Grid>
                                <Grid size={12}>
                                    <TextField fullWidth label="Observações" value={formReceita.observacoes} onChange={(e) => setFormReceita((p) => ({ ...p, observacoes: e.target.value }))} multiline rows={2} />
                                </Grid>
                            </Grid>
                        )}
                    </DialogContent>
                    <DialogActions sx={{ p: 2 }}>
                        <Button onClick={handleCloseDialog} disabled={saving}>Cancelar</Button>
                        <Button type="submit" variant="contained" disabled={saving}>{saving ? 'Salvando...' : editingId ? 'Salvar' : 'Registrar'}</Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* Confirmação de exclusão */}
            <Dialog open={deleteConfirm.open} onClose={() => setDeleteConfirm({ open: false, id: null })}>
                <DialogTitle>Confirmar Exclusão</DialogTitle>
                <DialogContent><Typography>Tem certeza que deseja excluir este registro?</Typography></DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteConfirm({ open: false, id: null })}>Cancelar</Button>
                    <Button onClick={handleDelete} color="error" variant="contained">Excluir</Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>{snackbar.message}</Alert>
            </Snackbar>
        </Box>
    );
}
