import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Alert,
  Snackbar,
  Tooltip,
  Card,
  CardContent,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Tabs,
  Tab,
  Badge,
  Switch,
} from '@mui/material';
import {
  Add,
  Delete,
  Refresh,
  Send,
  ExpandMore,
  CheckCircle,
  Error,
  Schedule,
  Warning,
  Info,
  Webhook,
  Settings,
  History,
  Retry,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { webhookService } from '../../services/webhook.service';

interface Webhook {
  id: string;
  url: string;
  events: string[];
  isActive: boolean;
  retryConfig: {
    maxAttempts: number;
    backoffMultiplier: number;
    initialIntervalSeconds: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface WebhookLog {
  id: string;
  event: string;
  payload: any;
  status: 'pending' | 'delivered' | 'failed';
  attempts: number;
  response: any;
  deliveredAt: string | null;
  createdAt: string;
}

interface WebhookStats {
  totalWebhooks: number;
  activeWebhooks: number;
  totalDeliveries: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  successRate: number;
}

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
      id={`webhook-tabpanel-${index}`}
      aria-labelledby={`webhook-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const WebhookManagement: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([]);
  const [stats, setStats] = useState<WebhookStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState<Webhook | null>(null);
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({ open: false, message: '', severity: 'info' });

  // Form state for creating new webhook
  const [formData, setFormData] = useState({
    url: '',
    events: [] as string[],
    retryConfig: {
      maxAttempts: 5,
      backoffMultiplier: 2,
      initialIntervalSeconds: 60,
    },
  });

  const availableEvents = [
    'ticket.purchased',
    'ticket.scanned',
    'ticket.refunded',
    'event.created',
    'event.updated',
    'event.cancelled',
    'payment.completed',
    'payment.failed',
  ];

  useEffect(() => {
    loadWebhooks();
    loadStats();
  }, []);

  const loadWebhooks = async () => {
    try {
      setLoading(true);
      const response = await webhookService.getWebhooks();
      setWebhooks(response.data);
    } catch (error) {
      console.error('Failed to load webhooks:', error);
      showNotification('Failed to load webhooks', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await webhookService.getWebhookStats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load webhook stats:', error);
    }
  };

  const loadWebhookLogs = async (webhookId: string) => {
    try {
      const response = await webhookService.getWebhookLogs(webhookId);
      setWebhookLogs(response.data);
    } catch (error) {
      console.error('Failed to load webhook logs:', error);
      showNotification('Failed to load webhook logs', 'error');
    }
  };

  const handleCreateWebhook = async () => {
    try {
      setLoading(true);
      await webhookService.createWebhook(formData);
      setShowCreateDialog(false);
      await loadWebhooks();
      await loadStats();
      showNotification('Webhook created successfully', 'success');
      setFormData({
        url: '',
        events: [],
        retryConfig: {
          maxAttempts: 5,
          backoffMultiplier: 2,
          initialIntervalSeconds: 60,
        },
      });
    } catch (error) {
      console.error('Failed to create webhook:', error);
      showNotification('Failed to create webhook', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWebhook = async (id: string) => {
    try {
      await webhookService.deleteWebhook(id);
      await loadWebhooks();
      await loadStats();
      showNotification('Webhook deleted successfully', 'success');
    } catch (error) {
      console.error('Failed to delete webhook:', error);
      showNotification('Failed to delete webhook', 'error');
    }
  };

  const handleToggleWebhook = async (id: string, isActive: boolean) => {
    try {
      await webhookService.updateWebhook(id, { isActive });
      await loadWebhooks();
      await loadStats();
      showNotification(`Webhook ${isActive ? 'activated' : 'deactivated'}`, 'success');
    } catch (error) {
      console.error('Failed to update webhook:', error);
      showNotification('Failed to update webhook', 'error');
    }
  };

  const handleTestWebhook = async (id: string) => {
    try {
      setLoading(true);
      await webhookService.testWebhook(id);
      setShowTestDialog(false);
      showNotification('Test webhook sent successfully', 'success');
      await loadWebhookLogs(id);
    } catch (error) {
      console.error('Failed to test webhook:', error);
      showNotification('Failed to test webhook', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRetryWebhook = async (webhookId: string, logId: string) => {
    try {
      await webhookService.retryWebhookDelivery(webhookId, logId);
      showNotification('Webhook retry queued', 'success');
      await loadWebhookLogs(webhookId);
    } catch (error) {
      console.error('Failed to retry webhook:', error);
      showNotification('Failed to retry webhook', 'error');
    }
  };

  const toggleEvent = (event: string) => {
    setFormData({
      ...formData,
      events: formData.events.includes(event)
        ? formData.events.filter(e => e !== event)
        : [...formData.events, event],
    });
  };

  const showNotification = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setNotification({ open: true, message, severity });
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'success';
      case 'failed':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle />;
      case 'failed':
        return <Error />;
      case 'pending':
        return <Schedule />;
      default:
        return <Info />;
    }
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Webhook Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Configure webhooks to receive real-time notifications about events in your system.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setShowCreateDialog(true)}
        >
          Create Webhook
        </Button>
      </Box>

      {/* Webhook Statistics */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={2}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Webhook color="primary" sx={{ mr: 2 }} />
                  <Box>
                    <Typography variant="h6">{stats.totalWebhooks}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Webhooks
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={2}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CheckCircle color="success" sx={{ mr: 2 }} />
                  <Box>
                    <Typography variant="h6">{stats.activeWebhooks}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={2}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Send color="info" sx={{ mr: 2 }} />
                  <Box>
                    <Typography variant="h6">{stats.totalDeliveries}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Deliveries
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={2}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CheckCircle color="success" sx={{ mr: 2 }} />
                  <Box>
                    <Typography variant="h6">{stats.successfulDeliveries}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Successful
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={2}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Error color="error" sx={{ mr: 2 }} />
                  <Box>
                    <Typography variant="h6">{stats.failedDeliveries}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Failed
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={2}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Badge color="primary" badgeContent={`${stats.successRate.toFixed(1)}%`}>
                    <Typography variant="h6">Success Rate</Typography>
                  </Badge>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Webhooks Table */}
      <Paper>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label="Webhooks" />
          <Tab label="Logs" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>URL</TableCell>
                  <TableCell>Events</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Retry Config</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {webhooks.map((webhook) => (
                  <TableRow key={webhook.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {webhook.url}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {webhook.events.slice(0, 2).map((event) => (
                          <Chip
                            key={event}
                            label={event.split('.')[1]}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                        {webhook.events.length > 2 && (
                          <Chip
                            label={`+${webhook.events.length - 2}`}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={webhook.isActive ? 'Active' : 'Inactive'}
                        color={webhook.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {webhook.retryConfig.maxAttempts} attempts, {webhook.retryConfig.initialIntervalSeconds}s delay
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(webhook.createdAt)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title={webhook.isActive ? 'Deactivate' : 'Activate'}>
                          <IconButton
                            size="small"
                            onClick={() => handleToggleWebhook(webhook.id, !webhook.isActive)}
                          >
                            <Switch
                              checked={webhook.isActive}
                              size="small"
                            />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Test Webhook">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedWebhook(webhook);
                              setShowTestDialog(true);
                            }}
                          >
                            <Send />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="View Logs">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedWebhook(webhook);
                              loadWebhookLogs(webhook.id);
                              setTabValue(1);
                            }}
                          >
                            <History />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteWebhook(webhook.id)}
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Webhook Logs {selectedWebhook && `- ${selectedWebhook.url}`}
            </Typography>
            {selectedWebhook && (
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={() => loadWebhookLogs(selectedWebhook.id)}
              >
                Refresh Logs
              </Button>
            )}
          </Box>

          {webhookLogs.length === 0 ? (
            <Alert severity="info">
              {selectedWebhook ? 'No logs found for this webhook.' : 'Select a webhook to view its logs.'}
            </Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Event</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Attempts</TableCell>
                    <TableCell>Delivered</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {webhookLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {log.event}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getStatusIcon(log.status)}
                          <Chip
                            label={log.status}
                            color={getStatusColor(log.status) as any}
                            size="small"
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {log.attempts}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {log.deliveredAt ? formatDate(log.deliveredAt) : 'Not delivered'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(log.createdAt)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        {log.status === 'failed' && selectedWebhook && (
                          <Tooltip title="Retry Delivery">
                            <IconButton
                              size="small"
                              onClick={() => handleRetryWebhook(selectedWebhook.id, log.id)}
                            >
                              <Retry />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>
      </Paper>

      {/* Create Webhook Dialog */}
      <Dialog open={showCreateDialog} onClose={() => setShowCreateDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Webhook</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Webhook URL"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              sx={{ mb: 3 }}
              placeholder="https://your-website.com/webhook"
              helperText="The URL where webhook events will be sent"
            />

            <Typography variant="h6" gutterBottom>
              Events to Subscribe To
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Select which events should trigger this webhook.
            </Typography>
            <Box sx={{ mb: 3 }}>
              {availableEvents.map((event) => (
                <FormControlLabel
                  key={event}
                  control={
                    <Switch
                      checked={formData.events.includes(event)}
                      onChange={() => toggleEvent(event)}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {event}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {event.split('.')[0]} - {event.split('.')[1]}
                      </Typography>
                    </Box>
                  }
                  sx={{ display: 'block', mb: 1 }}
                />
              ))}
            </Box>

            <Typography variant="h6" gutterBottom>
              Retry Configuration
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Max Attempts"
                  value={formData.retryConfig.maxAttempts}
                  onChange={(e) => setFormData({
                    ...formData,
                    retryConfig: {
                      ...formData.retryConfig,
                      maxAttempts: parseInt(e.target.value) || 5,
                    },
                  })}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Backoff Multiplier"
                  value={formData.retryConfig.backoffMultiplier}
                  onChange={(e) => setFormData({
                    ...formData,
                    retryConfig: {
                      ...formData.retryConfig,
                      backoffMultiplier: parseFloat(e.target.value) || 2,
                    },
                  })}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Initial Delay (seconds)"
                  value={formData.retryConfig.initialIntervalSeconds}
                  onChange={(e) => setFormData({
                    ...formData,
                    retryConfig: {
                      ...formData.retryConfig,
                      initialIntervalSeconds: parseInt(e.target.value) || 60,
                    },
                  })}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreateWebhook}
            disabled={loading || !formData.url.trim() || formData.events.length === 0}
          >
            {loading ? 'Creating...' : 'Create Webhook'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Test Webhook Dialog */}
      <Dialog open={showTestDialog} onClose={() => setShowTestDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Test Webhook</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            This will send a test webhook to {selectedWebhook?.url} to verify it's working correctly.
          </Alert>
          <Typography variant="body2">
            The test payload will include a sample event with timestamp and webhook information.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowTestDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => selectedWebhook && handleTestWebhook(selectedWebhook.id)}
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Test'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default WebhookManagement;
