import { useState, useEffect, useMemo } from 'react';
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
    Chip,
    Skeleton,
    Alert,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    Button,
} from '@mui/material';
import { History as LogsIcon, Lock as LockIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { getLogsAtividade, getUsuarios } from '../services/api';

const ACTION_OPTIONS = [
    { value: 'VIEW', label: 'Visualizar (navegação)' },
    { value: 'CREATE', label: 'Criar' },
    { value: 'UPDATE', label: 'Atualizar' },
    { value: 'DELETE', label: 'Deletar' },
    { value: 'LOGIN', label: 'Login' },
    { value: 'LOGOUT', label: 'Logout' },
    { value: 'EXPORT', label: 'Exportar' },
    { value: 'IMPORT', label: 'Importar' },
];

const actionColor = (action) => ({
    CREATE: 'success', UPDATE: 'info', DELETE: 'error', VIEW: 'default',
    LOGIN: 'success', LOGOUT: 'default', EXPORT: 'warning', IMPORT: 'warning',
}[action] || 'default');

const severityColor = (severity) => ({
    LOW: 'default', MEDIUM: 'warning', HIGH: 'error', CRITICAL: 'error',
}[severity] || 'default');

export default function LogsAtividade() {
    const { canManageUsers } = useAuth();
    const [logs, setLogs] = useState([]);
    const [count, setCount] = useState(0);
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState(null);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(20);
    const [filtros, setFiltros] = useState({ usuario: '', action: '', data_inicio: '', data_fim: '' });

    useEffect(() => {
        if (canManageUsers) {
            getUsuarios().then((res) => setUsuarios(res.data.results || res.data)).catch((err) => console.error(err));
        }
    }, [canManageUsers]);

    const filtrosLimpos = useMemo(() => {
        const limpos = {};
        Object.entries(filtros).forEach(([chave, valor]) => { if (valor !== '') limpos[chave] = valor; });
        return limpos;
    }, [filtros]);

    useEffect(() => {
        if (!canManageUsers) {
            setLoading(false);
            return;
        }
        const carregar = async () => {
            try {
                setLoading(true);
                const res = await getLogsAtividade({ ...filtrosLimpos, limit: rowsPerPage, offset: page * rowsPerPage });
                setLogs(res.data.results || res.data);
                setCount(res.data.count ?? (res.data.results || res.data).length);
                setErro(null);
            } catch (err) {
                setErro('Erro ao carregar logs de atividade');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        carregar();
    }, [canManageUsers, filtrosLimpos, page, rowsPerPage]);

    const handleFiltro = (nome, valor) => {
        setFiltros((prev) => ({ ...prev, [nome]: valor }));
        setPage(0);
    };

    const limparFiltros = () => setFiltros({ usuario: '', action: '', data_inicio: '', data_fim: '' });

    if (!canManageUsers) {
        return (
            <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
                    <LogsIcon sx={{ color: 'primary.main' }} />
                    <Typography variant="h5" fontWeight={700}>Logs de Atividade</Typography>
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
                <LogsIcon sx={{ color: 'primary.main' }} />
                <Typography variant="h5" fontWeight={700} sx={{ flex: 1 }}>Logs de Atividade</Typography>
                <Chip label={`${count} registros`} size="small" variant="outlined" />
            </Box>

            {erro && <Alert severity="error" sx={{ mb: 2 }}>{erro}</Alert>}

            <Paper sx={{ p: 2, mb: 2.5, border: '1px solid', borderColor: 'divider' }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid size={{ xs: 12, sm: 3 }}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Usuário</InputLabel>
                            <Select value={filtros.usuario} label="Usuário" onChange={(e) => handleFiltro('usuario', e.target.value)}>
                                <MenuItem value="">Todos</MenuItem>
                                {usuarios.map((u) => <MenuItem key={u.id} value={u.id}>{u.username}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 3 }}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Ação</InputLabel>
                            <Select value={filtros.action} label="Ação" onChange={(e) => handleFiltro('action', e.target.value)}>
                                <MenuItem value="">Todas</MenuItem>
                                {ACTION_OPTIONS.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 3 }}>
                        <TextField
                            fullWidth size="small" type="date" label="Data início"
                            value={filtros.data_inicio} onChange={(e) => handleFiltro('data_inicio', e.target.value)}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 3 }}>
                        <TextField
                            fullWidth size="small" type="date" label="Data fim"
                            value={filtros.data_fim} onChange={(e) => handleFiltro('data_fim', e.target.value)}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                    {Object.keys(filtrosLimpos).length > 0 && (
                        <Grid size={{ xs: 12, sm: 'auto' }}>
                            <Button size="small" variant="outlined" onClick={limparFiltros}>Limpar filtros</Button>
                        </Grid>
                    )}
                </Grid>
            </Paper>

            <Paper sx={{ border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Data/Hora</TableCell>
                                <TableCell>Usuário</TableCell>
                                <TableCell>Ação</TableCell>
                                <TableCell>Tela/Modelo</TableCell>
                                <TableCell>Descrição</TableCell>
                                <TableCell>Severidade</TableCell>
                                <TableCell>IP</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 8 }).map((_, i) => (
                                    <TableRow key={i}>{[1, 2, 3, 4, 5, 6, 7].map((c) => <TableCell key={c}><Skeleton height={18} /></TableCell>)}</TableRow>
                                ))
                            ) : logs.length === 0 ? (
                                <TableRow><TableCell colSpan={7}><Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>Nenhum log encontrado</Typography></TableCell></TableRow>
                            ) : (
                                logs.map((log) => (
                                    <TableRow key={log.id} hover>
                                        <TableCell>
                                            <Typography variant="body2" noWrap>{new Date(log.timestamp).toLocaleString('pt-BR')}</Typography>
                                        </TableCell>
                                        <TableCell>{log.usuario_username || '—'}</TableCell>
                                        <TableCell><Chip label={log.action_display} size="small" color={actionColor(log.action)} /></TableCell>
                                        <TableCell>{log.model_name || '—'}</TableCell>
                                        <TableCell>
                                            <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 320 }}>{log.description}</Typography>
                                        </TableCell>
                                        <TableCell><Chip label={log.severity_display} size="small" color={severityColor(log.severity)} variant="outlined" /></TableCell>
                                        <TableCell><Typography variant="caption" color="text.secondary">{log.ip_address || '—'}</Typography></TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    component="div"
                    count={count}
                    page={page}
                    onPageChange={(e, newPage) => setPage(newPage)}
                    rowsPerPage={rowsPerPage}
                    rowsPerPageOptions={[20, 50, 100]}
                    onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                    labelRowsPerPage="Linhas:"
                    labelDisplayedRows={({ from, to, count: total }) => `${from}–${to} de ${total}`}
                />
            </Paper>
        </Box>
    );
}
