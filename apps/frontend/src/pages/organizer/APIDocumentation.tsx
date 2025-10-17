import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Grid,
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ContentCopy as CopyIcon,
  OpenInNew as OpenInNewIcon,
  Code as CodeIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  BugReport as BugReportIcon,
  Api as ApiIcon,
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
      id={`api-tabpanel-${index}`}
      aria-labelledby={`api-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const APIDocumentation: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [apiInfo, setApiInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [swaggerDialogOpen, setSwaggerDialogOpen] = useState(false);

  useEffect(() => {
    fetchApiInfo();
  }, []);

  const fetchApiInfo = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/docs.json');
      
      if (!response.ok) {
        throw new Error('Failed to fetch API documentation');
      }
      
      const data = await response.json();
      setApiInfo(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const openSwaggerUI = () => {
    setSwaggerDialogOpen(true);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <Typography>Loading API documentation...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  const endpoints = [
    {
      category: 'Authentication',
      endpoints: [
        { method: 'POST', path: '/api/auth/register', description: 'Register a new user' },
        { method: 'POST', path: '/api/auth/login', description: 'Login user' },
        { method: 'POST', path: '/api/auth/logout', description: 'Logout user' },
        { method: 'POST', path: '/api/auth/forgot-password', description: 'Request password reset' },
        { method: 'POST', path: '/api/auth/reset-password', description: 'Reset password' },
      ],
    },
    {
      category: 'Events',
      endpoints: [
        { method: 'GET', path: '/api/events', description: 'List events' },
        { method: 'POST', path: '/api/events', description: 'Create event' },
        { method: 'GET', path: '/api/events/:id', description: 'Get event details' },
        { method: 'PUT', path: '/api/events/:id', description: 'Update event' },
        { method: 'DELETE', path: '/api/events/:id', description: 'Delete event' },
      ],
    },
    {
      category: 'Tickets',
      endpoints: [
        { method: 'GET', path: '/api/tickets', description: 'List tickets' },
        { method: 'POST', path: '/api/tickets', description: 'Purchase tickets' },
        { method: 'GET', path: '/api/tickets/:id', description: 'Get ticket details' },
        { method: 'POST', path: '/api/tickets/:id/transfer', description: 'Transfer ticket' },
        { method: 'POST', path: '/api/tickets/:id/refund', description: 'Refund ticket' },
      ],
    },
    {
      category: 'Public API',
      endpoints: [
        { method: 'GET', path: '/api/public/events', description: 'List public events' },
        { method: 'GET', path: '/api/public/events/:id', description: 'Get public event details' },
        { method: 'POST', path: '/api/public/tickets/purchase', description: 'Purchase tickets via public API' },
        { method: 'POST', path: '/api/public/qr/validate', description: 'Validate QR code' },
      ],
    },
    {
      category: 'OAuth 2.0',
      endpoints: [
        { method: 'GET', path: '/api/oauth/authorize', description: 'OAuth authorization endpoint' },
        { method: 'POST', path: '/api/oauth/token', description: 'OAuth token endpoint' },
        { method: 'POST', path: '/api/oauth/revoke', description: 'Revoke OAuth token' },
        { method: 'GET', path: '/api/oauth/scopes', description: 'Get supported scopes' },
      ],
    },
  ];

  const authenticationMethods = [
    {
      name: 'Bearer Token (JWT)',
      description: 'Standard JWT authentication for authenticated endpoints',
      example: 'Authorization: Bearer <your-jwt-token>',
      useCase: 'Dashboard and authenticated API calls',
    },
    {
      name: 'API Key',
      description: 'API key authentication for public endpoints',
      example: 'X-API-Key: <your-api-key>',
      useCase: 'Widget integration and third-party applications',
    },
    {
      name: 'OAuth 2.0',
      description: 'OAuth 2.0 authorization code flow',
      example: 'Authorization: Bearer <oauth-access-token>',
      useCase: 'Third-party application integrations',
    },
  ];

  const rateLimits = [
    {
      plan: 'Basic',
      requests: '100/hour',
      burst: '10/minute',
      features: ['Standard API access', 'Basic support'],
    },
    {
      plan: 'Pro',
      requests: '1,000/hour',
      burst: '50/minute',
      features: ['Enhanced API access', 'Priority support', 'Webhooks'],
    },
    {
      plan: 'Enterprise',
      requests: '10,000/hour',
      burst: '200/minute',
      features: ['Unlimited API access', '24/7 support', 'Custom integrations'],
    },
  ];

  const errorCodes = [
    { code: 400, name: 'Bad Request', description: 'Invalid request parameters or body' },
    { code: 401, name: 'Unauthorized', description: 'Authentication required or invalid credentials' },
    { code: 403, name: 'Forbidden', description: 'Insufficient permissions for this resource' },
    { code: 404, name: 'Not Found', description: 'Resource not found' },
    { code: 429, name: 'Too Many Requests', description: 'Rate limit exceeded' },
    { code: 500, name: 'Internal Server Error', description: 'Server error occurred' },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">API Documentation</Typography>
        <Button
          variant="contained"
          startIcon={<ApiIcon />}
          onClick={openSwaggerUI}
        >
          Open Swagger UI
        </Button>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        The Tazkartak API provides comprehensive access to all platform features. 
        Use this documentation to integrate with our services and build powerful applications.
      </Alert>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} variant="scrollable">
          <Tab label="Overview" />
          <Tab label="Authentication" />
          <Tab label="Endpoints" />
          <Tab label="Rate Limits" />
          <Tab label="Error Codes" />
          <Tab label="SDKs & Examples" />
        </Tabs>

        <TabPanel value={activeTab} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <CodeIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    API Base URL
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                      {apiInfo?.servers?.[0]?.url || 'https://api.tazkartak.com/api'}
                    </Typography>
                    <Tooltip title="Copy URL">
                      <IconButton size="small" onClick={() => copyToClipboard(apiInfo?.servers?.[0]?.url || 'https://api.tazkartak.com/api')}>
                        <CopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <SecurityIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    API Version
                  </Typography>
                  <Typography variant="h5" color="primary">
                    {apiInfo?.info?.version || '1.0.0'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Quick Start
                  </Typography>
                  <Typography variant="body1" paragraph>
                    1. Register for an account and create an API key in the API Keys section
                  </Typography>
                  <Typography variant="body1" paragraph>
                    2. Use your API key to authenticate requests: <code>X-API-Key: your-api-key</code>
                  </Typography>
                  <Typography variant="body1" paragraph>
                    3. Make your first API call to test the connection
                  </Typography>
                  <Box sx={{ mt: 2, p: 2, backgroundColor: 'grey.100', borderRadius: 1 }}>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      curl -H "X-API-Key: your-api-key" https://api.tazkartak.com/api/public/events
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <Typography variant="h6" gutterBottom>
            Authentication Methods
          </Typography>
          <Grid container spacing={2}>
            {authenticationMethods.map((method, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {method.name}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" paragraph>
                      {method.description}
                    </Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', mb: 1 }}>
                      {method.example}
                    </Typography>
                    <Chip label={method.useCase} size="small" color="primary" />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            OAuth 2.0 Flow
          </Typography>
          <Paper sx={{ p: 2 }}>
            <Typography variant="body1" paragraph>
              1. Redirect user to: <code>/api/oauth/authorize?client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT_URI&response_type=code&scope=read write</code>
            </Typography>
            <Typography variant="body1" paragraph>
              2. User authorizes your application
            </Typography>
            <Typography variant="body1" paragraph>
              3. Exchange authorization code for access token: <code>POST /api/oauth/token</code>
            </Typography>
            <Typography variant="body1" paragraph>
              4. Use access token for API calls: <code>Authorization: Bearer YOUR_ACCESS_TOKEN</code>
            </Typography>
          </Paper>
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <Typography variant="h6" gutterBottom>
            Available Endpoints
          </Typography>
          {endpoints.map((category, index) => (
            <Accordion key={index}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">{category.category}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <List>
                  {category.endpoints.map((endpoint, endpointIndex) => (
                    <React.Fragment key={endpointIndex}>
                      <ListItem>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Chip 
                                label={endpoint.method} 
                                color={endpoint.method === 'GET' ? 'success' : endpoint.method === 'POST' ? 'primary' : 'warning'}
                                size="small"
                              />
                              <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                                {endpoint.path}
                              </Typography>
                            </Box>
                          }
                          secondary={endpoint.description}
                        />
                      </ListItem>
                      {endpointIndex < category.endpoints.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>
          ))}
        </TabPanel>

        <TabPanel value={activeTab} index={3}>
          <Typography variant="h6" gutterBottom>
            Rate Limits
          </Typography>
          <Grid container spacing={2}>
            {rateLimits.map((limit, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {limit.plan}
                    </Typography>
                    <Typography variant="h5" color="primary" gutterBottom>
                      {limit.requests}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      Burst: {limit.burst}
                    </Typography>
                    <List dense>
                      {limit.features.map((feature, featureIndex) => (
                        <ListItem key={featureIndex} sx={{ py: 0 }}>
                          <ListItemText primary={feature} />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Alert severity="warning" sx={{ mt: 3 }}>
            Rate limits are applied per API key. If you exceed the limit, you'll receive a 429 status code.
          </Alert>
        </TabPanel>

        <TabPanel value={activeTab} index={4}>
          <Typography variant="h6" gutterBottom>
            HTTP Status Codes
          </Typography>
          <Grid container spacing={2}>
            {errorCodes.map((error, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography variant="h4" color={error.code >= 500 ? 'error' : error.code >= 400 ? 'warning' : 'success'}>
                        {error.code}
                      </Typography>
                      <Box>
                        <Typography variant="h6">{error.name}</Typography>
                        <Typography variant="body2" color="textSecondary">
                          {error.description}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        <TabPanel value={activeTab} index={5}>
          <Typography variant="h6" gutterBottom>
            SDKs and Code Examples
          </Typography>
          
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>JavaScript/Node.js</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ p: 2, backgroundColor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
{`const axios = require('axios');

const client = axios.create({
  baseURL: 'https://api.tazkartak.com/api',
  headers: {
    'X-API-Key': 'your-api-key'
  }
});

// Get events
const events = await client.get('/public/events');

// Purchase tickets
const purchase = await client.post('/public/tickets/purchase', {
  eventId: 'event-id',
  ticketTypeId: 'ticket-type-id',
  quantity: 2,
  buyerInfo: {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: '+1234567890'
  }
});`}
                </Typography>
              </Box>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>Python</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ p: 2, backgroundColor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
{`import requests

headers = {
    'X-API-Key': 'your-api-key',
    'Content-Type': 'application/json'
}

# Get events
response = requests.get('https://api.tazkartak.com/api/public/events', headers=headers)
events = response.json()

# Purchase tickets
purchase_data = {
    'eventId': 'event-id',
    'ticketTypeId': 'ticket-type-id',
    'quantity': 2,
    'buyerInfo': {
        'firstName': 'John',
        'lastName': 'Doe',
        'email': 'john@example.com',
        'phone': '+1234567890'
    }
}
response = requests.post('https://api.tazkartak.com/api/public/tickets/purchase', 
                        json=purchase_data, headers=headers)`}
                </Typography>
              </Box>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>PHP</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ p: 2, backgroundColor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
{`<?php
$headers = [
    'X-API-Key: your-api-key',
    'Content-Type: application/json'
];

// Get events
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'https://api.tazkartak.com/api/public/events');
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
curl_close($ch);

$events = json_decode($response, true);
?>`}
                </Typography>
              </Box>
            </AccordionDetails>
          </Accordion>
        </TabPanel>
      </Paper>

      {/* Swagger UI Dialog */}
      <Dialog 
        open={swaggerDialogOpen} 
        onClose={() => setSwaggerDialogOpen(false)} 
        maxWidth="xl" 
        fullWidth
        fullScreen
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Swagger UI - Interactive API Documentation</Typography>
            <IconButton onClick={() => setSwaggerDialogOpen(false)}>
              <OpenInNewIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <iframe
            src="/api/docs/"
            width="100%"
            height="800px"
            style={{ border: 'none' }}
            title="Swagger UI"
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default APIDocumentation;
