import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  Visibility as VisibilityIcon,
  ShoppingCart as ShoppingCartIcon,
  Error as ErrorIcon,
  AttachMoney as AttachMoneyIcon,
  Timeline as TimelineIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { analyticsService } from '../../services/analytics.service';
import { realtimeService } from '../../services/realtime.service';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `analytics-tab-${index}`,
    'aria-controls': `analytics-tabpanel-${index}`,
  };
}

interface AnalyticsSummary {
  totalLoads: number;
  totalViews: number;
  totalTicketSelections: number;
  totalCheckouts: number;
  totalPurchases: number;
  totalErrors: number;
  conversionRate: number;
  revenue: number;
}

interface WidgetAnalytics {
  widgetId: string;
  organizerId: string;
  eventId?: string;
  action: string;
  metadata?: {
    ticketType?: string;
    quantity?: number;
    amount?: number;
    error?: string;
    userAgent?: string;
    referrer?: string;
    ip?: string;
  };
  timestamp: Date;
}

interface HourlyBreakdown {
  hour: string;
  loads: number;
  views: number;
  purchases: number;
  revenue: number;
}

interface ConnectedClients {
  widget: number;
  organizer: number;
}

const AnalyticsDashboard: React.FC = () => {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [recentAnalytics, setRecentAnalytics] = useState<WidgetAnalytics[]>([]);
  const [hourlyBreakdown, setHourlyBreakdown] = useState<HourlyBreakdown[]>([]);
  const [connectedClients, setConnectedClients] = useState<ConnectedClients>({ widget: 0, organizer: 0 });
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = selectedEventId ? { eventId: selectedEventId } : {};
      
      const [dashboardData, summaryData] = await Promise.all([
        analyticsService.getRealtimeDashboard(params),
        analyticsService.getAnalyticsSummary(params),
      ]);

      if (dashboardData.success) {
        setSummary(dashboardData.data.summary);
        setRecentAnalytics(dashboardData.data.recentAnalytics);
        setHourlyBreakdown(dashboardData.data.hourlyBreakdown);
        setConnectedClients(dashboardData.data.connectedClients);
        setLastUpdated(new Date(dashboardData.data.lastUpdated));
      }

      if (summaryData.success) {
        setSummary(summaryData.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  }, [selectedEventId]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchAnalyticsData();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, fetchAnalyticsData]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleRefresh = () => {
    fetchAnalyticsData();
  };

  const handleEventChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setSelectedEventId(event.target.value as string);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleString();
  };

  const getConversionRateColor = (rate: number): string => {
    if (rate >= 5) return theme.palette.success.main;
    if (rate >= 2) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  if (loading && !summary) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Analytics Dashboard
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Filter by Event</InputLabel>
            <Select
              value={selectedEventId}
              label="Filter by Event"
              onChange={handleEventChange}
            >
              <MenuItem value="">All Events</MenuItem>
              {/* TODO: Add event options */}
            </Select>
          </FormControl>
          
          <Tooltip title="Refresh Data">
            <IconButton onClick={handleRefresh} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          
          <Chip
            label={autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
            color={autoRefresh ? 'success' : 'default'}
            onClick={() => setAutoRefresh(!autoRefresh)}
            variant="outlined"
          />
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      {summary && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <VisibilityIcon color="primary" sx={{ mr: 1 }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Total Loads
                    </Typography>
                    <Typography variant="h4">
                      {summary.totalLoads.toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <ShoppingCartIcon color="secondary" sx={{ mr: 1 }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Total Purchases
                    </Typography>
                    <Typography variant="h4">
                      {summary.totalPurchases.toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TrendingUpIcon 
                    sx={{ 
                      mr: 1,
                      color: getConversionRateColor(summary.conversionRate)
                    }} 
                  />
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Conversion Rate
                    </Typography>
                    <Typography 
                      variant="h4"
                      sx={{ color: getConversionRateColor(summary.conversionRate) }}
                    >
                      {summary.conversionRate.toFixed(1)}%
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <AttachMoneyIcon color="success" sx={{ mr: 1 }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Total Revenue
                    </Typography>
                    <Typography variant="h4">
                      {formatCurrency(summary.revenue)}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Connected Clients */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Real-time Connections
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h3" color="primary">
                {connectedClients.widget}
              </Typography>
              <Typography color="textSecondary">Widget Connections</Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h3" color="secondary">
                {connectedClients.organizer}
              </Typography>
              <Typography color="textSecondary">Organizer Connections</Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabs */}
      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="analytics tabs">
            <Tab label="Overview" {...a11yProps(0)} />
            <Tab label="Hourly Breakdown" {...a11yProps(1)} />
            <Tab label="Recent Activity" {...a11yProps(2)} />
            <Tab label="Conversion Funnel" {...a11yProps(3)} />
          </Tabs>
        </Box>

        <CustomTabPanel value={tabValue} index={0}>
          <Typography variant="h6" gutterBottom>
            Performance Overview
          </Typography>
          
          {summary && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Engagement Metrics
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography>Ticket Selections</Typography>
                        <Typography>{summary.totalTicketSelections}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography>Checkouts Started</Typography>
                        <Typography>{summary.totalCheckouts}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography>Errors</Typography>
                        <Typography color="error">{summary.totalErrors}</Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Conversion Funnel
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography>Loads → Views</Typography>
                        <Typography>
                          {summary.totalLoads > 0 
                            ? ((summary.totalViews / summary.totalLoads) * 100).toFixed(1) + '%'
                            : '0%'
                          }
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography>Views → Selections</Typography>
                        <Typography>
                          {summary.totalViews > 0 
                            ? ((summary.totalTicketSelections / summary.totalViews) * 100).toFixed(1) + '%'
                            : '0%'
                          }
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography>Selections → Purchases</Typography>
                        <Typography>
                          {summary.totalTicketSelections > 0 
                            ? ((summary.totalPurchases / summary.totalTicketSelections) * 100).toFixed(1) + '%'
                            : '0%'
                          }
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </CustomTabPanel>

        <CustomTabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            Hourly Activity (Last 24 Hours)
          </Typography>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Hour</TableCell>
                  <TableCell align="right">Loads</TableCell>
                  <TableCell align="right">Views</TableCell>
                  <TableCell align="right">Purchases</TableCell>
                  <TableCell align="right">Revenue</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {hourlyBreakdown.map((hour, index) => (
                  <TableRow key={index}>
                    <TableCell>{hour.hour}</TableCell>
                    <TableCell align="right">{hour.loads}</TableCell>
                    <TableCell align="right">{hour.views}</TableCell>
                    <TableCell align="right">{hour.purchases}</TableCell>
                    <TableCell align="right">{formatCurrency(hour.revenue)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CustomTabPanel>

        <CustomTabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Recent Activity
          </Typography>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell>Event ID</TableCell>
                  <TableCell>Details</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentAnalytics.map((analytic, index) => (
                  <TableRow key={index}>
                    <TableCell>{formatDate(new Date(analytic.timestamp))}</TableCell>
                    <TableCell>
                      <Chip 
                        label={analytic.action}
                        size="small"
                        color={
                          analytic.action === 'purchase' ? 'success' :
                          analytic.action === 'error' ? 'error' :
                          'default'
                        }
                      />
                    </TableCell>
                    <TableCell>{analytic.eventId || '-'}</TableCell>
                    <TableCell>
                      {analytic.metadata && (
                        <Box>
                          {analytic.metadata.ticketType && (
                            <Typography variant="caption" display="block">
                              Ticket: {analytic.metadata.ticketType}
                            </Typography>
                          )}
                          {analytic.metadata.quantity && (
                            <Typography variant="caption" display="block">
                              Quantity: {analytic.metadata.quantity}
                            </Typography>
                          )}
                          {analytic.metadata.amount && (
                            <Typography variant="caption" display="block">
                              Amount: {formatCurrency(analytic.metadata.amount)}
                            </Typography>
                          )}
                          {analytic.metadata.error && (
                            <Typography variant="caption" color="error" display="block">
                              Error: {analytic.metadata.error}
                            </Typography>
                          )}
                        </Box>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CustomTabPanel>

        <CustomTabPanel value={tabValue} index={3}>
          <Typography variant="h6" gutterBottom>
            Conversion Funnel Analysis
          </Typography>
          
          {summary && (
            <Box>
              <Grid container spacing={2}>
                {[
                  { label: 'Widget Loads', value: summary.totalLoads, color: theme.palette.primary.main },
                  { label: 'Ticket Views', value: summary.totalViews, color: theme.palette.info.main },
                  { label: 'Ticket Selections', value: summary.totalTicketSelections, color: theme.palette.warning.main },
                  { label: 'Checkouts', value: summary.totalCheckouts, color: theme.palette.secondary.main },
                  { label: 'Purchases', value: summary.totalPurchases, color: theme.palette.success.main },
                ].map((step, index) => {
                  const conversionRate = index === 0 ? 100 : 
                    summary.totalLoads > 0 ? (step.value / summary.totalLoads) * 100 : 0;
                  
                  return (
                    <Grid item xs={12} key={index}>
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="subtitle1">{step.label}</Typography>
                          <Typography variant="subtitle1">
                            {step.value.toLocaleString()} ({conversionRate.toFixed(1)}%)
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={conversionRate}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: theme.palette.grey[300],
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: step.color,
                            },
                          }}
                        />
                      </Box>
                    </Grid>
                  );
                })}
              </Grid>
            </Box>
          )}
        </CustomTabPanel>
      </Paper>

      {lastUpdated && (
        <Typography variant="caption" color="textSecondary" sx={{ mt: 2, display: 'block' }}>
          Last updated: {formatDate(lastUpdated)}
        </Typography>
      )}
    </Box>
  );
};

export default AnalyticsDashboard;
