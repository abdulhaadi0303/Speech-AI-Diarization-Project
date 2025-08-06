// src/stores/appStore.js - Enhanced Store with Editor State Management
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Match original HomePage defaults exactly
const defaultStructures = [
  { name: 'Introduction', enabled: false },
  { name: 'Biographical History', enabled: false },
  { name: 'Professional Background', enabled: true }, // ✅ Originally enabled
  { name: 'Social History', enabled: false },
  { name: 'Family History', enabled: true }, // ✅ Originally enabled
  { name: 'Medical History', enabled: true }, // ✅ Originally enabled
  { name: 'Vegetative History', enabled: true }, // ✅ Originally enabled
  { name: 'Pyschological History', enabled: false },
  { name: 'Diseases History', enabled: true } // ✅ Originally enabled
];

const defaultParameters = [
  { name: 'Include own Statement', enabled: true }, // ✅ Originally enabled
  { name: 'Audio Enhance', enabled: true }, // ✅ Originally enabled
  { name: 'Include own Comments', enabled: true }, // ✅ Originally enabled
  { name: 'Use Indirect Speech', enabled: true }, // ✅ Originally enabled
  { name: 'Summarize Conversation', enabled: true }, // ✅ Originally enabled
  { name: 'Patient Quotes', enabled: true } // ✅ Originally enabled
];

