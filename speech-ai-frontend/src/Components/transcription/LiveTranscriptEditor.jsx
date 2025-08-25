// src/Components/transcription/LiveTranscriptEditor.jsx - RESTORED: Original working version without downloads
import React, { useState, useRef, useEffect, useCallback, useMemo, forwardRef, useImperativeHandle } from 'react';
import { motion } from 'framer-motion';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import '../../styles/SmoothScrollEditor.css';
import { 
  Users, 
  Save, 
  RotateCcw, 
  Copy,
  CheckCircle,
  User,
  AlertCircle,
  Edit3
} from 'lucide-react';
import useAppStore from '../../stores/appStore';
import toast from 'react-hot-toast';

const LiveTranscriptEditor = forwardRef(({ results, hasSession }, ref) => {
  // 🔧 CORE STATE
  const [originalContent, setOriginalContent] = useState('');
  const [currentMappings, setCurrentMappings] = useState({});
  const [showSpeakerPanel, setShowSpeakerPanel] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [copied, setCopied] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [isInitialized, setIsInitialized] = useState(false);
  
  // 🔧 REFS
  const quillRef = useRef(null);
  const isProgrammaticUpdateRef = useRef(false);
  const updateTimeoutRef = useRef(null);
  const lastMappingsRef = useRef('{}');
  const initTimeoutRef = useRef(null);
  const currentSessionId = useAppStore((state) => state.currentSessionId);
  
  // Storage keys
  const getStorageKeys = () => ({
    content: `transcript_content_${currentSessionId}`,
    speakers: `speaker_mappings_${currentSessionId}`,
    hasEdits: `has_edits_${currentSessionId}`
  });

  // ✅ EXPOSE METHODS TO PARENT VIA REF
  useImperativeHandle(ref, () => ({
    getCurrentContent: () => {
      const editor = quillRef.current?.getEditor();
      if (editor) {
        return editor.root.innerHTML;
      }
      return generateLiveContent();
    },
    getCurrentMappings: () => currentMappings,
    hasUnsavedChanges: () => hasUnsavedChanges,
    getPlainTextContent: () => {
      const htmlContent = getCurrentContent();
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      return tempDiv.textContent || tempDiv.innerText || '';
    }
  }), [currentMappings, hasUnsavedChanges]);

  // ✅ Initialize content and mappings - NO POPUPS
  useEffect(() => {
    if (!currentSessionId) return;

    const storageKeys = getStorageKeys();
    const savedContent = localStorage.getItem(storageKeys.content);
    const savedSpeakers = localStorage.getItem(storageKeys.speakers);
    const hasEdits = localStorage.getItem(storageKeys.hasEdits) === 'true';

    if (savedContent && hasEdits) {
      console.log('📂 Loading saved transcript edits');
      const speakers = savedSpeakers ? JSON.parse(savedSpeakers) : {};
      setOriginalContent(savedContent);
      setCurrentMappings(speakers);
      lastMappingsRef.current = JSON.stringify(speakers);
      
      initTimeoutRef.current = setTimeout(() => {
        setIsInitialized(true);
      }, 500);
      
      setHasUnsavedChanges(false);
    } else if (results?.results?.segments) {
      console.log('🆕 Initializing transcript from results');
      const { content, speakers } = convertResultsToEditorFormat(results.results.segments);
      setOriginalContent(content);
      setCurrentMappings(speakers);
      lastMappingsRef.current = JSON.stringify(speakers);
      
      initTimeoutRef.current = setTimeout(() => {
        setIsInitialized(true);
      }, 500);
      
      setHasUnsavedChanges(false);
    }
  }, [currentSessionId, results]);

  // ✅ Convert results to editor format
  const convertResultsToEditorFormat = (segments) => {
    if (!segments || segments.length === 0) {
      return { content: '<p>No transcript available</p>', speakers: {} };
    }

    const speakers = {};
    let htmlContent = '';

    segments.forEach((segment) => {
      const speaker = segment.speaker;
      const text = segment.text || '';
      const start = segment.start || 0;
      const end = segment.end || 0;

      if (!speakers[speaker]) {
        speakers[speaker] = speaker;
      }

      const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      };

      const timeStamp = `[${formatTime(start)} - ${formatTime(end)}]`;
      htmlContent += `<p><span style="color: #6b7280; font-size: 0.875rem; font-family: monospace;">${timeStamp}</span> <strong style="color: #059669;">${speaker}:</strong> ${text}</p>`;
    });

    return { content: htmlContent, speakers };
  };

  // 🔧 GENERATE LIVE CONTENT - FIXED: Always work from raw segments data
  const generateLiveContent = useCallback(() => {
    // 🔧 CRITICAL FIX: Always generate from original segments, not from saved HTML
    // This ensures mapping always works regardless of save state
    if (!results?.results?.segments) {
      return originalContent; // Fallback to saved content if no segments
    }

    const segments = results.results.segments;
    let htmlContent = '';

    segments.forEach((segment) => {
      const originalSpeaker = segment.speaker;
      const mappedSpeaker = currentMappings[originalSpeaker] || originalSpeaker;
      const text = segment.text || '';
      const start = segment.start || 0;
      const end = segment.end || 0;

      const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      };

      const timeStamp = `[${formatTime(start)} - ${formatTime(end)}]`;
      
      // Always use current mapping, regardless of what's saved
      htmlContent += `<p><span style="color: #6b7280; font-size: 0.875rem; font-family: monospace;">${timeStamp}</span> <strong style="color: #059669;">${mappedSpeaker}:</strong> ${text}</p>`;
    });

    console.log(`🎨 Generated live content from segments with current mappings`);
    return htmlContent;
  }, [results, currentMappings]); // Removed originalContent dependency

  // 🔧 UPDATE QUILL CONTENT - Bulletproof approach
  const updateQuillContent = useCallback((newContent) => {
    const editor = quillRef.current?.getEditor();
    if (!editor) return;
    
    console.log('🖊️ Updating Quill content (bulletproof)');
    
    isProgrammaticUpdateRef.current = true;
    
    try {
      const currentSelection = editor.getSelection();
      
      try {
        const delta = editor.clipboard.convert(newContent);
        editor.setContents(delta, 'silent');
        console.log('✅ Used silent setContents method');
      } catch (e) {
        editor.setText('');
        editor.clipboard.dangerouslyPasteHTML(0, newContent);
        console.log('✅ Used fallback setText method');
      }
      
      if (currentSelection) {
        try {
          const newLength = editor.getLength();
          const safeIndex = Math.min(currentSelection.index, Math.max(0, newLength - 1));
          editor.setSelection(safeIndex, 0);
        } catch (e) {
          // Ignore selection errors
        }
      }
    } catch (error) {
      console.error('❌ Error updating Quill:', error);
    }
    
    setTimeout(() => {
      isProgrammaticUpdateRef.current = false;
    }, 200);
  }, []);

  // 🔧 GET CURRENT CONTENT from Quill
  const getCurrentContent = useCallback(() => {
    const editor = quillRef.current?.getEditor();
    if (editor) {
      return editor.root.innerHTML;
    }
    return generateLiveContent();
  }, [generateLiveContent]);

  // 🔧 EFFECT: Initialize Quill content
  useEffect(() => {
    if (isInitialized && originalContent && quillRef.current?.getEditor()) {
      console.log('🎬 Initializing Quill with original content (delayed)');
      updateQuillContent(originalContent);
    }
  }, [isInitialized, originalContent, updateQuillContent]);

  // 🔧 EFFECT: Update Quill when mappings change
  useEffect(() => {
    const mappingsString = JSON.stringify(currentMappings);
    
    if (mappingsString !== lastMappingsRef.current && isInitialized) {
      lastMappingsRef.current = mappingsString;
      
      console.log('🔄 Mappings changed, updating Quill (bulletproof)');
      
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      
      updateTimeoutRef.current = setTimeout(() => {
        const liveContent = generateLiveContent();
        updateQuillContent(liveContent);
      }, 150);
    }
  }, [currentMappings, isInitialized, generateLiveContent, updateQuillContent]);

  // 🔧 HANDLE INPUT CHANGES - No focus loss
  const handleInputChange = useCallback((originalSpeaker, newValue) => {
    console.log(`⌨️ Input change: ${originalSpeaker} → "${newValue}"`);
    
    setValidationErrors(prev => {
      if (!prev[originalSpeaker]) return prev;
      const updated = { ...prev };
      delete updated[originalSpeaker];
      return updated;
    });
    
    setCurrentMappings(prev => ({
      ...prev,
      [originalSpeaker]: newValue
    }));
    
    setHasUnsavedChanges(true);
  }, []);

  // ✅ Handle manual editor changes - WITH LOOP PREVENTION
  const handleEditorChange = useCallback((content, delta, source, editor) => {
    if (isProgrammaticUpdateRef.current) {
      console.log('🚫 Ignoring programmatic change to prevent loop');
      return;
    }
    
    if (source === 'user') {
      console.log('✏️ Manual editor change by user');
      setOriginalContent(content);
      setHasUnsavedChanges(true);
    }
  }, []);

  // 🔧 SAVE CHANGES - NO POPUP ON SUCCESS
  const saveChanges = useCallback(() => {
    if (!currentSessionId) {
      toast.error('No active session to save');
      return;
    }

    const errors = {};
    const emptyFields = [];
    
    Object.entries(currentMappings).forEach(([speaker, value]) => {
      if (!value || !value.trim()) {
        errors[speaker] = 'Speaker name cannot be empty';
        emptyFields.push(speaker);
      }
    });

    if (emptyFields.length > 0) {
      setValidationErrors(errors);
      toast.error(`Please provide names for: ${emptyFields.join(', ')}`);
      return;
    }

    setValidationErrors({});
    
    const storageKeys = getStorageKeys();
    const currentContent = generateLiveContent(); // Get current mapped content
    
    try {
      localStorage.setItem(storageKeys.content, currentContent);
      localStorage.setItem(storageKeys.speakers, JSON.stringify(currentMappings));
      localStorage.setItem(storageKeys.hasEdits, 'true');
      
      // Update tracking reference
      lastMappingsRef.current = JSON.stringify(currentMappings);
      setHasUnsavedChanges(false);
      
      console.log('💾 Saved changes - speaker mapping functionality preserved');
    } catch (error) {
      console.error('Save failed:', error);
      toast.error('Failed to save changes');
    }
  }, [currentSessionId, currentMappings, generateLiveContent]);

  // ✅ Reset to original - NO POPUP ON SUCCESS
  const resetToOriginal = useCallback(() => {
    if (!results?.results?.segments) {
      toast.error('No original transcript available');
      return;
    }

    const confirmed = window.confirm(
      'This will discard all edits and restore the original transcript. Continue?'
    );

    if (confirmed) {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }
      
      const { content, speakers } = convertResultsToEditorFormat(results.results.segments);
      
      setOriginalContent(content);
      setCurrentMappings(speakers);
      setValidationErrors({});
      setHasUnsavedChanges(false);
      setIsInitialized(false);
      lastMappingsRef.current = JSON.stringify(speakers);

      const storageKeys = getStorageKeys();
      localStorage.removeItem(storageKeys.content);
      localStorage.removeItem(storageKeys.speakers);
      localStorage.removeItem(storageKeys.hasEdits);

      setTimeout(() => {
        setIsInitialized(true);
      }, 300);
    }
  }, [results]);

  // ✅ Copy function - NO POPUP ON SUCCESS
  const copyAsPlainText = useCallback(async () => {
    try {
      const currentContent = getCurrentContent();
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = currentContent;
      const plainText = tempDiv.textContent || tempDiv.innerText || '';
      
      await navigator.clipboard.writeText(plainText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy');
    }
  }, [getCurrentContent]);

  // ✅ Cleanup
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }
    };
  }, []);

  // ✅ Quill configuration
  const modules = useMemo(() => ({
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{ 'color': [] }, { 'background': [] }],
      ['clean']
    ],
  }), []);

  const formats = useMemo(() => [
    'bold', 'italic', 'underline', 'color', 'background'
  ], []);

  // 🆕 FIXED: Smooth scroll setup with overflow prevention
  useEffect(() => {
    if (quillRef.current && isInitialized) {
      const editor = quillRef.current.getEditor();
      if (editor) {
        const quillContainer = editor.container;
        const editorElement = quillContainer.querySelector('.ql-editor');
        const containerElement = quillContainer.querySelector('.ql-container');
        
        if (editorElement && containerElement) {
          // 🔧 CRITICAL: Force strict height control
          containerElement.style.height = '100%';
          containerElement.style.maxHeight = '100%';
          containerElement.style.overflow = 'hidden';
          containerElement.style.display = 'flex';
          containerElement.style.flexDirection = 'column';
          
          // 🔧 CRITICAL: Editor element with controlled height
          editorElement.style.flex = '1';
          editorElement.style.height = '0'; // Forces flex calculation
          editorElement.style.minHeight = '0';
          editorElement.style.maxHeight = '100%';
          editorElement.style.overflowY = 'auto';
          editorElement.style.overflowX = 'hidden';
          editorElement.style.scrollBehavior = 'smooth';
          editorElement.style.padding = '20px';
          editorElement.style.boxSizing = 'border-box';
          
          console.log('✨ FIXED: Overflow prevention and smooth scrolling setup completed');
        }
      }
    }
  }, [isInitialized]);

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
      <div className="p-6 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Live Transcript Editor</h2>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowSpeakerPanel(!showSpeakerPanel)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                showSpeakerPanel 
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Speaker Mapping</span>
            </button>
            
            <button
              onClick={copyAsPlainText}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
            >
              {copied ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              <span>Copy</span>
            </button>
            
            <button
              onClick={resetToOriginal}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset</span>
            </button>
            
            <button
              onClick={saveChanges}
              disabled={!hasUnsavedChanges}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                hasUnsavedChanges 
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Save className="w-4 h-4 mr-2" />
              Save
            </button>
          </div>
        </div>
      </div>

      {/* 🔧 RESTORED: Speaker Panel - Original layout on TOP of editor */}
      {showSpeakerPanel && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="bg-gray-50 border-b border-gray-200 overflow-hidden"
        >
          <div className="p-4 max-h-64 overflow-y-auto">
            <h4 className="font-medium text-gray-900 mb-4 flex items-center">
              <User className="w-4 h-4 mr-2" />
              Speaker Names
            </h4>
            
            {/* 🔧 RESTORED: Original responsive grid layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-4">
              {Object.entries(currentMappings).map(([originalSpeaker, currentValue]) => (
                <div key={originalSpeaker} className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    {originalSpeaker}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={currentValue || ''}
                      onChange={(e) => handleInputChange(originalSpeaker, e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 text-sm transition-colors ${
                        validationErrors[originalSpeaker]
                          ? 'border-red-300 focus:ring-red-500 bg-red-50'
                          : 'border-gray-300 focus:ring-blue-500'
                      }`}
                      placeholder="Enter speaker name..."
                    />
                    {validationErrors[originalSpeaker] && (
                      <div className="absolute right-2 top-2">
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      </div>
                    )}
                  </div>
                  {validationErrors[originalSpeaker] && (
                    <p className="text-xs text-red-600 flex items-center">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      {validationErrors[originalSpeaker]}
                    </p>
                  )}
                </div>
              ))}
            </div>
            
            <div className="flex flex-wrap gap-4">

              {Object.keys(validationErrors).length > 0 && (
                <div className="flex-1 min-w-64 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-xs text-red-700 font-medium mb-1">
                    ❌ Fix before saving:
                  </p>
                  <ul className="text-xs text-red-600 space-y-1">
                    {Object.entries(validationErrors).map(([speaker, error]) => (
                      <li key={speaker}>• {speaker}: {error}</li>
                    ))}
                  </ul>
                </div>
              )}

            </div>
          </div>
        </motion.div>
      )}

      {/* 🔧 FIXED: Editor with increased height calculation to fit outer box */}
      <div className="flex-1 flex flex-col overflow-hidden h-full">
        <div className="flex-1 p-4 overflow-hidden h-full">
          <div className="h-full overflow-hidden">
            <ReactQuill
              ref={quillRef}
              theme="snow"
              onChange={handleEditorChange}
              modules={modules}
              formats={formats}
              style={{
                height: showSpeakerPanel ? 'calc(160vh - 900px)' : 'calc(160vh - 700px)', // Increased height
                maxHeight: showSpeakerPanel ? 'calc(160vh - 900px)' : 'calc(160vh - 700px)', // Increased height
                minHeight: showSpeakerPanel ? '600px' : '800px' // Increased minimum heights
              }}
              className="smooth-scroll-editor"
            />
          </div>
        </div>
        
        {/* Status Bar */}
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-sm text-gray-600 flex-shrink-0">
          <div className="flex items-center space-x-4">
            <span>Speakers: {Object.keys(currentMappings).length}</span>
            <span>•</span>
            <span>{hasUnsavedChanges ? 'Live Editing Mode' : 'Saved'}</span>
            {Object.keys(validationErrors).length > 0 && (
              <>
                <span>•</span>
                <span className="text-red-600 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {Object.keys(validationErrors).length} error{Object.keys(validationErrors).length !== 1 ? 's' : ''}
                </span>
              </>
            )}
          </div>
          
          {hasUnsavedChanges && (
            <div className="flex items-center space-x-2 text-green-600">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>Live editing</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

LiveTranscriptEditor.displayName = 'LiveTranscriptEditor';

export default LiveTranscriptEditor;