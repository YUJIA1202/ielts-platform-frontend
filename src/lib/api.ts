import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:4000/api',
})

api.interceptors.request.use((config) => {
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
        // 只有已登录状态下收到 401 才跳转（token 过期）
        localStorage.removeItem('token')
        window.location.href = '/login'
      }
      // 登录页本身收到 401（密码错误）不跳转，直接透传错误
    }
    return Promise.reject(error)
  }
)

export default api