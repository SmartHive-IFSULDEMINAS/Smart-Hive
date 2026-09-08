import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Box,
    Drawer,
    AppBar,
    Toolbar,
    List,
    Typography,
    Divider,
    IconButton,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Avatar,
    Badge,
    Button,
    CircularProgress,
    Menu,
    MenuItem,
    useTheme,
    useMediaQuery,
    alpha,
    Tooltip,
} from '@mui/material';
import {
    getNotificacoes,
    getNotificacoesNaoLidas,
    marcarNotificacaoLida,
    marcarTodasNotificacoesLidas,
} from '../services/api';

import {
    Menu as MenuIcon,
    Dashboard as DashboardIcon,
    Place as PlaceIcon,
    Hive as HiveIcon,
    Search as SearchIcon,
    GraphicEq as NoiseIcon,
    LocalFlorist as HoneyIcon,
    Grain as PolenIcon,
    Opacity as PropolisIcon,
    Healing as TreatmentIcon,
    BugReport as BugIcon,
    Biotech as BiotechIcon,
    CameraAlt as CameraIcon,
    NotificationsActive as AlertsIcon,
    Assessment as AnalyticsIcon,
    Summarize as ReportsIcon,
    Brightness4 as DarkModeIcon,
    Brightness7 as LightModeIcon,
    ChevronLeft as ChevronLeftIcon,
    ChevronRight as ChevronRightIcon,
    NotificationsNone as BellIcon,
    ExpandMore as ExpandMoreIcon,
    Logout as LogoutIcon,
    Person as PersonIcon,
} from '@mui/icons-material';
import { useThemeMode } from '../contexts/ThemeModeContext';
import { useAuth } from '../contexts/AuthContext';
import smartHiveLogo from '../../imagens/logo_smart_hive.png';

const DRAWER_EXPANDED = 240;
const DRAWER_COLLAPSED = 64;

