import React from 'react';
import { Box, Card, CardContent, Typography, useTheme, alpha, Grow } from '@mui/material';

// Card de estatística com número grande e ícone em destaque — pensado para
// leitura rápida por um público não-técnico (números grandes, pouco texto).
export default function StatBento({ title, value, subtitle, icon, color, delay = 0 }) {
    const theme = useTheme();
    const resolvedColor = color || theme.palette.primary.main;

    return (
        <Grow in timeout={500 + delay}>
            <Card
                sx={{
                    height: '100%',
                    position: 'relative',
                    overflow: 'hidden',
                    background: `linear-gradient(135deg, ${alpha(resolvedColor, 0.12)} 0%, transparent 65%)`,
                }}
            >
                <CardContent sx={{ p: 2.75, display: 'flex', flexDirection: 'column', gap: 1.5, height: '100%' }}>
                    <Box
                        sx={{
                            width: 46,
                            height: 46,
                            borderRadius: '14px',
                            bgcolor: alpha(resolvedColor, 0.18),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                        }}
                    >
                        {React.cloneElement(icon, { sx: { fontSize: 24, color: resolvedColor } })}
                    </Box>
                    <Box sx={{ mt: 'auto' }}>
                        <Typography
                            variant="h3"
                            sx={{
                                fontWeight: 800,
                                fontSize: { xs: '1.75rem', sm: '2rem' },
                                lineHeight: 1.1,
                                color: 'text.primary',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                            }}
                        >
                            {value}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600, mt: 0.5 }}>
                            {title}
                        </Typography>
                        {subtitle && (
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.25 }}>
                                {subtitle}
                            </Typography>
                        )}
                    </Box>
                </CardContent>
            </Card>
        </Grow>
    );
}
