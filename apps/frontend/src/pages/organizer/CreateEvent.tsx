import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Box,
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Card,
  CardContent,
  IconButton,
  Alert,
  Divider,
  Chip,
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
  Image,
  Save,
  Publish,
  ArrowBack,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { createEvent, fetchEventCategories } from '../../store/events.slice';
import { CreateEventData } from '../../services/events.service';
import RoleGuard from '../../components/common/RoleGuard';
import { UserRole } from '../../types/auth.types';

interface TicketType {
  name: string;
  price: number;
  quantity: number;
  description?: string;
}

interface CreateEventFormData {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  venueId?: string;
  category: string;
  capacity: number;
  ticketTypes: TicketType[];
  imageUrl?: string;
  isPublic: boolean;
}

const validationSchema = yup.object({
  name: yup.string().required('Event name is required').min(3, 'Event name must be at least 3 characters'),
  description: yup.string().required('Event description is required').min(10, 'Description must be at least 10 characters'),
  startDate: yup.string().required('Start date is required'),
  endDate: yup.string().required('End date is required'),
  category: yup.string().required('Category is required'),
  capacity: yup.number().required('Capacity is required').min(1, 'Capacity must be at least 1'),
  ticketTypes: yup.array().of(
    yup.object({
      name: yup.string().required('Ticket type name is required'),
      price: yup.number().required('Price is required').min(0, 'Price must be non-negative'),
      quantity: yup.number().required('Quantity is required').min(1, 'Quantity must be at least 1'),
      description: yup.string(),
    })
  ).min(1, 'At least one ticket type is required'),
  isPublic: yup.boolean(),
});

