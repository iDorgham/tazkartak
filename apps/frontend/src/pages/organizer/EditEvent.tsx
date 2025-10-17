import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  LinearProgress,
} from '@mui/material';
import {
  Add,
  Remove,
  Save,
  Publish,
  ArrowBack,
  Delete,
  Cancel,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import {
  fetchEventById,
  updateEvent,
  publishEvent,
  cancelEvent,
  deleteEvent,
  fetchEventCategories,
} from '../../store/events.slice';
import { UpdateEventData, Event } from '../../services/events.service';
import RoleGuard from '../../components/common/RoleGuard';
import { UserRole } from '../../types/auth.types';

interface TicketType {
  id?: string;
  name: string;
  price: number;
  quantity: number;
  description?: string;
}

interface EditEventFormData {
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
  status: string;
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

const EditEvent: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams<{ id: string }>();

  const { currentEvent, loading, error, categories } = useSelector((state: RootState) => ({
    currentEvent: state.events.currentEvent,
    loading: state.events.loading,
    error: state.events.error,
    categories: state.events.categories,
  }));

  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isValid, isDirty },
  } = useForm<EditEventFormData>({
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
      status: 'DRAFT',
    },
    mode: 'onChange',
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'ticketTypes',
  });

  const watchedTicketTypes = watch('ticketTypes');
  const watchedCapacity = watch('capacity');
  const watchedStatus = watch('status');

  // Calculate total tickets
  const totalTickets = watchedTicketTypes.reduce((sum, type) => sum + type.quantity, 0);

  useEffect(() => {
    if (id) {
      dispatch(fetchEventById(id));
    }
    dispatch(fetchEventCategories());
  }, [dispatch, id]);

  useEffect(() => {
    if (currentEvent) {
      // Format dates for input fields
      const startDate = new Date(currentEvent.startDate).toISOString().slice(0, 16);
      const endDate = new Date(currentEvent.endDate).toISOString().slice(0, 16);

      reset({
        name: currentEvent.name,
        description: currentEvent.description,
        startDate,
        endDate,
        venueId: currentEvent.venueId,
        category: currentEvent.category,
        capacity: currentEvent.capacity,
        ticketTypes: currentEvent.ticketTypes.map(type => ({
          id: type.id,
          name: type.name,
          price: type.price,
          quantity: type.quantity,
          description: type.description || '',
        })),
        imageUrl: currentEvent.imageUrl || '',
        isPublic: currentEvent.isPublic,
        status: currentEvent.status,
      });
    }
  }, [currentEvent, reset]);

  useEffect(() => {
    // Update capacity when ticket types change
    setValue('capacity', totalTickets);
  }, [totalTickets, setValue]);

  const onSubmit = async (data: EditEventFormData) => {
    if (!id) return;

    try {
      const updateData: UpdateEventData = {
        ...data,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        capacity: totalTickets,
      };

      const resultAction = await dispatch(updateEvent({ id, eventData: updateData }));
      
      if (updateEvent.fulfilled.match(resultAction)) {
        // Show success message or navigate
        navigate('/organizer/events');
      }
    } catch (err) {
      // Error is handled by Redux
    }
  };

  const handlePublish = async () => {
    if (!id) return;
    
    setIsPublishing(true);
    try {
      const resultAction = await dispatch(publishEvent(id));
      
      if (publishEvent.fulfilled.match(resultAction)) {
        navigate('/organizer/events');
      }
    } catch (err) {
      // Error is handled by Redux
    } finally {
      setIsPublishing(false);
    }
  };

  const handleCancel = async () => {
    if (!id) return;
    
    try {
      const resultAction = await dispatch(cancelEvent({ id, reason: cancelReason }));
      
      if (cancelEvent.fulfilled.match(resultAction)) {
        setShowCancelDialog(false);
        setCancelReason('');
        navigate('/organizer/events');
      }
    } catch (err) {
      // Error is handled by Redux
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    
    try {
      const resultAction = await dispatch(deleteEvent(id));
      
      if (deleteEvent.fulfilled.match(resultAction)) {
        setShowDeleteDialog(false);
        navigate('/organizer/events');
      }
    } catch (err) {
      // Error is handled by Redux
    }
  };

  const addTicketType = () => {
    append({ name: '', price: 0, quantity: 1, description: '' });
  };

  const removeTicketType = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
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

  if (loading && !currentEvent) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Loading event...</Typography>
      </Container>
    );
  }

  if (!currentEvent) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">Event not found</Alert>
      </Container>
    );
  }

  return (
    <RoleGuard roles={[UserRole.ORGANIZER]} showError>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={() => navigate('/organizer/events')} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
              Edit Event
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
              <Chip
                label={currentEvent.status}
                color={getStatusColor(currentEvent.status) as any}
                size="small"
              />
              <Typography variant="body2" color="text.secondary">
                {currentEvent.name}
              </Typography>
            </Box>
          </Box>
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
                    disabled={loading || !isValid || !isDirty}
                    sx={{ py: 1.5 }}
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Button>

                  {currentEvent.status === 'DRAFT' && (
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<Publish />}
                      disabled={loading || !isValid || isPublishing}
                      onClick={handlePublish}
                      sx={{ py: 1.5 }}
                    >
                      {isPublishing ? 'Publishing...' : 'Publish Event'}
                    </Button>
                  )}

                  {currentEvent.status !== 'CANCELLED' && currentEvent.status !== 'COMPLETED' && (
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<Cancel />}
                      color="warning"
                      onClick={() => setShowCancelDialog(true)}
                      sx={{ py: 1.5 }}
                    >
                      Cancel Event
                    </Button>
                  )}

                  {currentEvent.status === 'DRAFT' && (
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<Delete />}
                      color="error"
                      onClick={() => setShowDeleteDialog(true)}
                      sx={{ py: 1.5 }}
                    >
                      Delete Event
                    </Button>
                  )}

                  <Divider />

                  <Typography variant="body2" color="text.secondary">
                    <strong>Status:</strong> {currentEvent.status}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Created:</strong> {new Date(currentEvent.createdAt).toLocaleDateString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Last Updated:</strong> {new Date(currentEvent.updatedAt).toLocaleDateString()}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </form>

        {/* Cancel Confirmation Dialog */}
        <Dialog open={showCancelDialog} onClose={() => setShowCancelDialog(false)}>
          <DialogTitle>Cancel Event</DialogTitle>
          <DialogContent>
            <Typography sx={{ mb: 2 }}>
              Are you sure you want to cancel "{currentEvent.name}"?
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
            <Button onClick={handleCancel} color="warning" variant="contained">
              Cancel Event
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)}>
          <DialogTitle>Delete Event</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete "{currentEvent.name}"? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button onClick={handleDelete} color="error" variant="contained">
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </RoleGuard>
  );
};

export default EditEvent;