const menuSections = [
    {
        label: 'GESTÃO',
        items: [
            { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
            { text: 'Apiários',  icon: <PlaceIcon />,     path: '/apiarios' },
            { text: 'Colmeias',  icon: <HiveIcon />,       path: '/colmeias' },
        ],
    },
    {
        label: 'OPERAÇÕES',
        items: [
            { text: 'Inspeções',   icon: <SearchIcon />,    path: '/inspecoes' },
            { text: 'Histórico IoT', icon: <NoiseIcon />,   path: '/historico-ruido' },
            { text: 'Alertas',     icon: <AlertsIcon />,    path: '/alertas' },
            { text: 'Análises',    icon: <AnalyticsIcon />, path: '/analises' },
            { text: 'Produção',    icon: <HoneyIcon />,     path: '/producao' },
            { text: 'Produção de Pólen',    icon: <PolenIcon />,     path: '/producao-polen' },
            { text: 'Produção de Própolis', icon: <PropolisIcon />,  path: '/producao-propolis' },
            { text: 'Tratamentos', icon: <TreatmentIcon />, path: '/tratamentos' },
        ],
    },
    {
        label: 'RELATÓRIOS',
        items: [
            { text: 'Relatórios', icon: <ReportsIcon />, path: '/relatorios' },
        ],
    },
    {
        label: 'REFERÊNCIA',
        items: [
            { text: 'Espécies', icon: <BugIcon />, path: '/especies' },
        ],
    },
    {
        label: 'INTELIGÊNCIA ARTIFICIAL',
        items: [
            { text: 'Análise de Pólen', icon: <BiotechIcon />, path: '/ia-polen' },
            { text: 'Detecção de Abelhas', icon: <CameraIcon />, path: '/deteccao-abelhas' },
        ],
    },
];

// Mapa de path → título para o AppBar
const pageTitles = {
    '/':           'Dashboard',
    '/apiarios':   'Apiários',
    '/colmeias':   'Colmeias',
    '/inspecoes':  'Inspeções',
    '/historico-ruido': 'Histórico IoT',
    '/alertas':    'Alertas',
    '/analises':   'Análises',
    '/relatorios': 'Relatórios',
    '/producao':   'Produção',
    '/producao-polen': 'Produção de Pólen',
    '/producao-propolis': 'Produção de Própolis',
    '/tratamentos':'Tratamentos',
    '/especies':   'Espécies',
    '/ia-polen':   'IA — Análise de Pólen',
    '/deteccao-abelhas': 'Detecção de Abelhas',
};

export default function Layout({ children }) {
    const theme = useTheme();
    const { mode, toggleTheme } = useThemeMode();
    const { user, logout, isDono, isGestor } = useAuth();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [mobileOpen, setMobileOpen] = useState(false);
    const [sidebarExpanded, setSidebarExpanded] = useState(true);
    const [userMenuAnchor, setUserMenuAnchor] = useState(null);
    const [notificationsAnchor, setNotificationsAnchor] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [notificationsLoading, setNotificationsLoading] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    const drawerWidth = sidebarExpanded ? DRAWER_EXPANDED : DRAWER_COLLAPSED;

    const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

    const handleNavigate = (path) => {
        navigate(path);
        if (isMobile) setMobileOpen(false);
    };

    const handleUserMenuOpen = (e) => setUserMenuAnchor(e.currentTarget);
    const handleUserMenuClose = () => setUserMenuAnchor(null);

    const handleLogout = () => {
        handleUserMenuClose();
        logout();
    };

    const carregarNotificacoes = async () => {
        try {
            setNotificationsLoading(true);
            const [listaRes, naoLidasRes] = await Promise.all([
                getNotificacoes(),
                getNotificacoesNaoLidas(),
            ]);
            const itens = listaRes.data?.results || listaRes.data || [];
            const naoLidas = naoLidasRes.data || [];
            setNotifications(itens);
            setUnreadCount(naoLidas.length);
        } catch (error) {
            console.error('Erro ao carregar notificações:', error);
        } finally {
            setNotificationsLoading(false);
        }
    };

    const handleNotificationsOpen = async (event) => {
        setNotificationsAnchor(event.currentTarget);
        await carregarNotificacoes();
    };

    const handleNotificationsClose = () => setNotificationsAnchor(null);

    const handleMarcarComoLida = async (id) => {
        try {
            await marcarNotificacaoLida(id);
            await carregarNotificacoes();
        } catch (error) {
            console.error('Erro ao marcar notificação como lida:', error);
        }
    };

    const handleMarcarTodasComoLidas = async () => {
        try {
            await marcarTodasNotificacoesLidas();
            await carregarNotificacoes();
        } catch (error) {
            console.error('Erro ao marcar todas as notificações como lidas:', error);
        }
    };

    useEffect(() => {
        carregarNotificacoes();
        const intervalId = setInterval(carregarNotificacoes, 60000);
        return () => clearInterval(intervalId);
    }, []);

    // Iniciais do usuário para o Avatar
    const userInitials = user?.username
        ? user.username.slice(0, 2).toUpperCase()
        : <PersonIcon fontSize="small" />;

    // Rótulo do papel
    const userRole = isDono ? 'Proprietário' : isGestor ? 'Gestor' : 'Apicultor';

    const drawerContent = (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Logo area */}
            <Box
                sx={{
                    height: 64,
                    display: 'flex',
                    alignItems: 'center',
                    px: sidebarExpanded ? 2.5 : 0,
                    justifyContent: sidebarExpanded ? 'flex-start' : 'center',
                    flexShrink: 0,
                    transition: 'padding 0.2s ease',
                    overflow: 'hidden',
                }}
            >
                <Box
                    sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        overflow: 'hidden',
                        boxShadow: `0 0 12px ${alpha(theme.palette.primary.main, 0.28)}`,
                    }}
                >
                    <Box
                        component="img"
                        src={smartHiveLogo}
                        alt="Logo Smart-Hive"
                        sx={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                        }}
                    />
                </Box>

                <Box
                    sx={{
                        ml: 1.5,
                        opacity: sidebarExpanded ? 1 : 0,
                        transition: 'opacity 0.15s ease',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                    }}
                >
                    <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.2, color: 'text.primary' }}>
                        Smart-Hive
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>
                        Gestão de Apiário
                    </Typography>
                </Box>
            </Box>

            <Divider />

            {/* Navigation list */}
            <List sx={{ flex: 1, px: 1, py: 1.5, overflowY: 'auto', overflowX: 'hidden' }}>
                {menuSections.map((section) => (
                    <Box key={section.label}>
                        {/* Section label */}
                        <Typography
                            variant="overline"
                            sx={{
                                display: 'block',
                                px: 2,
                                color: 'text.disabled',
                                fontSize: '0.6rem',
                                letterSpacing: '0.1em',
                                lineHeight: '2rem',
                                opacity: sidebarExpanded ? 1 : 0,
                                height: sidebarExpanded ? 'auto' : 0,
                                overflow: 'hidden',
                                transition: 'opacity 0.15s ease, height 0.2s ease',
                            }}
                        >
                            {section.label}
                        </Typography>

                        {section.items.map((item) => {
                            const isSelected = location.pathname === item.path;
                            return (
                                <ListItem key={item.text} disablePadding sx={{ mb: 0.25 }}>
                                    <Tooltip
                                        title={item.text}
                                        placement="right"
                                        disableHoverListener={sidebarExpanded}
                                        arrow
                                    >
                                        <ListItemButton
                                            selected={isSelected}
                                            onClick={() => handleNavigate(item.path)}
                                            sx={{
                                                minHeight: 40,
                                                justifyContent: sidebarExpanded ? 'flex-start' : 'center',
                                                px: sidebarExpanded ? 1.5 : 1,
                                                transition: 'padding 0.2s ease',
                                            }}
                                        >
                                            <ListItemIcon
                                                sx={{
                                                    minWidth: sidebarExpanded ? 40 : 'auto',
                                                    justifyContent: 'center',
                                                    color: isSelected
                                                        ? theme.palette.primary.main
                                                        : theme.palette.text.secondary,
                                                    transition: 'min-width 0.2s ease',
                                                    '& .MuiSvgIcon-root': { fontSize: 20 },
                                                }}
                                            >
                                                {item.icon}
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={item.text}
                                                sx={{
                                                    opacity: sidebarExpanded ? 1 : 0,
                                                    transition: 'opacity 0.15s ease',
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    m: 0,
                                                }}
                                                primaryTypographyProps={{
                                                    fontWeight: isSelected ? 600 : 400,
                                                    fontSize: '0.875rem',
                                                }}
                                            />
                                        </ListItemButton>
                                    </Tooltip>
                                </ListItem>
                            );
                        })}

                        <Box sx={{ mb: 0.5 }} />
                    </Box>
                ))}
            </List>

            <Divider />

            {/* Toggle button */}
            <Box sx={{ p: 1, display: 'flex', justifyContent: sidebarExpanded ? 'flex-end' : 'center' }}>
                <Tooltip title={sidebarExpanded ? 'Recolher menu' : 'Expandir menu'} placement="right">
                    <IconButton
                        size="small"
                        onClick={() => setSidebarExpanded((v) => !v)}
                        sx={{
                            color: 'text.disabled',
                            '&:hover': { color: 'text.secondary', bgcolor: alpha('#fff', 0.05) },
                        }}
                    >
                        {sidebarExpanded ? <ChevronLeftIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />}
                    </IconButton>
                </Tooltip>
            </Box>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
            {/* ─── AppBar ─────────────────────────────────────────────────────── */}
            <AppBar
                position="fixed"
                sx={{
                    width: { md: `calc(100% - ${drawerWidth}px)` },
                    ml:    { md: `${drawerWidth}px` },
                    transition: 'width 0.2s ease, margin-left 0.2s ease',
                    zIndex: theme.zIndex.drawer - 1,
                }}
            >
                <Toolbar sx={{ gap: 1 }}>
                    {/* Mobile hamburger */}
                    <IconButton
                        color="inherit"
                        aria-label="abrir menu"
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={{ display: { md: 'none' }, mr: 1 }}
                    >
                        <MenuIcon />
                    </IconButton>

                    {/* Page title */}
                    <Typography
                        variant="h6"
                        noWrap
                        sx={{
                            fontWeight: 600,
                            flexGrow: 1,
                            fontSize: { xs: '0.92rem', sm: '1rem' },
                            maxWidth: { xs: '40vw', sm: 'unset' },
                        }}
                    >
                        {pageTitles[location.pathname] || 'Smart-Hive'}
                    </Typography>

                    {/* Theme toggle */}
                    <Tooltip title={mode === 'light' ? 'Modo Escuro' : 'Modo Claro'}>
                        <IconButton
                            color="inherit"
                            onClick={toggleTheme}
                            size="small"
                            sx={{ color: 'text.secondary' }}
                        >
                            {mode === 'light' ? <DarkModeIcon fontSize="small" /> : <LightModeIcon fontSize="small" />}
                        </IconButton>
                    </Tooltip>

                    {/* Notifications */}
                    <Tooltip title="Notificações">
                        <IconButton
                            size="small"
                            sx={{ color: 'text.secondary' }}
                            onClick={handleNotificationsOpen}
                        >
                            <Badge badgeContent={unreadCount} color="error">
                                <BellIcon fontSize="small" />
                            </Badge>
                        </IconButton>
                    </Tooltip>

                    <Divider orientation="vertical" flexItem sx={{ mx: 0.5, borderColor: 'divider' }} />

                    {/* User avatar button */}
                    <Box
                        onClick={handleUserMenuOpen}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: { xs: 0.25, sm: 0.75 },
                            cursor: 'pointer',
                            px: { xs: 0.5, sm: 1 },
                            py: 0.5,
                            borderRadius: 2,
                            '&:hover': { bgcolor: alpha('#fff', 0.06) },
                            transition: 'background-color 0.15s ease',
                        }}
                    >
                        <Avatar
                            sx={{
                                width: 30,
                                height: 30,
                                bgcolor: theme.palette.primary.main,
                                color: '#000',
                                fontSize: '0.7rem',
                                fontWeight: 700,
                            }}
                        >
                            {userInitials}
                        </Avatar>
                        <Typography
                            variant="body2"
                            sx={{
                                fontWeight: 500,
                                fontSize: '0.8rem',
                                display: { xs: 'none', sm: 'block' },
                                color: 'text.primary',
                            }}
                        >
                            {user?.username || 'Usuário'}
                        </Typography>
                        <ExpandMoreIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                    </Box>
                </Toolbar>
            </AppBar>

            {/* User Menu */}
            <Menu
                anchorEl={notificationsAnchor}
                open={Boolean(notificationsAnchor)}
                onClose={handleNotificationsClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                PaperProps={{
                    sx: {
                        width: isSmallMobile ? 'calc(100vw - 24px)' : 'auto',
                        minWidth: { xs: 'unset', sm: 360 },
                        maxWidth: { xs: 'calc(100vw - 24px)', sm: 420 },
                        mt: 0.5,
                    },
                }}
            >
                <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle2" fontWeight={700}>
                        Notificações ({unreadCount} não lidas)
                    </Typography>
                    <Button size="small" onClick={handleMarcarTodasComoLidas} disabled={unreadCount === 0}>
                        Marcar todas
                    </Button>
                </Box>

                <Divider />

                {notificationsLoading ? (
                    <Box sx={{ px: 2, py: 2, display: 'flex', justifyContent: 'center' }}>
                        <CircularProgress size={20} />
                    </Box>
                ) : notifications.length === 0 ? (
                    <Box sx={{ px: 2, py: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                            Nenhuma notificação no momento.
                        </Typography>
                    </Box>
                ) : (
                    <Box sx={{ maxHeight: 360, overflowY: 'auto', py: 0.5 }}>
                        {notifications.slice(0, 12).map((item) => (
                            <MenuItem
                                key={item.id}
                                onClick={() => !item.lida && handleMarcarComoLida(item.id)}
                                sx={{
                                    alignItems: 'flex-start',
                                    whiteSpace: 'normal',
                                    borderLeft: '3px solid',
                                    borderLeftColor: item.lida ? 'transparent' : 'primary.main',
                                    bgcolor: item.lida ? 'transparent' : alpha(theme.palette.primary.main, 0.08),
                                    mb: 0.25,
                                }}
                            >
                                <Box sx={{ width: '100%' }}>
                                    <Typography variant="body2" fontWeight={item.lida ? 500 : 700}>
                                        {item.titulo}
                                    </Typography>
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        sx={{
                                            display: 'block',
                                            mt: 0.25,
                                            whiteSpace: 'normal',
                                            wordBreak: 'break-word',
                                        }}
                                    >
                                        {item.mensagem}
                                    </Typography>
                                    <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.5 }}>
                                        {new Date(item.created_at).toLocaleString('pt-BR')}
                                    </Typography>
                                </Box>
                            </MenuItem>
                        ))}
                    </Box>
                )}
            </Menu>

            <Menu
                anchorEl={userMenuAnchor}
                open={Boolean(userMenuAnchor)}
                onClose={handleUserMenuClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                PaperProps={{ sx: { minWidth: 200, mt: 0.5 } }}
            >
                <Box sx={{ px: 2, py: 1.5 }}>
                    <Typography variant="subtitle2" fontWeight={600}>
                        {user?.username || 'Usuário'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {userRole}
                    </Typography>
                </Box>
                <Divider />
                <MenuItem onClick={handleLogout} sx={{ color: 'error.main', mt: 0.5 }}>
                    <LogoutIcon fontSize="small" sx={{ mr: 1.5 }} />
                    Sair
                </MenuItem>
            </Menu>

            {/* ─── Sidebar nav ────────────────────────────────────────────────── */}
            <Box
                component="nav"
                sx={{
                    width: { md: drawerWidth },
                    flexShrink: { md: 0 },
                    transition: 'width 0.2s ease',
                }}
            >
                {/* Mobile drawer */}
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{ keepMounted: true }}
                    sx={{
                        display: { xs: 'block', md: 'none' },
                        '& .MuiDrawer-paper': {
                            boxSizing: 'border-box',
                            width: { xs: '85vw', sm: DRAWER_EXPANDED },
                            maxWidth: 300,
                        },
                    }}
                >
                    {drawerContent}
                </Drawer>

                {/* Desktop drawer */}
                <Drawer
                    variant="permanent"
                    sx={{
                        display: { xs: 'none', md: 'block' },
                        '& .MuiDrawer-paper': {
                            boxSizing: 'border-box',
                            width: drawerWidth,
                            transition: 'width 0.2s ease',
                            overflow: 'hidden',
                        },
                    }}
                    open
                >
                    {drawerContent}
                </Drawer>
            </Box>

            {/* ─── Main content ───────────────────────────────────────────────── */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: { xs: 1.5, sm: 2, md: 3 },
                    ml: { md: 0 },
                    width: { md: `calc(100% - ${drawerWidth}px)` },
                    transition: 'width 0.2s ease',
                    minHeight: '100vh',
                    bgcolor: 'background.default',
                }}
            >
                <Toolbar />
                {children}
            </Box>
        </Box>
    );
}
