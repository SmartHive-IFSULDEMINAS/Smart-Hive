// ============================================
// EXEMPLOS PRÁTICOS DE USO - Smart-Hive
// ============================================

// 1. EXEMPLO COMPLETO: Página com todos os recursos
// ============================================

import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Typography,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  FileDownload as ExportIcon,
  MoreVert as MoreIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useNotification } from '../contexts/NotificationContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import ConfirmDialog from '../components/ConfirmDialog';
import AdvancedFilters from '../components/AdvancedFilters';
import { useResponsive, responsiveGridProps } from '../utils/responsive';
import accessibility from '../utils/accessibility';
import api from '../services/api';

function ExemploCompleto() {
  // ============================================
  // HOOKS E ESTADOS
  // ============================================
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [filters, setFilters] = useState({});
  
  const { enqueueSnackbar } = useSnackbar();
  const { showNotification } = useNotification();
  const { isMobile, isDesktop } = useResponsive();

  // ============================================
  // FILTROS CONFIGURAÇÃO
  // ============================================
  const filterConfig = [
    {
      name: 'search',
      type: 'text',
      label: 'Buscar',
      placeholder: 'Digite para buscar...',
      gridSize: { sm: 12, md: 4 }
    },
    {
      name: 'status',
      type: 'select',
      label: 'Status',
      options: [
        { value: 'ativa', label: 'Ativa' },
        { value: 'inativa', label: 'Inativa' }
      ],
      gridSize: { sm: 6, md: 4 }
    },
    {
      name: 'periodo',
      type: 'dateRange',
      label: 'Período',
      gridSize: { sm: 12, md: 4 }
    }
  ];

  // ============================================
  // CARREGAR DADOS
  // ============================================
  const fetchData = async (appliedFilters = {}) => {
    setLoading(true);
    try {
      const response = await api.get('/colmeias/', {
        params: appliedFilters
      });
      setData(response.data.results || response.data);
      
      // Anunciar para leitores de tela
      accessibility.announceToScreenReader(
        `${response.data.results?.length || 0} colmeias carregadas`,
        'polite'
      );
      
      enqueueSnackbar('Dados carregados com sucesso!', { 
        variant: 'success' 
      });
    } catch (error) {
      enqueueSnackbar('Erro ao carregar dados', { 
        variant: 'error' 
      });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ============================================
  // HANDLERS
  // ============================================
  const handleApplyFilters = (appliedFilters) => {
    setFilters(appliedFilters);
    fetchData(appliedFilters);
  };

  const handleClearFilters = () => {
    setFilters({});
    fetchData({});
  };

  const handleDelete = (item) => {
    setSelectedItem(item);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/colmeias/${selectedItem.id}/`);
      
      enqueueSnackbar('Item deletado com sucesso!', { 
        variant: 'success' 
      });
      
      // Notificação push
      showNotification('Item Deletado', {
        body: `${selectedItem.codigo} foi removido`,
        variant: 'success'
      });
      
      setDeleteDialogOpen(false);
      fetchData(filters);
    } catch (error) {
      enqueueSnackbar('Erro ao deletar item', { 
        variant: 'error' 
      });
    }
  };

  const handleExport = async (format) => {
    try {
      const response = await api.get('/export/colmeias/', {
        params: { format, ...filters },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download', 
        `colmeias_${Date.now()}.${format === 'pdf' ? 'pdf' : 'xlsx'}`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      enqueueSnackbar('Arquivo exportado com sucesso!', { 
        variant: 'success' 
      });
    } catch (error) {
      enqueueSnackbar('Erro ao exportar', { 
        variant: 'error' 
      });
    }
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <Box sx={{ p: 3 }}>
      {/* CABEÇALHO */}
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 3,
          flexDirection: isMobile ? 'column' : 'row',
          gap: 2
        }}
      >
        <Typography 
          variant="h4" 
          component="h1"
          aria-label="Título da página"
        >
          Colmeias
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<ExportIcon />}
            onClick={() => handleExport('excel')}
            aria-label="Exportar para Excel"
          >
            {!isMobile && 'Excel'}
          </Button>
          <Button
            variant="outlined"
            startIcon={<ExportIcon />}
            onClick={() => handleExport('pdf')}
            aria-label="Exportar para PDF"
          >
            {!isMobile && 'PDF'}
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            aria-label="Adicionar nova colmeia"
          >
            {!isMobile && 'Nova Colmeia'}
          </Button>
        </Box>
      </Box>

      {/* FILTROS */}
      <AdvancedFilters
        filters={filterConfig}
        onApplyFilters={handleApplyFilters}
        onClearFilters={handleClearFilters}
      />

      {/* LOADING */}
      {loading ? (
        <LoadingSpinner message="Carregando colmeias..." />
      ) : (
        /* LISTA DE DADOS */
        <Grid container spacing={3}>
          {data.map((item) => (
            <Grid item {...responsiveGridProps} key={item.id}>
              <Card 
                elevation={2}
                role="article"
                aria-label={`Colmeia ${item.codigo}`}
              >
                <CardContent>
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'flex-start'
                  }}>
                    <Box>
                      <Typography variant="h6" component="h2">
                        {item.codigo}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        aria-label={`Status: ${item.status}`}
                      >
                        Status: {item.status}
                      </Typography>
                    </Box>
                    
                    <Box>
                      <IconButton
                        size="small"
                        onClick={() => {/* editar */}}
                        aria-label={`Editar colmeia ${item.codigo}`}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(item)}
                        aria-label={`Deletar colmeia ${item.codigo}`}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* DIÁLOGO DE CONFIRMAÇÃO */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Confirmar Exclusão"
        message={`Tem certeza que deseja deletar a colmeia ${selectedItem?.codigo}? Esta ação não pode ser desfeita.`}
        confirmText="Deletar"
        cancelText="Cancelar"
        severity="error"
      />
    </Box>
  );
}

export default ExemploCompleto;


// ============================================
// 2. EXEMPLO: Hook customizado com loading
// ============================================

import { useState, useCallback } from 'react';
import { useSnackbar } from 'notistack';

export function useApiCall() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { enqueueSnackbar } = useSnackbar();

  const execute = useCallback(async (apiCall, options = {}) => {
    const {
      successMessage = 'Operação realizada com sucesso!',
      errorMessage = 'Erro ao realizar operação',
      showSuccess = true,
      showError = true,
    } = options;

    setLoading(true);
    setError(null);

    try {
      const result = await apiCall();
      
      if (showSuccess) {
        enqueueSnackbar(successMessage, { variant: 'success' });
      }
      
      return result;
    } catch (err) {
      setError(err);
      
      if (showError) {
        enqueueSnackbar(errorMessage, { variant: 'error' });
      }
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  return { loading, error, execute };
}

// Uso:
function MeuComponente() {
  const { loading, execute } = useApiCall();

  const handleSave = async () => {
    await execute(
      () => api.post('/colmeias/', data),
      {
        successMessage: 'Colmeia criada!',
        errorMessage: 'Erro ao criar colmeia'
      }
    );
  };

  return (
    <Button onClick={handleSave} disabled={loading}>
      {loading ? <LoadingSpinner variant="button" /> : 'Salvar'}
    </Button>
  );
}


// ============================================
// 3. EXEMPLO: Formulário com validação
// ============================================

import { useForm, Controller } from 'react-hook-form';

function FormularioExemplo() {
  const { control, handleSubmit, formState: { errors } } = useForm();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await api.post('/colmeias/', data);
      enqueueSnackbar('Colmeia criada com sucesso!', { variant: 'success' });
      // Reset form, etc
    } catch (error) {
      enqueueSnackbar('Erro ao criar colmeia', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Controller
        name="codigo"
        control={control}
        rules={{ required: 'Código é obrigatório' }}
        render={({ field }) => (
          <TextField
            {...field}
            label="Código"
            error={!!errors.codigo}
            helperText={errors.codigo?.message}
            aria-required="true"
            aria-invalid={!!errors.codigo}
            aria-describedby={errors.codigo ? 'codigo-error' : undefined}
          />
        )}
      />
      
      <Button 
        type="submit" 
        disabled={loading}
        aria-busy={loading}
      >
        {loading ? <LoadingSpinner variant="button" /> : 'Salvar'}
      </Button>
    </form>
  );
}
