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
  TextField,
  Alert,
  InputAdornment,
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
  Publish,
  Cancel,
  Visibility,
  Search,
  FilterList,
  Event,
  ConfirmationNumber,
  TrendingUp,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import {
  fetchEventsByOrganizer,
  deleteEvent,
  publishEvent,
  cancelEvent,
  setFilters,
} from '../../store/events.slice';
import { Event } from '../../services/events.service';
import RoleGuard from '../../components/common/RoleGuard';
import { UserRole } from '../../types/auth.types';

const MyEvents: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const theme = useTheme();

  const { events, loading, error, pagination, filters } = useSelector((state: RootState) => ({
    events: state.events.events,
    loading: state.events.loading,
    error: state.events.error,
    pagination: state.events.pagination,
    filters: state.events.filters,
  }));

  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [statusFilter, setStatusFilter] = useState(filters.status || '');
  const [categoryFilter, setCategoryFilter] = useState(filters.category || '');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    dispatch(fetchEventsByOrganizer(filters));
  }, [dispatch, filters]);

  const handleSearch = () => {
    dispatch(setFilters({ search: searchTerm }));
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    dispatch(setFilters({ status: status || undefined }));
  };

  const handleCategoryFilter = (category: string) => {
    setCategoryFilter(category);
    dispatch(setFilters({ category: category || undefined }));
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    dispatch(setFilters({ page }));
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, eventItem: Event) => {
    setAnchorEl(event.currentTarget);
    setSelectedEvent(eventItem);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedEvent(null);
  };

  const handleEdit = () => {
    if (selectedEvent) {
      navigate(`/organizer/events/${selectedEvent.id}/edit`);
    }
    handleMenuClose();
  };

  const handleView = () => {
    if (selectedEvent) {
      navigate(`/events/${selectedEvent.id}`);
    }
    handleMenuClose();
  };

  const handleDelete = () => {
    setShowDeleteDialog(true);
    handleMenuClose();
  };

  const handlePublish = () => {
    if (selectedEvent) {
      dispatch(publishEvent(selectedEvent.id));
    }
    handleMenuClose();
  };

  const handleCancel = () => {
    setShowCancelDialog(true);
    handleMenuClose();
  };

  const confirmDelete = () => {
    if (selectedEvent) {
      dispatch(deleteEvent(selectedEvent.id));
    }
    setShowDeleteDialog(false);
  };

  const confirmCancel = () => {
    if (selectedEvent) {
      dispatch(cancelEvent({ id: selectedEvent.id, reason: cancelReason }));
    }
    setShowCancelDialog(false);
    setCancelReason('');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED': return 'success';
      case 'DRAFT': return 'warning';
      case 'LIVE': return 'info';
      case 'COMPLETED': return 'default';
      case 'CANCELLED': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PUBLISHED': return <Publish />;
      case 'DRAFT': return <Edit />;
      case 'LIVE': return <Event />;
      case 'COMPLETED': return <ConfirmationNumber />;
      case 'CANCELLED': return <Cancel />;
      default: return <Event />;
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

  const calculateRevenue = (event: Event) => {
    return event.ticketTypes.reduce((total, type) => total + (type.sold * type.price), 0);
  };

  const calculateAttendance = (event: Event) => {
    return event.ticketTypes.reduce((total, type) => total + type.sold, 0);
  };

  return (
    <RoleGuard roles={[UserRole.ORGANIZER]} showError>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            My Events
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/organizer/events/create')}
            size="large"
          >
            Create Event
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
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search events..."
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
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => handleStatusFilter(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="">All Status</MenuItem>
                  <MenuItem value="DRAFT">Draft</MenuItem>
                  <MenuItem value="PUBLISHED">Published</MenuItem>
                  <MenuItem value="LIVE">Live</MenuItem>
                  <MenuItem value="COMPLETED">Completed</MenuItem>
                  <MenuItem value="CANCELLED">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={categoryFilter}
                  onChange={(e) => handleCategoryFilter(e.target.value)}
                  label="Category"
                >
                  <MenuItem value="">All Categories</MenuItem>
                  <MenuItem value="Technology">Technology</MenuItem>
                  <MenuItem value="Music">Music</MenuItem>
                  <MenuItem value="Sports">Sports</MenuItem>
                  <MenuItem value="Business">Business</MenuItem>
                  <MenuItem value="Education">Education</MenuItem>
                  <MenuItem value="Entertainment">Entertainment</MenuItem>
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

            <Grid item xs={12} md={2}>
              <Button
                variant="text"
                fullWidth
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('');
                  setCategoryFilter('');
                  dispatch(setFilters({ search: undefined, status: undefined, category: undefined }));
                }}
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Events Grid */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <Typography>Loading events...</Typography>
          </Box>
        ) : events.length === 0 ? (
          <Paper sx={{ p: 6, textAlign: 'center' }}>
            <Event sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              No events found
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Create your first event to start selling tickets
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => navigate('/organizer/events/create')}
            >
              Create Event
            </Button>
          </Paper>
        ) : (
          <>
            <Grid container spacing={3}>
              {events.map((event) => (
                <Grid item xs={12} md={6} lg={4} key={event.id}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    {event.imageUrl && (
                      <CardMedia
                        component="img"
                        height="200"
                        image={event.imageUrl}
                        alt={event.name}
                      />
                    )}

                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Typography variant="h6" component="h3" sx={{ fontWeight: 'bold', flexGrow: 1 }}>
                          {event.name}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, event)}
                        >
                          <MoreVert />
                        </IconButton>
                      </Box>

                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {event.description.length > 100 
                          ? `${event.description.substring(0, 100)}...`
                          : event.description
                        }
                      </Typography>

                      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                        <Chip
                          icon={getStatusIcon(event.status)}
                          label={event.status}
                          color={getStatusColor(event.status) as any}
                          size="small"
                        />
                        <Chip
                          label={event.category}
                          variant="outlined"
                          size="small"
                        />
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Date:</strong> {formatDate(event.startDate)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Capacity:</strong> {event.capacity}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <ConfirmationNumber fontSize="small" color="action" />
                          <Typography variant="body2">
                            {calculateAttendance(event)} / {event.capacity}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <TrendingUp fontSize="small" color="action" />
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            EGP {calculateRevenue(event).toLocaleString()}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>

                    <CardActions sx={{ p: 2, pt: 0 }}>
                      <Button
                        size="small"
                        onClick={() => navigate(`/organizer/events/${event.id}/edit`)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="small"
                        onClick={() => navigate(`/organizer/events/${event.id}/analytics`)}
                      >
                        Analytics
                      </Button>
                      {event.status === 'PUBLISHED' && (
                        <Button
                          size="small"
                          onClick={() => navigate(`/events/${event.id}`)}
                        >
                          View Live
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
            <Visibility sx={{ mr: 1 }} />
            View
          </MenuItem>
          <MenuItem onClick={handleEdit}>
            <Edit sx={{ mr: 1 }} />
            Edit
          </MenuItem>
          {selectedEvent?.status === 'DRAFT' && (
            <MenuItem onClick={handlePublish}>
              <Publish sx={{ mr: 1 }} />
              Publish
            </MenuItem>
          )}
          {selectedEvent?.status !== 'CANCELLED' && selectedEvent?.status !== 'COMPLETED' && (
            <MenuItem onClick={handleCancel}>
              <Cancel sx={{ mr: 1 }} />
              Cancel
            </MenuItem>
          )}
          {selectedEvent?.status === 'DRAFT' && (
            <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
              <Delete sx={{ mr: 1 }} />
              Delete
            </MenuItem>
          )}
        </Menu>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)}>
          <DialogTitle>Delete Event</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete "{selectedEvent?.name}"? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button onClick={confirmDelete} color="error" variant="contained">
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        {/* Cancel Confirmation Dialog */}
        <Dialog open={showCancelDialog} onClose={() => setShowCancelDialog(false)}>
          <DialogTitle>Cancel Event</DialogTitle>
          <DialogContent>
            <Typography sx={{ mb: 2 }}>
              Are you sure you want to cancel "{selectedEvent?.name}"?
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Reason for cancellation (optional)"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Please provide a reason for cancelling this event..."
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowCancelDialog(false)}>Cancel</Button>
            <Button onClick={confirmCancel} color="warning" variant="contained">
              Cancel Event
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </RoleGuard>
  );
};

export default MyEvents;
