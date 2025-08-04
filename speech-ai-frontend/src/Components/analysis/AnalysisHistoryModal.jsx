// src/components/analysis/AnalysisHistoryModal.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { 
  X,
  History,
  Download
} from 'lucide-react';

const AnalysisHistoryModal = ({ isOpen, onClose, analysisProgress, analysisResults, onDownload }) => {
  if (!isOpen) return null;

  const formatTime = (timeString) => {
    return new Date(timeString).toLocaleString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'processing': return 'text-yellow-400 bg-yellow-400/20';
      case 'completed': return 'text-green-400 bg-green-400/20';
      case 'failed': return 'text-red-400 bg-red-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gray-800 rounded-xl border border-gray-700 p-6 max-w-4xl w-full max-h-[80vh] overflow-hidden"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Analysis History</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-96">
          {Object.entries(analysisProgress).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No analysis history available</p>
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(analysisProgress)
                .sort(([,a], [,b]) => new Date(b.startTime) - new Date(a.startTime))
                .map(([key, progress]) => {
                  const result = analysisResults[key];
                  return (
                    <div key={key} className="bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(progress.status)}`}>
                            {progress.status}
                          </span>
                          <h3 className="text-white font-medium">{progress.title}</h3>
                        </div>
                        {result && result.response && (
                          <button
                            onClick={() => onDownload(key, progress)}
                            className="flex items-center space-x-1 px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded text-sm text-gray-300 transition-colors"
                          >
                            <Download className="w-3 h-3" />
                            <span>Download</span>
                          </button>
                        )}
                      </div>
                      
                      <div className="text-sm text-gray-400 space-y-1">
                        <div>Session: {progress.sessionId?.slice(0, 8)}...</div>
                        <div>Started: {formatTime(progress.startTime)}</div>
                        {progress.completedTime && (
                          <div>Completed: {formatTime(progress.completedTime)}</div>
                        )}
                        {progress.error && (
                          <div className="text-red-400">Error: {progress.error}</div>
                        )}
                      </div>

                      {result && result.response && (
                        <div className="mt-3 p-3 bg-gray-800 rounded text-sm">
                          <div className="text-gray-300 line-clamp-3">
                            {result.response.substring(0, 200)}...
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default AnalysisHistoryModal;