import { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    FormControlLabel,
    Switch,
    Button,
    Skeleton,
    Alert,
    Snackbar,
    Divider,
} from '@mui/material';
import { NotificationsActive as AlertsIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { getAlertaRuidoConfig, updateAlertaRuidoConfig, getUsuarios } from '../services/api';

const initialState = {
    ativo: true,
    destino_alerta: 'geral',
    usuario_destino: '',
    janela_media: 10,
    percentual_desvio: 25,
    alertar_temperatura: false,
    desvio_temperatura: 20,
    alertar_luminosidade: false,
    desvio_luminosidade: 20,
    alertar_umidade: false,
    desvio_umidade: 20,
    alertar_pressao: false,
    desvio_pressao: 20,
    alertar_peso: false,
    desvio_peso: 20,
    alertar_producao: false,
    desvio_producao: 25,
    cooldown_minutos: 30,
};

const METRICAS = [
    { flag: 'alertar_temperatura', desvio: 'desvio_temperatura', label: 'Temperatura' },
    { flag: 'alertar_luminosidade', desvio: 'desvio_luminosidade', label: 'Luminosidade' },
    { flag: 'alertar_umidade', desvio: 'desvio_umidade', label: 'Umidade' },
    { flag: 'alertar_pressao', desvio: 'desvio_pressao', label: 'Pressão' },
    { flag: 'alertar_peso', desvio: 'desvio_peso', label: 'Peso' },
    { flag: 'alertar_producao', desvio: 'desvio_producao', label: 'Produção' },
];

export default function ConfiguracoesAlerta() {
    const { canManageUsers } = useAuth();
    const [config, setConfig] = useState(initialState);
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [erro, setErro] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    useEffect(() => {
        const carregar = async () => {
            try {
                setLoading(true);
                const req = [getAlertaRuidoConfig()];
                if (canManageUsers) req.push(getUsuarios());
                const [configRes, usuariosRes] = await Promise.all(req);
                setConfig((prev) => ({ ...prev, ...configRes.data, usuario_destino: configRes.data.usuario_destino || '' }));
                if (usuariosRes) setUsuarios(usuariosRes.data.results || usuariosRes.data);
                setErro(null);
            } catch (err) {
                setErro('Erro ao carregar configurações de alerta');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        carregar();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleChange = (campo, valor) => setConfig((prev) => ({ ...prev, [campo]: valor }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (config.destino_alerta === 'usuario' && !config.usuario_destino) {
            setSnackbar({ open: true, message: 'Selecione um usuário destino para alertas específicos.', severity: 'error' });
            return;
        }
        try {
            setSaving(true);
            const payload = { ...config, usuario_destino: config.usuario_destino || null };
            const res = await updateAlertaRuidoConfig(payload);
            setConfig((prev) => ({ ...prev, ...res.data, usuario_destino: res.data.usuario_destino || '' }));
            setSnackbar({ open: true, message: 'Configurações salvas com sucesso!', severity: 'success' });
        } catch (err) {
            setSnackbar({ open: true, message: err.response?.data?.error || 'Erro ao salvar configurações', severity: 'error' });
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Box>
                <Skeleton variant="text" width={280} height={40} sx={{ mb: 2 }} />
                <Skeleton variant="rounded" height={400} sx={{ borderRadius: 2 }} />
            </Box>
        );
    }

    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
                <AlertsIcon sx={{ color: 'primary.main' }} />
                <Typography variant="h5" fontWeight={700}>Configurações de Alerta</Typography>
            </Box>

            {erro && <Alert severity="error" sx={{ mb: 2 }}>{erro}</Alert>}

            <form onSubmit={handleSubmit}>
                <Card sx={{ mb: 2.5 }}>
                    <CardContent>
                        <Typography variant="subtitle1" fontWeight={600} gutterBottom>Geral</Typography>
                        <Grid container spacing={2} sx={{ mt: 0.5 }}>
                            <Grid size={12}>
                                <FormControlLabel
                                    control={<Switch checked={config.ativo} onChange={(e) => handleChange('ativo', e.target.checked)} />}
                                    label="Alertas ativos"
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Destino dos alertas</InputLabel>
                                    <Select
                                        value={config.destino_alerta} label="Destino dos alertas"
                                        onChange={(e) => handleChange('destino_alerta', e.target.value)}
                                    >
                                        <MenuItem value="geral">Geral (dono/gestor)</MenuItem>
                                        <MenuItem value="usuario">Usuário específico</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            {config.destino_alerta === 'usuario' && (
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <FormControl fullWidth size="small">
                                        <InputLabel>Usuário destino</InputLabel>
                                        <Select
                                            value={config.usuario_destino} label="Usuário destino"
                                            onChange={(e) => handleChange('usuario_destino', e.target.value)}
                                        >
                                            {usuarios.length === 0 && <MenuItem value="" disabled>Nenhum usuário disponível</MenuItem>}
                                            {usuarios.map((u) => <MenuItem key={u.id} value={u.id}>{u.username}</MenuItem>)}
                                        </Select>
                                    </FormControl>
                                </Grid>
                            )}
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Janela de média</InputLabel>
                                    <Select
                                        value={config.janela_media} label="Janela de média"
                                        onChange={(e) => handleChange('janela_media', e.target.value)}
                                    >
                                        <MenuItem value={10}>10 leituras anteriores</MenuItem>
                                        <MenuItem value={20}>20 leituras anteriores</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth size="small" type="number" label="Cooldown entre alertas (minutos)"
                                    value={config.cooldown_minutos}
                                    onChange={(e) => handleChange('cooldown_minutos', e.target.value)}
                                    inputProps={{ min: 1, max: 1440 }}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth size="small" type="number" label="Desvio para Ruído (%)"
                                    value={config.percentual_desvio}
                                    onChange={(e) => handleChange('percentual_desvio', e.target.value)}
                                    inputProps={{ min: 1, max: 500, step: '0.1' }}
                                />
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>

                <Card sx={{ mb: 2.5 }}>
                    <CardContent>
                        <Typography variant="subtitle1" fontWeight={600} gutterBottom>Métricas monitoradas</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Ative as métricas que devem gerar alerta quando o desvio em relação à média das leituras anteriores ultrapassar o percentual definido.
                        </Typography>
                        {METRICAS.map((metrica, i) => (
                            <Box key={metrica.flag}>
                                {i > 0 && <Divider sx={{ my: 1.5 }} />}
                                <Grid container spacing={2} alignItems="center">
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={config[metrica.flag]}
                                                    onChange={(e) => handleChange(metrica.flag, e.target.checked)}
                                                />
                                            }
                                            label={`Alertar ${metrica.label}`}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <TextField
                                            fullWidth size="small" type="number"
                                            label={`Desvio para ${metrica.label} (%)`}
                                            value={config[metrica.desvio]}
                                            onChange={(e) => handleChange(metrica.desvio, e.target.value)}
                                            disabled={!config[metrica.flag]}
                                            inputProps={{ min: 1, max: 500, step: '0.1' }}
                                        />
                                    </Grid>
                                </Grid>
                            </Box>
                        ))}
                    </CardContent>
                </Card>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button type="submit" variant="contained" disabled={saving}>
                        {saving ? 'Salvando...' : 'Salvar Configurações'}
                    </Button>
                </Box>
            </form>

            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>{snackbar.message}</Alert>
            </Snackbar>
        </Box>
    );
}
