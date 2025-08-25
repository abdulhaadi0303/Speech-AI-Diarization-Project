// src/components/auth/UserProfile.jsx - User Profile Component

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Settings,
  LogOut,
  Shield,
  Clock,
  Activity,
  Edit3,
  Save,
  X,
  ChevronDown,
  Monitor,
  Smartphone,
  Tablet
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { backendApi } from '../../services/api';
import toast from 'react-hot-toast';

const UserProfile = ({ isOpen, onClose }) => {
  const { 
    user, 
    userProfile, 
    username, 
    email, 
    fullName, 
    avatar, 
    role, 
    isAdmin,
    logout,
    refreshUser
  } = useAuth();

  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  
  // Form data for editing profile
  const [editForm, setEditForm] = useState({
    full_name: fullName || '',
    first_name: userProfile?.given_name || '',
    last_name: userProfile?.family_name || ''
  });

  // Load user data when modal opens
  useEffect(() => {
    if (isOpen) {
      loadUserData();
      loadUserSessions();
    }
  }, [isOpen]);

  const loadUserData = async () => {
    try {
      const response = await backendApi.auth.getCurrentUser();
      setUserInfo(response.data);
      
      // Update form with latest data
      setEditForm({
        full_name: response.data.user.full_name || '',
        first_name: response.data.user.first_name || '',
        last_name: response.data.user.last_name || ''
      });
    } catch (error) {
      console.error('Failed to load user data:', error);
      toast.error('Failed to load user information');
    }
  };

  const loadUserSessions = async () => {
    try {
      const response = await backendApi.auth.getSessions();
      setSessions(response.data.sessions || []);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      setLoading(true);
      
      await backendApi.auth.updateProfile(editForm);
      
      toast.success('Profile updated successfully');
      setIsEditing(false);
      await refreshUser();
      await loadUserData();
      
    } catch (error) {
      console.error('Profile update failed:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeSession = async (sessionId) => {
    try {
      await backendApi.auth.revokeSession(sessionId);
      toast.success('Session revoked successfully');
      await loadUserSessions();
    } catch (error) {
      console.error('Failed to revoke session:', error);
      toast.error('Failed to revoke session');
    }
  };

  const handleLogoutAll = async () => {
    try {
      await logout(true); // Logout from all sessions
      onClose();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const getDeviceIcon = (deviceType) => {
    switch (deviceType?.toLowerCase()) {
      case 'mobile':
        return <Smartphone className="w-4 h-4" />;
      case 'tablet':
        return <Tablet className="w-4 h-4" />;
      default:
        return <Monitor className="w-4 h-4" />;
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Never';
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  const getRoleBadgeColor = (userRole) => {
    switch (userRole) {
      case 'superadmin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'admin':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  {avatar ? (
                    <img
                      src={avatar}
                      alt={fullName || username}
                      className="w-14 h-14 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-8 h-8" />
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{fullName || username}</h2>
                  <p className="text-blue-100">{email}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Shield className="w-4 h-4" />
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(role)}`}>
                      {role?.charAt(0).toUpperCase() + role?.slice(1)}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-6 px-6">
              {[
                { id: 'profile', label: 'Profile', icon: User },
                { id: 'sessions', label: 'Sessions', icon: Activity },
                { id: 'security', label: 'Security', icon: Shield }
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center space-x-2 py-4 border-b-2 transition-colors ${
                    activeTab === id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6 max-h-96 overflow-y-auto">
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Profile Information</h3>
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span>Edit</span>
                    </button>
                  ) : (
                    <div className="flex space-x-2">
                      <button
                        onClick={handleUpdateProfile}
                        disabled={loading}
                        className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        <Save className="w-4 h-4" />
                        <span>Save</span>
                      </button>
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setEditForm({
                            full_name: fullName || '',
                            first_name: userProfile?.given_name || '',
                            last_name: userProfile?.family_name || ''
                          });
                        }}
                        className="flex items-center space-x-2 text-gray-600 hover:text-gray-700"
                      >
                        <X className="w-4 h-4" />
                        <span>Cancel</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.full_name}
                        onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900">{userInfo?.user?.full_name || 'Not set'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <p className="text-gray-900">{email}</p>
                    <p className="text-xs text-gray-500">Managed by SSO provider</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.first_name}
                        onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900">{userInfo?.user?.first_name || 'Not set'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.last_name}
                        onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900">{userInfo?.user?.last_name || 'Not set'}</p>
                    )}
                  </div>
                </div>

                {userInfo && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Account Information</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Member Since</p>
                        <p className="font-medium">{formatDateTime(userInfo.user.created_at)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Last Login</p>
                        <p className="font-medium">{formatDateTime(userInfo.user.last_login)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Login Count</p>
                        <p className="font-medium">{userInfo.user.login_count || 0}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Verified</p>
                        <p className="font-medium">
                          {userInfo.user.is_verified ? '✅ Yes' : '❌ No'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'sessions' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Active Sessions</h3>
                  <button
                    onClick={loadUserSessions}
                    className="text-blue-600 hover:text-blue-700 text-sm"
                  >
                    Refresh
                  </button>
                </div>

                {sessions.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No active sessions found</p>
                ) : (
                  <div className="space-y-3">
                    {sessions.map((session) => (
                      <div
                        key={session.id}
                        className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {getDeviceIcon(session.device_type)}
                            <div>
                              <p className="font-medium text-gray-900">
                                {session.browser} on {session.os}
                              </p>
                              <p className="text-sm text-gray-500">
                                {session.ip_address} • {formatTimeAgo(session.last_activity)}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRevokeSession(session.session_id)}
                            className="text-red-600 hover:text-red-700 text-sm font-medium"
                          >
                            Revoke
                          </button>
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
                          Created: {formatDateTime(session.created_at)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Security Settings</h3>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 text-blue-800 mb-2">
                    <Shield className="w-5 h-5" />
                    <h4 className="font-medium">SSO Authentication</h4>
                  </div>
                  <p className="text-blue-700 text-sm">
                    Your account is secured with Single Sign-On (SSO) authentication. 
                    Password and security settings are managed by your organization.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Two-Factor Authentication</h4>
                      <p className="text-sm text-gray-500">Managed by SSO provider</p>
                    </div>
                    <span className="text-green-600 text-sm font-medium">Active</span>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Session Timeout</h4>
                      <p className="text-sm text-gray-500">Automatic logout after inactivity</p>
                    </div>
                    <span className="text-gray-600 text-sm font-medium">8 hours</span>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <button
                    onClick={handleLogoutAll}
                    className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Sign Out of All Devices</span>
                  </button>
                  <p className="text-xs text-gray-500 text-center mt-2">
                    This will end all active sessions on all devices
                  </p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default UserProfile;