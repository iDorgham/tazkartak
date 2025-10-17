import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Grid,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
} from '@mui/material';
import {
  Close,
  CreditCard,
  Payment,
  CheckCircle,
  Error,
  Info,
  QrCode,
  OpenInNew,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import {
  fetchPaymentMethods,
  initiatePayment,
  clearCurrentPayment,
  clearError,
} from '../../store/payments.slice';
import { paymentsService } from '../../services/payments.service';

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  paymentData: {
    eventId: string;
    ticketTypeId: string;
    quantity: number;
    amount: number;
    currency?: string;
    customerData: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
    };
  };
  onPaymentSuccess?: (paymentResult: any) => void;
  onPaymentError?: (error: string) => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  open,
  onClose,
  paymentData,
  onPaymentSuccess,
  onPaymentError,
}) => {
  const dispatch = useDispatch();
  const { paymentMethods, currentPayment, loading, error } = useSelector((state: RootState) => state.payments);

  const [activeStep, setActiveStep] = useState(0);
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [showPaymentUrl, setShowPaymentUrl] = useState(false);

  const steps = ['Select Payment Method', 'Review & Pay', 'Complete'];

  useEffect(() => {
    if (open && paymentMethods.length === 0) {
      dispatch(fetchPaymentMethods());
    }
  }, [open, dispatch, paymentMethods.length]);

  useEffect(() => {
    if (currentPayment) {
      setActiveStep(2);
      
      if (paymentsService.requiresRedirect(selectedMethod)) {
        setShowPaymentUrl(true);
        
        // Redirect to payment URL
        if (currentPayment.paymentUrl) {
          window.open(currentPayment.paymentUrl, '_blank');
        }
      }
    }
  }, [currentPayment, selectedMethod]);

  useEffect(() => {
    if (error) {
      onPaymentError?.(error);
    }
  }, [error, onPaymentError]);

  const handleMethodChange = (method: string) => {
    setSelectedMethod(method);
  };

  const handleNext = () => {
    if (activeStep === 0) {
      if (!selectedMethod) {
        dispatch(clearError());
        return;
      }
      setActiveStep(1);
    } else if (activeStep === 1) {
      handlePayment();
    }
  };

  const handleBack = () => {
    setActiveStep(activeStep - 1);
  };

  const handlePayment = async () => {
    if (!selectedMethod) return;

    try {
      await dispatch(initiatePayment({
        ...paymentData,
        paymentMethod: selectedMethod,
        returnUrl: `${window.location.origin}/payment/success`,
      })).unwrap();
    } catch (error) {
      console.error('Payment initiation failed:', error);
    }
  };

  const handleClose = () => {
    setActiveStep(0);
    setSelectedMethod('');
    setShowPaymentUrl(false);
    dispatch(clearCurrentPayment());
    dispatch(clearError());
    onClose();
  };

  const getPaymentMethodIcon = (method: string) => {
    return paymentsService.getPaymentMethodIcon(method);
  };

  const getPaymentInstructions = (method: string) => {
    return paymentsService.getPaymentInstructions(method);
  };

  const calculateFees = () => {
    if (!selectedMethod) return { fee: 0, total: paymentData.amount, feePercentage: 0 };
    return paymentsService.calculateFees(paymentData.amount, selectedMethod);
  };

  const fees = calculateFees();

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Choose Payment Method
            </Typography>
            <FormControl component="fieldset" fullWidth>
              <RadioGroup
                value={selectedMethod}
                onChange={(e) => handleMethodChange(e.target.value)}
              >
                {paymentMethods.map((method) => (
                  <Card key={method.code} sx={{ mb: 2 }}>
                    <CardContent sx={{ p: 2 }}>
                      <FormControlLabel
                        value={method.code}
                        control={<Radio />}
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                            <Typography variant="h6" sx={{ fontSize: '1.5rem', mr: 2 }}>
                              {getPaymentMethodIcon(method.code)}
                            </Typography>
                            <Box sx={{ flexGrow: 1 }}>
                              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                {method.name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {method.description}
                              </Typography>
                            </Box>
                            <Box>
                              {paymentsService.requiresRedirect(method.code) && (
                                <Chip label="Redirect" size="small" color="info" />
                              )}
                              {paymentsService.generatesQRCode(method.code) && (
                                <Chip label="QR Code" size="small" color="primary" />
                              )}
                            </Box>
                          </Box>
                        }
                        sx={{ width: '100%', m: 0 }}
                      />
                    </CardContent>
                  </Card>
                ))}
              </RadioGroup>
            </FormControl>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Review Payment Details
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Payment Summary
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemText 
                          primary="Event Ticket" 
                          secondary={`${paymentData.quantity} ticket(s)`}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="Subtotal" 
                          secondary={paymentsService.formatCurrency(paymentData.amount, paymentData.currency)}
                        />
                      </ListItem>
                      {fees.fee > 0 && (
                        <ListItem>
                          <ListItemText 
                            primary="Payment Fee" 
                            secondary={`${paymentsService.formatCurrency(fees.fee, paymentData.currency)} (${fees.feePercentage.toFixed(2)}%)`}
                          />
                        </ListItem>
                      )}
                      <Divider sx={{ my: 1 }} />
                      <ListItem>
                        <ListItemText 
                          primary="Total" 
                          secondary={
                            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                              {paymentsService.formatCurrency(fees.total, paymentData.currency)}
                            </Typography>
                          }
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Payment Method
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" sx={{ mr: 2 }}>
                        {getPaymentMethodIcon(selectedMethod)}
                      </Typography>
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                          {paymentsService.formatPaymentMethod(selectedMethod)}
                        </Typography>
                      </Box>
                    </Box>

                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Payment Instructions:
                    </Typography>
                    <List dense>
                      {getPaymentInstructions(selectedMethod).map((instruction, index) => (
                        <ListItem key={index} sx={{ py: 0.5 }}>
                          <ListItemIcon sx={{ minWidth: 24 }}>
                            <Typography variant="caption" sx={{ color: 'primary.main' }}>
                              {index + 1}.
                            </Typography>
                          </ListItemIcon>
                          <ListItemText 
                            primary={instruction}
                            primaryTypographyProps={{ variant: 'body2' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        );

      case 2:
        return (
          <Box sx={{ textAlign: 'center' }}>
            {currentPayment ? (
              <Box>
                <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
                <Typography variant="h5" gutterBottom>
                  Payment Initiated Successfully!
                </Typography>
                
                {paymentsService.requiresRedirect(selectedMethod) ? (
                  <Alert severity="info" sx={{ mb: 3 }}>
                    <Typography variant="body1" gutterBottom>
                      You will be redirected to complete your payment. Please complete the payment process and return to this page.
                    </Typography>
                    {currentPayment.paymentUrl && (
                      <Button
                        variant="contained"
                        startIcon={<OpenInNew />}
                        onClick={() => window.open(currentPayment.paymentUrl, '_blank')}
                        sx={{ mt: 1 }}
                      >
                        Open Payment Page
                      </Button>
                    )}
                  </Alert>
                ) : paymentsService.generatesQRCode(selectedMethod) && currentPayment.qrCodeUrl ? (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body1" gutterBottom>
                      Please use this QR code to complete your payment at any Fawry outlet:
                    </Typography>
                    <img 
                      src={currentPayment.qrCodeUrl} 
                      alt="Payment QR Code" 
                      style={{ maxWidth: '200px', margin: '16px auto', display: 'block' }}
                    />
                  </Box>
                ) : null}

                <Typography variant="body2" color="text.secondary">
                  Payment ID: {currentPayment.paymentId}
                </Typography>
                
                {currentPayment.expiresAt && (
                  <Typography variant="body2" color="text.secondary">
                    Expires: {new Date(currentPayment.expiresAt).toLocaleString()}
                  </Typography>
                )}
              </Box>
            ) : (
              <Box>
                <CircularProgress sx={{ mb: 2 }} />
                <Typography variant="h6">
                  Processing Payment...
                </Typography>
              </Box>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            <Payment sx={{ mr: 1, verticalAlign: 'middle' }} />
            Payment
          </Typography>
          <IconButton onClick={handleClose}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => dispatch(clearError())}>
            {error}
          </Alert>
        )}

        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {renderStepContent(activeStep)}
      </DialogContent>

      <DialogActions>
        {activeStep > 0 && activeStep < 2 && (
          <Button onClick={handleBack} disabled={loading}>
            Back
          </Button>
        )}
        
        {activeStep < 2 && (
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={loading || (activeStep === 0 && !selectedMethod)}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Processing...' : activeStep === 0 ? 'Continue' : 'Pay Now'}
          </Button>
        )}

        {activeStep === 2 && (
          <Button variant="contained" onClick={handleClose}>
            Close
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default PaymentModal;
