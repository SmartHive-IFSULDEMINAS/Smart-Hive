import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Box
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/Info';

/**
 * Componente de diálogo de confirmação reutilizável
 */
const ConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  title = 'Confirmar ação',
  message = 'Você tem certeza que deseja realizar esta ação?',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  severity = 'warning', // 'warning', 'error', 'info'
  loading = false
}) => {
  const icons = {
    warning: <WarningAmberIcon sx={{ fontSize: 48, color: 'warning.main' }} />,
    error: <DeleteIcon sx={{ fontSize: 48, color: 'error.main' }} />,
    info: <InfoIcon sx={{ fontSize: 48, color: 'info.main' }} />
  };

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle id="confirm-dialog-title">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {icons[severity]}
          {title}
        </Box>
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="confirm-dialog-description">
          {message}
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button 
          onClick={onClose} 
          disabled={loading}
          color="inherit"
        >
          {cancelText}
        </Button>
        <Button 
          onClick={handleConfirm}
          variant="contained"
          color={severity === 'error' ? 'error' : 'primary'}
          disabled={loading}
          autoFocus
        >
          {loading ? 'Processando...' : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog;
