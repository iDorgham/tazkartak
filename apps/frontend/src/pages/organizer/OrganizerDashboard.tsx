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
  LinearProgress,
} from '@mui/material';
import {
  Event,
  ConfirmationNumber,
  TrendingUp,
  People,
  Add,
  MoreVert,
  QrCodeScanner,
  CalendarToday,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import RoleGuard from '../../components/common/RoleGuard';
import { Resource, Permission } from '../../utils/rbac.util';
import { UserRole } from '../../types/auth.types';

const OrganizerDashboard: React.FC = () => {
  const navigate = useNavigate();

  // Mock data - replace with actual API calls
  const stats = {
    totalEvents: 12,
    totalTicketsSold: 1247,
    totalRevenue: 45680,
    activeEvents: 3,
  };

  const recentEvents = [
    { 
      id: '1', 
      name: 'Tech Conference 2024', 
      date: '2024-02-15', 
      status: 'published',
      ticketsSold: 150,
      totalCapacity: 200,
      revenue: 15000
    },
    { 
      id: '2', 
      name: 'Music Festival', 
      date: '2024-02-20', 
      status: 'draft',
      ticketsSold: 0,
      totalCapacity: 500,
      revenue: 0
    },
    { 
      id: '3', 
      name: 'Business Workshop', 
      date: '2024-02-25', 
      status: 'published',
      ticketsSold: 75,
      totalCapacity: 100,
      revenue: 7500
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'success';
      case 'draft': return 'warning';
      case 'cancelled': return 'error';
      default: return 'default';
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
    <RoleGuard roles={[UserRole.ORGANIZER]} showError>
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            My Dashboard
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/organizer/events/create')}
          >
            Create Event
          </Button>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Events"
              value={stats.totalEvents}
              icon={<Event />}
              color="primary.main"
              subtitle={`${stats.activeEvents} active`}
              onClick={() => navigate('/organizer/events')}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Tickets Sold"
              value={stats.totalTicketsSold}
              icon={<ConfirmationNumber />}
              color="success.main"
              onClick={() => navigate('/organizer/tickets')}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Revenue"
              value={`EGP ${stats.totalRevenue.toLocaleString()}`}
              icon={<TrendingUp />}
              color="info.main"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Active Events"
              value={stats.activeEvents}
              icon={<CalendarToday />}
              color="warning.main"
            />
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          {/* Recent Events */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  My Events
                </Typography>
                <Button
                  onClick={() => navigate('/organizer/events')}
                  size="small"
                >
                  View All
                </Button>
              </Box>
              <List>
                {recentEvents.map((event) => (
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
                            Date: {event.date}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Tickets: {event.ticketsSold}/{event.totalCapacity} • Revenue: EGP {event.revenue.toLocaleString()}
                          </Typography>
                          <LinearProgress 
                            variant="determinate" 
                            value={(event.ticketsSold / event.totalCapacity) * 100}
                            sx={{ mt: 1, height: 6, borderRadius: 3 }}
                          />
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
          </Grid>

          {/* Quick Actions */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<Add />}
                  onClick={() => navigate('/organizer/events/create')}
                  fullWidth
                >
                  Create New Event
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<QrCodeScanner />}
                  onClick={() => navigate('/organizer/scanner')}
                  fullWidth
                >
                  QR Scanner
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<TrendingUp />}
                  onClick={() => navigate('/organizer/analytics')}
                  fullWidth
                >
                  View Analytics
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<ConfirmationNumber />}
                  onClick={() => navigate('/organizer/tickets')}
                  fullWidth
                >
                  Manage Tickets
                </Button>
              </Box>
            </Paper>

            {/* Subscription Status */}
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                Subscription Status
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Chip label="PRO" color="primary" size="small" />
                <Typography variant="body2" color="text.secondary">
                  Active until March 15, 2024
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Events used: 12/20 this month
              </Typography>
              <Button
                variant="contained"
                size="small"
                onClick={() => navigate('/organizer/subscription')}
                fullWidth
              >
                Manage Subscription
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </RoleGuard>
  );
};

export default OrganizerDashboard;
