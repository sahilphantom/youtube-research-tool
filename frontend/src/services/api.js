import axios from 'axios'

const API_BASE_URL = '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Video Analysis API
export const getVideoInfo = async (url, format = 'json') => {
  try {
    const response = await api.post('/video-info', { url, format })
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

// Channel Analysis API
export const getChannelAnalysis = async (url, format = 'json') => {
  try {
    const response = await api.post('/channel-analysis', { url, format })
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

// Video Search API
export const searchVideos = async (searchParams) => {
  try {
    const response = await api.post('/search-videos', searchParams)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

// Download CSV helper
export const downloadCSV = (data, filename) => {
  const blob = new Blob([data], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  window.URL.revokeObjectURL(url)
  document.body.removeChild(a)
}

export default api 