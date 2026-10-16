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
import {
    getCameraStatus, ligarCamera, renovarCamera, desligarCamera, desligarCameraAoSair,
} from '../services/api';

// A sessão no backend dura 90s; renovamos a cada 30s enquanto a aba está visível
const HEARTBEAT_MS = 30000;
const STATUS_POLL_MS = 10000;
// Tempo sem receber vídeo até desistir (inclui o Pi perceber e o ffmpeg subir)
const TIMEOUT_SEM_VIDEO_MS = 45000;
const RETRY_MS = 2000;

// iPhones/iPads antigos não têm MediaSource (hls.js), mas tocam HLS nativo
const suportaHlsNativo = () => typeof document !== 'undefined'
    && document.createElement('video').canPlayType('application/vnd.apple.mpegurl') !== '';
const suportaVideo = () => Hls.isSupported() || suportaHlsNativo();

const formatarHora = (iso) => new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

export default function CameraAoVivo() {
    const [camera, setCamera] = useState(null);
    const [semCamera, setSemCamera] = useState(false);
    // desligada | ligando | ao_vivo | erro | esgotado
    const [fase, setFase] = useState('desligada');
    const [terminaEm, setTerminaEm] = useState(null);

    const videoRef = useRef(null);
    const hlsRef = useRef(null);
    const retryRef = useRef(null);
    const conectarRef = useRef(null);
    const falharRef = useRef(null);
    const heartbeatRef = useRef(null);
    const sessaoRef = useRef(null);
    const hlsUrlRef = useRef(null);
    const ultimoVideoRef = useRef(0);
    const recuperouMidiaRef = useRef(false);
    // Player desligado de propósito porque a aba ficou oculta (não é falha)
    const pausadoRef = useRef(false);
    const faseRef = useRef(fase);
    useEffect(() => { faseRef.current = fase; }, [fase]);

    // Desistiu de receber vídeo: encerra a sessão para o Pi não transmitir à toa
    useEffect(() => {
        falharRef.current = () => {
            clearInterval(heartbeatRef.current);
            const sessao = sessaoRef.current;
            sessaoRef.current = null;
            if (sessao) desligarCamera(sessao).catch(() => {});
            setFase('erro');
        };
    }, []);

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

    // ── player HLS ───────────────────────────────────────────────────────
    const destruirPlayer = useCallback(() => {
        clearTimeout(retryRef.current);
        if (hlsRef.current) {
            hlsRef.current.destroy();
            hlsRef.current = null;
        }
        const video = videoRef.current;
        if (video?.getAttribute('src')) {
            video.onloadeddata = video.ontimeupdate = video.onerror = null;
            video.removeAttribute('src');
            video.load();
        }
    }, []);

    const playerAtivo = useCallback(() => Boolean(hlsRef.current || videoRef.current?.getAttribute('src')), []);

    // Stream ainda não existe (Pi subindo) ou caiu. Com a aba oculta, só
    // pausa: o Pi para sem heartbeat e reconectamos quando ela voltar.
    // Visível: tenta de novo até o timeout e então desiste.
    const tratarFalhaStream = useCallback(() => {
        destruirPlayer();
        if (document.visibilityState === 'hidden') {
            pausadoRef.current = true;
            if (faseRef.current === 'ao_vivo') setFase('ligando');
            return;
        }
        if (Date.now() - ultimoVideoRef.current < TIMEOUT_SEM_VIDEO_MS) {
            if (faseRef.current === 'ao_vivo') setFase('ligando');
            retryRef.current = setTimeout(() => conectarRef.current(), RETRY_MS);
        } else {
            falharRef.current();
        }
    }, [destruirPlayer]);

    // Player nativo (Safari antigo): não dá para mandar header, então o JWT vai
    // na query; o MediaMTX repassa ?jwt= para as playlists e segmentos
    const conectarNativo = useCallback((video, hlsUrl) => {
        const token = localStorage.getItem('token') ?? '';
        video.onloadeddata = () => {
            ultimoVideoRef.current = Date.now();
            if (faseRef.current === 'ligando') setFase('ao_vivo');
        };
        video.ontimeupdate = () => { ultimoVideoRef.current = Date.now(); };
        video.onerror = tratarFalhaStream;
        video.src = `${hlsUrl}?jwt=${encodeURIComponent(token)}`;
        video.play().catch(() => {});
    }, [tratarFalhaStream]);

    const conectarPlayer = useCallback(() => {
        destruirPlayer();
        const video = videoRef.current;
        const hlsUrl = hlsUrlRef.current;
        if (!video || !hlsUrl) return;

        if (!Hls.isSupported()) {
            conectarNativo(video, hlsUrl);
            return;
        }

        const hls = new Hls({
            lowLatencyMode: true,
            // Sessões podem durar até 30 min: não acumula vídeo antigo na memória
            backBufferLength: 10,
            // Se ficar atrasado em relação ao ao vivo, acelera levemente para alcançar
            maxLiveSyncPlaybackRate: 1.5,
            xhrSetup: (xhr) => {
                const token = localStorage.getItem('token');
                if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            },
        });
        hlsRef.current = hls;
        recuperouMidiaRef.current = false;

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
            video.play().catch(() => {});
        });
        hls.on(Hls.Events.FRAG_LOADED, () => {
            ultimoVideoRef.current = Date.now();
            if (faseRef.current === 'ligando') setFase('ao_vivo');
        });
        hls.on(Hls.Events.ERROR, (_, data) => {
            if (!data.fatal) return;
            // Erro de decodificação: o hls.js consegue se recuperar sem reconectar
            if (data.type === Hls.ErrorTypes.MEDIA_ERROR && !recuperouMidiaRef.current) {
                recuperouMidiaRef.current = true;
                hls.recoverMediaError();
                return;
            }
            tratarFalhaStream();
        });

        hls.loadSource(hlsUrl);
        hls.attachMedia(video);
    }, [destruirPlayer, conectarNativo, tratarFalhaStream]);

    // O retry agendado dentro do player chama a versão atual via ref
    useEffect(() => { conectarRef.current = conectarPlayer; }, [conectarPlayer]);

    // ── sessão ───────────────────────────────────────────────────────────
    const pararHeartbeat = () => clearInterval(heartbeatRef.current);

    const encerrarLocal = useCallback((novaFase) => {
        pararHeartbeat();
        destruirPlayer();
        pausadoRef.current = false;
        sessaoRef.current = null;
        setTerminaEm(null);
        setFase(novaFase);
    }, [destruirPlayer]);

    const abrirSessao = useCallback(async () => {
        const res = await ligarCamera();
        sessaoRef.current = res.data.sessao;
        hlsUrlRef.current = res.data.hls_url;
        setCamera(res.data);
        setTerminaEm(res.data.sessao_termina_em);
    }, []);

    // Player foi pausado porque a aba ficou oculta: volta a buscar o vídeo com
    // o relógio do timeout zerado. Só nesse caso — se o player estiver entre
    // tentativas de reconexão, quem decide é o próprio ciclo de retry/timeout
    // (senão cada heartbeat zeraria o timeout e a página nunca desistiria).
    const reconectarSeParado = useCallback(() => {
        if (!sessaoRef.current || !pausadoRef.current || playerAtivo()) return;
        pausadoRef.current = false;
        clearTimeout(retryRef.current);
        ultimoVideoRef.current = Date.now();
        conectarRef.current();
    }, [playerAtivo]);

    const renovar = useCallback(async () => {
        const sessao = sessaoRef.current;
        if (!sessao) return;
        try {
            const res = await renovarCamera(sessao);
            setCamera(res.data);
            reconectarSeParado();
        } catch (err) {
            const motivo = err.response?.data?.motivo;
            if (motivo === 'tempo_esgotado') {
                encerrarLocal('esgotado');
            } else if (motivo === 'sessao_inexistente') {
                // Expirou (ex.: aba ficou oculta por muito tempo): abre outra.
                // O Pi pode ter parado, então o player volta a "ligando".
                try {
                    await abrirSessao();
                    reconectarSeParado();
                } catch {
                    encerrarLocal('erro');
                }
            }
            // Outros erros (rede): tenta de novo no próximo heartbeat
        }
    }, [abrirSessao, encerrarLocal, reconectarSeParado]);

    const ligar = async () => {
        if (!suportaVideo()) {
            setFase('erro');
            return;
        }
        try {
            await abrirSessao();
        } catch {
            setFase('erro');
            return;
        }
        setFase('ligando');
        pausadoRef.current = false;
        ultimoVideoRef.current = Date.now();
        conectarPlayer();

        pararHeartbeat();
        heartbeatRef.current = setInterval(() => {
            if (document.visibilityState === 'visible') renovar();
        }, HEARTBEAT_MS);
    };

    const parar = async () => {
        const sessao = sessaoRef.current;
        encerrarLocal('desligada');
        if (sessao) {
            try {
                await desligarCamera(sessao);
            } catch {
                // a sessão expira sozinha de qualquer forma
            }
        }
        atualizarStatus();
    };

    // Voltou para a aba depois de um tempo escondida: renova na hora, já que
    // o heartbeat foi pulado enquanto ela estava oculta
    useEffect(() => {
        const onVisibility = () => {
            if (document.visibilityState === 'visible' && sessaoRef.current) renovar();
        };
        document.addEventListener('visibilitychange', onVisibility);
        return () => document.removeEventListener('visibilitychange', onVisibility);
    }, [renovar]);

    // Fechou a aba/navegador: avisa o backend na hora (keepalive sobrevive ao
    // fechamento), em vez de esperar a sessão expirar
    useEffect(() => {
        const onPageHide = () => {
            if (sessaoRef.current) desligarCameraAoSair(sessaoRef.current);
        };
        // Voltou pelo "voltar" do navegador (página restaurada do bfcache): a
        // sessão já foi encerrada no pagehide, então volta ao estado desligado
        const onPageShow = (e) => {
            if (e.persisted && sessaoRef.current) encerrarLocal('desligada');
        };
        window.addEventListener('pagehide', onPageHide);
        window.addEventListener('pageshow', onPageShow);
        return () => {
            window.removeEventListener('pagehide', onPageHide);
            window.removeEventListener('pageshow', onPageShow);
        };
    }, [encerrarLocal]);

    // Saiu da página (navegação interna): derruba o player e encerra a sessão
    useEffect(() => () => {
        pararHeartbeat();
        destruirPlayer();
        if (sessaoRef.current) desligarCamera(sessaoRef.current).catch(() => {});
    }, [destruirPlayer]);

    const transmitindo = fase === 'ligando' || fase === 'ao_vivo';
    const outrosAssistindo = camera ? Math.max(0, camera.espectadores - (transmitindo ? 1 : 0)) : 0;

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
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {outrosAssistindo > 0 && (
                                <Chip size="small" variant="outlined" label={`${outrosAssistindo} assistindo agora`} />
                            )}
                            <Chip
                                size="small"
                                label={camera.pi_online ? 'Pi online' : 'Pi offline'}
                                color={camera.pi_online ? 'success' : 'default'}
                                variant={camera.pi_online ? 'filled' : 'outlined'}
                            />
                        </Box>
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
                        {fase === 'ligando' && camera && !camera.pi_online && (
                            <Alert severity="warning" sx={{ mb: 2 }}>
                                O Raspberry Pi não está se comunicando com o servidor. A imagem só aparece quando ele voltar a ficar online.
                            </Alert>
                        )}
                        {fase === 'esgotado' && (
                            <Alert severity="info" sx={{ mb: 2 }}>
                                A transmissão foi encerrada após {camera?.sessao_max_minutos ?? 30} minutos para economizar dados. Clique em &quot;Continuar assistindo&quot; se ainda precisar.
                            </Alert>
                        )}

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
                            {(fase === 'desligada' || fase === 'esgotado') && (
                                <Typography sx={{ color: 'grey.500' }}>Câmera desligada</Typography>
                            )}
                            {fase === 'erro' && (
                                <Typography sx={{ color: 'grey.400', px: 2, textAlign: 'center' }}>
                                    {suportaVideo()
                                        ? 'A câmera não respondeu. Verifique se o Pi está online e tente de novo.'
                                        : 'Este navegador não suporta a reprodução do vídeo ao vivo. Use Chrome, Edge, Firefox ou Safari atualizado.'}
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

                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mt: 2, flexWrap: 'wrap' }}>
                            {transmitindo ? (
                                <Button variant="outlined" color="error" startIcon={<StopIcon />} onClick={parar}>
                                    Parar
                                </Button>
                            ) : (
                                <Button variant="contained" startIcon={<PlayIcon />} onClick={ligar}>
                                    {{ erro: 'Tentar de novo', esgotado: 'Continuar assistindo' }[fase] ?? 'Ligar câmera'}
                                </Button>
                            )}
                            {transmitindo && terminaEm && (
                                <Typography variant="caption" color="text.secondary">
                                    Desliga automaticamente às {formatarHora(terminaEm)}
                                </Typography>
                            )}
                        </Box>
                    </CardContent>
                </Card>
            )}
        </Box>
    );
}
