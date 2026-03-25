import { createTheme, alpha } from '@mui/material/styles';

// Design tokens — Enterprise Dark with honey accent
const tokens = {
  // Backgrounds
  bgDeep:       '#0F1117',
  bgSurface:    '#141820',
  bgRaised:     '#1A1D27',
  bgHover:      '#1F2433',
  // Borders
  borderSubtle: 'rgba(255,255,255,0.06)',
  borderMedium: 'rgba(255,255,255,0.12)',
  // Amber / Honey
  amber:        '#F4A100',
  amberLight:   '#FFB933',
  amberDark:    '#C8870A',
  // Green (refined for dark)
  green:        '#4CAF50',
  greenLight:   '#81C784',
  greenDark:    '#388E3C',
  // Text
  textPrimary:  '#E8EAED',
  textSecondary:'rgba(232,234,237,0.55)',
};

// Shadows for dark mode (deeper blacks instead of light overlay)
const darkShadows = [
  'none',
  '0px 1px 3px rgba(0,0,0,0.4)',
  '0px 2px 6px rgba(0,0,0,0.45)',
  '0px 4px 12px rgba(0,0,0,0.5)',
  '0px 6px 16px rgba(0,0,0,0.52)',
  '0px 8px 20px rgba(0,0,0,0.54)',
  '0px 10px 24px rgba(0,0,0,0.56)',
  '0px 12px 28px rgba(0,0,0,0.58)',
  '0px 14px 32px rgba(0,0,0,0.6)',
  '0px 16px 36px rgba(0,0,0,0.62)',
  '0px 18px 40px rgba(0,0,0,0.64)',
  '0px 20px 44px rgba(0,0,0,0.66)',
  '0px 22px 48px rgba(0,0,0,0.68)',
  '0px 24px 52px rgba(0,0,0,0.7)',
  '0px 26px 56px rgba(0,0,0,0.72)',
  '0px 28px 60px rgba(0,0,0,0.74)',
  '0px 30px 64px rgba(0,0,0,0.76)',
  '0px 32px 68px rgba(0,0,0,0.78)',
  '0px 34px 72px rgba(0,0,0,0.8)',
  '0px 36px 76px rgba(0,0,0,0.82)',
  '0px 38px 80px rgba(0,0,0,0.84)',
  '0px 40px 84px rgba(0,0,0,0.86)',
  '0px 42px 88px rgba(0,0,0,0.88)',
  '0px 44px 92px rgba(0,0,0,0.9)',
  '0px 48px 96px rgba(0,0,0,0.92)',
];

const lightShadows = [
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
];

