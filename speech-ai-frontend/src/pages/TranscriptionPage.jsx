// src/pages/TranscriptionPage.jsx - Updated to track current view state
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

// ✅ FIXED: Main Component with Error Prevention & Refresh Handling
const TranscriptionPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isConnected, updateSessionStatus } = useBackend();
  
  // ✅ ADDED: Ref for LiveTranscriptEditor to enable header downloads
  const editorRef = useRef(null);
  
  // ✅ NEW: Track current view state
  const [currentView, setCurrentView] = useState('original'); // 'original' or 'editor'
  
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
  const initializedRef = useRef(false);

  // ✅ NEW: Handle view changes from TranscriptPanel
  const handleViewChange = useCallback((view) => {
    setCurrentView(view);
  }, []);

  // ✅ FIXED: Handle session initialization with refresh detection
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const stateData = location.state;
    
    // ✅ Check if we have results already (page refresh case)
    if (currentSessionId && results && !stateData) {
      console.log('🔄 Page refresh detected - session already completed');
      // Don't restart processing, just display existing results
      if (processingStatus?.status !== 'completed') {
        setProcessingStatus({
          status: 'completed',
          progress: 100,
          message: 'Processing completed successfully!'
        });
      }
      return;
    }

    // ✅ Handle new session from navigation
    if (stateData?.sessionId) {
      console.log('📥 Receiving new session:', stateData.sessionId);
      console.log('📄 With file info:', stateData.fileInfo);
      
      // Update session ID
      setCurrentSessionId(stateData.sessionId);
      
      // ✅ FIXED: Only initialize processing status if not already processing
      const currentStatus = useAppStore.getState().processingStatus;
      if (!currentStatus || currentStatus.status !== 'processing' || 
          currentStatus.sessionId !== stateData.sessionId) {
        setProcessingStatus({ 
          status: 'processing', 
          progress: 5, 
          message: 'Starting audio processing...',
          fileInfo: stateData.fileInfo,
          sessionId: stateData.sessionId // Track which session this status belongs to
        });
        console.log('🎯 Initialized processing status for session:', stateData.sessionId);
      } else {
        console.log('✅ Processing status already exists for this session');
      }
    }
  }, [location.state, setCurrentSessionId, setProcessingStatus, currentSessionId, results, processingStatus]);

  // ✅ FIXED: Start polling with better session validation
  useEffect(() => {
    const sessionToUse = currentSessionId;
    
    // Don't start polling if:
    // 1. No session ID
    // 2. Already completed (and we have results)
    // 3. It's a temporary session ID
    // 4. Already polling
    if (!sessionToUse || 
        (processingStatus?.status === 'completed' && results) ||
        sessionToUse.startsWith('temp_') ||
        statusPollingRef.current) {
      return;
    }

    console.log('🔄 Starting status polling for session:', sessionToUse);
    startStatusPolling(sessionToUse);
  }, [currentSessionId, processingStatus?.status, results]);

  // ✅ FIXED: Polling with better error handling
  const startStatusPolling = useCallback((sessionId) => {
    if (statusPollingRef.current) {
      clearInterval(statusPollingRef.current);
    }

    console.log('🔄 Starting status polling for:', sessionId);
    let consecutiveErrors = 0;
    const MAX_ERRORS = 3;

    statusPollingRef.current = setInterval(async () => {
      try {
        const response = await backendApi.getProcessingStatus(sessionId);
        const status = response.data;
        
        // Reset error counter on successful request
        consecutiveErrors = 0;
        
        console.log('📊 Backend status:', status.status, status.progress || 'no progress');
        
        updateSessionStatus(sessionId, status);

        if (status.status === 'completed') {
          console.log('✅ Backend processing completed');
          
          // Set completion status
          const currentStatus = useAppStore.getState().processingStatus;
          const finalProgress = Math.max(100, currentStatus?.progress || 0);
          
          setProcessingStatus({
            status: 'completed',
            progress: finalProgress,
            message: 'Processing completed successfully!',
            sessionId: sessionId
          });
          
          // Fetch results
          try {
            const resultsResponse = await backendApi.getResults(sessionId);
            setResults(resultsResponse.data);
            toast.success('Transcription completed!');
          } catch (resultError) {
            console.error('Failed to fetch results:', resultError);
            // Don't show error toast if the main processing completed
          }
          
          clearInterval(statusPollingRef.current);
          statusPollingRef.current = null;
          
        } else if (status.status === 'failed') {
          console.log('❌ Backend processing failed');
          clearInterval(statusPollingRef.current);
          statusPollingRef.current = null;
          setProcessingStatus({
            status: 'failed',
            message: status.message || 'Processing failed',
            progress: 0,
            sessionId: sessionId
          });
          toast.error(status.message || 'Processing failed');
          
        } else if (status.status === 'processing') {
          // Update progress from backend if it's higher
          const currentStatus = useAppStore.getState().processingStatus;
          if (!currentStatus || status.progress > (currentStatus.progress || 0)) {
            setProcessingStatus({
              ...currentStatus,
              status: 'processing',
              progress: Math.max(status.progress || 5, currentStatus?.progress || 5),
              message: status.message || currentStatus?.message || 'Processing audio...',
              sessionId: sessionId
            });
            console.log('📈 Updated progress from backend:', status.progress);
          }
        }
        
      } catch (error) {
        consecutiveErrors++;
        console.error(`Status polling error (${consecutiveErrors}/${MAX_ERRORS}):`, error);
        
        // ✅ FIXED: Better error handling - don't show user errors for temporary network issues
        if (error.response?.status === 404) {
          // Session not found - only stop polling after multiple failures to avoid false positives
          if (consecutiveErrors >= MAX_ERRORS) {
            console.log('❌ Session not found after multiple attempts, stopping polling');
            clearInterval(statusPollingRef.current);
            statusPollingRef.current = null;
            setProcessingStatus({ 
              status: 'failed', 
              message: 'Session not found on server',
              progress: 0,
              sessionId: sessionId
            });
            // Only show error if this is a real session (not temp)
            if (!sessionId.startsWith('temp_')) {
              toast.error('Session not found on server');
            }
          }
        } else if (consecutiveErrors >= MAX_ERRORS) {
          // Network error - stop polling after multiple failures
          console.log('❌ Multiple network errors, stopping polling');
          clearInterval(statusPollingRef.current);
          statusPollingRef.current = null;
          // Don't update status or show error - might be temporary network issue
        }
      }
    }, 3000); // Poll every 3 seconds (slightly slower to reduce load)
  }, [setProcessingStatus, setResults, updateSessionStatus]);

  // ✅ Handle session reset
  const handleReset = useCallback(() => {
    if (statusPollingRef.current) {
      clearInterval(statusPollingRef.current);
      statusPollingRef.current = null;
    }
    // Clear all session state
    setCurrentSessionId(null);
    setProcessingStatus(null);
    setResults(null);
    navigate('/');
  }, [navigate, setCurrentSessionId, setProcessingStatus, setResults]);

  // ✅ Cleanup on unmount
  useEffect(() => {
    return () => {
      if (statusPollingRef.current) {
        clearInterval(statusPollingRef.current);
        statusPollingRef.current = null;
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
        
        {/* Component 1: Header Section - ✅ UPDATED: Pass editorRef and currentView */}
        <TranscriptionPageHeader 
          currentSessionId={currentSessionId}
          results={results}
          structures={structures}
          parameters={parameters}
          hasSession={hasSession}
          editorRef={editorRef}
          currentView={currentView}
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

        {/* Component 3: Centered Transcript Panel - ✅ FIXED: 1.6x height increase */}
        <div className="flex justify-center" style={{ height: 'calc(160vh - 480px)', minHeight: '960px' }}>
          <div 
            className="border-4 border-cyan-400 rounded-3xl p-2 w-full max-w-5xl overflow-hidden" 
            style={{ 
              maxWidth: 'calc(64rem + 100px)',
              height: '100%'
            }}
          >
            <TranscriptPanel 
              results={results}
              isExpanded={expandedTranscript}
              onToggleExpand={() => setExpandedTranscript(!expandedTranscript)}
              hasSession={hasSession}
              editorRef={editorRef}
              onViewChange={handleViewChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TranscriptionPage;