// src/components/analysis/AnalysisProgressBanner.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { 
  Loader2,
  CheckCircle,
  History,
  Trash2
} from 'lucide-react';

const AnalysisProgressBanner = ({ analysisProgress, onViewProgress, onClearProgress }) => {
  if (Object.keys(analysisProgress).length === 0) return null;

  const inProgress = Object.entries(analysisProgress).filter(([_, data]) => data.status === 'processing');
  const completed = Object.entries(analysisProgress).filter(([_, data]) => data.status === 'completed');

  if (inProgress.length === 0 && completed.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-4 text-white"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {inProgress.length > 0 ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <CheckCircle className="w-5 h-5" />
          )}
          <div>
            <h3 className="font-semibold">
              {inProgress.length > 0 
                ? `${inProgress.length} Analysis${inProgress.length > 1 ? 'es' : ''} Processing`
                : `${completed.length} Analysis${completed.length > 1 ? 'es' : ''} Completed`
              }
            </h3>
            <p className="text-purple-100 text-sm">
              {inProgress.length > 0 
                ? 'Analysis continues in background. Results will appear when complete.'
                : 'Analysis results are ready to view.'
              }
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={onViewProgress}
            className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-sm transition-colors flex items-center space-x-1"
          >
            <History className="w-4 h-4" />
            <span>View History</span>
          </button>
          <button
            onClick={onClearProgress}
            className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-sm transition-colors flex items-center space-x-1"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default AnalysisProgressBanner;