import { Box, Paper, Typography, useTheme, alpha } from '@mui/material';

// Bloco de status simples — barra + ponto + frase em linguagem simples, sem
// ícone-em-círculo, pra alguém sem conhecimento técnico entender de relance.
const STATUS_COLOR_KEY = {
    ok: 'success',
    warning: 'warning',
    error: 'error',
    neutral: null,
};

export default function StatusBlock({ status = 'neutral', title, description, extra }) {
    const theme = useTheme();
    const colorKey = STATUS_COLOR_KEY[status] ?? null;
    const color = colorKey ? theme.palette[colorKey].main : theme.palette.text.secondary;

    return (
        <Paper
            variant="outlined"
            sx={{
                p: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1.75,
            }}
        >
            <Box sx={{ alignSelf: 'stretch', width: 3, borderRadius: 2, bgcolor: color, flexShrink: 0 }} />
            <Box
                sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: color,
                    boxShadow: `0 0 0 4px ${alpha(color, 0.18)}`,
                    flexShrink: 0,
                }}
            />
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
