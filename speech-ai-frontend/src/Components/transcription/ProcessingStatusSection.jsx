// src/Components/transcription/ProcessingStatusSection.jsx - Enhanced ProcessingStatus Sub-Component
import React, { useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Users, 
  FileAudio, 
  Globe 
} from 'lucide-react';
import useAppStore from '../../stores/appStore';

// ✅ ENHANCED: ProcessingStatus Sub-Component with File Size Based Progress
const ProcessingStatus = ({ status, onReset }) => {
  const smoothProgressRef = useRef(null);
  const processingStartTimeRef = useRef(null);
  const estimatedDurationRef = useRef(20); // Default 20 seconds
  const hasStartedProgressRef = useRef(false);

  // ✅ FIXED: Start file-size-based progress estimation
  const startFileSizeBasedProgress = useCallback(() => {
    if (smoothProgressRef.current || hasStartedProgressRef.current) {
      console.log('⚠️ Progress estimation already started, skipping...');
      return; // Already started
    }

    // Calculate estimated duration from file info
    if (status?.fileInfo?.size) {
      const fileSizeMB = status.fileInfo.size / (1024 * 1024);
      estimatedDurationRef.current = Math.max(5, Math.round(fileSizeMB * 1.5)); // 1.5 seconds per MB, min 5 seconds
      
      console.log(`📁 File: ${status.fileInfo.name}`);
      console.log(`📊 Size: ${fileSizeMB.toFixed(1)}MB`);
      console.log(`⏱️ Estimated duration: ${estimatedDurationRef.current}s`);
    } else {
      console.log('⚠️ No file info available, using default duration');
    }

    processingStartTimeRef.current = Date.now();
    hasStartedProgressRef.current = true;

    console.log('🎯 Starting file-size-based progress estimation (1.5 sec/MB)');

    smoothProgressRef.current = setInterval(() => {
      const currentStatus = useAppStore.getState().processingStatus;
      
      if (currentStatus?.status === 'processing' && currentStatus.progress < 90) {
        const now = Date.now();
        const elapsed = (now - processingStartTimeRef.current) / 1000; // seconds
        const estimatedDuration = estimatedDurationRef.current;
        
        // Calculate target progress based on elapsed time
        const progressRatio = elapsed / estimatedDuration;
        const targetProgress = Math.min(5 + (progressRatio * 85), 90); // 5% to 90%
        
        const currentProgress = currentStatus.progress || 5;
        
        // Smooth increment towards target
        if (currentProgress < targetProgress) {
          const increment = Math.max(0.2, (targetProgress - currentProgress) * 0.05); // Faster increment
          const newProgress = Math.min(currentProgress + increment, 90);
          
          // ✅ Dynamic messages based on progress
          let message = 'Processing audio...';
          if (newProgress < 20) message = 'Starting audio processing...';
          else if (newProgress < 40) message = 'Loading and analyzing audio file...';
          else if (newProgress < 60) message = 'Speech recognition in progress...';
          else if (newProgress < 80) message = 'Speaker diarization in progress...';
          else if (newProgress < 90) message = 'Finalizing AI processing...';
          
          useAppStore.getState().setProcessingStatus({
            ...currentStatus,
            progress: Math.round(newProgress * 10) / 10, // Round to 1 decimal place
            message: message
          });
          
          // ✅ Log progress updates
          if (Math.floor(newProgress) % 10 === 0 && Math.floor(newProgress) !== Math.floor(currentProgress)) {
            console.log(`📈 Progress: ${Math.floor(newProgress)}% (${elapsed.toFixed(1)}s elapsed)`);
          }
        }
      } else if (currentStatus?.status === 'completed') {
        // ✅ Stop progress estimation on completion
        console.log('✅ Stopping progress estimation - processing completed');
        if (smoothProgressRef.current) {
          clearInterval(smoothProgressRef.current);
          smoothProgressRef.current = null;
        }
      }
    }, 200); // Update every 200ms for smoother animation
  }, [status?.fileInfo]);

  // ✅ FIXED: Start progress estimation when processing begins
  useEffect(() => {
    if (status?.status === 'processing' && status?.fileInfo && !hasStartedProgressRef.current) {
      console.log('🚀 Starting progress estimation with file info:', status.fileInfo);
      startFileSizeBasedProgress();
    }
    
    // ✅ Cleanup when component unmounts or status changes
    return () => {
      if (smoothProgressRef.current) {
        clearInterval(smoothProgressRef.current);
        smoothProgressRef.current = null;
        hasStartedProgressRef.current = false; // Reset for next session
      }
    };
  }, [status?.status, status?.fileInfo, startFileSizeBasedProgress]);

  const getStatusIcon = () => {
    switch (status?.status) {
      case 'processing':
        return <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-8 h-8 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-8 h-8 text-red-500" />;
      default:
        return <Clock className="w-8 h-8 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (status?.status) {
      case 'processing':
        return 'border-cyan-400';
      case 'completed':
        return 'border-green-500';
      case 'failed':
        return 'border-red-500';
      default:
        return 'border-gray-400';
    }
  };

  return (
    <div className={`bg-gray-100 rounded-2xl p-6 border-l-4 ${getStatusColor()} mb-6`}>
      <div className="flex items-center space-x-3 mb-4">
        {getStatusIcon()}
        <div>
          <h3 className="text-xl font-semibold text-gray-900">
            {status?.status === 'processing' && 'Processing Audio...'}
            {status?.status === 'completed' && 'Processing Complete!'}
            {status?.status === 'failed' && 'Processing Failed'}
            {!status && 'Ready for Processing'}
          </h3>
          <p className="text-gray-600">
            {status?.status === 'processing' && (status?.message || 'Your audio is being analyzed and transcribed...')}
            {status?.status === 'completed' && 'Your results are ready to view!'}
            {status?.status === 'failed' && 'Something went wrong during processing.'}
            {!status && 'Upload an audio file and start processing to see results here.'}
          </p>
        </div>
      </div>

      {/* ✅ ENHANCED: Show progress bar during processing with smooth animations */}
      {status?.status === 'processing' && status?.progress !== undefined && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Progress</span>
            <span className="font-medium text-gray-900">{Math.round(status.progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-cyan-400 to-cyan-500 h-3 rounded-full transition-all duration-300 ease-out relative"
              style={{ width: `${Math.max(0, Math.min(100, status.progress))}%` }}
            >
              {/* ✅ Shimmer effect for active processing */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
            </div>
          </div>
          
          {/* ✅ Processing steps indicator */}
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span className={status.progress >= 10 ? 'text-cyan-600 font-medium' : ''}>Upload</span>
            <span className={status.progress >= 30 ? 'text-cyan-600 font-medium' : ''}>Analysis</span>
            <span className={status.progress >= 60 ? 'text-cyan-600 font-medium' : ''}>Diarization</span>
            <span className={status.progress >= 90 ? 'text-cyan-600 font-medium' : ''}>Complete</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Stats Summary Component (unchanged)
const StatsSummary = ({ metadata, speakerStats, hasData }) => {
  const formatTime = (seconds) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const stats = [
    {
      icon: Clock,
      label: 'Duration',
      value: hasData ? formatTime(metadata?.total_duration) : '--:--',
      color: 'bg-blue-100 text-blue-800',
      isLoading: hasData && !metadata?.total_duration
    },
    {
      icon: Users,
      label: 'Speakers',
      value: hasData ? (metadata?.num_speakers || '--') : '--',
      color: 'bg-green-100 text-green-800',
      isLoading: hasData && !metadata?.num_speakers
    },
    {
      icon: FileAudio,
      label: 'Segments',
      value: hasData ? (metadata?.num_segments || '--') : '--',
      color: 'bg-purple-100 text-purple-800',
      isLoading: hasData && !metadata?.num_segments
    },
    {
      icon: Globe,
      label: 'Language',
      value: hasData ? (metadata?.language?.toUpperCase() || 'AUTO') : 'AUTO',
      color: 'bg-orange-100 text-orange-800',
      isLoading: false
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => {
        const IconComponent = stat.icon;
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`${stat.color} rounded-xl p-4 text-center relative overflow-hidden`}
          >
            <IconComponent className="w-6 h-6 mx-auto mb-2" />
            <div className="relative">
              {stat.isLoading ? (
                <div className="flex items-center justify-center space-x-1">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-lg font-bold">--</span>
                </div>
              ) : (
                <div className="text-lg font-bold">{stat.value}</div>
              )}
            </div>
            <div className="text-sm opacity-80">{stat.label}</div>
            
            {stat.isLoading && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
};

// Main ProcessingStatusSection Component (unchanged)
const ProcessingStatusSection = ({ 
  hasSession, 
  processingStatus, 
  onReset, 
  results, 
  metadata, 
  speakerStats 
}) => {
  return (
    <div>
      {/* Processing Status - Show when there's a session and not completed */}
      {hasSession && processingStatus && processingStatus.status !== 'completed' && (
        <ProcessingStatus 
          status={processingStatus}
          onReset={onReset}
        />
      )}

      {/* Stats Summary - Always show */}
      <StatsSummary 
        metadata={metadata || {}} 
        speakerStats={speakerStats || {}}
        hasData={hasSession}
      />
    </div>
  );
};

export default ProcessingStatusSection;