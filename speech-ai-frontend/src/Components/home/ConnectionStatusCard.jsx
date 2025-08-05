import React from 'react';
import { AlertCircle } from 'lucide-react';

const ConnectionStatusCard = ({ isConnected }) => {
  if (isConnected) return null;

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
      <div className="text-center bg-gray-800 rounded-2xl p-8 shadow-lg max-w-md border border-gray-700">
        <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">API Offline</h2>
        <p className="text-gray-300 mb-4">
          Please ensure the backend server is running and accessible.
        </p>
        <div className="bg-gray-700 rounded-lg p-4 text-left text-sm text-gray-300">
          <div className="font-medium mb-2 text-white">To start the backend:</div>
          <code className="block bg-gray-900 p-2 rounded border border-gray-600 text-cyan-400">
            python main.py
          </code>
        </div>
      </div>
    </div>
  );
};

export default ConnectionStatusCard;