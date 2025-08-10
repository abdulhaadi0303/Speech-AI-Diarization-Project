// src/Components/transcription/TranscriptPanel.jsx - FIXED: Original view as default + pass view state
import React, { useState } from 'react';
import { Maximize2, Minimize2, FileText, Eye, Edit3 } from 'lucide-react';
import LiveTranscriptEditor from './LiveTranscriptEditor';

const TranscriptPanel = ({ 
  results, 
  isExpanded, 
  onToggleExpand, 
  hasSession,
  editorRef,
  onViewChange // NEW: Callback to notify parent of view changes
}) => {
  // ✅ CHANGED: Default to original view (false = original view, true = editor view)
  const [showEditor, setShowEditor] = useState(false);

  // ✅ NEW: Notify parent when view changes
  const handleViewChange = (isEditor) => {
    setShowEditor(isEditor);
    if (onViewChange) {
      onViewChange(isEditor ? 'editor' : 'original');
    }
  };

  // Helper function to format time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  if (!hasSession && !results) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 h-full flex flex-col items-center justify-center p-8">
        <FileText className="w-16 h-16 text-gray-400 mb-4" />
        <h3 className="text-xl font-semibold text-gray-600 mb-2">No Transcript Available</h3>
        <p className="text-gray-500 text-center">
          Upload and process an audio file to see the transcript here.
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-200 transition-all duration-300 ${
      isExpanded ? 'fixed inset-4 z-50' : 'h-full'
    }`}>
      {/* ✅ RESTORED: Header with view toggle and expand/collapse button */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold text-gray-900">Live Transcript</h3>
          
          {/* ✅ RESTORED: View Toggle Buttons */}
          {results && (
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => handleViewChange(false)}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  !showEditor 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Eye className="w-4 h-4" />
                <span>Original</span>
              </button>
              <button
                onClick={() => handleViewChange(true)}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  showEditor 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Edit3 className="w-4 h-4" />
                <span>Editor</span>
              </button>
            </div>
          )}
        </div>

        <button
          onClick={onToggleExpand}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title={isExpanded ? "Minimize" : "Expand"}
        >
          {isExpanded ? (
            <Minimize2 className="w-5 h-5 text-gray-600" />
          ) : (
            <Maximize2 className="w-5 h-5 text-gray-600" />
          )}
        </button>
      </div>

      {/* ✅ RESTORED: Content with proper layout and scroll behavior */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {showEditor ? (
          // ✅ FIXED: Editor View with increased height to fit outer box
          <div className="flex-1 overflow-hidden h-full">
            <LiveTranscriptEditor 
              ref={editorRef}
              results={results} 
              hasSession={hasSession} 
            />
          </div>
        ) : (
          // ✅ FIXED: Original Transcript View with increased height to fit outer box
          <div className="flex-1 overflow-hidden flex flex-col h-full">
            {results?.results?.segments ? (
              <div 
                className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-4" 
                style={{ 
                  scrollBehavior: 'smooth',
                  maxHeight: 'calc(160vh - 600px)', // Increased to match outer box
                  height: '100%',
                  minHeight: '800px' // Increased minimum height
                }}
              >
                {results.results.segments.map((segment, index) => (
                  <div 
                    key={index} 
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:bg-gray-100 transition-colors w-full"
                    style={{ 
                      maxWidth: '100%',
                      boxSizing: 'border-box'
                    }}
                  >
                    <div className="flex items-start space-x-4 w-full">
                      <div className="flex-shrink-0">
                        <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap">
                          {formatTime(segment.start)} - {formatTime(segment.end)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-semibold text-green-700 text-sm">
                            {segment.speaker}
                          </span>
                        </div>
                        <p className="text-gray-900 leading-relaxed break-words overflow-wrap-anywhere">
                          {segment.text}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center p-8 overflow-hidden h-full">
                <div className="text-center">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <h4 className="text-lg font-medium text-gray-600 mb-2">No Transcript Data</h4>
                  <p className="text-gray-500">
                    The transcript will appear here once processing is complete.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ✅ RESTORED: Status bar for original view */}
      {!showEditor && results?.results?.segments && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            <span>{results.results.segments.length} segments</span>
            <span>•</span>
            <span>{new Set(results.results.segments.map(s => s.speaker)).size} speakers</span>
            {results.results.metadata?.total_duration && (
              <>
                <span>•</span>
                <span>{formatTime(results.results.metadata.total_duration)} total</span>
              </>
            )}
          </div>
          <div className="text-xs text-gray-500">
            Original transcript view
          </div>
        </div>
      )}
    </div>
  );
};

export default TranscriptPanel;