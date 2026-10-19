import axios from 'axios';

// Em desenvolvimento usa rota relativa com proxy do Vite (localhost:8000).
// Em produção mantém rota relativa para o servidor (Nginx/Django).
const API_BASE_URL = '/api';

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
export const getDashboardComparativo = (params) => api.get('/dashboard/comparativo/', { params });
export const getDashboardPrevisao = (params) => api.get('/dashboard/previsao/', { params });

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
export const uploadColmeiaIoTJson = (formData) => api.post('/iot/colmeia/upload-json/', formData, {
    headers: {
        'Content-Type': 'multipart/form-data',
    },
});
export const getColmeiaHistoricoIoT = (identificador, params) => api.get(`/iot/colmeia/historico/${identificador}/`, { params });

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

// Coletas de Produto (Pólen / Própolis)
export const getColetasProduto = (params) => api.get('/coletas-produto/', { params });
export const getColetaProduto = (id) => api.get(`/coletas-produto/${id}/`);
export const createColetaProduto = (data) => api.post('/coletas-produto/', data);
export const updateColetaProduto = (id, data) => api.put(`/coletas-produto/${id}/`, data);
export const deleteColetaProduto = (id) => api.delete(`/coletas-produto/${id}/`);
export const exportColetasProduto = (params) => api.get('/export/coletas-produto/', { params, responseType: 'blob' });
export const exportApiarios = (params) => api.get('/export/apiarios/', { params, responseType: 'blob' });
export const exportColmeias = (params) => api.get('/export/colmeias/', { params, responseType: 'blob' });
export const exportProducao = (params) => api.get('/export/producao/', { params, responseType: 'blob' });
export const exportFinanceiro = (params) => api.get('/export/financeiro/', { params, responseType: 'blob' });

// Custos e Receitas
export const getCustos = (params) => api.get('/custos/', { params });
export const getCusto = (id) => api.get(`/custos/${id}/`);
export const createCusto = (data) => api.post('/custos/', data);
export const updateCusto = (id, data) => api.put(`/custos/${id}/`, data);
export const deleteCusto = (id) => api.delete(`/custos/${id}/`);

export const getReceitas = (params) => api.get('/receitas/', { params });
export const getReceita = (id) => api.get(`/receitas/${id}/`);
export const createReceita = (data) => api.post('/receitas/', data);
export const updateReceita = (id, data) => api.put(`/receitas/${id}/`, data);
export const deleteReceita = (id) => api.delete(`/receitas/${id}/`);

// Tratamentos
export const getTratamentos = (params) => api.get('/tratamentos/', { params });
export const getTratamento = (id) => api.get(`/tratamentos/${id}/`);
export const createTratamento = (data) => api.post('/tratamentos/', data);
export const updateTratamento = (id, data) => api.put(`/tratamentos/${id}/`, data);
export const deleteTratamento = (id) => api.delete(`/tratamentos/${id}/`);
export const finalizarTratamento = (id, data) => api.post(`/tratamentos/${id}/finalizar/`, data);

// Notificações
export const getNotificacoes = (params) => api.get('/notificacoes/', { params });
export const getNotificacoesNaoLidas = () => api.get('/notificacoes/nao_lidas/');
export const marcarNotificacaoLida = (id) => api.post(`/notificacoes/${id}/marcar_lida/`);
export const marcarTodasNotificacoesLidas = () => api.post('/notificacoes/marcar_todas_lidas/');
export const getAlertaRuidoConfig = () => api.get('/notificacoes/alerta_ruido_config/');
export const updateAlertaRuidoConfig = (data) => api.patch('/notificacoes/alerta_ruido_config/', data);

// Usuários (gestão, restrito a Dono/Gestor)
export const getUsuarios = (params) => api.get('/usuarios/', { params });
export const getUsuario = (id) => api.get(`/usuarios/${id}/`);
export const createUsuario = (data) => api.post('/usuarios/', data);
export const updateUsuario = (id, data) => api.patch(`/usuarios/${id}/`, data);
export const deleteUsuario = (id) => api.delete(`/usuarios/${id}/`);

// IA — Classificação Espectral de Pólen
export const classificarPolen = (data) => api.post('/ia/polen/classificar/', data);
export const getIAStatus = () => api.get('/ia/status/');
export const getClassificacoes = (params) => api.get('/ia/classificacoes/', { params });
export const importarCsvPolen = (formData) => api.post('/ia/polen/upload-csv/', formData, {
    headers: {
        'Content-Type': 'multipart/form-data',
    },
});

// Deteccoes de abelhas (pipeline de visao computacional - SmartHive)
export const getDeteccoesAbelha = (params) => api.get('/deteccoes-abelha/', { params });
export const getDeteccaoAbelhaEstatisticas = (params) => api.get('/deteccoes-abelha/estatisticas/', { params });
export const deleteDeteccaoAbelha = (id) => api.delete(`/deteccoes-abelha/${id}/`);

// Câmera ao vivo (Raspberry Pi + MediaMTX)
export const getCameraStatus = () => api.get('/camera/');
export const ligarCamera = () => api.post('/camera/ligar/');
export const renovarCamera = (sessao) => api.post('/camera/renovar/', { sessao });
export const desligarCamera = (sessao) => api.post('/camera/desligar/', { sessao });
// Usado no fechamento da aba: `keepalive` deixa a requisição terminar mesmo
// com a página sendo descarregada (axios não suporta isso)
export const desligarCameraAoSair = (sessao) => {
    const token = localStorage.getItem('token');
    fetch(`${API_BASE_URL}/camera/desligar/`, {
        method: 'POST',
        keepalive: true,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ sessao }),
    }).catch(() => {});
};

// Agendamento do monitoramento no Raspberry Pi
export const getAgendamentoMonitoramento = () => api.get('/monitoramento/agendamento/');
export const updateAgendamentoMonitoramento = (data) => api.put('/monitoramento/agendamento/', data);
export const getClassificacaoEstatisticas = (params) => api.get('/ia/classificacoes/estatisticas/', { params });
export const deleteClassificacao = (id) => api.delete(`/ia/classificacoes/${id}/`);

// Log de atividade (navegação + mutações de API)
export const logNavegacao = (pagina, titulo) => api.post('/log-navegacao/', { pagina, titulo });
export const getLogsAtividade = (params) => api.get('/logs/', { params });

export default api;
