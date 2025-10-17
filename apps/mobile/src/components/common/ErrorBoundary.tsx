import React, { Component, ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Card } from 'react-native-paper';
import { crashReportingService } from '@/services/crash-reporting.service';
import { analyticsService } from '@/services/analytics.service';
import { theme } from '@/config/theme';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: any;
  errorId?: string;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: any) => void;
  resetKeys?: Array<string | number>;
  resetOnPropsChange?: boolean;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId?: NodeJS.Timeout;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // Report error to crash reporting service
    crashReportingService.setErrorBoundary(error, errorInfo);

    // Track error in analytics
    analyticsService.trackError(
      error.message,
      error.name,
      {
        errorBoundary: true,
        componentStack: errorInfo.componentStack,
        errorId: this.state.errorId,
      }
    ).catch(console.error);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetKeys, resetOnPropsChange } = this.props;
    const { hasError } = this.state;

    // Reset error boundary when resetKeys change
    if (hasError && prevProps.resetKeys !== resetKeys) {
      if (resetKeys && resetKeys.length > 0) {
        this.resetErrorBoundary();
      }
    }

    // Reset error boundary when props change (if enabled)
    if (hasError && resetOnPropsChange && prevProps.children !== this.props.children) {
      this.resetErrorBoundary();
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  resetErrorBoundary = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }

    this.resetTimeoutId = setTimeout(() => {
      this.setState({
        hasError: false,
        error: undefined,
        errorInfo: undefined,
        errorId: undefined,
      });

      // Track error recovery
      analyticsService.trackEvent('error_boundary_recovered', {
        errorId: this.state.errorId,
      }).catch(console.error);
    }, 100);
  };

  handleRetry = () => {
    this.resetErrorBoundary();
  };

  handleReportError = async () => {
    const { error, errorInfo, errorId } = this.state;
    
    if (error) {
      // In a real app, you might send this to your backend
      console.log('Reporting error to backend:', {
        errorId,
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo?.componentStack,
      });

      // Track error report
      analyticsService.trackEvent('error_reported', {
        errorId,
        errorType: error.name,
        errorMessage: error.message,
      }).catch(console.error);
    }
  };

  render() {
    const { hasError, error, errorId } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback;
      }

      // Default error UI
      return (
        <View style={styles.container}>
          <Card style={styles.errorCard}>
            <Card.Content style={styles.errorContent}>
              <Text style={styles.errorTitle}>Something went wrong</Text>
              <Text style={styles.errorMessage}>
                We're sorry, but something unexpected happened. Our team has been notified.
              </Text>
              
              {__DEV__ && error && (
                <View style={styles.debugInfo}>
                  <Text style={styles.debugTitle}>Debug Information:</Text>
                  <Text style={styles.debugText}>Error ID: {errorId}</Text>
                  <Text style={styles.debugText}>Error: {error.message}</Text>
                  {error.stack && (
                    <Text style={styles.debugText} numberOfLines={5}>
                      Stack: {error.stack}
                    </Text>
                  )}
                </View>
              )}

              <View style={styles.buttonContainer}>
                <Button
                  mode="contained"
                  onPress={this.handleRetry}
                  style={styles.retryButton}
                  contentStyle={styles.buttonContent}
                >
                  Try Again
                </Button>
                
                <Button
                  mode="outlined"
                  onPress={this.handleReportError}
                  style={styles.reportButton}
                  contentStyle={styles.buttonContent}
                >
                  Report Issue
                </Button>
              </View>
            </Card.Content>
          </Card>
        </View>
      );
    }

    return children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: theme.colors.background,
  },
  errorCard: {
    width: '100%',
    maxWidth: 400,
    elevation: 4,
  },
  errorContent: {
    padding: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    color: theme.colors.error,
  },
  errorMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    color: theme.colors.onSurface,
    lineHeight: 24,
  },
  debugInfo: {
    backgroundColor: theme.colors.surface,
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.error,
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: theme.colors.error,
  },
  debugText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: theme.colors.onSurface,
    marginBottom: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 12,
  },
  retryButton: {
    flex: 1,
  },
  reportButton: {
    flex: 1,
  },
  buttonContent: {
    paddingVertical: 8,
  },
});

export default ErrorBoundary;