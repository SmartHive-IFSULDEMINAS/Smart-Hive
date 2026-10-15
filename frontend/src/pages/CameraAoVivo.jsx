import { useState, useEffect, useRef, useCallback } from 'react';
import {
    Box, Card, CardContent, Typography, Button, Chip, Alert, CircularProgress, Fade,
} from '@mui/material';
import {
    Videocam as VideocamIcon,
    PlayArrow as PlayIcon,
    Stop as StopIcon,
} from '@mui/icons-material';
import Hls from 'hls.js';
import { getCameraStatus, ligarCamera, desligarCamera } from '../services/api';

// A sessão no backend dura 90s; renovamos a cada 30s enquanto a aba está visível
const HEARTBEAT_MS = 30000;
const STATUS_POLL_MS = 5000;
// Tempo sem receber vídeo até desistir (inclui o Pi perceber e o ffmpeg subir)
const TIMEOUT_SEM_VIDEO_MS = 30000;
const RETRY_MS = 2000;

export default function CameraAoVivo() {
    const [camera, setCamera] = useState(null);
    const [semCamera, setSemCamera] = useState(false);
    // desligada | ligando | ao_vivo | erro
    const [fase, setFase] = useState('desligada');

    const videoRef = useRef(null);
    const hlsRef = useRef(null);
    const retryRef = useRef(null);
    const conectarRef = useRef(null);
    const heartbeatRef = useRef(null);
    const ultimoVideoRef = useRef(0);
    const faseRef = useRef(fase);
    useEffect(() => { faseRef.current = fase; }, [fase]);

    const atualizarStatus = useCallback(async () => {
        try {
            const res = await getCameraStatus();
            setCamera(res.data);
            setSemCamera(false);
        } catch (err) {
            if (err.response?.status === 404) setSemCamera(true);
        }
    }, []);

    useEffect(() => {
        const primeira = setTimeout(atualizarStatus, 0);
        const id = setInterval(atualizarStatus, STATUS_POLL_MS);
        return () => {
            clearTimeout(primeira);
            clearInterval(id);
        };
    }, [atualizarStatus]);

    const destruirPlayer = useCallback(() => {
        clearTimeout(retryRef.current);
        if (hlsRef.current) {
            hlsRef.current.destroy();
            hlsRef.current = null;
        }
    }, []);

    const conectarPlayer = useCallback((hlsUrl) => {
        destruirPlayer();
        const video = videoRef.current;
        if (!video || !Hls.isSupported()) return;

        const token = localStorage.getItem('token');
        const hls = new Hls({
            lowLatencyMode: true,
            xhrSetup: (xhr) => xhr.setRequestHeader('Authorization', `Bearer ${token}`),
        });
        hlsRef.current = hls;

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
            video.play().catch(() => {});
        });
        hls.on(Hls.Events.FRAG_LOADED, () => {
            ultimoVideoRef.current = Date.now();
            if (faseRef.current === 'ligando') setFase('ao_vivo');
        });
        hls.on(Hls.Events.ERROR, (_, data) => {
            if (!data.fatal) return;
            destruirPlayer();
            // Stream ainda não existe (Pi subindo) ou caiu: tenta de novo até o timeout
            if (Date.now() - ultimoVideoRef.current < TIMEOUT_SEM_VIDEO_MS) {
                if (faseRef.current === 'ao_vivo') setFase('ligando');
                retryRef.current = setTimeout(() => conectarRef.current(hlsUrl), RETRY_MS);
            } else {
                setFase('erro');
            }
        });

        hls.loadSource(hlsUrl);
        hls.attachMedia(video);
    }, [destruirPlayer]);

    // O retry agendado dentro do player chama a versão atual via ref
    useEffect(() => { conectarRef.current = conectarPlayer; }, [conectarPlayer]);

    const pararHeartbeat = () => clearInterval(heartbeatRef.current);

    const ligar = async () => {
        try {
            const res = await ligarCamera();
            setCamera(res.data);
            setFase('ligando');
            ultimoVideoRef.current = Date.now();
            conectarPlayer(res.data.hls_url);

            pararHeartbeat();
            heartbeatRef.current = setInterval(() => {
                if (document.visibilityState === 'visible') ligarCamera().catch(() => {});
            }, HEARTBEAT_MS);
        } catch {
            setFase('erro');
        }
    };

    const parar = async () => {
        pararHeartbeat();
        destruirPlayer();
        setFase('desligada');
        try {
            const res = await desligarCamera();
            setCamera(res.data);
        } catch {
            // a sessão expira sozinha de qualquer forma
        }
    };

    // Voltou para a aba depois de um tempo escondida: renova na hora,
    // já que o heartbeat foi pulado enquanto ela estava oculta
    useEffect(() => {
        const onVisibility = () => {
            if (document.visibilityState === 'visible' && ['ligando', 'ao_vivo'].includes(faseRef.current)) {
                ligarCamera().catch(() => {});
            }
        };
        document.addEventListener('visibilitychange', onVisibility);
        return () => document.removeEventListener('visibilitychange', onVisibility);
    }, []);

    // Saiu da página: derruba o player e encerra a sessão
    useEffect(() => () => {
        pararHeartbeat();
        destruirPlayer();
        if (['ligando', 'ao_vivo'].includes(faseRef.current)) desligarCamera().catch(() => {});
    }, [destruirPlayer]);

    const transmitindo = fase === 'ligando' || fase === 'ao_vivo';

    return (
        <Box sx={{ p: { xs: 2, md: 3 } }}>
            <Fade in timeout={300}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <VideocamIcon sx={{ color: 'primary.main', fontSize: 32 }} />
                        <Box>
                            <Typography variant="h5" fontWeight={700}>Câmera ao Vivo</Typography>
                            <Typography variant="body2" color="text.secondary">
                                {camera?.nome ?? 'Raspberry Pi'} — transmite apenas enquanto esta tela estiver aberta
                            </Typography>
                        </Box>
                    </Box>
                    {camera && (
                        <Chip
                            size="small"
                            label={camera.pi_online ? 'Pi online' : 'Pi offline'}
                            color={camera.pi_online ? 'success' : 'default'}
                            variant={camera.pi_online ? 'filled' : 'outlined'}
                        />
                    )}
                </Box>
            </Fade>

            {semCamera ? (
                <Alert severity="info">
                    Nenhuma câmera cadastrada. Cadastre uma em Django Admin → Câmeras e configure o Pi com o token gerado.
                </Alert>
            ) : (
                <Card>
                    <CardContent>
                        <Box sx={{
                            position: 'relative',
                            width: '100%',
                            aspectRatio: '16 / 9',
                            bgcolor: 'black',
                            borderRadius: 2,
                            overflow: 'hidden',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <video
                                ref={videoRef}
                                muted
                                playsInline
                                style={{
                                    width: '100%', height: '100%', objectFit: 'contain',
                                    display: fase === 'ao_vivo' ? 'block' : 'none',
                                }}
                            />
                            {fase === 'ligando' && (
                                <Box sx={{ textAlign: 'center', color: 'grey.300' }}>
                                    <CircularProgress color="inherit" sx={{ mb: 2 }} />
                                    <Typography>Ligando câmera...</Typography>
                                    <Typography variant="caption">Pode levar alguns segundos</Typography>
                                </Box>
                            )}
                            {fase === 'desligada' && (
                                <Typography sx={{ color: 'grey.500' }}>Câmera desligada</Typography>
                            )}
                            {fase === 'erro' && (
                                <Typography sx={{ color: 'grey.400', px: 2, textAlign: 'center' }}>
                                    A câmera não respondeu. Verifique se o Pi está online e tente de novo.
                                </Typography>
                            )}
                            {fase === 'ao_vivo' && (
                                <Chip
                                    label="AO VIVO"
                                    color="error"
                                    size="small"
                                    sx={{ position: 'absolute', top: 12, left: 12, fontWeight: 700 }}
                                />
                            )}
                        </Box>

                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                            {transmitindo ? (
                                <Button variant="outlined" color="error" startIcon={<StopIcon />} onClick={parar}>
                                    Parar
                                </Button>
                            ) : (
                                <Button variant="contained" startIcon={<PlayIcon />} onClick={ligar}>
                                    {fase === 'erro' ? 'Tentar de novo' : 'Ligar câmera'}
                                </Button>
                            )}
                        </Box>
                    </CardContent>
                </Card>
            )}
        </Box>
    );
}
