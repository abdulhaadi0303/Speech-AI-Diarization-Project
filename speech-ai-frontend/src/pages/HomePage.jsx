// src/pages/HomePage.jsx - Enhanced HomePage with Background Processing
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Upload, 
  FileAudio, 
  X, 
  AlertCircle, 
  Settings,
  Loader2,
  CheckCircle,
  Volume2,
  Zap,
  Clock,
  PlayCircle
} from 'lucide-react';
import { useBackend } from '../contexts/BackendContext';
import { backendApi } from '../services/api';
import toast from 'react-hot-toast';

// Processing Status Banner Component
const ProcessingBanner = ({ processingSessions, onViewSession }) => {
  if (processingSessions.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-xl p-4 text-white"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Loader2 className="w-5 h-5 animate-spin" />
          <div>
            <h3 className="font-semibold">
              {processingSessions.length} Session{processingSessions.length > 1 ? 's' : ''} Processing
            </h3>
            <p className="text-cyan-100 text-sm">
              Processing continues in background. You'll be notified when complete.
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {processingSessions.slice(0, 2).map((session) => (
            <button
              key={session.sessionId}
              onClick={() => onViewSession(session.sessionId)}
              className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-sm transition-colors"
            >
              View {session.sessionId.slice(0, 8)}...
            </button>
          ))}
          {processingSessions.length > 2 && (
            <span className="text-cyan-100 text-sm">+{processingSessions.length - 2} more</span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Audio Upload Component (same as before but with better state management)
const AudioUploader = ({ onFileUpload, selectedFile, isProcessing, setSelectedFile }) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const SUPPORTED_FORMATS = ['.mp3', '.wav', '.mp4', '.m4a', '.flac', '.ogg'];
  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

  const validateFile = (file) => {
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!SUPPORTED_FORMATS.includes(fileExtension)) {
      return `Unsupported format. Please use: ${SUPPORTED_FORMATS.join(', ')}`;
    }
    
    if (file.size > MAX_FILE_SIZE) {
      return `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`;
    }
    
    return null;
  };

  const handleFiles = useCallback((files) => {
    const file = files[0];
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setSelectedFile(file);
    onFileUpload(file);
  }, [onFileUpload, setSelectedFile]);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleFileInput = useCallback((e) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  }, [handleFiles]);

  const handleBrowseClick = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="bg-gray-100 p-6 rounded-lg">
      <h3 className="text-cyan-400 text-lg font-semibold mb-4 flex items-center">
        <Volume2 className="w-5 h-5 mr-2" />
        Audio
      </h3>
      
      {!selectedFile ? (
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? 'border-cyan-400 bg-cyan-50'
              : error
              ? 'border-red-300 bg-red-50'
              : 'border-gray-300 hover:border-cyan-400 hover:bg-cyan-50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept={SUPPORTED_FORMATS.join(',')}
            onChange={handleFileInput}
            disabled={isProcessing}
          />

          {error ? (
            <div className="space-y-3">
              <AlertCircle className="w-12 h-12 mx-auto text-red-500" />
              <div className="text-red-600">
                <div className="font-medium">Upload Error</div>
                <div className="text-sm">{error}</div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 mb-2">
                Drop your Audio file here or{' '}
                <button
                  onClick={handleBrowseClick}
                  className="text-cyan-400 cursor-pointer hover:underline"
                  disabled={isProcessing}
                >
                  Browse
                </button>
              </p>
              <p className="text-sm text-gray-500">Supports MP3,WAV,MP4 • MAX 100MB</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-cyan-400 text-white p-4 rounded-lg text-center relative">
          <CheckCircle className="w-6 h-6 inline-block mr-2" />
          File Uploaded Successfully ({formatFileSize(selectedFile.size)})
          <button
            onClick={() => setSelectedFile(null)}
            className="absolute top-2 right-2 p-1 bg-white/20 rounded-full hover:bg-white/30"
            disabled={isProcessing}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

// Audio Visualization Component (same as before)
const AudioVisualizationSection = ({ isProcessing, language, setLanguage, speakers, setSpeakers }) => {
  const languages = [
    { code: '', name: 'Auto-Detect' },
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' }
  ];

  const speakerOptions = [
    { value: '', label: 'Auto-Detect' },
    { value: '2', label: '2 Speakers' },
    { value: '3', label: '3 Speakers' },
    { value: '4', label: '4+ Speakers' }
  ];

  return (
    <div className="bg-gray-100 p-6 rounded-lg">
      <div className="flex justify-center items-center h-32 mb-4">
        <div className="flex items-end space-x-1 h-16">
          {Array.from({ length: 50 }, (_, i) => (
            <div
              key={i}
              className={`bg-cyan-400 transition-all duration-300 ${
                isProcessing ? 'animate-pulse' : ''
              }`}
              style={{
                width: '3px',
                height: `${Math.random() * 60 + 10}px`,
                animationDelay: `${i * 50}ms`
              }}
            />
          ))}
        </div>
      </div>
      
      <div className="flex justify-between">
        <div className="flex-1 mr-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            disabled={isProcessing}
            className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400"
          >
            {languages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">Speakers</label>
          <select
            value={speakers}
            onChange={(e) => setSpeakers(e.target.value)}
            disabled={isProcessing}
            className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400"
          >
            {speakerOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

// Processing Structure Component (same as before)
const ProcessingStructureSection = ({ structures, onStructureToggle, disabled }) => {
  return (
    <div className="bg-gray-100 p-6 rounded-lg">
      <h3 className="text-cyan-400 text-lg font-semibold mb-4">Structures</h3>
      <p className="text-gray-600 mb-4">Specify the Order in which Conversation should be Processed</p>
      
      <div className="space-y-3">
        {structures.map((structure, index) => (
          <div key={index} className="flex items-center justify-between">
            <span className="text-gray-700">
              {index + 1}. {structure.name}
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={structure.enabled}
                onChange={() => onStructureToggle(index)}
                disabled={disabled}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-400 disabled:opacity-50"></div>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};

// Processing Parameters Component (same as before)
const ProcessingParametersSection = ({ parameters, onParameterToggle, onStartProcessing, canProcess, isProcessing }) => {
  return (
    <div className="bg-gray-100 p-6 rounded-lg">
      <h3 className="text-cyan-400 text-lg font-semibold mb-4">Parameters</h3>
      <p className="text-gray-600 mb-4">Specify the Order in which Conversation should be Processed</p>
      
      <div className="grid grid-cols-2 gap-3 mb-6">
        {parameters.map((param, index) => (
          <button
            key={index}
            onClick={() => onParameterToggle(index)}
            disabled={isProcessing}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
              param.enabled
                ? 'bg-cyan-400 text-white'
                : 'bg-gray-800 text-white hover:bg-gray-700'
            }`}
          >
            {param.name}
          </button>
        ))}
      </div>
      
      <button
        onClick={onStartProcessing}
        disabled={!canProcess || isProcessing}
        className={`w-full py-3 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2 ${
          canProcess && !isProcessing
            ? 'bg-cyan-400 text-white hover:bg-cyan-500'
            : 'bg-gray-400 text-gray-200 cursor-not-allowed'
        }`}
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Processing...</span>
          </>
        ) : (
          <span>Start Processing File</span>
        )}
      </button>
    </div>
  );
};

// Main HomePage Component
const HomePage = () => {
  const navigate = useNavigate();
  const { 
    isConnected, 
    addSession, 
    registerNavigationCallback, 
    getProcessingSessions 
  } = useBackend();
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentSession, setCurrentSession] = useState(null);
  
  // Settings state
  const [language, setLanguage] = useState('');
  const [speakers, setSpeakers] = useState('');
  
  const [structures, setStructures] = useState([
    { name: 'Introduction', enabled: false },
    { name: 'Biographical History', enabled: false },
    { name: 'Professional Background', enabled: true },
    { name: 'Social History', enabled: false },
    { name: 'Family History', enabled: true },
    { name: 'Medical History', enabled: true },
    { name: 'Vegetative History', enabled: true },
    { name: 'Pyschological History', enabled: false },
    { name: 'Diseases History', enabled: true }
  ]);
  
  const [parameters, setParameters] = useState([
    { name: 'Include own Statement', enabled: true },
    { name: 'Audio Enhance', enabled: true },
    { name: 'Include own Comments', enabled: true },
    { name: 'Use Indirect Speech', enabled: true },
    { name: 'Summarize Conversation', enabled: true },
    { name: 'Patient Quotes', enabled: true }
  ]);

  // Get processing sessions for banner
  const processingSessions = getProcessingSessions();

  // Handle file upload (just set the file, don't process yet)
  const handleFileUpload = useCallback((file) => {
    setSelectedFile(file);
  }, []);

  const handleStructureToggle = (index) => {
    if (isProcessing) return;
    const newStructures = [...structures];
    newStructures[index].enabled = !newStructures[index].enabled;
    setStructures(newStructures);
  };

  const handleParameterToggle = (index) => {
    if (isProcessing) return;
    const newParameters = [...parameters];
    newParameters[index].enabled = !newParameters[index].enabled;
    setParameters(newParameters);
  };

  // Start processing with background support
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
      
      // Add session with processing status
      addSession(sessionId, {
        status: 'processing',
        progress: 0,
        structures: enabledStructures,
        parameters: enabledParameters,
        filename: selectedFile.name,
        startTime: new Date()
      });

      // Register callback for auto-navigation when complete
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
      
      // Reset form
      setSelectedFile(null);
      setIsProcessing(false);
      
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.userMessage || 'Upload failed', { id: 'upload' });
      setIsProcessing(false);
    }
  }, [selectedFile, isConnected, language, speakers, structures, parameters, addSession, registerNavigationCallback, navigate]);

  // Handle viewing processing session
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

  // Connection check
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
        <div className="text-center bg-gray-800 rounded-2xl p-8 shadow-lg max-w-md border border-gray-700">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">API Offline</h2>
          <p className="text-gray-300 mb-4">
            Please ensure the backend server is running and accessible.
          </p>
          <div className="bg-gray-700 rounded-lg p-4 text-left text-sm text-gray-300">
            <div className="font-medium mb-2 text-white">To start the backend:</div>
            <code className="block bg-gray-900 p-2 rounded border border-gray-600 text-cyan-400">
              python main.py
            </code>
          </div>
        </div>
      </div>
    );
  }

  const canProcess = selectedFile && !isProcessing;

  return (
    <div className="min-h-screen bg-gray-900 overflow-auto">
      <div className="p-6 max-w-6xl mx-auto">
        {/* Processing Banner */}
        <ProcessingBanner 
          processingSessions={processingSessions}
          onViewSession={handleViewSession}
        />

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <span className="text-white text-xl mr-2">Exploration &</span>
            <span className="text-cyan-400 text-xl font-semibold">Interviews</span>
          </div>
          <h1 className="text-4xl font-light text-white mb-2">
            <span className="text-cyan-400">"</span>
            Turn Spoken Thoughts Into Smart Actions
            <span className="text-cyan-400">"</span>
          </h1>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <AudioUploader 
              onFileUpload={handleFileUpload}
              selectedFile={selectedFile}
              setSelectedFile={setSelectedFile}
              isProcessing={isProcessing}
            />
            
            <ProcessingStructureSection 
              structures={structures}
              onStructureToggle={handleStructureToggle}
              disabled={isProcessing}
            />
          </motion.div>
          
          {/* Right Column */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <AudioVisualizationSection 
              isProcessing={isProcessing}
              language={language}
              setLanguage={setLanguage}
              speakers={speakers}
              setSpeakers={setSpeakers}
            />
            
            <ProcessingParametersSection 
              parameters={parameters}
              onParameterToggle={handleParameterToggle}
              onStartProcessing={handleStartProcessing}
              canProcess={canProcess}
              isProcessing={isProcessing}
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;