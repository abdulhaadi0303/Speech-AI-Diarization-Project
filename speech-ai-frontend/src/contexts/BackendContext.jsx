// src/contexts/BackendContext.jsx - Enhanced Backend Connection Management
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { backendApi } from '../services/api';
import toast from 'react-hot-toast';

const BackendContext = createContext();

export const useBackend = () => {
  const context = useContext(BackendContext);
  if (!context) {
    throw new Error('useBackend must be used within a BackendProvider');
  }
  return context;
};

export const BackendProvider = ({ children }) => {
  const [backendStatus, setBackendStatus] = useState({
    connected: false,
    loading: true,
    info: null,
    lastChecked: null
  });

  const [activeSessions, setActiveSessions] = useState(new Map());
  const [processingNotifications, setProcessingNotifications] = useState(new Set());
  
  // Refs for background polling
  const statusPollingIntervals = useRef(new Map());
  const navigationCallbacks = useRef(new Map());

  const checkBackendHealth = async () => {
    try {
      const response = await backendApi.checkHealth();
      setBackendStatus({
        connected: true,
        loading: false,
        info: response.data,
        lastChecked: new Date()
      });
      return true;
    } catch (error) {
      setBackendStatus({
        connected: false,
        loading: false,
        info: null,
        lastChecked: new Date(),
        error: error.message
      });
      return false;
    }
  };

  const addSession = (sessionId, sessionData) => {
    setActiveSessions(prev => new Map(prev.set(sessionId, sessionData)));
    
    // If this is a processing session, start background monitoring
    if (sessionData.status === 'processing') {
      startBackgroundPolling(sessionId);
    }
  };

  const updateSessionStatus = (sessionId, status) => {
    setActiveSessions(prev => {
      const newSessions = new Map(prev);
      const existingSession = newSessions.get(sessionId);
      if (existingSession) {
        newSessions.set(sessionId, { ...existingSession, ...status });
      } else {
        newSessions.set(sessionId, status);
      }
      return newSessions;
    });

    // Handle completion
    if (status.status === 'completed') {
      handleSessionCompletion(sessionId);
    } else if (status.status === 'failed') {
      handleSessionFailure(sessionId);
    }
  };

  const removeSession = (sessionId) => {
    setActiveSessions(prev => {
      const newSessions = new Map(prev);
      newSessions.delete(sessionId);
      return newSessions;
    });
    
    // Clean up background polling
    stopBackgroundPolling(sessionId);
  };

  // Background polling for processing sessions
  const startBackgroundPolling = (sessionId) => {
    // Don't start if already polling
    if (statusPollingIntervals.current.has(sessionId)) {
      return;
    }

    console.log(`Starting background polling for session: ${sessionId}`);
    
    const interval = setInterval(async () => {
      try {
        const response = await backendApi.getProcessingStatus(sessionId);
        const status = response.data;
        
        updateSessionStatus(sessionId, status);
        
        // Stop polling on completion or failure
        if (status.status === 'completed' || status.status === 'failed') {
          stopBackgroundPolling(sessionId);
        }
        
      } catch (error) {
        console.error(`Background polling error for ${sessionId}:`, error);
        // Don't stop polling on network errors, might be temporary
      }
    }, 3000); // Poll every 3 seconds for background
    
    statusPollingIntervals.current.set(sessionId, interval);
  };

  const stopBackgroundPolling = (sessionId) => {
    const interval = statusPollingIntervals.current.get(sessionId);
    if (interval) {
      clearInterval(interval);
      statusPollingIntervals.current.delete(sessionId);
      console.log(`Stopped background polling for session: ${sessionId}`);
    }
  };

  // Handle session completion
  const handleSessionCompletion = (sessionId) => {
    // Show notification if not already shown
    if (!processingNotifications.has(sessionId)) {
      toast.success(`Processing completed for session ${sessionId.slice(0, 8)}!`, {
        duration: 6000,
        id: `completion-${sessionId}`
      });
      setProcessingNotifications(prev => new Set(prev).add(sessionId));
    }

    // Execute navigation callback if exists
    const callback = navigationCallbacks.current.get(sessionId);
    if (callback) {
      callback(sessionId);
      navigationCallbacks.current.delete(sessionId);
    }
  };

  const handleSessionFailure = (sessionId) => {
    const session = activeSessions.get(sessionId);
    toast.error(`Processing failed for session ${sessionId.slice(0, 8)}: ${session?.message || 'Unknown error'}`, {
      duration: 8000,
      id: `failure-${sessionId}`
    });
    setProcessingNotifications(prev => new Set(prev).add(sessionId));
  };

  // Register navigation callback for when processing completes
  const registerNavigationCallback = (sessionId, callback) => {
    navigationCallbacks.current.set(sessionId, callback);
  };

  // Check for processing sessions on app load and resume monitoring
  const resumeBackgroundProcessing = () => {
    activeSessions.forEach((sessionData, sessionId) => {
      if (sessionData.status === 'processing') {
        startBackgroundPolling(sessionId);
      }
    });
  };

  // Get processing sessions
  const getProcessingSessions = () => {
    return Array.from(activeSessions.entries())
      .filter(([_, sessionData]) => sessionData.status === 'processing')
      .map(([sessionId, sessionData]) => ({ sessionId, ...sessionData }));
  };

  // Get completed sessions
  const getCompletedSessions = () => {
    return Array.from(activeSessions.entries())
      .filter(([_, sessionData]) => sessionData.status === 'completed')
      .map(([sessionId, sessionData]) => ({ sessionId, ...sessionData }));
  };

  // Initial health check
  useEffect(() => {
    checkBackendHealth();
  }, []);

  // Periodic health check (every 30 seconds)
  useEffect(() => {
    const interval = setInterval(checkBackendHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  // Resume background processing on mount
  useEffect(() => {
    resumeBackgroundProcessing();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear all polling intervals
      statusPollingIntervals.current.forEach((interval) => {
        clearInterval(interval);
      });
      statusPollingIntervals.current.clear();
      navigationCallbacks.current.clear();
    };
  }, []);

  // Show connection status changes
  useEffect(() => {
    if (backendStatus.lastChecked && !backendStatus.loading) {
      if (backendStatus.connected) {
        if (backendStatus.info?.llm?.status === 'connected') {
          toast.success('Backend & LLM connected', { id: 'backend-status' });
        } else {
          toast.success('Backend connected (LLM offline)', { id: 'backend-status' });
        }
      } else {
        toast.error('Backend disconnected', { id: 'backend-status' });
      }
    }
  }, [backendStatus.connected, backendStatus.lastChecked]);

  const value = {
    backendStatus,
    activeSessions,
    processingNotifications,
    checkBackendHealth,
    addSession,
    updateSessionStatus,
    removeSession,
    startBackgroundPolling,
    stopBackgroundPolling,
    registerNavigationCallback,
    getProcessingSessions,
    getCompletedSessions,
    isConnected: backendStatus.connected,
    isLLMAvailable: backendStatus.info?.llm?.status === 'connected'
  };

  return (
    <BackendContext.Provider value={value}>
      {children}
    </BackendContext.Provider>
  );
};