// src/components/analysis/UnifiedAnalysisCard.jsx - Fixed Results Display
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
  
  // Get results and progress for this specific prompt
  const result = analysisResults[prompt.key];
  const progress = analysisProgress[prompt.key];

  // Debug logging
  console.log(`🔍 UnifiedAnalysisCard Debug for ${prompt.key}:`, {
    prompt: prompt.key,
    result,
    progress,
    isLoading,
    analysisResults: Object.keys(analysisResults),
    analysisProgress: Object.keys(analysisProgress)
  });

  const formatAnalysisText = (text) => {
    if (!text) {
      return <div className="text-gray-500">No content available</div>;
    }
    
    const lines = text.split('\n');
    
    return lines.map((line, index) => {
      if (line.trim() === '') {
        return <div key={index} className="mb-2"></div>;
      }
      
      if (line.startsWith('**') && line.endsWith('**')) {
        return (
          <h4 key={index} className="text-lg font-semibold text-gray-200 mt-4 mb-2">
            {line.replace(/\*\*/g, '')}
          </h4>
        );
      }
      
      if (line.startsWith('###')) {
        return (
          <h5 key={index} className="text-md font-medium text-gray-900 mt-3 mb-2">
            {line.replace(/###/g, '').trim()}
          </h5>
        );
      }
      
      if (line.startsWith('- ') || line.startsWith('• ')) {
        return (
          <li key={index} className="ml-4 text-gray-900 mb-1 list-disc">
            {line.replace(/^[•\-]\s/, '')}
          </li>
        );
      }
      
      if (line.includes('**')) {
        return (
          <p key={index} className="text-gray-900 mb-2" dangerouslySetInnerHTML={{
            __html: line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')
          }} />
        );
      }
      
      if (line.trim().match(/^\d+\./)) {
        return (
          <div key={index} className="text-gray-900 mb-2 ml-4">
            {line.trim()}
          </div>
        );
      }
      
      return (
        <p key={index} className="text-gray-900 mb-2">
          {line}
        </p>
      );
    });
  };

  const getGradientClass = () => {
    // If prompt has custom gradient colors, use them
    if (prompt.gradient_from && prompt.gradient_to) {
      return `from-${prompt.gradient_from} to-${prompt.gradient_to}`;
    }
    
    // Otherwise, assign colors based on category
    const categoryGradients = {
      general: 'from-blue-500 to-blue-600',
      meeting: 'from-green-500 to-green-600',
      content: 'from-purple-500 to-purple-600',
      analysis: 'from-yellow-500 to-yellow-600',
      productivity: 'from-orange-500 to-orange-600'
    };
    
    return categoryGradients[prompt.category] || 'from-cyan-500 to-cyan-600';
  };

  const getCategoryColor = () => {
    const categoryColors = {
      general: 'border-blue-500/30 text-blue-400',
      meeting: 'border-green-500/30 text-green-400',
      content: 'border-purple-500/30 text-purple-400',
      analysis: 'border-yellow-500/30 text-yellow-400',
      productivity: 'border-orange-500/30 text-orange-400'
    };
    return categoryColors[prompt.category] || 'border-blue-500/30 text-blue-400';
  };

// Updated UnifiedAnalysisCard Return Section - Light Theme with PsyConTech Brand Colors
return (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-gray-300 transition-all duration-200 shadow-sm hover:shadow-md"
  >
    {/* Header */}
    <div 
      className={`p-4 bg-gradient-to-r ${getGradientClass()}`}
      style={{
        background: prompt.gradient_from && prompt.gradient_to 
          ? `linear-gradient(to right, ${prompt.gradient_from === 'cyan-500' ? '#5AE8C7' : 
              prompt.gradient_from === 'green-500' ? '#10B981' :
              prompt.gradient_from === 'purple-500' ? '#DF72E8' :
              prompt.gradient_from === 'yellow-500' ? '#FFC700' :
              prompt.gradient_from === 'orange-500' ? '#F97316' : '#5AE8C7'}, ${
              prompt.gradient_to === 'cyan-600' ? '#4FD1C7' :
              prompt.gradient_to === 'green-600' ? '#059669' :
              prompt.gradient_to === 'purple-600' ? '#C061CB' :
              prompt.gradient_to === 'yellow-600' ? '#D97706' :
              prompt.gradient_to === 'orange-600' ? '#EA580C' : '#4FD1C7'})`
          : 'linear-gradient(to right, #5AE8C7, #4FD1C7)'
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
            <span className="text-2xl">{prompt.emoji}</span>
          </div>
          <div className="text-white">
            <h3 className="font-semibold text-white">{prompt.title}</h3>
            <p className="text-sm text-white/90">{prompt.description}</p>
          </div>
        </div>
        
        {/* Admin controls */}
        {isAdminView && (
          <div className="flex items-center space-x-1">
            <button
              onClick={() => onToggleStatus(prompt)}
              className={`p-2 rounded-lg transition-colors backdrop-blur-sm ${
                prompt.is_active 
                  ? 'bg-green-600/20 text-green-100 hover:bg-green-600/30' 
                  : 'bg-gray-600/20 text-gray-200 hover:bg-gray-600/30'
              }`}
              title={prompt.is_active ? 'Deactivate' : 'Activate'}
            >
              {prompt.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
            <button
              onClick={() => onEdit(prompt)}
              className="p-2 bg-blue-600/20 text-blue-100 rounded-lg hover:bg-blue-600/30 transition-colors backdrop-blur-sm"
              title="Edit Prompt"
            >
              <IconComponent className="w-4 h-4" />
            </button>
            {!prompt.is_system && (
              <button
                onClick={() => onDelete(prompt.id)}
                className="p-2 bg-red-600/20 text-red-100 rounded-lg hover:bg-red-600/30 transition-colors backdrop-blur-sm"
                title="Delete Prompt"
              >
                <AlertCircle className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>

    {/* Category and Stats */}
    <div className="flex items-center justify-between mb-4 px-4 pt-4">
      <div className="flex items-center space-x-3">
        <span 
          className={`px-2 py-1 text-xs rounded border font-medium ${getCategoryColor()}`}
          style={{
            borderColor: prompt.category === 'general' ? '#5AE8C7' :
                        prompt.category === 'meeting' ? '#10B981' :
                        prompt.category === 'content' ? '#DF72E8' :
                        prompt.category === 'analysis' ? '#FFC700' :
                        prompt.category === 'productivity' ? '#F97316' : '#5AE8C7',
            color: prompt.category === 'general' ? '#0D9488' :
                   prompt.category === 'meeting' ? '#065F46' :
                   prompt.category === 'content' ? '#A21CAF' :
                   prompt.category === 'analysis' ? '#B45309' :
                   prompt.category === 'productivity' ? '#C2410C' : '#0D9488',
            backgroundColor: prompt.category === 'general' ? '#F0FDFA' :
                            prompt.category === 'meeting' ? '#ECFDF5' :
                            prompt.category === 'content' ? '#FAF5FF' :
                            prompt.category === 'analysis' ? '#FFFBEB' :
                            prompt.category === 'productivity' ? '#FFF7ED' : '#F0FDFA'
          }}
        >
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
          className={`px-4 py-2 text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2 shadow-sm font-medium`}
          style={{
            background: prompt.gradient_from && prompt.gradient_to 
              ? `linear-gradient(to right, ${prompt.gradient_from === 'cyan-500' ? '#5AE8C7' : 
                  prompt.gradient_from === 'green-500' ? '#10B981' :
                  prompt.gradient_from === 'purple-500' ? '#DF72E8' :
                  prompt.gradient_from === 'yellow-500' ? '#FFC700' :
                  prompt.gradient_from === 'orange-500' ? '#F97316' : '#5AE8C7'}, ${
                  prompt.gradient_to === 'cyan-600' ? '#4FD1C7' :
                  prompt.gradient_to === 'green-600' ? '#059669' :
                  prompt.gradient_to === 'purple-600' ? '#C061CB' :
                  prompt.gradient_to === 'yellow-600' ? '#D97706' :
                  prompt.gradient_to === 'orange-600' ? '#EA580C' : '#4FD1C7'})`
              : 'linear-gradient(to right, #5AE8C7, #4FD1C7)'
          }}
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

    {/* Processing State */}
    {progress && progress.status === 'processing' && (
      <div className="px-4 pb-4">
        <div className="border rounded-lg p-3" style={{ 
          backgroundColor: '#F0FDFA', 
          borderColor: '#5AE8C7' 
        }}>
          <div className="flex items-center space-x-2 text-sm mb-2" style={{ color: '#0D9488' }}>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Processing analysis...</span>
          </div>
          <div className="text-xs" style={{ color: '#0F766E' }}>
            Started: {new Date(progress.timestamp).toLocaleTimeString()}
          </div>
        </div>
      </div>
    )}

    {/* Results Display */}
    {result && (result.response || result.result) && (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        className="px-4 pb-4"
      >
        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <CheckCircle className="w-4 h-4" style={{ color: '#5AE8C7' }} />
              <span>Analysis completed</span>
              {result.timestamp && (
                <>
                  <span>•</span>
                  <span>{new Date(result.timestamp).toLocaleTimeString()}</span>
                </>
              )}
              {result.model && (
                <>
                  <span>•</span>
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">{result.model}</span>
                </>
              )}
            </div>
            <button
              onClick={() => onDownload(prompt.key)}
              className="flex items-center space-x-2 px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm border border-gray-300 shadow-sm"
            >
              <Download className="w-3 h-3" />
              <span>Download</span>
            </button>
          </div>
          
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-80 overflow-y-auto">
            <div className="prose prose-sm max-w-none text-gray-800">
              {formatAnalysisText(result.response || result.result)}
            </div>
          </div>
        </div>
      </motion.div>
    )}

    {/* Error State */}
    {result && result.error && (
      <div className="px-4 pb-4">
        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center space-x-2 text-sm text-red-600 mb-2">
            <AlertCircle className="w-4 h-4" />
            <span>Analysis failed</span>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
            {result.error}
          </div>
        </div>
      </div>
    )}

    {/* Failed Progress State */}
    {progress && progress.status === 'failed' && !result && (
      <div className="px-4 pb-4">
        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center space-x-2 text-sm text-red-600 mb-2">
            <AlertCircle className="w-4 h-4" />
            <span>Analysis failed</span>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
            {progress.error || 'Analysis failed to complete'}
          </div>
        </div>
      </div>
    )}
  </motion.div>
);

};

export default UnifiedAnalysisCard;