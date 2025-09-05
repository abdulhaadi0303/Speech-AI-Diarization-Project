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

  // Updated: Handle start processing with queue session management
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
  
      // ✅ FIXED: Wait for backend response first, then navigate
      const response = await backendApi.uploadAudio(formData);
      const uploadResult = response.data;
      const realSessionId = uploadResult.session_id;
  
      // ✅ Set up processing status with real session ID
      setCurrentSession(realSessionId);
      useAppStore.getState().setCurrentSessionId(realSessionId);
  
      // ✅ Initialize queue session with real session ID
      const { setCurrentQueueSession } = useAppStore.getState();
      setCurrentQueueSession({
        sessionId: realSessionId, // Real session ID from start
        fileName: selectedFile.name,
        status: uploadResult.status, // 'queued' or 'processing'
        queuePosition: uploadResult.queue_position || 0,
        message: uploadResult.message || 'Processing started'
      });
      
      // ✅ Initialize processing status with real session ID
      setProcessingStatus({ 
        status: uploadResult.status || 'processing', 
        progress: 10, 
        message: uploadResult.message || 'Processing started...',
        sessionId: realSessionId, // Track session ID
        fileInfo: {
          name: selectedFile.name,
          size: selectedFile.size,
          type: selectedFile.type
        }
      });
  
      // ✅ Add session to backend context
      addSession(realSessionId, {
        status: uploadResult.status || 'processing',
        progress: 10,
        structures: enabledStructures,
        parameters: enabledParameters,
        filename: selectedFile.name,
        startTime: new Date()
      });
  
      // ✅ Register navigation callback
      registerNavigationCallback(realSessionId, (completedSessionId) => {
        console.log('Processing completed for session:', completedSessionId);
      });
  
      // ✅ Navigate AFTER getting real session ID
      navigate('/results', {
        state: {
          sessionId: realSessionId, // Real session ID from start
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
  
      toast.success('Upload successful! Processing in progress...', { 
        id: 'upload',
        duration: 3000 
      });
  
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.userMessage || 'Upload failed', { id: 'upload' });
      
      // ✅ Handle error without temp session
      setProcessingStatus({
        status: 'failed',
        message: error.userMessage || 'Upload failed'
      });
  
    } finally {
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
    <div className="min-h-screen bg-gradient-to-br from-psycon-light-teal/20 via-white to-psycon-lavender/30 overflow-auto">
      <div className="p-6 max-w-5xl mx-auto">
        
        {/* Page Header with Title */}
        <PageHeader />
  
        {/* Processing Banner - Shows active sessions */}
        <ProcessingBanner 
          processingSessions={processingSessions}
          onViewSession={handleViewSession}
        />
  
        {/* Main Content */}
        <div className="max-w-3xl mx-auto space-y-6">

          
          {/* Audio Uploader Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-psycon-mint/30 p-6 text-gray-800"
          >
            <div className="mb-4">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Audio Upload</h2>
              <p className="text-gray-600">Upload your audio file to begin analysis</p>
            </div>
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
            className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-psycon-purple/30 p-6 text-gray-800"
          >
            <div className="mb-4">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Processing Settings</h2>
              <p className="text-gray-600">Configure language and speaker detection</p>
            </div>
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
