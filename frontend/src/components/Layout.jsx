import { useState } from 'react';
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
    useTheme,
    useMediaQuery,
    alpha,
    Tooltip,
} from '@mui/material';
import {
    Menu as MenuIcon,
    Dashboard as DashboardIcon,
    Place as PlaceIcon,
    Hive as HiveIcon,
    Search as SearchIcon,
    LocalFlorist as HoneyIcon,
    Healing as TreatmentIcon,
    BugReport as BugIcon,
    Brightness4 as DarkModeIcon,
    Brightness7 as LightModeIcon,
} from '@mui/icons-material';
import { useThemeMode } from '../contexts/ThemeModeContext';

const drawerWidth = 280;

const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { text: 'Apiários', icon: <PlaceIcon />, path: '/apiarios' },
    { text: 'Colmeias', icon: <HiveIcon />, path: '/colmeias' },
    { text: 'Inspeções', icon: <SearchIcon />, path: '/inspecoes' },
    { text: 'Produção', icon: <HoneyIcon />, path: '/producao' },
    { text: 'Tratamentos', icon: <TreatmentIcon />, path: '/tratamentos' },
    { text: 'Espécies', icon: <BugIcon />, path: '/especies' },
];

export default function Layout({ children }) {
    const theme = useTheme();
    const { mode, toggleTheme } = useThemeMode();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [mobileOpen, setMobileOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const handleNavigate = (path) => {
        navigate(path);
        if (isMobile) {
            setMobileOpen(false);
        }
    };

    const drawer = (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: 3,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                }}
            >
                <Avatar
                    sx={{
                        width: 50,
                        height: 50,
                        bgcolor: 'white',
                        color: theme.palette.primary.main,
                        mr: 2,
                    }}
                >
                    <HiveIcon fontSize="large" />
                </Avatar>
                <Box>
                    <Typography variant="h6" sx={{ color: 'white', fontWeight: 700 }}>
                        Smart-Hive
                    </Typography>
                    <Typography variant="caption" sx={{ color: alpha('#fff', 0.8) }}>
                        Gestão de Apiário
                    </Typography>
                </Box>
            </Box>

            <Divider />

            <List sx={{ flex: 1, px: 1, py: 2 }}>
                {menuItems.map((item) => {
                    const isSelected = location.pathname === item.path;
                    return (
                        <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                            <ListItemButton
                                selected={isSelected}
                                onClick={() => handleNavigate(item.path)}
                                sx={{
                                    borderRadius: 2,
                                    py: 1.5,
                                    '&.Mui-selected': {
                                        backgroundColor: alpha(theme.palette.primary.main, 0.12),
                                        '& .MuiListItemIcon-root': {
                                            color: theme.palette.primary.main,
                                        },
                                        '& .MuiListItemText-primary': {
                                            color: theme.palette.primary.main,
                                            fontWeight: 600,
                                        },
                                    },
                                }}
                            >
                                <ListItemIcon
                                    sx={{
                                        minWidth: 45,
                                        color: isSelected
                                            ? theme.palette.primary.main
                                            : theme.palette.text.secondary,
                                    }}
                                >
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText
                                    primary={item.text}
                                    primaryTypographyProps={{
                                        fontWeight: isSelected ? 600 : 400,
                                    }}
                                />
                            </ListItemButton>
                        </ListItem>
                    );
                })}
            </List>

            <Divider />

            <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                    Smart-Hive v1.0.0
                </Typography>
            </Box>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
            <AppBar
                position="fixed"
                sx={{
                    width: { md: `calc(100% - ${drawerWidth}px)` },
                    ml: { md: `${drawerWidth}px` },
                    bgcolor: 'background.paper',
                    color: 'text.primary',
                }}
            >
                <Toolbar>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={{ mr: 2, display: { md: 'none' } }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 600, flexGrow: 1 }}>
                        {menuItems.find((item) => item.path === location.pathname)?.text || 'Smart-Hive'}
                    </Typography>
                    <Tooltip title={mode === 'light' ? 'Modo Escuro' : 'Modo Claro'}>
                        <IconButton 
                            color="inherit" 
                            onClick={toggleTheme}
                            aria-label="alternar modo de cor"
                        >
                            {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
                        </IconButton>
                    </Tooltip>
                </Toolbar>
            </AppBar>

            <Box
                component="nav"
                sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
            >
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{
                        keepMounted: true,
                    }}
                    sx={{
                        display: { xs: 'block', md: 'none' },
                        '& .MuiDrawer-paper': {
                            boxSizing: 'border-box',
                            width: drawerWidth,
                        },
                    }}
                >
                    {drawer}
                </Drawer>
                <Drawer
                    variant="permanent"
                    sx={{
                        display: { xs: 'none', md: 'block' },
                        '& .MuiDrawer-paper': {
                            boxSizing: 'border-box',
                            width: drawerWidth,
                        },
                    }}
                    open
                >
                    {drawer}
                </Drawer>
            </Box>

            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 3,
                    width: { md: `calc(100% - ${drawerWidth}px)` },
                    minHeight: '100vh',
                }}
            >
                <Toolbar />
                {children}
            </Box>
        </Box>
    );
}
