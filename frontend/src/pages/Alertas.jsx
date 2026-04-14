import { useEffect, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    Divider,
    FormControl,
    Grid,
    InputLabel,
    MenuItem,
    Select,
    Switch,
    TextField,
    Typography,
} from '@mui/material';
import { NotificationsActive as AlertsIcon } from '@mui/icons-material';
import { getAlertaRuidoConfig, updateAlertaRuidoConfig, getUsuarios } from '../services/api';

const initialConfig = {
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

export default function Alertas() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [config, setConfig] = useState(initialConfig);
    const [usuarios, setUsuarios] = useState([]);

    useEffect(() => {
        const loadConfig = async () => {
            try {
                setLoading(true);
                const [configResponse, usuariosResponse] = await Promise.all([
                    getAlertaRuidoConfig(),
                    getUsuarios(),
                ]);

                const users = usuariosResponse.data?.results || usuariosResponse.data || [];
                setUsuarios(users);

                setConfig({
                    ativo: configResponse.data?.ativo ?? true,
                    destino_alerta: configResponse.data?.destino_alerta ?? 'geral',
                    usuario_destino: configResponse.data?.usuario_destino ?? '',
                    janela_media: configResponse.data?.janela_media ?? 10,
                    percentual_desvio: Number(configResponse.data?.percentual_desvio ?? 25),
                    alertar_temperatura: configResponse.data?.alertar_temperatura ?? false,
                    desvio_temperatura: Number(configResponse.data?.desvio_temperatura ?? 20),
                    alertar_luminosidade: configResponse.data?.alertar_luminosidade ?? false,
                    desvio_luminosidade: Number(configResponse.data?.desvio_luminosidade ?? 20),
                    alertar_umidade: configResponse.data?.alertar_umidade ?? false,
                    desvio_umidade: Number(configResponse.data?.desvio_umidade ?? 20),
                    alertar_pressao: configResponse.data?.alertar_pressao ?? false,
                    desvio_pressao: Number(configResponse.data?.desvio_pressao ?? 20),
                    alertar_peso: configResponse.data?.alertar_peso ?? false,
                    desvio_peso: Number(configResponse.data?.desvio_peso ?? 20),
                    alertar_producao: configResponse.data?.alertar_producao ?? false,
                    desvio_producao: Number(configResponse.data?.desvio_producao ?? 25),
                    cooldown_minutos: Number(configResponse.data?.cooldown_minutos ?? 30),
                });
                setError('');
            } catch (err) {
                setError('Erro ao carregar configuração de alertas.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        loadConfig();
    }, []);

    const handleSave = async () => {
        try {
            setSaving(true);
            setError('');
            setSuccess('');

            const payload = {
                ativo: config.ativo,
                destino_alerta: config.destino_alerta,
                usuario_destino: config.destino_alerta === 'usuario' ? Number(config.usuario_destino) : null,
                janela_media: Number(config.janela_media),
                percentual_desvio: Number(config.percentual_desvio),
                alertar_temperatura: Boolean(config.alertar_temperatura),
                desvio_temperatura: Number(config.desvio_temperatura),
                alertar_luminosidade: Boolean(config.alertar_luminosidade),
                desvio_luminosidade: Number(config.desvio_luminosidade),
                alertar_umidade: Boolean(config.alertar_umidade),
                desvio_umidade: Number(config.desvio_umidade),
                alertar_pressao: Boolean(config.alertar_pressao),
                desvio_pressao: Number(config.desvio_pressao),
                alertar_peso: Boolean(config.alertar_peso),
                desvio_peso: Number(config.desvio_peso),
                alertar_producao: Boolean(config.alertar_producao),
                desvio_producao: Number(config.desvio_producao),
                cooldown_minutos: Number(config.cooldown_minutos),
            };

            const response = await updateAlertaRuidoConfig(payload);
            setConfig({
                ativo: response.data?.ativo ?? payload.ativo,
                destino_alerta: response.data?.destino_alerta ?? payload.destino_alerta,
                usuario_destino: response.data?.usuario_destino ?? payload.usuario_destino ?? '',
                janela_media: response.data?.janela_media ?? payload.janela_media,
                percentual_desvio: Number(response.data?.percentual_desvio ?? payload.percentual_desvio),
                alertar_temperatura: response.data?.alertar_temperatura ?? payload.alertar_temperatura,
                desvio_temperatura: Number(response.data?.desvio_temperatura ?? payload.desvio_temperatura),
                alertar_luminosidade: response.data?.alertar_luminosidade ?? payload.alertar_luminosidade,
                desvio_luminosidade: Number(response.data?.desvio_luminosidade ?? payload.desvio_luminosidade),
                alertar_umidade: response.data?.alertar_umidade ?? payload.alertar_umidade,
                desvio_umidade: Number(response.data?.desvio_umidade ?? payload.desvio_umidade),
                alertar_pressao: response.data?.alertar_pressao ?? payload.alertar_pressao,
                desvio_pressao: Number(response.data?.desvio_pressao ?? payload.desvio_pressao),
                alertar_peso: response.data?.alertar_peso ?? payload.alertar_peso,
                desvio_peso: Number(response.data?.desvio_peso ?? payload.desvio_peso),
                alertar_producao: response.data?.alertar_producao ?? payload.alertar_producao,
                desvio_producao: Number(response.data?.desvio_producao ?? payload.desvio_producao),
                cooldown_minutos: Number(response.data?.cooldown_minutos ?? payload.cooldown_minutos),
            });
            setSuccess('Configuração de alertas salva com sucesso.');
        } catch (err) {
            setError('Erro ao salvar configuração de alertas. Verifique os valores.');
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                <AlertsIcon color="primary" />
                <Typography variant="h5" fontWeight={700} sx={{ fontSize: { xs: '1.3rem', sm: '1.5rem' } }}>
                    Alertas
                </Typography>
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Configure alertas automáticos para produção e para todos os sensores IoT da colmeia.
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {success && (
                <Alert severity="success" sx={{ mb: 2 }}>
                    {success}
                </Alert>
            )}

            <Card>
                <CardContent sx={{ p: { xs: 1.5, sm: 2.5 } }}>
                    <Grid container spacing={2.5}>
                        <Grid size={12}>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                Configurações gerais
                            </Typography>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                Alertas de sensores ativos
                            </Typography>
                            <Switch
                                checked={Boolean(config.ativo)}
                                onChange={(event) => setConfig((prev) => ({ ...prev, ativo: event.target.checked }))}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Destino dos alertas</InputLabel>
                                <Select
                                    label="Destino dos alertas"
                                    value={config.destino_alerta}
                                    onChange={(event) =>
                                        setConfig((prev) => ({ ...prev, destino_alerta: event.target.value }))
                                    }
                                >
                                    <MenuItem value="geral">Geral (dono/gestor)</MenuItem>
                                    <MenuItem value="usuario">Usuário específico</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                            <FormControl fullWidth size="small" disabled={config.destino_alerta !== 'usuario'}>
                                <InputLabel>Usuário destino</InputLabel>
                                <Select
                                    label="Usuário destino"
                                    value={config.usuario_destino || ''}
                                    onChange={(event) =>
                                        setConfig((prev) => ({ ...prev, usuario_destino: event.target.value }))
                                    }
                                >
                                    {usuarios.map((usuario) => (
                                        <MenuItem key={usuario.id} value={usuario.id}>
                                            {usuario.username}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Janela de média</InputLabel>
                                <Select
                                    label="Janela de média"
                                    value={config.janela_media}
                                    onChange={(event) =>
                                        setConfig((prev) => ({ ...prev, janela_media: Number(event.target.value) }))
                                    }
                                >
                                    <MenuItem value={10}>10 valores anteriores</MenuItem>
                                    <MenuItem value={20}>20 valores anteriores</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                            <TextField
                                fullWidth
                                size="small"
                                type="number"
                                label="Cooldown entre alertas (min)"
                                value={config.cooldown_minutos}
                                inputProps={{ min: 1, max: 1440 }}
                                onChange={(event) =>
                                    setConfig((prev) => ({ ...prev, cooldown_minutos: event.target.value }))
                                }
                            />
                        </Grid>

                        <Grid size={12}>
                            <Divider sx={{ my: 0.5 }} />
                            <Typography variant="subtitle2" sx={{ mt: 1.5, mb: 1 }}>
                                Sensores IoT
                            </Typography>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 6 }}>
                            <Typography variant="body2" sx={{ mb: 1 }}>Ruído</Typography>
                            <Switch
                                checked={Boolean(config.ativo)}
                                onChange={(event) => setConfig((prev) => ({ ...prev, ativo: event.target.checked }))}
                            />
                            <TextField
                                fullWidth
                                size="small"
                                type="number"
                                label="Desvio Ruído (%)"
                                value={config.percentual_desvio}
                                inputProps={{ min: 1, max: 500, step: 0.1 }}
                                onChange={(event) => setConfig((prev) => ({ ...prev, percentual_desvio: event.target.value }))}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 6 }}>
                            <Typography variant="body2" sx={{ mb: 1 }}>Temperatura</Typography>
                            <Switch
                                checked={Boolean(config.alertar_temperatura)}
                                onChange={(event) => setConfig((prev) => ({ ...prev, alertar_temperatura: event.target.checked }))}
                            />
                            <TextField
                                fullWidth
                                size="small"
                                type="number"
                                label="Desvio Temperatura (%)"
                                value={config.desvio_temperatura}
                                inputProps={{ min: 1, max: 500, step: 0.1 }}
                                onChange={(event) => setConfig((prev) => ({ ...prev, desvio_temperatura: event.target.value }))}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 6 }}>
                            <Typography variant="body2" sx={{ mb: 1 }}>Luminosidade</Typography>
                            <Switch
                                checked={Boolean(config.alertar_luminosidade)}
                                onChange={(event) => setConfig((prev) => ({ ...prev, alertar_luminosidade: event.target.checked }))}
                            />
                            <TextField
                                fullWidth
                                size="small"
                                type="number"
                                label="Desvio Luminosidade (%)"
                                value={config.desvio_luminosidade}
                                inputProps={{ min: 1, max: 500, step: 0.1 }}
                                onChange={(event) => setConfig((prev) => ({ ...prev, desvio_luminosidade: event.target.value }))}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 6 }}>
                            <Typography variant="body2" sx={{ mb: 1 }}>Umidade</Typography>
                            <Switch
                                checked={Boolean(config.alertar_umidade)}
                                onChange={(event) => setConfig((prev) => ({ ...prev, alertar_umidade: event.target.checked }))}
                            />
                            <TextField
                                fullWidth
                                size="small"
                                type="number"
                                label="Desvio Umidade (%)"
                                value={config.desvio_umidade}
                                inputProps={{ min: 1, max: 500, step: 0.1 }}
                                onChange={(event) => setConfig((prev) => ({ ...prev, desvio_umidade: event.target.value }))}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 6 }}>
                            <Typography variant="body2" sx={{ mb: 1 }}>Pressão</Typography>
                            <Switch
                                checked={Boolean(config.alertar_pressao)}
                                onChange={(event) => setConfig((prev) => ({ ...prev, alertar_pressao: event.target.checked }))}
                            />
                            <TextField
                                fullWidth
                                size="small"
                                type="number"
                                label="Desvio Pressão (%)"
                                value={config.desvio_pressao}
                                inputProps={{ min: 1, max: 500, step: 0.1 }}
                                onChange={(event) => setConfig((prev) => ({ ...prev, desvio_pressao: event.target.value }))}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 6 }}>
                            <Typography variant="body2" sx={{ mb: 1 }}>Peso</Typography>
                            <Switch
                                checked={Boolean(config.alertar_peso)}
                                onChange={(event) => setConfig((prev) => ({ ...prev, alertar_peso: event.target.checked }))}
                            />
                            <TextField
                                fullWidth
                                size="small"
                                type="number"
                                label="Desvio Peso (%)"
                                value={config.desvio_peso}
                                inputProps={{ min: 1, max: 500, step: 0.1 }}
                                onChange={(event) => setConfig((prev) => ({ ...prev, desvio_peso: event.target.value }))}
                            />
                        </Grid>

                        <Grid size={12}>
                            <Divider sx={{ my: 0.5 }} />
                            <Typography variant="subtitle2" sx={{ mt: 1.5, mb: 1 }}>
                                Produção
                            </Typography>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 6 }}>
                            <Typography variant="body2" sx={{ mb: 1 }}>Alertar variações de produção</Typography>
                            <Switch
                                checked={Boolean(config.alertar_producao)}
                                onChange={(event) => setConfig((prev) => ({ ...prev, alertar_producao: event.target.checked }))}
                            />
                            <TextField
                                fullWidth
                                size="small"
                                type="number"
                                label="Desvio Produção (%)"
                                value={config.desvio_producao}
                                inputProps={{ min: 1, max: 500, step: 0.1 }}
                                onChange={(event) => setConfig((prev) => ({ ...prev, desvio_producao: event.target.value }))}
                            />
                        </Grid>

                        <Grid size={12}>
                            <Button
                                variant="contained"
                                onClick={handleSave}
                                disabled={saving}
                                fullWidth
                                sx={{ width: { xs: '100%', sm: 'auto' } }}
                            >
                                {saving ? 'Salvando...' : 'Salvar configurações'}
                            </Button>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>
        </Box>
    );
}
