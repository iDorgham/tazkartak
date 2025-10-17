import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
  Card,
  CardContent,
  IconButton,
  Alert,
  Divider,
  FormHelperText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Add,
  Remove,
  CloudUpload,
  LocationOn,
  Save,
  ArrowBack,
  CheckCircle,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { createVenue, fetchAvailableAmenities } from '../../store/venues.slice';
import { CreateVenueData } from '../../services/venues.service';
import RoleGuard from '../../components/common/RoleGuard';
import { UserRole } from '../../types/auth.types';

interface CreateVenueFormData {
  name: string;
  description?: string;
  location: string;
  address: string;
  city: string;
  capacity: number;
  amenities: string[];
  contactEmail: string;
  contactPhone?: string;
  website?: string;
  latitude?: number;
  longitude?: number;
}

const validationSchema = yup.object({
  name: yup.string().required('Venue name is required').min(3, 'Venue name must be at least 3 characters'),
  description: yup.string().min(10, 'Description must be at least 10 characters'),
  location: yup.string().required('Location is required'),
  address: yup.string().required('Address is required'),
  city: yup.string().required('City is required'),
  capacity: yup.number().required('Capacity is required').min(1, 'Capacity must be at least 1'),
  amenities: yup.array().of(yup.string()).min(1, 'At least one amenity is required'),
  contactEmail: yup.string().required('Contact email is required').email('Invalid email format'),
  contactPhone: yup.string().matches(/^[\+]?[0-9\s\-\(\)]+$/, 'Invalid phone number format'),
  website: yup.string().url('Invalid website URL'),
  latitude: yup.number().min(-90).max(90),
  longitude: yup.number().min(-180).max(180),
});

const commonAmenities = [
  'WiFi',
  'Parking',
  'Air Conditioning',
  'Sound System',
  'Lighting',
  'Stage',
  'Seating',
  'Bar',
  'Kitchen',
  'Restrooms',
  'Accessibility',
  'Security',
  'Catering',
  'Photography',
  'Live Streaming',
  'Recording',
];

