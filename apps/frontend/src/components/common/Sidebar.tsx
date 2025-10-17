import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  Box,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Dashboard,
  Event,
  ConfirmationNumber,
  Payment,
  Analytics,
  Settings,
  People,
  LocationOn,
  QrCodeScanner,
  AdminPanelSettings,
  Business,
  Assessment,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ open, onClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useSelector((state: RootState) => state.auth);

  const drawerWidth = 280;

  const getMenuItems = () => {
    if (!user) return [];

    const baseItems = [
      { text: 'Dashboard', icon: <Dashboard />, path: `/${user.role.toLowerCase()}/dashboard` },
    ];

    switch (user.role) {
      case 'ADMIN':
        return [
          ...baseItems,
          { text: 'Users', icon: <People />, path: '/admin/users' },
          { text: 'Events', icon: <Event />, path: '/admin/events' },
          { text: 'Venues', icon: <LocationOn />, path: '/admin/venues' },
          { text: 'Subscriptions', icon: <Payment />, path: '/admin/subscriptions' },
          { text: 'Analytics', icon: <Analytics />, path: '/admin/analytics' },
          { text: 'Settings', icon: <Settings />, path: '/admin/settings' },
        ];
      
      case 'ORGANIZER':
        return [
          ...baseItems,
          { text: 'My Events', icon: <Event />, path: '/organizer/events' },
          { text: 'Tickets', icon: <ConfirmationNumber />, path: '/organizer/tickets' },
          { text: 'Payments', icon: <Payment />, path: '/organizer/payments' },
          { text: 'Analytics', icon: <Analytics />, path: '/organizer/analytics' },
          { text: 'Settings', icon: <Settings />, path: '/organizer/settings' },
        ];
      
      case 'VENUE':
        return [
          ...baseItems,
          { text: 'Scan Tickets', icon: <QrCodeScanner />, path: '/venue/scan-tickets' },
          { text: 'Events', icon: <Event />, path: '/venue/events' },
          { text: 'Settings', icon: <Settings />, path: '/venue/settings' },
        ];
      
      case 'BUYER':
        return [
          ...baseItems,
          { text: 'My Tickets', icon: <ConfirmationNumber />, path: '/buyer/tickets' },
          { text: 'Payment History', icon: <Payment />, path: '/buyer/payments' },
        ];
      
      default:
        return baseItems;
    }
  };

  const menuItems = getMenuItems();

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, borderBottom: '1px solid rgba(0, 0, 0, 0.1)' }}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 'bold',
            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Tazkartak
        </Typography>
        {user && (
          <Typography variant="caption" color="text.secondary">
            {user.role === 'ADMIN' ? 'Administrator' : 
             user.role === 'ORGANIZER' ? 'Event Organizer' :
             user.role === 'VENUE' ? 'Venue Owner' : 'Ticket Buyer'}
          </Typography>
        )}
      </Box>

      <List sx={{ flexGrow: 1, pt: 1 }}>
        {menuItems.map((item, index) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              component="a"
              href={item.path}
              sx={{
                mx: 1,
                borderRadius: 2,
                '&:hover': {
                  backgroundColor: theme.palette.primary.main + '15',
                },
                '&.Mui-selected': {
                  backgroundColor: theme.palette.primary.main + '25',
                  borderRight: `3px solid ${theme.palette.primary.main}`,
                },
              }}
            >
              <ListItemIcon sx={{ color: theme.palette.primary.main }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text}
                primaryTypographyProps={{
                  fontWeight: 500,
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider />
      
      <Box sx={{ p: 2 }}>
        <Typography variant="caption" color="text.secondary" align="center">
          © 2025 Tazkartak. All rights reserved.
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Drawer
      variant={isMobile ? 'temporary' : 'persistent'}
      anchor="left"
      open={open}
      onClose={onClose}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRight: '1px solid rgba(0, 0, 0, 0.1)',
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
};

export default Sidebar;
