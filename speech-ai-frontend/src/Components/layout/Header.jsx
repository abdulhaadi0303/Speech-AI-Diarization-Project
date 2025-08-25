// Enhanced Header.jsx with Hamburger Menu Integration
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  User, 
  Settings, 
  LogOut, 
  Shield, 
  Bell, 
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useBackend } from '../../contexts/BackendContext';
import { HamburgerMenu } from './Sidebar';
import UserProfile from '../auth/UserProfile';
import toast from 'react-hot-toast';

const Header = () => {
  const location = useLocation();
  const { 
    isAuthenticated, 
    user, 
    userProfile, 
    username, 
    email, 
    avatar, 
    role, 
    isAdmin,
    logout 
  } = useAuth();
  
  const { 
    isConnected, 
    isLLMAvailable, 
    systemInfo 
  } = useBackend();

  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      setShowUserMenu(false);
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout failed:', error);
      toast.error('Logout failed');
    }
  };

  // Get page title based on current route
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
        return 'Audio Upload & Analysis';
      case '/results':
        return 'Processing Results';
      case '/analysis':
        return 'AI Analysis & Insights';
      case '/admin':
        return 'Admin Panel';
      case '/settings':
        return 'Application Settings';
      case '/login':
        return 'Sign In';
      default:
        return 'Speech Diarization Platform';
    }
  };

  // Status indicator component
  const StatusIndicator = ({ isConnected, label, color }) => (
    <div className="flex items-center space-x-2">
      <div className={`w-2 h-2 rounded-full ${color} ${isConnected ? 'animate-pulse' : ''}`} />
      <span className="text-xs text-gray-600 hidden sm:inline">{label}</span>
    </div>
  );

  return (
    <>
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Left Side - Hamburger Menu + Logo */}
            <div className="flex items-center space-x-4">
              {/* Hamburger Menu - Only visible on mobile/tablet */}
              <div className="lg:hidden">
                <HamburgerMenu />
              </div>

              {/* Logo and Title */}
              <Link to="/" className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-xl font-bold text-gray-900">
                    Speech Analysis
                  </h1>
                  <p className="text-sm text-gray-500 hidden md:block">
                    {getPageTitle()}
                  </p>
                </div>
              </Link>
            </div>

            {/* Right Side - Status + User Menu */}
            <div className="flex items-center space-x-4">
              
              {/* System Status - Hidden on small screens */}
              <div className="hidden md:flex items-center space-x-4">
                <StatusIndicator
                  isConnected={isConnected}
                  label="Backend"
                  color={isConnected ? 'bg-green-500' : 'bg-red-500'}
                />
                <StatusIndicator
                  isConnected={isLLMAvailable}
                  label="LLM"
                  color={isLLMAvailable ? 'bg-green-500' : 'bg-yellow-500'}
                />
              </div>

              {/* Mobile Status Indicators */}
              <div className="flex md:hidden items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <div className={`w-3 h-3 rounded-full ${isLLMAvailable ? 'bg-green-500' : 'bg-yellow-500'}`} />
              </div>

              {/* Authentication Section */}
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      {avatar ? (
                        <img 
                          src={avatar} 
                          alt="User Avatar" 
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-4 h-4 text-blue-600" />
                      )}
                    </div>
                    <div className="hidden sm:block text-left">
                      <div className="text-sm font-medium text-gray-900">
                        {username || email || 'User'}
                      </div>
                      {role && (
                        <div className="text-xs text-gray-500 capitalize">
                          {role}
                        </div>
                      )}
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-400 hidden sm:block" />
                  </button>

                  {/* User Dropdown Menu */}
                  {showUserMenu && (
                    <>
                      {/* Backdrop for mobile */}
                      <div 
                        className="fixed inset-0 z-10 md:hidden" 
                        onClick={() => setShowUserMenu(false)}
                      />
                      
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20"
                      >
                        {/* User Info */}
                        <div className="px-4 py-3 border-b border-gray-100">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              {avatar ? (
                                <img 
                                  src={avatar} 
                                  alt="User Avatar" 
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                              ) : (
                                <User className="w-5 h-5 text-blue-600" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-900 truncate">
                                {username || 'User'}
                              </div>
                              <div className="text-xs text-gray-500 truncate">
                                {email}
                              </div>
                              {role && (
                                <div className="text-xs text-blue-600 capitalize">
                                  {role}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Menu Items */}
                        <div className="py-1">
                          <button
                            onClick={() => {
                              setShowUserProfile(true);
                              setShowUserMenu(false);
                            }}
                            className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <User className="w-4 h-4" />
                            <span>View Profile</span>
                          </button>

                          <Link
                            to="/settings"
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <Settings className="w-4 h-4" />
                            <span>Settings</span>
                          </Link>

                          {isAdmin && (
                            <Link
                              to="/admin"
                              onClick={() => setShowUserMenu(false)}
                              className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <Shield className="w-4 h-4" />
                              <span>Admin Panel</span>
                            </Link>
                          )}

                          <div className="border-t border-gray-100 my-1"></div>

                          <button
                            onClick={handleLogout}
                            className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <LogOut className="w-4 h-4" />
                            <span>Sign Out</span>
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </div>
              ) : (
                <Link
                  to="/login"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* User Profile Modal */}
      {showUserProfile && (
        <UserProfile 
          isOpen={showUserProfile}
          onClose={() => setShowUserProfile(false)}
        />
      )}
    </>
  );
};

export default Header;