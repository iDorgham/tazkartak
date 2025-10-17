import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from '@mui/material';
import {
  Event,
  Person,
  CreditCard,
  QrCode,
  Download,
  Email,
  CheckCircle,
  LocationOn,
  AccessTime,
  ConfirmationNumber,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { generateQRCodeForEmail } from '../../store/qr.slice';
import QRCodeDisplay from '../qr/QRCodeDisplay';
import PaymentModal from '../payment/PaymentModal';
import { Event as EventType } from '../../services/events.service';

interface TicketPurchaseProps {
  event: EventType;
  onPurchase: (ticketData: {
    ticketType: string;
    quantity: number;
    buyerInfo: {
      name: string;
      email: string;
      phone?: string;
    };
  }) => Promise<void>;
}

const TicketPurchase: React.FC<TicketPurchaseProps> = ({ event, onPurchase }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const { generatedQR, loading } = useSelector((state: RootState) => state.qr);

  const [selectedTicketType, setSelectedTicketType] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [buyerName, setBuyerName] = useState(user?.name || '');
  const [buyerEmail, setBuyerEmail] = useState(user?.email || '');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [purchasedTicketId, setPurchasedTicketId] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const ticketTypes = event.ticketTypes || [];
  const selectedType = ticketTypes.find(type => type.name === selectedTicketType);

  const calculateTotal = () => {
    if (!selectedType) return 0;
    return selectedType.price * quantity;
  };

  const handlePurchase = () => {
    if (!selectedTicketType || !buyerName || !buyerEmail) {
      return;
    }

    // Open payment modal instead of directly processing
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = (paymentResult: any) => {
    // Simulate ticket creation (in real app, this would come from the purchase response)
    const mockTicketId = `ticket_${Date.now()}`;
    setPurchasedTicketId(mockTicketId);
    setPurchaseSuccess(true);
    setShowQRDialog(true);

    // Generate QR code for the purchased ticket
    dispatch(generateQRCodeForEmail(mockTicketId));

    // Call the original onPurchase callback
    onPurchase({
      ticketType: selectedTicketType,
      quantity,
      buyerInfo: {
        name: buyerName,
        email: buyerEmail,
        phone: buyerPhone,
      },
    });
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment failed:', error);
    // Handle payment error
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getAvailableQuantity = () => {
    if (!selectedType) return 0;
    return selectedType.quantity - selectedType.sold;
  };

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Event Information */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                <Event sx={{ mr: 1, verticalAlign: 'middle' }} />
                {event.name}
              </Typography>

              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <AccessTime sx={{ mr: 1, fontSize: 20 }} />
                  <Typography variant="body1">
                    {formatDate(event.startDate)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <LocationOn sx={{ mr: 1, fontSize: 20 }} />
                  <Typography variant="body1">
                    {event.venue?.name} - {event.venue?.location}
                  </Typography>
                </Box>
              </Box>

              <Typography variant="body1" sx={{ mb: 3 }}>
                {event.description}
              </Typography>

              {/* Ticket Types */}
              <Typography variant="h6" gutterBottom>
                Available Ticket Types
              </Typography>
              <List>
                {ticketTypes.map((ticketType, index) => (
                  <ListItem key={index} sx={{ border: '1px solid #e0e0e0', borderRadius: 1, mb: 1 }}>
                    <ListItemIcon>
                      <ConfirmationNumber />
                    </ListItemIcon>
                    <ListItemText
                      primary={ticketType.name}
                      secondary={
                        <Box>
                          <Typography variant="body2">
                            Price: ${ticketType.price}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Available: {ticketType.quantity - ticketType.sold} / {ticketType.quantity}
                          </Typography>
                          {ticketType.description && (
                            <Typography variant="body2" color="text.secondary">
                              {ticketType.description}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Purchase Form */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, position: 'sticky', top: 20 }}>
            <Typography variant="h6" gutterBottom>
              Purchase Tickets
            </Typography>

            {/* Ticket Type Selection */}
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Ticket Type</InputLabel>
              <Select
                value={selectedTicketType}
                onChange={(e) => setSelectedTicketType(e.target.value)}
                label="Ticket Type"
              >
                {ticketTypes.map((ticketType, index) => (
                  <MenuItem key={index} value={ticketType.name}>
                    <Box>
                      <Typography variant="body1">{ticketType.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        ${ticketType.price} - {ticketType.quantity - ticketType.sold} available
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Quantity Selection */}
            {selectedTicketType && (
              <TextField
                fullWidth
                type="number"
                label="Quantity"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                inputProps={{ min: 1, max: getAvailableQuantity() }}
                sx={{ mb: 2 }}
                helperText={`Maximum ${getAvailableQuantity()} tickets available`}
              />
            )}

            {/* Buyer Information */}
            <Typography variant="subtitle1" sx={{ mt: 3, mb: 2 }}>
              <Person sx={{ mr: 1, verticalAlign: 'middle' }} />
              Buyer Information
            </Typography>

            <TextField
              fullWidth
              label="Full Name"
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              sx={{ mb: 2 }}
              required
            />

            <TextField
              fullWidth
              label="Email"
              type="email"
              value={buyerEmail}
              onChange={(e) => setBuyerEmail(e.target.value)}
              sx={{ mb: 2 }}
              required
            />

            <TextField
              fullWidth
              label="Phone Number (Optional)"
              value={buyerPhone}
              onChange={(e) => setBuyerPhone(e.target.value)}
              sx={{ mb: 2 }}
            />

            {/* Payment Method */}
            <Typography variant="subtitle1" sx={{ mt: 3, mb: 2 }}>
              <CreditCard sx={{ mr: 1, verticalAlign: 'middle' }} />
              Payment Method
            </Typography>

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Payment Method</InputLabel>
              <Select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                label="Payment Method"
              >
                <MenuItem value="card">Credit/Debit Card</MenuItem>
                <MenuItem value="paymob">PayMob</MenuItem>
                <MenuItem value="fawry">Fawry</MenuItem>
              </Select>
            </FormControl>

            {/* Order Summary */}
            {selectedType && (
              <Box sx={{ mb: 3, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Order Summary
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">
                    {selectedType.name} x {quantity}
                  </Typography>
                  <Typography variant="body2">
                    ${(selectedType.price * quantity).toFixed(2)}
                  </Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    Total
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    ${calculateTotal().toFixed(2)}
                  </Typography>
                </Box>
              </Box>
            )}

            {/* Purchase Button */}
            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={handlePurchase}
              disabled={
                !selectedTicketType ||
                !buyerName ||
                !buyerEmail ||
                isProcessing ||
                getAvailableQuantity() < quantity
              }
              startIcon={isProcessing ? <CircularProgress size={20} /> : <CreditCard />}
            >
              {isProcessing ? 'Processing...' : `Purchase for $${calculateTotal().toFixed(2)}`}
            </Button>

            {purchaseSuccess && (
              <Alert severity="success" sx={{ mt: 2 }}>
                <CheckCircle sx={{ mr: 1 }} />
                Purchase successful! Your QR code is ready.
              </Alert>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* QR Code Dialog */}
      <Dialog open={showQRDialog} onClose={() => setShowQRDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              <QrCode sx={{ mr: 1, verticalAlign: 'middle' }} />
              Your Ticket QR Code
            </Typography>
            <IconButton onClick={() => setShowQRDialog(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="success" sx={{ mb: 3 }}>
            <CheckCircle sx={{ mr: 1 }} />
            Your ticket has been purchased successfully! Present this QR code at the event entrance.
          </Alert>

          {purchasedTicketId && (
            <Box sx={{ textAlign: 'center' }}>
              <QRCodeDisplay
                ticketId={purchasedTicketId}
                eventId={event.id}
                buyerId={user?.id || buyerEmail}
                ticketData={{
                  type: selectedTicketType,
                  price: selectedType?.price || 0,
                }}
                eventData={{
                  name: event.name,
                  startDate: event.startDate,
                  venue: {
                    name: event.venue?.name || '',
                    location: event.venue?.location || '',
                  },
                }}
                buyerData={{
                  name: buyerName,
                  email: buyerEmail,
                }}
                showDetails={true}
                size={250}
              />
            </Box>
          )}

          <Box sx={{ mt: 3, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary">
              <strong>Important:</strong> Please save or print this QR code. You'll need to show it at the event entrance.
              A confirmation email with your ticket details has been sent to {buyerEmail}.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowQRDialog(false)}>
            Close
          </Button>
          <Button variant="contained" startIcon={<Email />}>
            Resend Email
          </Button>
        </DialogActions>
      </Dialog>

      {/* Payment Modal */}
      <PaymentModal
        open={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        paymentData={{
          eventId: event.id,
          ticketTypeId: selectedTicketType,
          quantity,
          amount: calculateTotal(),
          currency: 'EGP',
          customerData: {
            firstName: buyerName.split(' ')[0] || '',
            lastName: buyerName.split(' ').slice(1).join(' ') || '',
            email: buyerEmail,
            phone: buyerPhone,
          },
        }}
        onPaymentSuccess={handlePaymentSuccess}
        onPaymentError={handlePaymentError}
      />
    </Box>
  );
};

export default TicketPurchase;
