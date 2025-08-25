import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useBackend } from '../contexts/BackendContext';
import { backendApi } from '../services/api';
import useAppStore from '../stores/appStore';
import toast from 'react-hot-toast';

// Import all the extracted components

import PageHeader from '../Components/home/PageHeader';
import ProcessingBanner from '../Components/home/ProcessingBanner';
import AudioUploader from '../Components/home/AudioUploader';
import AudioVisualizationSection from '../Components/home/AudioVisualizationSection';

const HomePage = () => {
  const navigate = useNavigate();
  const { 
    isConnected, 
    addSession, 
    registerNavigationCallback, 
    getProcessingSessions 
  } = useBackend();
  
  // Zustand store state
  const selectedFile = useAppStore((state) => state.selectedFile);
  const setSelectedFile = useAppStore((state) => state.setSelectedFile);
  const isProcessing = useAppStore((state) => state.isProcessing);
  const setIsProcessing = useAppStore((state) => state.setIsProcessing);
  const currentSession = useAppStore((state) => state.currentSession);
  const setCurrentSession = useAppStore((state) => state.setCurrentSession);
  const language = useAppStore((state) => state.language);
  const setLanguage = useAppStore((state) => state.setLanguage);
  const speakers = useAppStore((state) => state.speakers);
  const setSpeakers = useAppStore((state) => state.setSpeakers);
  const structures = useAppStore((state) => state.structures);
  const parameters = useAppStore((state) => state.parameters);
  
  // Processing state for display
  const currentSessionId = useAppStore((state) => state.currentSessionId);
  const processingStatus = useAppStore((state) => state.processingStatus);
  const setProcessingStatus = useAppStore((state) => state.setProcessingStatus);

  const processingSessions = getProcessingSessions();

  // Handle file upload
  const handleFileUpload = useCallback((file) => {
    setSelectedFile(file);
  }, [setSelectedFile]);

  // ✅ FIXED: Handle start processing with immediate redirect and progress setup
  const handleStartProcessing = useCallback(async () => {
    if (!selectedFile || !isConnected) {
      toast.error('Please select a file and ensure backend is connected');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('language', language);
      formData.append('apply_preprocessing', 'true');
      formData.append('num_speakers', speakers);
      
      const enabledStructures = structures.filter(s => s.enabled).map(s => s.name);
      const enabledParameters = parameters.filter(p => p.enabled).map(p => p.name);
      
      formData.append('structures', JSON.stringify(enabledStructures));
      formData.append('parameters', JSON.stringify(enabledParameters));

      setIsProcessing(true);
      toast.loading('Starting transcription...', { id: 'upload' });

      // ✅ NEW: Set up processing status immediately with file info
      const tempSessionId = `temp_${Date.now()}`; // Temporary ID until we get real one
      setCurrentSession(tempSessionId);
      
      // ✅ FIXED: Initialize processing status immediately with file info
      setProcessingStatus({ 
        status: 'processing', 
        progress: 5, 
        message: 'Starting audio processing...',
        fileInfo: {
          name: selectedFile.name,
          size: selectedFile.size,
          type: selectedFile.type
        }
      });

      // ✅ FIXED: Navigate immediately to results page
      navigate('/results', {
        state: {
          sessionId: tempSessionId, // Use temp ID initially
          structures: enabledStructures,
          parameters: enabledParameters,
          fromUpload: true,
          fileInfo: {
            name: selectedFile.name,
            size: selectedFile.size,
            type: selectedFile.type
          }
        }
      });

      // ✅ NEW: Start upload in background after navigation
      setTimeout(async () => {
        try {
          const response = await backendApi.uploadAudio(formData);
          const sessionData = response.data;
          const realSessionId = sessionData.session_id;
          
          // ✅ Update to real session ID
          setCurrentSession(realSessionId);
          useAppStore.getState().setCurrentSessionId(realSessionId);
          
          addSession(realSessionId, {
            status: 'processing',
            progress: 10,
            structures: enabledStructures,
            parameters: enabledParameters,
            filename: selectedFile.name,
            startTime: new Date()
          });

          registerNavigationCallback(realSessionId, (completedSessionId) => {
            // Already on results page, no need to navigate
            console.log('Processing completed for session:', completedSessionId);
          });

          toast.success('Upload successful! Processing in progress...', { 
            id: 'upload',
            duration: 3000 
          });
          
        } catch (error) {
          console.error('Upload error:', error);
          toast.error(error.userMessage || 'Upload failed', { id: 'upload' });
          
          // ✅ Update status to failed
          setProcessingStatus({
            status: 'failed',
            message: error.userMessage || 'Upload failed'
          });
        } finally {
          setIsProcessing(false);
        }
      }, 100); // Small delay to ensure navigation completes first
      
    } catch (error) {
      console.error('Processing start error:', error);
      toast.error('Failed to start processing', { id: 'upload' });
      setIsProcessing(false);
    }
  }, [selectedFile, isConnected, language, speakers, structures, parameters, addSession, registerNavigationCallback, navigate, setIsProcessing, setCurrentSession, setProcessingStatus]);

  // Handle view session
  const handleViewSession = useCallback((sessionId) => {
    const sessionData = processingSessions.find(s => s.sessionId === sessionId);
    if (sessionData) {
      navigate('/results', { 
        state: { 
          sessionId,
          structures: sessionData.structures,
          parameters: sessionData.parameters 
        } 
      });
    }
  }, [processingSessions, navigate]);

  // Determine if processing is possible
  const canProcess = selectedFile && !isProcessing;

  return (
    <div className="min-h-screen bg-gray-900 overflow-auto">
      <div className="p-6 max-w-5xl mx-auto"> {/* Made wider: max-w-4xl -> max-w-5xl */}
        
        {/* Page Header with Title */}
        <PageHeader />

        {/* Processing Banner - Shows active sessions */}
        <ProcessingBanner 
          processingSessions={processingSessions}
          onViewSession={handleViewSession}
        />

        {/* Main Content */}
        <div className="max-w-3xl mx-auto space-y-6"> {/* Made wider: max-w-2xl -> max-w-3xl */}
          
          {/* Audio Uploader Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <AudioUploader 
              onFileUpload={handleFileUpload}
              selectedFile={selectedFile}
              isProcessing={isProcessing}
              currentSessionId={currentSessionId}
              processingStatus={processingStatus}
            />
          </motion.div>
          
          {/* Processing Settings Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <AudioVisualizationSection 
              isProcessing={isProcessing}
              language={language}
              setLanguage={setLanguage}
              speakers={speakers}
              setSpeakers={setSpeakers}
              handleStartProcessing={handleStartProcessing}
              canProcess={canProcess}
            />
          </motion.div>
          
        </div>
      </div>
    </div>
  );
};

export default HomePage;
