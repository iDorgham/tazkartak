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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert,
  Snackbar,
  Tooltip,
  Card,
  CardContent,
  CardActions,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  InputAdornment,
  OutlinedInput,
  Grid,
} from '@mui/material';
import {
  Add,
  Delete,
  Refresh,
  Visibility,
  VisibilityOff,
  ContentCopy,
  Security,
  Key,
  CheckCircle,
  Error,
  Warning,
  Info,
  Schedule,
  Domain,
  Speed,
} from '@mui/icons-material';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { apiKeyService } from '../../services/apiKey.service';

interface ApiKey {
  id: string;
  name: string;
  permissions: string[];
  rateLimit: number;
  allowedDomains: string[];
  expiresAt: string | null;
  lastUsedAt: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  key?: string; // Only present when creating/rotating
}

interface CreateApiKeyData {
  name: string;
  permissions: string[];
  allowedDomains: string[];
  rateLimit: number;
  expiresAt: string | null;
}

const ApiKeyManagement: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [rotating, setRotating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showKeyDialog, setShowKeyDialog] = useState(false);
  const [newApiKey, setNewApiKey] = useState<ApiKey | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({ open: false, message: '', severity: 'info' });

  // Form state for creating new API key
  const [formData, setFormData] = useState<CreateApiKeyData>({
    name: '',
    permissions: ['events:read', 'tickets:read'],
    allowedDomains: [],
    rateLimit: 1000,
    expiresAt: null,
  });

  const [domainInput, setDomainInput] = useState('');

  const availablePermissions = [
    { value: 'events:read', label: 'Read Events', description: 'View event information' },
    { value: 'events:write', label: 'Write Events', description: 'Create and modify events' },
    { value: 'tickets:read', label: 'Read Tickets', description: 'View ticket information' },
    { value: 'tickets:write', label: 'Write Tickets', description: 'Purchase and manage tickets' },
    { value: 'qr:validate', label: 'Validate QR Codes', description: 'Validate ticket QR codes' },
    { value: 'analytics:read', label: 'Read Analytics', description: 'View analytics data' },
  ];

  useEffect(() => {
    loadApiKeys();
  }, []);

  const loadApiKeys = async () => {
    try {
      setLoading(true);
      const response = await apiKeyService.getApiKeys();
      setApiKeys(response.data);
    } catch (error) {
      console.error('Failed to load API keys:', error);
      showNotification('Failed to load API keys', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateApiKey = async () => {
    try {
      setCreating(true);
      const response = await apiKeyService.createApiKey(formData);
      setNewApiKey(response.data);
      setShowCreateDialog(false);
      setShowKeyDialog(true);
      await loadApiKeys();
      showNotification('API key created successfully', 'success');
    } catch (error) {
      console.error('Failed to create API key:', error);
      showNotification('Failed to create API key', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleRotateApiKey = async (id: string) => {
    try {
      setRotating(id);
      const response = await apiKeyService.rotateApiKey(id);
      setNewApiKey(response.data);
      setShowKeyDialog(true);
      await loadApiKeys();
      showNotification('API key rotated successfully', 'success');
    } catch (error) {
      console.error('Failed to rotate API key:', error);
      showNotification('Failed to rotate API key', 'error');
    } finally {
      setRotating(null);
    }
  };

  const handleDeleteApiKey = async (id: string) => {
    try {
      setDeleting(id);
      await apiKeyService.deleteApiKey(id);
      await loadApiKeys();
      showNotification('API key deleted successfully', 'success');
    } catch (error) {
      console.error('Failed to delete API key:', error);
      showNotification('Failed to delete API key', 'error');
    } finally {
      setDeleting(null);
    }
  };

  const handleUpdateApiKey = async (id: string, updates: Partial<ApiKey>) => {
    try {
      await apiKeyService.updateApiKey(id, updates);
      await loadApiKeys();
      showNotification('API key updated successfully', 'success');
    } catch (error) {
      console.error('Failed to update API key:', error);
      showNotification('Failed to update API key', 'error');
    }
  };

  const copyApiKey = async (key: string) => {
    try {
      await navigator.clipboard.writeText(key);
      showNotification('API key copied to clipboard', 'success');
    } catch (error) {
      showNotification('Failed to copy API key', 'error');
    }
  };

  const addDomain = () => {
    if (domainInput.trim() && !formData.allowedDomains.includes(domainInput.trim())) {
      setFormData({
        ...formData,
        allowedDomains: [...formData.allowedDomains, domainInput.trim()],
      });
      setDomainInput('');
    }
  };

  const removeDomain = (domain: string) => {
    setFormData({
      ...formData,
      allowedDomains: formData.allowedDomains.filter(d => d !== domain),
    });
  };

  const togglePermission = (permission: string) => {
    setFormData({
      ...formData,
      permissions: formData.permissions.includes(permission)
        ? formData.permissions.filter(p => p !== permission)
        : [...formData.permissions, permission],
    });
  };

  const showNotification = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setNotification({ open: true, message, severity });
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  const formatLastUsed = (dateString: string | null) => {
    if (!dateString) return 'Never used';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const getStatusColor = (apiKey: ApiKey) => {
    if (!apiKey.isActive) return 'default';
    if (apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date()) return 'error';
    return 'success';
  };

  const getStatusLabel = (apiKey: ApiKey) => {
    if (!apiKey.isActive) return 'Inactive';
    if (apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date()) return 'Expired';
    return 'Active';
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            API Key Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage API keys for integrating Tazkartak widgets into your website.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setShowCreateDialog(true)}
        >
          Create API Key
        </Button>
      </Box>

      {/* API Key Statistics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Key color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6">{apiKeys.length}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total API Keys
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CheckCircle color="success" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6">
                    {apiKeys.filter(key => key.isActive && (!key.expiresAt || new Date(key.expiresAt) > new Date())).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Keys
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Warning color="warning" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6">
                    {apiKeys.filter(key => key.expiresAt && new Date(key.expiresAt) < new Date()).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Expired Keys
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Schedule color="info" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6">
                    {apiKeys.filter(key => key.lastUsedAt).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Used Keys
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* API Keys Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Permissions</TableCell>
                <TableCell>Rate Limit</TableCell>
                <TableCell>Domains</TableCell>
                <TableCell>Last Used</TableCell>
                <TableCell>Expires</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {apiKeys.map((apiKey) => (
                <TableRow key={apiKey.id}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {apiKey.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusLabel(apiKey)}
                      color={getStatusColor(apiKey)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {apiKey.permissions.slice(0, 2).map((permission) => (
                        <Chip
                          key={permission}
                          label={permission.split(':')[0]}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                      {apiKey.permissions.length > 2 && (
                        <Chip
                          label={`+${apiKey.permissions.length - 2}`}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Speed sx={{ mr: 1, fontSize: 16 }} />
                      {apiKey.rateLimit}/hour
                    </Box>
                  </TableCell>
                  <TableCell>
                    {apiKey.allowedDomains.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        All domains
                      </Typography>
                    ) : (
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {apiKey.allowedDomains.slice(0, 2).map((domain) => (
                          <Chip
                            key={domain}
                            label={domain}
                            size="small"
                            variant="outlined"
                            icon={<Domain />}
                          />
                        ))}
                        {apiKey.allowedDomains.length > 2 && (
                          <Chip
                            label={`+${apiKey.allowedDomains.length - 2}`}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {formatLastUsed(apiKey.lastUsedAt)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(apiKey.expiresAt)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="Rotate API Key">
                        <IconButton
                          size="small"
                          onClick={() => handleRotateApiKey(apiKey.id)}
                          disabled={rotating === apiKey.id}
                        >
                          <Refresh />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete API Key">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteApiKey(apiKey.id)}
                          disabled={deleting === apiKey.id}
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
      </Paper>

      {/* Create API Key Dialog */}
      <Dialog open={showCreateDialog} onClose={() => setShowCreateDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New API Key</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="API Key Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              sx={{ mb: 3 }}
              placeholder="e.g., My Website Widget"
            />

            <Typography variant="h6" gutterBottom>
              Permissions
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Select the permissions this API key should have.
            </Typography>
            <Box sx={{ mb: 3 }}>
              {availablePermissions.map((permission) => (
                <FormControlLabel
                  key={permission.value}
                  control={
                    <Switch
                      checked={formData.permissions.includes(permission.value)}
                      onChange={() => togglePermission(permission.value)}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {permission.label}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {permission.description}
                      </Typography>
                    </Box>
                  }
                  sx={{ display: 'block', mb: 1 }}
                />
              ))}
            </Box>

            <Typography variant="h6" gutterBottom>
              Rate Limit
            </Typography>
            <TextField
              fullWidth
              type="number"
              label="Requests per hour"
              value={formData.rateLimit}
              onChange={(e) => setFormData({ ...formData, rateLimit: parseInt(e.target.value) || 1000 })}
              sx={{ mb: 3 }}
              helperText="Maximum number of API requests allowed per hour"
            />

            <Typography variant="h6" gutterBottom>
              Allowed Domains (Optional)
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Restrict this API key to specific domains. Leave empty to allow all domains.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <TextField
                fullWidth
                label="Domain"
                value={domainInput}
                onChange={(e) => setDomainInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addDomain()}
                placeholder="e.g., example.com"
              />
              <Button variant="outlined" onClick={addDomain}>
                Add
              </Button>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {formData.allowedDomains.map((domain) => (
                <Chip
                  key={domain}
                  label={domain}
                  onDelete={() => removeDomain(domain)}
                  icon={<Domain />}
                />
              ))}
            </Box>

            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              Expiration (Optional)
            </Typography>
            <TextField
              fullWidth
              type="datetime-local"
              value={formData.expiresAt || ''}
              onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value || null })}
              helperText="Leave empty for no expiration"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreateApiKey}
            disabled={creating || !formData.name.trim() || formData.permissions.length === 0}
          >
            {creating ? 'Creating...' : 'Create API Key'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* API Key Display Dialog */}
      <Dialog open={showKeyDialog} onClose={() => setShowKeyDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>API Key Generated</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>Important:</strong> This is the only time you'll be able to see the full API key.
              Make sure to copy it and store it securely.
            </Typography>
          </Alert>
          
          {newApiKey && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {newApiKey.name}
              </Typography>
              <TextField
                fullWidth
                label="API Key"
                value={showApiKey ? newApiKey.key : '••••••••••••••••••••••••••••••••'}
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowApiKey(!showApiKey)}
                        edge="end"
                      >
                        {showApiKey ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                      <IconButton
                        onClick={() => copyApiKey(newApiKey.key || '')}
                        edge="end"
                      >
                        <ContentCopy />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />
              
              <Typography variant="body2" color="text.secondary">
                <strong>Permissions:</strong> {newApiKey.permissions.join(', ')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Rate Limit:</strong> {newApiKey.rateLimit} requests/hour
              </Typography>
              {newApiKey.allowedDomains.length > 0 && (
                <Typography variant="body2" color="text.secondary">
                  <strong>Allowed Domains:</strong> {newApiKey.allowedDomains.join(', ')}
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowKeyDialog(false)}>Close</Button>
          {newApiKey && (
            <Button
              variant="contained"
              startIcon={<ContentCopy />}
              onClick={() => copyApiKey(newApiKey.key || '')}
            >
              Copy API Key
            </Button>
          )}
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

export default ApiKeyManagement;
