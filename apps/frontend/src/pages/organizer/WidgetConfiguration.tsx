import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert,
  Snackbar,
  Divider,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Palette,
  Code,
  Preview,
  Save,
  Refresh,
  Download,
  Visibility,
  VisibilityOff,
  ContentCopy,
} from '@mui/icons-material';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { widgetConfigService } from '../../services/widgetConfig.service';

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
      id={`widget-config-tabpanel-${index}`}
      aria-labelledby={`widget-config-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

interface WidgetConfigurationProps {
  eventId?: string;
}

const WidgetConfiguration: React.FC<WidgetConfigurationProps> = ({ eventId }) => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({ open: false, message: '', severity: 'info' });

  // Widget configuration state
  const [config, setConfig] = useState({
    theme: {
      primaryColor: '#1976d2',
      secondaryColor: '#dc004e',
      backgroundColor: '#ffffff',
      textColor: '#333333',
      fontFamily: 'Roboto, sans-serif',
      borderRadius: '8px',
      buttonStyle: 'rounded' as 'rounded' | 'square' | 'pill',
    },
    customCSS: '',
    layout: 'standard' as 'compact' | 'standard' | 'expanded',
    language: 'en',
    currency: 'EGP',
    settings: {
      showVenueInfo: true,
      showEventDescription: true,
      realtimeUpdates: true,
      showTicketTypes: true,
      showQuantitySelector: true,
      showDiscountCodes: false,
    },
  });

  // API key state
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    loadWidgetConfiguration();
    loadApiKey();
  }, []);

  const loadWidgetConfiguration = async () => {
    try {
      setLoading(true);
      const response = await widgetConfigService.getWidgetConfig();
      if (response.data) {
        setConfig(response.data);
      }
    } catch (error) {
      console.error('Failed to load widget configuration:', error);
      showNotification('Failed to load widget configuration', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadApiKey = async () => {
    try {
      // This would be implemented to fetch the organizer's API key
      // For now, we'll simulate it
      setApiKey('tzk_live_sk_test_1234567890abcdef');
    } catch (error) {
      console.error('Failed to load API key:', error);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await widgetConfigService.createOrUpdateWidgetConfig(config);
      showNotification('Widget configuration saved successfully', 'success');
    } catch (error) {
      console.error('Failed to save widget configuration:', error);
      showNotification('Failed to save widget configuration', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      setSaving(true);
      await widgetConfigService.resetWidgetConfig();
      await loadWidgetConfiguration();
      showNotification('Widget configuration reset to defaults', 'success');
    } catch (error) {
      console.error('Failed to reset widget configuration:', error);
      showNotification('Failed to reset widget configuration', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = async () => {
    try {
      setSaving(true);
      await widgetConfigService.previewWidgetConfig(config);
      setPreviewMode(true);
      showNotification('Preview mode activated', 'info');
    } catch (error) {
      console.error('Failed to preview widget configuration:', error);
      showNotification('Failed to preview widget configuration', 'error');
    } finally {
      setSaving(false);
    }
  };

  const generateEmbedCode = () => {
    const widgetUrl = `${window.location.origin}/widget.html`;
    const scriptCode = `<!-- Tazkartak Widget -->
<div id="tazkartak-widget-container"></div>
<script src="${window.location.origin}/widget/tazkartak-widget.umd.js"></script>
<script>
  TazkartakWidget.init({
    eventId: '${eventId || 'YOUR_EVENT_ID'}',
    apiKey: '${apiKey}',
    theme: ${JSON.stringify(config.theme, null, 2)},
    layout: '${config.layout}',
    language: '${config.language}',
    currency: '${config.currency}'
  });
</script>`;

    return scriptCode;
  };

  const copyEmbedCode = async () => {
    try {
      await navigator.clipboard.writeText(generateEmbedCode());
      showNotification('Embed code copied to clipboard', 'success');
    } catch (error) {
      showNotification('Failed to copy embed code', 'error');
    }
  };

  const downloadEmbedCode = () => {
    const blob = new Blob([generateEmbedCode()], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tazkartak-widget.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const showNotification = (message: string, severity: 'success' | 'error' | 'info') => {
    setNotification({ open: true, message, severity });
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  const updateConfig = (path: string, value: any) => {
    setConfig((prev) => {
      const keys = path.split('.');
      const newConfig = { ...prev };
      let current = newConfig;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newConfig;
    });
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Widget Configuration
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Customize your ticket widget appearance and behavior for embedding on your website.
      </Typography>

      <Paper sx={{ mt: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
          aria-label="widget configuration tabs"
        >
          <Tab icon={<Palette />} label="Theme" />
          <Tab icon={<Code />} label="Advanced" />
          <Tab icon={<Preview />} label="Preview & Embed" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Color Scheme
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Primary Color"
                    type="color"
                    value={config.theme.primaryColor}
                    onChange={(e) => updateConfig('theme.primaryColor', e.target.value)}
                    InputProps={{
                      startAdornment: <Palette sx={{ mr: 1 }} />,
                    }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Secondary Color"
                    type="color"
                    value={config.theme.secondaryColor}
                    onChange={(e) => updateConfig('theme.secondaryColor', e.target.value)}
                    InputProps={{
                      startAdornment: <Palette sx={{ mr: 1 }} />,
                    }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Background Color"
                    type="color"
                    value={config.theme.backgroundColor}
                    onChange={(e) => updateConfig('theme.backgroundColor', e.target.value)}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Text Color"
                    type="color"
                    value={config.theme.textColor}
                    onChange={(e) => updateConfig('theme.textColor', e.target.value)}
                  />
                </Grid>
              </Grid>

              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                Typography
              </Typography>
              <TextField
                fullWidth
                label="Font Family"
                value={config.theme.fontFamily}
                onChange={(e) => updateConfig('theme.fontFamily', e.target.value)}
                placeholder="e.g., Roboto, Arial, sans-serif"
              />

              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                Layout
              </Typography>
              <FormControl fullWidth>
                <InputLabel>Border Radius</InputLabel>
                <Select
                  value={config.theme.borderRadius}
                  onChange={(e) => updateConfig('theme.borderRadius', e.target.value)}
                >
                  <MenuItem value="0px">None</MenuItem>
                  <MenuItem value="4px">Small</MenuItem>
                  <MenuItem value="8px">Medium</MenuItem>
                  <MenuItem value="16px">Large</MenuItem>
                  <MenuItem value="24px">Extra Large</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>Button Style</InputLabel>
                <Select
                  value={config.theme.buttonStyle}
                  onChange={(e) => updateConfig('theme.buttonStyle', e.target.value)}
                >
                  <MenuItem value="rounded">Rounded</MenuItem>
                  <MenuItem value="square">Square</MenuItem>
                  <MenuItem value="pill">Pill</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Preview
              </Typography>
              <Card
                sx={{
                  p: 2,
                  backgroundColor: config.theme.backgroundColor,
                  color: config.theme.textColor,
                  borderRadius: config.theme.borderRadius,
                  fontFamily: config.theme.fontFamily,
                }}
              >
                <Typography variant="h6" sx={{ color: config.theme.primaryColor }}>
                  Event Title
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  Event description goes here...
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <Chip label="VIP" size="small" sx={{ backgroundColor: config.theme.primaryColor, color: 'white' }} />
                  <Chip label="General" size="small" sx={{ backgroundColor: config.theme.secondaryColor, color: 'white' }} />
                </Box>
                <Button
                  variant="contained"
                  sx={{
                    backgroundColor: config.theme.primaryColor,
                    borderRadius: config.theme.buttonStyle === 'pill' ? '20px' : config.theme.borderRadius,
                  }}
                >
                  Buy Tickets
                </Button>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Custom CSS
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={8}
                label="Custom CSS"
                value={config.customCSS}
                onChange={(e) => updateConfig('customCSS', e.target.value)}
                placeholder="/* Add your custom CSS here */"
                sx={{ fontFamily: 'monospace' }}
              />

              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                Widget Settings
              </Typography>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Layout</InputLabel>
                <Select
                  value={config.layout}
                  onChange={(e) => updateConfig('layout', e.target.value)}
                >
                  <MenuItem value="compact">Compact</MenuItem>
                  <MenuItem value="standard">Standard</MenuItem>
                  <MenuItem value="expanded">Expanded</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Language</InputLabel>
                <Select
                  value={config.language}
                  onChange={(e) => updateConfig('language', e.target.value)}
                >
                  <MenuItem value="en">English</MenuItem>
                  <MenuItem value="ar">Arabic</MenuItem>
                  <MenuItem value="fr">French</MenuItem>
                  <MenuItem value="de">German</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Currency</InputLabel>
                <Select
                  value={config.currency}
                  onChange={(e) => updateConfig('currency', e.target.value)}
                >
                  <MenuItem value="EGP">Egyptian Pound (EGP)</MenuItem>
                  <MenuItem value="USD">US Dollar (USD)</MenuItem>
                  <MenuItem value="EUR">Euro (EUR)</MenuItem>
                  <MenuItem value="GBP">British Pound (GBP)</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Display Options
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.settings.showVenueInfo}
                      onChange={(e) => updateConfig('settings.showVenueInfo', e.target.checked)}
                    />
                  }
                  label="Show Venue Information"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.settings.showEventDescription}
                      onChange={(e) => updateConfig('settings.showEventDescription', e.target.checked)}
                    />
                  }
                  label="Show Event Description"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.settings.realtimeUpdates}
                      onChange={(e) => updateConfig('settings.realtimeUpdates', e.target.checked)}
                    />
                  }
                  label="Real-time Updates"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.settings.showTicketTypes}
                      onChange={(e) => updateConfig('settings.showTicketTypes', e.target.checked)}
                    />
                  }
                  label="Show Ticket Types"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.settings.showQuantitySelector}
                      onChange={(e) => updateConfig('settings.showQuantitySelector', e.target.checked)}
                    />
                  }
                  label="Show Quantity Selector"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.settings.showDiscountCodes}
                      onChange={(e) => updateConfig('settings.showDiscountCodes', e.target.checked)}
                    />
                  }
                  label="Show Discount Codes"
                />
              </Box>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Embed Code
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={10}
                label="Widget Embed Code"
                value={generateEmbedCode()}
                InputProps={{
                  readOnly: true,
                  sx: { fontFamily: 'monospace', fontSize: '0.875rem' },
                }}
              />
              
              <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<ContentCopy />}
                  onClick={copyEmbedCode}
                >
                  Copy Code
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Download />}
                  onClick={downloadEmbedCode}
                >
                  Download HTML
                </Button>
              </Box>

              <Alert severity="info" sx={{ mt: 2 }}>
                Copy this code and paste it into your website's HTML where you want the ticket widget to appear.
              </Alert>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                API Key
              </Typography>
              <TextField
                fullWidth
                label="API Key"
                value={showApiKey ? apiKey : '••••••••••••••••••••••••••••••••'}
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <IconButton
                      onClick={() => setShowApiKey(!showApiKey)}
                      edge="end"
                    >
                      {showApiKey ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  ),
                }}
              />
              
              <Alert severity="warning" sx={{ mt: 2 }}>
                Keep your API key secure and never share it publicly. This key is used to authenticate widget requests.
              </Alert>

              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                Live Preview
              </Typography>
              <Card sx={{ p: 2, minHeight: 200 }}>
                <Typography variant="body2" color="text.secondary">
                  Live preview will be available here once you select an event.
                </Typography>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>

      <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={handleReset}
          disabled={saving}
        >
          Reset to Defaults
        </Button>
        <Button
          variant="outlined"
          startIcon={<Preview />}
          onClick={handlePreview}
          disabled={saving}
        >
          Preview
        </Button>
        <Button
          variant="contained"
          startIcon={<Save />}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Configuration'}
        </Button>
      </Box>

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

export default WidgetConfiguration;
