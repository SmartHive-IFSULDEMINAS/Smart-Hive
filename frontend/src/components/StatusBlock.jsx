import { Box, Paper, Typography, useTheme, alpha } from '@mui/material';
import {
    CheckCircle as OkIcon,
    Error as ErrorIcon,
    Warning as WarningIcon,
    HelpOutline as NeutralIcon,
} from '@mui/icons-material';

// Bloco de status simples e legível — ícone + cor + frase curta, para que
// alguém sem conhecimento técnico entenda o estado do sistema de relance.
const STATUS_CONFIG = {
    ok: { Icon: OkIcon, colorKey: 'success' },
    warning: { Icon: WarningIcon, colorKey: 'warning' },
    error: { Icon: ErrorIcon, colorKey: 'error' },
    neutral: { Icon: NeutralIcon, colorKey: null },
};

export default function StatusBlock({ status = 'neutral', title, description, icon, extra }) {
    const theme = useTheme();
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.neutral;
    const color = config.colorKey ? theme.palette[config.colorKey].main : theme.palette.text.secondary;
    const IconComponent = icon || config.Icon;

    return (
        <Paper
            variant="outlined"
            sx={{
                p: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                borderLeft: `4px solid ${color}`,
                bgcolor: alpha(color, 0.06),
            }}
        >
            <Box
                sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    bgcolor: alpha(color, 0.15),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                }}
            >
                <IconComponent sx={{ color, fontSize: 22 }} />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="subtitle2" fontWeight={700}>
                    {title}
                </Typography>
                {description && (
                    <Typography variant="body2" color="text.secondary">
                        {description}
                    </Typography>
                )}
            </Box>
            {extra}
        </Paper>
    );
}
