import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';

const ThemeModeContext = createContext({
  mode: 'light',
  toggleTheme: () => {},
});

export const useThemeMode = () => {
  const context = useContext(ThemeModeContext);
  if (!context) {
    throw new Error('useThemeMode must be used within ThemeModeProvider');
  }
  return context;
};

const STORAGE_KEY = 'themeModeErp';

export const ThemeModeProvider = ({ children }) => {
  const [mode, setMode] = useState(() => {
    // Chave nova: com o visual claro (ERP) todos começam no claro uma vez,
    // mesmo quem tinha escolhido o escuro antigo
    const savedMode = localStorage.getItem(STORAGE_KEY);
    if (savedMode === 'light' || savedMode === 'dark') {
      return savedMode;
    }
    return 'light';
  });

  useEffect(() => {
    // Salvar preferência no localStorage
    localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  const toggleTheme = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  const value = useMemo(
    () => ({
      mode,
      toggleTheme,
    }),
    [mode]
  );

  return (
    <ThemeModeContext.Provider value={value}>
      {children}
    </ThemeModeContext.Provider>
  );
};
