// src/components/analysis/AnalysisTips.jsx
import React from 'react';
import { Lightbulb } from 'lucide-react';

const AnalysisTips = () => {
  return (
    <div className="bg-gradient-to-r from-gray-700 to-gray-800 rounded-xl border border-gray-600 p-6">
      <h4 className="text-lg font-medium text-white mb-3 flex items-center">
        <Lightbulb className="w-5 h-5 text-yellow-500 mr-2" />
        💡 Analysis Tips
      </h4>
      <div className="space-y-2 text-sm text-gray-300">
        <div>• Use specific questions for better results</div>
        <div>• Reference speakers by their labels (e.g., "What did SPEAKER_00 discuss?")</div>
        <div>• Ask for structured outputs (bullet points, numbered lists)</div>
        <div>• Long transcripts are automatically chunked for processing</div>
        <div>• Analysis results can be downloaded as text files</div>
        <div>• <strong>Analysis continues in background</strong> - navigate away safely!</div>
      </div>
    </div>
  );
};

export default AnalysisTips;