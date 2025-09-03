// src/contexts/AuthContext.jsx - Simple Working Version (Bypasses OIDC Client Issues)

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

// Authentication context
const AuthContext = createContext(null);

// Simple auth provider that works directly with Authentik
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [permissions, setPermissions] = useState({});

  // Configuration - matches your working setup 
  const authConfig = {
    authentikUrl: 'http://localhost:9000',
    appPath: '/application/o/speech-analysis',
    clientId: 'hmYQcraW22qApmnJUbm36UOpwgUzVLTV5spl704r',  // ✅ Your new client ID
    clientSecret: 'fhf8On3hqFhDGOAM9RsSqxRIFsalxD6O5TCIhBpmXMJoL0RcAErdYYnSyvnKW2Ozf2SALi62Ks7KSPyHCupSl5g78hynBIUBFSV0EiirglsGdf3Jaw0pk6rljzsmUaST',  // ✅ Your new client secret
    redirectUri: `${window.location.origin}/auth/callback`,
    // Fixed URLs with port 9000
    authorizeUrl: 'http://localhost:9000/application/o/authorize/',
    tokenUrl: 'http://localhost:9000/application/o/token/',
    userinfoUrl: 'http://localhost:9000/application/o/userinfo/'
  };
  // Check for existing session on load
  useEffect(() => {
    const checkExistingSession = () => {
      try {
        const storedUser = localStorage.getItem('auth_user');
        const storedToken = localStorage.getItem('access_token');
        
        if (storedUser && storedToken) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          setIsAuthenticated(true);
          updateUserPermissions(userData);
          console.log('✅ Restored existing session');
        }
      } catch (error) {
        console.error('Failed to restore session:', error);
        localStorage.removeItem('auth_user');
        localStorage.removeItem('access_token');
      } finally {
        setIsLoading(false);
      }
    };

    checkExistingSession();
  }, []);

  // Update user permissions
  const updateUserPermissions = useCallback((userData) => {
    const groups = userData?.groups || [];
    const role = determineUserRole(groups);
    
    const newPermissions = {
      role,
      isAdmin: ['admin', 'superadmin'].includes(role),
      isSuperAdmin: role === 'superadmin',
      groups,
      canUpload: true,
      canAnalyze: true,
      canManagePrompts: ['admin', 'superadmin'].includes(role),
      canManageUsers: role === 'superadmin',
    };

    setPermissions(newPermissions);
  }, []);

  // Determine user role from groups
  const determineUserRole = useCallback((groups) => {
    if (!Array.isArray(groups)) return 'user';
    
    const lowerGroups = groups.map(g => String(g).toLowerCase());
    
    if (lowerGroups.some(g => ['superadmin', 'super-admin'].includes(g))) {
      return 'superadmin';
    }
    if (lowerGroups.some(g => ['admin', 'admins'].includes(g))) {
      return 'admin';
    }
    return 'user';
  }, []);

  // Start login process - redirect to Authentik
  const login = useCallback(async () => {
    try {
      console.log('🔄 Starting login process...');
      setIsLoading(true);
      
      // Store current location for redirect after login
      const currentPath = window.location.pathname + window.location.search;
      localStorage.setItem('auth_return_url', currentPath);
      
      // Generate state for security
      const state = Math.random().toString(36).substring(7);
      localStorage.setItem('auth_state', state);
      
      // Build authorization URL
      const params = new URLSearchParams({
        client_id: authConfig.clientId,
        response_type: 'code',
        scope: 'openid profile email groups',
        redirect_uri: authConfig.redirectUri,
        state: state
      });
      
      const authUrl = `${authConfig.authorizeUrl}?${params.toString()}`;
      console.log('🚀 Redirecting to Authentik:', authUrl);
      
      // Redirect to Authentik
      window.location.href = authUrl;
      
    } catch (error) {
      console.error('❌ Login failed:', error);
      toast.error('Login failed. Please try again.');
      setIsLoading(false);
    }
  }, []);

  // Handle callback from Authentik
  const handleLoginCallback = useCallback(async () => {
    try {
      console.log('🔄 Processing login callback...');
      setIsLoading(true);
      
      // Extract parameters from URL
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      const error = urlParams.get('error');
      
      console.log('📋 Callback params:', { 
        hasCode: !!code, 
        state, 
        hasError: !!error 
      });

      // Check for errors
      if (error) {
        throw new Error(`OAuth Error: ${error}`);
      }
      
      if (!code) {
        throw new Error('No authorization code received');
      }

      // Verify state parameter
      const storedState = localStorage.getItem('auth_state');
      if (state !== storedState) {
        throw new Error('Invalid state parameter - possible CSRF attack');
      }

      // Exchange code for tokens using your working token endpoint
      console.log('🔄 Exchanging code for tokens...');
      
      const tokenFormData = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: authConfig.clientId,
        client_secret: authConfig.clientSecret,
        code: code,
        redirect_uri: authConfig.redirectUri
      });

      const tokenResponse = await fetch(authConfig.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: tokenFormData
      });

      if (!tokenResponse.ok) {
        throw new Error(`Token exchange failed: ${tokenResponse.status}`);
      }

      const tokenData = await tokenResponse.json();
      console.log('✅ Token exchange successful');

      // Get user info using the access token
      console.log('🔄 Getting user info...');
      
      const userinfoResponse = await fetch(authConfig.userinfoUrl, {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Accept': 'application/json'
        }
      });

      if (!userinfoResponse.ok) {
        throw new Error(`User info request failed: ${userinfoResponse.status}`);
      }

      const userInfo = await userinfoResponse.json();
      console.log('✅ User info retrieved:', userInfo);

      // Create user object
      const userData = {
        id: userInfo.sub,
        username: userInfo.preferred_username || userInfo.username,
        email: userInfo.email,
        name: userInfo.name,
        first_name: userInfo.given_name,
        last_name: userInfo.family_name,
        groups: userInfo.groups || [],
        avatar_url: userInfo.picture,
        is_verified: userInfo.email_verified || false
      };

      // Store authentication data
      localStorage.setItem('auth_user', JSON.stringify(userData));
      localStorage.setItem('access_token', tokenData.access_token);
      if (tokenData.refresh_token) {
        localStorage.setItem('refresh_token', tokenData.refresh_token);
      }

      // Set state
      setUser(userData);
      setIsAuthenticated(true);
      updateUserPermissions(userData);

      // Clean up temporary storage
      localStorage.removeItem('auth_state');

      toast.success(`Welcome back, ${userData.name || userData.username}!`);

      // Get return URL
      const returnUrl = localStorage.getItem('auth_return_url') || '/';
      localStorage.removeItem('auth_return_url');

      return { user: userData, returnUrl };

    } catch (error) {
      console.error('❌ Login callback failed:', error);
      
      // Clean up on error
      localStorage.removeItem('auth_state');
      localStorage.removeItem('auth_return_url');
      localStorage.removeItem('auth_user');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      
      setUser(null);
      setIsAuthenticated(false);
      setPermissions({});
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [updateUserPermissions]);

  // Logout function
 // Enhanced logout function for AuthContext.jsx
