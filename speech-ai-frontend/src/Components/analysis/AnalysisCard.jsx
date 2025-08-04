// src/components/analysis/AnalysisCard.jsx (Enhanced)
import React from 'react';
import { motion } from 'framer-motion';
import { 
  Brain, 
  Download, 
  CheckCircle, 
  Loader2, 
  AlertCircle 
} from 'lucide-react';

const AnalysisCard = ({ 
  analysis,
  selectedSession,
  analysisResults,
  analysisProgress,
  loadingPrompts,
  onRunAnalysis,
  onDownload
}) => {
  const Icon = analysis.icon;
  const isLoading = loadingPrompts.has(analysis.key);
  const analysisKey = `${selectedSession}_${analysis.key}`;
  const result = analysisResults[analysisKey];
  const progress = analysisProgress[analysisKey];

  const formatAnalysisText = (text) => {
    console.log('formatAnalysisText called with:', text);
    console.log('Text type:', typeof text);
    console.log('Text length:', text?.length);
    
    if (!text) {
      console.log('No text provided, returning fallback');
      return <div className="text-gray-500">No content available</div>;
    }
    
    const lines = text.split('\n');
    console.log('Split into lines:', lines.length, lines);
    
    return lines.map((line, index) => {
      console.log(`Processing line ${index}:`, line);
      
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800 rounded-xl border border-gray-700 p-6 hover:border-gray-600 transition-colors"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <Icon className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-semibold text-white">
              {analysis.title}
            </h3>
            {progress && (
              <span className={`px-2 py-1 text-xs rounded-full ${
                progress.status === 'processing' ? 'bg-yellow-500 text-yellow-900' :
                progress.status === 'completed' ? 'bg-green-500 text-green-900' :
                'bg-red-500 text-red-900'
              }`}>
                {progress.status}
              </span>
            )}
          </div>
          <p className="text-gray-400 text-sm">
            {analysis.description}
          </p>
        </div>
        
        <button
          onClick={() => onRunAnalysis(analysis.key)}
          disabled={isLoading || (progress && progress.status === 'processing')}
          className={`ml-4 px-4 py-2 bg-gradient-to-r ${analysis.gradient} text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center space-x-2`}
        >
          {isLoading || (progress && progress.status === 'processing') ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <Brain className="w-4 h-4" />
              <span>Analyze</span>
            </>
          )}
        </button>
      </div>

      {/* Results */}
      {result && result.response && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="border-t border-gray-700 pt-4 mt-4"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span>Analysis completed</span>
              <span>•</span>
              <span>{result.processing_time?.toFixed(1)}s</span>
            </div>
            <button
              onClick={() => onDownload(analysis.key)}
              className="flex items-center space-x-2 px-3 py-1 bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600 transition-colors text-sm"
            >
              <Download className="w-3 h-3" />
              <span>Download</span>
            </button>
          </div>
          
          <div className="bg-gray-700 rounded-lg p-4 max-h-64 overflow-y-auto">
            {/* Debug display */}
            <div className="mb-4 p-2 bg-gray-800 rounded text-xs text-yellow-300">
              <div>Debug - Raw Response Length: {result.response?.length || 0}</div>
              <div>Debug - Response Type: {typeof result.response}</div>
              <div className="max-h-20 overflow-y-auto">
                Raw: {JSON.stringify(result.response?.substring(0, 200))}...
              </div>
            </div>
            
            <div className="prose prose-sm max-w-none text-gray-300">
              {formatAnalysisText(result.response)}
            </div>
          </div>
        </motion.div>
      )}

      {/* Error State */}
      {result && result.error && (
        <div className="border-t border-gray-700 pt-4 mt-4">
          <div className="flex items-center space-x-2 text-sm text-red-400 mb-2">
            <AlertCircle className="w-4 h-4" />
            <span>Analysis failed</span>
          </div>
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">
            {result.error}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default AnalysisCard;