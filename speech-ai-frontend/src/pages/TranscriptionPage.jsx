// src/pages/TranscriptionPage.jsx - Clean Results Page with Processing Status
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
import toast from 'react-hot-toast';

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
    <div className={`bg-gray-100 rounded-2xl p-6 border-l-4 ${getStatusColor()}`}>
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
      isLoading: false // Language can show AUTO initially
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
            
            {/* Loading overlay */}
            {stat.isLoading && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
};

// Formatted Text Panel Component (Left Side)
const FormattedTextPanel = ({ results, structures, isExpanded, onToggleExpand, hasSession }) => {
  const [selectedSection, setSelectedSection] = useState('introduction');
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      const content = results ? (results?.summary || results?.analysis || 'Processing in progress...') : getDummyContent();
      await navigator.clipboard.writeText(content);
      setCopied(true);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy text');
    }
  };

  const getDummyContent = () => {
    const dummyContents = {
      introduction: `**Introduction**

This section contains the opening remarks and context-setting information from the conversation. The participant introduced themselves and provided initial background about the purpose of this session.

Key points covered:
• Session objectives and expectations
• Participant background overview
• Initial rapport building
• Context establishment

The conversation began with standard introductory protocols and moved into more substantive discussion areas.`,

      biographic: `**Biographical History**

This section captures personal background information and life history details shared during the conversation.

**Early Life**
• Birth and family background
• Childhood experiences and formative years
• Educational journey and milestones

**Career Development**
• Professional path and key transitions
• Notable achievements and challenges
• Current role and responsibilities

**Personal Milestones**
• Significant life events
• Relationships and family formation
• Geographic movements and relocations`,

      professional: `**Professional Background**

Detailed information about the participant's career trajectory and professional experiences.

**Current Position**
• Role and responsibilities
• Organization and industry context
• Team and reporting structure

**Career Progression**
• Previous positions and transitions
• Skills development and expertise
• Professional achievements and recognition

**Work Philosophy**
• Approach to challenges
• Leadership style and principles
• Future career aspirations`,

      social: `**Social History**

Information about social connections, community involvement, and interpersonal relationships.

**Social Networks**
• Family relationships and dynamics
• Friend circles and social connections
• Community involvement and activities

**Cultural Background**
• Cultural identity and heritage
• Language preferences and abilities
• Traditional practices and values

**Social Activities**
• Hobbies and recreational interests
• Volunteer work and community service
• Social groups and memberships`,

      family: `**Family History**

Comprehensive family background and relationship information.

**Immediate Family**
• Spouse/partner and relationship details
• Children and their current status
• Living arrangements and household composition

**Extended Family**
• Parents and siblings
• Extended family relationships
• Family traditions and connections

**Family Health History**
• Genetic predispositions
• Family medical conditions
• Health patterns and concerns`,

      medical: `**Medical History**

Health-related information and medical background details.

**Current Health Status**
• Present health conditions
• Current medications and treatments
• Recent medical consultations

**Medical History**
• Past illnesses and conditions
• Surgical procedures and hospitalizations
• Chronic conditions and management

**Health Maintenance**
• Preventive care practices
• Regular check-ups and screenings
• Health and wellness routines`,

      educational: `**Educational History**

Academic background and learning experiences.

**Formal Education**
• Primary and secondary education
• Higher education and degrees
• Specialized training and certifications

**Continuing Education**
• Professional development courses
• Skills training and workshops
• Self-directed learning initiatives

**Academic Achievements**
• Notable accomplishments
• Research and publications
• Academic honors and recognition`
    };

    return dummyContents[selectedSection] || dummyContents.introduction;
  };

  const formatContent = (text) => {
    if (!text) return hasSession ? 'Processing complete. Formatted text based on selected structures will appear here.' : getDummyContent();
    
    return text.split('\n').map((line, index) => {
      if (line.startsWith('**') && line.endsWith('**')) {
        return (
          <h4 key={index} className="text-lg font-semibold text-gray-900 mt-4 mb-2">
            {line.replace(/\*\*/g, '')}
          </h4>
        );
      }
      if (line.startsWith('###')) {
        return (
          <h5 key={index} className="text-md font-medium text-gray-800 mt-3 mb-2">
            {line.replace(/###/g, '')}
          </h5>
        );
      }
      if (line.startsWith('- ') || line.startsWith('• ')) {
        return (
          <li key={index} className="ml-4 text-gray-700 mb-1 list-disc">
            {line.replace(/^[•\-]\s/, '')}
          </li>
        );
      }
      if (line.includes('**')) {
        return (
          <p key={index} className="text-gray-700 mb-2" dangerouslySetInnerHTML={{
            __html: line.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
          }} />
        );
      }
      if (line.trim()) {
        return <p key={index} className="text-gray-700 mb-2 leading-relaxed">{line}</p>;
      }
      return <br key={index} />;
    });
  };

  // Generate sections based on selected structures or show defaults
  const sections = structures && structures.length > 0 ? [
    { id: 'introduction', name: 'Introduction', enabled: structures?.includes('Introduction') },
    { id: 'biographic', name: 'Biographic History', enabled: structures?.includes('Biographical History') },
    { id: 'professional', name: 'Professional Background', enabled: structures?.includes('Professional Background') },
    { id: 'social', name: 'Social History', enabled: structures?.includes('Social History') },
    { id: 'family', name: 'Family History', enabled: structures?.includes('Family History') },
    { id: 'medical', name: 'Medical History', enabled: structures?.includes('Medical History') },
    { id: 'educational', name: 'Educational History', enabled: true } // Always show as fallback
  ].filter(section => section.enabled) : [
    // Default sections when no structures are selected
    { id: 'introduction', name: 'Introduction', enabled: true },
    { id: 'biographic', name: 'Biographic History', enabled: true },
    { id: 'professional', name: 'Professional Background', enabled: true },
    { id: 'social', name: 'Social History', enabled: true },
    { id: 'family', name: 'Family History', enabled: true },
    { id: 'medical', name: 'Medical History', enabled: true },
    { id: 'educational', name: 'Educational History', enabled: true }
  ];

  return (
    <div className="bg-gray-100 rounded-2xl p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Formatted Text</h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopy}
            className="p-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
            title="Copy to clipboard"
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
      
      <div className="space-y-4">
        {sections.map((section, index) => (
          <div 
            key={section.id}
            className={`p-4 rounded-xl cursor-pointer transition-colors ${
              selectedSection === section.id 
                ? index % 2 === 0 ? 'bg-gray-400' : 'bg-gray-300'
                : index % 2 === 0 ? 'bg-gray-300 hover:bg-gray-350' : 'bg-gray-200 hover:bg-gray-250'
            }`}
            onClick={() => setSelectedSection(section.id)}
          >
            <h3 className={`text-lg font-semibold mb-2 ${
              selectedSection === section.id && index % 2 === 0 ? 'text-gray-100' : 'text-gray-700'
            }`}>
              {section.name}
            </h3>
            <div className={`rounded-lg flex items-start justify-start p-4 ${
              selectedSection === section.id && index % 2 === 0 ? 'bg-gray-600' : 'bg-gray-300'
            } ${isExpanded ? 'min-h-32' : 'h-24'} overflow-y-auto`}>
              <div className={`prose prose-sm max-w-none ${
                selectedSection === section.id && index % 2 === 0 ? 'text-gray-200' : 'text-gray-600'
              }`}>
                {selectedSection === section.id ? (
                  hasSession && results ? formatContent(results?.summary || results?.analysis) : (
                    hasSession ? (
                      <div className="flex items-center space-x-2">
                        <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                        <span>Processing transcription...</span>
                      </div>
                    ) : (
                      <div className="text-sm">{formatContent(getDummyContent())}</div>
                    )
                  )
                ) : (
                  <span>{section.name} content area</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Transcript Panel Component (Right Side)
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
    <div className="bg-gray-100 rounded-2xl p-6 h-full">
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

      {/* Active Transcript Button */}
      <div className="mb-4">
        <button className="w-full bg-cyan-400 text-black py-2 px-4 rounded-lg font-semibold hover:bg-cyan-500 transition-colors">
          {hasSession ? 'Active Transcript Here' : 'Sample Transcript (Demo)'}
        </button>
      </div>
      
      <div className={`space-y-3 overflow-y-auto ${isExpanded ? 'max-h-screen' : 'max-h-96'}`}>
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
                  
                  {/* Simulated processing steps */}
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

// Main TranscriptionPage Component
const TranscriptionPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isConnected, updateSessionStatus } = useBackend();
  
  const [sessionId, setSessionId] = useState(null);
  const [processingStatus, setProcessingStatus] = useState(null);
  const [results, setResults] = useState(null);
  const [structures, setStructures] = useState([]);
  const [parameters, setParameters] = useState([]);
  const [expandedSummary, setExpandedSummary] = useState(false);
  const [expandedTranscript, setExpandedTranscript] = useState(false);

  const statusPollingRef = useRef(null);

  // Get session data from navigation state or allow direct access
  useEffect(() => {
    const stateData = location.state;
    if (stateData?.sessionId) {
      setSessionId(stateData.sessionId);
      setStructures(stateData.structures || []);
      setParameters(stateData.parameters || []);
      // Set initial processing status immediately
      setProcessingStatus({ status: 'processing', progress: 0, message: 'Initializing transcription...' });
    }
    // If no session ID, just show default state - don't redirect
  }, [location.state]);

  // Start polling when session ID is available
  useEffect(() => {
    if (sessionId) {
      startStatusPolling(sessionId);
    }
  }, [sessionId]);

  // Poll processing status
  const startStatusPolling = useCallback((sessionId) => {
    if (statusPollingRef.current) {
      clearInterval(statusPollingRef.current);
    }

    statusPollingRef.current = setInterval(async () => {
      try {
        const response = await backendApi.getProcessingStatus(sessionId);
        const status = response.data;
        
        setProcessingStatus(status);
        updateSessionStatus(sessionId, status);

        if (status.status === 'completed') {
          // Fetch results
          const resultsResponse = await backendApi.getResults(sessionId);
          setResults(resultsResponse.data);
          
          // Stop polling
          clearInterval(statusPollingRef.current);
          toast.success('Transcription completed!');
          
        } else if (status.status === 'failed') {
          clearInterval(statusPollingRef.current);
          toast.error(status.message || 'Processing failed');
        }
        
      } catch (error) {
        console.error('Status polling error:', error);
        clearInterval(statusPollingRef.current);
        setProcessingStatus({ status: 'failed', message: 'Connection error' });
      }
    }, 2000); // Poll every 2 seconds
  }, [updateSessionStatus]);

  // Download handlers
  const handleDownload = useCallback(async (format, type = 'full') => {
    if (!sessionId || !results) {
      toast.error('No data available to download');
      return;
    }

    try {
      let content = '';
      let filename = '';

      if (type === 'summary') {
        content = results.summary || results.analysis || 'No summary available';
        filename = `${sessionId}_summary.${format}`;
      } else if (type === 'transcript') {
        if (format === 'json') {
          content = JSON.stringify(results.results, null, 2);
        } else {
          content = results.results?.segments?.map(segment => 
            `[${Math.floor(segment.start / 60)}:${String(Math.floor(segment.start % 60)).padStart(2, '0')} - ${Math.floor(segment.end / 60)}:${String(Math.floor(segment.end % 60)).padStart(2, '0')}] ${segment.speaker}: ${segment.text}`
          ).join('\n\n') || 'No transcript available';
        }
        filename = `${sessionId}_transcript.${format}`;
      } else {
        // Full results
        if (format === 'json') {
          content = JSON.stringify(results, null, 2);
        } else {
          content = `SPEECH ANALYSIS RESULTS
${'='.repeat(50)}

Session: ${sessionId}
Generated: ${new Date().toLocaleString()}

STRUCTURES PROCESSED:
${structures.join(', ') || 'None specified'}

PARAMETERS USED:
${parameters.join(', ') || 'None specified'}

SUMMARY:
${results.summary || results.analysis || 'No summary available'}

${'='.repeat(50)}

TRANSCRIPT:
${results.results?.segments?.map(segment => 
  `[${Math.floor(segment.start / 60)}:${String(Math.floor(segment.start % 60)).padStart(2, '0')} - ${Math.floor(segment.end / 60)}:${String(Math.floor(segment.end % 60)).padStart(2, '0')}] ${segment.speaker}: ${segment.text}`
).join('\n\n') || 'No transcript available'}

${'='.repeat(50)}
Generated by AI Speech Diarization Platform
`;
        }
        filename = `${sessionId}_results.${format}`;
      }

      const blob = new Blob([content], { 
        type: format === 'json' ? 'application/json' : 'text/plain' 
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      
      toast.success(`Downloaded ${format.toUpperCase()} file`);
      
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Download failed');
    }
  }, [sessionId, results, structures, parameters]);

  // Handle session reset
  const handleReset = useCallback(() => {
    if (statusPollingRef.current) {
      clearInterval(statusPollingRef.current);
    }
    navigate('/');
  }, [navigate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (statusPollingRef.current) {
        clearInterval(statusPollingRef.current);
      }
    };
  }, []);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-800 flex items-center justify-center">
        <div className="text-center bg-gray-700 rounded-2xl p-8 shadow-lg max-w-md border border-gray-600">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Backend Disconnected</h2>
          <p className="text-gray-300">Please ensure the backend server is running and accessible.</p>
        </div>
      </div>
    );
  }

  const hasSession = !!sessionId;

  return (
    <div className="min-h-screen bg-gray-800 overflow-auto">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link 
                to="/" 
                className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-500 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-white">
                  Exploration & <span className="text-cyan-400">Interviews</span>
                </h1>
                {sessionId ? (
                  <p className="text-gray-400">Session: {sessionId.slice(0, 8)}...</p>
                ) : (
                  <p className="text-gray-400">No active session - showing demo content</p>
                )}
              </div>
            </div>
            
            {/* Download Options - Show only when has actual results */}
            {results && (
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => handleDownload('json')}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white hover:bg-blue-600 rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>JSON</span>
                </button>
                <button
                  onClick={() => handleDownload('txt')}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white hover:bg-green-600 rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>TXT</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Processing Status - Show when there's a session and not completed */}
        {hasSession && processingStatus && processingStatus.status !== 'completed' && (
          <div className="mb-8">
            <ProcessingStatus 
              status={processingStatus}
              onReset={handleReset}
            />
          </div>
        )}

        {/* No session info */}
        {!hasSession && (
          <div className="mb-8 bg-blue-100 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-blue-600" />
              <span className="text-blue-800 font-medium">Demo Mode</span>
            </div>
            <p className="text-blue-700 text-sm mt-1">
              You're viewing sample content. Upload an audio file on the Home page to see real results.
            </p>
          </div>
        )}

        {/* Stats Summary - Show placeholder during processing or demo content */}
        <StatsSummary 
          metadata={results?.results?.metadata || {}} 
          speakerStats={results?.results?.speaker_stats || {}}
          hasData={hasSession}
        />

        {/* Main content - Always show panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-300px)]">
          <div className="border-4 border-cyan-400 rounded-3xl p-2">
            <FormattedTextPanel 
              results={results}
              structures={structures}
              isExpanded={expandedSummary}
              onToggleExpand={() => setExpandedSummary(!expandedSummary)}
              hasSession={hasSession}
            />
          </div>
          
          <div className="border-4 border-cyan-400 rounded-3xl p-2">
            <TranscriptPanel 
              results={results}
              isExpanded={expandedTranscript}
              onToggleExpand={() => setExpandedTranscript(!expandedTranscript)}
              hasSession={hasSession}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TranscriptionPage;