// Enhanced Sidebar.jsx with Improved Responsive Navigation
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Home, BarChart3, Brain, Settings, Shield } from 'lucide-react';

// Updated navigation data with proper icons
const navigationItems = [
  { 
    id: 'home', 
    label: 'Home', 
    path: '/', 
    icon: Home,
    description: 'Audio Upload & Configuration'
  },
  { 
    id: 'results', 
    label: 'Results', 
    path: '/results', 
    icon: BarChart3,
    description: 'Processing Status & Results'
  },
  { 
    id: 'analysis', 
    label: 'Analysis', 
    path: '/analysis', 
    icon: Brain,
    description: 'AI Analysis & Insights'
  },
  { 
    id: 'admin', 
    label: 'Admin', 
    path: '/admin', 
    icon: Shield,
    description: 'Prompt Management & Settings'
  },
  { 
    id: 'settings', 
    label: 'Settings', 
    path: '/settings', 
    icon: Settings,
    description: 'Application Settings'
  }
];

// Desktop Navigation Item Component
const NavItem = ({ item, isMobile = false }) => {
  const location = useLocation();
  const isActive = location.pathname === item.path;
  const IconComponent = item.icon;

  if (isMobile) {
    return (
      <Link
        to={item.path}
        className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
          isActive 
            ? 'bg-cyan-900 text-white shadow-lg' 
            : 'text-cyan-100 hover:bg-cyan-800 hover:text-white'
        }`}
      >
        <IconComponent className="w-5 h-5" />
        <div className="flex-1">
          <span className="font-medium">{item.label}</span>
          <div className="text-xs text-cyan-200 opacity-80">
            {item.description}
          </div>
        </div>
        {isActive && (
          <div className="w-2 h-2 bg-white rounded-full"></div>
        )}
      </Link>
    );
  }

  return (
    <Link
      to={item.path}
      className={`flex items-center justify-center p-4 rounded-lg transition-all duration-200 group relative ${
        isActive 
          ? 'bg-cyan-900 text-white shadow-lg' 
          : 'text-cyan-100 hover:bg-cyan-800 hover:text-white hover:scale-105'
      }`}
      title={item.label}
    >
      <IconComponent className="w-6 h-6" />
      
      {/* Enhanced Tooltip */}
      <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap pointer-events-none">
        <div className="font-medium">{item.label}</div>
        <div className="text-xs text-gray-300 mt-1">{item.description}</div>
        {/* Arrow */}
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-full">
          <div className="w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-gray-900"></div>
        </div>
      </div>
    </Link>
  );
};

// Desktop Sidebar Component
export function Sidebar() {
  return (
    <aside className="bg-cyan-700 flex flex-col h-full py-6 shadow-lg">
      {/* Logo/Brand Area */}
      <div className="flex items-center justify-center mb-8">
        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
          <span className="text-cyan-700 font-bold text-lg">AI</span>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <nav className="flex-1 p-2">
        <div className="space-y-3">
          {navigationItems.map(item => (
            <NavItem key={item.id} item={item} />
          ))}
        </div>
      </nav>

      {/* Status Indicator */}
      <div className="p-2 mt-auto">
        <div className="flex items-center justify-center">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
        </div>
      </div>
    </aside>
  );
}

// Enhanced Hamburger Menu Component
export function HamburgerMenu({ className = "" }) {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  // Close menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when menu is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleMenuToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const handleBackdropClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(false);
  };

  const handleLinkClick = (e) => {
    e.stopPropagation();
    setIsOpen(false);
  };

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={handleMenuToggle}
        className={`relative flex flex-col justify-center items-center w-10 h-10 space-y-1 hover:bg-gray-100 rounded-lg p-2 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
        type="button"
        aria-label="Toggle navigation menu"
        aria-expanded={isOpen}
      >
        {/* Hamburger Lines with Animation */}
        <motion.div
          className="w-5 h-0.5 bg-gray-600 rounded-full"
          animate={{
            rotate: isOpen ? 45 : 0,
            y: isOpen ? 4 : 0,
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        />
        <motion.div
          className="w-5 h-0.5 bg-gray-600 rounded-full"
          animate={{
            opacity: isOpen ? 0 : 1,
            x: isOpen ? -10 : 0,
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        />
        <motion.div
          className="w-5 h-0.5 bg-gray-600 rounded-full"
          animate={{
            rotate: isOpen ? -45 : 0,
            y: isOpen ? -4 : 0,
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        />
      </button>
      
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="fixed inset-0 z-40 bg-black bg-opacity-50" 
            onClick={handleBackdropClick}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </AnimatePresence>
      
      {/* Slide-out Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="fixed top-0 left-0 h-full w-80 bg-cyan-700 z-50 shadow-2xl"
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ 
              type: "spring", 
              damping: 20, 
              stiffness: 300,
              duration: 0.3 
            }}
          >
            {/* Menu Header */}
            <div className="flex items-center justify-between p-6 border-b border-cyan-600 bg-cyan-800">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                  <span className="text-cyan-700 font-bold text-xl">AI</span>
                </div>
                <div>
                  <h2 className="text-white text-lg font-semibold">Navigation</h2>
                  <p className="text-cyan-200 text-sm">Speech Analysis Platform</p>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsOpen(false);
                }}
                className="text-white hover:bg-cyan-600 rounded-lg p-2 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
                type="button"
                aria-label="Close navigation menu"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Menu Items */}
            <nav className="p-6">
              <div className="space-y-2">
                {navigationItems.map(item => (
                  <motion.div
                    key={item.id}
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ 
                      delay: navigationItems.indexOf(item) * 0.05,
                      duration: 0.3 
                    }}
                  >
                    <NavItem 
                      item={item} 
                      isMobile={true}
                      onClick={handleLinkClick}
                    />
                  </motion.div>
                ))}
              </div>
            </nav>

            {/* Menu Footer */}
            <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-cyan-600 bg-cyan-800">
              <div className="text-center">
                <div className="text-cyan-200 text-sm font-medium">AI Speech Diarization</div>
                <div className="text-cyan-300 text-xs mt-1">v1.0.0</div>
                <div className="flex items-center justify-center mt-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2"></div>
                  <span className="text-cyan-300 text-xs">System Online</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Legacy Mobile Breadcrumb (kept for backward compatibility)
export function MobileBreadcrumb() {
  return <HamburgerMenu />;
}