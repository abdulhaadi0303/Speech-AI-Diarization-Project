import React, { useState, useRef } from 'react';
import { Upload, CheckCircle, AlertCircle } from 'lucide-react';

const AudioUploader = ({ onFileUpload, selectedFile, isProcessing, currentSessionId, processingStatus }) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const SUPPORTED_FORMATS = ['.mp3', '.wav', '.mp4', '.m4a', '.flac', '.ogg'];
  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

  const validateFile = (file) => {
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!SUPPORTED_FORMATS.includes(fileExtension)) {
      return `Unsupported format. Please use: ${SUPPORTED_FORMATS.join(', ')}`;
    }
    
    if (file.size > MAX_FILE_SIZE) {
      return `File too large. Max size: ${MAX_FILE_SIZE / 1024 / 1024}MB`;
    }
    
    return null;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelection = (file) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setError(null);
    onFileUpload(file);
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0]);
    }
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept={SUPPORTED_FORMATS.join(',')}
        onChange={handleFileChange}
        className="hidden"
        disabled={isProcessing}
      />
  
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span className="text-red-700 text-sm">{error}</span>
        </div>
      )}
  
      {!selectedFile ? (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
            dragActive 
              ? 'border-psycon-mint bg-psycon-light-teal/20' 
              : 'border-gray-300 hover:border-psycon-mint hover:bg-gray-50'
          } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={!isProcessing ? handleBrowseClick : undefined}
        >
          <div className="flex flex-col items-center space-y-2">
            <Upload className={`w-10 h-10 ${
              dragActive ? 'text-psycon-mint' : 'text-gray-400'
            }`} />
            <div>
              <p className="text-lg font-medium text-gray-700">
                {dragActive ? 'Drop your audio file here' : 'Upload Audio File'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Drag & drop or <button onClick={handleBrowseClick} className="text-psycon-mint hover:text-psycon-mint/80 underline">browse</button> to upload
              </p>
            </div>
            <div className="text-xs text-gray-400">
              <p>Supported: {SUPPORTED_FORMATS.join(', ')}</p>
              <p>Max size: {MAX_FILE_SIZE / 1024 / 1024}MB</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-psycon-light-teal/20 border border-psycon-mint/30 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-8 h-8 text-psycon-mint" />
            <div>
              <p className="text-sm font-medium text-gray-800">{selectedFile.name}</p>
              <p className="text-xs text-gray-600">{formatFileSize(selectedFile.size)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

};

export default AudioUploader;