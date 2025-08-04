// src/pages/AnalysisPage.jsx - Main AI Analysis Interface with Store Integration
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  Sparkles,
  AlertCircle,
  Brain,
  RefreshCw,
  Clock,
  Users,
  FileText
} from 'lucide-react';
import { useBackend } from '../contexts/BackendContext';
import { backendApi } from '../services/api';
import useAppStore from '../stores/appStore'; // ✅ Added store import
import toast from 'react-hot-toast';

// Import sub-components
import AnalysisProgressBanner from '../Components/analysis/AnalysisProgressBanner';
import AnalysisHistoryModal from '../Components/analysis/AnalysisHistoryModal';
import AnalysisCard from '../Components/analysis/AnalysisCard';
import CustomAnalysisPanel from '../Components/analysis/CustomAnalysisPanel';
import AnalysisTips from '../Components/analysis/AnalysisTips';
import RecentAnalysisPanel from '../Components/analysis/RecentAnalysisPanel';

const AnalysisPage = () => {
  const { isConnected, isLLMAvailable } = useBackend(); // ✅ Removed activeSessions
  
  // ✅ NEW: Use store state instead of local state
  const currentSessionId = useAppStore((state) => state.currentSessionId);
  const results = useAppStore((state) => state.results);
  const analysisResults = useAppStore((state) => state.analysisResults);
  const setAnalysisResults = useAppStore((state) => state.setAnalysisResults);
  const analysisProgress = useAppStore((state) => state.analysisProgress);
  const setAnalysisProgress = useAppStore((state) => state.setAnalysisProgress);
  const customPrompt = useAppStore((state) => state.customPrompt);
  const setCustomPrompt = useAppStore((state) => state.setCustomPrompt);
  const showHistoryModal = useAppStore((state) => state.showHistoryModal);
  const setShowHistoryModal = useAppStore((state) => state.setShowHistoryModal);

  // ✅ UPDATED: Local state - reduced since using store
  const [sessionData, setSessionData] = useState(null);
  const [availablePrompts, setAvailablePrompts] = useState({});
  const [loadingPrompts, setLoadingPrompts] = useState(new Set());
  
  // Persistent analysis progress tracking
  const [backgroundPolling, setBackgroundPolling] = useState(new Set());

  // Refs for background polling
  const pollingIntervals = useRef(new Map());

  // Predefined analysis types - NO CHANGES
  const analysisTypes = [
    {
      key: 'summary',
      title: 'Conversation Summary',
      description: 'Generate a comprehensive summary of the entire conversation, highlighting key points and main topics discussed.',
      icon: FileText,
      gradient: 'from-cyan-500 to-cyan-600'
    },
    {
      key: 'sentiment',
      title: 'Sentiment Analysis',
      description: 'Analyze the emotional tone and sentiment throughout the conversation, identifying positive, negative, and neutral segments.',
      icon: BarChart3,
      gradient: 'from-gray-600 to-gray-700'
    },
    {
      key: 'key_insights',
      title: 'Key Insights',
      description: 'Extract important insights, decisions, action items, and critical information from the conversation.',
      icon: Brain,
      gradient: 'from-cyan-400 to-cyan-500'
    },
    {
      key: 'speaker_analysis',
      title: 'Speaker Analysis',
      description: 'Analyze individual speaker contributions, speaking patterns, and interaction dynamics between participants.',
      icon: Users,
      gradient: 'from-gray-500 to-gray-600'
    },
    {
      key: 'topic_modeling',
      title: 'Topic Modeling',
      description: 'Identify and categorize main topics and themes discussed throughout the conversation.',
      icon: BarChart3,
      gradient: 'from-cyan-600 to-cyan-700'
    },
    {
      key: 'action_items',
      title: 'Action Items',
      description: 'Extract actionable tasks, commitments, and follow-up items mentioned in the conversation.',
      icon: FileText,
      gradient: 'from-gray-700 to-gray-800'
    }
  ];

  // Background polling for analysis results - NO CHANGES
  const startBackgroundPolling = (analysisKey, sessionId) => {
    if (pollingIntervals.current.has(analysisKey)) return;

    setBackgroundPolling(prev => new Set(prev).add(analysisKey));
    
    const pollInterval = setInterval(async () => {
      try {
        const progressData = analysisProgress[analysisKey];
        if (!progressData || progressData.status !== 'processing') {
          clearInterval(pollInterval);
          pollingIntervals.current.delete(analysisKey);
          setBackgroundPolling(prev => {
            const newSet = new Set(prev);
            newSet.delete(analysisKey);
            return newSet;
          });
          return;
        }

        setAnalysisProgress({
          ...analysisProgress,
          [analysisKey]: {
            ...analysisProgress[analysisKey],
            lastChecked: new Date().toISOString()
          }
        });

      } catch (error) {
        console.error(`Background polling error for ${analysisKey}:`, error);
      }
    }, 5000);

    pollingIntervals.current.set(analysisKey, pollInterval);

    setTimeout(() => {
      const interval = pollingIntervals.current.get(analysisKey);
      if (interval) {
        clearInterval(interval);
        pollingIntervals.current.delete(analysisKey);
      }
      setBackgroundPolling(prev => {
        const newSet = new Set(prev);
        newSet.delete(analysisKey);
        return newSet;
      });
    }, 600000);
  };

  // Cleanup intervals on unmount - NO CHANGES
  useEffect(() => {
    return () => {
      pollingIntervals.current.forEach((interval) => {
        clearInterval(interval);
      });
      pollingIntervals.current.clear();
    };
  }, []);

  // Load available prompts on mount - NO CHANGES
  useEffect(() => {
    if (isLLMAvailable) {
      loadPrompts();
    }
  }, [isLLMAvailable]);

  // ✅ UPDATED: Auto-load session data when store has session
  useEffect(() => {
    if (currentSessionId && results) {
      // Use existing results from store
      setSessionData(results);
    } else if (currentSessionId && !results) {
      // Fetch session data if not in store
      loadSessionData(currentSessionId);
    } else {
      // No session available
      setSessionData(null);
    }
  }, [currentSessionId, results]);

  const loadPrompts = async () => {
    try {
      const response = await backendApi.getLLMPrompts();
      setAvailablePrompts(response.data.predefined_prompts || {});
    } catch (error) {
      console.error('Failed to load prompts:', error);
      setAvailablePrompts({
        summary: { name: 'Summary', description: 'Generate a summary' },
        sentiment: { name: 'Sentiment Analysis', description: 'Analyze sentiment' },
        key_insights: { name: 'Key Insights', description: 'Extract insights' }
      });
    }
  };

  const loadSessionData = async (sessionId) => {
    try {
      const response = await backendApi.getResults(sessionId);
      setSessionData(response.data);
    } catch (error) {
      console.error('Failed to load session data:', error);
      toast.error('Failed to load session data');
    }
  };

  // ✅ UPDATED: Use currentSessionId from store
  const runAnalysis = async (promptType, customPromptText = '') => {
    if (!currentSessionId || !sessionData) {
      toast.error('Don\'t have a session to analyze');
      return;
    }

    const analysisKey = `${currentSessionId}_${promptType}`;
    setLoadingPrompts(prev => new Set(prev).add(promptType));
    
    setAnalysisProgress({
      ...analysisProgress,
      [analysisKey]: {
        status: 'processing',
        sessionId: currentSessionId,
        promptType,
        startTime: new Date().toISOString(),
        title: promptType === 'custom' ? 'Custom Analysis' : analysisTypes.find(t => t.key === promptType)?.title
      }
    });

    try {
      const response = await backendApi.processWithLLM({
        transcript_data: sessionData.results,
        prompt_type: promptType,
        custom_prompt: customPromptText,
        max_tokens: 2000
      });

      console.log('Full API Response:', response);
      console.log('Response Data:', response.data);
      console.log('Response Text:', response.data?.response);

      setAnalysisResults({
        ...analysisResults,
        [analysisKey]: response.data
      });

      setAnalysisProgress({
        ...analysisProgress,
        [analysisKey]: {
          ...analysisProgress[analysisKey],
          status: 'completed',
          completedTime: new Date().toISOString()
        }
      });

      toast.success(`${promptType === 'custom' ? 'Custom analysis' : analysisTypes.find(t => t.key === promptType)?.title || 'Analysis'} completed!`);

    } catch (error) {
      console.error('Analysis failed:', error);
      toast.error(error.userMessage || 'Analysis failed');
      
      setAnalysisProgress({
        ...analysisProgress,
        [analysisKey]: {
          ...analysisProgress[analysisKey],
          status: 'failed',
          error: error.userMessage || 'Analysis failed',
          failedTime: new Date().toISOString()
        }
      });

      setAnalysisResults({
        ...analysisResults,
        [analysisKey]: { error: error.userMessage || 'Analysis failed' }
      });
    } finally {
      setLoadingPrompts(prev => {
        const newSet = new Set(prev);
        newSet.delete(promptType);
        return newSet;
      });
    }
  };

  const runCustomAnalysis = () => {
    if (!customPrompt.trim()) {
      toast.error('Please enter a custom prompt');
      return;
    }
    runAnalysis('custom', customPrompt);
  };

  // ✅ UPDATED: Use currentSessionId from store
  const downloadAnalysis = (keyOrPromptType, progressData = null) => {
    let analysisKey, result, title;
    
    if (progressData) {
      analysisKey = keyOrPromptType;
      result = analysisResults[analysisKey];
      title = progressData.title;
    } else {
      analysisKey = `${currentSessionId}_${keyOrPromptType}`;
      result = analysisResults[analysisKey];
      const analysisType = analysisTypes.find(t => t.key === keyOrPromptType);
      title = keyOrPromptType === 'custom' ? 'Custom Analysis' : analysisType?.title || 'Analysis';
    }

    if (!result || !result.response) {
      toast.error('No analysis result available to download');
      return;
    }

    const content = `AI ANALYSIS REPORT
${'='.repeat(50)}

Analysis Type: ${title}
Generated: ${new Date().toLocaleString()}
Model: ${result.model || 'Unknown'}
Session: ${progressData?.sessionId || currentSessionId}

${'='.repeat(50)}

${result.response}

${'='.repeat(50)}
Generated by AI Speech Diarization Platform
Processing Time: ${result.processing_time?.toFixed(2)}s
Transcript Length: ${result.transcript_length || 'N/A'} characters
`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analysis_${title.replace(/\s+/g, '_')}_${(progressData?.sessionId || currentSessionId).slice(0, 8)}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    toast.success('Analysis downloaded');
  };

  // ✅ REMOVED: getSessionOptions function (no longer needed)

  // ✅ UPDATED: Clear analysis using store setters
  const clearAnalysisHistory = () => {
    setAnalysisResults({});
    setAnalysisProgress({});
    pollingIntervals.current.forEach((interval) => {
      clearInterval(interval);
    });
    pollingIntervals.current.clear();
    setBackgroundPolling(new Set());
    toast.success('Analysis history cleared');
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
        <div className="text-center bg-gray-800 rounded-2xl p-8 shadow-lg max-w-md border border-gray-700">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Backend Disconnected</h2>
          <p className="text-gray-300">Please ensure the backend server is running to use AI analysis features.</p>
        </div>
      </div>
    );
  }

  if (!isLLMAvailable) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
        <div className="text-center bg-gray-800 rounded-2xl p-8 shadow-lg max-w-md border border-gray-700">
          <Brain className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">AI Analysis Unavailable</h2>
          <p className="text-gray-300 mb-4">The LLM service is required for analysis features.</p>
          <div className="bg-gray-700 border border-gray-600 rounded-lg p-4 text-left text-sm">
            <div className="font-medium text-white mb-2">To start Ollama:</div>
            <code className="block bg-gray-900 p-2 rounded border border-gray-600 text-cyan-400">
              ollama serve
            </code>
            <div className="mt-2 text-gray-400">
              Make sure the model is downloaded: <code className="text-cyan-400">ollama pull llama3.2:3b</code>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6 overflow-auto">
      <div className="max-w-7xl mx-auto">
        {/* Header - NO CHANGES */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">AI Analysis</h1>
                <p className="text-gray-400">Generate insights from your transcriptions using AI</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={clearAnalysisHistory}
                className="flex items-center space-x-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Clear History</span>
              </button>
              <div className="flex items-center space-x-2 text-sm">
                <Sparkles className="w-4 h-4 text-green-500" />
                <span className="text-green-400 font-medium">AI Ready</span>
              </div>
            </div>
          </div>
        </div>

        {/* Analysis Progress Banner - NO CHANGES */}
        <AnalysisProgressBanner 
          analysisProgress={analysisProgress}
          onViewProgress={() => setShowHistoryModal(true)}
          onClearProgress={clearAnalysisHistory}
        />

        {/* Analysis History Modal - NO CHANGES */}
        <AnalysisHistoryModal 
          isOpen={showHistoryModal}
          onClose={() => setShowHistoryModal(false)}
          analysisProgress={analysisProgress}
          analysisResults={analysisResults}
          onDownload={downloadAnalysis}
        />

        {/* ✅ UPDATED: Current Session Info (instead of session selection) */}
        {currentSessionId && (
          <div className="mb-8 bg-gray-800 rounded-xl border border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Current Session</h2>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="px-3 py-2 bg-cyan-500/20 border border-cyan-500/30 rounded-lg">
                  <span className="text-cyan-400 font-medium">Session {currentSessionId.slice(0, 8)}...</span>
                </div>
                
                {sessionData && (
                  <div className="flex items-center space-x-4 text-sm text-gray-400">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{Math.round(sessionData.results.metadata.total_duration)}s</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4" />
                      <span>{sessionData.results.metadata.num_speakers} speakers</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <FileText className="w-4 h-4" />
                      <span>{sessionData.results.metadata.num_segments} segments</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ✅ UPDATED: Always show analysis options (enabled/disabled based on session) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Predefined Analysis */}
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-white">Quick Analysis</h2>
            
            <div className="grid gap-4">
              {analysisTypes.map((analysis) => (
                <AnalysisCard
                  key={analysis.key}
                  analysis={analysis}
                  selectedSession={currentSessionId}
                  analysisResults={analysisResults}
                  analysisProgress={analysisProgress}
                  loadingPrompts={loadingPrompts}
                  onRunAnalysis={runAnalysis}
                  onDownload={downloadAnalysis}
                  disabled={!sessionData} // ✅ Pass disabled prop
                />
              ))}
            </div>
          </div>

          {/* Custom Analysis */}
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-white">Custom Analysis</h2>
            
            <CustomAnalysisPanel
              customPrompt={customPrompt}
              setCustomPrompt={setCustomPrompt}
              onRunCustomAnalysis={runCustomAnalysis}
              loadingPrompts={loadingPrompts}
              selectedSession={currentSessionId}
              analysisResults={analysisResults}
              analysisProgress={analysisProgress}
              onDownload={downloadAnalysis}
              disabled={!sessionData} // ✅ Pass disabled prop
            />

            <AnalysisTips />

            {Object.keys(analysisProgress).length > 0 && (
              <RecentAnalysisPanel
                analysisProgress={analysisProgress}
                analysisResults={analysisResults}
                onShowHistory={() => setShowHistoryModal(true)}
                onDownload={downloadAnalysis}
              />
            )}
          </div>
        </div>

        {/* ✅ UPDATED: No Session Available message */}
        {!currentSessionId && (
          <div className="text-center py-12">
            <div className="bg-gray-800 rounded-2xl p-8 max-w-md mx-auto border border-gray-700">
              <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                No Session Available
              </h3>
              <p className="text-gray-400 mb-4">
                Upload and process an audio file first to start AI analysis.
              </p>
              {Object.keys(analysisProgress).length > 0 && (
                <div className="mt-4 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg text-blue-400 text-sm">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <Clock className="w-4 h-4" />
                    <span>You have {Object.keys(analysisProgress).length} analysis results saved</span>
                  </div>
                  <button
                    onClick={() => setShowHistoryModal(true)}
                    className="text-cyan-400 hover:text-cyan-300 underline"
                  >
                    View analysis history
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ✅ UPDATED: Session loading message */}
        {currentSessionId && !sessionData && (
          <div className="text-center py-12">
            <div className="bg-gray-800 rounded-2xl p-8 max-w-md mx-auto border border-gray-700">
              <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4 animate-pulse" />
              <h3 className="text-xl font-semibold text-white mb-2">
                Loading Session Data...
              </h3>
              <p className="text-gray-400">
                Preparing session {currentSessionId.slice(0, 8)}... for analysis
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalysisPage;