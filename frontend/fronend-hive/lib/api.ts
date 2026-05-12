import axios from 'axios'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
})

api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthEndpoint = error.config?.url?.includes('/auth/')
    if (error.response?.status === 401 && !isAuthEndpoint) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// Auth
export const login = (username: string, password: string) =>
  api.post('/auth/login/', { username, password })
export const register = (data: object) => api.post('/auth/register/', data)
export const getMe = () => api.get('/auth/me/')
export const updateProfile = (data: object) => api.patch('/auth/profile/', data)

// Dashboard
export const getDashboard = () => api.get('/dashboard/')
export const getDashboardComparativo = (params?: object) =>
  api.get('/dashboard/comparativo/', { params })
export const getDashboardPrevisao = (params?: object) =>
  api.get('/dashboard/previsao/', { params })
export const getDashboardFinanceiro = () => api.get('/dashboard/financeiro/')
export const getDashboardSaude = () => api.get('/dashboard/saude/')
export const getDashboardProdutividade = () => api.get('/dashboard/produtividade/')

// Espécies
export const getEspecies = (params?: object) => api.get('/especies/', { params })
export const getEspecie = (id: number) => api.get(`/especies/${id}/`)
export const createEspecie = (data: object) => api.post('/especies/', data)
export const updateEspecie = (id: number, data: object) => api.put(`/especies/${id}/`, data)
export const deleteEspecie = (id: number) => api.delete(`/especies/${id}/`)

// Apiários
export const getApiarios = (params?: object) => api.get('/apiarios/', { params })
export const getApiario = (id: number) => api.get(`/apiarios/${id}/`)
export const createApiario = (data: object) => api.post('/apiarios/', data)
export const updateApiario = (id: number, data: object) => api.put(`/apiarios/${id}/`, data)
export const deleteApiario = (id: number) => api.delete(`/apiarios/${id}/`)
export const getApiarioColmeias = (id: number) => api.get(`/apiarios/${id}/colmeias/`)
export const getApiarioEstatisticas = (id: number) => api.get(`/apiarios/${id}/estatisticas/`)

// Colmeias
export const getColmeias = (params?: object) => api.get('/colmeias/', { params })
export const getColmeia = (id: number) => api.get(`/colmeias/${id}/`)
export const createColmeia = (data: object) => api.post('/colmeias/', data)
export const updateColmeia = (id: number, data: object) => api.put(`/colmeias/${id}/`, data)
export const deleteColmeia = (id: number) => api.delete(`/colmeias/${id}/`)
export const getColmeiaInspecoes = (id: number) => api.get(`/colmeias/${id}/inspecoes/`)
export const getColmeiaProducoes = (id: number) => api.get(`/colmeias/${id}/producoes/`)
export const getColmeiaTratamentos = (id: number) => api.get(`/colmeias/${id}/tratamentos/`)
export const getColmeiaHistorico = (id: number) => api.get(`/colmeias/${id}/historico/`)
export const getColmeiaLeiturasSensor = (id: number, params?: object) =>
  api.get(`/colmeias/${id}/leituras_sensor/`, { params })

// Inspeções
export const getInspecoes = (params?: object) => api.get('/inspecoes/', { params })
export const getInspecao = (id: number) => api.get(`/inspecoes/${id}/`)
export const createInspecao = (data: object) => api.post('/inspecoes/', data)
export const updateInspecao = (id: number, data: object) => api.put(`/inspecoes/${id}/`, data)
export const deleteInspecao = (id: number) => api.delete(`/inspecoes/${id}/`)

// Produções
export const getProducoes = (params?: object) => api.get('/producoes/', { params })
export const getProducao = (id: number) => api.get(`/producoes/${id}/`)
export const createProducao = (data: object) => api.post('/producoes/', data)
export const updateProducao = (id: number, data: object) => api.put(`/producoes/${id}/`, data)
export const deleteProducao = (id: number) => api.delete(`/producoes/${id}/`)
export const getProducaoRelatorio = (params?: object) =>
  api.get('/producoes/relatorio/', { params })

// Tratamentos
export const getTratamentos = (params?: object) => api.get('/tratamentos/', { params })
export const getTratamento = (id: number) => api.get(`/tratamentos/${id}/`)
export const createTratamento = (data: object) => api.post('/tratamentos/', data)
export const updateTratamento = (id: number, data: object) => api.put(`/tratamentos/${id}/`, data)
export const deleteTratamento = (id: number) => api.delete(`/tratamentos/${id}/`)
export const finalizarTratamento = (id: number, data: object) =>
  api.post(`/tratamentos/${id}/finalizar/`, data)

// Notificações
export const getNotificacoes = (params?: object) => api.get('/notificacoes/', { params })
export const getNotificacoesNaoLidas = () => api.get('/notificacoes/nao_lidas/')
export const marcarNotificacaoLida = (id: number) =>
  api.post(`/notificacoes/${id}/marcar_lida/`)
export const marcarTodasNotificacoesLidas = () =>
  api.post('/notificacoes/marcar_todas_lidas/')
export const getAlertaRuidoConfig = () => api.get('/notificacoes/alerta_ruido_config/')
export const updateAlertaRuidoConfig = (data: object) =>
  api.patch('/notificacoes/alerta_ruido_config/', data)
export const getUsuarios = (params?: object) => api.get('/usuarios/', { params })

// IA — Pólen
export const classificarPolen = (data: object) => api.post('/ia/polen/classificar/', data)
export const getIAStatus = () => api.get('/ia/status/')
export const getClassificacoes = (params?: object) => api.get('/ia/classificacoes/', { params })
export const getClassificacaoEstatisticas = (params?: object) =>
  api.get('/ia/classificacoes/estatisticas/', { params })
export const deleteClassificacao = (id: number) => api.delete(`/ia/classificacoes/${id}/`)

export default api
