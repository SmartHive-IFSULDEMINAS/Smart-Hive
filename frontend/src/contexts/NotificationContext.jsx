import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSnackbar } from 'notistack';

const NotificationContext = createContext({
  permission: 'default',
  requestPermission: () => {},
  showNotification: () => {},
});

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [permission, setPermission] = useState('default');
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    // Verifica se o navegador suporta notificações
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      console.warn('Este navegador não suporta notificações');
      enqueueSnackbar('Navegador não suporta notificações', { variant: 'warning' });
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        enqueueSnackbar('Notificações ativadas com sucesso!', { variant: 'success' });
        return true;
      } else if (result === 'denied') {
        enqueueSnackbar('Permissão para notificações negada', { variant: 'error' });
        return false;
      }
    } catch (error) {
      console.error('Erro ao solicitar permissão:', error);
      enqueueSnackbar('Erro ao ativar notificações', { variant: 'error' });
      return false;
    }
  };

  const showNotification = (title, options = {}) => {
    if (permission !== 'granted') {
      console.warn('Permissão de notificação não concedida');
      // Mostra toast como fallback
      enqueueSnackbar(title, { variant: options.variant || 'info' });
      return;
    }

    try {
      const notification = new Notification(title, {
        body: options.body || '',
        icon: options.icon || '/logo.png',
        badge: options.badge || '/badge.png',
        tag: options.tag || 'smart-hive',
        requireInteraction: options.requireInteraction || false,
        silent: options.silent || false,
        data: options.data || {},
        ...options
      });

      // Eventos da notificação
      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        
        if (options.onClick) {
          options.onClick(event);
        }
        
        if (options.url) {
          window.location.href = options.url;
        }
        
        notification.close();
      };

      notification.onclose = () => {
        if (options.onClose) {
          options.onClose();
        }
      };

      notification.onerror = (error) => {
        console.error('Erro na notificação:', error);
        if (options.onError) {
          options.onError(error);
        }
      };

      // Também mostra toast para garantir que o usuário veja
      enqueueSnackbar(title, { 
        variant: options.variant || 'info',
        autoHideDuration: 3000 
      });

    } catch (error) {
      console.error('Erro ao mostrar notificação:', error);
      enqueueSnackbar(title, { variant: options.variant || 'info' });
    }
  };

  const value = {
    permission,
    requestPermission,
    showNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
