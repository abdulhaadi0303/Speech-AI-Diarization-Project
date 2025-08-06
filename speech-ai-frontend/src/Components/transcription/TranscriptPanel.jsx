// src/Components/transcription/TranscriptPanel.jsx - Updated with Live Editor Integration
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle,
  Copy,
  Volume2,
  Loader2,
  Edit3,
  Eye,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import LiveTranscriptEditor from './LiveTranscriptEditor';

const TranscriptPanel = ({ results, hasSession }) => {
  const [copied, setCopied] = useState(false);
  const [selectedSpeaker, setSelectedSpeaker] = useState('all');
  const [viewMode, setViewMode] = useState('editor'); // 'editor' or 'original'

  const segments = results?.results?.segments || [];
  const speakerStats = results?.results?.speaker_stats || {};

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getSpeakerColor = (speaker) => {
    const colors = [
      'bg-blue-50 text-blue-700 border-blue-200',
      'bg-green-50 text-green-700 border-green-200',
      'bg-purple-50 text-purple-700 border-purple-200',
      'bg-orange-50 text-orange-700 border-orange-200',
      'bg-pink-50 text-pink-700 border-pink-200',
      'bg-indigo-50 text-indigo-700 border-indigo-200'
    ];
    const speakers = Object.keys(speakerStats);
    const index = speakers.indexOf(speaker);
    return colors[index % colors.length] || colors[0];
  };

  const getDummyTranscript = () => [
    {
      start: 0,
      end: 15,
      speaker: 'SPEAKER_00',
      text: 'Good morning! Thank you for joining us today. I\'d like to start by getting some background information about yourself.'
    },
    {
      start: 16,
      end: 45,
      speaker: 'SPEAKER_01',
      text: 'Thank you for having me. I\'m excited to share my experiences and discuss the topics we have planned for today\'s session.'
    },
    {
      start: 46,
      end: 75,
      speaker: 'SPEAKER_00',
      text: 'Excellent. Let\'s begin with your professional background. Can you tell me about your current role and how you arrived at this position?'
    },
    {
      start: 76,
      end: 120,
      speaker: 'SPEAKER_01',
      text: 'I currently work as a senior analyst at a technology consulting firm. My journey here has been quite interesting - I started in finance, then transitioned to technology, and eventually found my passion in the intersection of business and data analytics.'
    },
    {
      start: 121,
      end: 150,
      speaker: 'SPEAKER_00',
      text: 'That\'s a fascinating career path. What motivated you to make that transition from finance to technology?'
    },
    {
      start: 151,
      end: 200,
      speaker: 'SPEAKER_01',
      text: 'The main driver was seeing how technology was transforming business operations. I realized that understanding both the financial and technical aspects would give me a unique perspective that could add significant value to organizations.'
    }
  ];

  const filteredSegments = hasSession ? (
    selectedSpeaker === 'all' ? segments : segments.filter(seg => seg.speaker === selectedSpeaker)
  ) : (
    selectedSpeaker === 'all' ? getDummyTranscript() : getDummyTranscript().filter(seg => seg.speaker === selectedSpeaker)
  );

  const handleCopyTranscript = async () => {
    try {
      const transcriptText = filteredSegments.length > 0 
        ? filteredSegments.map(segment => 
            `[${formatTime(segment.start)} - ${formatTime(segment.end)}] ${segment.speaker}: ${segment.text}`
          ).join('\n\n')
        : 'Transcript is being processed...';
      
      await navigator.clipboard.writeText(transcriptText);
      setCopied(true);
      toast.success('Transcript copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy transcript');
    }
  };

  // ✅ Main render - Live Editor by default, with toggle to original view
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 pb-16 h-full flex flex-col">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100 flex-shrink-0">
        <h2 className="text-2xl font-bold text-gray-900">Transcript</h2>
        
        <div className="flex items-center space-x-3">
          {/* View Mode Toggle */}
          <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('editor')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'editor'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Edit3 className="w-4 h-4 inline mr-1" />
              Live Editor
            </button>
            <button
              onClick={() => setViewMode('original')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'original'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Eye className="w-4 h-4 inline mr-1" />
              Original View
            </button>
          </div>

          {/* Speaker Filter - Only for original view */}
          {viewMode === 'original' && (Object.keys(speakerStats).length > 0 || !hasSession) && (
            <select
              value={selectedSpeaker}
              onChange={(e) => setSelectedSpeaker(e.target.value)}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 shadow-sm"
            >
              <option value="all">All Speakers</option>
              {hasSession ? (
                Object.keys(speakerStats).map(speaker => (
                  <option key={speaker} value={speaker}>{speaker}</option>
                ))
              ) : (
                <>
                  <option value="SPEAKER_00">SPEAKER_00</option>
                  <option value="SPEAKER_01">SPEAKER_01</option>
                </>
              )}
            </select>
          )}

          {/* Copy button - Only for original view */}
          {viewMode === 'original' && (
            <button
              onClick={handleCopyTranscript}
              className="p-2.5 bg-gray-50 hover:bg-gray-100 rounded-lg transition-all duration-200 hover:shadow-sm border border-gray-200"
              title="Copy transcript"
            >
              {copied ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4 text-gray-600" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* ✅ Conditional Rendering: Live Editor or Original View */}
      {viewMode === 'editor' ? (
        // Live Editor Mode
        <div className="flex-1 overflow-hidden">
          <LiveTranscriptEditor 
            results={results}
            hasSession={hasSession}
          />
        </div>
      ) : (
        // Original Static View Mode
        <>
          {/* Status Button */}
          <div className="mb-6 flex-shrink-0">
            <div className="w-full bg-gradient-to-r from-cyan-400 to-cyan-500 text-white py-3 px-4 rounded-xl font-semibold text-center shadow-sm">
              {hasSession ? 'Active Transcript Here' : 'Sample Transcript (Demo)'}
            </div>
          </div>
          
          {/* Transcript Content - Full Height by Default */}
          <div className="space-y-4 overflow-y-auto pb-8 flex-1">
            {filteredSegments.length > 0 ? (
              filteredSegments.map((segment, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02, duration: 0.3 }}
                  className="bg-gray-50 rounded-xl p-5 hover:bg-gray-100 transition-all duration-200 border border-gray-100 hover:shadow-sm w-full"
                >
                  {/* Speaker Info Header - Stacked Layout */}
                  <div className="mb-4 w-full">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-2 ${getSpeakerColor(segment.speaker)}`}>
                        {segment.speaker}
                      </div>
                      <div className="text-xs font-mono text-gray-500 bg-gray-200 px-3 py-1.5 rounded-lg">
                        {formatTime(segment.start)} - {formatTime(segment.end)}
                      </div>
                    </div>
                    
                    {/* Full Width Text Content - No Flex Constraints */}
                    <div className="w-full block">
                      <p className="text-gray-800 leading-relaxed text-base font-medium break-words">
                        {segment.text}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-12 text-gray-500">
                {hasSession ? (
                  results ? (
                    <div className="space-y-4">
                      <Volume2 className="w-16 h-16 mx-auto mb-4 opacity-40" />
                      <h3 className="text-lg font-medium text-gray-600">No transcript available yet</h3>
                      <p className="text-sm text-gray-500">Transcript will appear here once processing is complete</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="flex items-center justify-center space-x-3">
                        <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
                        <span className="text-xl font-medium text-gray-700">Processing audio...</span>
                      </div>
                      
                      <div className="space-y-3 text-sm text-gray-600">
                        <p className="flex items-center justify-center space-x-2">
                          <span>🎯</span> <span>Analyzing audio file</span>
                        </p>
                        <p className="flex items-center justify-center space-x-2">
                          <span>🗣️</span> <span>Identifying speakers</span>
                        </p>
                        <p className="flex items-center justify-center space-x-2">
                          <span>📝</span> <span>Generating transcript</span>
                        </p>
                      </div>
                      
                      <div className="bg-gray-50 rounded-xl p-6 mt-8 border border-gray-200 max-w-md mx-auto">
                        <h4 className="font-medium text-gray-700 mb-4">Processing Status</h4>
                        <div className="space-y-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <span className="text-sm text-gray-600">Audio preprocessing complete</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <Loader2 className="w-3 h-3 animate-spin text-cyan-500" />
                            <span className="text-sm text-gray-600">Running speech recognition...</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                            <span className="text-sm text-gray-400">Speaker diarization pending</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="space-y-4">
                    <Volume2 className="w-16 h-16 mx-auto mb-4 opacity-40" />
                    <h3 className="text-lg font-medium text-gray-600">Ready for audio processing</h3>
                    <p className="text-sm text-gray-500">Start processing an audio file to see transcript results</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default TranscriptPanel;