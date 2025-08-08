// src/pages/AnalysisPage.jsx - Complete Updated Analysis Page with Database Integration
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
  FileText,
  Filter,
  Search,
  Settings,
  Download,
  Loader2
} from 'lucide-react';
import { useBackend } from '../contexts/BackendContext';
import { backendApi } from '../services/api';
import useAppStore from '../stores/appStore';
import toast from 'react-hot-toast';

// Import new unified component
import UnifiedAnalysisCard from '../Components/analysis/UnifiedAnalysisCard';
import CustomAnalysisPanel from '../Components/analysis/CustomAnalysisPanel';

const AnalysisPage = () => {
  const { isConnected, isLLMAvailable } = useBackend();
  
  // Store state
  const currentSessionId = useAppStore((state) => state.currentSessionId);
  const results = useAppStore((state) => state.results);
  const analysisResults = useAppStore((state) => state.analysisResults);
  const setAnalysisResults = useAppStore((state) => state.setAnalysisResults);
  const analysisProgress = useAppStore((state) => state.analysisProgress);
  const setAnalysisProgress = useAppStore((state) => state.setAnalysisProgress);
  const customPrompt = useAppStore((state) => state.customPrompt);
  const setCustomPrompt = useAppStore((state) => state.setCustomPrompt);

  // Local state
  const [sessionData, setSessionData] = useState(null);
  const [prompts, setPrompts] = useState([]);
  const [loadingPrompts, setLoadingPrompts] = useState(new Set());
  const [loadingPromptData, setLoadingPromptData] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState([]);

  // Refs for background polling
  const pollingIntervals = useRef(new Map());

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      pollingIntervals.current.forEach((interval) => {
        clearInterval(interval);
      });
      pollingIntervals.current.clear();
    };
  }, []);

  // Load prompts from database on mount
  useEffect(() => {
    if (isLLMAvailable) {
      loadPromptsFromDatabase();
      loadCategories();
    }
  }, [isLLMAvailable]);

  // Auto-load session data with temp session filtering
  useEffect(() => {
    if (currentSessionId && results && !currentSessionId.startsWith('temp_')) {
      setSessionData(results);
    } else if (currentSessionId && !results && !currentSessionId.startsWith('temp_')) {
      loadSessionData(currentSessionId);
    } else {
      setSessionData(null);
    }
  }, [currentSessionId, results]);

  const loadPromptsFromDatabase = async () => {
    setLoadingPromptData(true);
    try {
      const response = await backendApi.prompts.getAll({ active_only: true });
      setPrompts(response.data || []);
    } catch (error) {
      console.error('Failed to load prompts:', error);
      toast.error('Failed to load analysis prompts');
      // Fallback to empty array
      setPrompts([]);
    } finally {
      setLoadingPromptData(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await backendApi.prompts.getCategories();
      const categoryList = [
        { value: 'all', label: 'All Categories' },
        ...response.data.categories.map(cat => ({
          value: cat,
          label: cat.charAt(0).toUpperCase() + cat.slice(1)
        }))
      ];
      setCategories(categoryList);
    } catch (error) {
      console.error('Failed to load categories:', error);
      setCategories([{ value: 'all', label: 'All Categories' }]);
    }
  };

  const loadSessionData = async (sessionId) => {
    if (sessionId.startsWith('temp_')) {
      console.log('🚫 Skipping session data load for temporary session:', sessionId);
      return;
    }

    try {
      console.log('📊 Loading session data for:', sessionId);
      const response = await backendApi.getResults(sessionId);
      setSessionData(response.data);
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error('Failed to load session data:', error);
        toast.error('Failed to load session data');
      } else {
        console.log('📭 Session data not yet available:', sessionId);
      }
    }
  };

  const runAnalysis = async (promptKey, customPromptText = '') => {
    // Validate session before running analysis
    if (!currentSessionId || currentSessionId.startsWith('temp_') || !sessionData) {
      if (currentSessionId?.startsWith('temp_')) {
        toast.error('Please wait for processing to complete before running analysis');
      } else {
        toast.error('No completed session available for analysis');
      }
      return;
    }

    const analysisKey = `${currentSessionId}_${promptKey}`;
    setLoadingPrompts(prev => new Set(prev).add(promptKey));
    
    const prompt = prompts.find(p => p.key === promptKey);
    const promptTitle = promptKey === 'custom' ? 'Custom Analysis' : prompt?.title || 'Analysis';
    
    setAnalysisProgress({
      ...analysisProgress,
      [analysisKey]: {
        status: 'processing',
        sessionId: currentSessionId,
        promptType: promptKey,
        startTime: new Date().toISOString(),
        title: promptTitle
      }
    });

    try {
      // Increment usage count for analytics
      if (promptKey !== 'custom' && prompt) {
        await backendApi.prompts.incrementUsage(promptKey);
      }

      const response = await backendApi.processWithLLM({
        transcript_data: sessionData.results,
        prompt_type: promptKey,
        custom_prompt: customPromptText,
        max_tokens: prompt?.max_tokens || 2000
      });

      console.log('Analysis Response:', response.data);

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

      toast.success(`${promptTitle} completed!`);

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
        newSet.delete(promptKey);
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

  const downloadAnalysis = (promptKey) => {
    if (!currentSessionId || currentSessionId.startsWith('temp_')) {
      toast.error('No valid session available for download');
      return;
    }
    
    const analysisKey = `${currentSessionId}_${promptKey}`;
    const result = analysisResults[analysisKey];
    const prompt = prompts.find(p => p.key === promptKey);
    const title = promptKey === 'custom' ? 'Custom Analysis' : prompt?.title || 'Analysis';

    if (!result || !result.response) {
      toast.error('No analysis result available to download');
      return;
    }

    const content = `AI ANALYSIS REPORT
${'='.repeat(50)}

Analysis Type: ${title}
Generated: ${new Date().toLocaleString()}
Model: ${result.model || 'Unknown'}
Session: ${currentSessionId}

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
    link.download = `analysis_${title.replace(/\s+/g, '_')}_${currentSessionId.slice(0, 8)}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    toast.success('Analysis downloaded');
  };

  // Helper function to clear analysis history
  const clearAnalysisHistory = () => {
    setAnalysisResults({});
    setAnalysisProgress({});
    pollingIntervals.current.forEach((interval) => {
      clearInterval(interval);
    });
    pollingIntervals.current.clear();
    toast.success('Analysis history cleared');
  };

  // Filter prompts based on search and category
  const filteredPrompts = prompts.filter(prompt => {
    const matchesSearch = prompt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prompt.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prompt.key.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || prompt.category === selectedCategory;
    
    return matchesSearch && matchesCategory && prompt.is_active;
  });

  // Check for valid session
  const hasValidSession = currentSessionId && !currentSessionId.startsWith('temp_') && sessionData;

  // Connection status checks
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
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">AI Analysis</h1>
                <p className="text-gray-400">Advanced transcript analysis powered by LLM</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={loadPromptsFromDatabase}
                disabled={loadingPromptData}
                className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors flex items-center space-x-2"
              >
                <RefreshCw className={`w-4 h-4 ${loadingPromptData ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
              <button
                onClick={() => window.open('/admin', '_blank')}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all flex items-center space-x-2"
              >
                <Settings className="w-4 h-4" />
                <span>Admin</span>
              </button>
            </div>
          </div>
        </div>

        {/* Session Info */}
        {hasValidSession && (
          <div className="mb-8 bg-gray-800 rounded-xl border border-gray-700 p-6">
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

        {/* Search and Filter */}
        {prompts.length > 0 && (
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search analysis prompts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
            {categories.length > 1 && (
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="pl-10 pr-8 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* Analysis Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Predefined Analysis */}
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-white">Quick Analysis</h2>
            
            {loadingPromptData ? (
              <div className="text-center py-12">
                <Loader2 className="animate-spin w-8 h-8 text-cyan-500 mx-auto" />
                <p className="text-gray-400 mt-2">Loading prompts...</p>
              </div>
            ) : filteredPrompts.length === 0 ? (
              <div className="text-center py-12 bg-gray-800 rounded-xl border border-gray-700">
                <Brain className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 mb-2">No analysis prompts available</p>
                <p className="text-gray-500 text-sm">
                  {prompts.length === 0 
                    ? 'Visit the admin dashboard to create prompts'
                    : 'Try adjusting your search or filter criteria'
                  }
                </p>
                {prompts.length === 0 && (
                  <button
                    onClick={() => window.open('/admin', '_blank')}
                    className="mt-4 px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all"
                  >
                    Open Admin Dashboard
                  </button>
                )}
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredPrompts.map((prompt) => (
                  <UnifiedAnalysisCard
                    key={prompt.key}
                    prompt={prompt}
                    selectedSession={currentSessionId}
                    analysisResults={analysisResults}
                    analysisProgress={analysisProgress}
                    isLoading={loadingPrompts.has(prompt.key)}
                    onRunAnalysis={runAnalysis}
                    onDownload={downloadAnalysis}
                    showUsageStats={true}
                    isAdminView={false}
                  />
                ))}
              </div>
            )}
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
            />

            {/* Tips and Help */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Sparkles className="w-5 h-5 text-cyan-400 mr-2" />
                💡 Analysis Tips
              </h3>
              <div className="space-y-3 text-sm text-gray-400">
                <p>• Use specific prompts for better results (e.g., "Extract action items with deadlines")</p>
                <p>• Include context in your custom prompts (e.g., "This is a sales meeting transcript...")</p>
                <p>• The {'{transcript}'} placeholder will be replaced with your conversation data</p>
                <p>• Longer prompts may take more time to process</p>
                <p>• Results can be downloaded as text files for sharing</p>
              </div>
            </div>

            {/* Quick Stats */}
            {prompts.length > 0 && (
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Available Analysis</h3>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-cyan-400">{prompts.filter(p => p.is_active).length}</div>
                    <div className="text-sm text-gray-400">Active Prompts</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-400">{categories.length - 1}</div>
                    <div className="text-sm text-gray-400">Categories</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* No Session Warning */}
        {!hasValidSession && (
          <div className="mt-12 text-center bg-gray-800 rounded-xl border border-gray-700 p-8">
            <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Session Available</h3>
            <p className="text-gray-400 mb-4">
              Upload and process an audio file first to enable AI analysis features.
            </p>
            <button
              onClick={() => window.location.href = '/'}
              className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-lg hover:from-cyan-600 hover:to-cyan-700 transition-all"
            >
              Upload Audio
            </button>
          </div>
        )}

        {/* Analysis History Section */}
        {Object.keys(analysisResults).length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-white">Recent Analysis</h2>
              <button
                onClick={clearAnalysisHistory}
                className="px-4 py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-colors flex items-center space-x-2"
              >
                <AlertCircle className="w-4 h-4" />
                <span>Clear History</span>
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {Object.entries(analysisResults)
                .filter(([key, result]) => result.response || result.error)
                .slice(-6) // Show last 6 results
                .map(([key, result]) => {
                  const [sessionId, promptKey] = key.split('_');
                  const prompt = prompts.find(p => p.key === promptKey);
                  const progressData = analysisProgress[key];
                  
                  return (
                    <motion.div 
                      key={key} 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gray-800 rounded-lg border border-gray-700 p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          {prompt ? (
                            <>
                              <span className="text-lg">{prompt.emoji}</span>
                              <span className="text-white font-medium text-sm">{prompt.title}</span>
                            </>
                          ) : (
                            <>
                              <Brain className="w-4 h-4 text-gray-400" />
                              <span className="text-white font-medium text-sm">
                                {promptKey === 'custom' ? 'Custom Analysis' : promptKey}
                              </span>
                            </>
                          )}
                        </div>
                        <button
                          onClick={() => downloadAnalysis(promptKey)}
                          className="p-1 text-gray-400 hover:text-white transition-colors"
                          disabled={!result.response}
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="text-xs text-gray-500 mb-2">
                        Session: {sessionId.slice(0, 8)}... • 
                        {progressData?.completedTime ? 
                          ` ${new Date(progressData.completedTime).toLocaleString()}` :
                          ' Completed'
                        }
                      </div>
                      
                      {result.response ? (
                        <div className="bg-gray-700 rounded p-2 max-h-24 overflow-hidden">
                          <p className="text-gray-300 text-xs line-clamp-3">
                            {result.response.substring(0, 150)}...
                          </p>
                        </div>
                      ) : result.error && (
                        <div className="bg-red-900/20 border border-red-500/30 rounded p-2">
                          <p className="text-red-400 text-xs">
                            {result.error}
                          </p>
                        </div>
                      )}
                      
                      {result.processing_time && (
                        <div className="mt-2 text-xs text-gray-500">
                          Processed in {result.processing_time.toFixed(1)}s
                        </div>
                      )}
                    </motion.div>
                  );
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalysisPage;