import { Paper, Typography, useTheme } from '@mui/material';

// Cartão de indicador (KPI) — usado só para os números mais importantes de
// cada tela. Visual de ERP: retângulo branco, faixa de cor no topo e número em
// grafite. O nome continua StatFavo por compatibilidade; `offset` (que
// desalinhava as células no antigo layout de favo) é aceito e ignorado.
const TONE_COLOR = {
    amber: (theme) => theme.palette.primary.main,
    alert: (theme) => theme.palette.warning.main,
};

// eslint-disable-next-line no-unused-vars
export default function StatFavo({ label, value, sub, tone = 'amber', offset = false, delay = 0 }) {
    const theme = useTheme();
    const color = (TONE_COLOR[tone] || TONE_COLOR.amber)(theme);

    return (
        <Paper
            variant="outlined"
            sx={{
                height: '100%',
                px: 2,
                py: 1.75,
                borderTop: `3px solid ${color}`,
                opacity: 0,
                animation: `kpiIn 0.35s ease ${delay}ms forwards`,
                '@keyframes kpiIn': {
                    from: { opacity: 0, transform: 'translateY(4px)' },
                    to: { opacity: 1, transform: 'translateY(0)' },
                },
            }}
        >
            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                {label}
            </Typography>
            <Typography
                component="div"
                sx={{
                    fontWeight: 700,
                    fontSize: { xs: '1.35rem', sm: '1.6rem' },
                    color: tone === 'alert' ? color : 'text.primary',
                    lineHeight: 1.2,
                    mt: 0.5,
                    fontVariantNumeric: 'tabular-nums',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                }}
            >
                {value}
            </Typography>
            {sub && (
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.25 }}>
                    {sub}
                </Typography>
            )}
        </Paper>
    );
}
