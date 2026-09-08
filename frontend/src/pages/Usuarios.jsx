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
    Typography,
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
    FormControl,
    InputLabel,
    Select,
    FormControlLabel,
    Switch,
    Menu as MuiMenu,
    Divider,
    Button,
} from '@mui/material';
import {
    People as UsuariosIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    MoreVert as MoreVertIcon,
    Lock as LockIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { getUsuarios, updateUsuario, deleteUsuario } from '../services/api';

const ROLE_OPTIONS = [
    { value: 'dono', label: 'Dono/Proprietário' },
    { value: 'gestor', label: 'Gestor' },
    { value: 'apicultor', label: 'Apicultor' },
];

const roleColor = (role) => ({ dono: 'error', gestor: 'warning', apicultor: 'default' }[role] || 'default');

export default function Usuarios() {
    const { canManageUsers, user: usuarioAtual } = useAuth();
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ role: 'apicultor', ativo: true, telefone: '' });
    const [saving, setSaving] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null });
    const [actionMenu, setActionMenu] = useState({ anchor: null, usuario: null });

    useEffect(() => {
        if (canManageUsers) fetchData();
        else setLoading(false);
    }, [canManageUsers]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await getUsuarios();
            setUsuarios(res.data.results || res.data);
            setErro(null);
        } catch (err) {
            setErro('Erro ao carregar usuários');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (usuario) => {
        setEditingId(usuario.id);
        setFormData({ role: usuario.role, ativo: usuario.ativo, telefone: usuario.telefone || '' });
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
            await updateUsuario(editingId, formData);
            setSnackbar({ open: true, message: 'Usuário atualizado com sucesso!', severity: 'success' });
            handleCloseDialog();
            fetchData();
        } catch (err) {
            setSnackbar({ open: true, message: err.response?.data?.error || 'Erro ao salvar usuário', severity: 'error' });
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        try {
            await deleteUsuario(deleteConfirm.id);
            setSnackbar({ open: true, message: 'Usuário removido com sucesso!', severity: 'success' });
            setDeleteConfirm({ open: false, id: null });
            fetchData();
        } catch (err) {
            setSnackbar({ open: true, message: 'Erro ao remover usuário', severity: 'error' });
            console.error(err);
        }
    };

    const closeActionMenu = () => setActionMenu({ anchor: null, usuario: null });

    if (!canManageUsers) {
        return (
            <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
                    <UsuariosIcon sx={{ color: 'primary.main' }} />
                    <Typography variant="h5" fontWeight={700}>Usuários</Typography>
                </Box>
                <Alert severity="warning" icon={<LockIcon />}>
                    Acesso restrito a Donos e Gestores. Fale com um administrador do sistema se precisar de acesso.
                </Alert>
            </Box>
        );
    }

    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
                <UsuariosIcon sx={{ color: 'primary.main' }} />
                <Typography variant="h5" fontWeight={700}>Usuários</Typography>
                <Chip label={`${usuarios.length} cadastrados`} size="small" variant="outlined" sx={{ ml: 1 }} />
            </Box>

            {erro && <Alert severity="error" sx={{ mb: 2 }}>{erro}</Alert>}

            <Paper sx={{ border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Usuário</TableCell>
                                <TableCell>E-mail</TableCell>
                                <TableCell>Papel</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Último Acesso</TableCell>
                                <TableCell align="center" sx={{ width: 48 }}>Ações</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>{[1, 2, 3, 4, 5, 6].map((c) => <TableCell key={c}><Skeleton height={20} /></TableCell>)}</TableRow>
                                ))
                            ) : usuarios.length === 0 ? (
                                <TableRow><TableCell colSpan={6}><Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>Nenhum usuário encontrado</Typography></TableCell></TableRow>
                            ) : (
                                usuarios.map((u) => (
                                    <TableRow key={u.id} hover>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight={600}>{u.username}</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {[u.first_name, u.last_name].filter(Boolean).join(' ') || '—'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>{u.email}</TableCell>
                                        <TableCell><Chip label={u.role_display} size="small" color={roleColor(u.role)} /></TableCell>
                                        <TableCell><Chip label={u.ativo ? 'Ativo' : 'Inativo'} size="small" color={u.ativo ? 'success' : 'default'} variant="outlined" /></TableCell>
                                        <TableCell>
                                            <Typography variant="body2" color="text.secondary">
                                                {u.ultimo_acesso ? new Date(u.ultimo_acesso).toLocaleString('pt-BR') : 'Nunca'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="center" sx={{ p: '4px' }}>
                                            <IconButton size="small" onClick={(e) => setActionMenu({ anchor: e.currentTarget, usuario: u })} sx={{ color: 'text.disabled' }}>
                                                <MoreVertIcon fontSize="small" />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* Action menu */}
            <MuiMenu
                anchorEl={actionMenu.anchor}
                open={Boolean(actionMenu.anchor)}
                onClose={closeActionMenu}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
                <MenuItem onClick={() => { handleOpenDialog(actionMenu.usuario); closeActionMenu(); }}>
                    <EditIcon fontSize="small" sx={{ mr: 1.5, color: 'primary.main' }} /> Editar
                </MenuItem>
                <Divider />
                <MenuItem
                    sx={{ color: 'error.main' }}
                    disabled={actionMenu.usuario?.id === usuarioAtual?.id}
                    onClick={() => { setDeleteConfirm({ open: true, id: actionMenu.usuario.id }); closeActionMenu(); }}
                >
                    <DeleteIcon fontSize="small" sx={{ mr: 1.5 }} /> Excluir
                </MenuItem>
            </MuiMenu>

            {/* Dialog de edição */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="xs" fullWidth>
                <form onSubmit={handleSubmit}>
                    <DialogTitle>Editar Usuário</DialogTitle>
                    <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        <FormControl fullWidth>
                            <InputLabel>Papel</InputLabel>
                            <Select
                                value={formData.role}
                                label="Papel"
                                onChange={(e) => setFormData((prev) => ({ ...prev, role: e.target.value }))}
                            >
                                {ROLE_OPTIONS.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                            </Select>
                        </FormControl>
                        <TextField
                            fullWidth label="Telefone" value={formData.telefone}
                            onChange={(e) => setFormData((prev) => ({ ...prev, telefone: e.target.value }))}
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={formData.ativo}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, ativo: e.target.checked }))}
                                />
                            }
                            label="Usuário ativo"
                        />
                    </DialogContent>
                    <DialogActions sx={{ p: 2 }}>
                        <Button onClick={handleCloseDialog} disabled={saving}>Cancelar</Button>
                        <Button type="submit" variant="contained" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* Confirmação de exclusão */}
            <Dialog open={deleteConfirm.open} onClose={() => setDeleteConfirm({ open: false, id: null })}>
                <DialogTitle>Confirmar Exclusão</DialogTitle>
                <DialogContent><Typography>Tem certeza que deseja excluir este usuário? Essa ação não pode ser desfeita.</Typography></DialogContent>
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
