import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
} from '@mui/material';
import {
  QrCodeScanner,
  Event,
  People,
  CheckCircle,
  Cancel,
  Refresh,
  Download,
  Upload,
  History,
  Analytics,
  FilterList,
  Search,
  Clear,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import {
  getQRStats,
  bulkValidateQRCodes,
  clearError,
  clearValidationResult,
} from '../../store/qr.slice';
import { fetchEvents } from '../../store/events.slice';
import QRScanner from '../../components/qr/QRScanner';
import RoleGuard from '../../components/common/RoleGuard';
import { UserRole } from '../../types/auth.types';
import { QRValidationResult } from '../../services/qr.service';

const QRScannerPage: React.FC = () => {
  const navigate = useNavigate();
  const { eventId } = useParams<{ eventId?: string }>();
  const dispatch = useDispatch();

  const { user } = useSelector((state: RootState) => state.auth);
  const { events } = useSelector((state: RootState) => state.events);
  const { qrStats, loading, error } = useSelector((state: RootState) => state.qr);

  const [selectedEventId, setSelectedEventId] = useState<string>(eventId || '');
  const [bulkQRCodes, setBulkQRCodes] = useState<string[]>([]);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [bulkResults, setBulkResults] = useState<any>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Get organizer's events
  const organizerEvents = events.filter(event => event.organizerId === user?.id);

  useEffect(() => {
    if (selectedEventId) {
      dispatch(getQRStats(selectedEventId));
    }
  }, [dispatch, selectedEventId]);

  useEffect(() => {
    if (!events.length) {
      dispatch(fetchEvents({ organizerId: user?.id }));
    }
  }, [dispatch, events.length, user?.id]);

  const handleEventChange = (eventId: string) => {
    setSelectedEventId(eventId);
    dispatch(clearError());
    dispatch(clearValidationResult());
  };

  const handleBulkValidation = async () => {
    if (bulkQRCodes.length === 0) return;

    try {
      const result = await dispatch(bulkValidateQRCodes(bulkQRCodes)).unwrap();
      setBulkResults(result);
      setBulkQRCodes([]);
    } catch (error) {
      console.error('Bulk validation failed:', error);
    }
  };

  const handleScanSuccess = (result: QRValidationResult) => {
    // Refresh stats after successful scan
    if (selectedEventId) {
      dispatch(getQRStats(selectedEventId));
    }
  };

  const handleScanError = (error: string) => {
    console.error('Scan error:', error);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (isValid: boolean, isUsed: boolean) => {
    if (!isValid) return 'error';
    if (isUsed) return 'warning';
    return 'success';
  };

  const getStatusText = (isValid: boolean, isUsed: boolean) => {
    if (!isValid) return 'Invalid';
    if (isUsed) return 'Used';
    return 'Valid';
  };

  const selectedEvent = events.find(event => event.id === selectedEventId);

  return (
    <RoleGuard roles={[UserRole.ORGANIZER, UserRole.ADMIN]} showError>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
              QR Code Scanner
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Scan and validate tickets for your events
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<Analytics />}
              onClick={() => navigate('/organizer/analytics')}
            >
              Analytics
            </Button>
            <Button
              variant="contained"
              startIcon={<Upload />}
              onClick={() => setShowBulkDialog(true)}
            >
              Bulk Validate
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => dispatch(clearError())}>
            {error}
          </Alert>
        )}

        {/* Event Selection */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Select Event
          </Typography>
          <FormControl fullWidth>
            <InputLabel>Choose an event</InputLabel>
            <Select
              value={selectedEventId}
              onChange={(e) => handleEventChange(e.target.value)}
              label="Choose an event"
            >
              {organizerEvents.map((event) => (
                <MenuItem key={event.id} value={event.id}>
                  <Box>
                    <Typography variant="body1">{event.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(event.startDate)} - {event.status}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Paper>

        {selectedEventId && selectedEvent && (
          <>
            {/* Event Info & Stats */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} md={8}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      <Event sx={{ mr: 1, verticalAlign: 'middle' }} />
                      {selectedEvent.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {formatDate(selectedEvent.startDate)} - {selectedEvent.venue?.name}
                    </Typography>
                    <Chip
                      label={selectedEvent.status}
                      color={selectedEvent.status === 'LIVE' ? 'success' : 'default'}
                      sx={{ mb: 2 }}
                    />
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                {qrStats && (
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        <People sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Ticket Stats
                      </Typography>
                      <List dense>
                        <ListItem>
                          <ListItemText 
                            primary="Total Tickets" 
                            secondary={qrStats.totalTickets}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemText 
                            primary="Scanned" 
                            secondary={`${qrStats.scannedTickets} (${qrStats.scanRate.toFixed(1)}%)`}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemText 
                            primary="Pending" 
                            secondary={qrStats.pendingTickets}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemText 
                            primary="Invalid" 
                            secondary={qrStats.invalidTickets}
                          />
                        </ListItem>
                      </List>
                    </CardContent>
                  </Card>
                )}
              </Grid>
            </Grid>

            {/* QR Scanner */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                <QrCodeScanner sx={{ mr: 1, verticalAlign: 'middle' }} />
                Ticket Scanner
              </Typography>
              <QRScanner
                onScanSuccess={handleScanSuccess}
                onScanError={handleScanError}
                showHistory={true}
                eventId={selectedEventId}
              />
            </Paper>
          </>
        )}

        {!selectedEventId && (
          <Paper sx={{ p: 6, textAlign: 'center' }}>
            <QrCodeScanner sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Select an event to start scanning
            </Typography>
            <Typography color="text.secondary">
              Choose an event from the dropdown above to begin scanning QR codes
            </Typography>
          </Paper>
        )}

        {/* Bulk Validation Dialog */}
        <Dialog open={showBulkDialog} onClose={() => setShowBulkDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Bulk QR Code Validation</Typography>
              <IconButton onClick={() => setShowBulkDialog(false)}>
                <Clear />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Enter multiple QR codes (one per line) to validate them in bulk.
            </Typography>
            
            <TextField
              multiline
              rows={8}
              fullWidth
              placeholder="Paste QR code data here, one per line..."
              value={bulkQRCodes.join('\n')}
              onChange={(e) => setBulkQRCodes(e.target.value.split('\n').filter(code => code.trim()))}
              sx={{ mb: 2 }}
            />

            <Typography variant="caption" color="text.secondary">
              {bulkQRCodes.length} QR codes ready for validation
            </Typography>

            {bulkResults && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Validation Results
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Card>
                      <CardContent sx={{ textAlign: 'center' }}>
                        <CheckCircle color="success" sx={{ fontSize: 40, mb: 1 }} />
                        <Typography variant="h4">{bulkResults.valid.length}</Typography>
                        <Typography variant="body2">Valid</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={4}>
                    <Card>
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Cancel color="error" sx={{ fontSize: 40, mb: 1 }} />
                        <Typography variant="h4">{bulkResults.invalid.length}</Typography>
                        <Typography variant="body2">Invalid</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={4}>
                    <Card>
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Typography variant="h4">{bulkResults.valid.length + bulkResults.invalid.length}</Typography>
                        <Typography variant="body2">Total</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                {/* Results Table */}
                <TableContainer sx={{ mt: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Status</TableCell>
                        <TableCell>Ticket ID</TableCell>
                        <TableCell>Buyer</TableCell>
                        <TableCell>Event</TableCell>
                        <TableCell>Error</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {[...bulkResults.valid, ...bulkResults.invalid].map((result, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Chip
                              label={getStatusText(result.isValid, result.isUsed)}
                              color={getStatusColor(result.isValid, result.isUsed) as any}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{result.ticket?.id || 'N/A'}</TableCell>
                          <TableCell>{result.buyer?.name || 'N/A'}</TableCell>
                          <TableCell>{result.event?.name || 'N/A'}</TableCell>
                          <TableCell>{result.error || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowBulkDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleBulkValidation}
              disabled={bulkQRCodes.length === 0 || loading}
            >
              Validate QR Codes
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </RoleGuard>
  );
};

export default QRScannerPage;
