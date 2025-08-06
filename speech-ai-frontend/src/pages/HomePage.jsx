import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useBackend } from '../contexts/BackendContext';
import { backendApi } from '../services/api';
import useAppStore from '../stores/appStore';
import toast from 'react-hot-toast';

// Import all the extracted components
import ConnectionStatusCard from '../Components/home/ConnectionStatusCard';
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

  const processingSessions = getProcessingSessions();

  // Handle file upload
  const handleFileUpload = useCallback((file) => {
    setSelectedFile(file);
  }, [setSelectedFile]);

  // Handle start processing
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

      const response = await backendApi.uploadAudio(formData);
      const sessionData = response.data;
      const sessionId = sessionData.session_id;
      
      setCurrentSession(sessionId);
      
      addSession(sessionId, {
        status: 'processing',
        progress: 0,
        structures: enabledStructures,
        parameters: enabledParameters,
        filename: selectedFile.name,
        startTime: new Date()
      });

      registerNavigationCallback(sessionId, (completedSessionId) => {
        navigate('/results', { 
          state: { 
            sessionId: completedSessionId,
            structures: enabledStructures,
            parameters: enabledParameters 
          } 
        });
      });

      toast.success('Processing started! You can navigate away - we\'ll notify you when complete.', { 
        id: 'upload',
        duration: 5000 
      });
      
      setIsProcessing(false);
      
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.userMessage || 'Upload failed', { id: 'upload' });
      setIsProcessing(false);
    }
  }, [selectedFile, isConnected, language, speakers, structures, parameters, addSession, registerNavigationCallback, navigate, setIsProcessing, setCurrentSession]);

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

  // Show connection status card if not connected
  if (!isConnected) {
    return <ConnectionStatusCard isConnected={isConnected} />;
  }

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