// src/services/api.js - Updated API Service with Prompt Management
import axios from 'axios';

// Backend configuration
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
  
  // Legacy LLM features (for backward compatibility)
  getLLMPrompts: () => api.get('/api/llm-prompts'),
  processWithLLM: (data) => api.post('/api/llm-process', data),
  chatWithLLM: (data) => api.post('/api/chat', data),
  
  // NEW: Database-driven prompt management
  prompts: {
    // Get all prompts with optional filtering
    getAll: (params = {}) => {
      const queryParams = new URLSearchParams();
      if (params.category) queryParams.append('category', params.category);
      if (params.active_only !== undefined) queryParams.append('active_only', params.active_only);
      return api.get(`/api/prompts?${queryParams.toString()}`);
    },
    
    // Get available categories
    getCategories: () => api.get('/api/prompts/categories'),
    
    // Get specific prompt by key
    getByKey: (key) => api.get(`/api/prompts/${key}`),
    
    // Create new prompt
    create: (promptData) => api.post('/api/prompts', promptData),
    
    // Update existing prompt
    update: (promptId, promptData) => api.put(`/api/prompts/${promptId}`, promptData),
    
    // Delete prompt
    delete: (promptId) => api.delete(`/api/prompts/${promptId}`),
    
    // Toggle prompt active/inactive status
    toggle: (promptKey) => api.post(`/api/prompts/${promptKey}/toggle`),
    
    // Increment usage count for analytics
    incrementUsage: (promptKey) => api.post(`/api/prompts/${promptKey}/increment-usage`),
    
    // Get usage analytics
    getAnalytics: () => api.get('/api/prompts/analytics/usage')
  },
  
  // File downloads
  downloadFile: (sessionId, filename) => {
    return api.get(`/api/download/${sessionId}/${filename}`, {
      responseType: 'blob',
    });
  },
  
  // Utility methods
  get: (url, config) => api.get(url, config),
  post: (url, data, config) => api.post(url, data, config),
  put: (url, data, config) => api.put(url, data, config),
  delete: (url, config) => api.delete(url, config),
};

export default api;