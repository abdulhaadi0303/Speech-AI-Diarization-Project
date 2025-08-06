// src/pages/TranscriptionPage.jsx - Refactored with 4 Components
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { 
  Upload, 
  FileAudio, 
  Settings, 
  Play, 
  Loader2,
  CheckCircle,
  AlertCircle,
  Download,
  X,
  Users,
  Clock,
  Globe,
  Copy,
  Maximize2,
  Minimize2,
  Volume2,
  ArrowLeft
} from 'lucide-react';
import { useBackend } from '../contexts/BackendContext';
import { backendApi } from '../services/api';
import useAppStore from '../stores/appStore';
import toast from 'react-hot-toast';

// Import the new components
import TranscriptionPageHeader from '../Components/transcription/TranscriptionPageHeader';
import ProcessingStatusSection from '../Components/transcription/ProcessingStatusSection';
import TranscriptPanel from '../Components/transcription/TranscriptPanel';

// ✅ MAIN COMPONENT - Refactored with 4 Components
const TranscriptionPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isConnected, updateSessionStatus } = useBackend();
  
  // ✅ Use Zustand store for persistent state
  const currentSessionId = useAppStore((state) => state.currentSessionId);
  const setCurrentSessionId = useAppStore((state) => state.setCurrentSessionId);
  const processingStatus = useAppStore((state) => state.processingStatus);
  const setProcessingStatus = useAppStore((state) => state.setProcessingStatus);
  const results = useAppStore((state) => state.results);
  const setResults = useAppStore((state) => state.setResults);
  const expandedTranscript = useAppStore((state) => state.expandedTranscript);
  const setExpandedTranscript = useAppStore((state) => state.setExpandedTranscript);
  const structures = useAppStore((state) => state.structures);
  const parameters = useAppStore((state) => state.parameters);

  const statusPollingRef = useRef(null);

  // ✅ Get session data from navigation state OR use persisted store data
  useEffect(() => {
    const stateData = location.state;
    if (stateData?.sessionId) {
      // New session from navigation
      setCurrentSessionId(stateData.sessionId);
      setProcessingStatus({ status: 'processing', progress: 0, message: 'Initializing transcription...' });
    }
    // If no new session but we have persisted session, keep using it
    // If no session at all, show demo content
  }, [location.state, setCurrentSessionId, setProcessingStatus]);

  // ✅ Start polling when session ID is available (from store or navigation)
  useEffect(() => {
    const sessionToUse = currentSessionId;
    if (sessionToUse && (!processingStatus || processingStatus.status !== 'completed')) {
      startStatusPolling(sessionToUse);
    }
  }, [currentSessionId, processingStatus]);

  // ✅ Poll processing status and persist to store
  const startStatusPolling = useCallback((sessionId) => {
    if (statusPollingRef.current) {
      clearInterval(statusPollingRef.current);
    }

    statusPollingRef.current = setInterval(async () => {
      try {
        const response = await backendApi.getProcessingStatus(sessionId);
        const status = response.data;
        
        setProcessingStatus(status); // ✅ Persist to store
        updateSessionStatus(sessionId, status);

        if (status.status === 'completed') {
          // Fetch results and persist to store
          const resultsResponse = await backendApi.getResults(sessionId);
          setResults(resultsResponse.data); // ✅ Persist to store
          
          clearInterval(statusPollingRef.current);
          toast.success('Transcription completed!');
          
        } else if (status.status === 'failed') {
          clearInterval(statusPollingRef.current);
          toast.error(status.message || 'Processing failed');
        }
        
      } catch (error) {
        console.error('Status polling error:', error);
        clearInterval(statusPollingRef.current);
        setProcessingStatus({ status: 'failed', message: 'Connection error' });
      }
    }, 2000); // Poll every 2 seconds
  }, [setProcessingStatus, setResults, updateSessionStatus]);

  // ✅ Handle session reset
  const handleReset = useCallback(() => {
    if (statusPollingRef.current) {
      clearInterval(statusPollingRef.current);
    }
    navigate('/');
  }, [navigate]);

  // ✅ Cleanup on unmount
  useEffect(() => {
    return () => {
      if (statusPollingRef.current) {
        clearInterval(statusPollingRef.current);
      }
    };
  }, []);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-800 flex items-center justify-center">
        <div className="text-center bg-gray-700 rounded-2xl p-8 shadow-lg max-w-md border border-gray-600">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Backend Disconnected</h2>
          <p className="text-gray-300">Please ensure the backend server is running and accessible.</p>
        </div>
      </div>
    );
  }

  const hasSession = !!currentSessionId;

  return (
    <div className="min-h-screen bg-gray-800 overflow-auto">
      <div className="p-6 max-w-7xl mx-auto">
        
        {/* Component 1: Header Section */}
        <TranscriptionPageHeader 
          currentSessionId={currentSessionId}
          results={results}
          structures={structures}
          parameters={parameters}
          hasSession={hasSession}
        />

        {/* Component 2: Processing Status and Stats */}
        <ProcessingStatusSection 
          hasSession={hasSession}
          processingStatus={processingStatus}
          onReset={handleReset}
          results={results}
          metadata={results?.results?.metadata}
          speakerStats={results?.results?.speaker_stats}
        />

        {/* Component 3: Centered Transcript Panel */}
        <div className="flex justify-center h-[calc(200vh-600px)]">
          <div className="border-4 border-cyan-400 rounded-3xl p-2 w-full max-w-5xl" style={{ maxWidth: 'calc(64rem + 100px)' }}>
            <TranscriptPanel 
              results={results}
              isExpanded={expandedTranscript}
              onToggleExpand={() => setExpandedTranscript(!expandedTranscript)}
              hasSession={hasSession}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TranscriptionPage;