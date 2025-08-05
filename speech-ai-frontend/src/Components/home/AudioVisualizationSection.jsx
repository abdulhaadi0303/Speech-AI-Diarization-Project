// src/components/home/AudioVisualizationSection.jsx
import React from 'react';
import { Loader2 } from 'lucide-react';

const AudioVisualizationSection = ({ 
  isProcessing, 
  language, 
  setLanguage, 
  speakers, 
  setSpeakers, 
  handleStartProcessing, 
  canProcess 
}) => {
  const languages = [
    { code: '', name: 'Auto-detect' },
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ru', name: 'Russian' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'zh', name: 'Chinese' }
  ];

  const speakerOptions = [
    { value: '', label: 'Auto-detect' },
    { value: '1', label: '1 Speaker' },
    { value: '2', label: '2 Speakers' },
    { value: '3', label: '3 Speakers' },
    { value: '4', label: '4 Speakers' },
    { value: '5', label: '5+ Speakers' }
  ];

  return (
    <div className="bg-gray-100 p-6 rounded-lg">
      <h3 className="text-cyan-400 text-lg font-semibold mb-4">Processing Settings</h3>
      
      {/* Audio Visualization */}
      <div className="mb-6">
        <div className="bg-gray-800 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-center space-x-1">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className={`bg-cyan-400 rounded transition-all duration-300 ${
                  isProcessing ? 'animate-pulse' : ''
                }`}
                style={{
                  width: '3px',
                  height: `${Math.random() * 60 + 10}px`,
                  animationDelay: `${i * 50}ms`
                }}
              />
            ))}
          </div>
        </div>
        
        {/* Language and Speaker Settings */}
        <div className="flex justify-between">
          <div className="flex-1 mr-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              disabled={isProcessing}
              className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400"
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Speakers</label>
            <select
              value={speakers}
              onChange={(e) => setSpeakers(e.target.value)}
              disabled={isProcessing}
              className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400"
            >
              {speakerOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Start Processing Button */}
      <button
        onClick={handleStartProcessing}
        disabled={!canProcess || isProcessing}
        className={`w-full py-3 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2 ${
          canProcess && !isProcessing
            ? 'bg-cyan-400 text-white hover:bg-cyan-500'
            : 'bg-gray-400 text-gray-200 cursor-not-allowed'
        }`}
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Processing...</span>
          </>
        ) : (
          <span>Start Processing File</span>
        )}
      </button>
    </div>
  );
};

export default AudioVisualizationSection;
