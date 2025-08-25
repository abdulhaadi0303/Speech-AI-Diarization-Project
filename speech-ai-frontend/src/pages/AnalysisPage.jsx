// src/pages/AnalysisPage.jsx - Restructured into 3 Main Components
import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Zap,
  Sparkles
} from 'lucide-react';

// Import components
import UnifiedAnalysisCard from '../Components/analysis/UnifiedAnalysisCard';
import { useBackend } from '../contexts/BackendContext';
import { backendApi } from '../services/api';
import useAppStore from '../stores/appStore';

// ================================
// 1. HEADER COMPONENT
// ================================
const AnalysisPageHeader = ({ isValidSession, currentSessionId }) => {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold mb-2 flex items-center">
        <Brain className="w-8 h-8 text-cyan-400 mr-3" />
        AI Analysis Dashboard
      </h1>
      
      {/* Session Status Warning */}
      {!isValidSession && (
        <div className="mt-4 p-4 bg-yellow-900/20 border border-yellow-700 rounded-lg">
          <div className="flex items-center space-x-2 text-yellow-400">
            <AlertTriangle className="w-5 h-5" />
            <span>No active session found. Please upload and process audio first.</span>
          </div>
        </div>
      )}
    </div>
  );
};

// ================================
// 2. CUSTOM ANALYSIS PANEL COMPONENT
// ================================
const CustomAnalysisPanel = ({ 
  customPrompt, 
  setCustomPrompt, 
  runAnalysis, 
  loadingPrompts, 
  analysisResults, 
  analysisProgress, 
  isValidSession 
}) => {
  return (
    <div className="lg:col-span-1">
      <h2 className="text-xl font-semibold text-white mb-4">Custom Analysis</h2>
      
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Sparkles className="w-5 h-5 text-yellow-400" />
          <h3 className="font-medium text-white">Create Custom Prompt</h3>
        </div>
        
        <div className="mb-4">
          <p className="text-gray-400 text-sm mb-4">
            Write your own analysis prompt. Use {'{transcript}'} to reference the conversation.
          </p>
        </div>
        
        <textarea
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          placeholder="Example: Analyze the key decisions made in this conversation and identify any risks or concerns mentioned..."
          className="w-full h-32 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 resize-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
        />
        
        <button
          onClick={() => {
            console.log(`🎯 Custom analysis button clicked, runAnalysis type:`, typeof runAnalysis);
            runAnalysis('custom_analysis');
          }}
          disabled={!isValidSession || !customPrompt.trim() || loadingPrompts.has('custom_analysis')}
          className={`w-full mt-4 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center space-x-2 ${
            isValidSession && customPrompt.trim() && !loadingPrompts.has('custom_analysis')
              ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white hover:from-cyan-600 hover:to-cyan-700'
              : 'bg-gray-600 text-gray-400 cursor-not-allowed'
          }`}
        >
          {loadingPrompts.has('custom_analysis') ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Processing Custom Analysis...</span>
            </>
          ) : (
            <>
              <Zap className="w-5 h-5" />
              <span>Run Custom Analysis</span>
            </>
          )}
        </button>

        {/* Custom Analysis Results */}
        {analysisResults['custom_analysis'] && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4 border-t border-gray-700 pt-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>Custom analysis completed</span>
                {analysisResults['custom_analysis'].processing_time && (
                  <>
                    <span>•</span>
                    <span>{analysisResults['custom_analysis'].processing_time.toFixed(1)}s</span>
                  </>
                )}
              </div>
              <button
                onClick={() => {
                  const result = analysisResults['custom_analysis'];
                  if (result?.response || result?.result) {
                    const blob = new Blob([result.response || result.result], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `custom_analysis.txt`;
                    link.click();
                    URL.revokeObjectURL(url);
                    toast.success('Custom analysis downloaded');
                  }
                }}
                className="flex items-center space-x-1 px-3 py-1 m-2 bg-cyan-600 hover:bg-cyan-700 text-white text-sm rounded transition-colors"
              >
                <Sparkles className="w-3 h-3"  />
                <span>Download</span>
              </button>
            </div>
            <div className="bg-gray-700 rounded-lg p-3 max-h-64 overflow-y-auto">
              <div className="text-gray-300 text-sm whitespace-pre-wrap">
                {analysisResults['custom_analysis']?.response || 
                 analysisResults['custom_analysis']?.result || 
                 'No content available'}
              </div>
            </div>
          </motion.div>
        )}

        {/* Custom Analysis Progress */}
        {analysisProgress['custom_analysis'] && (
          <div className="mt-4">
            {analysisProgress['custom_analysis'].status === 'processing' && (
              <div className="flex items-center space-x-2 text-blue-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Processing custom analysis...</span>
              </div>
            )}
            
            {analysisProgress['custom_analysis'].status === 'failed' && (
              <div className="flex items-center space-x-2 text-red-400">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm">
                  {analysisProgress['custom_analysis'].error || 'Custom analysis failed'}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ================================
// 3. MAIN ANALYSIS COMPONENT (Cards + Search + Filters)
// ================================
const AnalysisMain = ({ 
  prompts, 
  loadingPromptData, 
  searchTerm, 
  setSearchTerm, 
  selectedCategory, 
  setSelectedCategory, 
  filteredPrompts, 
  currentSessionId, 
  analysisResults, 
  analysisProgress, 
  loadingPrompts, 
  runAnalysis 
}) => {
  const categories = ['all', 'general', 'meeting', 'content', 'analysis', 'productivity'];

  return (
    <div className="lg:col-span-2">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Analysis Tools</h2>
        <button
          onClick={() => window.location.reload()}
          className="flex items-center space-x-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Search and Filter Section */}
      <div className="mb-6 space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search analysis tools..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          />
        </div>

        {/* Category Filter Buttons */}
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-cyan-500 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Prompts Grid Section */}
      {loadingPromptData ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
          <span className="ml-2 text-gray-400">Loading analysis tools...</span>
        </div>
      ) : filteredPrompts.length === 0 ? (
        <div className="text-center py-12 bg-gray-800 rounded-xl border border-gray-700">
          <Brain className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 mb-2">No analysis prompts available</p>
          <p className="text-gray-500 text-sm">
            {prompts.length === 0 
              ? 'No prompts loaded from server' 
              : 'Try adjusting your search or filter criteria'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPrompts.map((prompt) => {
            // Debug logging for each card render
            console.log(`🃏 RENDERING CARD for ${prompt.key}:`, {
              promptKey: prompt.key,
              onRunAnalysisType: typeof runAnalysis,
              onRunAnalysisExists: !!runAnalysis
            });
            
            return (
              <div key={prompt.key} className="w-full">
                <UnifiedAnalysisCard
                  prompt={prompt}
                  selectedSession={currentSessionId}
                  analysisResults={analysisResults}
                  analysisProgress={analysisProgress}
                  isLoading={loadingPrompts.has(prompt.key)}
                  onRunAnalysis={runAnalysis}
                  onDownload={(promptKey) => {
                    console.log('📥 Download requested for:', promptKey);
                    const result = analysisResults[promptKey];
                    if (result?.response || result?.result) {
                      const blob = new Blob([result.response || result.result], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = `analysis_${promptKey}.txt`;
                      link.click();
                      URL.revokeObjectURL(url);
                      toast.success('Analysis downloaded');
                    } else {
                      toast.error('No result to download');
                    }
                  }}
                  showUsageStats={false}
                  isAdminView={false}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ================================
// 4. MAIN ANALYSIS PAGE COMPONENT (Orchestrator)
// ================================
const AnalysisPage = () => {
  // Local UI state only
  const [prompts, setPrompts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loadingPromptData, setLoadingPromptData] = useState(false);
  const [loadingPrompts, setLoadingPrompts] = useState(new Set());
  
  // ✅ CRITICAL: Use Zustand store for persistent state
  const currentSessionId = useAppStore((state) => state.currentSessionId);
  const results = useAppStore((state) => state.results);
  const processingStatus = useAppStore((state) => state.processingStatus);
  const customPrompt = useAppStore((state) => state.customPrompt);
  const setCustomPrompt = useAppStore((state) => state.setCustomPrompt);
  
  // ✅ MOST IMPORTANT: Analysis results from Zustand store
  const analysisResults = useAppStore((state) => state.analysisResults);
  const setAnalysisResults = useAppStore((state) => state.setAnalysisResults);
  const analysisProgress = useAppStore((state) => state.analysisProgress);
  const setAnalysisProgress = useAppStore((state) => state.setAnalysisProgress);

  const getTranscriptFromResults = () => {
    if (!results?.segments) return null;
    return results.segments
      .map(segment => `${segment.speaker}: ${segment.text}`)
      .join('\n');
  };

  // ✅ CORE ANALYSIS FUNCTION - Main business logic
  const runAnalysis = useCallback(async (promptKey) => {
    console.log(`🚀 STARTING ANALYSIS FOR: ${promptKey}`);
    console.log(`📊 Function type check:`, typeof runAnalysis);
    console.log(`📊 PromptKey type:`, typeof promptKey);

    if (!currentSessionId || !results) {
      toast.error('Please process audio first.');
      return;
    }

    try {
      // Get transcript
      let transcript = getTranscriptFromResults();
      
      if (!transcript) {
        console.log(`📄 STEP 2: No transcript in results, fetching from API...`);
        const sessionResponse = await backendApi.getResults(currentSessionId);
        if (!sessionResponse?.data?.results?.segments) {
          toast.error('No transcript available for analysis.');
          return;
        }
        transcript = sessionResponse.data.results.segments
          .map(segment => `${segment.speaker}: ${segment.text}`)
          .join('\n');
      }

      console.log(`📄 STEP 3: Transcript ready, length: ${transcript.length} characters`);

      // Update loading state
      setLoadingPrompts(prev => new Set(prev).add(promptKey));
      
      // Update progress to processing
      console.log(`📈 STEP 4: Setting progress to processing for ${promptKey}...`);
      const newProgressBefore = {
        ...analysisProgress,
        [promptKey]: { 
          status: 'processing', 
          progress: 0,
          timestamp: new Date().toISOString()
        }
      };
      
      setAnalysisProgress(newProgressBefore);

      // ✅ FIXED: Handle custom analysis differently
      let apiPayload;
      if (promptKey === 'custom_analysis') {
        if (!customPrompt || !customPrompt.trim()) {
          toast.error('Please enter a custom prompt first.');
          setLoadingPrompts(prev => {
            const newSet = new Set(prev);
            newSet.delete(promptKey);
            return newSet;
          });
          return;
        }
        
        console.log(`💡 STEP 5: Using custom prompt: ${customPrompt.substring(0, 100)}...`);
        
        // ✅ CRITICAL: Include custom_prompt in payload
        apiPayload = {
          transcript,
          prompt_key: promptKey,
          custom_prompt: customPrompt
        };
      } else {
        // Find the prompt for regular prompts
        const prompt = prompts.find(p => p.key === promptKey);
        if (!prompt) {
          throw new Error('Prompt not found');
        }
        console.log(`🔍 STEP 5: Found prompt:`, prompt);

        apiPayload = {
          transcript,
          prompt_key: promptKey
        };
      }
      
      console.log(`🌐 STEP 6: Making API call to /api/llm-process...`);
      console.log(`🌐 STEP 6a: API payload:`, apiPayload);
      
      const analysisResponse = await backendApi.post('/api/llm-process', apiPayload);

      console.log(`✅ STEP 7: Analysis API response received:`, {
        status: analysisResponse.status,
        data: analysisResponse.data,
        hasResult: !!(analysisResponse.data?.result || analysisResponse.data?.response)
      });

      if (analysisResponse.data?.result || analysisResponse.data?.response) {
        const resultData = {
          ...analysisResponse.data,
          response: analysisResponse.data.result || analysisResponse.data.response,
          timestamp: new Date().toISOString(),
          prompt_key: promptKey,
          session_id: currentSessionId
        };

        console.log(`💾 STEP 8: Storing result for ${promptKey}:`, resultData);
        
        setAnalysisResults({
          ...analysisResults,
          [promptKey]: resultData
        });

        setAnalysisProgress({
          ...analysisProgress,
          [promptKey]: {
            status: 'completed',
            progress: 100,
            timestamp: new Date().toISOString()
          }
        });

        // ✅ FIXED: Success message for custom prompts
        const promptTitle = promptKey === 'custom_analysis' ? 'Custom Analysis' : 
                           prompts.find(p => p.key === promptKey)?.title || promptKey;
        toast.success(`${promptTitle} completed successfully!`);
      } else {
        throw new Error('No result received from API');
      }

    } catch (error) {
      console.error(`❌ Analysis failed for ${promptKey}:`, error);
      
      const errorMessage = error.response?.data?.detail || error.message || 'Analysis failed';
      
      setAnalysisProgress({
        ...analysisProgress,
        [promptKey]: {
          status: 'failed',
          progress: 0,
          error: errorMessage,
          timestamp: new Date().toISOString()
        }
      });

      toast.error(`Analysis failed: ${errorMessage}`);
    } finally {
      setLoadingPrompts(prev => {
        const newSet = new Set(prev);
        newSet.delete(promptKey);
        return newSet;
      });
    }
  }, [currentSessionId, results, customPrompt, prompts, analysisResults, analysisProgress, setAnalysisResults, setAnalysisProgress]);

  // ✅ Debug logging for runAnalysis function
  useEffect(() => {
    console.log(`🔧 runAnalysis function created:`, typeof runAnalysis);
    console.log(`🔧 runAnalysis is function:`, typeof runAnalysis === 'function');
  }, [runAnalysis]);

  // Load prompts data
  useEffect(() => {
    const loadPrompts = async () => {
      setLoadingPromptData(true);
      try {
        console.log('📥 Loading public prompts...');
        const response = await backendApi.prompts.getPublic();
        
        if (response?.data && Array.isArray(response.data)) {
          const promptsData = response.data.map(prompt => ({
            ...prompt,
            key: prompt.key,
            title: prompt.title,
            description: prompt.description || '',
            category: prompt.category || 'general',
            icon: prompt.icon || 'Brain',
            emoji: prompt.emoji || '🤖',
            estimated_time: prompt.estimated_time || 30,
            gradient_from: prompt.gradient_from || 'cyan-500',
            gradient_to: prompt.gradient_to || 'cyan-600',
            max_tokens: prompt.max_tokens || 2000,
            is_active: true
          }));
          
          console.log(`✅ Loaded ${promptsData.length} public prompts:`, promptsData);
          setPrompts(promptsData);
          
          if (promptsData.length === 0) {
            toast.info('No active prompts available for analysis');
          }
        } else {
          throw new Error('Invalid response format from public API');
        }
        
      } catch (error) {
        console.error('❌ Failed to load public prompts:', error);
        
        // ✅ Fallback to hardcoded prompts
        const fallbackPrompts = [
          {
            key: 'summary',
            title: 'Conversation Summary',
            description: 'Generate a comprehensive summary of the entire conversation',
            category: 'general',
            icon: 'FileText',
            emoji: '📋',
            estimated_time: 30,
            gradient_from: 'cyan-500',
            gradient_to: 'cyan-600',
            max_tokens: 2000,
            is_active: true
          },
          {
            key: 'action_items',
            title: 'Action Items & Tasks',
            description: 'Extract actionable tasks and commitments from the conversation',
            category: 'productivity',
            icon: 'CheckSquare',
            emoji: '✅',
            estimated_time: 25,
            gradient_from: 'green-500',
            gradient_to: 'green-600',
            max_tokens: 1500,
            is_active: true
          }
        ];
        
        setPrompts(fallbackPrompts);
        toast.warning('Using fallback prompts - some features may be limited');
      } finally {
        setLoadingPromptData(false);
      }
    };

    loadPrompts();
  }, []);

  // Filter prompts based on search and category
  const filteredPrompts = prompts.filter(prompt => {
    const matchesSearch = prompt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prompt.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || prompt.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const isValidSession = currentSessionId && results;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* 1. HEADER SECTION */}
        <AnalysisPageHeader 
          isValidSession={isValidSession}
          currentSessionId={currentSessionId}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 2. MAIN ANALYSIS SECTION (Left 2/3) */}
          <AnalysisMain 
            prompts={prompts}
            loadingPromptData={loadingPromptData}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            filteredPrompts={filteredPrompts}
            currentSessionId={currentSessionId}
            analysisResults={analysisResults}
            analysisProgress={analysisProgress}
            loadingPrompts={loadingPrompts}
            runAnalysis={runAnalysis}
          />

          {/* 3. CUSTOM ANALYSIS PANEL (Right 1/3) */}
          <CustomAnalysisPanel 
            customPrompt={customPrompt}
            setCustomPrompt={setCustomPrompt}
            runAnalysis={runAnalysis}
            loadingPrompts={loadingPrompts}
            analysisResults={analysisResults}
            analysisProgress={analysisProgress}
            isValidSession={isValidSession}
          />
        </div>
      </div>
    </div>
  );
};

export default AnalysisPage;