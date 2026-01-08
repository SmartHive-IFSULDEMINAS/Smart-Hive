import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { SnackbarProvider } from 'notistack';
import 'dayjs/locale/pt-br';

import { createAppTheme } from './theme';
import { ThemeModeProvider, useThemeMode } from './contexts/ThemeModeContext';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Apiarios from './pages/Apiarios';
import Colmeias from './pages/Colmeias';
import Inspecoes from './pages/Inspecoes';
import Producao from './pages/Producao';
import Tratamentos from './pages/Tratamentos';
import Especies from './pages/Especies';
import { useMemo } from 'react';

function AppContent() {
  const { mode } = useThemeMode();
  const theme = useMemo(() => createAppTheme(mode), [mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider 
        maxSnack={3}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        autoHideDuration={4000}
      >
        <NotificationProvider>
          <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
            <AuthProvider>
              <Router>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route
                    path="/*"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <Routes>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/apiarios" element={<Apiarios />} />
                            <Route path="/colmeias" element={<Colmeias />} />
                            <Route path="/inspecoes" element={<Inspecoes />} />
                            <Route path="/producao" element={<Producao />} />
                            <Route path="/tratamentos" element={<Tratamentos />} />
                            <Route path="/especies" element={<Especies />} />
                            <Route path="*" element={<Navigate to="/" replace />} />
                          </Routes>
                        </Layout>
                      </ProtectedRoute>
                    }
                  />
                </Routes>
              </Router>
            </AuthProvider>
          </LocalizationProvider>
        </NotificationProvider>
      </SnackbarProvider>
    </ThemeProvider>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeModeProvider>
        <AppContent />
      </ThemeModeProvider>
    </ErrorBoundary>
  );
}

export default App;
