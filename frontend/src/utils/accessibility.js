/**
 * Utilitários para melhorar acessibilidade
 */

/**
 * Gera IDs únicos para componentes (útil para aria-labelledby)
 */
export const generateId = (prefix = 'component') => {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Hook para gerenciar focus trap em modais
 */
export const useFocusTrap = (isOpen, containerRef) => {
  React.useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTab = (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    container.addEventListener('keydown', handleTab);
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleTab);
    };
  }, [isOpen, containerRef]);
};

/**
 * Atalhos de teclado comuns
 */
export const keyboardShortcuts = {
  ESCAPE: 'Escape',
  ENTER: 'Enter',
  SPACE: ' ',
  TAB: 'Tab',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
};

/**
 * Verifica se o usuário prefere modo de alto contraste
 */
export const prefersHighContrast = () => {
  return window.matchMedia('(prefers-contrast: high)').matches;
};

/**
 * Verifica se o usuário prefere movimento reduzido
 */
export const prefersReducedMotion = () => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Anunciar mudanças para leitores de tela
 */
export const announceToScreenReader = (message, priority = 'polite') => {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority); // 'polite' ou 'assertive'
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

/**
 * Classes CSS para elementos visíveis apenas para leitores de tela
 */
export const srOnlyStyles = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
};

/**
 * ARIA roles comuns
 */
export const ariaRoles = {
  BUTTON: 'button',
  NAVIGATION: 'navigation',
  MAIN: 'main',
  COMPLEMENTARY: 'complementary',
  CONTENTINFO: 'contentinfo',
  BANNER: 'banner',
  SEARCH: 'search',
  FORM: 'form',
  DIALOG: 'dialog',
  ALERT: 'alert',
  STATUS: 'status',
  PROGRESSBAR: 'progressbar',
  TAB: 'tab',
  TABPANEL: 'tabpanel',
  TABLIST: 'tablist',
};

/**
 * Validação de contraste de cores (WCAG)
 */
export const checkColorContrast = (foreground, background) => {
  // Implementação simplificada
  // Para produção, use biblioteca como 'color-contrast-checker'
  const getRelativeLuminance = (rgb) => {
    const [r, g, b] = rgb.map((val) => {
      val = val / 255;
      return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  const l1 = getRelativeLuminance(foreground);
  const l2 = getRelativeLuminance(background);
  const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

  return {
    ratio,
    AA: ratio >= 4.5, // WCAG AA para texto normal
    AALarge: ratio >= 3, // WCAG AA para texto grande
    AAA: ratio >= 7, // WCAG AAA para texto normal
  };
};

import React from 'react';

export default {
  generateId,
  useFocusTrap,
  keyboardShortcuts,
  prefersHighContrast,
  prefersReducedMotion,
  announceToScreenReader,
  srOnlyStyles,
  ariaRoles,
  checkColorContrast,
};
