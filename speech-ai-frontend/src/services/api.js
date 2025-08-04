// src/services/api.js - API Service Layer
import axios from 'axios';

// Backend configuration - will be set during build or runtime
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8888';

// Create axios instance with default config
const api = axios.create({
  baseURL: BACKEND_URL,
  timeout: 300000, // 5 minutes for long processing
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.status, error.response?.data || error.message);
    
    // Handle different error types
    if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
      error.isNetworkError = true;
      error.userMessage = 'Backend server is not reachable. Please check if the server is running.';
    } else if (error.response?.status === 503) {
      error.userMessage = error.response.data?.detail || 'Service temporarily unavailable';
    } else if (error.response?.status >= 500) {
      error.userMessage = 'Server error occurred. Please try again later.';
    } else if (error.response?.status === 404) {
      error.userMessage = 'Resource not found';
    } else {
      error.userMessage = error.response?.data?.detail || error.message || 'An error occurred';
    }
    
    return Promise.reject(error);
  }
);

export const backendApi = {
  // Health check
  checkHealth: () => api.get('/health'),
  
  // Audio processing
  uploadAudio: (formData, onUploadProgress) => {
    return api.post('/api/upload-audio', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
  },
  
  // Session management
  getProcessingStatus: (sessionId) => api.get(`/api/processing-status/${sessionId}`),
  getResults: (sessionId) => api.get(`/api/results/${sessionId}`),
  cleanupSession: (sessionId) => api.delete(`/api/session/${sessionId}`),
  
  // LLM features
  getLLMPrompts: () => api.get('/api/llm-prompts'),
  processWithLLM: (data) => api.post('/api/llm-process', data),
  chatWithLLM: (data) => api.post('/api/chat', data),
  
  // File downloads
  downloadFile: (sessionId, filename) => {
    return api.get(`/api/download/${sessionId}/${filename}`, {
      responseType: 'blob',
    });
  },
};

export default api;