import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Chip,
  Divider,
  Grid,
} from '@mui/material';
import {
  QrCode,
  Download,
  Share,
  Print,
  Refresh,
  CheckCircle,
  Cancel,
  Event,
  Person,
  AccessTime,
  LocationOn,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { generateQRCodeForEmail } from '../../store/qr.slice';
import QRCodeLib from 'qrcode';

interface QRCodeDisplayProps {
  ticketId: string;
  eventId: string;
  buyerId: string;
  ticketData?: {
    type: string;
    price: number;
    seatNumber?: string;
  };
  eventData?: {
    name: string;
    startDate: string;
    venue: {
      name: string;
      location: string;
    };
  };
  buyerData?: {
    name: string;
    email: string;
  };
  showDetails?: boolean;
  size?: number;
}

const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  ticketId,
  eventId,
  buyerId,
  ticketData,
  eventData,
  buyerData,
  showDetails = true,
  size = 200,
}) => {
  const dispatch = useDispatch();
  const { generatedQR, loading, error } = useSelector((state: RootState) => state.qr);

  const [qrCodeDataURL, setQrCodeDataURL] = useState<string>('');
  const [showFullDialog, setShowFullDialog] = useState(false);

  useEffect(() => {
    generateQRCode();
  }, [ticketId, eventId, buyerId]);

  const generateQRCode = async () => {
    try {
      // Generate QR code data
      const qrData = {
        ticketId,
        eventId,
        buyerId,
        purchaseDate: new Date().toISOString(),
        hash: generateHash(ticketId, eventId, buyerId),
      };

      const qrString = JSON.stringify(qrData);
      const dataURL = await QRCodeLib.toDataURL(qrString, {
        type: 'image/png',
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
        width: size,
      });

      setQrCodeDataURL(dataURL);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  const generateHash = (ticketId: string, eventId: string, buyerId: string): string => {
    // Simple hash for client-side (backend will do real validation)
    const data = `${ticketId}-${eventId}-${buyerId}`;
    return btoa(data).substring(0, 16);
  };

  const handleDownload = () => {
    if (qrCodeDataURL) {
      const link = document.createElement('a');
      link.download = `ticket-${ticketId}-qr.png`;
      link.href = qrCodeDataURL;
      link.click();
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow && qrCodeDataURL) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Ticket QR Code - ${eventData?.name || 'Event'}</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                text-align: center; 
                padding: 20px;
              }
              .ticket-info { 
                margin: 20px 0; 
                border: 1px solid #ccc; 
                padding: 20px; 
                border-radius: 8px;
              }
              .qr-code { 
                margin: 20px 0; 
              }
              @media print {
                body { margin: 0; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            <h1>Event Ticket</h1>
            ${eventData ? `
              <div class="ticket-info">
                <h2>${eventData.name}</h2>
                <p><strong>Date:</strong> ${new Date(eventData.startDate).toLocaleDateString()}</p>
                <p><strong>Time:</strong> ${new Date(eventData.startDate).toLocaleTimeString()}</p>
                <p><strong>Venue:</strong> ${eventData.venue.name}</p>
                <p><strong>Location:</strong> ${eventData.venue.location}</p>
              </div>
            ` : ''}
            ${ticketData ? `
              <div class="ticket-info">
                <h3>Ticket Details</h3>
                <p><strong>Type:</strong> ${ticketData.type}</p>
                <p><strong>Price:</strong> $${ticketData.price}</p>
                ${ticketData.seatNumber ? `<p><strong>Seat:</strong> ${ticketData.seatNumber}</p>` : ''}
              </div>
            ` : ''}
            ${buyerData ? `
              <div class="ticket-info">
                <h3>Buyer Information</h3>
                <p><strong>Name:</strong> ${buyerData.name}</p>
                <p><strong>Email:</strong> ${buyerData.email}</p>
              </div>
            ` : ''}
            <div class="qr-code">
              <img src="${qrCodeDataURL}" alt="QR Code" style="max-width: 300px;" />
              <p>Scan this QR code at the event entrance</p>
            </div>
            <p class="no-print">Ticket ID: ${ticketId}</p>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleShare = async () => {
    if (navigator.share && qrCodeDataURL) {
      try {
        // Convert data URL to blob
        const response = await fetch(qrCodeDataURL);
        const blob = await response.blob();
        const file = new File([blob], `ticket-${ticketId}-qr.png`, { type: 'image/png' });

        await navigator.share({
          title: `Ticket for ${eventData?.name || 'Event'}`,
          text: `Here's my ticket QR code for ${eventData?.name || 'the event'}`,
          files: [file],
        });
      } catch (error) {
        console.error('Error sharing:', error);
        // Fallback to copying to clipboard
        handleCopyToClipboard();
      }
    } else {
      handleCopyToClipboard();
    }
  };

  const handleCopyToClipboard = () => {
    if (qrCodeDataURL) {
      navigator.clipboard.writeText(qrCodeDataURL).then(() => {
        // You could show a toast notification here
        console.log('QR code data copied to clipboard');
      });
    }
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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: size }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ maxWidth: size }}>
        Failed to generate QR code: {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Paper sx={{ p: 2, textAlign: 'center', maxWidth: size + 40 }}>
        {/* QR Code */}
        {qrCodeDataURL && (
          <Box sx={{ mb: 2 }}>
            <img
              src={qrCodeDataURL}
              alt="Ticket QR Code"
              style={{
                width: size,
                height: size,
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
              }}
            />
          </Box>
        )}

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mb: 2 }}>
          <IconButton onClick={generateQRCode} size="small" title="Refresh QR Code">
            <Refresh />
          </IconButton>
          <IconButton onClick={handleDownload} size="small" title="Download QR Code">
            <Download />
          </IconButton>
          <IconButton onClick={handlePrint} size="small" title="Print Ticket">
            <Print />
          </IconButton>
          <IconButton onClick={handleShare} size="small" title="Share QR Code">
            <Share />
          </IconButton>
          {showDetails && (
            <IconButton onClick={() => setShowFullDialog(true)} size="small" title="View Details">
              <QrCode />
            </IconButton>
          )}
        </Box>

        {/* Ticket Info */}
        {showDetails && (
          <Box sx={{ textAlign: 'left' }}>
            {eventData && (
              <Box sx={{ mb: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Event
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  {eventData.name}
                </Typography>
              </Box>
            )}

            {ticketData && (
              <Box sx={{ mb: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Ticket Type
                </Typography>
                <Typography variant="body2">
                  {ticketData.type} - ${ticketData.price}
                </Typography>
              </Box>
            )}

            {ticketData?.seatNumber && (
              <Box sx={{ mb: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Seat
                </Typography>
                <Typography variant="body2">
                  {ticketData.seatNumber}
                </Typography>
              </Box>
            )}

            <Typography variant="caption" color="text.secondary">
              Ticket ID: {ticketId.substring(0, 8)}...
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Full Details Dialog */}
      <Dialog open={showFullDialog} onClose={() => setShowFullDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <QrCode />
            <Typography variant="h6">Ticket Details</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3}>
            {/* QR Code */}
            <Grid item xs={12} md={6}>
              <Box sx={{ textAlign: 'center' }}>
                {qrCodeDataURL && (
                  <img
                    src={qrCodeDataURL}
                    alt="Ticket QR Code"
                    style={{
                      width: '100%',
                      maxWidth: 200,
                      border: '1px solid #e0e0e0',
                      borderRadius: '8px',
                    }}
                  />
                )}
                <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                  Scan at event entrance
                </Typography>
              </Box>
            </Grid>

            {/* Ticket Information */}
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <Event sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Event Information
                  </Typography>
                  
                  {eventData ? (
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1 }}>
                        {eventData.name}
                      </Typography>
                      <Box sx={{ mb: 1 }}>
                        <AccessTime sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                        <Typography variant="body2" component="span">
                          {formatDate(eventData.startDate)}
                        </Typography>
                      </Box>
                      <Box sx={{ mb: 1 }}>
                        <LocationOn sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                        <Typography variant="body2" component="span">
                          {eventData.venue.name}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {eventData.venue.location}
                      </Typography>
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Event information not available
                    </Typography>
                  )}

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="h6" gutterBottom>
                    <Person sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Ticket Details
                  </Typography>
                  
                  {ticketData ? (
                    <Box>
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Type
                        </Typography>
                        <Typography variant="body1">
                          {ticketData.type}
                        </Typography>
                      </Box>
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Price
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                          ${ticketData.price}
                        </Typography>
                      </Box>
                      {ticketData.seatNumber && (
                        <Box sx={{ mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            Seat Number
                          </Typography>
                          <Typography variant="body1">
                            {ticketData.seatNumber}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Ticket details not available
                    </Typography>
                  )}

                  <Divider sx={{ my: 2 }} />

                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Ticket ID
                    </Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {ticketId}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowFullDialog(false)}>
            Close
          </Button>
          <Button variant="contained" onClick={handlePrint}>
            Print Ticket
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QRCodeDisplay;
