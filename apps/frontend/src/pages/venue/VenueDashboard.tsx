import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Button,
  IconButton,
} from '@mui/material';
import {
  LocationOn,
  Event,
  CalendarToday,
  TrendingUp,
  Edit,
  MoreVert,
  CheckCircle,
  Pending,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import RoleGuard from '../../components/common/RoleGuard';
import { Resource, Permission } from '../../utils/rbac.util';
import { UserRole } from '../../types/auth.types';

const VenueDashboard: React.FC = () => {
  const navigate = useNavigate();

  // Mock data - replace with actual API calls
  const venueStats = {
    totalEvents: 8,
    totalCapacity: 500,
    averageOccupancy: 75,
    monthlyRevenue: 12500,
  };

  const venueInfo = {
    name: 'Grand Conference Center',
    location: 'Cairo, Egypt',
    capacity: 500,
    status: 'verified',
    amenities: ['WiFi', 'Parking', 'Catering', 'AV Equipment'],
  };

  const upcomingEvents = [
    { 
      id: '1', 
      name: 'Tech Conference 2024', 
      organizer: 'Ahmed Hassan',
      date: '2024-02-15', 
      attendees: 150,
      status: 'confirmed'
    },
    { 
      id: '2', 
      name: 'Music Festival', 
      organizer: 'Sara Ahmed',
      date: '2024-02-20', 
      attendees: 400,
      status: 'pending'
    },
    { 
      id: '3', 
      name: 'Business Workshop', 
      organizer: 'Mohamed Ali',
      date: '2024-02-25', 
      attendees: 75,
      status: 'confirmed'
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'success';
      case 'confirmed': return 'success';
      case 'pending': return 'warning';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
      case 'confirmed':
        return <CheckCircle />;
      case 'pending':
        return <Pending />;
      default:
        return <Pending />;
    }
  };

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
    subtitle?: string;
    onClick?: () => void;
  }> = ({ title, value, icon, color, subtitle, onClick }) => (
    <Card 
      sx={{ 
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': onClick ? { boxShadow: 4 } : {},
      }}
      onClick={onClick}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography color="textSecondary" gutterBottom variant="h6">
              {title}
            </Typography>
            <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box sx={{ color: color, fontSize: 40 }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <RoleGuard roles={[UserRole.VENUE_OWNER]} showError>
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            Venue Dashboard
          </Typography>
          <Button
            variant="contained"
            startIcon={<Edit />}
            onClick={() => navigate('/venue/profile')}
          >
            Edit Venue
          </Button>
        </Box>

        {/* Venue Info Card */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
              <LocationOn sx={{ fontSize: 32 }} />
            </Avatar>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                {venueInfo.name}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {venueInfo.location}
                </Typography>
                <Chip 
                  icon={getStatusIcon(venueInfo.status)}
                  label={venueInfo.status}
                  size="small" 
                  color={getStatusColor(venueInfo.status) as any}
                  variant="outlined"
                />
              </Box>
            </Box>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Capacity: {venueInfo.capacity} people
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {venueInfo.amenities.map((amenity, index) => (
              <Chip key={index} label={amenity} size="small" variant="outlined" />
            ))}
          </Box>
        </Paper>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Events"
              value={venueStats.totalEvents}
              icon={<Event />}
              color="primary.main"
              onClick={() => navigate('/venue/events')}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Capacity"
              value={venueStats.totalCapacity}
              icon={<LocationOn />}
              color="info.main"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Avg Occupancy"
              value={`${venueStats.averageOccupancy}%`}
              icon={<TrendingUp />}
              color="success.main"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Monthly Revenue"
              value={`EGP ${venueStats.monthlyRevenue.toLocaleString()}`}
              icon={<CalendarToday />}
              color="warning.main"
            />
          </Grid>
        </Grid>

        {/* Upcoming Events */}
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Upcoming Events
            </Typography>
            <Button
              onClick={() => navigate('/venue/events')}
              size="small"
            >
              View All
            </Button>
          </Box>
          <List>
            {upcomingEvents.map((event) => (
              <ListItem key={event.id} divider>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <Event />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        {event.name}
                      </Typography>
                      <Chip 
                        icon={getStatusIcon(event.status)}
                        label={event.status} 
                        size="small" 
                        color={getStatusColor(event.status) as any}
                        variant="outlined"
                      />
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Organizer: {event.organizer}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Date: {event.date} • {event.attendees} attendees
                      </Typography>
                    </Box>
                  }
                />
                <IconButton size="small">
                  <MoreVert />
                </IconButton>
              </ListItem>
            ))}
          </List>
        </Paper>
      </Box>
    </RoleGuard>
  );
};

export default VenueDashboard;
