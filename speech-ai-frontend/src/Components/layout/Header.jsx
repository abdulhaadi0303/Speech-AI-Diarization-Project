// src/Components/layout/Header.jsx - Enhanced Header with Dynamic Backend Status
import React from 'react';
import { MobileBreadcrumb } from './SideBar';
import { useBackend } from '../../contexts/BackendContext';

export function Header() {
  const { isConnected, isLLMAvailable, backendStatus } = useBackend();

  const getStatusColor = (isOnline) => {
    return isOnline ? 'bg-green-500' : 'bg-red-500';
  };

  const getStatusText = (isOnline, label) => {
    return isOnline ? `${label}: Online` : `${label}: Offline`;
  };

  return (
    <header className="bg-gray-800 px-4 md:px-15 py-2">
      {/* Mobile Layout - Visible below 768px */}
      <div className="flex flex-col md:hidden">
        {/* Top Row - Hamburger + Title */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center space-x-2">
            {/* Only visible below 640px - Fixed to prevent file dialog */}
            <div className="block sm:hidden">
              <MobileBreadcrumb />
            </div>
            <h1 className="text-white text-lg font-bold leading-tight">
              AI Speech <span className="text-cyan-400">Diarization</span>
            </h1>
          </div>
        </div>

        {/* Bottom Row - Status indicators */}
        <div className="flex items-center justify-center space-x-2 pb-1">
          <div className="flex items-center bg-white rounded-full px-2 py-0.5 text-xs">
            <div className={`w-1.5 h-1.5 ${getStatusColor(isConnected)} rounded-full mr-1`}></div>
            <span className="text-gray-800 font-medium">
              {isConnected ? 'API Online' : 'API Offline'}
            </span>
          </div>
          <div className="flex items-center bg-white rounded-full px-2 py-0.5 text-xs">
            <div className={`w-1.5 h-1.5 ${getStatusColor(isLLMAvailable)} rounded-full mr-1`}></div>
            <span className="text-gray-800 font-medium">
              {isLLMAvailable ? 'LLM: Online' : 'LLM: Offline'}
            </span>
          </div>
        </div>

        {/* Connection Error (Mobile) */}
        {backendStatus.error && (
          <div className="bg-red-100 border border-red-300 rounded-lg p-2 mt-2">
            <p className="text-red-700 text-xs text-center">
              Connection Error: {backendStatus.error}
            </p>
          </div>
        )}
      </div>

      {/* Desktop Layout - Visible from 768px and up */}
      <div className="hidden md:flex items-center justify-between h-[8vh]">
        <div className="flex items-center">
          <h1 className="text-white text-2xl md:text-3xl font-bold">
            AI Speech <span className="text-cyan-400">Diarization</span>
          </h1>
        </div>

        <div className="flex items-center space-x-4">
          {/* API Status */}
          <div className="flex items-center bg-white rounded-full px-3 py-1 text-sm">
            <div className={`w-2 h-2 ${getStatusColor(isConnected)} rounded-full mr-2`}></div>
            <span className="text-gray-800">
              {getStatusText(isConnected, 'API')}
            </span>
          </div>

          {/* LLM Status */}
          <div className="flex items-center bg-white rounded-full px-3 py-1 text-sm">
            <div className={`w-2 h-2 ${getStatusColor(isLLMAvailable)} rounded-full mr-2`}></div>
            <span className="text-gray-800">
              {getStatusText(isLLMAvailable, 'LLM')}
            </span>
          </div>

          {/* Connection Info Tooltip */}
          {backendStatus.error && (
            <div className="relative group">
              <div className="flex items-center bg-red-100 border border-red-300 rounded-full px-3 py-1 text-sm cursor-help">
                <div className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></div>
                <span className="text-red-700">Error</span>
              </div>
              
              {/* Tooltip */}
              <div className="absolute right-0 top-full mt-1 w-64 bg-gray-900 text-white text-xs rounded-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity z-50">
                <div className="font-medium mb-1">Connection Details:</div>
                <div className="text-gray-300">{backendStatus.error}</div>
                <div className="mt-2 text-gray-400">
                  Make sure the backend server is running on the correct port.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}