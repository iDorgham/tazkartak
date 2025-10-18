import React from 'react';
import { ErrorBoundary } from '@sentry/react';
import { Box, Typography, Button, Paper, Alert } from '@mui/material';
import { Refresh as RefreshIcon, Home as HomeIcon } from '@mui/icons-material';

interface SentryErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
  showDialog?: boolean;
}

interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetError }) => {
  const handleRefresh = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        padding: 2,
        backgroundColor: '#f5f5f5',
      }}
    >
      <Paper
        elevation={3}
        sx={{
          padding: 4,
          maxWidth: 600,
          width: '100%',
          textAlign: 'center',
        }}
      >
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="h5" component="h1" gutterBottom>
            Oops! Something went wrong
          </Typography>
        </Alert>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          We're sorry, but something unexpected happened. Our team has been notified and is working to fix this issue.
        </Typography>

        {process.env.NODE_ENV === 'development' && (
          <Box
            sx={{
              backgroundColor: '#f5f5f5',
              padding: 2,
              borderRadius: 1,
              mb: 3,
              textAlign: 'left',
            }}
          >
            <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
              Error Details (Development Only):
            </Typography>
            <Typography
              variant="body2"
              component="pre"
              sx={{
                fontFamily: 'monospace',
                fontSize: '0.75rem',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {error.message}
              {error.stack && `\n\n${error.stack}`}
            </Typography>
          </Box>
        )}

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            sx={{ minWidth: 140 }}
          >
            Refresh Page
          </Button>
          <Button
            variant="outlined"
            startIcon={<HomeIcon />}
            onClick={handleGoHome}
            sx={{ minWidth: 140 }}
          >
            Go Home
          </Button>
          <Button
            variant="text"
            onClick={resetError}
            sx={{ minWidth: 140 }}
          >
            Try Again
          </Button>
        </Box>

        <Typography variant="caption" color="text.secondary" sx={{ mt: 3, display: 'block' }}>
          If this problem persists, please contact our support team.
        </Typography>
      </Paper>
    </Box>
  );
};

const SentryErrorBoundary: React.FC<SentryErrorBoundaryProps> = ({
  children,
  fallback: FallbackComponent = DefaultErrorFallback,
  showDialog = false,
}) => {
  return (
    <ErrorBoundary
      fallback={FallbackComponent}
      showDialog={showDialog}
      beforeCapture={(scope, error, errorInfo) => {
        // Add additional context before capturing the error
        scope.setTag('errorBoundary', true);
        scope.setContext('errorInfo', {
          componentStack: errorInfo.componentStack,
        });
        
        // Add user context if available
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user.id) {
          scope.setUser({
            id: user.id,
            email: user.email,
            username: user.username,
          });
        }
        
        // Add additional context
        scope.setContext('browser', {
          userAgent: navigator.userAgent,
          url: window.location.href,
          timestamp: new Date().toISOString(),
        });
      }}
    >
      {children}
    </ErrorBoundary>
  );
};

export default SentryErrorBoundary;
