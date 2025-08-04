// src/components/analysis/CustomAnalysisPanel.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { 
  Sparkles,
  Loader2,
  CheckCircle,
  AlertCircle,
  Download
} from 'lucide-react';

const CustomAnalysisPanel = ({ 
  customPrompt,
  setCustomPrompt,
  onRunCustomAnalysis,
  loadingPrompts,
  selectedSession,
  analysisResults,
  analysisProgress,
  onDownload
}) => {
  const formatAnalysisText = (text) => {
    if (!text) {
      return <div className="text-gray-500">No content available</div>;
    }
    
    const lines = text.split('\n');
    
    return lines.map((line, index) => {
      if (line.startsWith('**') && line.endsWith('**')) {
        return (
          <h4 key={index} className="text-lg font-semibold text-gray-200 mt-4 mb-2">
            {line.replace(/\*\*/g, '')}
          </h4>
        );
      }
      if (line.startsWith('###')) {
        return (
          <h5 key={index} className="text-md font-medium text-gray-300 mt-3 mb-2">
            {line.replace(/###/g, '')}
          </h5>
        );
      }
      if (line.startsWith('- ') || line.startsWith('• ')) {
        return (
          <li key={index} className="ml-4 text-gray-300 mb-1 list-disc">
            {line.replace(/^[•\-]\s/, '')}
          </li>
        );
      }
      if (line.includes('**')) {
        return (
          <p key={index} className="text-gray-300 mb-2" dangerouslySetInnerHTML={{
            __html: line.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-100">$1</strong>')
          }} />
        );
      }
      if (line.trim()) {
        return <p key={index} className="text-gray-300 mb-2">{line}</p>;
      }
      return <br key={index} />;
    });
  };

  const customKey = `${selectedSession}_custom`;
  const customResult = analysisResults[customKey];
  const customProgress = analysisProgress[customKey];

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white mb-2 flex items-center">
          <Sparkles className="w-5 h-5 text-cyan-400 mr-2" />
          💡 Custom Prompt
        </h3>
        <p className="text-gray-400 text-sm mb-4">
          Write your own analysis prompt. Use {'{transcript}'} to reference the conversation.
        </p>
      </div>

      <div className="space-y-4">
        <textarea
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          placeholder="Example: Analyze the key decisions made in this conversation and identify any risks or concerns mentioned..."
          className="w-full h-32 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
        />
        
        <button
          onClick={onRunCustomAnalysis}
          disabled={!customPrompt.trim() || loadingPrompts.has('custom')}
          className="w-full px-4 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-lg hover:from-cyan-600 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
        >
          {loadingPrompts.has('custom') ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Processing Custom Analysis...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              <span>Run Custom Analysis</span>
            </>
          )}
        </button>
      </div>

      {/* Custom Results */}
      {customResult && customResult.response && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="border-t border-gray-700 pt-4 mt-4"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span>Custom analysis completed</span>
              <span>•</span>
              <span>{customResult.processing_time?.toFixed(1)}s</span>
            </div>
            <button
              onClick={() => onDownload('custom')}
              className="flex items-center space-x-2 px-3 py-1 bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600 transition-colors text-sm"
            >
              <Download className="w-3 h-3" />
              <span>Download</span>
            </button>
          </div>
          
          <div className="bg-gray-700 rounded-lg p-4 max-h-64 overflow-y-auto">
            {/* Debug display */}
            <div className="mb-4 p-2 bg-gray-800 rounded text-xs text-yellow-300">
              <div>Debug - Raw Response Length: {customResult.response?.length || 0}</div>
              <div>Debug - Response Type: {typeof customResult.response}</div>
              <div className="max-h-20 overflow-y-auto">
                Raw: {JSON.stringify(customResult.response?.substring(0, 200))}...
              </div>
            </div>
            
            <div className="prose prose-sm max-w-none text-gray-300">
              {formatAnalysisText(customResult.response)}
            </div>
          </div>
        </motion.div>
      )}

      {/* Custom Error State */}
      {customResult && customResult.error && (
        <div className="border-t border-gray-700 pt-4 mt-4">
          <div className="flex items-center space-x-2 text-sm text-red-400 mb-2">
            <AlertCircle className="w-4 h-4" />
            <span>Custom analysis failed</span>
          </div>
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">
            {customResult.error}
          </div>
        </div>
      )}

      {/* Custom Processing State */}
      {customProgress && customProgress.status === 'processing' && (
        <div className="border-t border-gray-700 pt-4 mt-4">
          <div className="flex items-center space-x-2 text-sm text-yellow-400 mb-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Custom analysis in progress...</span>
          </div>
          <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3 text-sm text-yellow-400">
            Started at {new Date(customProgress.startTime).toLocaleTimeString()}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomAnalysisPanel;