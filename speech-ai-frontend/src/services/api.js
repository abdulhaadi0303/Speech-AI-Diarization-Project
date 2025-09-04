// src/services/api.js - Enhanced API service with proper error handling and auth support
import axios from 'axios';

// Get backend URL from environment or default
const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8888';

// Create axios instance with default config
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth token management
const getStoredAccessToken = () => {
  try {
    return localStorage.getItem('access_token');
  } catch (error) {
    console.warn('Failed to get stored token:', error);
    return null;
  }
};

const setStoredAccessToken = (token) => {
  try {
    if (token) {
      localStorage.setItem('access_token', token);
    } else {
      localStorage.removeItem('access_token');
    }
  } catch (error) {
    console.warn('Failed to store token:', error);
  }
};

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = getStoredAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Enhanced error handling
    if (error.code === 'ECONNABORTED') {
      error.isTimeout = true;
      error.userMessage = 'Request timed out. Please try again.';
    } else if (error.code === 'ERR_NETWORK') {
      error.isNetworkError = true;
      error.userMessage = 'Network error. Please check your connection.';
    } else if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          error.userMessage = 'Authentication required. Please log in.';
          // Clear invalid token
          setStoredAccessToken(null);
          break;
        case 403:
          error.userMessage = 'Access denied. Insufficient permissions.';
          break;
        case 404:
          error.userMessage = 'Resource not found.';
          break;
        case 422:
          error.userMessage = data?.detail || 'Invalid data provided.';
          break;
        case 429:
          error.userMessage = 'Too many requests. Please try again later.';
          break;
        case 503:
          error.userMessage = 'Service temporarily unavailable.';
          break;
        default:
          error.userMessage = data?.detail || data?.message || 'An error occurred.';
      }
    } else {
      error.userMessage = 'An unexpected error occurred.';
    }
    
    return Promise.reject(error);
  }
);

