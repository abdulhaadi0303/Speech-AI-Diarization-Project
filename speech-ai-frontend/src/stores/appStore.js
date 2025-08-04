// src/stores/appStore.js - Fixed Store with Correct Defaults & Persistence
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
    (set) => ({
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

      // AnalysisPage state
      selectedAnalysisSession: '',
      setSelectedAnalysisSession: (sessionId) => set({ selectedAnalysisSession: sessionId }),
      
      sessionData: null,
      setSessionData: (data) => set({ sessionData: data }),
      
      customPrompt: '',
      setCustomPrompt: (prompt) => set({ customPrompt: prompt }),
      
      analysisResults: {},
      setAnalysisResults: (results) => set({ analysisResults: results }),
      
      analysisProgress: {},
      setAnalysisProgress: (progress) => set({ analysisProgress: progress }),
      
      loadingPrompts: [],
      setLoadingPrompts: (prompts) => set({ loadingPrompts: prompts }),
      
      backgroundPolling: [],
      setBackgroundPolling: (polling) => set({ backgroundPolling: polling }),
      
      showHistoryModal: false,
      setShowHistoryModal: (show) => set({ showHistoryModal: show }),

      // ChatPage state
      selectedChatSession: '',
      setSelectedChatSession: (sessionId) => set({ selectedChatSession: sessionId }),
      
      contextType: 'general',
      setContextType: (type) => set({ contextType: type }),
      
      chatMessages: [],
      setChatMessages: (messages) => set({ chatMessages: messages }),
      
      isLoading: false,
      setIsLoading: (loading) => set({ isLoading: loading }),

      // "Add New" - Reset to working defaults (not blank)
      resetAllState: () => set({
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
        // Clear analysis
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
      }),
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