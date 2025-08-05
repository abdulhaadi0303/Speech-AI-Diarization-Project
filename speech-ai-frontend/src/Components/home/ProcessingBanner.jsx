import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const ProcessingBanner = ({ processingSessions, onViewSession }) => {
  if (processingSessions.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-xl p-4 text-white"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Loader2 className="w-5 h-5 animate-spin" />
          <div>
            <h3 className="font-semibold">
              {processingSessions.length} Session{processingSessions.length > 1 ? 's' : ''} Processing
            </h3>
            <p className="text-cyan-100 text-sm">
              Processing continues in background. You'll be notified when complete.
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {processingSessions.slice(0, 2).map((session) => (
            <button
              key={session.sessionId}
              onClick={() => onViewSession(session.sessionId)}
              className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-sm transition-colors"
            >
              View {session.sessionId.slice(0, 8)}...
            </button>
          ))}
          {processingSessions.length > 2 && (
            <span className="text-cyan-100 text-sm">+{processingSessions.length - 2} more</span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ProcessingBanner;