// src/stores/appStore.js - Enhanced Store with Complete Analysis State Management
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

      // TranscriptionPage state - PERSIST PROCESSING & RESULTS
      currentSessionId: null,
      setCurrentSessionId: (sessionId) => set({ currentSessionId: sessionId }),
      
      processingStatus: null,
      setProcessingStatus: (status) => set({ processingStatus: status }),
      
      results: null,
      setResults: (results) => set({ results }),
      
      expandedSummary: false,
      setExpandedSummary: (expanded) => set({ expandedSummary: expanded }),
      
      expandedTranscript: false,
      setExpandedTranscript: (expanded) => set({ expandedTranscript: expanded }),

      // ✅ NEW: Editor State Management (Session-specific)
      transcriptEditorContent: {}, // { sessionId: content }
      speakerMappings: {}, // { sessionId: mappings }
      editorHasUnsavedChanges: {}, // { sessionId: boolean }

      setTranscriptEditorContent: (sessionId, content) => 
        set((state) => ({
          transcriptEditorContent: {
            ...state.transcriptEditorContent,
            [sessionId]: content
          }
        })),

      setSpeakerMappings: (sessionId, mappings) => 
        set((state) => ({
          speakerMappings: {
            ...state.speakerMappings,
            [sessionId]: mappings
          }
        })),

      setEditorHasUnsavedChanges: (sessionId, hasChanges) => 
        set((state) => ({
          editorHasUnsavedChanges: {
            ...state.editorHasUnsavedChanges,
            [sessionId]: hasChanges
          }
        })),

      updateEditorState: (sessionId, editorData) => {
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

      // ✅ ENHANCED: AnalysisPage state - FULL MIGRATION TO ZUSTAND
      // Analysis prompts and data
      analysisPrompts: [], // ✅ Migrated from local state
      setAnalysisPrompts: (prompts) => set({ analysisPrompts: prompts }),
      
      analysisSearchTerm: '', // ✅ Migrated from local state
      setAnalysisSearchTerm: (term) => set({ analysisSearchTerm: term }),
      
      analysisSelectedCategory: 'all', // ✅ Migrated from local state
      setAnalysisSelectedCategory: (category) => set({ analysisSelectedCategory: category }),
      
      analysisLoadingPromptData: false, // ✅ Migrated from local state
      setAnalysisLoadingPromptData: (loading) => set({ analysisLoadingPromptData: loading }),
      
      analysisCustomPrompt: '', // ✅ Already existed, keeping
      setAnalysisCustomPrompt: (prompt) => set({ analysisCustomPrompt: prompt }),
      
      analysisShowCustomAnalysis: false, // ✅ Migrated from local state
      setAnalysisShowCustomAnalysis: (show) => set({ analysisShowCustomAnalysis: show }),
      
      // Analysis results and progress - PERSIST ACROSS NAVIGATION
      analysisResults: {}, // ✅ Already existed - session-specific results
      setAnalysisResults: (results) => set({ analysisResults: results }),
      
      analysisProgress: {}, // ✅ Already existed - session-specific progress
      setAnalysisProgress: (progress) => set({ analysisProgress: progress }),
      
      // Loading states
      analysisLoadingPrompts: [], // ✅ Migrated from Set to Array for persistence
      setAnalysisLoadingPrompts: (prompts) => set({ analysisLoadingPrompts: prompts }),
      
      addAnalysisLoadingPrompt: (promptKey) => set((state) => ({
        analysisLoadingPrompts: [...new Set([...state.analysisLoadingPrompts, promptKey])]
      })),
      
      removeAnalysisLoadingPrompt: (promptKey) => set((state) => ({
        analysisLoadingPrompts: state.analysisLoadingPrompts.filter(p => p !== promptKey)
      })),
      
      // ✅ NEW: Polling metadata for background continuation
      analysisPollingIntervals: {}, // ✅ Store polling metadata, not actual intervals
      setAnalysisPollingIntervals: (intervals) => set({ analysisPollingIntervals: intervals }),
      
      addAnalysisPollingInterval: (promptKey, metadata) => set((state) => ({
        analysisPollingIntervals: {
          ...state.analysisPollingIntervals,
          [promptKey]: {
            ...metadata,
            lastCheck: new Date().toISOString()
          }
        }
      })),
      
      removeAnalysisPollingInterval: (promptKey) => set((state) => {
        const newIntervals = { ...state.analysisPollingIntervals };
        delete newIntervals[promptKey];
        return { analysisPollingIntervals: newIntervals };
      }),
      
      // History modal state
      analysisShowHistoryModal: false, // ✅ Already existed, keeping
      setAnalysisShowHistoryModal: (show) => set({ analysisShowHistoryModal: show }),

      // ✅ NEW: Analysis action methods
      clearAnalysisHistory: () => {
        set({
          analysisResults: {},
          analysisProgress: {},
          analysisPollingIntervals: {},
          analysisLoadingPrompts: []
        });
      },
      
      // Update analysis result
      updateAnalysisResult: (promptKey, result) => set((state) => ({
        analysisResults: {
          ...state.analysisResults,
          [promptKey]: result
        }
      })),
      
      // Update analysis progress
      updateAnalysisProgress: (promptKey, progress) => set((state) => ({
        analysisProgress: {
          ...state.analysisProgress,
          [promptKey]: progress
        }
      })),

      // Legacy compatibility fields (for existing components)
      selectedAnalysisSession: '', // ✅ Kept for compatibility
      setSelectedAnalysisSession: (sessionId) => set({ selectedAnalysisSession: sessionId }),
      
      sessionData: null, // ✅ Kept for compatibility  
      setSessionData: (data) => set({ sessionData: data }),
      
      customPrompt: '', // ✅ Legacy alias for analysisCustomPrompt
      setCustomPrompt: (prompt) => set({ 
        customPrompt: prompt,
        analysisCustomPrompt: prompt // Keep both in sync
      }),
      
      loadingPrompts: [], // ✅ Legacy alias for analysisLoadingPrompts
      setLoadingPrompts: (prompts) => set({ 
        loadingPrompts: prompts,
        analysisLoadingPrompts: prompts // Keep both in sync
      }),
      
      backgroundPolling: [], // ✅ Kept for compatibility
      setBackgroundPolling: (polling) => set({ backgroundPolling: polling }),
      
      showHistoryModal: false, // ✅ Legacy alias for analysisShowHistoryModal
      setShowHistoryModal: (show) => set({ 
        showHistoryModal: show,
        analysisShowHistoryModal: show // Keep both in sync
      }),

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

      // ✅ ENHANCED: "Add New" - Reset with Complete Analysis Cleanup
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
          // ✅ COMPLETE ANALYSIS STATE RESET
          analysisPrompts: [],
          analysisSearchTerm: '',
          analysisSelectedCategory: 'all',
          analysisLoadingPromptData: false,
          analysisCustomPrompt: '',
          analysisShowCustomAnalysis: false,
          analysisResults: {},
          analysisProgress: {},
          analysisLoadingPrompts: [],
          analysisPollingIntervals: {},
          analysisShowHistoryModal: false,
          // Legacy compatibility
          selectedAnalysisSession: '',
          sessionData: null,
          customPrompt: '',
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

      // ✅ NEW: Refresh Analysis State - Clear only analysis data, keep UI state
      refreshAnalysisState: () => {
        set({
          analysisResults: {},
          analysisProgress: {},
          analysisPollingIntervals: {},
          analysisLoadingPrompts: [],
          // Keep UI state: searchTerm, selectedCategory, customPrompt, etc.
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