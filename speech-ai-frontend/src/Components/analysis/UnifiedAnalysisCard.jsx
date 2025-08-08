// src/components/analysis/UnifiedAnalysisCard.jsx - Single reusable card component
import React from 'react';
import { motion } from 'framer-motion';
import { 
  Brain, 
  Download, 
  CheckCircle, 
  Loader2, 
  AlertCircle,
  Clock,
  TrendingUp,
  Eye,
  EyeOff
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';

const UnifiedAnalysisCard = ({ 
  prompt,                    // Prompt object from database
  selectedSession,
  analysisResults,
  analysisProgress,
  isLoading,
  onRunAnalysis,
  onDownload,
  showUsageStats = false,
  isAdminView = false,
  onToggleStatus,
  onEdit,
  onDelete
}) => {
  // Get the appropriate icon component
  const IconComponent = LucideIcons[prompt.icon] || Brain;
  
  const analysisKey = `${selectedSession}_${prompt.key}`;
  const result = analysisResults[analysisKey];
  const progress = analysisProgress[analysisKey];

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

  const getGradientClass = () => {
    return `from-${prompt.gradient_from} to-${prompt.gradient_to}`;
  };

  const getCategoryColor = () => {
    const colors = {
      general: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      meeting: 'bg-green-500/20 text-green-400 border-green-500/30',
      content: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      analysis: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      productivity: 'bg-red-500/20 text-red-400 border-red-500/30'
    };
    return colors[prompt.category] || colors.general;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gray-800 rounded-xl border border-gray-700 p-6 hover:border-gray-600 transition-all duration-200 ${
        !prompt.is_active ? 'opacity-60' : ''
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-3 bg-gradient-to-r ${getGradientClass()} rounded-lg`}>
            <IconComponent className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="text-lg font-semibold text-white">
                {prompt.emoji} {prompt.title}
              </h3>
              {!prompt.is_active && (
                <span className="px-2 py-1 text-xs bg-gray-600 text-gray-300 rounded">
                  Inactive
                </span>
              )}
              {prompt.is_system && (
                <span className="px-2 py-1 text-xs bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded">
                  System
                </span>
              )}
            </div>
            <p className="text-gray-400 text-sm">{prompt.description}</p>
          </div>
        </div>

        {/* Admin Actions */}
        {isAdminView && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onToggleStatus(prompt.id)}
              className={`p-2 rounded-lg transition-colors ${
                prompt.is_active 
                  ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30' 
                  : 'bg-gray-600/20 text-gray-400 hover:bg-gray-600/30'
              }`}
              title={prompt.is_active ? 'Deactivate' : 'Activate'}
            >
              {prompt.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
            <button
              onClick={() => onEdit(prompt)}
              className="p-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-colors"
              title="Edit Prompt"
            >
              <IconComponent className="w-4 h-4" />
            </button>
            {!prompt.is_system && (
              <button
                onClick={() => onDelete(prompt.id)}
                className="p-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-colors"
                title="Delete Prompt"
              >
                <AlertCircle className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Category and Stats */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <span className={`px-2 py-1 text-xs rounded border ${getCategoryColor()}`}>
            {prompt.category}
          </span>
          <div className="flex items-center space-x-1 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            <span>~{prompt.estimated_time}s</span>
          </div>
          {showUsageStats && (
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              <TrendingUp className="w-3 h-3" />
              <span>{prompt.usage_count} uses</span>
            </div>
          )}
        </div>

        {/* Run Analysis Button */}
        {!isAdminView && prompt.is_active && (
          <button
            onClick={() => onRunAnalysis(prompt.key)}
            disabled={isLoading}
            className={`px-4 py-2 bg-gradient-to-r ${getGradientClass()} text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2`}
          >
            {isLoading ? (
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
        )}
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
              {result.model && (
                <>
                  <span>•</span>
                  <span>{result.model}</span>
                </>
              )}
            </div>
            <button
              onClick={() => onDownload(prompt.key)}
              className="flex items-center space-x-2 px-3 py-1 bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600 transition-colors text-sm"
            >
              <Download className="w-3 h-3" />
              <span>Download</span>
            </button>
          </div>
          
          <div className="bg-gray-700 rounded-lg p-4 max-h-64 overflow-y-auto">
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

      {/* Progress State */}
      {progress && progress.status === 'processing' && (
        <div className="border-t border-gray-700 pt-4 mt-4">
          <div className="flex items-center space-x-2 text-sm text-blue-400 mb-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Processing analysis...</span>
          </div>
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 text-sm text-blue-400">
            Started: {new Date(progress.startTime).toLocaleTimeString()}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default UnifiedAnalysisCard;