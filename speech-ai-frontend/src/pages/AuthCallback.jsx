// src/pages/AuthCallback.jsx - Fixed to work with new AuthContext

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  ArrowRight,
  Home,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const AuthCallback = () => {
  const { handleLoginCallback, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing'); // processing, success, error
  const [message, setMessage] = useState('Processing authentication...');
  const [countdown, setCountdown] = useState(3);
  const [errorDetails, setErrorDetails] = useState(null);

  useEffect(() => {
    const processCallback = async () => {
      // If already authenticated, redirect immediately
      if (isAuthenticated) {
        console.log('✅ Already authenticated, redirecting home');
        setStatus('success');
        setMessage('Already authenticated! Redirecting...');
        setTimeout(() => navigate('/', { replace: true }), 1000);
        return;
      }

      try {
        console.log('🔄 AuthCallback: Starting callback processing');
        setStatus('processing');
        setMessage('Completing authentication...');

        // Check if we have required URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const error = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');

        console.log('📋 URL params:', { 
          hasCode: !!code, 
          error, 
          errorDescription,
          fullUrl: window.location.href 
        });

        // Check for OAuth errors first
        if (error) {
          throw new Error(`OAuth Error: ${error} - ${errorDescription || 'Unknown error'}`);
        }

        if (!code) {
          throw new Error('No authorization code found in callback URL. Please try logging in again.');
        }

        // Handle the authentication callback
        console.log('🔄 Processing authentication callback...');
        const result = await handleLoginCallback();

        if (result && result.user) {
          console.log('✅ Authentication successful');
          setStatus('success');
          setMessage('Authentication successful! Redirecting...');
          
          // Start countdown for redirect
          const timer = setInterval(() => {
            setCountdown((prev) => {
              if (prev <= 1) {
                clearInterval(timer);
                // Get return URL or default to home
                const returnUrl = result.returnUrl || '/';
                console.log('🔄 Redirecting to:', returnUrl);
                navigate(returnUrl, { replace: true });
                return 0;
              }
              return prev - 1;
            });
          }, 1000);

          return () => clearInterval(timer);
        } else if (isAuthenticated) {
          // If user is authenticated but no result, still redirect
          console.log('✅ User authenticated, redirecting to home');
          setStatus('success');
          setMessage('Authentication successful! Redirecting...');
          setTimeout(() => navigate('/', { replace: true }), 1000);
        } else {
          throw new Error('Authentication completed but no user data was returned');
        }

      } catch (error) {
        console.error('❌ Auth callback error:', error);
        
        setStatus('error');
        setErrorDetails(error.message);
        
        // Set user-friendly error messages
        if (error.message.includes('Invalid state parameter')) {
          setMessage('Security validation failed. Please try logging in again.');
        } else if (error.message.includes('OAuth Error')) {
          setMessage('Authentication was cancelled or failed. Please try again.');
        } else if (error.message.includes('No authorization code')) {
          setMessage('Invalid authentication callback. Please try signing in again.');
        } else if (error.message.includes('Token exchange failed')) {
          setMessage('Failed to exchange authorization code. Please try again.');
        } else if (error.message.includes('User info request failed')) {
          setMessage('Failed to get user information. Please try again.');
        } else {
          setMessage('Authentication failed. Please try signing in again.');
        }
        
        toast.error('Authentication failed');
      }
    };

    processCallback();
  }, [handleLoginCallback, navigate, isAuthenticated]);

  // Handle manual navigation
  const handleGoHome = () => {
    navigate('/', { replace: true });
  };

  const handleRetryLogin = () => {
    // Clear any URL parameters and redirect to login
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full bg-white rounded-xl shadow-xl p-8 text-center"
      >
        
        {/* Status Icon */}
        <div className="mb-6">
          {status === 'processing' && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 mx-auto"
            >
              <Loader2 className="w-16 h-16 text-blue-600" />
            </motion.div>
          )}
          
          {status === 'success' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto"
            >
              <CheckCircle className="w-10 h-10 text-green-600" />
            </motion.div>
          )}
          
          {status === 'error' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto"
            >
              <AlertCircle className="w-10 h-10 text-red-600" />
            </motion.div>
          )}
        </div>

        {/* Status Message */}
        <h1 className={`text-2xl font-bold mb-4 ${
          status === 'success' ? 'text-green-900' :
          status === 'error' ? 'text-red-900' :
          'text-gray-900'
        }`}>
          {status === 'processing' && 'Signing You In'}
          {status === 'success' && 'Welcome Back!'}
          {status === 'error' && 'Authentication Failed'}
        </h1>

        <p className={`text-lg mb-8 ${
          status === 'success' ? 'text-green-600' :
          status === 'error' ? 'text-red-600' :
          'text-gray-600'
        }`}>
          {message}
        </p>

        {/* Success State - Countdown */}
        {status === 'success' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6"
          >
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-700 text-sm">
                Redirecting in {countdown} second{countdown !== 1 ? 's' : ''}...
              </p>
              <div className="w-full bg-green-200 rounded-full h-2 mt-2">
                <motion.div
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: 3, ease: "linear" }}
                  className="bg-green-600 h-2 rounded-full"
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Error Details */}
        {status === 'error' && errorDetails && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6"
          >
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <details className="text-left">
                <summary className="text-red-700 font-medium cursor-pointer">
                  Error Details
                </summary>
                <p className="text-red-600 text-sm mt-2 font-mono">
                  {errorDetails}
                </p>
              </details>
            </div>
          </motion.div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {status === 'success' && (
            <button
              onClick={handleGoHome}
              className="w-full flex items-center justify-center space-x-2 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors"
            >
              <Home className="w-5 h-5" />
              <span>Go to Dashboard</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          )}

          {status === 'error' && (
            <>
              <button
                onClick={handleRetryLogin}
                className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
                <span>Try Again</span>
              </button>
              
              <button
                onClick={handleGoHome}
                className="w-full flex items-center justify-center space-x-2 bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Home className="w-5 h-5" />
                <span>Go Home</span>
              </button>
            </>
          )}
        </div>

        {/* Help Text for Errors */}
        {status === 'error' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6 pt-6 border-t border-gray-200"
          >
            <details className="group text-left">
              <summary className="text-sm text-blue-600 hover:text-blue-700 cursor-pointer text-center">
                Troubleshooting Tips
              </summary>
              <div className="mt-3 text-sm text-gray-600 space-y-2">
                <p>• Clear your browser cache and cookies</p>
                <p>• Make sure you're using the correct login URL</p>
                <p>• Check that Authentik server is running</p>
                <p>• Try using an incognito/private browser window</p>
                <p>• Disable browser extensions that might interfere</p>
                <p>• Contact your administrator if issues persist</p>
              </div>
            </details>
          </motion.div>
        )}

        {/* Processing State - Additional Info */}
        {status === 'processing' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-6 text-sm text-gray-500"
          >
            <p>Verifying your credentials with the authentication server...</p>
            <p className="mt-2 text-xs">This may take a few moments.</p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default AuthCallback;