// Main backend API object
const backendApi = {
  // Audio processing
  uploadAudio: async (formData, onProgress) => {
    try {
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 300000, // 5 minutes for audio upload
      };
      
      if (onProgress) {
        config.onUploadProgress = (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        };
      }
      
      return await api.post('/api/upload-audio', formData, config);
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    }
  },

  // Session management
  getResults: async (sessionId) => {
    try {
      return await api.get(`/api/results/${sessionId}`);
    } catch (error) {
      console.error('Failed to get results:', error);
      throw error;
    }
  },

  getProcessingStatus: async (sessionId) => {
    try {
      return await api.get(`/api/processing-status/${sessionId}`);
    } catch (error) {
      console.error('Failed to get processing status:', error);
      throw error;
    }
  },

  cleanupSession: async (sessionId) => {
    try {
      return await api.delete(`/api/cleanup/${sessionId}`);
    } catch (error) {
      console.error('Failed to cleanup session:', error);
      throw error;
    }
  },

  downloadFile: async (sessionId, filename) => {
    try {
      return await api.get(`/api/download/${sessionId}/${filename}`, {
        responseType: 'blob'
      });
    } catch (error) {
      console.error('Download failed:', error);
      throw error;
    }
  },

  // Prompt management - UPDATED WITH PUBLIC ENDPOINT
  prompts: {
    // NEW: Public endpoint for Analysis Page (safe, limited access)
    getPublic: async () => {
      try {
        console.log('🔄 Fetching public prompts for analysis page...');
        const response = await api.get('/api/prompts/public');
        console.log('✅ Public prompts loaded successfully:', response.data);
        return response;
      } catch (error) {
        console.error('❌ Failed to fetch public prompts:', error);
        throw error;
      }
    },

    // EXISTING: Admin endpoint (full access) - UNCHANGED
    getAll: async (filters = {}) => {
      try {
        console.log('🔄 Fetching admin prompts with filters:', filters);
        const queryParams = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, value);
          }
        });
        
        const url = `/api/prompts${queryParams.toString() ? 
          `?${queryParams.toString()}` : ''}`;
        const response = await api.get(url);
        console.log('✅ Admin prompts loaded successfully:', response.data);
        return response;
      } catch (error) {
        console.error('❌ Failed to fetch admin prompts:', error);
        throw error;
      }
    },
    
    // EXISTING: Get available categories - UNCHANGED
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
    
    // EXISTING: Get specific prompt by key - UNCHANGED
    getByKey: async (key) => {
      try {
        return await api.get(`/api/prompts/${key}`);
      } catch (error) {
        console.error(`Failed to fetch prompt ${key}:`, error);
        throw error;
      }
    },
    
    // EXISTING: Create new prompt - UNCHANGED
    create: async (promptData) => {
      try {
        // Validate required fields
        if (!promptData.key || !promptData.title || !promptData.prompt_template) {
          throw new Error('Missing required fields: key, title, and prompt_template');
        }
        
        if (!promptData.prompt_template.includes('{transcript}')) {
          throw new Error('Prompt template must contain {transcript} placeholder');
        }
        
        return await api.post('/api/prompts/', promptData);
      } catch (error) {
        console.error('Failed to create prompt:', error);
        throw error;
      }
    },
    
    // EXISTING: Update prompt - UNCHANGED
    update: async (id, promptData) => {
      try {
        if (!id) {
          throw new Error('Prompt ID is required');
        }
        
        // Validate prompt template if provided
        if (promptData.prompt_template && !promptData.prompt_template.includes('{transcript}')) {
          throw new Error('Prompt template must contain {transcript} placeholder');
        }
        
        return await api.put(`/api/prompts/${id}`, promptData);
      } catch (error) {
        console.error(`Failed to update prompt ${id}:`, error);
        throw error;
      }
    },
    
    // EXISTING: Delete prompt - UNCHANGED
    delete: async (id) => {
      try {
        if (!id) {
          throw new Error('Prompt ID is required');
        }
        
        return await api.delete(`/api/prompts/${id}`);
      } catch (error) {
        console.error(`Failed to delete prompt ${id}:`, error);
        throw error;
      }
    },
    
    // EXISTING: Toggle prompt status - UNCHANGED
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
    
    // EXISTING: Increment usage count for analytics - UNCHANGED
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
    
    // EXISTING: Get usage analytics - UNCHANGED
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

  // EXISTING: LLM processing - UNCHANGED
  llm: {
    // Get available models
    getModels: async () => {
      try {
        return await api.get('/api/llm/models');
      } catch (error) {
        console.error('Failed to get LLM models:', error);
        throw error;
      }
    },
    
    // Get processing templates
    getTemplates: async () => {
      try {
        return await api.get('/llm/templates');
      } catch (error) {
        console.error('Failed to get processing templates:', error);
        throw error;
      }
    },
    
    // Process text
    processText: async (processingData) => {
      try {
        return await api.post('/llm/process', processingData);
      } catch (error) {
        console.error('Failed to process text:', error);
        throw error;
      }
    }
  },

  // EXISTING: Health check - UNCHANGED
  health: async () => {
    try {
      return await api.get('/health');
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  },

  // EXISTING: Alias for backward compatibility - UNCHANGED
  healthCheck: async () => {
    try {
      return await api.get('/health');
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  },

  // EXISTING: Authentication endpoints - UNCHANGED
  auth: {
    // EXISTING: Get auth configuration - UNCHANGED
    getConfig: async () => {
      try {
        return await api.get('/auth/config');
      } catch (error) {
        console.error('Failed to get auth config:', error);
        throw error;
      }
    },
    
    // EXISTING: Login with credentials - UNCHANGED
    login: async (credentials) => {
      try {
        const response = await api.post('/auth/login', credentials);
        
        // Store token if provided
        if (response.data?.access_token) {
          setStoredAccessToken(response.data.access_token);
        }
        
        return response;
      } catch (error) {
        console.error('Login failed:', error);
        throw error;
      }
    },
    
    // EXISTING: Logout - UNCHANGED
    logout: async () => {
      try {
        // Clear stored token
        setStoredAccessToken(null);
        
        // Call logout endpoint if available
        return await api.post('/auth/logout');
      } catch (error) {
        console.error('Logout failed:', error);
        // Don't throw error for logout - just clear token
        return { data: { message: 'Logged out locally' } };
      }
    },
  
    // ✅ NEW: Get current user info (calls /auth/me endpoint)
    getCurrentUser: async () => {
      try {
        console.log('🔄 Fetching current user from /auth/me...');
        const response = await api.get('/auth/me');
        console.log('✅ Current user data received:', response.data);
        return response;
      } catch (error) {
        console.error('❌ Failed to get current user:', error);
        throw error;
      }
    },
  
    // ✅ NEW: Get user sessions (placeholder for now)
    getSessions: async () => {
      try {
        console.log('🔄 Fetching user sessions...');
        // Return empty array since we removed session management from UI
        return {
          data: {
            sessions: []
          }
        };
      } catch (error) {
        console.error('Failed to get sessions:', error);
        throw error;
      }
    },
  
    // ✅ NEW: Update user profile (placeholder - not used in display-only version)
    updateProfile: async (profileData) => {
      try {
        console.log('🔄 Updating profile...', profileData);
        const response = await api.put('/auth/me', profileData);
        return response;
      } catch (error) {
        console.error('Failed to update profile:', error);
        throw error;
      }
    },
  
    // ✅ NEW: Revoke session (placeholder - not used)
    revokeSession: async (sessionId) => {
      try {
        console.log('🔄 Revoking session:', sessionId);
        return {
          data: { message: 'Session management not implemented' }
        };
      } catch (error) {
        console.error('Failed to revoke session:', error);
        throw error;
      }
    }
  },

  // EXISTING: Transcript management - UNCHANGED
  transcripts: {
    // Get all transcripts
    getAll: async (filters = {}) => {
      try {
        return await api.get('/api/transcripts', { params: filters });
      } catch (error) {
        console.error('Failed to get transcripts:', error);
        throw error;
      }
    },
    
    // Get specific transcript
    getById: async (id) => {
      try {
        return await api.get(`/api/transcripts/${id}`);
      } catch (error) {
        console.error(`Failed to get transcript ${id}:`, error);
        throw error;
      }
    },
    
    // Delete transcript
    delete: async (id) => {
      try {
        return await api.delete(`/api/transcripts/${id}`);
      } catch (error) {
        console.error(`Failed to delete transcript ${id}:`, error);
        throw error;
      }
    }
  },

  // EXISTING: Analysis results management - UNCHANGED
  analysis: {
    // Get analysis results
    getResults: async (sessionId, promptKey = null) => {
      try {
        const url = promptKey 
          ? `/api/analysis/${sessionId}/${promptKey}`
          : `/api/analysis/${sessionId}`;
        return await api.get(url);
      } catch (error) {
        console.error('Failed to get analysis results:', error);
        throw error;
      }
    },
    
    // Save analysis result
    saveResult: async (resultData) => {
      try {
        return await api.post('/api/analysis/save', resultData);
      } catch (error) {
        console.error('Failed to save analysis result:', error);
        throw error;
      }
    },
    
    // Export analysis results
    export: async (sessionId, format = 'json') => {
      try {
        return await api.get(`/api/analysis/${sessionId}/export`, {
          params: { format },
          responseType: format === 'pdf' ? 'blob' : 'json'
        });
      } catch (error) {
        console.error('Failed to export analysis:', error);
        throw error;
      }
    }
  },

  // EXISTING: Utility methods for direct API access - UNCHANGED
  get: (url, config) => api.get(url, config),
  post: (url, data, config) => api.post(url, data, config),
  put: (url, data, config) => api.put(url, data, config),
  delete: (url, config) => api.delete(url, config),
  patch: (url, data, config) => api.patch(url, data, config),
};

// EXISTING: Set auth token helper - UNCHANGED
backendApi.setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setStoredAccessToken(token);
  } else {
    delete api.defaults.headers.common['Authorization'];
    setStoredAccessToken(null);
  }
};

// EXISTING: Initialize with stored token if available - UNCHANGED
const storedToken = getStoredAccessToken();
if (storedToken) {
  backendApi.setAuthToken(storedToken);
}

export default backendApi;
export { backendApi };