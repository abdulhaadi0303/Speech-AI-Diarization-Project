// src/services/api.js - Enhanced API Service with Better Error Handling
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

// Response interceptor with enhanced error handling
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.status, error.response?.data || error.message);
    
    // Enhance error object with user-friendly messages
    if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
      error.isNetworkError = true;
      error.userMessage = 'Backend server is not reachable. Please check if the server is running on port 8888.';
    } else if (error.response?.status === 503) {
      error.userMessage = error.response.data?.detail || 'Service temporarily unavailable. Database may not be initialized.';
    } else if (error.response?.status === 500) {
      error.userMessage = error.response.data?.detail || 'Server error occurred. Please try again later.';
    } else if (error.response?.status === 404) {
      error.userMessage = error.response.data?.detail || 'Resource not found';
    } else if (error.response?.status === 400) {
      error.userMessage = error.response.data?.detail || 'Invalid request data';
    } else if (error.response?.status === 403) {
      error.userMessage = error.response.data?.detail || 'Permission denied';
    } else {
      error.userMessage = error.response?.data?.detail || error.message || 'An unexpected error occurred';
    }
    
    return Promise.reject(error);
  }
);

export const backendApi = {
  // Health check
  checkHealth: () => api.get('/health'),
  
  // Test database connection
  testDatabase: async () => {
    try {
      const response = await api.get('/api/prompts');
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.userMessage,
        needsInit: error.response?.status === 503
      };
    }
  },
  
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
  
  // Enhanced database-driven prompt management
  prompts: {
    // Get all prompts with optional filtering
    getAll: async (params = {}) => {
      try {
        const queryParams = new URLSearchParams();
        if (params.category && params.category !== 'all') {
          queryParams.append('category', params.category);
        }
        if (params.active_only !== undefined) {
          queryParams.append('active_only', params.active_only);
        }
        
        const url = `/api/prompts${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        return await api.get(url);
      } catch (error) {
        console.error('Failed to fetch prompts:', error);
        throw error;
      }
    },
    
    // Get available categories
    getCategories: async () => {
      try {
        return await api.get('/api/prompts/categories');
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        // Return default categories as fallback
        return {
          data: {
            categories: [
              { value: 'all', label: 'All Categories', color: 'gray' },
              { value: 'general', label: 'General', color: 'blue' },
              { value: 'meeting', label: 'Meeting', color: 'green' },
              { value: 'content', label: 'Content', color: 'purple' },
              { value: 'analysis', label: 'Analysis', color: 'yellow' },
              { value: 'productivity', label: 'Productivity', color: 'orange' }
            ]
          }
        };
      }
    },
    
    // Get specific prompt by key
    getByKey: async (key) => {
      try {
        return await api.get(`/api/prompts/${key}`);
      } catch (error) {
        console.error(`Failed to fetch prompt ${key}:`, error);
        throw error;
      }
    },
    
    // Create new prompt
    create: async (promptData) => {
      try {
        // Validate required fields
        if (!promptData.key || !promptData.title || !promptData.prompt_template) {
          throw new Error('Missing required fields: key, title, and prompt_template are required');
        }
        
        if (!promptData.prompt_template.includes('{transcript}')) {
          throw new Error('Prompt template must contain {transcript} placeholder');
        }
        
        return await api.post('/api/prompts', promptData);
      } catch (error) {
        console.error('Failed to create prompt:', error);
        throw error;
      }
    },
    
    // Update existing prompt
    update: async (promptId, promptData) => {
      try {
        if (!promptId) {
          throw new Error('Prompt ID is required for update');
        }
        
        // Remove empty/undefined values
        const cleanData = Object.fromEntries(
          Object.entries(promptData).filter(([_, value]) => value !== '' && value !== null && value !== undefined)
        );
        
        return await api.put(`/api/prompts/${promptId}`, cleanData);
      } catch (error) {
        console.error(`Failed to update prompt ${promptId}:`, error);
        throw error;
      }
    },
    
    // Delete prompt
    delete: async (promptId) => {
      try {
        if (!promptId) {
          throw new Error('Prompt ID is required for deletion');
        }
        
        return await api.delete(`/api/prompts/${promptId}`);
      } catch (error) {
        console.error(`Failed to delete prompt ${promptId}:`, error);
        throw error;
      }
    },
    
    // Toggle prompt active/inactive status
    toggle: async (promptKey) => {
      try {
        if (!promptKey) {
          throw new Error('Prompt key is required for toggle');
        }
        
        return await api.post(`/api/prompts/${promptKey}/toggle`);
      } catch (error) {
        console.error(`Failed to toggle prompt ${promptKey}:`, error);
        throw error;
      }
    },
    
    // Increment usage count for analytics
    incrementUsage: async (promptKey) => {
      try {
        if (!promptKey) {
          throw new Error('Prompt key is required');
        }
        
        return await api.post(`/api/prompts/${promptKey}/increment-usage`);
      } catch (error) {
        console.error(`Failed to increment usage for ${promptKey}:`, error);
        // Don't throw error for analytics - it's not critical
        return null;
      }
    },
    
    // Get usage analytics
    getAnalytics: async () => {
      try {
        return await api.get('/api/prompts/analytics/usage');
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
        // Return empty analytics as fallback
        return {
          data: {
            overview: {
              total_prompts: 0,
              active_prompts: 0,
              total_usage: 0,
              average_usage: 0
            },
            categories: {},
            top_prompts: []
          }
        };
      }
    }
  },
  
  // File downloads
  downloadFile: (sessionId, filename) => {
    return api.get(`/api/download/${sessionId}/${filename}`, {
      responseType: 'blob',
    });
  },
  
  // System utilities
  initializeDatabase: async () => {
    try {
      // This would call a database initialization endpoint if it exists
      const response = await api.post('/api/admin/init-database');
      return response;
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw error;
    }
  },
  
  // Utility methods
  get: (url, config) => api.get(url, config),
  post: (url, data, config) => api.post(url, data, config),
  put: (url, data, config) => api.put(url, data, config),
  delete: (url, config) => api.delete(url, config),
};

// Export both named and default for compatibility
export { api };
export default backendApi;