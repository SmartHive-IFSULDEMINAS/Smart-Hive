import { useTheme, useMediaQuery } from '@mui/material';

/**
 * Hook customizado para responsividade
 */
export const useResponsive = () => {
  const theme = useTheme();
  
  return {
    isMobile: useMediaQuery(theme.breakpoints.down('sm')),
    isTablet: useMediaQuery(theme.breakpoints.between('sm', 'md')),
    isDesktop: useMediaQuery(theme.breakpoints.up('md')),
    isSmallScreen: useMediaQuery(theme.breakpoints.down('md')),
    isLargeScreen: useMediaQuery(theme.breakpoints.up('lg')),
  };
};

/**
 * Grid responsivo padrão para cards
 */
export const responsiveGridProps = {
  xs: 12,     // Mobile: 1 coluna
  sm: 6,      // Tablet: 2 colunas
  md: 4,      // Desktop pequeno: 3 colunas
  lg: 3,      // Desktop grande: 4 colunas
};

/**
 * Grid para cards maiores
 */
export const responsiveGridPropsLarge = {
  xs: 12,     // Mobile: 1 coluna
  sm: 12,     // Tablet: 1 coluna
  md: 6,      // Desktop pequeno: 2 colunas
  lg: 4,      // Desktop grande: 3 colunas
};

/**
 * Padding responsivo
 */
export const responsivePadding = {
  xs: 2,
  sm: 3,
  md: 4,
};

/**
 * Tamanhos de fonte responsivos
 */
export const responsiveFontSize = (mobile, tablet, desktop) => ({
  xs: mobile,
  sm: tablet,
  md: desktop,
});
