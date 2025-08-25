// src/pages/TranscriptionPage.jsx - DEBUG VERSION - Log results structure and fix validation

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

// ✅ UTILITY: Comprehensive results structure validation
const validateAndNormalizeResults = (fetchedData) => {
  console.log('🔍 DEBUGGING Results Structure:', fetchedData);
  console.log('🔍 Type:', typeof fetchedData);
  console.log('🔍 Keys:', Object.keys(fetchedData || {}));
  
  if (!fetchedData) {
    console.log('❌ No fetched data');
    return null;
  }

  // Try different possible result structures
  let segments = null;
  let metadata = null;
  let normalizedResults = null;

  // Pattern 1: results.results.segments (expected)
  if (fetchedData.results?.segments) {
    console.log('✅ Found Pattern 1: fetchedData.results.segments');
    segments = fetchedData.results.segments;
    metadata = fetchedData.results.metadata;
    normalizedResults = {
      results: {
        segments: segments,
        metadata: metadata || {},
        speaker_stats: fetchedData.results.speaker_stats || {}
      }
    };
  }
  // Pattern 2: results.segments (direct)
  else if (fetchedData.segments) {
    console.log('✅ Found Pattern 2: fetchedData.segments');
    segments = fetchedData.segments;
    metadata = fetchedData.metadata;
    normalizedResults = {
      results: {
        segments: segments,
        metadata: metadata || {},
        speaker_stats: fetchedData.speaker_stats || {}
      }
    };
  }
  // Pattern 3: Direct array (segments only)
  else if (Array.isArray(fetchedData)) {
    console.log('✅ Found Pattern 3: Direct array');
    segments = fetchedData;
    normalizedResults = {
      results: {
        segments: segments,
        metadata: {},
        speaker_stats: {}
      }
    };
  }
  // Pattern 4: Nested in result property
  else if (fetchedData.result?.segments) {
    console.log('✅ Found Pattern 4: fetchedData.result.segments');
    segments = fetchedData.result.segments;
    metadata = fetchedData.result.metadata;
    normalizedResults = {
      results: {
        segments: segments,
        metadata: metadata || {},
        speaker_stats: fetchedData.result.speaker_stats || {}
      }
    };
  }
  // Pattern 5: Check for any property containing segments
  else {
    for (const key in fetchedData) {
      if (fetchedData[key]?.segments && Array.isArray(fetchedData[key].segments)) {
        console.log(`✅ Found Pattern 5: fetchedData.${key}.segments`);
        segments = fetchedData[key].segments;
        metadata = fetchedData[key].metadata;
        normalizedResults = {
          results: {
            segments: segments,
            metadata: metadata || {},
            speaker_stats: fetchedData[key].speaker_stats || {}
          }
        };
        break;
      }
    }
  }

  if (segments && Array.isArray(segments) && segments.length > 0) {
    console.log(`✅ VALID: Found ${segments.length} segments`);
    console.log('🎯 Sample segment:', segments[0]);
    console.log('✅ Normalized results:', normalizedResults);
    return normalizedResults;
  } else {
    console.log('❌ INVALID: No valid segments found');
    console.log('🔍 Searched patterns:');
    console.log('  - fetchedData.results?.segments:', !!fetchedData.results?.segments);
    console.log('  - fetchedData.segments:', !!fetchedData.segments);
    console.log('  - Array.isArray(fetchedData):', Array.isArray(fetchedData));
    console.log('  - fetchedData.result?.segments:', !!fetchedData.result?.segments);
    return null;
  }
};

