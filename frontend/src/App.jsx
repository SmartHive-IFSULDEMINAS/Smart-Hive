import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import 'dayjs/locale/pt-br';

import theme from './theme';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Apiarios from './pages/Apiarios';
import Colmeias from './pages/Colmeias';
import Inspecoes from './pages/Inspecoes';
import Producao from './pages/Producao';
import Tratamentos from './pages/Tratamentos';
import Especies from './pages/Especies';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/apiarios" element={<Apiarios />} />
              <Route path="/colmeias" element={<Colmeias />} />
              <Route path="/inspecoes" element={<Inspecoes />} />
              <Route path="/producao" element={<Producao />} />
              <Route path="/tratamentos" element={<Tratamentos />} />
              <Route path="/especies" element={<Especies />} />
            </Routes>
          </Layout>
        </Router>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;
