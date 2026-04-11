import axios from 'axios'

const api = axios.create({
  baseURL: 'https://ielts-platform-backend-production-06dd.up.railway.app/api',
  withCredentials: true, // 自动携带 Cookie
})

api.interceptors.request.use((config) => {
  // 兼容旧 token：如果 localStorage 还有 token 就带上
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const token = localStorage.getItem('token')
      if (token) {
        localStorage.removeItem('token')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api