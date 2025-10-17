import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
} from '@mui/material';
import {
  Check as CheckIcon,
  Close as CloseIcon,
  Star as StarIcon,
  Rocket as RocketIcon,
  Crown as CrownIcon,
  Payment as PaymentIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import {
  fetchPlans,
  fetchCurrentSubscription,
  createSubscription,
  clearError,
  setSelectedPlan,
} from '../../store/subscriptions.slice';
import { subscriptionsService } from '../../services/subscriptions.service';
import { PaymentModal } from '../../components/payment/PaymentModal';
import { useNavigate } from 'react-router-dom';

const PricingPage: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { plans, currentSubscription, loading, error } = useSelector((state: RootState) => state.subscriptions);
  const { user } = useSelector((state: RootState) => state.auth);

  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState('');

  useEffect(() => {
    dispatch(fetchPlans());
    if (user?.id) {
      dispatch(fetchCurrentSubscription());
    }
  }, [dispatch, user?.id]);

  const handlePlanSelect = (planName: string) => {
    if (!user?.id) {
      navigate('/auth/login');
      return;
    }

    // Check if user already has this plan
    if (currentSubscription?.plan === planName && currentSubscription?.status === 'ACTIVE') {
      return;
    }

    // Check if it's an upgrade
    if (currentSubscription && subscriptionsService.canUpgradeTo(currentSubscription.plan, planName)) {
      setSelectedPlan(planName);
      setShowUpgradeDialog(true);
      return;
    }

    setSelectedPlan(planName);
    setShowPaymentModal(true);
  };

  const handleUpgradeConfirm = () => {
    if (selectedPlan) {
      setShowUpgradeDialog(false);
      setShowPaymentModal(true);
    }
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    dispatch(fetchCurrentSubscription());
    navigate('/subscription/success');
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment failed:', error);
  };

  const getPlanIcon = (planName: string) => {
    switch (planName) {
      case 'BASIC':
        return <StarIcon sx={{ fontSize: 40, color: 'primary.main' }} />;
      case 'PRO':
        return <RocketIcon sx={{ fontSize: 40, color: 'secondary.main' }} />;
      case 'ENTERPRISE':
        return <CrownIcon sx={{ fontSize: 40, color: 'warning.main' }} />;
      default:
        return <PaymentIcon sx={{ fontSize: 40, color: 'primary.main' }} />;
    }
  };

  const getPlanColor = (planName: string) => {
    switch (planName) {
      case 'BASIC':
        return 'primary';
      case 'PRO':
        return 'secondary';
      case 'ENTERPRISE':
        return 'warning';
      default:
        return 'default';
    }
  };

  const isCurrentPlan = (planName: string) => {
    return currentSubscription?.plan === planName && currentSubscription?.status === 'ACTIVE';
  };

  const isUpgrade = (planName: string) => {
    return currentSubscription && subscriptionsService.canUpgradeTo(currentSubscription.plan, planName);
  };

  const getPlanFeatures = (plan: any) => {
    return subscriptionsService.getPlanFeatures(plan);
  };

  const getButtonText = (planName: string) => {
    if (isCurrentPlan(planName)) {
      return 'Current Plan';
    }
    if (isUpgrade(planName)) {
      return 'Upgrade';
    }
    return 'Get Started';
  };

  const getButtonVariant = (planName: string) => {
    if (isCurrentPlan(planName)) {
      return 'outlined';
    }
    if (isUpgrade(planName)) {
      return 'contained';
    }
    return 'contained';
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Box textAlign="center" mb={8}>
        <Typography variant="h2" component="h1" gutterBottom>
          Choose Your Plan
        </Typography>
        <Typography variant="h5" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
          Select the perfect plan for your event management needs. Upgrade or downgrade at any time.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 4 }} onClose={() => dispatch(clearError())}>
          {error}
        </Alert>
      )}

      <Grid container spacing={4} justifyContent="center">
        {plans.map((plan) => (
          <Grid item xs={12} md={4} key={plan.id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                border: isCurrentPlan(plan.name) ? 2 : 1,
                borderColor: isCurrentPlan(plan.name) ? `${getPlanColor(plan.name)}.main` : 'divider',
                transform: isCurrentPlan(plan.name) ? 'scale(1.02)' : 'none',
                transition: 'all 0.3s ease',
              }}
            >
              {isCurrentPlan(plan.name) && (
                <Chip
                  label="Current Plan"
                  color={getPlanColor(plan.name) as any}
                  sx={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    zIndex: 1,
                  }}
                />
              )}

              <CardContent sx={{ flexGrow: 1, pt: 4 }}>
                <Box textAlign="center" mb={3}>
                  {getPlanIcon(plan.name)}
                  <Typography variant="h4" component="h2" gutterBottom sx={{ mt: 2 }}>
                    {plan.displayName}
                  </Typography>
                  <Box display="flex" alignItems="baseline" justifyContent="center">
                    <Typography variant="h3" component="span" sx={{ fontWeight: 'bold' }}>
                      {subscriptionsService.formatCurrency(plan.price)}
                    </Typography>
                    <Typography variant="h6" color="text.secondary" sx={{ ml: 1 }}>
                      /month
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ my: 3 }} />

                <List dense>
                  {getPlanFeatures(plan).map((feature, index) => (
                    <ListItem key={index} sx={{ px: 0 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        {feature.included ? (
                          <CheckIcon color="success" />
                        ) : (
                          <CloseIcon color="disabled" />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={feature.name}
                        secondary={feature.limit}
                        primaryTypographyProps={{ variant: 'body2' }}
                        secondaryTypographyProps={{ variant: 'caption' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>

              <CardActions sx={{ p: 3, pt: 0 }}>
                <Button
                  fullWidth
                  variant={getButtonVariant(plan.name) as any}
                  color={getPlanColor(plan.name) as any}
                  size="large"
                  onClick={() => handlePlanSelect(plan.name)}
                  disabled={isCurrentPlan(plan.name)}
                >
                  {getButtonText(plan.name)}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Plan Comparison Table */}
      <Box mt={8}>
        <Typography variant="h4" component="h2" textAlign="center" gutterBottom>
          Compare Plans
        </Typography>
        <Box overflow="auto" mt={4}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                  Features
                </th>
                {plans.map((plan) => (
                  <th
                    key={plan.id}
                    style={{
                      padding: '12px',
                      textAlign: 'center',
                      borderBottom: '1px solid #ddd',
                      backgroundColor: '#f5f5f5',
                    }}
                  >
                    {plan.displayName}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {subscriptionsService.getPlanComparison(plans).map((row, index) => (
                <tr key={index}>
                  <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                    {row.feature}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #eee' }}>
                    {typeof row.basic === 'boolean' ? (
                      row.basic ? <CheckIcon color="success" /> : <CloseIcon color="disabled" />
                    ) : (
                      row.basic
                    )}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #eee' }}>
                    {typeof row.pro === 'boolean' ? (
                      row.pro ? <CheckIcon color="success" /> : <CloseIcon color="disabled" />
                    ) : (
                      row.pro
                    )}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #eee' }}>
                    {typeof row.enterprise === 'boolean' ? (
                      row.enterprise ? <CheckIcon color="success" /> : <CloseIcon color="disabled" />
                    ) : (
                      row.enterprise
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Box>
      </Box>

      {/* Upgrade Confirmation Dialog */}
      <Dialog open={showUpgradeDialog} onClose={() => setShowUpgradeDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Upgrade Subscription</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            You're about to upgrade from {subscriptionsService.formatPlanName(currentSubscription?.plan || '')} to{' '}
            {subscriptionsService.formatPlanName(selectedPlan || '')}.
          </Typography>
          <Typography gutterBottom>
            The upgrade will be prorated and you'll be charged the difference for the remaining days in your current billing cycle.
          </Typography>
          <TextField
            fullWidth
            label="Reason for upgrade (optional)"
            multiline
            rows={3}
            value={upgradeReason}
            onChange={(e) => setUpgradeReason(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowUpgradeDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleUpgradeConfirm}>
            Confirm Upgrade
          </Button>
        </DialogActions>
      </Dialog>

      {/* Payment Modal */}
      {selectedPlan && (
        <PaymentModal
          open={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          paymentData={{
            eventId: 'subscription',
            ticketTypeId: `subscription-${selectedPlan}`,
            quantity: 1,
            amount: plans.find(p => p.name === selectedPlan)?.price || 0,
            currency: 'EGP',
            customerData: {
              firstName: user?.name?.split(' ')[0] || '',
              lastName: user?.name?.split(' ').slice(1).join(' ') || '',
              email: user?.email || '',
              phone: user?.phone || '',
            },
          }}
          onPaymentSuccess={handlePaymentSuccess}
          onPaymentError={handlePaymentError}
        />
      )}
    </Container>
  );
};

export default PricingPage;
