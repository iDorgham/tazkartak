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
  People,
  Event,
  LocationOn,
  CreditCard,
  TrendingUp,
  MoreVert,
  Add,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import RoleGuard from '../../components/common/RoleGuard';
import { Resource, Permission } from '../../utils/rbac.util';
import { UserRole } from '../../types/auth.types';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();

  // Mock data - replace with actual API calls
  const stats = {
    totalUsers: 1247,
    totalEvents: 89,
    totalVenues: 34,
    totalRevenue: 156780,
  };

  const recentUsers = [
    { id: '1', name: 'Ahmed Hassan', email: 'ahmed@example.com', role: 'ORGANIZER', joinDate: '2024-01-15' },
    { id: '2', name: 'Fatma Ali', email: 'fatma@example.com', role: 'VENUE_OWNER', joinDate: '2024-01-14' },
    { id: '3', name: 'Mohamed Omar', email: 'mohamed@example.com', role: 'BUYER', joinDate: '2024-01-13' },
    { id: '4', name: 'Sara Ahmed', email: 'sara@example.com', role: 'ORGANIZER', joinDate: '2024-01-12' },
  ];

  const recentEvents = [
    { id: '1', name: 'Tech Conference 2024', organizer: 'Ahmed Hassan', date: '2024-02-15', attendees: 150 },
    { id: '2', name: 'Music Festival', organizer: 'Sara Ahmed', date: '2024-02-20', attendees: 500 },
    { id: '3', name: 'Business Workshop', organizer: 'Mohamed Ali', date: '2024-02-25', attendees: 75 },
  ];

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
    onClick?: () => void;
  }> = ({ title, value, icon, color, onClick }) => (
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
          </Box>
          <Box sx={{ color: color, fontSize: 40 }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <RoleGuard roles={[UserRole.ADMIN]} showError>
      <Box>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
          Admin Dashboard
        </Typography>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Users"
              value={stats.totalUsers.toLocaleString()}
              icon={<People />}
              color="primary.main"
              onClick={() => navigate('/admin/users')}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Events"
              value={stats.totalEvents}
              icon={<Event />}
              color="success.main"
              onClick={() => navigate('/admin/events')}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Venues"
              value={stats.totalVenues}
              icon={<LocationOn />}
              color="info.main"
              onClick={() => navigate('/admin/venues')}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Revenue"
              value={`EGP ${stats.totalRevenue.toLocaleString()}`}
              icon={<TrendingUp />}
              color="warning.main"
            />
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          {/* Recent Users */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Recent Users
                </Typography>
                <Button
                  startIcon={<Add />}
                  onClick={() => navigate('/admin/users')}
                  size="small"
                >
                  View All
                </Button>
              </Box>
              <List>
                {recentUsers.map((user) => (
                  <ListItem key={user.id} divider>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={user.name}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {user.email}
                          </Typography>
                          <Chip 
                            label={user.role} 
                            size="small" 
                            color="primary" 
                            variant="outlined"
                            sx={{ mt: 0.5 }}
                          />
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>

          {/* Recent Events */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Recent Events
                </Typography>
                <Button
                  startIcon={<Add />}
                  onClick={() => navigate('/admin/events')}
                  size="small"
                >
                  View All
                </Button>
              </Box>
              <List>
                {recentEvents.map((event) => (
                  <ListItem key={event.id} divider>
                    <ListItemText
                      primary={event.name}
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
          </Grid>
        </Grid>
      </Box>
    </RoleGuard>
  );
};

export default AdminDashboard;
