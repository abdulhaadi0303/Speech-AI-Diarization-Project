// Updated App.jsx with Enhanced Responsive Layout
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Import custom editor styles
import './styles/EditorStyles.css';

// Context Providers
import { AuthProvider } from './contexts/AuthContext';
import { BackendProvider } from './contexts/BackendContext';

// Components
import ErrorBoundary from './Components/common/ErrorBoundary';
import Header from './Components/layout/Header';
import { Sidebar } from './Components/layout/Sidebar';

// Auth Components
import ProtectedRoute from './components/auth/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import AuthCallback from './pages/AuthCallback';

// Pages
import HomePage from './pages/HomePage';
import TranscriptionPage from './pages/TranscriptionPage';
import SettingsPage from './pages/SettingsPage';
import AnalysisPage from './pages/AnalysisPage';
import AdminDashboard from './pages/AdminPanel';

const App = () => {
  const [showSidebar, setShowSidebar] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      // Show sidebar only on large screens (1024px and above)
      setShowSidebar(window.innerWidth >= 1024);
    };

    // Initial check
    handleResize();
    
    // Add event listener
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <BackendProvider>
          <Router
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true
            }}
          >
            <Routes>
              {/* Public Auth Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route 
                path="/auth/silent-callback" 
                element={<div>Processing authentication...</div>} 
              />

              {/* Protected Routes with Responsive Layout */}
              <Route 
                path="/*" 
                element={
                  <ProtectedRoute>
                    <div className="h-screen bg-gray-50 flex overflow-hidden">
                      
                      {/* Desktop Sidebar - Only visible on large screens */}
                      {showSidebar && (
                        <div className="hidden lg:flex lg:flex-shrink-0">
                          <div className="flex flex-col w-20 xl:w-24">
                            <Sidebar />
                          </div>
                        </div>
                      )}

                      {/* Main Content Area */}
                      <div className="flex flex-col w-0 flex-1 overflow-hidden">
                        {/* Header with Hamburger Menu */}
                        <Header />
                        
                        {/* Main Content */}
                        <main className="flex-1 relative overflow-y-auto focus:outline-none">
                          <Routes>
                            {/* HomePage - Audio Upload with Structure/Parameters */}
                            <Route path="/" element={<HomePage />} />
                            
                            {/* ResultPage - Processing Status + Results Display */}
                            <Route path="/results" element={<TranscriptionPage />} />
                            
                            {/* AnalysisPage - AI Analysis page */}
                            <Route path="/analysis" element={<AnalysisPage />} />
                            
                            {/* AdminPage - Prompt Management Dashboard */}
                            <Route 
                              path="/admin" 
                              element={
                                <ProtectedRoute requireAdmin={true}>
                                  <AdminDashboard />
                                </ProtectedRoute>
                              } 
                            />
                            
                            {/* SettingsPage - Application settings */}
                            <Route path="/settings" element={<SettingsPage />} />
                          </Routes>
                        </main>
                      </div>
                    </div>
                  </ProtectedRoute>
                }
              />
            </Routes>

            {/* Toast Notifications */}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
                success: {
                  duration: 3000,
                  iconTheme: {
                    primary: '#10B981',
                    secondary: '#fff',
                  },
                },
                error: {
                  duration: 5000,
                  iconTheme: {
                    primary: '#EF4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
          </Router>
        </BackendProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;