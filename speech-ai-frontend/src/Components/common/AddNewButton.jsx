// src/components/common/AddNewButton.jsx - Simple Reset Button
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
      className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg font-medium transition-all duration-200 hover:scale-105"
      title="Clear all state and start fresh"
    >
      <RotateCcw className="w-4 h-4" />
      <span>Add New</span>
    </button>
  );
};

export default AddNewButton;