const useAppStore = create(
  persist(
    (set, get) => ({
      // HomePage state - with correct defaults
      selectedFile: null,
      setSelectedFile: (file) => set({ selectedFile: file }),
      
      isProcessing: false,
      setIsProcessing: (processing) => set({ isProcessing: processing }),
      
      currentSession: null,
      setCurrentSession: (session) => set({ currentSession: session }),
      
      language: '',
      setLanguage: (language) => set({ language }),
      
      speakers: '',
      setSpeakers: (speakers) => set({ speakers }),
      
      structures: defaultStructures,
      setStructures: (structures) => set({ structures }),
      
      parameters: defaultParameters,
      setParameters: (parameters) => set({ parameters }),

      // TranscriptionPage state - PERSIST PROCESSING RESULTS
      currentSessionId: null,
      setCurrentSessionId: (sessionId) => set({ currentSessionId: sessionId }),
      
      processingStatus: null,
      setProcessingStatus: (status) => set({ processingStatus: status }),
      
      results: null, // ✅ This will persist processing results
      setResults: (results) => set({ results }),
      
      expandedSummary: false,
      setExpandedSummary: (expanded) => set({ expandedSummary: expanded }),
      
      expandedTranscript: false,
      setExpandedTranscript: (expanded) => set({ expandedTranscript: expanded }),

      // ✅ NEW: Live Editor State Management
      transcriptEditorContent: {},
      setTranscriptEditorContent: (sessionId, content) => set((state) => ({
        transcriptEditorContent: {
          ...state.transcriptEditorContent,
          [sessionId]: content
        }
      })),
      
      speakerMappings: {},
      setSpeakerMappings: (sessionId, mappings) => set((state) => ({
        speakerMappings: {
          ...state.speakerMappings,
          [sessionId]: mappings
        }
      })),
      
      editorHasUnsavedChanges: {},
      setEditorHasUnsavedChanges: (sessionId, hasChanges) => set((state) => ({
        editorHasUnsavedChanges: {
          ...state.editorHasUnsavedChanges,
          [sessionId]: hasChanges
        }
      })),

      // ✅ Helper functions for editor state
      getEditorState: (sessionId) => {
        const state = get();
        return {
          content: state.transcriptEditorContent[sessionId] || '',
          speakers: state.speakerMappings[sessionId] || {},
          hasUnsavedChanges: state.editorHasUnsavedChanges[sessionId] || false
        };
      },

      saveEditorState: (sessionId, editorData) => {
        const { setTranscriptEditorContent, setSpeakerMappings, setEditorHasUnsavedChanges } = get();
        
        if (editorData.content !== undefined) {
          setTranscriptEditorContent(sessionId, editorData.content);
        }
        if (editorData.speakers !== undefined) {
          setSpeakerMappings(sessionId, editorData.speakers);
        }
        if (editorData.hasUnsavedChanges !== undefined) {
          setEditorHasUnsavedChanges(sessionId, editorData.hasUnsavedChanges);
        }
      },

      clearEditorState: (sessionId) => {
        set((state) => {
          const newTranscriptContent = { ...state.transcriptEditorContent };
          const newSpeakerMappings = { ...state.speakerMappings };
          const newUnsavedChanges = { ...state.editorHasUnsavedChanges };
          
          delete newTranscriptContent[sessionId];
          delete newSpeakerMappings[sessionId];
          delete newUnsavedChanges[sessionId];
          
          return {
            transcriptEditorContent: newTranscriptContent,
            speakerMappings: newSpeakerMappings,
            editorHasUnsavedChanges: newUnsavedChanges
          };
        });
      },

      // AnalysisPage state - UPDATED for persistence
      selectedAnalysisSession: '', // ✅ Kept for compatibility
      setSelectedAnalysisSession: (sessionId) => set({ selectedAnalysisSession: sessionId }),
      
      sessionData: null, // ✅ Kept for compatibility  
      setSessionData: (data) => set({ sessionData: data }),
      
      customPrompt: '', // ✅ Persisted
      setCustomPrompt: (prompt) => set({ customPrompt: prompt }),
      
      analysisResults: {}, // ✅ Persisted - survives navigation
      setAnalysisResults: (results) => set({ analysisResults: results }),
      
      analysisProgress: {}, // ✅ Persisted - survives navigation
      setAnalysisProgress: (progress) => set({ analysisProgress: progress }),
      
      loadingPrompts: [], // ✅ Kept for compatibility
      setLoadingPrompts: (prompts) => set({ loadingPrompts: prompts }),
      
      backgroundPolling: [], // ✅ Kept for compatibility
      setBackgroundPolling: (polling) => set({ backgroundPolling: polling }),
      
      showHistoryModal: false, // ✅ Persisted
      setShowHistoryModal: (show) => set({ showHistoryModal: show }),

      // ChatPage state
      selectedChatSession: '',
      setSelectedChatSession: (sessionId) => set({ selectedChatSession: sessionId }),
      
      contextType: 'general',
      setContextType: (type) => set({ contextType: type }),
      
      chatMessages: [],
      setChatMessages: (messages) => set({ chatMessages: messages }),
      
      addChatMessage: (message) => set((state) => ({
        chatMessages: [...state.chatMessages, message]
      })),
      
      clearChatMessages: () => set({ chatMessages: [] }),
      
      isLoading: false,
      setChatLoading: (loading) => set({ isLoading: loading }),

      // ✅ ENHANCED: "Add New" - Reset with Editor Cleanup
      resetAllState: () => {
        const currentSessionId = get().currentSessionId;
        
        // Clear editor state for current session
        if (currentSessionId) {
          get().clearEditorState(currentSessionId);
        }
        
        set({
          selectedFile: null, // ✅ Clear file
          isProcessing: false,
          currentSession: null,
          language: '',
          speakers: '',
          structures: defaultStructures, // ✅ Reset to working defaults
          parameters: defaultParameters, // ✅ Reset to working defaults
          // Clear processing results
          currentSessionId: null,
          processingStatus: null,
          results: null,
          expandedSummary: false,
          expandedTranscript: false,
          // ✅ Clear analysis state on reset
          selectedAnalysisSession: '',
          sessionData: null,
          customPrompt: '',
          analysisResults: {},
          analysisProgress: {},
          loadingPrompts: [],
          backgroundPolling: [],
          showHistoryModal: false,
          // Clear chat
          selectedChatSession: '',
          contextType: 'general',
          chatMessages: [],
          isLoading: false,
          // ✅ Note: Editor state is cleared above with clearEditorState
        });
      },
    }),
    {
      name: 'speech-ai-app-state',
      storage: {
        getItem: (name) => {
          try {
            const item = sessionStorage.getItem(name);
            return item ? JSON.parse(item) : null;
          } catch (error) {
            console.error('Error reading from sessionStorage:', error);
            return null;
          }
        },
        setItem: (name, value) => {
          try {
            sessionStorage.setItem(name, JSON.stringify(value));
          } catch (error) {
            console.error('Error writing to sessionStorage:', error);
          }
        },
        removeItem: (name) => {
          try {
            sessionStorage.removeItem(name);
          } catch (error) {
            console.error('Error removing from sessionStorage:', error);
          }
        },
      },
    }
  )
);

export default useAppStore;