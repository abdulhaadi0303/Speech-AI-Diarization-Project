// ProcessingStatusSection.jsx - Fixed for Multiple Progress Instance Prevention
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

// ✅ FIXED: Global progress tracking to prevent multiple instances
let globalProgressInterval = null;
let globalProgressActive = false;

// ✅ ENHANCED: ProcessingStatus with Global Progress Management
const ProcessingStatus = ({ status, onReset }) => {
  const processingStartTimeRef = useRef(null);
  const estimatedDurationRef = useRef(20);
  const componentMountedRef = useRef(true);

  // ✅ FIXED: Single global progress estimation function
  const startGlobalProgressEstimation = useCallback(() => {
    if (globalProgressActive || globalProgressInterval) {
      console.log('⚠️ Global progress already active, skipping...');
      return;
    }

    if (!status || status.status === 'completed' || status.status === 'failed') {
      console.log('⚠️ No valid processing status, skipping progress...');
      return;
    }

    // Calculate estimated duration
    if (status?.fileInfo?.size) {
      const fileSizeMB = status.fileInfo.size / (1024 * 1024);
      estimatedDurationRef.current = Math.max(10, Math.round(fileSizeMB * 2));
      console.log(`📁 File: ${status.fileInfo.name} (${fileSizeMB.toFixed(1)}MB)`);
      console.log(`⏱️ Estimated duration: ${estimatedDurationRef.current}s`);
    } else {
      estimatedDurationRef.current = 25;
      console.log('⚠️ No file info, using 25s default');
    }

    processingStartTimeRef.current = Date.now();
    globalProgressActive = true;

    console.log('🎯 Starting GLOBAL progress estimation');

    globalProgressInterval = setInterval(() => {
      if (!componentMountedRef.current) {
        console.log('📴 Component unmounted, stopping global progress');
        stopGlobalProgressEstimation();
        return;
      }

      const currentStatus = useAppStore.getState().processingStatus;
      
      if (!currentStatus || currentStatus.status === 'completed' || currentStatus.status === 'failed') {
        console.log('🏁 Processing completed/failed, stopping global progress');
        stopGlobalProgressEstimation();
        return;
      }

      if (currentStatus.progress >= 90) {
        // Don't increment beyond 90% until backend confirms completion
        return;
      }

      const now = Date.now();
      const elapsed = (now - processingStartTimeRef.current) / 1000;
      const estimatedDuration = estimatedDurationRef.current;
      
      const progressRatio = elapsed / estimatedDuration;
      const targetProgress = Math.min(5 + (progressRatio * 85), 90);
      
      const currentProgress = currentStatus.progress || 5;
      
      if (currentProgress < targetProgress) {
        const increment = Math.max(0.2, (targetProgress - currentProgress) * 0.05);
        const newProgress = Math.min(currentProgress + increment, 90);
        
        let message = 'Processing audio...';
        if (newProgress < 15) message = 'Initializing audio processing...';
        else if (newProgress < 30) message = 'Loading and analyzing audio file...';
        else if (newProgress < 50) message = 'Speech recognition in progress...';
        else if (newProgress < 70) message = 'Speaker diarization in progress...';
        else if (newProgress < 85) message = 'Finalizing AI processing...';
        else message = 'Almost complete...';
        
        useAppStore.getState().setProcessingStatus({
          ...currentStatus,
          progress: Math.round(newProgress * 10) / 10,
          message: message,
          status: 'processing'
        });
        
        // Log progress milestones
        if (Math.floor(newProgress) % 20 === 0 && Math.floor(newProgress) !== Math.floor(currentProgress)) {
          console.log(`📈 Global Progress: ${Math.floor(newProgress)}% (${elapsed.toFixed(1)}s)`);
        }
      }
    }, 200);
  }, [status]);

  // ✅ FIXED: Stop global progress estimation
  const stopGlobalProgressEstimation = () => {
    if (globalProgressInterval) {
      clearInterval(globalProgressInterval);
      globalProgressInterval = null;
    }
    globalProgressActive = false;
    console.log('🛑 Global progress estimation stopped');
  };

  // ✅ FIXED: Start progress when component mounts with processing status
  useEffect(() => {
    componentMountedRef.current = true;
    
    if (status && status.status === 'processing' && !globalProgressActive) {
      // Small delay to ensure state is settled
      const timer = setTimeout(() => {
        if (componentMountedRef.current) {
          startGlobalProgressEstimation();
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [status?.status, startGlobalProgressEstimation]);

  // ✅ FIXED: Cleanup on unmount
  useEffect(() => {
    return () => {
      componentMountedRef.current = false;
      // Only stop if this was the component that started it
      if (globalProgressActive && status?.status === 'processing') {
        stopGlobalProgressEstimation();
      }
    };
  }, []);

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
            {(!status || status?.status === 'processing') && 'Processing Audio...'}
            {status?.status === 'completed' && 'Processing Complete!'}
            {status?.status === 'failed' && 'Processing Failed'}
          </h3>
          <p className="text-gray-600">
            {(!status || status?.status === 'processing') && (status?.message || 'Your audio is being analyzed and transcribed...')}
            {status?.status === 'completed' && 'Your results are ready to view!'}
            {status?.status === 'failed' && (status?.message || 'Something went wrong during processing.')}
          </p>
        </div>
      </div>

      {/* ✅ FIXED: Show progress bar for processing status only */}
      {(!status || status?.status === 'processing') && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Progress</span>
            <span className="font-medium text-gray-900">{Math.round(status?.progress || 5)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-cyan-400 to-cyan-500 h-3 rounded-full transition-all duration-500 ease-out relative"
              style={{ width: `${Math.max(5, Math.min(100, status?.progress || 5))}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
            </div>
          </div>
          
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span className={(status?.progress || 5) >= 10 ? 'text-cyan-600 font-medium' : ''}>Upload</span>
            <span className={(status?.progress || 5) >= 30 ? 'text-cyan-600 font-medium' : ''}>Analysis</span>
            <span className={(status?.progress || 5) >= 60 ? 'text-cyan-600 font-medium' : ''}>Diarization</span>
            <span className={(status?.progress || 5) >= 90 ? 'text-cyan-600 font-medium' : ''}>Complete</span>
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

// Main ProcessingStatusSection Component
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
      {/* ✅ FIXED: Show processing status when needed */}
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