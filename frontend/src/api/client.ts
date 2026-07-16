import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const refreshToken = localStorage.getItem('refreshToken')
        const { data } = await axios.post(`${BASE_URL}/v1/auth/refresh`, { refreshToken })
        localStorage.setItem('accessToken', data.accessToken)
        localStorage.setItem('refreshToken', data.refreshToken)
        original.headers.Authorization = `Bearer ${data.accessToken}`
        return api(original)
      } catch {
        localStorage.clear()
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// ── Auth ──
export const authApi = {
  login: (username: string, password: string) =>
    api.post('/v1/auth/login', { username, password }),
  register: (username: string, email: string, password: string) =>
    api.post('/v1/auth/register', { username, email, password }),
  logout: () => api.post('/v1/auth/logout'),
  refresh: (refreshToken: string) =>
    api.post('/v1/auth/refresh', { refreshToken }),
}

// ── Chat ──
export const chatApi = {
  createConversation: (title?: string, model?: string) =>
    api.post('/v1/chat/conversations', { title, model }),
  listConversations: (page = 0, size = 20) =>
    api.get(`/v1/chat/conversations?page=${page}&size=${size}`),
  getConversation: (id: string) =>
    api.get(`/v1/chat/conversations/${id}`),
  renameConversation: (id: string, title: string) =>
    api.patch(`/v1/chat/conversations/${id}/rename`, { title }),
  togglePin: (id: string) =>
    api.post(`/v1/chat/conversations/${id}/pin`),
  deleteConversation: (id: string) =>
    api.delete(`/v1/chat/conversations/${id}`),
  searchConversations: (q: string, page = 0) =>
    api.get(`/v1/chat/conversations/search?q=${encodeURIComponent(q)}&page=${page}`),
  getMessages: (id: string) =>
    api.get(`/v1/chat/conversations/${id}/messages`),
  exportConversation: (id: string) =>
    api.get(`/v1/chat/conversations/${id}/export`),
  streamMessage: (conversationId: string, message: string, model?: string) => {
    const token = localStorage.getItem('accessToken')
    const url = `${BASE_URL}/v1/chat/conversations/${conversationId}/stream`
    return fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        Accept: 'text/event-stream',
      },
      body: JSON.stringify({ message, model }),
    })
  },
}

// ── Memories ──
export const memoryApi = {
  list: (page = 0, size = 20) =>
    api.get(`/v1/memories?page=${page}&size=${size}`),
  getPinned: () => api.get('/v1/memories/pinned'),
  get: (id: string) => api.get(`/v1/memories/${id}`),
  create: (data: {
    content: string; type: string; importance: number; tags?: string; pinned?: boolean
  }) => api.post('/v1/memories', data),
  update: (id: string, data: {
    content: string; importance: number; tags?: string; pinned: boolean
  }) => api.put(`/v1/memories/${id}`, data),
  delete: (id: string) => api.delete(`/v1/memories/${id}`),
}

// ── Documents ──
export const documentApi = {
  upload: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.post('/v1/documents/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  list: (page = 0, size = 20) =>
    api.get(`/v1/documents?page=${page}&size=${size}`),
  get: (id: string) => api.get(`/v1/documents/${id}`),
  delete: (id: string) => api.delete(`/v1/documents/${id}`),
}

// ── Personality ──
export const personalityApi = {
  get: () => api.get('/v1/personality'),
  update: (data: Record<string, unknown>) => api.put('/v1/personality', data),
}

// ── Search ──
export const searchApi = {
  search: (q: string, scope = 'ALL', limit = 10) =>
    api.get(`/v1/search?q=${encodeURIComponent(q)}&scope=${scope}&limit=${limit}`),
}

// ── Analytics ──
export const analyticsApi = {
  getSummary: () => api.get('/v1/analytics/summary'),
}

// ── Devices ──
export const deviceApi = {
  list: () => api.get('/v1/devices'),
  revoke: (id: string) => api.delete(`/v1/devices/${id}`),
  whitelist: (id: string) => api.post(`/v1/devices/${id}/whitelist`),
}
