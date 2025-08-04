// src/pages/ChatPage.jsx - AI Assistant Chat Interface
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Bot, 
  User, 
  Loader2, 
  MessageSquare,
  Sparkles,
  FileText,
  AlertCircle
} from 'lucide-react';
import { useBackend } from '../contexts/BackendContext';
import { backendApi } from '../services/api';
import toast from 'react-hot-toast';

const ChatPage = () => {
  const { isConnected, isLLMAvailable, activeSessions } = useBackend();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSession, setSelectedSession] = useState('');
  const [contextType, setContextType] = useState('general');
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Welcome message
  useEffect(() => {
    if (messages.length === 0 && isLLMAvailable) {
      setMessages([{
        id: Date.now(),
        type: 'assistant',
        content: `👋 Hello! I'm your AI assistant for speech analysis. I can help you with:

• **General Questions**: Ask me anything about speech analysis, transcription, or AI
• **Transcript Analysis**: Select a processed session to analyze specific conversations
• **Insights & Summaries**: Get detailed analysis of your transcribed content

How can I assist you today?`,
        timestamp: new Date()
      }]);
    }
  }, [isLLMAvailable, messages.length]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await backendApi.chatWithLLM({
        message: userMessage.content,
        session_id: selectedSession,
        context_type: contextType
      });

      const assistantMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: response.data.response,
        timestamp: new Date(),
        model: response.data.model
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: `I apologize, but I encountered an error: ${error.userMessage || 'Unable to process your request'}. Please try again.`,
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
      toast.error('Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTimestamp = (timestamp) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getSessionOptions = () => {
    return Array.from(activeSessions.entries()).map(([sessionId, sessionData]) => ({
      id: sessionId,
      name: `Session ${sessionId.slice(0, 8)}...`,
      status: sessionData.status
    }));
  };

  if (!isConnected) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Backend Disconnected</h2>
          <p className="text-gray-600">Please ensure the backend server is running to use the AI assistant.</p>
        </div>
      </div>
    );
  }

  if (!isLLMAvailable) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <Bot className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">AI Assistant Offline</h2>
          <p className="text-gray-600 mb-4">The LLM service is not available. Please check Ollama setup.</p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left text-sm">
            <div className="font-medium text-yellow-800 mb-2">To start Ollama:</div>
            <code className="block bg-white p-2 rounded border text-yellow-900">
              ollama serve
            </code>
            <div className="mt-2 text-yellow-700">
              Make sure the model is downloaded: <code>ollama pull llama3.2:3b</code>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">AI Assistant</h1>
              <p className="text-gray-600">Chat with AI about your transcriptions and analysis</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 text-sm">
            <Sparkles className="w-4 h-4 text-green-500" />
            <span className="text-green-600 font-medium">LLM Ready</span>
          </div>
        </div>
      </div>

      {/* Context Selection */}
      <div className="mb-6 bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center space-x-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chat Context
            </label>
            <select
              value={contextType}
              onChange={(e) => setContextType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="general">General Assistant</option>
              <option value="transcript">Transcript Analysis</option>
            </select>
          </div>

          {contextType === 'transcript' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Session
              </label>
              <select
                value={selectedSession}
                onChange={(e) => setSelectedSession(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={getSessionOptions().length === 0}
              >
                <option value="">
                  {getSessionOptions().length === 0 ? 'No sessions available' : 'Select a session...'}
                </option>
                {getSessionOptions().map((session) => (
                  <option key={session.id} value={session.id}>
                    {session.name} ({session.status})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex space-x-3 max-w-3xl ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  {/* Avatar */}
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    message.type === 'user' 
                      ? 'bg-blue-100 text-blue-600' 
                      : message.isError
                      ? 'bg-red-100 text-red-600'
                      : 'bg-purple-100 text-purple-600'
                  }`}>
                    {message.type === 'user' ? (
                      <User className="w-4 h-4" />
                    ) : message.isError ? (
                      <AlertCircle className="w-4 h-4" />
                    ) : (
                      <Bot className="w-4 h-4" />
                    )}
                  </div>

                  {/* Message Content */}
                  <div className={`flex flex-col ${message.type === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`px-4 py-3 rounded-xl ${
                      message.type === 'user'
                        ? 'bg-blue-500 text-white'
                        : message.isError
                        ? 'bg-red-50 text-red-900 border border-red-200'
                        : 'bg-gray-50 text-gray-900 border border-gray-200'
                    }`}>
                      <div className="prose prose-sm max-w-none">
                        {message.content.split('\n').map((line, index) => (
                          <div key={index} className={line.startsWith('•') ? 'ml-4' : ''}>
                            {line.includes('**') ? (
                              <span dangerouslySetInnerHTML={{
                                __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                              }} />
                            ) : (
                              line
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 mt-1 text-xs text-gray-500">
                      <span>{formatTimestamp(message.timestamp)}</span>
                      {message.model && (
                        <>
                          <span>•</span>
                          <span>{message.model}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Loading Indicator */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                    <span className="text-sm text-gray-600">AI is thinking...</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-end space-x-3">
            <div className="flex-1">
              <textarea
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  contextType === 'transcript' && !selectedSession
                    ? 'Select a session to analyze transcripts, or switch to general mode...'
                    : 'Type your message... (Press Enter to send, Shift+Enter for new line)'
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                rows="3"
                disabled={isLoading || (contextType === 'transcript' && !selectedSession)}
              />
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading || (contextType === 'transcript' && !selectedSession)}
              className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;