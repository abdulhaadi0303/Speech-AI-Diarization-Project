// src/Components/transcription/LiveTranscriptEditor.jsx - Fixed Global Speaker Mapping
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { 
  Users, 
  Save, 
  RotateCcw, 
  Settings, 
  Download,
  Edit3,
  Copy,
  CheckCircle,
  User
} from 'lucide-react';
import useAppStore from '../../stores/appStore';
import toast from 'react-hot-toast';

const LiveTranscriptEditor = ({ results, hasSession }) => {
  const [editorContent, setEditorContent] = useState('');
  const [speakerMappings, setSpeakerMappings] = useState({});
  const [showSpeakerPanel, setShowSpeakerPanel] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [editingMode, setEditingMode] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const quillRef = useRef(null);
  const currentSessionId = useAppStore((state) => state.currentSessionId);
  
  // Storage keys for persistence
  const getStorageKeys = () => ({
    content: `transcript_content_${currentSessionId}`,
    speakers: `speaker_mappings_${currentSessionId}`,
    hasEdits: `has_edits_${currentSessionId}`
  });

  // ✅ Initialize editor content from results or localStorage
  useEffect(() => {
    if (!currentSessionId) return;

    const storageKeys = getStorageKeys();
    
    // Try to load from localStorage first
    const savedContent = localStorage.getItem(storageKeys.content);
    const savedSpeakers = localStorage.getItem(storageKeys.speakers);
    const hasEdits = localStorage.getItem(storageKeys.hasEdits) === 'true';

    if (savedContent && hasEdits) {
      // Load saved edits
      console.log('📂 Loading saved transcript edits from localStorage');
      setEditorContent(savedContent);
      setSpeakerMappings(savedSpeakers ? JSON.parse(savedSpeakers) : {});
      setHasUnsavedChanges(false);
      toast.success('Restored previous edits');
    } else if (results?.results?.segments) {
      // Initialize from fresh results
      console.log('🆕 Initializing transcript from results');
      const { content, speakers } = convertResultsToEditorFormat(results.results.segments);
      setEditorContent(content);
      setSpeakerMappings(speakers);
      setHasUnsavedChanges(false);
    }
  }, [currentSessionId, results]);

  // ✅ Convert results to editor-friendly HTML format
  const convertResultsToEditorFormat = (segments) => {
    if (!segments || segments.length === 0) {
      return { content: '<p>No transcript available</p>', speakers: {} };
    }

    const speakers = {};
    let htmlContent = '';

    segments.forEach((segment, index) => {
      const speaker = segment.speaker;
      const text = segment.text || '';
      const start = segment.start || 0;
      const end = segment.end || 0;

      // Track speakers for mapping
      if (!speakers[speaker]) {
        speakers[speaker] = speaker; // Default mapping is speaker ID to itself
      }

      // Format time
      const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      };

      const timeStamp = `[${formatTime(start)} - ${formatTime(end)}]`;
      
      // Create HTML segment with data attributes for speaker tracking
      htmlContent += `<div class="transcript-segment" data-segment-id="${index}" data-speaker="${speaker}">
        <span class="timestamp" style="color: #6b7280; font-size: 0.875rem; font-family: monospace;">${timeStamp}</span>
        <strong class="speaker-name" data-speaker="${speaker}" style="color: #059669; margin-left: 8px;">${speaker}:</strong>
        <span class="segment-text" style="margin-left: 8px;">${text}</span>
      </div><br>`;
    });

    return { content: htmlContent, speakers };
  };

  // ✅ Handle editor content changes
  const handleContentChange = useCallback((content) => {
    setEditorContent(content);
    setHasUnsavedChanges(true);
  }, []);

  // ✅ FIXED: Update speaker mapping and apply globally
  const updateSpeakerMapping = useCallback((originalSpeaker, newName) => {
    if (!newName.trim()) {
      toast.error('Speaker name cannot be empty');
      return;
    }

    const trimmedName = newName.trim();
    
    // Update the speaker mappings state
    const updatedMappings = {
      ...speakerMappings,
      [originalSpeaker]: trimmedName
    };
    setSpeakerMappings(updatedMappings);

    // ✅ FIXED: Apply global replacement in editor content using proper HTML manipulation
    let updatedContent = editorContent;
    
    // Create a temporary DOM element to parse and modify the HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = updatedContent;
    
    // Find all speaker elements with the original speaker name
    const speakerElements = tempDiv.querySelectorAll(`.speaker-name[data-speaker="${originalSpeaker}"]`);
    
    // Update each speaker element
    speakerElements.forEach(element => {
      element.textContent = `${trimmedName}:`;
      // Keep the data-speaker attribute for future updates
      element.setAttribute('data-speaker', originalSpeaker);
    });
    
    // Get the updated HTML content
    updatedContent = tempDiv.innerHTML;
    
    // ✅ FIXED: Update the editor content and force re-render
    setEditorContent(updatedContent);
    
    // ✅ FIXED: Update the Quill editor content directly
    const editor = quillRef.current?.getEditor();
    if (editor) {
      // Temporarily disable the onChange handler to prevent infinite loop
      const currentSelection = editor.getSelection();
      editor.clipboard.dangerouslyPasteHTML(0, updatedContent);
      // Restore selection if it existed
      if (currentSelection) {
        editor.setSelection(currentSelection);
      }
    }
    
    setHasUnsavedChanges(true);
    toast.success(`Updated all instances of ${originalSpeaker} to ${trimmedName}`);
    
    console.log(`🔄 Updated speaker ${originalSpeaker} to ${trimmedName} globally`);
  }, [speakerMappings, editorContent]);

  // ✅ Save changes to localStorage
  const saveChanges = useCallback(() => {
    if (!currentSessionId) {
      toast.error('No active session to save');
      return;
    }

    const storageKeys = getStorageKeys();
    
    try {
      localStorage.setItem(storageKeys.content, editorContent);
      localStorage.setItem(storageKeys.speakers, JSON.stringify(speakerMappings));
      localStorage.setItem(storageKeys.hasEdits, 'true');
      
      setHasUnsavedChanges(false);
      toast.success('Changes saved successfully');
      console.log('💾 Saved transcript changes to localStorage');
    } catch (error) {
      console.error('Failed to save changes:', error);
      toast.error('Failed to save changes');
    }
  }, [currentSessionId, editorContent, speakerMappings]);

  // ✅ Reset to original transcript
  const resetToOriginal = useCallback(() => {
    if (!results?.results?.segments) {
      toast.error('No original transcript available');
      return;
    }

    const confirmed = window.confirm(
      'This will discard all your edits and restore the original transcript. Are you sure?'
    );

    if (confirmed) {
      const { content, speakers } = convertResultsToEditorFormat(results.results.segments);
      setEditorContent(content);
      setSpeakerMappings(speakers);
      setHasUnsavedChanges(false);

      // Clear localStorage
      const storageKeys = getStorageKeys();
      localStorage.removeItem(storageKeys.content);
      localStorage.removeItem(storageKeys.speakers);
      localStorage.removeItem(storageKeys.hasEdits);

      // ✅ Update the Quill editor content
      const editor = quillRef.current?.getEditor();
      if (editor) {
        editor.clipboard.dangerouslyPasteHTML(0, content);
      }

      toast.success('Restored original transcript');
    }
  }, [results]);

  // ✅ Copy transcript as plain text
  const copyAsPlainText = useCallback(async () => {
    try {
      // Convert HTML content to plain text
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = editorContent;
      const plainText = tempDiv.textContent || tempDiv.innerText || '';
      
      await navigator.clipboard.writeText(plainText);
      setCopied(true);
      toast.success('Copied transcript to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy transcript');
    }
  }, [editorContent]);

  // ✅ Download transcript
  const downloadTranscript = useCallback(() => {
    try {
      // Convert to plain text for download
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = editorContent;
      const plainText = tempDiv.textContent || tempDiv.innerText || '';
      
      const blob = new Blob([plainText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `transcript_edited_${currentSessionId?.slice(0, 8) || 'session'}_${new Date().toISOString().slice(0, 10)}.txt`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      
      toast.success('Transcript downloaded');
    } catch (error) {
      toast.error('Failed to download transcript');
    }
  }, [editorContent, currentSessionId]);

  // ✅ Auto-save every 30 seconds if there are changes
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const autoSaveInterval = setInterval(() => {
      saveChanges();
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [hasUnsavedChanges, saveChanges]);

  // ✅ Quill modules and formats
  const modules = {
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{ 'color': [] }, { 'background': [] }],
      ['clean']
    ],
  };

  const formats = [
    'bold', 'italic', 'underline', 'color', 'background'
  ];

  if (!hasSession) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 h-full flex flex-col items-center justify-center">
        <Edit3 className="w-16 h-16 text-gray-400 mb-4" />
        <h3 className="text-xl font-semibold text-gray-600 mb-2">Live Transcript Editor</h3>
        <p className="text-gray-500 text-center">
          Process an audio file to start editing your transcript with live speaker name mapping.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <Edit3 className="w-5 h-5 text-blue-500" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Live Transcript Editor</h3>
            {hasUnsavedChanges && (
              <p className="text-sm text-orange-600">Unsaved changes</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowSpeakerPanel(!showSpeakerPanel)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Manage speakers"
          >
            <Users className="w-4 h-4" />
          </button>
          
          <button
            onClick={copyAsPlainText}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Copy transcript"
          >
            {copied ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
          
          <button
            onClick={downloadTranscript}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Download transcript"
          >
            <Download className="w-4 h-4" />
          </button>
          
          <button
            onClick={resetToOriginal}
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Reset to original"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          
          <button
            onClick={saveChanges}
            disabled={!hasUnsavedChanges}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              hasUnsavedChanges
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Save className="w-4 h-4 inline mr-2" />
            Save
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Speaker Panel */}
        {showSpeakerPanel && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 300, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="bg-gray-50 border-r border-gray-200 flex-shrink-0 overflow-y-auto"
          >
            <div className="p-4">
              <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                <User className="w-4 h-4 mr-2" />
                Speaker Names
              </h4>
              
              <div className="space-y-3">
                {Object.entries(speakerMappings).map(([originalSpeaker, currentName]) => (
                  <div key={originalSpeaker} className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      {originalSpeaker}
                    </label>
                    <input
                      type="text"
                      value={currentName}
                      onChange={(e) => updateSpeakerMapping(originalSpeaker, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="Enter speaker name..."
                    />
                  </div>
                ))}
              </div>
              
              <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-700">
                  💡 Changes to speaker names are applied globally across the entire transcript.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Editor */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 p-4">
            <ReactQuill
              ref={quillRef}
              theme="snow"
              value={editorContent}
              onChange={handleContentChange}
              modules={modules}
              formats={formats}
              style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
              }}
              className="h-full"
            />
          </div>
          
          {/* Status Bar */}
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-sm text-gray-600 flex-shrink-0">
            <div className="flex items-center space-x-4">
              <span>Speakers: {Object.keys(speakerMappings).length}</span>
              <span>•</span>
              <span>Auto-save: {hasUnsavedChanges ? 'Pending' : 'Saved'}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              {hasUnsavedChanges && (
                <span className="text-orange-600">• Unsaved changes</span>
              )}
              <span className="text-gray-400">
                Session: {currentSessionId?.slice(0, 8)}...
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveTranscriptEditor;