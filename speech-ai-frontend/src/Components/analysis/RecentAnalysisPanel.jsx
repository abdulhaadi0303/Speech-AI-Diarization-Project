// src/components/analysis/RecentAnalysisPanel.jsx
import React from 'react';
import { Clock, Download } from 'lucide-react';

const RecentAnalysisPanel = ({ 
  analysisProgress, 
  analysisResults, 
  onShowHistory, 
  onDownload 
}) => {
  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-medium text-white flex items-center">
          <Clock className="w-5 h-5 text-blue-500 mr-2" />
          Recent Analysis
        </h4>
        <button
          onClick={onShowHistory}
          className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          View All →
        </button>
      </div>
      
      <div className="space-y-2 max-h-40 overflow-y-auto">
        {Object.entries(analysisProgress)
          .sort(([,a], [,b]) => new Date(b.startTime) - new Date(a.startTime))
          .slice(0, 5)
          .map(([key, progress]) => (
            <div key={key} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <span className={`w-2 h-2 rounded-full ${
                  progress.status === 'processing' ? 'bg-yellow-400 animate-pulse' :
                  progress.status === 'completed' ? 'bg-green-400' : 'bg-red-400'
                }`}></span>
                <div className="flex-1">
                  <div className="text-gray-300 font-medium text-sm">{progress.title}</div>
                  <div className="text-gray-500 text-xs">
                    {progress.sessionId?.slice(0, 8)}... • {new Date(progress.startTime).toLocaleTimeString()}
                  </div>
                </div>
              </div>
              
              {analysisResults[key] && analysisResults[key].response && (
                <button
                  onClick={() => onDownload(key, progress)}
                  className="flex items-center space-x-1 px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded text-xs text-gray-300 transition-colors"
                >
                  <Download className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
      </div>
      
      {Object.keys(analysisProgress).length > 5 && (
        <div className="mt-3 pt-3 border-t border-gray-700 text-center">
          <span className="text-sm text-gray-500">
            +{Object.keys(analysisProgress).length - 5} more analyses in history
          </span>
        </div>
      )}
    </div>
  );
};

export default RecentAnalysisPanel;