import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  IconButton,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Card,
  CardContent,
  Grid,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  QrCodeScanner,
  CheckCircle,
  Cancel,
  Refresh,
  Close,
  CameraAlt,
  FlashOn,
  FlashOff,
  History,
  Person,
  Event,
  LocationOn,
  AccessTime,
  Phone,
  Email,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import {
  validateQRCode,
  getQRCodeInfo,
  getScanHistory,
  clearValidationResult,
  setScannerActive,
  setIsScanning,
} from '../../store/qr.slice';
import { QRValidationResult } from '../../services/qr.service';

interface QRScannerProps {
  onScanSuccess?: (result: QRValidationResult) => void;
  onScanError?: (error: string) => void;
  autoScan?: boolean;
  showHistory?: boolean;
  eventId?: string;
}

const QRScanner: React.FC<QRScannerProps> = ({
  onScanSuccess,
  onScanError,
  autoScan = true,
  showHistory = true,
  eventId,
}) => {
  const dispatch = useDispatch();
  const { validationResult, isScanning, loading, error, scanHistory, scannerActive } = useSelector(
    (state: RootState) => state.qr
  );

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [manualQRCode, setManualQRCode] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (scannerActive && cameraEnabled) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [scannerActive, cameraEnabled]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setHasPermission(true);
        dispatch(setScannerActive(true));
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setHasPermission(false);
      dispatch(setScannerActive(false));
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    dispatch(setScannerActive(false));
  };

  const captureAndScan = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    const video = videoRef.current;

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to blob and try to detect QR code
    canvas.toBlob(async (blob) => {
      if (blob) {
        // In a real implementation, you would use a QR code detection library
        // For now, we'll simulate the process
        await handleQRCodeDetection('simulated-qr-code');
      }
    }, 'image/png');
  };

  const handleQRCodeDetection = async (qrCode: string) => {
    if (!qrCode || isScanning) return;

    dispatch(setIsScanning(true));

    try {
      // Get current location if available
      let location;
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 5000,
              maximumAge: 60000,
            });
          });
          
          location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
        } catch (geoError) {
          console.warn('Could not get location:', geoError);
        }
      }

      // Validate the QR code
      const result = await dispatch(validateQRCode({ qrCode, location })).unwrap();
      
      setShowResultDialog(true);
      
      if (result.isValid && !result.isUsed) {
        onScanSuccess?.(result);
      } else {
        onScanError?.(result.error || 'Invalid QR code');
      }
    } catch (error: any) {
      onScanError?.(error || 'Failed to validate QR code');
    } finally {
      dispatch(setIsScanning(false));
    }
  };

  const handleManualQRCode = async () => {
    if (!manualQRCode.trim()) return;

    await handleQRCodeDetection(manualQRCode.trim());
    setManualQRCode('');
    setShowManualInput(false);
  };

  const handleGetScanHistory = async () => {
    if (validationResult?.ticket?.id) {
      dispatch(getScanHistory(validationResult.ticket.id));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getValidationStatusColor = (result: QRValidationResult) => {
    if (!result.isValid) return 'error';
    if (result.isUsed) return 'warning';
    return 'success';
  };

  const getValidationStatusText = (result: QRValidationResult) => {
    if (!result.isValid) return 'Invalid';
    if (result.isUsed) return 'Already Used';
    return 'Valid';
  };

  return (
    <Box>
      {/* Camera Controls */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">QR Code Scanner</Typography>
          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={cameraEnabled}
                  onChange={(e) => setCameraEnabled(e.target.checked)}
                />
              }
              label="Camera"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={flashEnabled}
                  onChange={(e) => setFlashEnabled(e.target.checked)}
                />
              }
              label="Flash"
            />
          </Box>
        </Box>

        {hasPermission === false && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Camera access denied. Please enable camera permissions to scan QR codes.
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Camera View */}
        {cameraEnabled && hasPermission && (
          <Box sx={{ position: 'relative', mb: 2 }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                height: '300px',
                objectFit: 'cover',
                borderRadius: '8px',
              }}
            />
            
            {/* Scanning Overlay */}
            {isScanning && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  borderRadius: '8px',
                }}
              >
                <CircularProgress color="primary" />
              </Box>
            )}

            {/* Hidden canvas for capturing frames */}
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </Box>
        )}

        {/* Manual Input */}
        <Box sx={{ mb: 2 }}>
          <Button
            variant="outlined"
            startIcon={<QrCodeScanner />}
            onClick={() => setShowManualInput(!showManualInput)}
            fullWidth
          >
            {showManualInput ? 'Hide Manual Input' : 'Enter QR Code Manually'}
          </Button>
          
          {showManualInput && (
            <Box sx={{ mt: 2 }}>
              <input
                type="text"
                placeholder="Paste QR code data here..."
                value={manualQRCode}
                onChange={(e) => setManualQRCode(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
              />
              <Button
                variant="contained"
                onClick={handleManualQRCode}
                disabled={!manualQRCode.trim() || isScanning}
                sx={{ mt: 1 }}
                fullWidth
              >
                Validate QR Code
              </Button>
            </Box>
          )}
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<QrCodeScanner />}
            onClick={captureAndScan}
            disabled={!cameraEnabled || !hasPermission || isScanning}
            fullWidth
          >
            {isScanning ? 'Scanning...' : 'Scan QR Code'}
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => dispatch(clearValidationResult())}
            disabled={isScanning}
          >
            Clear
          </Button>
        </Box>
      </Paper>

      {/* Validation Result */}
      {validationResult && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Scan Result</Typography>
            <Chip
              label={getValidationStatusText(validationResult)}
              color={getValidationStatusColor(validationResult) as any}
              icon={validationResult.isValid && !validationResult.isUsed ? <CheckCircle /> : <Cancel />}
            />
          </Box>

          {validationResult.error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {validationResult.error}
            </Alert>
          )}

          {validationResult.ticket && validationResult.event && validationResult.buyer && (
            <Grid container spacing={2}>
              {/* Event Info */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      <Event sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Event Details
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemText primary="Event" secondary={validationResult.event.name} />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <AccessTime />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Date & Time" 
                          secondary={formatDate(validationResult.event.startDate)}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <LocationOn />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Venue" 
                          secondary={validationResult.event.venue?.name}
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>

              {/* Ticket & Buyer Info */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      <Person sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Ticket & Buyer
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemText 
                          primary="Ticket Type" 
                          secondary={validationResult.ticket.type}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="Price" 
                          secondary={`$${validationResult.ticket.price}`}
                        />
                      </ListItem>
                      {validationResult.ticket.seatNumber && (
                        <ListItem>
                          <ListItemText 
                            primary="Seat" 
                            secondary={validationResult.ticket.seatNumber}
                          />
                        </ListItem>
                      )}
                      <ListItem>
                        <ListItemIcon>
                          <Person />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Buyer" 
                          secondary={validationResult.buyer.name}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <Email />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Email" 
                          secondary={validationResult.buyer.email}
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Action Buttons */}
          <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
            {showHistory && validationResult.ticket && (
              <Button
                variant="outlined"
                startIcon={<History />}
                onClick={handleGetScanHistory}
                disabled={loading}
              >
                View Scan History
              </Button>
            )}
            
            <Button
              variant="contained"
              onClick={() => setShowResultDialog(true)}
            >
              View Full Details
            </Button>
          </Box>
        </Paper>
      )}

      {/* Scan History */}
      {scanHistory.length > 0 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            <History sx={{ mr: 1, verticalAlign: 'middle' }} />
            Scan History
          </Typography>
          <List>
            {scanHistory.map((scan, index) => (
              <ListItem key={index}>
                <ListItemIcon>
                  <CheckCircle color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary={formatDate(scan.scannedAt)}
                  secondary={`Scanned by: ${scan.scannedBy}`}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {/* Result Dialog */}
      <Dialog open={showResultDialog} onClose={() => setShowResultDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">QR Code Validation Result</Typography>
            <Chip
              label={validationResult ? getValidationStatusText(validationResult) : 'Unknown'}
              color={validationResult ? getValidationStatusColor(validationResult) as any : 'default'}
            />
          </Box>
        </DialogTitle>
        <DialogContent>
          {validationResult && (
            <Box>
              {validationResult.error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {validationResult.error}
                </Alert>
              )}

              {validationResult.isValid && validationResult.ticket && validationResult.event && validationResult.buyer && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Ticket Information
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    This ticket is valid for <strong>{validationResult.event.name}</strong> 
                    on {formatDate(validationResult.event.startDate)} at {validationResult.event.venue?.name}.
                  </Typography>
                  
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    <strong>Buyer:</strong> {validationResult.buyer.name} ({validationResult.buyer.email})
                  </Typography>
                  
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    <strong>Ticket Type:</strong> {validationResult.ticket.type} - ${validationResult.ticket.price}
                  </Typography>

                  {validationResult.isUsed && (
                    <Alert severity="warning" sx={{ mt: 2 }}>
                      This ticket has already been used. Check scan history for details.
                    </Alert>
                  )}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowResultDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QRScanner;
