import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  LinearProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  CreditCard as CreditCardIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
  People as PeopleIcon,
  Event as EventIcon,
  Api as ApiIcon,
  Refresh as RefreshIcon,
  Upgrade as UpgradeIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import {
  fetchCurrentSubscription,
  fetchCurrentUsage,
  cancelSubscription,
  clearError,
} from '../../store/subscriptions.slice';
import { subscriptionsService } from '../../services/subscriptions.service';
import { useNavigate } from 'react-router-dom';

const SubscriptionManagement: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentSubscription, currentUsage, loading, error } = useSelector((state: RootState) => state.subscriptions);
  const { user } = useSelector((state: RootState) => state.auth);

  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchCurrentSubscription());
      dispatch(fetchCurrentUsage());
    }
  }, [dispatch, user?.id]);

  const handleCancelSubscription = async () => {
    if (currentSubscription) {
      try {
        await dispatch(cancelSubscription({
          subscriptionId: currentSubscription.id,
          reason: cancelReason || 'User requested cancellation',
        })).unwrap();
        setShowCancelDialog(false);
        setCancelReason('');
        dispatch(fetchCurrentSubscription());
      } catch (error) {
        console.error('Failed to cancel subscription:', error);
      }
    }
  };

  const handleUpgrade = () => {
    navigate('/subscription/pricing');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'CANCELLED':
        return 'error';
      case 'EXPIRED':
        return 'default';
      default:
        return 'default';
    }
  };

  const getUsagePercentage = (current: number, limit: number) => {
    if (limit === -1) return 0; // Unlimited
    if (limit === 0) return 100;
    return Math.min((current / limit) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage < 70) return 'success';
    if (percentage < 90) return 'warning';
    return 'error';
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <Typography>Loading subscription details...</Typography>
        </Box>
      </Container>
    );
  }

  if (!currentSubscription) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box textAlign="center" py={8}>
          <Typography variant="h4" gutterBottom>
            No Active Subscription
          </Typography>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            You don't have an active subscription. Choose a plan to get started.
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/subscription/pricing')}
            sx={{ mt: 3 }}
          >
            View Plans
          </Button>
        </Box>
      </Container>
    );
  }

  const plan = currentSubscription.planDetails;
  const usage = currentSubscription.currentUsage;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Subscription Management
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => dispatch(clearError())}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Current Plan Card */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
                <Box>
                  <Typography variant="h5" component="h2" gutterBottom>
                    {plan?.displayName || subscriptionsService.formatPlanName(currentSubscription.plan)}
                  </Typography>
                  <Chip
                    label={currentSubscription.status}
                    color={getStatusColor(currentSubscription.status) as any}
                    size="small"
                  />
                </Box>
                <Box textAlign="right">
                  <Typography variant="h4" component="div">
                    {subscriptionsService.formatCurrency(currentSubscription.price)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    per month
                  </Typography>
                </Box>
              </Box>

              <Grid container spacing={2} mb={3}>
                <Grid item xs={6} md={3}>
                  <Box textAlign="center">
                    <CalendarIcon color="primary" sx={{ fontSize: 32, mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      Started
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(currentSubscription.startDate)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Box textAlign="center">
                    <CalendarIcon color="primary" sx={{ fontSize: 32, mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      Expires
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(currentSubscription.endDate)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Box textAlign="center">
                    <WarningIcon color="warning" sx={{ fontSize: 32, mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      Days Remaining
                    </Typography>
                    <Typography variant="body1">
                      {currentSubscription.daysRemaining}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Box textAlign="center">
                    <CreditCardIcon color="primary" sx={{ fontSize: 32, mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      Auto Renew
                    </Typography>
                    <Typography variant="body1">
                      {currentSubscription.autoRenew ? 'Yes' : 'No'}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              <Box display="flex" gap={2} flexWrap="wrap">
                <Button
                  variant="outlined"
                  startIcon={<UpgradeIcon />}
                  onClick={handleUpgrade}
                  disabled={currentSubscription.plan === 'ENTERPRISE'}
                >
                  Upgrade Plan
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<CancelIcon />}
                  onClick={() => setShowCancelDialog(true)}
                  disabled={currentSubscription.status !== 'ACTIVE'}
                >
                  Cancel Subscription
                </Button>
                <Tooltip title="Refresh subscription data">
                  <IconButton onClick={() => dispatch(fetchCurrentSubscription())}>
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Usage Overview */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Current Usage
              </Typography>
              
              {usage && plan && (
                <List dense>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon>
                      <EventIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Events Created"
                      secondary={`${usage.eventsCreated} / ${plan.limits.eventsPerMonth === -1 ? '∞' : plan.limits.eventsPerMonth}`}
                    />
                    {plan.limits.eventsPerMonth !== -1 && (
                      <Box sx={{ width: 100, ml: 2 }}>
                        <LinearProgress
                          variant="determinate"
                          value={getUsagePercentage(usage.eventsCreated, plan.limits.eventsPerMonth)}
                          color={getUsageColor(getUsagePercentage(usage.eventsCreated, plan.limits.eventsPerMonth)) as any}
                        />
                      </Box>
                    )}
                  </ListItem>

                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon>
                      <PeopleIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Tickets Sold"
                      secondary={`${usage.ticketsSold} this month`}
                    />
                  </ListItem>

                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon>
                      <MoneyIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Revenue"
                      secondary={subscriptionsService.formatCurrency(usage.revenue)}
                    />
                  </ListItem>

                  {plan.limits.apiCallsPerMonth !== 0 && (
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon>
                        <ApiIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary="API Calls"
                        secondary={`${usage.apiCalls} / ${plan.limits.apiCallsPerMonth === -1 ? '∞' : plan.limits.apiCallsPerMonth}`}
                      />
                      {plan.limits.apiCallsPerMonth !== -1 && (
                        <Box sx={{ width: 100, ml: 2 }}>
                          <LinearProgress
                            variant="determinate"
                            value={getUsagePercentage(usage.apiCalls, plan.limits.apiCallsPerMonth)}
                            color={getUsageColor(getUsagePercentage(usage.apiCalls, plan.limits.apiCallsPerMonth)) as any}
                          />
                        </Box>
                      )}
                    </ListItem>
                  )}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Plan Features */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Plan Features
              </Typography>
              
              {plan && (
                <Grid container spacing={2}>
                  {subscriptionsService.getPlanFeatures(plan).map((feature, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                      <Box display="flex" alignItems="center">
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          {feature.included ? (
                            <CheckIcon color="success" />
                          ) : (
                            <CloseIcon color="disabled" />
                          )}
                        </ListItemIcon>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                            {feature.name}
                          </Typography>
                          {feature.limit && (
                            <Typography variant="caption" color="text.secondary">
                              {feature.limit}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Cancel Subscription Dialog */}
      <Dialog open={showCancelDialog} onClose={() => setShowCancelDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Cancel Subscription</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="body2">
              Are you sure you want to cancel your subscription? You'll lose access to premium features
              and your subscription will remain active until the end of your current billing period.
            </Typography>
          </Alert>
          
          <TextField
            fullWidth
            label="Reason for cancellation (optional)"
            multiline
            rows={3}
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Help us improve by telling us why you're cancelling..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCancelDialog(false)}>Keep Subscription</Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleCancelSubscription}
            disabled={loading}
          >
            Cancel Subscription
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SubscriptionManagement;
