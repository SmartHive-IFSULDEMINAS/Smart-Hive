import { useEffect, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
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
import { getAlertaRuidoConfig, updateAlertaRuidoConfig } from '../services/api';

const initialConfig = {
    ativo: true,
    janela_media: 10,
    percentual_desvio: 25,
    cooldown_minutos: 30,
};

export default function Alertas() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [config, setConfig] = useState(initialConfig);

    useEffect(() => {
        const loadConfig = async () => {
            try {
                setLoading(true);
                const response = await getAlertaRuidoConfig();
                setConfig({
                    ativo: response.data?.ativo ?? true,
                    janela_media: response.data?.janela_media ?? 10,
                    percentual_desvio: Number(response.data?.percentual_desvio ?? 25),
                    cooldown_minutos: Number(response.data?.cooldown_minutos ?? 30),
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
                janela_media: Number(config.janela_media),
                percentual_desvio: Number(config.percentual_desvio),
                cooldown_minutos: Number(config.cooldown_minutos),
            };

            const response = await updateAlertaRuidoConfig(payload);
            setConfig({
                ativo: response.data?.ativo ?? payload.ativo,
                janela_media: response.data?.janela_media ?? payload.janela_media,
                percentual_desvio: Number(response.data?.percentual_desvio ?? payload.percentual_desvio),
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <AlertsIcon color="primary" />
                <Typography variant="h5" fontWeight={700}>
                    Alertas
                </Typography>
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Configure os parâmetros de geração de alertas automáticos de ruído para suas colmeias.
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
                <CardContent>
                    <Grid container spacing={2.5}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                Alerta de ruído ativo
                            </Typography>
                            <Switch
                                checked={Boolean(config.ativo)}
                                onChange={(event) => setConfig((prev) => ({ ...prev, ativo: event.target.checked }))}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
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

                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth
                                size="small"
                                type="number"
                                label="Desvio para alerta (%)"
                                value={config.percentual_desvio}
                                inputProps={{ min: 1, max: 500, step: 0.1 }}
                                onChange={(event) =>
                                    setConfig((prev) => ({ ...prev, percentual_desvio: event.target.value }))
                                }
                            />
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
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
                            <Button
                                variant="contained"
                                onClick={handleSave}
                                disabled={saving}
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