// ✅ FIXED: Main Component with Enhanced Results Validation
const TranscriptionPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isConnected, updateSession } = useBackend();
  
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
  const hasShownCompletionToast = useRef(false); // ✅ CRITICAL FIX: Prevent multiple completion toasts

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
      
      // Reset completion toast flag for new sessions
      hasShownCompletionToast.current = false;
      
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

  // ✅ CRITICAL FIX: Start polling with better session validation and stop conditions
  useEffect(() => {
    const sessionToUse = currentSessionId;
    
    // ✅ ENHANCED: Check if we have valid results with the new validation function
    const hasValidResults = results && validateAndNormalizeResults(results);
    
    // Don't start polling if:
    // 1. No session ID
    // 2. Already completed (and we have valid results) ✅ CRITICAL: This prevents infinite polling
    // 3. It's a temporary session ID
    // 4. Already polling
    if (!sessionToUse || 
        (processingStatus?.status === 'completed' && hasValidResults) ||
        sessionToUse.startsWith('temp_') ||
        statusPollingRef.current) {
      
      if (processingStatus?.status === 'completed' && hasValidResults) {
        console.log('✅ Session already completed with valid results - skipping polling');
      }
      return;
    }

    console.log('🔄 Starting status polling for session:', sessionToUse);
    startStatusPolling(sessionToUse);
  }, [currentSessionId, processingStatus?.status, results]);

  // ✅ CRITICAL FIX: Polling with comprehensive results validation
  const startStatusPolling = useCallback((sessionId) => {
    if (statusPollingRef.current) {
      clearInterval(statusPollingRef.current);
    }

    console.log('🔄 Starting status polling for:', sessionId);
    let consecutiveErrors = 0;
    const MAX_ERRORS = 3;

    statusPollingRef.current = setInterval(async () => {
      try {
        // ✅ CRITICAL: Check if we should stop polling before making request
        const currentResults = useAppStore.getState().results;
        const currentStatus = useAppStore.getState().processingStatus;
        
        // ✅ ENHANCED: Use the validation function to check results
        const hasValidResults = currentResults && validateAndNormalizeResults(currentResults);
        
        if (currentStatus?.status === 'completed' && hasValidResults) {
          console.log('🛑 Stopping polling - session already completed with valid results');
          clearInterval(statusPollingRef.current);
          statusPollingRef.current = null;
          return;
        }

        // ✅ FIXED: Use direct API call
        const response = await backendApi.get(`/api/processing-status/${sessionId}`);
        const status = response.data;
        
        // Reset error counter on successful request
        consecutiveErrors = 0;
        
        console.log('📊 Backend status:', status.status, status.progress || 'no progress');
        
        // ✅ FIXED: Use correct function name - updateSession instead of updateSessionStatus
        if (updateSession) {
          updateSession(sessionId, status);
        }

        if (status.status === 'completed') {
          console.log('✅ Backend processing completed');
          
          // ✅ CRITICAL FIX: Stop polling IMMEDIATELY to prevent infinite loop
          clearInterval(statusPollingRef.current);
          statusPollingRef.current = null;
          
          // Set completion status
          const currentStatus = useAppStore.getState().processingStatus;
          const finalProgress = Math.max(100, currentStatus?.progress || 0);
          
          setProcessingStatus({
            status: 'completed',
            progress: finalProgress,
            message: 'Processing completed successfully!',
            sessionId: sessionId
          });
          
          // ✅ ENHANCED: Fetch results with comprehensive validation
          try {
            const resultsResponse = await backendApi.get(`/api/results/${sessionId}`);
            console.log('📦 Fetched results:', resultsResponse.data);
            
            // ✅ CRITICAL: Use the validation function to normalize results
            const normalizedResults = validateAndNormalizeResults(resultsResponse.data);
            
            if (normalizedResults) {
              setResults(normalizedResults);
              console.log('✅ Results set successfully with normalized structure');
              
              // ✅ FIXED: Only show toast once per session
              if (!hasShownCompletionToast.current) {
                toast.success('Transcription completed!');
                hasShownCompletionToast.current = true;
              }
            } else {
              console.error('❌ Could not validate or normalize results structure');
              toast.error('Results received but data structure is invalid');
            }
          } catch (resultError) {
            console.error('Failed to fetch results:', resultError);
            toast.error('Processing completed but failed to fetch results');
          }
          
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
          toast.error('Processing failed');
          
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
    }, 3000); // Poll every 3 seconds
  }, [setProcessingStatus, setResults, updateSession]);

  // ✅ Handle session reset
  const handleReset = useCallback(() => {
    if (statusPollingRef.current) {
      clearInterval(statusPollingRef.current);
      statusPollingRef.current = null;
    }
    // Reset completion toast flag
    hasShownCompletionToast.current = false;
    // Clear all session state
    setCurrentSessionId(null);
    setProcessingStatus(null);
    setResults(null);
    navigate('/');
  }, [navigate, setCurrentSessionId, setProcessingStatus, setResults]);

  // ✅ CRITICAL FIX: Cleanup on unmount
  useEffect(() => {
    return () => {
      if (statusPollingRef.current) {
        console.log('🧹 Cleaning up status polling on unmount');
        clearInterval(statusPollingRef.current);
        statusPollingRef.current = null;
      }
    };
  }, []);

  // ✅ FIXED: hasSession logic - should be true when we have a session, false when we don't
  const hasSession = Boolean(currentSessionId);

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

        {/* Component 2: Processing Status and Stats - ✅ FIXED: Hide progress when completed with results */}
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