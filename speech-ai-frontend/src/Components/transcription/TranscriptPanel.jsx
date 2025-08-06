// src/Components/transcription/TranscriptPanel.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle,
  Copy,
  Maximize2,
  Minimize2,
  Volume2,
  Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';

const TranscriptPanel = ({ results, isExpanded, onToggleExpand, hasSession }) => {
  const [copied, setCopied] = useState(false);
  const [selectedSpeaker, setSelectedSpeaker] = useState('all');

  const segments = results?.results?.segments || [];
  const speakerStats = results?.results?.speaker_stats || {};
  const metadata = results?.results?.metadata || {};

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getSpeakerColor = (speaker) => {
    const colors = [
      'bg-blue-100 text-blue-800 border-blue-200',
      'bg-green-100 text-green-800 border-green-200',
      'bg-purple-100 text-purple-800 border-purple-200',
      'bg-orange-100 text-orange-800 border-orange-200',
      'bg-pink-100 text-pink-800 border-pink-200',
      'bg-indigo-100 text-indigo-800 border-indigo-200'
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
  ) : getDummyTranscript();

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

  return (
    <div className="bg-gray-100 rounded-2xl p-6 pb-16 h-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Transcript</h2>
        <div className="flex items-center space-x-2">
          {(Object.keys(speakerStats).length > 0 || !hasSession) && (
            <select
              value={selectedSpeaker}
              onChange={(e) => setSelectedSpeaker(e.target.value)}
              className="px-3 py-1 bg-gray-200 border border-gray-300 rounded text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
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
          <button
            onClick={handleCopyTranscript}
            className="p-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
            title="Copy transcript"
          >
            {copied ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <Copy className="w-4 h-4 text-gray-600" />
            )}
          </button>
          <button
            onClick={onToggleExpand}
            className="p-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
            title={isExpanded ? "Minimize" : "Maximize"}
          >
            {isExpanded ? (
              <Minimize2 className="w-4 h-4 text-gray-600" />
            ) : (
              <Maximize2 className="w-4 h-4 text-gray-600" />
            )}
          </button>
        </div>
      </div>

      <div className="mb-4">
        <button className="w-full bg-cyan-400 text-black py-2 px-4 rounded-lg font-semibold hover:bg-cyan-500 transition-colors">
          {hasSession ? 'Active Transcript Here' : 'Sample Transcript (Demo)'}
        </button>
      </div>
      
      <div className={`space-y-3 overflow-y-auto pb-8 ${isExpanded ? 'max-h-screen' : 'max-h-96'}`}>
        {filteredSegments.length > 0 ? (
          filteredSegments.map((segment, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.02 }}
              className="p-3 bg-gray-200 rounded-lg hover:bg-gray-250 transition-colors"
            >
              <div className="flex space-x-3">
                <div className="flex-shrink-0">
                  <div className="text-xs font-mono text-gray-500 bg-gray-300 px-2 py-1 rounded mb-1">
                    {formatTime(segment.start)} - {formatTime(segment.end)}
                  </div>
                  <div className={`px-2 py-1 rounded-md text-xs font-medium border ${getSpeakerColor(segment.speaker)}`}>
                    {segment.speaker}
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-gray-800 leading-relaxed">{segment.text}</p>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            {hasSession ? (
              results ? (
                <>
                  <Volume2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No transcript available yet</p>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-center space-x-2">
                    <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
                    <span className="text-lg">Processing audio...</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p>🎯 Analyzing audio file</p>
                    <p>🗣️ Identifying speakers</p>
                    <p>📝 Generating transcript</p>
                  </div>
                  
                  <div className="bg-gray-200 rounded-lg p-4 mt-6">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm">Audio preprocessing complete</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Loader2 className="w-2 h-2 animate-spin text-cyan-500" />
                        <span className="text-sm">Running speech recognition...</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        <span className="text-sm text-gray-500">Speaker diarization pending</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            ) : (
              <>
                <Volume2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Start processing an audio file to see transcript results</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TranscriptPanel;