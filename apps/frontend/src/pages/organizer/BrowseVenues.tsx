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
  CardMedia,
  Chip,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
  Rating,
  IconButton,
  Alert,
} from '@mui/material';
import {
  Search,
  FilterList,
  LocationOn,
  People,
  Business,
  CheckCircle,
  Star,
  ContactMail,
  Phone,
  Language,
  CalendarToday,
  Event,
  Map,
  Directions,
  Favorite,
  Share,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import {
  fetchVerifiedVenues,
  setFilters,
} from '../../store/venues.slice';
import { Venue } from '../../services/venues.service';
import RoleGuard from '../../components/common/RoleGuard';
import { UserRole } from '../../types/auth.types';

const BrowseVenues: React.FC = () => {
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
  const [selectedCity, setSelectedCity] = useState(filters.city || '');
  const [minCapacity, setMinCapacity] = useState(filters.minCapacity || '');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(filters.amenities || []);
  const [sortBy, setSortBy] = useState(filters.sortBy || 'name');
  const [sortOrder, setSortOrder] = useState(filters.sortOrder || 'asc');
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [showVenueDialog, setShowVenueDialog] = useState(false);

  const cities = ['Cairo', 'Alexandria', 'Giza', 'Shubra El Kheima', 'Port Said', 'Suez', 'Luxor', 'Mansoura', 'El Mahalla El Kubra', 'Tanta'];
  const amenities = [
    'Parking', 'WiFi', 'Air Conditioning', 'Sound System', 'Lighting', 'Stage', 
    'Catering', 'Security', 'Accessibility', 'Outdoor Space', 'Kitchen', 'Bar'
  ];

  useEffect(() => {
    dispatch(fetchVerifiedVenues(filters));
  }, [dispatch, filters]);

  const handleSearch = () => {
    dispatch(setFilters({ 
      search: searchTerm,
      city: selectedCity,
      minCapacity: minCapacity ? parseInt(minCapacity) : undefined,
      amenities: selectedAmenities.length > 0 ? selectedAmenities : undefined,
      sortBy: sortBy as any,
      sortOrder: sortOrder as any,
    }));
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCity('');
    setMinCapacity('');
    setSelectedAmenities([]);
    setSortBy('name');
    setSortOrder('asc');
    dispatch(setFilters({}));
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    dispatch(setFilters({ page }));
  };

  const handleVenueSelect = (venue: Venue) => {
    setSelectedVenue(venue);
    setShowVenueDialog(true);
  };

  const handleCreateEvent = () => {
    if (selectedVenue) {
      navigate(`/organizer/create-event?venue=${selectedVenue.id}`);
    }
  };

  const getVenueImage = (venue: Venue) => {
    if (venue.images && venue.images.length > 0) {
      return venue.images[0];
    }
    return `https://via.placeholder.com/400x200/4CAF50/ffffff?text=${encodeURIComponent(venue.name)}`;
  };

  const formatCapacity = (capacity: number) => {
    if (capacity >= 1000) {
      return `${(capacity / 1000).toFixed(1)}K`;
    }
    return capacity.toString();
  };

  const getVenueRating = (venue: Venue) => {
    // Mock rating - in real app this would come from reviews
    return 4.2 + (Math.random() * 0.8);
  };

  return (
    <RoleGuard roles={[UserRole.ORGANIZER]} showError>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
              Browse Venues
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Find the perfect venue for your next event
            </Typography>
          </Box>
          <Button
            variant="contained"
            onClick={() => navigate('/organizer/create-event')}
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
            <Grid item xs={12} md={3}>
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
              <FormControl fullWidth>
                <InputLabel>City</InputLabel>
                <Select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  label="City"
                >
                  <MenuItem value="">All Cities</MenuItem>
                  {cities.map((city) => (
                    <MenuItem key={city} value={city}>
                      {city}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="Min Capacity"
                type="number"
                value={minCapacity}
                onChange={(e) => setMinCapacity(e.target.value)}
                placeholder="e.g., 100"
              />
            </Grid>

            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  label="Sort By"
                >
                  <MenuItem value="name">Name</MenuItem>
                  <MenuItem value="capacity">Capacity</MenuItem>
                  <MenuItem value="createdAt">Date Added</MenuItem>
                  <MenuItem value="rating">Rating</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Order</InputLabel>
                <Select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  label="Order"
                >
                  <MenuItem value="asc">Ascending</MenuItem>
                  <MenuItem value="desc">Descending</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={1}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<FilterList />}
                onClick={handleSearch}
              >
                Filter
              </Button>
            </Grid>
          </Grid>

          {/* Amenities Filter */}
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Amenities
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {amenities.map((amenity) => (
                <Chip
                  key={amenity}
                  label={amenity}
                  variant={selectedAmenities.includes(amenity) ? 'filled' : 'outlined'}
                  onClick={() => {
                    if (selectedAmenities.includes(amenity)) {
                      setSelectedAmenities(selectedAmenities.filter(a => a !== amenity));
                    } else {
                      setSelectedAmenities([...selectedAmenities, amenity]);
                    }
                  }}
                />
              ))}
            </Box>
          </Box>

          <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
            <Button variant="text" onClick={handleClearFilters}>
              Clear Filters
            </Button>
          </Box>
        </Paper>

        {/* Results Summary */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            {pagination.total} venues found
          </Typography>
        </Box>

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
              Try adjusting your search criteria or browse all venues
            </Typography>
            <Button variant="outlined" onClick={handleClearFilters}>
              Clear Filters
            </Button>
          </Paper>
        ) : (
          <>
            <Grid container spacing={3}>
              {venues.map((venue) => (
                <Grid item xs={12} md={6} lg={4} key={venue.id}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', cursor: 'pointer' }} onClick={() => handleVenueSelect(venue)}>
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
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Rating value={getVenueRating(venue)} precision={0.1} size="small" readOnly />
                          <Typography variant="body2" color="text.secondary">
                            {getVenueRating(venue).toFixed(1)}
                          </Typography>
                        </Box>
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
                          icon={<LocationOn />}
                        />
                        <Chip
                          label={`${formatCapacity(venue.capacity)} capacity`}
                          variant="outlined"
                          size="small"
                          icon={<People />}
                        />
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <LocationOn fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {venue.location}
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

                      <Divider sx={{ my: 2 }} />

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            {venue._count.events} events hosted
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

        {/* Venue Detail Dialog */}
        <Dialog open={showVenueDialog} onClose={() => setShowVenueDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h5">{selectedVenue?.name}</Typography>
              <Box>
                <IconButton>
                  <Share />
                </IconButton>
                <IconButton>
                  <Favorite />
                </IconButton>
              </Box>
            </Box>
          </DialogTitle>
          <DialogContent>
            {selectedVenue && (
              <>
                <Box sx={{ mb: 3 }}>
                  <CardMedia
                    component="img"
                    height="300"
                    image={getVenueImage(selectedVenue)}
                    alt={selectedVenue.name}
                    sx={{ borderRadius: 1 }}
                  />
                </Box>

                <Grid container spacing={3}>
                  <Grid item xs={12} md={8}>
                    <Typography variant="body1" sx={{ mb: 3 }}>
                      {selectedVenue.description || 'No description provided'}
                    </Typography>

                    <Box sx={{ mb: 3 }}>
                      <Typography variant="h6" gutterBottom>
                        Venue Details
                      </Typography>
                      <List dense>
                        <ListItem>
                          <ListItemIcon>
                            <LocationOn />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Location" 
                            secondary={`${selectedVenue.location}, ${selectedVenue.city}`}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <People />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Capacity" 
                            secondary={`${selectedVenue.capacity.toLocaleString()} people`}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <Event />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Events Hosted" 
                            secondary={`${selectedVenue._count.events} events`}
                          />
                        </ListItem>
                        {selectedVenue.website && (
                          <ListItem>
                            <ListItemIcon>
                              <Language />
                            </ListItemIcon>
                            <ListItemText 
                              primary="Website" 
                              secondary={
                                <a href={selectedVenue.website} target="_blank" rel="noopener noreferrer">
                                  {selectedVenue.website}
                                </a>
                              }
                            />
                          </ListItem>
                        )}
                      </List>
                    </Box>

                    {selectedVenue.amenities && selectedVenue.amenities.length > 0 && (
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="h6" gutterBottom>
                          Amenities
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          {selectedVenue.amenities.map((amenity) => (
                            <Chip key={amenity} label={amenity} variant="outlined" />
                          ))}
                        </Box>
                      </Box>
                    )}
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="h6" gutterBottom>
                        Contact Information
                      </Typography>
                      <List dense>
                        <ListItem>
                          <ListItemIcon>
                            <ContactMail />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Email" 
                            secondary={selectedVenue.contactEmail}
                          />
                        </ListItem>
                        {selectedVenue.contactPhone && (
                          <ListItem>
                            <ListItemIcon>
                              <Phone />
                            </ListItemIcon>
                            <ListItemText 
                              primary="Phone" 
                              secondary={selectedVenue.contactPhone}
                            />
                          </ListItem>
                        )}
                        <ListItem>
                          <ListItemIcon>
                            <Business />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Owner" 
                            secondary={selectedVenue.owner.name}
                          />
                        </ListItem>
                      </List>

                      <Box sx={{ mt: 3 }}>
                        <Typography variant="h6" gutterBottom>
                          Rating & Reviews
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Rating value={getVenueRating(selectedVenue)} precision={0.1} readOnly />
                          <Typography variant="body1">
                            {getVenueRating(selectedVenue).toFixed(1)}
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          Based on venue reviews
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowVenueDialog(false)}>
              Close
            </Button>
            <Button
              variant="contained"
              startIcon={<CalendarToday />}
              onClick={handleCreateEvent}
            >
              Create Event Here
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </RoleGuard>
  );
};

export default BrowseVenues;