// Simple default logout function that always requires credentials next time
// Fixed logout function that properly redirects to login page
const logout = useCallback(async () => {
  try {
    console.log('🔄 Logging out from Speech App...');
    
    // 1. Get the current access token BEFORE clearing storage
    const currentToken = localStorage.getItem('access_token');
    
    // 2. Call backend logout first (while we still have the token)
    if (currentToken) {
      try {
        await fetch(`${import.meta.env.VITE_BACKEND_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${currentToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ all_sessions: false })
        });
        console.log('✅ Backend logout successful');
      } catch (error) {
        console.warn('Backend logout call failed:', error);
        // Continue with logout even if backend call fails
      }
    }
    
    // 3. Clear all local authentication data
    localStorage.removeItem('auth_user');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('auth_state');
    localStorage.removeItem('auth_return_url');
    
    // Also clear session storage
    sessionStorage.removeItem('auth_user');
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('refresh_token');
    
    // 4. Clear app state immediately
    setUser(null);
    setIsAuthenticated(false);
    setPermissions({});
    
    // 5. Clear axios authorization header
    if (window.backendApi?.setAuthToken) {
      window.backendApi.setAuthToken(null);
    }
    
    // 6. Simple approach: Just navigate to login page
    // This will clear the app session but keep SSO session active
    console.log('🔄 Redirecting to login page...');
    window.location.replace('/login');
    
    // Alternative: If you want to force SSO logout (uncomment the lines below)
    /*
    const authentikLogoutUrl = `${authConfig.authentikUrl}/application/o/speech-analysis/end-session/`;
    const returnUrl = `${window.location.origin}/login`;
    const fullLogoutUrl = `${authentikLogoutUrl}?post_logout_redirect_uri=${encodeURIComponent(returnUrl)}`;
    
    console.log('🔒 Redirecting to full SSO logout...');
    window.location.href = fullLogoutUrl;
    */
    
  } catch (error) {
    console.error('❌ Logout failed:', error);
    
    // Fallback: Force cleanup and go to login page
    localStorage.clear();
    sessionStorage.clear();
    
    // Clear state
    setUser(null);
    setIsAuthenticated(false);
    setPermissions({});
    
    // Navigate to login page
    window.location.replace('/login');
  }
}, [authConfig.authentikUrl]);

// Export the simple logout function
const value = {
  user,
  isLoading,
  isAuthenticated,
  permissions,
  authConfig,
  login,
  logout, // Simple, default logout that always requires credentials
  handleLoginCallback,
  // Additional convenience properties
  isAdmin: permissions.isAdmin || false,
  isSuperAdmin: permissions.isSuperAdmin || false,
  userRole: permissions.role,
  userGroups: permissions.groups || [],
  userName: user?.name || user?.username,
  userEmail: user?.email
};
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use authentication context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;