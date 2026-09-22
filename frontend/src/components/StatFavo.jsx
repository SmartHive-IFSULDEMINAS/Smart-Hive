import { Box, Typography, useTheme } from '@mui/material';

// Célula de favo — usada só para os números mais importantes de cada tela.
// O corte hexagonal é estrutural (lembra a própria colmeia), não decoração;
// por isso não é reaproveitado em qualquer superfície da interface.
const TONE_COLOR = {
    amber: (theme) => theme.palette.primary.main,
    alert: (theme) => theme.palette.warning.main,
};

export default function StatFavo({ label, value, sub, tone = 'amber', offset = false, delay = 0 }) {
    const theme = useTheme();
    const color = (TONE_COLOR[tone] || TONE_COLOR.amber)(theme);

    return (
        <Box
            sx={{
                clipPath: 'polygon(25% 4%, 75% 4%, 98% 50%, 75% 96%, 25% 96%, 2% 50%)',
                bgcolor: 'background.paper',
                aspectRatio: '1.12',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                px: 2,
                py: 1.5,
                mt: offset ? { md: 3.25 } : 0,
                opacity: 0,
                animation: `favoIn 0.5s ease ${delay}ms forwards`,
                '@keyframes favoIn': {
                    from: { opacity: 0, transform: 'translateY(6px)' },
                    to: { opacity: 1, transform: 'translateY(0)' },
                },
            }}
        >
            <Typography
                sx={{
                    fontFamily: '"Fraunces", Georgia, serif',
                    fontWeight: 700,
                    fontSize: { xs: '1.35rem', sm: '1.6rem' },
                    color,
                    lineHeight: 1,
                    fontVariantNumeric: 'tabular-nums',
                    whiteSpace: 'nowrap',
                }}
            >
                {value}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500, mt: 0.75 }}>
                {label}
            </Typography>
            {sub && (
                <Typography variant="caption" sx={{ color: 'text.disabled', mt: 0.25 }}>
                    {sub}
                </Typography>
            )}
        </Box>
    );
}
