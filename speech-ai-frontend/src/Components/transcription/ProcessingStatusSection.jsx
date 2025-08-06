// src/Components/transcription/ProcessingStatusSection.jsx
import React from 'react';
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

// Processing Status Component
const ProcessingStatus = ({ status, onReset }) => {
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

      {status?.status === 'processing' && status?.progress !== undefined && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Progress</span>
            <span className="font-medium text-gray-900">{status.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-cyan-400 to-cyan-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${status.progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Stats Summary Component
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