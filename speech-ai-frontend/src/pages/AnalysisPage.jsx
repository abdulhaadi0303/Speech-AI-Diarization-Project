// src/pages/AnalysisPage.jsx - AI Analysis Page (Fixed Session Detection)
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  BarChart3, 
  Loader2, 
  RefreshCw, 
  Brain, 
  Clock, 
  Search,
  Filter,
  X,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  Zap
} from 'lucide-react';

// Import components
import UnifiedAnalysisCard from '../Components/analysis/UnifiedAnalysisCard';
import { useBackend } from '../contexts/BackendContext';
import { backendApi } from '../services/api';
import useAppStore from '../stores/appStore';

const AnalysisPage = () => {
  // State management
  const [prompts, setPrompts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loadingPromptData, setLoadingPromptData] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [showCustomAnalysis, setShowCustomAnalysis] = useState(false);
  
  // Analysis state
  const [analysisResults, setAnalysisResults] = useState({});
  const [analysisProgress, setAnalysisProgress] = useState({});
  const [loadingPrompts, setLoadingPrompts] = useState(new Set());
  
  // Backend connection and session management
  const { backendStatus, activeSessions } = useBackend();
  
  // Get current session from Zustand store (same as TranscriptionPage)
  const currentSessionId = useAppStore((state) => state.currentSessionId);
  const results = useAppStore((state) => state.results);
  const processingStatus = useAppStore((state) => state.processingStatus);
  
  // Polling refs
  const pollingIntervals = useRef(new Map());
  
  // Categories for filtering
  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'general', label: 'General' },
    { value: 'meeting', label: 'Meeting' },
    { value: 'content', label: 'Content' },
    { value: 'analysis', label: 'Analysis' },
    { value: 'productivity', label: 'Productivity' }
  ];

  // Load prompts from database on component mount
  useEffect(() => {
    loadPromptsFromDatabase();
  }, []);

  // Cleanup polling intervals on unmount
  useEffect(() => {
    return () => {
      pollingIntervals.current.forEach((interval) => {
        clearInterval(interval);
      });
      pollingIntervals.current.clear();
    };
  }, []);

  const loadPromptsFromDatabase = async () => {
    setLoadingPromptData(true);
    try {
      const response = await backendApi.prompts.getAll({
        active_only: true
      });
      
      if (response?.data) {
        setPrompts(response.data);
        console.log(`✅ Loaded ${response.data.length} analysis prompts`);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Failed to load prompts:', error);
      toast.error('Failed to load analysis prompts from database');
      
      // Fallback to legacy API
      try {
        const fallbackResponse = await backendApi.getLLMPrompts();
        if (fallbackResponse?.data?.predefined_prompts) {
          const promptsArray = Object.entries(fallbackResponse.data.predefined_prompts).map(([key, prompt]) => {
            // Assign colors based on category
            const getCategoryGradient = (category) => {
              const gradients = {
                general: { from: 'blue-500', to: 'blue-600' },
                meeting: { from: 'green-500', to: 'green-600' },
                content: { from: 'purple-500', to: 'purple-600' },
                analysis: { from: 'yellow-500', to: 'yellow-600' },
                productivity: { from: 'orange-500', to: 'orange-600' }
              };
              return gradients[category] || gradients.general;
            };

            const category = 'general'; // Default category for fallback prompts
            const gradient = getCategoryGradient(category);
            
            return {
              key,
              title: prompt.name,
              description: prompt.description,
              prompt_template: prompt.prompt,
              category: category,
              is_active: true,
              is_system: true,
              usage_count: prompt.usage_count || 0,
              estimated_time: 30.0,
              emoji: '🤖',
              gradient_from: gradient.from,
              gradient_to: gradient.to,
              icon: 'Brain'
            };
          });
          setPrompts(promptsArray);
          console.log(`✅ Loaded ${promptsArray.length} fallback prompts with colors`);
        }
      } catch (fallbackError) {
        console.error('Fallback loading failed:', fallbackError);
        toast.error('Could not load any analysis prompts');
      }
    } finally {
      setLoadingPromptData(false);
    }
  };

  const getTranscriptFromResults = () => {
    // First, try to get transcript from Zustand store results
    if (results && results.segments) {
      console.log('📄 Using transcript from Zustand store results');
      return results.segments
        .map(segment => `${segment.speaker}: ${segment.text}`)
        .join('\n');
    }

    // If no results in store, try to get from active sessions
    if (currentSessionId && activeSessions.has(currentSessionId)) {
      const sessionData = activeSessions.get(currentSessionId);
      if (sessionData.results && sessionData.results.segments) {
        console.log('📄 Using transcript from active session data');
        return sessionData.results.segments
          .map(segment => `${segment.speaker}: ${segment.text}`)
          .join('\n');
      }
    }

    console.log('❌ No transcript found in store or active sessions');
    return null;
  };

  const runAnalysis = async (promptKey) => {
    if (!currentSessionId) {
      toast.error('No session selected. Please process audio first.');
      return;
    }

    if (!backendStatus.connected) {
      toast.error('Backend not connected. Please check the connection.');
      return;
    }

    // Check if analysis is already running for this prompt
    if (loadingPrompts.has(promptKey)) {
      toast.error('Analysis already running for this prompt');
      return;
    }

    try {
      // First try to get transcript from store/sessions
      let transcript = getTranscriptFromResults();
      
      // If no transcript in store, try to fetch from API
      if (!transcript) {
        console.log('🔍 No transcript in store, fetching from API...');
        const sessionResponse = await backendApi.getResults(currentSessionId);
        
        if (!sessionResponse?.data?.results?.segments) {
          toast.error('No transcript available for analysis. Please ensure audio processing is completed.');
          return;
        }

        transcript = sessionResponse.data.results.segments
          .map(segment => `${segment.speaker}: ${segment.text}`)
          .join('\n');
      }

      console.log(`🚀 Starting analysis for prompt: ${promptKey}`);
      console.log(`📄 Transcript length: ${transcript.length} characters`);

      // Update loading state
      setLoadingPrompts(prev => new Set(prev).add(promptKey));
      setAnalysisProgress(prev => ({
        ...prev,
        [promptKey]: { 
          status: 'processing', 
          progress: 0,
          timestamp: new Date().toISOString()
        }
      }));

      // Find the prompt
      const prompt = prompts.find(p => p.key === promptKey);
      if (!prompt) {
        throw new Error('Prompt not found');
      }

      // Start analysis
      const analysisResponse = await backendApi.processWithLLM({
        transcript,
        prompt_key: promptKey
      });

      console.log(`✅ Analysis completed for: ${promptKey}`);
      console.log('📦 Analysis response:', analysisResponse.data);

      // Update results - store with correct format
      const resultData = {
        response: analysisResponse.data.result || analysisResponse.data.response,
        result: analysisResponse.data.result || analysisResponse.data.response,
        model: analysisResponse.data.model,
        prompt_title: analysisResponse.data.prompt_title || prompt.title,
        prompt_key: promptKey,
        timestamp: new Date().toISOString(),
        processing_time: analysisResponse.data.processing_time,
        ...analysisResponse.data
      };

      console.log('💾 Storing result data:', resultData);

      setAnalysisResults(prev => {
        const newResults = { ...prev, [promptKey]: resultData };
        console.log('📊 Updated analysisResults:', newResults);
        return newResults;
      });

      setAnalysisProgress(prev => ({
        ...prev,
        [promptKey]: { 
          status: 'completed', 
          progress: 100,
          timestamp: new Date().toISOString()
        }
      }));

      toast.success(`Analysis completed: ${prompt.title}`);

      // Increment usage count
      try {
        await backendApi.prompts.incrementUsage(promptKey);
      } catch (usageError) {
        console.warn('Failed to increment usage count:', usageError);
      }

    } catch (error) {
      console.error('Analysis failed:', error);
      
      setAnalysisProgress(prev => ({
        ...prev,
        [promptKey]: { 
          status: 'failed', 
          progress: 0,
          error: errorMessage,
          timestamp: new Date().toISOString()
        }
      }));

      const errorMessage = error.userMessage || error.response?.data?.detail || 'Analysis failed';
      toast.error(errorMessage);
    } finally {
      setLoadingPrompts(prev => {
        const newSet = new Set(prev);
        newSet.delete(promptKey);
        return newSet;
      });
    }
  };

  const runCustomAnalysis = async () => {
    if (!customPrompt.trim()) {
      toast.error('Please enter a custom analysis prompt');
      return;
    }

    if (!currentSessionId) {
      toast.error('No session selected. Please process audio first.');
      return;
    }

    const customKey = 'custom_analysis';

    try {
      // Get transcript
      let transcript = getTranscriptFromResults();
      
      if (!transcript) {
        const sessionResponse = await backendApi.getResults(currentSessionId);
        
        if (!sessionResponse?.data?.results?.segments) {
          toast.error('No transcript available for analysis');
          return;
        }

        transcript = sessionResponse.data.results.segments
          .map(segment => `${segment.speaker}: ${segment.text}`)
          .join('\n');
      }

      // Update loading state
      setLoadingPrompts(prev => new Set(prev).add(customKey));
      setAnalysisProgress(prev => ({
        ...prev,
        [customKey]: { 
          status: 'processing', 
          progress: 0,
          timestamp: new Date().toISOString()
        }
      }));

      // Create custom prompt with transcript
      const fullPrompt = customPrompt.replace('{transcript}', transcript);

      // Process with LLM (using custom processing)
      const analysisResponse = await backendApi.processWithLLM({
        transcript,
        prompt_key: 'custom',
        custom_prompt: fullPrompt
      });

      // Update results for custom analysis
      setAnalysisResults(prev => ({
        ...prev,
        [customKey]: {
          response: analysisResponse.data.result || analysisResponse.data.response,
          result: analysisResponse.data.result || analysisResponse.data.response,
          model: analysisResponse.data.model,
          prompt_title: 'Custom Analysis',
          prompt_key: customKey,
          timestamp: new Date().toISOString(),
          custom_prompt: customPrompt,
          processing_time: analysisResponse.data.processing_time,
          ...analysisResponse.data
        }
      }));

      setAnalysisProgress(prev => ({
        ...prev,
        [customKey]: { 
          status: 'completed', 
          progress: 100,
          timestamp: new Date().toISOString()
        }
      }));

      toast.success('Custom analysis completed');

    } catch (error) {
      console.error('Custom analysis failed:', error);
      
      setAnalysisProgress(prev => ({
        ...prev,
        [customKey]: { 
          status: 'failed', 
          progress: 0,
          error: error.userMessage || 'Custom analysis failed',
          timestamp: new Date().toISOString()
        }
      }));

      toast.error(error.userMessage || 'Custom analysis failed');
    } finally {
      setLoadingPrompts(prev => {
        const newSet = new Set(prev);
        newSet.delete(customKey);
        return newSet;
      });
    }
  };

  const downloadAnalysis = (promptKey) => {
    const result = analysisResults[promptKey];
    const prompt = prompts.find(p => p.key === promptKey);
    const title = promptKey === 'custom_analysis' ? 'Custom Analysis' : prompt?.title || 'Analysis';

    console.log('📥 Download request for:', promptKey);
    console.log('📦 Result data:', result);

    if (!result || !(result.response || result.result)) {
      toast.error('No analysis result available to download');
      return;
    }

    const responseText = result.response || result.result;

    const content = `AI ANALYSIS REPORT
${'='.repeat(50)}

Analysis Type: ${title}
Generated: ${new Date().toLocaleString()}
Model: ${result.model || 'Unknown'}
Session: ${currentSessionId}

${'='.repeat(50)}

${responseText}

${'='.repeat(50)}
Generated by AI Speech Diarization Platform
Processing Time: ${result.processing_time?.toFixed(2)}s
Timestamp: ${result.timestamp}
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
                         prompt.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || prompt.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Enhanced session validation
  const hasValidSession = () => {
    // Check if we have a current session ID
    if (!currentSessionId) {
      console.log('❌ No current session ID');
      return false;
    }

    // Check if we have results in store
    if (results && results.segments && results.segments.length > 0) {
      console.log('✅ Valid session with results in store');
      return true;
    }

    // Check if session exists in active sessions and has results
    if (activeSessions.has(currentSessionId)) {
      const sessionData = activeSessions.get(currentSessionId);
      if (sessionData.results && sessionData.results.segments) {
        console.log('✅ Valid session with results in active sessions');
        return true;
      }
    }

    // Check if processing status indicates completion
    if (processingStatus && processingStatus.status === 'completed') {
      console.log('✅ Valid session with completed processing status');
      return true;
    }

    console.log('❌ No valid session or results found');
    return false;
  };

  const isValidSession = hasValidSession();
  const sessionData = activeSessions.has(currentSessionId) ? activeSessions.get(currentSessionId) : null;

  // Show connection error if backend is not available
  if (!backendStatus.connected) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-8 max-w-md w-full text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Backend Disconnected</h2>
          <p className="text-gray-400 mb-6">
            Cannot connect to the analysis backend. Please check that the server is running.
          </p>
          <div className="bg-gray-700 rounded-lg p-4 text-left text-sm">
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
            </div>
          </div>
        </div>

        {/* Session Status Info */}
        {isValidSession && (
          <div className="mb-8 bg-gray-800 rounded-xl border border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="px-3 py-2 bg-green-500/20 border border-green-500/30 rounded-lg">
                  <span className="text-green-400 font-medium">Active Session</span>
                </div>
                
                <div className="flex items-center space-x-4 text-sm text-gray-400">
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-green-400">Ready for Analysis</span>
                  </div>
                </div>
              </div>
              
              <button
                onClick={clearAnalysisHistory}
                className="px-3 py-2 text-gray-400 hover:text-white transition-colors text-sm"
              >
                Clear History
              </button>
            </div>
          </div>
        )}

        {/* No Session Warning */}
        {!isValidSession && (
          <div className="mb-8 bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-6">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-6 h-6 text-yellow-400" />
              <div>
                <h3 className="text-yellow-400 font-medium">No Active Session</h3>
                <p className="text-gray-400 text-sm">
                  Please process an audio file first to enable analysis features.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filter Controls */}
        <div className="mb-6 bg-gray-800 rounded-xl border border-gray-700 p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search analysis prompts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>
              
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              >
                {categories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="text-sm text-gray-400">
              {filteredPrompts.length} of {prompts.length} prompts
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Predefined Analysis */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold text-white mb-4">Predefined Analysis</h2>
            
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
                    ? 'No prompts found in the database'
                    : 'Try adjusting your search or filter criteria'
                  }
                </p>
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
          <div className="lg:col-span-1">
            <h2 className="text-xl font-semibold text-white mb-4">Custom Analysis</h2>
            
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Lightbulb className="w-5 h-5 text-yellow-400" />
                <h3 className="font-medium text-white">Create Custom Prompt</h3>
              </div>
              
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Enter your custom analysis prompt here. Use {transcript} as placeholder for the transcript content."
                className="w-full h-32 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 resize-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              />
              
              <div className="mt-4 text-xs text-gray-400">
                <strong>Tip:</strong> Include <code className="text-cyan-400">{'{transcript}'}</code> in your prompt where you want the transcript inserted.
              </div>
              
              <button
                onClick={runCustomAnalysis}
                disabled={!customPrompt.trim() || !isValidSession || loadingPrompts.has('custom_analysis')}
                className="w-full mt-4 px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
              >
                {loadingPrompts.has('custom_analysis') ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>Run Custom Analysis</span>
                  </>
                )}
              </button>
            </div>

            {/* Custom Analysis Result */}
            {analysisResults['custom_analysis'] && (
              <div className="mt-6 bg-gray-800 rounded-xl border border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-white">Custom Analysis Result</h3>
                  <button
                    onClick={() => downloadAnalysis('custom_analysis')}
                    className="text-cyan-400 hover:text-cyan-300 text-sm"
                  >
                    Download
                  </button>
                </div>
                
                <div className="text-gray-300 text-sm whitespace-pre-wrap">
                  {analysisResults['custom_analysis'].result || analysisResults['custom_analysis'].response}
                </div>
                
                <div className="mt-4 text-xs text-gray-500">
                  Generated: {new Date(analysisResults['custom_analysis'].timestamp).toLocaleString()}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisPage;