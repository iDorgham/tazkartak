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
  useTheme,
} from '@mui/material';
import {
  Add,
  MoreVert,
  Edit,
  Delete,
  LocationOn,
  People,
  Event,
  Search,
  FilterList,
  Business,
  CheckCircle,
  Pending,
  Cancel,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import {
  fetchVenuesByOwner,
  deleteVenue,
  setFilters,
} from '../../store/venues.slice';
import { Venue } from '../../services/venues.service';
import RoleGuard from '../../components/common/RoleGuard';
import { UserRole } from '../../types/auth.types';

const MyVenues: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const theme = useTheme();

  const { venues, loading, error, pagination, filters } = useSelector((state: RootState) => ({
    venues: state.venues.venues,
    loading: state.venues.loading,
    error: state.venues.error,
    pagination: state.venues.pagination,
    filters: state.venues.filters,
  }));

  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [statusFilter, setStatusFilter] = useState(filters.status || '');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    dispatch(fetchVenuesByOwner(filters));
  }, [dispatch, filters]);

  const handleSearch = () => {
    dispatch(setFilters({ search: searchTerm }));
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    dispatch(setFilters({ status: status || undefined }));
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

  const handleEdit = () => {
    if (selectedVenue) {
      navigate(`/venue/venues/${selectedVenue.id}/edit`);
    }
    handleMenuClose();
  };

  const handleView = () => {
    if (selectedVenue) {
      navigate(`/venues/${selectedVenue.id}`);
    }
    handleMenuClose();
  };

  const handleDelete = () => {
    setShowDeleteDialog(true);
    handleMenuClose();
  };

  const confirmDelete = () => {
    if (selectedVenue) {
      dispatch(deleteVenue(selectedVenue.id));
    }
    setShowDeleteDialog(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'VERIFIED': return 'success';
      case 'PENDING_VERIFICATION': return 'warning';
      case 'REJECTED': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'VERIFIED': return <CheckCircle />;
      case 'PENDING_VERIFICATION': return <Pending />;
      case 'REJECTED': return <Cancel />;
      default: return <Business />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'VERIFIED': return 'Verified';
      case 'PENDING_VERIFICATION': return 'Pending Review';
      case 'REJECTED': return 'Rejected';
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getVenueImage = (venue: Venue) => {
    if (venue.images && venue.images.length > 0) {
      return venue.images[0];
    }
    return `https://via.placeholder.com/400x200/4CAF50/ffffff?text=${encodeURIComponent(venue.name)}`;
  };

  return (
    <RoleGuard roles={[UserRole.VENUE_OWNER]} showError>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            My Venues
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/venue/venues/create')}
            size="large"
          >
            Register New Venue
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Filters */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
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

            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => handleStatusFilter(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="">All Status</MenuItem>
                  <MenuItem value="PENDING_VERIFICATION">Pending Review</MenuItem>
                  <MenuItem value="VERIFIED">Verified</MenuItem>
                  <MenuItem value="REJECTED">Rejected</MenuItem>
                </Select>
              </FormControl>
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

            <Grid item xs={12} md={1}>
              <Button
                variant="text"
                fullWidth
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('');
                  dispatch(setFilters({ search: undefined, status: undefined }));
                }}
              >
                Clear
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Venues Grid */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <Typography>Loading venues...</Typography>
          </Box>
        ) : venues.length === 0 ? (
          <Paper sx={{ p: 6, textAlign: 'center' }}>
            <Business sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              No venues found
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Register your first venue to start hosting events
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => navigate('/venue/venues/create')}
            >
              Register Venue
            </Button>
          </Paper>
        ) : (
          <>
            <Grid container spacing={3}>
              {venues.map((venue) => (
                <Grid item xs={12} md={6} lg={4} key={venue.id}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
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
                          icon={getStatusIcon(venue.status)}
                          label={getStatusText(venue.status)}
                          color={getStatusColor(venue.status) as any}
                          size="small"
                        />
                        <Chip
                          label={venue.city}
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
                        <People fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          Capacity: {venue.capacity.toLocaleString()}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Event fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {venue._count.events} event{venue._count.events !== 1 ? 's' : ''}
                        </Typography>
                      </Box>

                      {venue.amenities && venue.amenities.length > 0 && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="caption" color="text.secondary">
                            Amenities: {venue.amenities.slice(0, 3).join(', ')}
                            {venue.amenities.length > 3 && ` +${venue.amenities.length - 3} more`}
                          </Typography>
                        </Box>
                      )}

                      <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="caption" color="text.secondary">
                          Registered: {formatDate(venue.createdAt)}
                        </Typography>
                        {venue.verifiedAt && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            Verified: {formatDate(venue.verifiedAt.toString())}
                          </Typography>
                        )}
                      </Box>
                    </CardContent>

                    <CardActions sx={{ p: 2, pt: 0 }}>
                      <Button
                        size="small"
                        onClick={() => navigate(`/venue/venues/${venue.id}/edit`)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="small"
                        onClick={() => navigate(`/venue/venues/${venue.id}/analytics`)}
                      >
                        Analytics
                      </Button>
                      {venue.status === 'VERIFIED' && (
                        <Button
                          size="small"
                          onClick={() => navigate(`/venues/${venue.id}`)}
                        >
                          View Public
                        </Button>
                      )}
                    </CardActions>
                  </Card>
                </Grid>
              ))}
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
          <MenuItem onClick={handleView}>
            <LocationOn sx={{ mr: 1 }} />
            View Details
          </MenuItem>
          <MenuItem onClick={handleEdit}>
            <Edit sx={{ mr: 1 }} />
            Edit Venue
          </MenuItem>
          {selectedVenue?.status === 'PENDING_VERIFICATION' && (
            <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
              <Delete sx={{ mr: 1 }} />
              Delete
            </MenuItem>
          )}
        </Menu>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)}>
          <DialogTitle>Delete Venue</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete "{selectedVenue?.name}"? This action cannot be undone.
            </Typography>
            {selectedVenue?._count.events > 0 && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                This venue has {selectedVenue._count.events} associated event{selectedVenue._count.events !== 1 ? 's' : ''}. 
                You cannot delete it until all events are completed or cancelled.
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button 
              onClick={confirmDelete} 
              color="error" 
              variant="contained"
              disabled={selectedVenue?._count.events > 0}
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </RoleGuard>
  );
};

export default MyVenues;
