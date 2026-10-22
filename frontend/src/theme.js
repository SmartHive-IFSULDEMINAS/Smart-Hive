import { createTheme, alpha } from '@mui/material/styles';

// Design tokens — visual de ERP: superfícies brancas/cinza-claro, texto
// grafite e âmbar (mel) como único acento de marca. O modo escuro é um cinza
// neutro (sem tons de madeira).
//
// Âmbar: o tom de preenchimento (#D48A00) tem contraste bom com texto escuro,
// mas não com branco; por isso botões usam texto escuro e textos em âmbar
// (item ativo, links, botões contornados) usam `primary.dark` no modo claro.
const amber = {
  main:  '#D48A00',
  light: '#F0A928',
  dark:  '#9A6200',
};

const green = {
  main:  '#2E7D32',
  light: '#4CAF50',
  dark:  '#1B5E20',
};

const palettes = {
  light: {
    bgDefault:     '#F6F7F9',
    bgPaper:       '#FFFFFF',
    bgSubtle:      '#F9FAFB',
    bgHover:       '#F3F4F6',
    border:        '#E5E7EB',
    borderStrong:  '#D1D5DB',
    textPrimary:   '#1F2937',
    textSecondary: '#6B7280',
    textDisabled:  '#9CA3AF',
    accentText:    amber.dark,
  },
  dark: {
    bgDefault:     '#121417',
    bgPaper:       '#1A1D21',
    bgSubtle:      '#202429',
    bgHover:       '#262A30',
    border:        'rgba(255,255,255,0.09)',
    borderStrong:  'rgba(255,255,255,0.18)',
    textPrimary:   '#E6E8EB',
    textSecondary: 'rgba(230,232,235,0.62)',
    textDisabled:  'rgba(230,232,235,0.32)',
    accentText:    amber.light,
  },
};

// Cores dos gráficos (recharts): no claro, tons fortes (contraste >= 3:1 com o
// branco); no escuro, versões mais claras. Use via theme.palette.chart.
const chartPalettes = {
  light: {
    grid:     '#EEF0F3',
    axis:     '#D1D5DB',
    blue:     '#1976D2',
    green:    '#2E7D32',
    orange:   '#EF6C00',
    red:      '#D32F2F',
    purple:   '#7B1FA2',
    gray:     '#546E7A',
    amber:    '#C47F00',
    teal:     '#00897B',
  },
  dark: {
    grid:     'rgba(255,255,255,0.06)',
    axis:     'rgba(255,255,255,0.14)',
    blue:     '#64B5F6',
    green:    '#81C784',
    orange:   '#FFB74D',
    red:      '#EF9A9A',
    purple:   '#CE93D8',
    gray:     '#90A4AE',
    amber:    '#F0A928',
    teal:     '#4DB6AC',
  },
};

const lightShadows = [
  'none',
  '0px 1px 2px rgba(16,24,40,0.05)',
  '0px 1px 3px rgba(16,24,40,0.08), 0px 1px 2px rgba(16,24,40,0.04)',
  '0px 4px 8px -2px rgba(16,24,40,0.08), 0px 2px 4px -2px rgba(16,24,40,0.04)',
  ...Array.from({ length: 21 }, (_, i) => `0px ${8 + i * 2}px ${16 + i * 4}px -4px rgba(16,24,40,${(0.08 + i * 0.004).toFixed(3)})`),
];

const darkShadows = [
  'none',
  ...Array.from({ length: 24 }, (_, i) => `0px ${1 + i * 2}px ${3 + i * 4}px rgba(0,0,0,${(0.4 + i * 0.02).toFixed(2)})`),
];

