import axios from 'axios';

// Use variável de ambiente ou URL relativa em produção
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor para adicionar token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor para tratar erros de autenticação
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth endpoints
export const login = (username, password) => 
    api.post('/auth/login/', { username, password });

export const register = (data) => 
    api.post('/auth/register/', data);

export const getMe = () => 
    api.get('/auth/me/');

export const updateProfile = (data) => 
    api.patch('/auth/profile/', data);

// Dashboard
export const getDashboard = () => api.get('/dashboard/');

// Espécies de Abelhas
export const getEspecies = (params) => api.get('/especies/', { params });
export const getEspecie = (id) => api.get(`/especies/${id}/`);
export const createEspecie = (data) => api.post('/especies/', data);
export const updateEspecie = (id, data) => api.put(`/especies/${id}/`, data);
export const deleteEspecie = (id) => api.delete(`/especies/${id}/`);

// Apiários
export const getApiarios = (params) => api.get('/apiarios/', { params });
export const getApiario = (id) => api.get(`/apiarios/${id}/`);
export const createApiario = (data) => api.post('/apiarios/', data);
export const updateApiario = (id, data) => api.put(`/apiarios/${id}/`, data);
export const deleteApiario = (id) => api.delete(`/apiarios/${id}/`);
export const getApiarioColmeias = (id) => api.get(`/apiarios/${id}/colmeias/`);
export const getApiarioEstatisticas = (id) => api.get(`/apiarios/${id}/estatisticas/`);

// Colmeias
export const getColmeias = (params) => api.get('/colmeias/', { params });
export const getColmeia = (id) => api.get(`/colmeias/${id}/`);
export const createColmeia = (data) => api.post('/colmeias/', data);
export const updateColmeia = (id, data) => api.put(`/colmeias/${id}/`, data);
export const deleteColmeia = (id) => api.delete(`/colmeias/${id}/`);
export const getColmeiaInspecoes = (id) => api.get(`/colmeias/${id}/inspecoes/`);
export const getColmeiaProducoes = (id) => api.get(`/colmeias/${id}/producoes/`);
export const getColmeiaTratamentos = (id) => api.get(`/colmeias/${id}/tratamentos/`);
export const getColmeiaHistorico = (id) => api.get(`/colmeias/${id}/historico/`);
export const getColmeiaLeiturasSensor = (id, params) => api.get(`/colmeias/${id}/leituras_sensor/`, { params });

// Inspeções
export const getInspecoes = (params) => api.get('/inspecoes/', { params });
export const getInspecao = (id) => api.get(`/inspecoes/${id}/`);
export const createInspecao = (data) => api.post('/inspecoes/', data);
export const updateInspecao = (id, data) => api.put(`/inspecoes/${id}/`, data);
export const deleteInspecao = (id) => api.delete(`/inspecoes/${id}/`);

// Produções de Mel
export const getProducoes = (params) => api.get('/producoes/', { params });
export const getProducao = (id) => api.get(`/producoes/${id}/`);
export const createProducao = (data) => api.post('/producoes/', data);
export const updateProducao = (id, data) => api.put(`/producoes/${id}/`, data);
export const deleteProducao = (id) => api.delete(`/producoes/${id}/`);
export const getProducaoRelatorio = (params) => api.get('/producoes/relatorio/', { params });

// Tratamentos
export const getTratamentos = (params) => api.get('/tratamentos/', { params });
export const getTratamento = (id) => api.get(`/tratamentos/${id}/`);
export const createTratamento = (data) => api.post('/tratamentos/', data);
export const updateTratamento = (id, data) => api.put(`/tratamentos/${id}/`, data);
export const deleteTratamento = (id) => api.delete(`/tratamentos/${id}/`);
export const finalizarTratamento = (id, data) => api.post(`/tratamentos/${id}/finalizar/`, data);

export default api;
