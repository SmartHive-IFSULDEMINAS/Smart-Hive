import React, { useState } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Grid,
  IconButton,
  Collapse,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from '@mui/material';
import {
  FilterList as FilterIcon,
  Close as CloseIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';

/**
 * Componente de filtros avançados reutilizável
 * @param {Object} filters - Configuração dos filtros
 * @param {Function} onApplyFilters - Callback quando filtros são aplicados
 * @param {Function} onClearFilters - Callback quando filtros são limpos
 */
const AdvancedFilters = ({ 
  filters = [], 
  onApplyFilters, 
  onClearFilters,
  searchPlaceholder = "Pesquisar..."
}) => {
  const [expanded, setExpanded] = useState(false);
  const [filterValues, setFilterValues] = useState({});
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  const handleFilterChange = (name, value) => {
    const newValues = { ...filterValues, [name]: value };
    setFilterValues(newValues);
    
    // Conta filtros ativos (não vazios)
    const count = Object.values(newValues).filter(v => 
      v !== '' && v !== null && v !== undefined
    ).length;
    setActiveFiltersCount(count);
  };

  const handleApply = () => {
    if (onApplyFilters) {
      onApplyFilters(filterValues);
    }
    setExpanded(false);
  };

  const handleClear = () => {
    setFilterValues({});
    setActiveFiltersCount(0);
    if (onClearFilters) {
      onClearFilters();
    }
  };

  const renderFilterField = (filter) => {
    const value = filterValues[filter.name] || '';

    switch (filter.type) {
      case 'text':
        return (
          <TextField
            fullWidth
            label={filter.label}
            value={value}
            onChange={(e) => handleFilterChange(filter.name, e.target.value)}
            placeholder={filter.placeholder}
            size="small"
          />
        );

      case 'select':
        return (
          <FormControl fullWidth size="small">
            <InputLabel>{filter.label}</InputLabel>
            <Select
              value={value}
              label={filter.label}
              onChange={(e) => handleFilterChange(filter.name, e.target.value)}
            >
              <MenuItem value="">
                <em>Todos</em>
              </MenuItem>
              {filter.options?.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );

      case 'date':
        return (
          <DatePicker
            label={filter.label}
            value={value ? dayjs(value) : null}
            onChange={(newValue) => 
              handleFilterChange(filter.name, newValue ? newValue.format('YYYY-MM-DD') : null)
            }
            slotProps={{ 
              textField: { 
                fullWidth: true, 
                size: 'small' 
              } 
            }}
          />
        );

      case 'dateRange':
        return (
          <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
            <DatePicker
              label="De"
              value={value?.start ? dayjs(value.start) : null}
              onChange={(newValue) => 
                handleFilterChange(filter.name, { 
                  ...value, 
                  start: newValue ? newValue.format('YYYY-MM-DD') : null 
                })
              }
              slotProps={{ 
                textField: { 
                  fullWidth: true, 
                  size: 'small' 
                } 
              }}
            />
            <DatePicker
              label="Até"
              value={value?.end ? dayjs(value.end) : null}
              onChange={(newValue) => 
                handleFilterChange(filter.name, { 
                  ...value, 
                  end: newValue ? newValue.format('YYYY-MM-DD') : null 
                })
              }
              slotProps={{ 
                textField: { 
                  fullWidth: true, 
                  size: 'small' 
                } 
              }}
            />
          </Box>
        );

      case 'number':
        return (
          <TextField
            fullWidth
            type="number"
            label={filter.label}
            value={value}
            onChange={(e) => handleFilterChange(filter.name, e.target.value)}
            placeholder={filter.placeholder}
            size="small"
            inputProps={filter.inputProps}
          />
        );

      default:
        return null;
    }
  };

  return (
    <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: expanded ? 2 : 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton 
            onClick={() => setExpanded(!expanded)}
            color="primary"
            aria-label="mostrar filtros"
          >
            <FilterIcon />
          </IconButton>
          <Typography variant="h6">
            Filtros
            {activeFiltersCount > 0 && (
              <Chip 
                label={activeFiltersCount} 
                size="small" 
                color="primary" 
                sx={{ ml: 1 }}
              />
            )}
          </Typography>
        </Box>
        
        {activeFiltersCount > 0 && (
          <Button 
            startIcon={<CloseIcon />} 
            onClick={handleClear}
            size="small"
          >
            Limpar
          </Button>
        )}
      </Box>

      <Collapse in={expanded}>
        <Box sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            {filters.map((filter) => (
              <Grid size={{ xs: 12, sm: filter.gridSize?.sm || 6, md: filter.gridSize?.md || 4 }} key={filter.name}>
                {renderFilterField(filter)}
              </Grid>
            ))}
          </Grid>

          <Box sx={{ display: 'flex', gap: 2, mt: 3, justifyContent: 'flex-end' }}>
            <Button 
              variant="outlined" 
              onClick={handleClear}
            >
              Limpar Filtros
            </Button>
            <Button 
              variant="contained" 
              startIcon={<SearchIcon />}
              onClick={handleApply}
            >
              Aplicar Filtros
            </Button>
          </Box>
        </Box>
      </Collapse>
    </Paper>
  );
};

export default AdvancedFilters;
