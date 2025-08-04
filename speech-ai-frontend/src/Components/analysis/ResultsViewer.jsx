// src/components/analysis/ResultsViewer.jsx - Results Viewer Component
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Eye, 
  EyeOff, 
  Download, 
  Copy, 
  Maximize2, 
  Minimize2,
  FileText,
  Clock
} from 'lucide-react';

const ResultsViewer = ({ 
  title,
  content, 
  metadata = {},
  onDownload,
  className = ""
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showMetadata, setShowMetadata] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      // Could add a toast notification here
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const formatMetadata = () => {
    const items = [];
    if (metadata.model) items.push(`Model: ${metadata.model}`);
    if (metadata.processing_time) items.push(`Time: ${metadata.processing_time.toFixed(2)}s`);
    if (metadata.transcript_length) items.push(`Length: ${metadata.transcript_length} chars`);
    return items;
  };

  const formatContent = (text) => {
    if (!text) return '';
    
    return text.split('\n').map((line, index) => {
      // Format headers
      if (line.startsWith('**') && line.endsWith('**')) {
        return (
          <h4 key={index} className="text-lg font-semibold text-gray-900 mt-4 mb-2">
            {line.replace(/\*\*/g, '')}
          </h4>
        );
      }
      
      // Format subheaders
      if (line.startsWith('###')) {
        return (
          <h5 key={index} className="text-md font-medium text-gray-800 mt-3 mb-2">
            {line.replace(/###/g, '')}
          </h5>
        );
      }
      
      // Format bullet points
      if (line.startsWith('- ') || line.startsWith('• ')) {
        return (
          <li key={index} className="ml-4 text-gray-700 mb-1 list-disc">
            {line.replace(/^[•\-]\s/, '')}
          </li>
        );
      }
      
      // Format bold text
      if (line.includes('**')) {
        return (
          <p key={index} className="text-gray-700 mb-2" dangerouslySetInnerHTML={{
            __html: line.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
          }} />
        );
      }
      
      // Regular paragraphs
      if (line.trim()) {
        return <p key={index} className="text-gray-700 mb-2">{line}</p>;
      }
      
      return <br key={index} />;
    });
  };

  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <FileText className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Metadata toggle */}
          <button
            onClick={() => setShowMetadata(!showMetadata)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Show metadata"
          >
            <Clock className="w-4 h-4" />
          </button>
          
          {/* Copy button */}
          <button
            onClick={handleCopy}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Copy to clipboard"
          >
            <Copy className="w-4 h-4" />
          </button>
          
          {/* Download button */}
          {onDownload && (
            <button
              onClick={onDownload}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Download"
            >
              <Download className="w-4 h-4" />
            </button>
          )}
          
          {/* Expand/collapse */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title={isExpanded ? "Minimize" : "Maximize"}
          >
            {isExpanded ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Metadata */}
      <AnimatePresence>
        {showMetadata && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 py-2 bg-gray-50 border-b border-gray-200"
          >
            <div className="flex flex-wrap gap-4 text-xs text-gray-600">
              {formatMetadata().map((item, index) => (
                <span key={index}>{item}</span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div className={`p-4 overflow-y-auto ${
        isExpanded ? 'max-h-screen' : 'max-h-96'
      }`}>
        {content ? (
          <div className="prose prose-sm max-w-none">
            {formatContent(content)}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No content available</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultsViewer;