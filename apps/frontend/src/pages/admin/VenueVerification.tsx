import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  CardMedia,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  InputAdornment,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Pagination,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Rating,
} from '@mui/material';
import {
  MoreVert,
  CheckCircle,
  Cancel,
  LocationOn,
  People,
  Event,
  Search,
  FilterList,
  Business,
  Pending,
  VerifiedUser,
  ContactMail,
  Phone,
  Language,
  Star,
  CalendarToday,
  Edit,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import {
  fetchPendingVerificationVenues,
  verifyVenue,
  setFilters,
} from '../../store/venues.slice';
import { Venue, VenueVerificationData } from '../../services/venues.service';
import RoleGuard from '../../components/common/RoleGuard';
import { UserRole } from '../../types/auth.types';

const VenueVerification: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { venues, loading, error, pagination, filters } = useSelector((state: RootState) => ({
    venues: state.venues.venues,
    loading: state.venues.loading,
    error: state.venues.error,
    pagination: state.venues.pagination,
    filters: state.venues.filters,
  }));

  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [showVerifyDialog, setShowVerifyDialog] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [verificationAction, setVerificationAction] = useState<'approve' | 'reject'>('approve');

  useEffect(() => {
    dispatch(fetchPendingVerificationVenues(filters));
  }, [dispatch, filters]);

  const handleSearch = () => {
    dispatch(setFilters({ search: searchTerm }));
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    dispatch(setFilters({ page }));
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, venueItem: Venue) => {
    setAnchorEl(event.currentTarget);
    setSelectedVenue(venueItem);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedVenue(null);
  };

  const handleVerify = (action: 'approve' | 'reject') => {
    setVerificationAction(action);
    setVerificationNotes('');
    setShowVerifyDialog(true);
    handleMenuClose();
  };

  const confirmVerification = async () => {
    if (!selectedVenue) return;

    const verificationData: VenueVerificationData = {
      isVerified: verificationAction === 'approve',
      verificationNotes: verificationNotes || undefined,
    };

    try {
      const resultAction = await dispatch(verifyVenue({ 
        id: selectedVenue.id, 
        verificationData 
      }));
      
      if (verifyVenue.fulfilled.match(resultAction)) {
        setShowVerifyDialog(false);
        setVerificationNotes('');
        // Refresh the list
        dispatch(fetchPendingVerificationVenues(filters));
      }
    } catch (err) {
      // Error is handled by Redux
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getVenueImage = (venue: Venue) => {
    if (venue.images && venue.images.length > 0) {
      return venue.images[0];
    }
    return `https://via.placeholder.com/400x200/4CAF50/ffffff?text=${encodeURIComponent(venue.name)}`;
  };

  const getDaysSinceSubmission = (dateString: string) => {
    const submitted = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - submitted.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getUrgencyColor = (days: number) => {
    if (days > 7) return 'error';
    if (days > 3) return 'warning';
    return 'success';
  };

  return (
    <RoleGuard roles={[UserRole.ADMIN]} showError>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
              Venue Verification
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Review and verify venue registrations
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/admin/venues')}
            >
              All Venues
            </Button>
            <Button
              variant="contained"
              onClick={() => navigate('/admin/venues/verified')}
            >
              Verified Venues
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Filters */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                placeholder="Search venues..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12} md={2}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<FilterList />}
                onClick={handleSearch}
              >
                Apply Filters
              </Button>
            </Grid>

            <Grid item xs={12} md={2}>
              <Button
                variant="text"
                fullWidth
                onClick={() => {
                  setSearchTerm('');
                  dispatch(setFilters({ search: undefined }));
                }}
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Pending color="warning" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {pagination.total}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Pending Review
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Business color="primary" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {venues.filter(v => getDaysSinceSubmission(v.createdAt) <= 3).length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      New This Week
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Event color="info" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {venues.reduce((sum, v) => sum + v._count.events, 0)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Events
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <People color="success" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {venues.reduce((sum, v) => sum + v.capacity, 0).toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Capacity
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Venues Grid */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <Typography>Loading venues...</Typography>
          </Box>
        ) : venues.length === 0 ? (
          <Paper sx={{ p: 6, textAlign: 'center' }}>
            <VerifiedUser sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              No pending venues
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              All venue registrations have been reviewed
            </Typography>
          </Paper>
        ) : (
          <>
            <Grid container spacing={3}>
              {venues.map((venue) => {
                const daysSince = getDaysSinceSubmission(venue.createdAt);
                return (
                  <Grid item xs={12} md={6} lg={4} key={venue.id}>
                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                      {/* Urgency Indicator */}
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          zIndex: 1,
                        }}
                      >
                        <Chip
                          label={`${daysSince} day${daysSince !== 1 ? 's' : ''}`}
                          color={getUrgencyColor(daysSince) as any}
                          size="small"
                        />
                      </Box>

                      <CardMedia
                        component="img"
                        height="200"
                        image={getVenueImage(venue)}
                        alt={venue.name}
                      />

                      <CardContent sx={{ flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Typography variant="h6" component="h3" sx={{ fontWeight: 'bold', flexGrow: 1 }}>
                            {venue.name}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuOpen(e, venue)}
                          >
                            <MoreVert />
                          </IconButton>
                        </Box>

                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {venue.description && venue.description.length > 100 
                            ? `${venue.description.substring(0, 100)}...`
                            : venue.description || 'No description provided'
                          }
                        </Typography>

                        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                          <Chip
                            label={venue.city}
                            variant="outlined"
                            size="small"
                          />
                          <Chip
                            label={`${venue.capacity.toLocaleString()} capacity`}
                            variant="outlined"
                            size="small"
                          />
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <LocationOn fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary">
                            {venue.location}
                          </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <ContactMail fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary">
                            {venue.contactEmail}
                          </Typography>
                        </Box>

                        {venue.contactPhone && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Phone fontSize="small" color="action" />
                            <Typography variant="body2" color="text.secondary">
                              {venue.contactPhone}
                            </Typography>
                          </Box>
                        )}

                        {venue.amenities && venue.amenities.length > 0 && (
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="caption" color="text.secondary">
                              Amenities: {venue.amenities.slice(0, 3).join(', ')}
                              {venue.amenities.length > 3 && ` +${venue.amenities.length - 3} more`}
                            </Typography>
                          </Box>
                        )}

                        <Divider sx={{ my: 2 }} />

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Submitted: {formatDate(venue.createdAt)}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ width: 24, height: 24 }}>
                              {venue.owner.name.charAt(0)}
                            </Avatar>
                            <Typography variant="caption" color="text.secondary">
                              {venue.owner.name}
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>

                      <CardActions sx={{ p: 2, pt: 0 }}>
                        <Button
                          size="small"
                          startIcon={<CheckCircle />}
                          color="success"
                          onClick={() => handleVerify('approve')}
                        >
                          Approve
                        </Button>
                        <Button
                          size="small"
                          startIcon={<Cancel />}
                          color="error"
                          onClick={() => handleVerify('reject')}
                        >
                          Reject
                        </Button>
                        <Button
                          size="small"
                          onClick={() => navigate(`/venues/${venue.id}`)}
                        >
                          View Details
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Pagination
                  count={pagination.totalPages}
                  page={pagination.page}
                  onChange={handlePageChange}
                  color="primary"
                  size="large"
                />
              </Box>
            )}
          </>
        )}

        {/* Context Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => handleVerify('approve')}>
            <CheckCircle sx={{ mr: 1 }} color="success" />
            Approve Venue
          </MenuItem>
          <MenuItem onClick={() => handleVerify('reject')}>
            <Cancel sx={{ mr: 1 }} color="error" />
            Reject Venue
          </MenuItem>
          <MenuItem onClick={() => navigate(`/venues/${selectedVenue?.id}`)}>
            <LocationOn sx={{ mr: 1 }} />
            View Details
          </MenuItem>
        </Menu>

        {/* Verification Dialog */}
        <Dialog open={showVerifyDialog} onClose={() => setShowVerifyDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            {verificationAction === 'approve' ? 'Approve Venue' : 'Reject Venue'}
          </DialogTitle>
          <DialogContent>
            <Typography variant="h6" gutterBottom>
              {selectedVenue?.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {selectedVenue?.location}, {selectedVenue?.city}
            </Typography>

            <TextField
              fullWidth
              multiline
              rows={4}
              label={`${verificationAction === 'approve' ? 'Approval' : 'Rejection'} Notes (Optional)`}
              value={verificationNotes}
              onChange={(e) => setVerificationNotes(e.target.value)}
              placeholder={verificationAction === 'approve' 
                ? 'Add any notes about the approval...'
                : 'Please provide a reason for rejection...'
              }
              sx={{ mb: 2 }}
            />

            {verificationAction === 'reject' && (
              <Alert severity="warning">
                <Typography variant="body2">
                  <strong>Note:</strong> Rejected venues will need to be resubmitted with corrections.
                  The venue owner will be notified of the rejection and reason.
                </Typography>
              </Alert>
            )}

            {verificationAction === 'approve' && (
              <Alert severity="success">
                <Typography variant="body2">
                  <strong>Note:</strong> Approved venues will become available for event organizers to select.
                  The venue owner will be notified of the approval.
                </Typography>
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowVerifyDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="contained"
              color={verificationAction === 'approve' ? 'success' : 'error'}
              onClick={confirmVerification}
            >
              {verificationAction === 'approve' ? 'Approve' : 'Reject'} Venue
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </RoleGuard>
  );
};

export default VenueVerification;
