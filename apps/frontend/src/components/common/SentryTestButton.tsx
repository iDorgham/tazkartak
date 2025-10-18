import React, { useState } from 'react';
import { Button, Box, Typography, Alert } from '@mui/material';
import { BugReport as BugReportIcon, Speed as SpeedIcon, Message as MessageIcon } from '@mui/icons-material';
import { sentryService } from '../../services/sentry.service';

interface SentryTestButtonProps {
  showInProduction?: boolean;
}

const SentryTestButton: React.FC<SentryTestButtonProps> = ({ 
  showInProduction = false 
}) => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isTesting, setIsTesting] = useState(false);

  // Only show in development or if explicitly enabled
  if (process.env.NODE_ENV === 'production' && !showInProduction) {
    return null;
  }

  const runTests = async () => {
    setIsTesting(true);
    setTestResults([]);
    
    const results: string[] = [];
    
    try {
      // Test 1: Basic integration
      results.push('✓ Testing Sentry integration...');
      sentryService.testIntegration();
      results.push('✓ Sentry integration test completed');
      
      // Test 2: Performance tracking
      results.push('✓ Testing performance tracking...');
      const startTime = Date.now();
      await new Promise(resolve => setTimeout(resolve, 100));
      const duration = Date.now() - startTime;
      
      sentryService.trackPerformance({
        name: 'test.performance',
        value: duration,
        unit: 'ms',
        tags: { test: 'true' },
      });
      results.push(`✓ Performance tracking test completed (${duration}ms)`);
      
      // Test 3: User action tracking
      results.push('✓ Testing user action tracking...');
      sentryService.trackUserAction('test_button_clicked', 'sentry_test_button', {
        timestamp: new Date().toISOString(),
        test: true,
      });
      results.push('✓ User action tracking test completed');
      
      // Test 4: API call simulation
      results.push('✓ Testing API call tracking...');
      const apiStartTime = Date.now();
      await new Promise(resolve => setTimeout(resolve, 50));
      const apiDuration = Date.now() - apiStartTime;
      
      sentryService.trackApiCall('/api/test', 'GET', apiDuration, 200);
      results.push(`✓ API call tracking test completed (${apiDuration}ms)`);
      
      // Test 5: Form submission tracking
      results.push('✓ Testing form submission tracking...');
      sentryService.trackFormSubmission('test_form', true);
      results.push('✓ Form submission tracking test completed');
      
      results.push('🎉 All Sentry tests completed successfully!');
      results.push('Check your Sentry dashboard for the captured data.');
      
    } catch (error) {
      results.push(`❌ Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      sentryService.captureException(error instanceof Error ? error : new Error('Test failed'));
    }
    
    setTestResults(results);
    setIsTesting(false);
  };

  const triggerError = () => {
    try {
      // This will trigger an error that should be caught by Sentry
      throw new Error('Test error triggered by SentryTestButton');
    } catch (error) {
      sentryService.captureException(error as Error, {
        component: 'SentryTestButton',
        action: 'trigger_error',
        timestamp: new Date().toISOString(),
      });
      
      setTestResults(prev => [
        ...prev,
        '⚠️ Test error triggered and captured by Sentry',
        'Check your Sentry dashboard for the error details.',
      ]);
    }
  };

  return (
    <Box sx={{ p: 2, border: '1px dashed #ccc', borderRadius: 1, mb: 2 }}>
      <Typography variant="h6" gutterBottom>
        🐛 Sentry Integration Test
      </Typography>
      
      <Alert severity="info" sx={{ mb: 2 }}>
        This component is only visible in development mode. Use it to test your Sentry integration.
      </Alert>
      
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          startIcon={<BugReportIcon />}
          onClick={runTests}
          disabled={isTesting}
          color="primary"
        >
          {isTesting ? 'Running Tests...' : 'Run Sentry Tests'}
        </Button>
        
        <Button
          variant="outlined"
          startIcon={<MessageIcon />}
          onClick={triggerError}
          color="error"
        >
          Trigger Test Error
        </Button>
      </Box>
      
      {testResults.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Test Results:
          </Typography>
          <Box
            sx={{
              backgroundColor: '#f5f5f5',
              padding: 2,
              borderRadius: 1,
              fontFamily: 'monospace',
              fontSize: '0.875rem',
              maxHeight: 200,
              overflow: 'auto',
            }}
          >
            {testResults.map((result, index) => (
              <div key={index}>{result}</div>
            ))}
          </Box>
        </Box>
      )}
      
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
        Sentry Status: {sentryService.isReady() ? '✅ Ready' : '❌ Not Ready'}
      </Typography>
    </Box>
  );
};

export default SentryTestButton;