const CreateEvent: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();

  const { loading, error, categories } = useSelector((state: RootState) => ({
    loading: state.events.loading,
    error: state.events.error,
    categories: state.events.categories,
  }));

  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);

  // Handle venue selection from URL parameter
  useEffect(() => {
    const venueId = searchParams.get('venue');
    if (venueId) {
      setSelectedVenueId(venueId);
      setValue('venueId', venueId);
    }
  }, [searchParams, setValue]);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<CreateEventFormData>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      name: '',
      description: '',
      startDate: '',
      endDate: '',
      category: '',
      capacity: 0,
      ticketTypes: [{ name: 'General Admission', price: 0, quantity: 1, description: '' }],
      isPublic: true,
    },
    mode: 'onChange',
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'ticketTypes',
  });

  const watchedTicketTypes = watch('ticketTypes');
  const watchedCapacity = watch('capacity');

  // Calculate total tickets
  const totalTickets = watchedTicketTypes.reduce((sum, type) => sum + type.quantity, 0);

  useEffect(() => {
    // Fetch event categories on component mount
    dispatch(fetchEventCategories());
  }, [dispatch]);

  useEffect(() => {
    // Update capacity when ticket types change
    setValue('capacity', totalTickets);
  }, [totalTickets, setValue]);

  const onSubmit = async (data: CreateEventFormData) => {
    try {
      const eventData: CreateEventData = {
        ...data,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        capacity: totalTickets,
      };

      const resultAction = await dispatch(createEvent(eventData));
      
      if (createEvent.fulfilled.match(resultAction)) {
        setShowPublishDialog(true);
      }
    } catch (err) {
      // Error is handled by Redux
    }
  };

  const handlePublish = async () => {
    // Navigate to the created event's edit page where user can publish
    const createdEvent = await dispatch(createEvent(watch()));
    if (createEvent.fulfilled.match(createdEvent)) {
      navigate(`/organizer/events/${createdEvent.payload.id}/edit`);
    }
  };

  const handleSaveDraft = () => {
    handleSubmit(onSubmit)();
  };

  const addTicketType = () => {
    append({ name: '', price: 0, quantity: 1, description: '' });
  };

  const removeTicketType = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  return (
    <RoleGuard roles={[UserRole.ORGANIZER]} showError>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={() => navigate('/organizer/events')} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            Create New Event
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
                          label="Event Name"
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
                          label="Event Description"
                          error={!!errors.description}
                          helperText={errors.description?.message}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="startDate"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          type="datetime-local"
                          label="Start Date & Time"
                          InputLabelProps={{ shrink: true }}
                          error={!!errors.startDate}
                          helperText={errors.startDate?.message}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="endDate"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          type="datetime-local"
                          label="End Date & Time"
                          InputLabelProps={{ shrink: true }}
                          error={!!errors.endDate}
                          helperText={errors.endDate?.message}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="category"
                      control={control}
                      render={({ field }) => (
                        <FormControl fullWidth error={!!errors.category}>
                          <InputLabel>Category</InputLabel>
                          <Select {...field} label="Category">
                            {categories.map((category) => (
                              <MenuItem key={category} value={category}>
                                {category}
                              </MenuItem>
                            ))}
                          </Select>
                          {errors.category && (
                            <FormHelperText>{errors.category.message}</FormHelperText>
                          )}
                        </FormControl>
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
                          label="Total Capacity"
                          InputProps={{ readOnly: true }}
                          helperText="Auto-calculated from ticket types"
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Controller
                      name="imageUrl"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Event Image URL (Optional)"
                          placeholder="https://example.com/image.jpg"
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Controller
                      name="isPublic"
                      control={control}
                      render={({ field }) => (
                        <FormControlLabel
                          control={<Checkbox {...field} checked={field.value} />}
                          label="Make this event public (visible to buyers)"
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </Paper>

              {/* Ticket Types */}
              <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Ticket Types
                  </Typography>
                  <Button
                    startIcon={<Add />}
                    onClick={addTicketType}
                    variant="outlined"
                    size="small"
                  >
                    Add Ticket Type
                  </Button>
                </Box>

                <Grid container spacing={2}>
                  {fields.map((field, index) => (
                    <Grid item xs={12} key={field.id}>
                      <Card variant="outlined">
                        <CardContent>
                          <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} sm={3}>
                              <Controller
                                name={`ticketTypes.${index}.name`}
                                control={control}
                                render={({ field }) => (
                                  <TextField
                                    {...field}
                                    fullWidth
                                    label="Ticket Type Name"
                                    error={!!errors.ticketTypes?.[index]?.name}
                                    helperText={errors.ticketTypes?.[index]?.name?.message}
                                  />
                                )}
                              />
                            </Grid>

                            <Grid item xs={12} sm={2}>
                              <Controller
                                name={`ticketTypes.${index}.price`}
                                control={control}
                                render={({ field }) => (
                                  <TextField
                                    {...field}
                                    fullWidth
                                    type="number"
                                    label="Price (EGP)"
                                    error={!!errors.ticketTypes?.[index]?.price}
                                    helperText={errors.ticketTypes?.[index]?.price?.message}
                                  />
                                )}
                              />
                            </Grid>

                            <Grid item xs={12} sm={2}>
                              <Controller
                                name={`ticketTypes.${index}.quantity`}
                                control={control}
                                render={({ field }) => (
                                  <TextField
                                    {...field}
                                    fullWidth
                                    type="number"
                                    label="Quantity"
                                    error={!!errors.ticketTypes?.[index]?.quantity}
                                    helperText={errors.ticketTypes?.[index]?.quantity?.message}
                                  />
                                )}
                              />
                            </Grid>

                            <Grid item xs={12} sm={4}>
                              <Controller
                                name={`ticketTypes.${index}.description`}
                                control={control}
                                render={({ field }) => (
                                  <TextField
                                    {...field}
                                    fullWidth
                                    label="Description (Optional)"
                                    placeholder="e.g., VIP access, early entry"
                                  />
                                )}
                              />
                            </Grid>

                            <Grid item xs={12} sm={1}>
                              <IconButton
                                onClick={() => removeTicketType(index)}
                                disabled={fields.length === 1}
                                color="error"
                              >
                                <Remove />
                              </IconButton>
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>

                <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Total Tickets: <strong>{totalTickets}</strong>
                  </Typography>
                </Box>
              </Paper>
            </Grid>

            {/* Actions Sidebar */}
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, position: 'sticky', top: 20 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Actions
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    startIcon={<Save />}
                    disabled={loading || !isValid}
                    sx={{ py: 1.5 }}
                  >
                    {loading ? 'Creating...' : 'Save as Draft'}
                  </Button>

                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<Publish />}
                    disabled={loading || !isValid}
                    onClick={handlePublish}
                    sx={{ py: 1.5 }}
                  >
                    Create & Publish
                  </Button>

                  <Divider />

                  <Typography variant="body2" color="text.secondary">
                    <strong>Draft:</strong> Save event without publishing
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Publish:</strong> Make event live and available for ticket sales
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </form>

        {/* Publish Confirmation Dialog */}
        <Dialog open={showPublishDialog} onClose={() => setShowPublishDialog(false)}>
          <DialogTitle>Event Created Successfully!</DialogTitle>
          <DialogContent>
            <Typography>
              Your event has been created as a draft. You can now:
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography>• Edit event details</Typography>
              <Typography>• Add venue information</Typography>
              <Typography>• Review ticket types</Typography>
              <Typography>• Publish when ready</Typography>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowPublishDialog(false)}>
              Stay Here
            </Button>
            <Button
              variant="contained"
              onClick={() => navigate('/organizer/events')}
            >
              View My Events
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </RoleGuard>
  );
};

export default CreateEvent;