// Cria tema baseado no modo
export const createAppTheme = (mode) => {
  const t = palettes[mode];
  const chart = chartPalettes[mode];

  return createTheme({
    palette: {
      mode,
      primary: {
        ...amber,
        contrastText: '#1F2937',
      },
      secondary: {
        ...green,
        contrastText: '#FFFFFF',
      },
      background: {
        default: t.bgDefault,
        paper:   t.bgPaper,
      },
      text: {
        primary:   t.textPrimary,
        secondary: t.textSecondary,
        disabled:  t.textDisabled,
      },
      divider: t.border,
      success: { main: '#2E7D32', light: '#4CAF50', dark: '#1B5E20', contrastText: '#FFFFFF' },
      warning: { main: '#ED6C02', light: '#FF9800', dark: '#C55A00', contrastText: '#FFFFFF' },
      error:   { main: '#D32F2F', light: '#EF5350', dark: '#B71C1C', contrastText: '#FFFFFF' },
      info:    { main: '#1976D2', light: '#42A5F5', dark: '#0D47A1', contrastText: '#FFFFFF' },
      chart,
      accentText: t.accentText,
    },

    typography: {
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      h1: { fontWeight: 700, fontSize: '2.25rem', letterSpacing: '-0.02em' },
      h2: { fontWeight: 700, fontSize: '1.875rem', letterSpacing: '-0.02em' },
      h3: { fontWeight: 700, fontSize: '1.5rem', letterSpacing: '-0.015em' },
      h4: { fontWeight: 700, fontSize: '1.375rem', letterSpacing: '-0.01em' },
      h5: { fontWeight: 600, fontSize: '1.2rem', letterSpacing: '-0.01em' },
      h6: { fontWeight: 600, fontSize: '1rem' },
      subtitle1: { fontWeight: 600 },
      subtitle2: { fontWeight: 600 },
      body2: { fontSize: '0.875rem' },
      overline: { letterSpacing: '0.04em', fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase' },
      button: { textTransform: 'none', fontWeight: 600 },
    },

    shape: {
      borderRadius: 6,
    },

    shadows: mode === 'dark' ? darkShadows : lightShadows,

    components: {
      MuiCssBaseline: {
        styleOverrides: {
          // Cores dos gráficos como variáveis CSS: valem também em constantes
          // fora dos componentes (paletas, estilos de tooltip) e trocam sozinhas
          // com o modo claro/escuro. Ex.: fill="var(--chart-green)".
          ':root': {
            ...Object.fromEntries(Object.entries(chart).map(([nome, cor]) => [`--chart-${nome}`, cor])),
            '--chart-text': t.textPrimary,
            '--chart-text-secondary': t.textSecondary,
            '--chart-tooltip-bg': t.bgPaper,
            '--chart-tooltip-border': t.border,
            '--chart-tooltip-shadow': mode === 'dark' ? '0 8px 32px rgba(0,0,0,0.5)' : lightShadows[3],
          },
          body: { fontFeatureSettings: '"cv11", "tnum"' },
        },
      },

      // ─── Paper / Card ─────────────────────────────────────────────────────
      MuiPaper: {
        styleOverrides: {
          root: { backgroundImage: 'none' },
          outlined: { borderColor: t.border },
        },
      },

      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            backgroundImage: 'none',
            border: `1px solid ${t.border}`,
            boxShadow: mode === 'dark' ? 'none' : lightShadows[1],
          },
        },
      },

      // ─── AppBar ───────────────────────────────────────────────────────────
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            background:   t.bgPaper,
            borderBottom: `1px solid ${t.border}`,
            boxShadow:    'none',
            color:        t.textPrimary,
          },
        },
      },

      // ─── Drawer (menu lateral branco com borda) ───────────────────────────
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundImage: 'none',
            background:  t.bgPaper,
            borderRight: `1px solid ${t.border}`,
            boxShadow:   'none',
          },
        },
      },

      // ─── Button ───────────────────────────────────────────────────────────
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: {
            borderRadius: 6,
            padding: '7px 16px',
            fontWeight: 600,
          },
          containedPrimary: {
            '&:hover': { backgroundColor: amber.light },
          },
          outlinedPrimary: {
            borderColor: mode === 'dark' ? alpha(amber.light, 0.5) : t.borderStrong,
            color: t.accentText,
            '&:hover': {
              borderColor: t.accentText,
              background: alpha(amber.main, 0.06),
            },
          },
          textPrimary: {
            color: t.accentText,
          },
          outlinedInherit: {
            borderColor: t.borderStrong,
          },
        },
      },

      MuiIconButton: {
        styleOverrides: {
          root: {
            borderRadius: 6,
          },
        },
      },

      // ─── Menu lateral: item ativo com barra âmbar à esquerda ──────────────
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 6,
            margin: '1px 8px',
            padding: '7px 12px',
            transition: 'background-color 0.15s ease, color 0.15s ease',
            '&.Mui-selected': {
              backgroundColor: alpha(amber.main, mode === 'dark' ? 0.14 : 0.1),
              boxShadow: `inset 3px 0 0 ${amber.main}`,
              '& .MuiListItemIcon-root': { color: t.accentText },
              '& .MuiListItemText-primary': { color: t.accentText, fontWeight: 600 },
              '&:hover': { backgroundColor: alpha(amber.main, mode === 'dark' ? 0.2 : 0.14) },
            },
            '&:hover': {
              backgroundColor: t.bgHover,
            },
          },
        },
      },

      // ─── Chip ─────────────────────────────────────────────────────────────
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 6,
            fontWeight: 500,
            fontSize: '0.75rem',
          },
          colorSuccess: {
            backgroundColor: alpha('#2E7D32', mode === 'dark' ? 0.18 : 0.1),
            color: mode === 'dark' ? '#81C784' : '#1B5E20',
          },
          colorWarning: {
            backgroundColor: alpha('#ED6C02', mode === 'dark' ? 0.18 : 0.1),
            color: mode === 'dark' ? '#FFB74D' : '#B45309',
          },
          colorError: {
            backgroundColor: alpha('#D32F2F', mode === 'dark' ? 0.18 : 0.1),
            color: mode === 'dark' ? '#EF9A9A' : '#B71C1C',
          },
          colorInfo: {
            backgroundColor: alpha('#1976D2', mode === 'dark' ? 0.18 : 0.1),
            color: mode === 'dark' ? '#90CAF9' : '#0D47A1',
          },
          colorPrimary: {
            backgroundColor: alpha(amber.main, mode === 'dark' ? 0.18 : 0.14),
            color: t.accentText,
          },
          outlined: {
            backgroundColor: 'transparent',
            borderColor: t.borderStrong,
          },
        },
      },

      // ─── Campos ───────────────────────────────────────────────────────────
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 6,
            backgroundColor: t.bgPaper,
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: t.borderStrong,
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: mode === 'dark' ? 'rgba(255,255,255,0.3)' : '#9CA3AF',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: amber.main,
              borderWidth: 1,
              boxShadow: `0 0 0 3px ${alpha(amber.main, 0.15)}`,
            },
          },
          input: {
            '&::placeholder': {
              color: t.textDisabled,
              opacity: 1,
            },
          },
        },
      },

      MuiInputLabel: {
        styleOverrides: {
          root: {
            '&.Mui-focused': {
              color: t.accentText,
            },
          },
        },
      },

      MuiSelect: {
        styleOverrides: {
          icon: { color: t.textSecondary },
        },
      },

      // ─── Tabela (estilo ERP: cabeçalho cinza, linhas finas) ────────────────
      MuiTableHead: {
        styleOverrides: {
          root: {
            '& .MuiTableCell-head': {
              backgroundColor: t.bgSubtle,
              color: t.textSecondary,
              fontWeight: 600,
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.03em',
              borderBottom: `1px solid ${t.border}`,
              padding: '10px 16px',
            },
          },
        },
      },

      MuiTableRow: {
        styleOverrides: {
          root: {
            '&:hover .MuiTableCell-root': {
              backgroundColor: t.bgSubtle,
            },
            '& .MuiTableCell-root': {
              borderColor: t.border,
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
            borderTop: `1px solid ${t.border}`,
            color: t.textSecondary,
          },
        },
      },

      // ─── Dialog / Menu / Tooltip ──────────────────────────────────────────
      MuiDialog: {
        styleOverrides: {
          paper: {
            backgroundImage: 'none',
            background: t.bgPaper,
            border: mode === 'dark' ? `1px solid ${t.border}` : 'none',
            borderRadius: 10,
          },
        },
      },

      MuiDialogTitle: {
        styleOverrides: {
          root: {
            borderBottom: `1px solid ${t.border}`,
            paddingBottom: 16,
            fontWeight: 600,
          },
        },
      },

      MuiMenu: {
        styleOverrides: {
          paper: {
            backgroundImage: 'none',
            background: t.bgPaper,
            border: `1px solid ${t.border}`,
            boxShadow: mode === 'dark' ? '0 8px 32px rgba(0,0,0,0.5)' : lightShadows[3],
            borderRadius: 8,
          },
        },
      },

      MuiMenuItem: {
        styleOverrides: {
          root: {
            borderRadius: 4,
            margin: '2px 4px',
            '&:hover': { backgroundColor: t.bgHover },
            '&.Mui-selected': {
              backgroundColor: alpha(amber.main, 0.1),
              '&:hover': { backgroundColor: alpha(amber.main, 0.15) },
            },
          },
        },
      },

      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: mode === 'dark' ? t.bgHover : '#1F2937',
            fontSize: '0.75rem',
            fontWeight: 500,
          },
          arrow: {
            color: mode === 'dark' ? t.bgHover : '#1F2937',
          },
        },
      },

      MuiSkeleton: {
        styleOverrides: {
          root: {
            backgroundColor: mode === 'dark' ? alpha('#ffffff', 0.07) : '#EEF0F3',
          },
        },
      },

      MuiFab: {
        styleOverrides: {
          primary: {
            '&:hover': { backgroundColor: amber.light },
          },
        },
      },

      MuiSwitch: {
        styleOverrides: {
          switchBase: {
            '&.Mui-checked': {
              color: amber.main,
              '& + .MuiSwitch-track': {
                backgroundColor: amber.main,
                opacity: 0.5,
              },
            },
          },
        },
      },

      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
            '&.Mui-selected': { color: t.accentText },
          },
        },
      },
    },
  });
};

// alpha() do MUI não entende var(--...); para variáveis usa color-mix do CSS
export const tint = (cor, opacidade) => (
  String(cor).startsWith('var(')
    ? `color-mix(in srgb, ${cor} ${Math.round(opacidade * 100)}%, transparent)`
    : alpha(cor, opacidade)
);

// Estilo dos tooltips do recharts, consistente com o tema
export const chartTooltipStyle = (theme) => ({
  contentStyle: {
    background: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 8,
    boxShadow: theme.shadows[3],
    color: theme.palette.text.primary,
  },
  labelStyle: { color: theme.palette.text.primary, fontWeight: 600 },
  itemStyle: { color: theme.palette.text.secondary },
});

// Exporta tema padrão claro
const theme = createAppTheme('light');
export default theme;
