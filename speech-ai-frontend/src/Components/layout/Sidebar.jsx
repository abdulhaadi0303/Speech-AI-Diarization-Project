// src/Components/layout/SideBar.jsx - Enhanced Navigation for 5-Page Structure
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

// Updated navigation data for 5-page structure with Admin Panel
const navigationItems = [
  { 
    id: 'home', 
    label: 'Home', 
    path: '/', 
    icon: '🏠',
    description: 'Audio Upload & Configuration'
  },
  { 
    id: 'results', 
    label: 'Results', 
    path: '/results', 
    icon: '📊',
    description: 'Processing Status & Results'
  },
  { 
    id: 'analysis', 
    label: 'Analysis', 
    path: '/analysis', 
    icon: '🧠',
    description: 'AI Analysis & Insights'
  },
  { 
    id: 'admin', 
    label: 'Admin', 
    path: '/admin', 
    icon: '⚙️',
    description: 'Prompt Management & Settings'
  },
  { 
    id: 'settings', 
    label: 'Settings', 
    path: '/settings', 
    icon: '🔧',
    description: 'Application Settings'
  }
];

// Desktop Navigation Item Component
const NavItem = ({ item }) => {
  const location = useLocation();
  const isActive = location.pathname === item.path;

  return (
    <Link
      to={item.path}
      className={`flex items-center justify-center p-4 rounded-lg transition-all duration-200 group relative ${
        isActive 
          ? 'bg-cyan-900 text-white shadow-lg' 
          : 'text-cyan-100 hover:bg-cyan-800 hover:text-white hover:scale-105'
      }`}
      title={item.label} // Tooltip on hover
    >
      <span className="text-xl">{item.icon}</span>
      
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

// Desktop Sidebar Component - Export 1
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

// Mobile Breadcrumb Component with Hamburger Menu - Export 2
export function MobileBreadcrumb() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  // Prevent event bubbling to avoid triggering file dialogs
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
    // Allow navigation but prevent bubbling
    e.stopPropagation();
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Hamburger Menu Button - Fixed to prevent file input trigger */}
      <button
        onClick={handleMenuToggle}
        onMouseDown={(e) => e.preventDefault()} // Prevent any mouse down events
        onTouchStart={(e) => e.preventDefault()} // Prevent touch events on mobile
        className="flex flex-col justify-center items-center w-8 h-8 space-y-1 hover:bg-gray-700 rounded p-1 transition-colors relative z-50"
        type="button" // Explicitly set as button type
        aria-label="Toggle navigation menu"
      >
        <div className={`w-5 h-0.5 bg-white transition-all duration-300 ${isOpen ? 'rotate-45 translate-y-1.5' : ''}`}></div>
        <div className={`w-5 h-0.5 bg-white transition-all duration-300 ${isOpen ? 'opacity-0' : ''}`}></div>
        <div className={`w-5 h-0.5 bg-white transition-all duration-300 ${isOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></div>
      </button>
      
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50" 
          onClick={handleBackdropClick}
          onTouchStart={handleBackdropClick}
        ></div>
      )}
      
      {/* Slide-out Menu */}
      <div className={`fixed top-0 left-0 h-full w-72 bg-cyan-700 z-50 transform transition-transform duration-300 ease-in-out shadow-xl ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Menu Header */}
        <div className="flex items-center justify-between p-4 border-b border-cyan-600 bg-cyan-800">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <span className="text-cyan-700 font-bold text-lg">AI</span>
            </div>
            <h2 className="text-white text-lg font-semibold">Navigation</h2>
          </div>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsOpen(false);
            }}
            className="text-white hover:bg-cyan-600 rounded p-1 transition-colors"
            type="button"
            aria-label="Close navigation menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Menu Items */}
        <nav className="p-4">
          <div className="space-y-2">
            {navigationItems.map(item => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  onClick={handleLinkClick}
                  onMouseDown={(e) => e.stopPropagation()} // Prevent event bubbling
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive 
                      ? 'bg-cyan-900 text-white shadow-lg' 
                      : 'text-cyan-100 hover:bg-cyan-800 hover:text-white'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
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
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-cyan-600 bg-cyan-800">
          <div className="text-center">
            <div className="text-cyan-200 text-xs">AI Speech Diarization</div>
            <div className="text-cyan-300 text-xs font-medium">v1.0.0</div>
          </div>
        </div>
      </div>
    </div>
  );
}