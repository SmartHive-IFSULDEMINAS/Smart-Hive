import React from 'react';
import { Box, CircularProgress, Typography, Backdrop } from '@mui/material';

/**
 * Componente de loading reutilizável
 * @param {boolean} open - Controla visibilidade
 * @param {string} message - Mensagem opcional
 * @param {string} variant - 'fullscreen', 'inline', 'button'
 * @param {string} size - 'small', 'medium', 'large'
 */
export const LoadingSpinner = ({ 
  open = true, 
  message = '', 
  variant = 'inline',
  size = 'medium'
}) => {
  const sizes = {
    small: 24,
    medium: 40,
    large: 60
  };

  if (variant === 'fullscreen') {
    return (
      <Backdrop
        sx={{ 
          color: '#fff', 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          flexDirection: 'column',
          gap: 2
        }}
        open={open}
      >
        <CircularProgress color="inherit" size={sizes[size]} />
        {message && (
          <Typography variant="h6" sx={{ mt: 2 }}>
            {message}
          </Typography>
        )}
      </Backdrop>
    );
  }

  if (variant === 'button') {
    return <CircularProgress size={sizes.small} />;
  }

  // inline variant (padrão)
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 200,
        width: '100%',
        gap: 2
      }}
    >
      <CircularProgress size={sizes[size]} />
      {message && (
        <Typography variant="body1" color="text.secondary">
          {message}
        </Typography>
      )}
    </Box>
  );
};

/**
 * Skeleton loader para cards
 */
export { Skeleton } from '@mui/material';

export default LoadingSpinner;