const CreateVenue: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, error, amenities } = useSelector((state: RootState) => ({
    loading: state.venues.loading,
    error: state.venues.error,
    amenities: state.venues.amenities,
  }));

  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [customAmenity, setCustomAmenity] = useState('');

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<CreateVenueFormData>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      name: '',
      description: '',
      location: '',
      address: '',
      city: '',
      capacity: 0,
      amenities: [],
      contactEmail: '',
      contactPhone: '',
      website: '',
      latitude: undefined,
      longitude: undefined,
    },
    mode: 'onChange',
  });

  const watchedAmenities = watch('amenities');

  useEffect(() => {
    // Fetch available amenities on component mount
    dispatch(fetchAvailableAmenities());
  }, [dispatch]);

  const onSubmit = async (data: CreateVenueData) => {
    try {
      const resultAction = await dispatch(createVenue(data));
      
      if (createVenue.fulfilled.match(resultAction)) {
        setShowSuccessDialog(true);
      }
    } catch (err) {
      // Error is handled by Redux
    }
  };

  const handleAddCustomAmenity = () => {
    if (customAmenity.trim() && !watchedAmenities.includes(customAmenity.trim())) {
      setValue('amenities', [...watchedAmenities, customAmenity.trim()]);
      setCustomAmenity('');
    }
  };

  const handleRemoveAmenity = (amenityToRemove: string) => {
    setValue('amenities', watchedAmenities.filter(amenity => amenity !== amenityToRemove));
  };

  const handleAddAmenity = (amenity: string) => {
    if (!watchedAmenities.includes(amenity)) {
      setValue('amenities', [...watchedAmenities, amenity]);
    }
  };

  return (
    <RoleGuard roles={[UserRole.VENUE_OWNER]} showError>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={() => navigate('/venue/dashboard')} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            Register New Venue
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={3}>
            {/* Basic Information */}
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Basic Information
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Controller
                      name="name"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Venue Name"
                          error={!!errors.name}
                          helperText={errors.name?.message}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Controller
                      name="description"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          multiline
                          rows={4}
                          label="Venue Description"
                          placeholder="Describe your venue, its features, and what makes it special..."
                          error={!!errors.description}
                          helperText={errors.description?.message}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="location"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Location/Area"
                          placeholder="e.g., Downtown, New Cairo, Zamalek"
                          error={!!errors.location}
                          helperText={errors.location?.message}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="city"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="City"
                          placeholder="e.g., Cairo, Alexandria, Giza"
                          error={!!errors.city}
                          helperText={errors.city?.message}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Controller
                      name="address"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Full Address"
                          placeholder="Complete street address"
                          error={!!errors.address}
                          helperText={errors.address?.message}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="capacity"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          type="number"
                          label="Maximum Capacity"
                          error={!!errors.capacity}
                          helperText={errors.capacity?.message}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="contactEmail"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          type="email"
                          label="Contact Email"
                          error={!!errors.contactEmail}
                          helperText={errors.contactEmail?.message}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="contactPhone"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Contact Phone (Optional)"
                          placeholder="+20 10 1234 5678"
                          error={!!errors.contactPhone}
                          helperText={errors.contactPhone?.message}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="website"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Website (Optional)"
                          placeholder="https://yourvenue.com"
                          error={!!errors.website}
                          helperText={errors.website?.message}
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </Paper>

              {/* Amenities */}
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Amenities & Features
                </Typography>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Select the amenities and features your venue offers:
                </Typography>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Common Amenities:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    {commonAmenities.map((amenity) => (
                      <Chip
                        key={amenity}
                        label={amenity}
                        onClick={() => handleAddAmenity(amenity)}
                        variant={watchedAmenities.includes(amenity) ? 'filled' : 'outlined'}
                        color={watchedAmenities.includes(amenity) ? 'primary' : 'default'}
                        clickable
                      />
                    ))}
                  </Box>
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Custom Amenities:
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Add custom amenity..."
                      value={customAmenity}
                      onChange={(e) => setCustomAmenity(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddCustomAmenity()}
                    />
                    <Button
                      variant="outlined"
                      onClick={handleAddCustomAmenity}
                      disabled={!customAmenity.trim()}
                    >
                      Add
                    </Button>
                  </Box>
                </Box>

                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Selected Amenities:
                  </Typography>
                  {watchedAmenities.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No amenities selected
                    </Typography>
                  ) : (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {watchedAmenities.map((amenity) => (
                        <Chip
                          key={amenity}
                          label={amenity}
                          onDelete={() => handleRemoveAmenity(amenity)}
                          color="primary"
                          variant="filled"
                        />
                      ))}
                    </Box>
                  )}
                  {errors.amenities && (
                    <FormHelperText error>{errors.amenities.message}</FormHelperText>
                  )}
                </Box>
              </Paper>
            </Grid>

            {/* Actions Sidebar */}
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, position: 'sticky', top: 20 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Registration Info
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      <strong>Verification Process:</strong>
                    </Typography>
                    <Typography variant="body2">
                      Your venue will be reviewed by our team before being approved for events.
                    </Typography>
                  </Alert>

                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    startIcon={<Save />}
                    disabled={loading || !isValid}
                    sx={{ py: 1.5 }}
                  >
                    {loading ? 'Registering...' : 'Register Venue'}
                  </Button>

                  <Divider />

                  <Typography variant="body2" color="text.secondary">
                    <strong>What happens next:</strong>
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    • Your venue will be reviewed by our admin team
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    • You'll receive an email notification once verified
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    • Verified venues can be selected by event organizers
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </form>

        {/* Success Dialog */}
        <Dialog open={showSuccessDialog} onClose={() => setShowSuccessDialog(false)}>
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircle color="success" />
              Venue Registered Successfully!
            </Box>
          </DialogTitle>
          <DialogContent>
            <Typography>
              Your venue has been submitted for verification. Our admin team will review your venue details and contact you once it's verified.
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                You can:
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Track verification status in your dashboard
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Edit venue details while pending
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Add more venues to your portfolio
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowSuccessDialog(false)}>
              Stay Here
            </Button>
            <Button
              variant="contained"
              onClick={() => navigate('/venue/venues')}
            >
              View My Venues
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </RoleGuard>
  );
};

export default CreateVenue;
