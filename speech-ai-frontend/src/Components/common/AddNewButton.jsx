// src/Components/common/AddNewButton.jsx
import React from 'react';
import { RotateCcw } from 'lucide-react';
import useAppStore from '../../stores/appStore';
import toast from 'react-hot-toast';

const AddNewButton = () => {
  const resetAllState = useAppStore((state) => state.resetAllState);
  
  const handleAddNew = () => {
    const confirmed = window.confirm(
      'Start a new session?\n\n' +
      'This will clear all uploaded files and reset all settings.'
    );
    
    if (confirmed) {
      resetAllState();
      toast.success('New session started - all state cleared');
    }
  };
  
  return (
    <button
      onClick={handleAddNew}
      className="w-full py-3 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2 bg-gray-500 hover:bg-gray-700 text-white border border-gray-400 hover:border-gray-400"
      title="Clear all state and start fresh"
    >
      <RotateCcw className="w-5 h-5" />
      <span>Upload New Audio</span>
    </button>
  );
};

export default AddNewButton;