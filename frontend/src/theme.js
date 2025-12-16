import { createTheme, alpha } from '@mui/material/styles';

// Paleta de cores inspirada em apiário
const palette = {
    honey: {
        main: '#F4A100',
        light: '#FFB933',
        dark: '#D4860B',
        contrastText: '#FFFFFF',
    },
    nature: {
        main: '#2E7D32',
        light: '#4CAF50',
        dark: '#1B5E20',
        contrastText: '#FFFFFF',
    },
    earth: {
        main: '#5D4037',
        light: '#8B6B61',
        dark: '#3E2723',
        contrastText: '#FFFFFF',
    },
    cream: {
        main: '#FFF8E1',
        light: '#FFFEF5',
        dark: '#FFE0B2',
    },
};

const theme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: palette.honey.main,
            light: palette.honey.light,
            dark: palette.honey.dark,
            contrastText: palette.honey.contrastText,
        },
        secondary: {
            main: palette.nature.main,
            light: palette.nature.light,
            dark: palette.nature.dark,
            contrastText: palette.nature.contrastText,
        },
        background: {
            default: '#F5F5F5',
            paper: '#FFFFFF',
        },
        text: {
            primary: palette.earth.dark,
            secondary: palette.earth.main,
        },
        success: {
            main: '#4CAF50',
        },
        warning: {
            main: '#FF9800',
        },
        error: {
            main: '#F44336',
        },
        info: {
            main: '#2196F3',
        },
    },
    typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        h1: {
            fontWeight: 700,
            fontSize: '2.5rem',
        },
        h2: {
            fontWeight: 700,
            fontSize: '2rem',
        },
        h3: {
            fontWeight: 600,
            fontSize: '1.75rem',
        },
        h4: {
            fontWeight: 600,
            fontSize: '1.5rem',
        },
        h5: {
            fontWeight: 600,
            fontSize: '1.25rem',
        },
        h6: {
            fontWeight: 600,
            fontSize: '1rem',
        },
        button: {
            textTransform: 'none',
            fontWeight: 600,
        },
    },
    shape: {
        borderRadius: 12,
    },
    shadows: [
        'none',
        '0px 2px 4px rgba(0,0,0,0.05)',
        '0px 4px 8px rgba(0,0,0,0.08)',
        '0px 6px 12px rgba(0,0,0,0.1)',
        '0px 8px 16px rgba(0,0,0,0.12)',
        '0px 10px 20px rgba(0,0,0,0.14)',
        '0px 12px 24px rgba(0,0,0,0.16)',
        '0px 14px 28px rgba(0,0,0,0.18)',
        '0px 16px 32px rgba(0,0,0,0.2)',
        '0px 18px 36px rgba(0,0,0,0.22)',
        '0px 20px 40px rgba(0,0,0,0.24)',
        '0px 22px 44px rgba(0,0,0,0.26)',
        '0px 24px 48px rgba(0,0,0,0.28)',
        '0px 26px 52px rgba(0,0,0,0.3)',
        '0px 28px 56px rgba(0,0,0,0.32)',
        '0px 30px 60px rgba(0,0,0,0.34)',
        '0px 32px 64px rgba(0,0,0,0.36)',
        '0px 34px 68px rgba(0,0,0,0.38)',
        '0px 36px 72px rgba(0,0,0,0.4)',
        '0px 38px 76px rgba(0,0,0,0.42)',
        '0px 40px 80px rgba(0,0,0,0.44)',
        '0px 42px 84px rgba(0,0,0,0.46)',
        '0px 44px 88px rgba(0,0,0,0.48)',
        '0px 46px 92px rgba(0,0,0,0.5)',
        '0px 48px 96px rgba(0,0,0,0.52)',
    ],
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    padding: '10px 24px',
                    boxShadow: 'none',
                    '&:hover': {
                        boxShadow: '0px 4px 12px rgba(244, 161, 0, 0.3)',
                    },
                },
                containedPrimary: {
                    background: `linear-gradient(135deg, ${palette.honey.main} 0%, ${palette.honey.dark} 100%)`,
                    '&:hover': {
                        background: `linear-gradient(135deg, ${palette.honey.light} 0%, ${palette.honey.main} 100%)`,
                    },
                },
                containedSecondary: {
                    background: `linear-gradient(135deg, ${palette.nature.main} 0%, ${palette.nature.dark} 100%)`,
                    '&:hover': {
                        background: `linear-gradient(135deg, ${palette.nature.light} 0%, ${palette.nature.main} 100%)`,
                    },
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 16,
                    boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.08)',
                    transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                    '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0px 8px 30px rgba(0, 0, 0, 0.12)',
                    },
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                },
                elevation1: {
                    boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)',
                },
            },
        },
        MuiAppBar: {
            styleOverrides: {
                root: {
                    boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.1)',
                },
            },
        },
        MuiDrawer: {
            styleOverrides: {
                paper: {
                    borderRight: 'none',
                    boxShadow: '4px 0px 20px rgba(0, 0, 0, 0.05)',
                },
            },
        },
        MuiListItemButton: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    margin: '4px 8px',
                    '&.Mui-selected': {
                        backgroundColor: alpha(palette.honey.main, 0.15),
                        '&:hover': {
                            backgroundColor: alpha(palette.honey.main, 0.25),
                        },
                    },
                    '&:hover': {
                        backgroundColor: alpha(palette.honey.main, 0.08),
                    },
                },
            },
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    fontWeight: 500,
                },
                colorSuccess: {
                    backgroundColor: alpha('#4CAF50', 0.15),
                    color: '#2E7D32',
                },
                colorWarning: {
                    backgroundColor: alpha('#FF9800', 0.15),
                    color: '#E65100',
                },
                colorError: {
                    backgroundColor: alpha('#F44336', 0.15),
                    color: '#C62828',
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        borderRadius: 8,
                    },
                },
            },
        },
        MuiTableHead: {
            styleOverrides: {
                root: {
                    '& .MuiTableCell-head': {
                        backgroundColor: palette.cream.main,
                        fontWeight: 600,
                        color: palette.earth.dark,
                    },
                },
            },
        },
        MuiTableRow: {
            styleOverrides: {
                root: {
                    '&:hover': {
                        backgroundColor: alpha(palette.honey.main, 0.04),
                    },
                },
            },
        },
        MuiFab: {
            styleOverrides: {
                primary: {
                    background: `linear-gradient(135deg, ${palette.honey.main} 0%, ${palette.honey.dark} 100%)`,
                    '&:hover': {
                        background: `linear-gradient(135deg, ${palette.honey.light} 0%, ${palette.honey.main} 100%)`,
                    },
                },
            },
        },
    },
});

export default theme;
