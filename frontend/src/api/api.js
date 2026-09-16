import axios from 'axios'

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('joineazy_token')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

api.interceptors.response.use(
  (response) => response,

  (error) => {
    const status = error.response?.status

    const token = localStorage.getItem(
      'joineazy_token'
    )

    if (status === 401 && token) {
      localStorage.removeItem(
        'joineazy_token'
      )

      if (
        window.location.pathname !== '/login'
      ) {
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)

export default api