// Cria tema baseado no modo
export const createAppTheme = (mode) => createTheme({
  palette: {
    mode,
    primary: {
      main:          tokens.amber,
      light:         tokens.amberLight,
      dark:          tokens.amberDark,
      contrastText:  '#000000',
    },
    secondary: {
      main:          tokens.green,
      light:         tokens.greenLight,
      dark:          tokens.greenDark,
      contrastText:  '#ffffff',
    },
    background: {
      default: mode === 'dark' ? tokens.bgDeep    : '#F5F5F5',
      paper:   mode === 'dark' ? tokens.bgSurface : '#FFFFFF',
    },
    text: {
      primary:   mode === 'dark' ? tokens.textPrimary   : '#1A1A2E',
      secondary: mode === 'dark' ? tokens.textSecondary : 'rgba(26,26,46,0.6)',
      disabled:  mode === 'dark' ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.38)',
    },
    divider: mode === 'dark' ? tokens.borderSubtle : 'rgba(0,0,0,0.12)',
    success: {
      main:  '#4CAF50',
      light: '#81C784',
      dark:  '#388E3C',
      contrastText: '#ffffff',
    },
    warning: {
      main:  '#FF9800',
      light: '#FFB74D',
      dark:  '#F57C00',
      contrastText: '#000000',
    },
    error: {
      main:  '#F44336',
      light: '#EF9A9A',
      dark:  '#C62828',
      contrastText: '#ffffff',
    },
    info: {
      main:  '#2196F3',
      light: '#64B5F6',
      dark:  '#1565C0',
      contrastText: '#ffffff',
    },
  },

  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 700, fontSize: '2.5rem',  letterSpacing: '-0.02em' },
    h2: { fontWeight: 700, fontSize: '2rem',    letterSpacing: '-0.01em' },
    h3: { fontWeight: 600, fontSize: '1.75rem', letterSpacing: '-0.01em' },
    h4: { fontWeight: 600, fontSize: '1.5rem',  letterSpacing: '-0.005em' },
    h5: { fontWeight: 600, fontSize: '1.25rem' },
    h6: { fontWeight: 600, fontSize: '1rem' },
    overline: { letterSpacing: '0.1em', fontWeight: 600, fontSize: '0.68rem' },
    button: { textTransform: 'none', fontWeight: 600 },
  },

  shape: {
    borderRadius: 10,
  },

  shadows: mode === 'dark' ? darkShadows : lightShadows,

  components: {
    // ─── Paper ────────────────────────────────────────────────────────────────
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          backgroundImage: 'none', // Remove MUI's dark-mode white overlay
        },
      },
    },

    // ─── Card ─────────────────────────────────────────────────────────────────
    MuiCard: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 12,
          backgroundImage: 'none',
          border: `1px solid ${mode === 'dark' ? tokens.borderSubtle : 'rgba(0,0,0,0.08)'}`,
          boxShadow: 'none',
          transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
          '&:hover': {
            borderColor: mode === 'dark' ? tokens.borderMedium : 'rgba(0,0,0,0.16)',
            boxShadow: mode === 'dark'
              ? `0 0 0 1px ${tokens.borderMedium}, 0 8px 32px rgba(0,0,0,0.4)`
              : '0px 8px 24px rgba(0,0,0,0.1)',
          },
        }),
      },
    },

    // ─── AppBar ───────────────────────────────────────────────────────────────
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          background:   mode === 'dark' ? tokens.bgDeep : '#FFFFFF',
          borderBottom: `1px solid ${mode === 'dark' ? tokens.borderSubtle : 'rgba(0,0,0,0.1)'}`,
          boxShadow:    'none',
          color: mode === 'dark' ? tokens.textPrimary : '#1A1A2E',
        },
      },
    },

    // ─── Drawer ───────────────────────────────────────────────────────────────
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundImage: 'none',
          background:   mode === 'dark' ? tokens.bgRaised : '#FFFFFF',
          borderRight:  `1px solid ${mode === 'dark' ? tokens.borderSubtle : 'rgba(0,0,0,0.1)'}`,
          boxShadow:    'none',
        },
      },
    },

    // ─── Button ───────────────────────────────────────────────────────────────
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 20px',
          fontWeight: 600,
          boxShadow: 'none',
          '&:hover': { boxShadow: 'none' },
        },
        containedPrimary: {
          background: `linear-gradient(135deg, ${tokens.amber} 0%, ${tokens.amberDark} 100%)`,
          color: '#000000',
          '&:hover': {
            background: `linear-gradient(135deg, ${tokens.amberLight} 0%, ${tokens.amber} 100%)`,
            boxShadow: `0 0 20px ${alpha(tokens.amber, 0.35)}`,
          },
        },
        containedSecondary: {
          background: `linear-gradient(135deg, ${tokens.green} 0%, ${tokens.greenDark} 100%)`,
          '&:hover': {
            background: `linear-gradient(135deg, ${tokens.greenLight} 0%, ${tokens.green} 100%)`,
          },
        },
        outlinedPrimary: {
          borderColor: alpha(tokens.amber, 0.5),
          color: tokens.amber,
          '&:hover': {
            borderColor: tokens.amber,
            background: alpha(tokens.amber, 0.08),
          },
        },
      },
    },

    // ─── ListItemButton ───────────────────────────────────────────────────────
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '2px 8px',
          padding: '8px 12px',
          transition: 'background-color 0.15s ease, color 0.15s ease',
          '&.Mui-selected': {
            backgroundColor: alpha(tokens.amber, 0.12),
            '& .MuiListItemIcon-root': { color: tokens.amber },
            '& .MuiListItemText-primary': { color: tokens.amber, fontWeight: 600 },
            '&:hover': { backgroundColor: alpha(tokens.amber, 0.18) },
          },
          '&:hover': {
            backgroundColor: mode === 'dark' ? alpha('#ffffff', 0.05) : alpha(tokens.amber, 0.06),
          },
        },
      },
    },

    // ─── Chip ─────────────────────────────────────────────────────────────────
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontWeight: 500,
          fontSize: '0.75rem',
        },
        colorSuccess: mode === 'dark' ? {
          backgroundColor: alpha('#4CAF50', 0.12),
          color: '#81C784',
          border: `1px solid ${alpha('#4CAF50', 0.25)}`,
        } : {
          backgroundColor: alpha('#4CAF50', 0.12),
          color: '#2E7D32',
        },
        colorWarning: mode === 'dark' ? {
          backgroundColor: alpha('#FF9800', 0.12),
          color: '#FFB74D',
          border: `1px solid ${alpha('#FF9800', 0.25)}`,
        } : {
          backgroundColor: alpha('#FF9800', 0.12),
          color: '#E65100',
        },
        colorError: mode === 'dark' ? {
          backgroundColor: alpha('#F44336', 0.12),
          color: '#EF9A9A',
          border: `1px solid ${alpha('#F44336', 0.25)}`,
        } : {
          backgroundColor: alpha('#F44336', 0.12),
          color: '#C62828',
        },
        colorInfo: mode === 'dark' ? {
          backgroundColor: alpha('#2196F3', 0.12),
          color: '#64B5F6',
          border: `1px solid ${alpha('#2196F3', 0.25)}`,
        } : {
          backgroundColor: alpha('#2196F3', 0.12),
          color: '#1565C0',
        },
        colorPrimary: mode === 'dark' ? {
          backgroundColor: alpha(tokens.amber, 0.12),
          color: tokens.amberLight,
          border: `1px solid ${alpha(tokens.amber, 0.25)}`,
        } : {},
      },
    },

    // ─── TextField / OutlinedInput ────────────────────────────────────────────
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: mode === 'dark' ? tokens.borderMedium : 'rgba(0,0,0,0.23)',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.4)',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: tokens.amber,
            borderWidth: 1,
          },
        },
        input: {
          '&::placeholder': {
            color: mode === 'dark' ? 'rgba(232,234,237,0.35)' : 'rgba(0,0,0,0.35)',
            opacity: 1,
          },
        },
      },
    },

    // ─── Table ────────────────────────────────────────────────────────────────
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            backgroundColor: mode === 'dark' ? tokens.bgRaised : '#F8F9FA',
            color: mode === 'dark' ? 'rgba(232,234,237,0.7)' : 'rgba(26,26,46,0.7)',
            fontWeight: 600,
            fontSize: '0.72rem',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            borderBottom: `1px solid ${mode === 'dark' ? tokens.borderSubtle : 'rgba(0,0,0,0.1)'}`,
            padding: '10px 16px',
          },
        },
      },
    },

    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover .MuiTableCell-root': {
            backgroundColor: mode === 'dark' ? tokens.bgHover : alpha(tokens.amber, 0.03),
          },
          '& .MuiTableCell-root': {
            borderColor: mode === 'dark' ? tokens.borderSubtle : 'rgba(0,0,0,0.08)',
            transition: 'background-color 0.15s ease',
          },
        },
      },
    },

    MuiTableContainer: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },

    MuiTablePagination: {
      styleOverrides: {
        root: {
          borderTop: `1px solid ${mode === 'dark' ? tokens.borderSubtle : 'rgba(0,0,0,0.08)'}`,
          color: mode === 'dark' ? 'rgba(232,234,237,0.6)' : 'rgba(26,26,46,0.6)',
        },
      },
    },

    // ─── Dialog ───────────────────────────────────────────────────────────────
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundImage: 'none',
          background: mode === 'dark' ? tokens.bgSurface : '#FFFFFF',
          border: mode === 'dark' ? `1px solid ${tokens.borderSubtle}` : 'none',
          borderRadius: 16,
        },
      },
    },

    MuiDialogTitle: {
      styleOverrides: {
        root: {
          borderBottom: `1px solid ${mode === 'dark' ? tokens.borderSubtle : 'rgba(0,0,0,0.1)'}`,
          paddingBottom: 16,
          fontWeight: 600,
        },
      },
    },

    // ─── Menu ─────────────────────────────────────────────────────────────────
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundImage: 'none',
          background: mode === 'dark' ? tokens.bgRaised : '#FFFFFF',
          border: mode === 'dark' ? `1px solid ${tokens.borderSubtle}` : '1px solid rgba(0,0,0,0.1)',
          boxShadow: mode === 'dark'
            ? '0 8px 32px rgba(0,0,0,0.5)'
            : '0 4px 20px rgba(0,0,0,0.12)',
          borderRadius: 10,
        },
      },
    },

    MuiMenuItem: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          margin: '2px 4px',
          '&:hover': {
            backgroundColor: mode === 'dark' ? alpha('#ffffff', 0.05) : alpha(tokens.amber, 0.06),
          },
          '&.Mui-selected': {
            backgroundColor: alpha(tokens.amber, 0.1),
            '&:hover': { backgroundColor: alpha(tokens.amber, 0.15) },
          },
        },
      },
    },

    // ─── Skeleton ─────────────────────────────────────────────────────────────
    MuiSkeleton: {
      styleOverrides: {
        root: {
          backgroundColor: mode === 'dark' ? alpha('#ffffff', 0.07) : alpha('#000000', 0.08),
          '&::after': {
            background: mode === 'dark'
              ? `linear-gradient(90deg, transparent, ${alpha('#ffffff', 0.04)}, transparent)`
              : `linear-gradient(90deg, transparent, ${alpha('#ffffff', 0.5)}, transparent)`,
          },
        },
      },
    },

    // ─── FAB ──────────────────────────────────────────────────────────────────
    MuiFab: {
      styleOverrides: {
        primary: {
          background: `linear-gradient(135deg, ${tokens.amber} 0%, ${tokens.amberDark} 100%)`,
          color: '#000000',
          boxShadow: `0 4px 20px ${alpha(tokens.amber, 0.4)}`,
          '&:hover': {
            background: `linear-gradient(135deg, ${tokens.amberLight} 0%, ${tokens.amber} 100%)`,
            boxShadow: `0 6px 28px ${alpha(tokens.amber, 0.55)}`,
          },
        },
      },
    },

    // ─── Tooltip ──────────────────────────────────────────────────────────────
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: mode === 'dark' ? tokens.bgRaised : '#1A1A2E',
          border: mode === 'dark' ? `1px solid ${tokens.borderSubtle}` : 'none',
          fontSize: '0.75rem',
          fontWeight: 500,
        },
        arrow: {
          color: mode === 'dark' ? tokens.bgRaised : '#1A1A2E',
        },
      },
    },

    // ─── Select ───────────────────────────────────────────────────────────────
    MuiSelect: {
      styleOverrides: {
        icon: {
          color: mode === 'dark' ? tokens.textSecondary : undefined,
        },
      },
    },

    // ─── InputLabel ───────────────────────────────────────────────────────────
    MuiInputLabel: {
      styleOverrides: {
        root: {
          '&.Mui-focused': {
            color: tokens.amber,
          },
        },
      },
    },

    // ─── Switch ───────────────────────────────────────────────────────────────
    MuiSwitch: {
      styleOverrides: {
        switchBase: {
          '&.Mui-checked': {
            color: tokens.amber,
            '& + .MuiSwitch-track': {
              backgroundColor: alpha(tokens.amber, 0.5),
            },
          },
        },
      },
    },
  },
});

// Exporta tema padrão dark
const theme = createAppTheme('dark');
export default theme;
