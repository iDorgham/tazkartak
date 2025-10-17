import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Card,
  CardContent,
  Alert,
  Snackbar,
  Tabs,
  Tab,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Switch,
  FormControlLabel,
  CircularProgress,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  PlayArrow as PlayArrowIcon,
  Stop as StopIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Code as CodeIcon,
  Widgets as WidgetsIcon,
  Api as ApiIcon,
  Webhook as WebhookIcon,
} from '@mui/icons-material';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`test-tabpanel-${index}`}
      aria-labelledby={`test-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

interface TestResult {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'error';
  message?: string;
  duration?: number;
  timestamp: Date;
  details?: any;
}

const WidgetTesting: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [runningTests, setRunningTests] = useState<Set<string>>(new Set());
  const [apiKey, setApiKey] = useState('');
  const [eventId, setEventId] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadTestConfiguration();
  }, []);

  const loadTestConfiguration = async () => {
    try {
      // Load saved configuration
      const savedApiKey = localStorage.getItem('test-api-key');
      const savedEventId = localStorage.getItem('test-event-id');
      const savedWebhookUrl = localStorage.getItem('test-webhook-url');

      if (savedApiKey) setApiKey(savedApiKey);
      if (savedEventId) setEventId(savedEventId);
      if (savedWebhookUrl) setWebhookUrl(savedWebhookUrl);
    } catch (err) {
      console.error('Failed to load test configuration:', err);
    }
  };

  const saveTestConfiguration = () => {
    localStorage.setItem('test-api-key', apiKey);
    localStorage.setItem('test-event-id', eventId);
    localStorage.setItem('test-webhook-url', webhookUrl);
    setSuccess('Test configuration saved');
  };

  const addTestResult = (result: TestResult) => {
    setTestResults(prev => [result, ...prev]);
  };

  const updateTestResult = (id: string, updates: Partial<TestResult>) => {
    setTestResults(prev =>
      prev.map(result =>
        result.id === id ? { ...result, ...updates } : result
      )
    );
  };

  const runTest = async (testId: string, testName: string, testFunction: () => Promise<any>) => {
    const startTime = Date.now();
    
    // Add test to running tests
    setRunningTests(prev => new Set(prev).add(testId));
    
    // Add initial result
    addTestResult({
      id: testId,
      name: testName,
      status: 'running',
      timestamp: new Date(),
    });

    try {
      const result = await testFunction();
      const duration = Date.now() - startTime;
      
      updateTestResult(testId, {
        status: 'passed',
        message: 'Test passed successfully',
        duration,
        details: result,
      });
      
      return result;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      updateTestResult(testId, {
        status: 'failed',
        message: error.message || 'Test failed',
        duration,
        details: error,
      });
      
      throw error;
    } finally {
      setRunningTests(prev => {
        const newSet = new Set(prev);
        newSet.delete(testId);
        return newSet;
      });
    }
  };

  const runApiKeyTest = async () => {
    return runTest('api-key-test', 'API Key Validation', async () => {
      const response = await fetch('/api/public/events', {
        headers: {
          'X-API-Key': apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error('API returned unsuccessful response');
      }

      return data;
    });
  };

  const runEventDataTest = async () => {
    return runTest('event-data-test', 'Event Data Retrieval', async () => {
      if (!eventId) {
        throw new Error('Event ID is required');
      }

      const response = await fetch(`/api/public/events/${eventId}`, {
        headers: {
          'X-API-Key': apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch event: ${response.status}`);
      }

      const data = await response.json();
      return data;
    });
  };

  const runTicketAvailabilityTest = async () => {
    return runTest('ticket-availability-test', 'Ticket Availability Check', async () => {
      if (!eventId) {
        throw new Error('Event ID is required');
      }

      const response = await fetch(`/api/public/events/${eventId}/tickets`, {
        headers: {
          'X-API-Key': apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch tickets: ${response.status}`);
      }

      const data = await response.json();
      return data;
    });
  };

  const runPurchaseTest = async () => {
    return runTest('purchase-test', 'Ticket Purchase Simulation', async () => {
      if (!eventId) {
        throw new Error('Event ID is required');
      }

      const purchaseData = {
        eventId,
        ticketTypeId: 'test-ticket-type',
        quantity: 1,
        buyerInfo: {
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          phone: '+1234567890',
        },
        paymentMethod: 'credit_card',
      };

      const response = await fetch('/api/public/tickets/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
        body: JSON.stringify(purchaseData),
      });

      if (!response.ok) {
        throw new Error(`Purchase request failed: ${response.status}`);
      }

      const data = await response.json();
      return data;
    });
  };

  const runWebhookTest = async () => {
    return runTest('webhook-test', 'Webhook Delivery Test', async () => {
      if (!webhookUrl) {
        throw new Error('Webhook URL is required');
      }

      // First, create a test webhook
      const webhookData = {
        url: webhookUrl,
        events: ['ticket.purchased'],
        retryConfig: {
          maxAttempts: 3,
          backoffMultiplier: 2,
        },
      };

      const createResponse = await fetch('/api/webhooks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
        },
        body: JSON.stringify(webhookData),
      });

      if (!createResponse.ok) {
        throw new Error(`Failed to create webhook: ${createResponse.status}`);
      }

      const webhook = await createResponse.json();

      // Test the webhook
      const testResponse = await fetch(`/api/webhooks/${webhook.data.id}/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
        },
        body: JSON.stringify({
          event: 'ticket.purchased',
          payload: {
            ticketId: 'test-ticket-123',
            eventId,
            buyerEmail: 'test@example.com',
            quantity: 1,
            amount: 50.00,
          },
        }),
      });

      if (!testResponse.ok) {
        throw new Error(`Webhook test failed: ${testResponse.status}`);
      }

      return await testResponse.json();
    });
  };

  const runRateLimitTest = async () => {
    return runTest('rate-limit-test', 'Rate Limiting Test', async () => {
      const promises = [];
      for (let i = 0; i < 105; i++) { // Exceed rate limit
        promises.push(
          fetch('/api/public/events', {
            headers: {
              'X-API-Key': apiKey,
            },
          })
        );
      }

      const responses = await Promise.all(promises);
      const rateLimitedCount = responses.filter(r => r.status === 429).length;

      if (rateLimitedCount === 0) {
        throw new Error('Rate limiting not working - no requests were rate limited');
      }

      return {
        totalRequests: 105,
        rateLimitedRequests: rateLimitedCount,
        rateLimitWorking: true,
      };
    });
  };

  const runAllTests = async () => {
    const tests = [
      runApiKeyTest,
      runEventDataTest,
      runTicketAvailabilityTest,
      runPurchaseTest,
      runWebhookTest,
      runRateLimitTest,
    ];

    for (const test of tests) {
      try {
        await test();
      } catch (error) {
        console.error('Test failed:', error);
      }
    }
  };

  const clearTestResults = () => {
    setTestResults([]);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'passed':
        return <CheckCircleIcon color="success" />;
      case 'failed':
        return <ErrorIcon color="error" />;
      case 'running':
        return <CircularProgress size={20} />;
      case 'pending':
        return <WarningIcon color="warning" />;
      default:
        return <WarningIcon color="disabled" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'passed':
        return 'success';
      case 'failed':
        return 'error';
      case 'running':
        return 'info';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Widget Integration Testing
      </Typography>

      <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
        Test your widget integration, API endpoints, and webhook delivery to ensure everything is working correctly.
      </Typography>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Configuration" icon={<CodeIcon />} />
          <Tab label="API Tests" icon={<ApiIcon />} />
          <Tab label="Widget Tests" icon={<WidgetsIcon />} />
          <Tab label="Webhook Tests" icon={<WebhookIcon />} />
          <Tab label="Results" icon={<CheckCircleIcon />} />
        </Tabs>

        <TabPanel value={activeTab} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Test Configuration
                  </Typography>
                  <TextField
                    fullWidth
                    label="API Key"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    margin="normal"
                    type="password"
                    helperText="Your API key for testing"
                  />
                  <TextField
                    fullWidth
                    label="Event ID"
                    value={eventId}
                    onChange={(e) => setEventId(e.target.value)}
                    margin="normal"
                    helperText="Event ID to use for testing"
                  />
                  <TextField
                    fullWidth
                    label="Webhook URL"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    margin="normal"
                    helperText="Webhook URL for testing (e.g., https://webhook.site/unique-id)"
                  />
                  <Button
                    variant="contained"
                    onClick={saveTestConfiguration}
                    sx={{ mt: 2 }}
                  >
                    Save Configuration
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Test Environment
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText
                        primary="Environment"
                        secondary={process.env.NODE_ENV || 'development'}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="API Base URL"
                        secondary={process.env.REACT_APP_API_URL || 'http://localhost:3000/api'}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Widget URL"
                        secondary={process.env.REACT_APP_WIDGET_URL || 'http://localhost:3002'}
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <Typography variant="h6" gutterBottom>
            API Endpoint Tests
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Authentication Tests
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<PlayArrowIcon />}
                    onClick={runApiKeyTest}
                    disabled={!apiKey || runningTests.has('api-key-test')}
                    sx={{ mb: 2 }}
                    fullWidth
                  >
                    Test API Key Validation
                  </Button>
                  <Typography variant="body2" color="textSecondary">
                    Validates that your API key is working correctly
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Data Retrieval Tests
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<PlayArrowIcon />}
                    onClick={runEventDataTest}
                    disabled={!apiKey || !eventId || runningTests.has('event-data-test')}
                    sx={{ mb: 1 }}
                    fullWidth
                  >
                    Test Event Data
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<PlayArrowIcon />}
                    onClick={runTicketAvailabilityTest}
                    disabled={!apiKey || !eventId || runningTests.has('ticket-availability-test')}
                    fullWidth
                  >
                    Test Ticket Availability
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Purchase Tests
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<PlayArrowIcon />}
                    onClick={runPurchaseTest}
                    disabled={!apiKey || !eventId || runningTests.has('purchase-test')}
                    sx={{ mb: 2 }}
                    fullWidth
                  >
                    Test Purchase Flow
                  </Button>
                  <Typography variant="body2" color="textSecondary">
                    Simulates a ticket purchase (creates payment URL)
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Performance Tests
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<PlayArrowIcon />}
                    onClick={runRateLimitTest}
                    disabled={!apiKey || runningTests.has('rate-limit-test')}
                    sx={{ mb: 2 }}
                    fullWidth
                  >
                    Test Rate Limiting
                  </Button>
                  <Typography variant="body2" color="textSecondary">
                    Tests that rate limiting is working correctly
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<PlayArrowIcon />}
              onClick={runAllTests}
              disabled={runningTests.size > 0}
            >
              Run All API Tests
            </Button>
          </Box>
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <Typography variant="h6" gutterBottom>
            Widget Integration Tests
          </Typography>
          <Alert severity="info" sx={{ mb: 3 }}>
            Widget tests require the widget to be running and accessible. 
            Make sure your widget is deployed and the widget URL is configured correctly.
          </Alert>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Widget Loading Test
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<PlayArrowIcon />}
                    disabled={true} // Would need widget testing framework
                    sx={{ mb: 2 }}
                    fullWidth
                  >
                    Test Widget Loading
                  </Button>
                  <Typography variant="body2" color="textSecondary">
                    Tests that the widget loads correctly in an iframe
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Theme Application Test
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<PlayArrowIcon />}
                    disabled={true} // Would need widget testing framework
                    sx={{ mb: 2 }}
                    fullWidth
                  >
                    Test Theme Application
                  </Button>
                  <Typography variant="body2" color="textSecondary">
                    Tests that custom themes are applied correctly
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    PostMessage Communication Test
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<PlayArrowIcon />}
                    disabled={true} // Would need widget testing framework
                    sx={{ mb: 2 }}
                    fullWidth
                  >
                    Test Communication
                  </Button>
                  <Typography variant="body2" color="textSecondary">
                    Tests iframe communication between widget and parent
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Real-time Updates Test
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<PlayArrowIcon />}
                    disabled={true} // Would need widget testing framework
                    sx={{ mb: 2 }}
                    fullWidth
                  >
                    Test Real-time Updates
                  </Button>
                  <Typography variant="body2" color="textSecondary">
                    Tests WebSocket connection and real-time updates
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={activeTab} index={3}>
          <Typography variant="h6" gutterBottom>
            Webhook Delivery Tests
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Webhook Delivery Test
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<PlayArrowIcon />}
                    onClick={runWebhookTest}
                    disabled={!webhookUrl || runningTests.has('webhook-test')}
                    sx={{ mb: 2 }}
                    fullWidth
                  >
                    Test Webhook Delivery
                  </Button>
                  <Typography variant="body2" color="textSecondary">
                    Creates a test webhook and sends a sample event
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Webhook Signature Test
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<PlayArrowIcon />}
                    disabled={true} // Would need webhook endpoint testing
                    sx={{ mb: 2 }}
                    fullWidth
                  >
                    Test Signature Verification
                  </Button>
                  <Typography variant="body2" color="textSecondary">
                    Tests HMAC-SHA256 signature generation and verification
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={activeTab} index={4}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Test Results ({testResults.length})
            </Typography>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={clearTestResults}
              disabled={testResults.length === 0}
            >
              Clear Results
            </Button>
          </Box>

          {testResults.length === 0 ? (
            <Alert severity="info">
              No test results yet. Run some tests to see results here.
            </Alert>
          ) : (
            <List>
              {testResults.map((result) => (
                <React.Fragment key={result.id}>
                  <ListItem>
                    {getStatusIcon(result.status)}
                    <ListItemText
                      primary={result.name}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="textSecondary">
                            {result.message}
                          </Typography>
                          {result.duration && (
                            <Typography variant="caption" color="textSecondary">
                              Duration: {result.duration}ms
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Chip
                        label={result.status}
                        color={getStatusColor(result.status) as any}
                        size="small"
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                  {result.details && (
                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="body2">Test Details</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <pre style={{ fontSize: '12px', overflow: 'auto' }}>
                          {JSON.stringify(result.details, null, 2)}
                        </pre>
                      </AccordionDetails>
                    </Accordion>
                  )}
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          )}
        </TabPanel>
      </Paper>

      {/* Success/Error Snackbars */}
      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess(null)}
      >
        <Alert onClose={() => setSuccess(null)} severity="success">
          {success}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert onClose={() => setError(null)} severity="error">
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default WidgetTesting;
