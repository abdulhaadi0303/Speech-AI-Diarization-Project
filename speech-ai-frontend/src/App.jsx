// src/App.jsx - Updated with Editor Styles Import
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Import custom editor styles
import './styles/EditorStyles.css';

// Correct import paths based on your file structure - Fixed case sensitivity
import { Header } from './Components/layout/Header';
import { Sidebar } from './Components/layout/SideBar'; // Note: SideBar with capital B
import HomePage from './pages/HomePage';
import TranscriptionPage from './pages/TranscriptionPage'; // This is our ResultPage
import SettingsPage from './pages/SettingsPage'; // Use the page version
import AnalysisPage from './pages/AnalysisPage'; // New AI Analysis page
import { BackendProvider } from './contexts/BackendContext';
import ErrorBoundary from './Components/common/ErrorBoundary';

const App = () => {
  const [showSidebar, setShowSidebar] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      setShowSidebar(window.innerWidth >= 640); // Hide sidebar below 640px (Tailwind's "sm")
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <ErrorBoundary>
      <BackendProvider>
        <Router
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true
          }}
        >
          <div className="h-screen bg-gray-50 flex">
            {/* Fixed Sidebar - only render above 640px */}
            {showSidebar && (
              <div
                className={`
                  fixed
                  left-0
                  top-0
                  h-full
                  z-40
                  w-[5%]
                  max-[1000px]:w-[6%]
                  max-[850px]:w-[7.5%]
                `}
              >
                <Sidebar />
              </div>
            )}

            {/* Main content area */}
            <div
              className={`
                flex flex-col
                ${showSidebar ? 'ml-[5%] max-[1000px]:ml-[6%] max-[850px]:ml-[7.5%] w-[95%] max-[1000px]:w-[94%] max-[850px]:w-[92.5%]' : 'w-full'}
              `}
            >
              <Header />
              <main className="flex-1 overflow-auto">
                <Routes>
                  {/* HomePage - Audio Upload with Structure/Parameters */}
                  <Route path="/" element={<HomePage />} />
                  
                  {/* ResultPage - Processing Status + Results Display */}
                  <Route path="/results" element={<TranscriptionPage />} />
                  
                  {/* SettingsPage - Keep original settings functionality */}
                  <Route path="/settings" element={<SettingsPage />} />
                  
                  {/* AnalysisPage - New AI Analysis page */}
                  <Route path="/analysis" element={<AnalysisPage />} />
                </Routes>
              </main>
            </div>

            {/* Toast Notifications */}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#1f2937', // gray-800
                  color: '#f9fafb', // gray-50
                  borderRadius: '12px',
                  border: '1px solid #374151', // gray-700
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.1)',
                },
                success: {
                  iconTheme: {
                    primary: '#06b6d4', // cyan-500
                    secondary: '#fff',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#ef4444', // red-500
                    secondary: '#fff',
                  },
                },
                loading: {
                  iconTheme: {
                    primary: '#06b6d4', // cyan-500
                    secondary: '#fff',
                  },
                },
              }}
            />
          </div>
        </Router>
      </BackendProvider>
    </ErrorBoundary>
  );
};

export default App;