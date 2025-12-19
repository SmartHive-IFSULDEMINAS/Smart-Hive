import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Box, CircularProgress } from '@mui/material';

export default function ProtectedRoute({ children, requireRole = null }) {
    const { isAuthenticated, loading, user } = useAuth();

    if (loading) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '100vh',
                }}
            >
                <CircularProgress />
            </Box>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (requireRole) {
        const roleMap = {
            dono: user?.is_dono,
            gestor: user?.is_gestor || user?.is_dono,
            apicultor: true, // Todos os usuários autenticados são apicultores
        };

        if (!roleMap[requireRole]) {
            return <Navigate to="/" replace />;
        }
    }

    return children;
}

