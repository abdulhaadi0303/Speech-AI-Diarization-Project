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

  const getRoleBadgeColor = (userRole) => {
    switch (userRole) {
      case 'superadmin':
        return 'bg-psycon-purple/10 text-psycon-purple border-psycon-purple/20';
      case 'admin':
        return 'bg-psycon-mint/10 text-psycon-mint border-psycon-mint/20';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

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
      <header className="bg-white border-b border-gray-300 shadow-sm sticky top-0 z-30">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Left Side - Logo & Mobile Menu */}
            <div className="flex items-center">
              {/* Mobile Hamburger Menu - Only visible on mobile */}
              <div className="lg:hidden mr-4">
                <HamburgerMenu />
              </div>
              
              {/* Logo */}
              <Link to="/" className="flex items-center ">
                <img 
                  src="/Logo.png" 
                  alt="PsyConTech" 
                  className="h-14 w-auto"
                />
              </Link>

              <Link to="/" className="flex items-center ">
                <img 
                  src="/Text.png" 
                  alt="PsyConTech" 
                  className="h-11 w-auto"
                />
              </Link>
            </div>
  
            {/* Center - Page Title */}
            <div className="hidden md:block">
              <h1 className="text-lg font-semibold text-psycon-purple-600">
                {getPageTitle()}
              </h1>
            </div>
  
            {/* Right Side - Status Indicators & User Menu */}
            <div className="flex items-center space-x-4">
              
              {/* System Status Indicators */}
              <div className="hidden sm:flex items-center space-x-3 text-sm">
                <StatusIndicator 
                  isConnected={isConnected} 
                  label="Backend" 
                  color={isConnected ? 'bg-green-400' : 'bg-red-400'}
                />
                <StatusIndicator 
                  isConnected={isLLMAvailable} 
                  label="LLM" 
                  color={isLLMAvailable ? 'bg-psycon-yellow' : 'bg-gray-400'}
                />
              </div>
  
              {/* User Menu */}
              <div className="flex items-center space-x-3">
                {isAuthenticated ? (
                  <div className="relative">
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="flex items-center space-x-3 p-2 rounded-lg hover:bg-psycon-light-teal/10 transition-colors focus:outline-none focus:ring-2 focus:ring-psycon-mint"
                    >
                      <div className="w-8 h-8 bg-gradient-to-br from-psycon-mint to-psycon-purple rounded-full flex items-center justify-center">
                        {avatar ? (
                          <img src={avatar} alt="Avatar" className="w-8 h-8 rounded-full" />
                        ) : (
                          <User className="w-5 h-5 text-white" />
                        )}
                      </div>
                      <div className="hidden sm:block text-left">
                        <div className="text-sm font-medium text-gray-900">
                          {username || email || 'User'}
                        </div>
                        <div className="text-xs text-gray-500 capitalize">
                          {role || 'user'}
                        </div>
                      </div>
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </button>
  
                    {/* User Dropdown Menu */}
                    {showUserMenu && (
                      <>
                        <div 
                          className="fixed inset-0 z-10" 
                          onClick={() => setShowUserMenu(false)}
                        />
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-20"
                        >
                          <div className="p-4 border-b border-gray-100">
                            <div className="text-sm font-medium text-gray-900">
                              {username || email}
                            </div>
                            <div className="text-xs text-gray-500">
                              {email}
                            </div>
                            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-2 border ${getRoleBadgeColor(role)}`}>
                              {role === 'superadmin' && (
                                <>
                                  <Shield className="w-3 h-3 mr-1" />
                                  Super Admin
                                </>
                              )}
                              {role === 'admin' && (
                                <>
                                  <Shield className="w-3 h-3 mr-1" />
                                  Admin
                                </>
                              )}
                              {!role || role === 'user' && (
                                <>
                                  <User className="w-3 h-3 mr-1" />
                                  User
                                </>
                              )}
                            </div>
                          </div>
  
                          <div className="py-2">
                            <button
                              onClick={() => {
                                setShowUserProfile(true);
                                setShowUserMenu(false);
                              }}
                              className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-psycon-light-teal/10 transition-colors"
                            >
                              <User className="w-4 h-4" />
                              <span>Profile Details</span>
                            </button>
  
                            <Link
                              to="/settings"
                              className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-psycon-light-teal/10 transition-colors"
                              onClick={() => setShowUserMenu(false)}
                            >
                              <Settings className="w-4 h-4" />
                              <span>Settings</span>
                            </Link>
  
                            {isAdmin && (
                              <Link
                                to="/admin"
                                className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-psycon-light-teal/10 transition-colors"
                                onClick={() => setShowUserMenu(false)}
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
                    className="inline-flex items-center px-4 py-2 border border-psycon-mint text-sm font-medium rounded-lg text-psycon-mint bg-white hover:bg-psycon-light-teal/10 transition-colors"
                  >
                    Sign In
                  </Link>
                )}
              </div>
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