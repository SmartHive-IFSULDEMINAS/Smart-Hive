import { createContext, useContext, useState, useEffect } from 'react';
import { login as loginApi, register as registerApi, getMe, updateProfile as updateProfileApi } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth deve ser usado dentro de AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(localStorage.getItem('token'));

    useEffect(() => {
        if (token) {
            loadUser();
        } else {
            setLoading(false);
        }
    }, [token]);

    const loadUser = async () => {
        try {
            const response = await getMe();
            setUser(response.data);
        } catch (error) {
            console.error('Erro ao carregar usuário:', error);
            logout();
        } finally {
            setLoading(false);
        }
    };

    const login = async (username, password) => {
        try {
            const response = await loginApi(username, password);
            const { access, user: userData } = response.data;
            
            localStorage.setItem('token', access);
            setToken(access);
            setUser(userData);
            
            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Erro ao fazer login',
            };
        }
    };

    const register = async (userData) => {
        try {
            const response = await registerApi(userData);
            const { access, user: newUser } = response.data;
            
            localStorage.setItem('token', access);
            setToken(access);
            setUser(newUser);
            
            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Erro ao registrar',
            };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    const updateProfile = async (data) => {
        try {
            const response = await updateProfileApi(data);
            setUser(response.data);
            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Erro ao atualizar perfil',
            };
        }
    };

    const value = {
        user,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        updateProfile,
        canManageUsers: user?.can_manage_users || false,
        canManageApiarios: user?.can_manage_apiarios || false,
        canViewReports: user?.can_view_reports || false,
        isDono: user?.is_dono || false,
        isGestor: user?.is_gestor || false,
        isApicultor: user?.is_apicultor || false,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

