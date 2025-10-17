import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
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
  IconButton,
  Alert,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Switch,
  FormControlLabel,
  Divider,
  Card,
  CardContent,
  Grid,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  ContentCopy as CopyIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

interface OAuthClient {
  id: string;
  name: string;
  clientId: string;
  clientSecret: string;
  redirectUris: string[];
  scopes: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CreateClientData {
  name: string;
  redirectUris: string[];
  scopes: string[];
}

const SUPPORTED_SCOPES = [
  'read',
  'write',
  'events:read',
  'events:write',
  'tickets:read',
  'tickets:write',
  'analytics:read',
  'webhooks:read',
  'webhooks:write',
];

const OAuthManagement: React.FC = () => {
  const [clients, setClients] = useState<OAuthClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<OAuthClient | null>(null);
  
  // Form states
  const [formData, setFormData] = useState<CreateClientData>({
    name: '',
    redirectUris: [''],
    scopes: ['read', 'write'],
  });
  const [showSecret, setShowSecret] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/oauth/clients', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch OAuth clients');
      }
      
      const data = await response.json();
      setClients(data.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClient = async () => {
    try {
      const response = await fetch('/api/oauth/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to create OAuth client');
      }

      const data = await response.json();
      setClients([...clients, data.data]);
      setCreateDialogOpen(false);
      setFormData({ name: '', redirectUris: [''], scopes: ['read', 'write'] });
      setSuccess('OAuth client created successfully');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUpdateClient = async () => {
    if (!selectedClient) return;

    try {
      const response = await fetch(`/api/oauth/clients/${selectedClient.clientId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to update OAuth client');
      }

      const data = await response.json();
      setClients(clients.map(client => 
        client.clientId === selectedClient.clientId ? data.data : client
      ));
      setEditDialogOpen(false);
      setSelectedClient(null);
      setSuccess('OAuth client updated successfully');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    if (!window.confirm('Are you sure you want to delete this OAuth client?')) {
      return;
    }

    try {
      const response = await fetch(`/api/oauth/clients/${clientId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to delete OAuth client');
      }

      setClients(clients.filter(client => client.clientId !== clientId));
      setSuccess('OAuth client deleted successfully');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleToggleSecret = (clientId: string) => {
    setShowSecret(prev => ({
      ...prev,
      [clientId]: !prev[clientId],
    }));
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess('Copied to clipboard');
  };

  const handleAddRedirectUri = () => {
    setFormData(prev => ({
      ...prev,
      redirectUris: [...prev.redirectUris, ''],
    }));
  };

  const handleRemoveRedirectUri = (index: number) => {
    setFormData(prev => ({
      ...prev,
      redirectUris: prev.redirectUris.filter((_, i) => i !== index),
    }));
  };

  const handleRedirectUriChange = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      redirectUris: prev.redirectUris.map((uri, i) => i === index ? value : uri),
    }));
  };

  const handleScopeChange = (scopes: string[]) => {
    setFormData(prev => ({ ...prev, scopes }));
  };

  const openEditDialog = (client: OAuthClient) => {
    setSelectedClient(client);
    setFormData({
      name: client.name,
      redirectUris: client.redirectUris.length > 0 ? client.redirectUris : [''],
      scopes: client.scopes,
    });
    setEditDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <Typography>Loading OAuth clients...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">OAuth Client Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Create OAuth Client
        </Button>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        OAuth clients allow third-party applications to access your Tazkartak data securely. 
        Each client has its own credentials and can be configured with specific permissions (scopes).
      </Alert>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Client ID</TableCell>
              <TableCell>Client Secret</TableCell>
              <TableCell>Redirect URIs</TableCell>
              <TableCell>Scopes</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {clients.map((client) => (
              <TableRow key={client.id}>
                <TableCell>{client.name}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {client.clientId}
                    </Typography>
                    <Tooltip title="Copy Client ID">
                      <IconButton size="small" onClick={() => handleCopyToClipboard(client.clientId)}>
                        <CopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {showSecret[client.clientId] 
                        ? client.clientSecret 
                        : '••••••••••••••••'
                      }
                    </Typography>
                    <Tooltip title={showSecret[client.clientId] ? "Hide Secret" : "Show Secret"}>
                      <IconButton 
                        size="small" 
                        onClick={() => handleToggleSecret(client.clientId)}
                      >
                        {showSecret[client.clientId] ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Copy Client Secret">
                      <IconButton size="small" onClick={() => handleCopyToClipboard(client.clientSecret)}>
                        <CopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
                <TableCell>
                  {client.redirectUris.map((uri, index) => (
                    <Chip key={index} label={uri} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                  ))}
                </TableCell>
                <TableCell>
                  {client.scopes.map((scope) => (
                    <Chip key={scope} label={scope} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                  ))}
                </TableCell>
                <TableCell>
                  <Chip 
                    label={client.isActive ? 'Active' : 'Inactive'} 
                    color={client.isActive ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>{formatDate(client.createdAt)}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Edit Client">
                      <IconButton size="small" onClick={() => openEditDialog(client)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Client">
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => handleDeleteClient(client.clientId)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {clients.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center', mt: 3 }}>
          <Typography variant="h6" color="textSecondary" gutterBottom>
            No OAuth clients found
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Create your first OAuth client to allow third-party applications to access your data.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Create OAuth Client
          </Button>
        </Paper>
      )}

      {/* Create Client Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create OAuth Client</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Client Name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            margin="normal"
            required
          />
          
          <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Redirect URIs</Typography>
          {formData.redirectUris.map((uri, index) => (
            <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
              <TextField
                fullWidth
                label={`Redirect URI ${index + 1}`}
                value={uri}
                onChange={(e) => handleRedirectUriChange(index, e.target.value)}
                placeholder="https://your-app.com/callback"
              />
              {formData.redirectUris.length > 1 && (
                <IconButton onClick={() => handleRemoveRedirectUri(index)}>
                  <DeleteIcon />
                </IconButton>
              )}
            </Box>
          ))}
          <Button onClick={handleAddRedirectUri} startIcon={<AddIcon />}>
            Add Redirect URI
          </Button>

          <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Scopes</Typography>
          <FormControl fullWidth>
            <Select
              multiple
              value={formData.scopes}
              onChange={(e) => handleScopeChange(e.target.value as string[])}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {(selected as string[]).map((value) => (
                    <Chip key={value} label={value} size="small" />
                  ))}
                </Box>
              )}
            >
              {SUPPORTED_SCOPES.map((scope) => (
                <MenuItem key={scope} value={scope}>
                  {scope}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateClient} 
            variant="contained"
            disabled={!formData.name || formData.redirectUris.every(uri => !uri)}
          >
            Create Client
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Client Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit OAuth Client</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Client Name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            margin="normal"
            required
          />
          
          <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Redirect URIs</Typography>
          {formData.redirectUris.map((uri, index) => (
            <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
              <TextField
                fullWidth
                label={`Redirect URI ${index + 1}`}
                value={uri}
                onChange={(e) => handleRedirectUriChange(index, e.target.value)}
                placeholder="https://your-app.com/callback"
              />
              {formData.redirectUris.length > 1 && (
                <IconButton onClick={() => handleRemoveRedirectUri(index)}>
                  <DeleteIcon />
                </IconButton>
              )}
            </Box>
          ))}
          <Button onClick={handleAddRedirectUri} startIcon={<AddIcon />}>
            Add Redirect URI
          </Button>

          <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Scopes</Typography>
          <FormControl fullWidth>
            <Select
              multiple
              value={formData.scopes}
              onChange={(e) => handleScopeChange(e.target.value as string[])}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {(selected as string[]).map((value) => (
                    <Chip key={value} label={value} size="small" />
                  ))}
                </Box>
              )}
            >
              {SUPPORTED_SCOPES.map((scope) => (
                <MenuItem key={scope} value={scope}>
                  {scope}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleUpdateClient} 
            variant="contained"
            disabled={!formData.name || formData.redirectUris.every(uri => !uri)}
          >
            Update Client
          </Button>
        </DialogActions>
      </Dialog>

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

export default OAuthManagement;
