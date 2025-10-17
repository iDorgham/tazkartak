import React from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
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
  Avatar,
  Chip,
} from '@mui/material';
import {
  Dashboard,
  Event,
  LocationOn,
  ConfirmationNumber,
  People,
  CreditCard,
  Analytics,
  Settings,
  Add,
  QrCodeScanner,
  Integration,
  CalendarToday,
  Home,
  Person,
} from '@mui/icons-material';
import { RootState } from '../../store';
import { UserRole } from '../../types/auth.types';
import { getNavigationItems, getRoleDisplayName, getRoleColor } from '../../utils/rbac.util';
import RoleGuard from './RoleGuard';

interface RoleBasedNavigationProps {
  open: boolean;
  onClose: () => void;
  variant?: 'permanent' | 'persistent' | 'temporary';
  width?: number;
}

const iconMap: Record<string, React.ReactElement> = {
  Dashboard: <Dashboard />,
  Event: <Event />,
  Add: <Add />,
  LocationOn: <LocationOn />,
  ConfirmationNumber: <ConfirmationNumber />,
  QrCodeScanner: <QrCodeScanner />,
  Analytics: <Analytics />,
  CreditCard: <CreditCard />,
  Integration: <Integration />,
  CalendarToday: <CalendarToday />,
  Home: <Home />,
  Person: <Person />,
  People: <People />,
  Settings: <Settings />,
};

const RoleBasedNavigation: React.FC<RoleBasedNavigationProps> = ({
  open,
  onClose,
  variant = 'temporary',
  width = 280,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);

  if (!user) {
    return null;
  }

  const navigationItems = getNavigationItems(user.role);

  const handleNavigation = (path: string) => {
    navigate(path);
    if (variant === 'temporary') {
      onClose();
    }
  };

  const isActivePath = (path: string): boolean => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <Drawer
      variant={variant}
      open={open}
      onClose={onClose}
      sx={{
        width: width,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: width,
          boxSizing: 'border-box',
          background: 'linear-gradient(180deg, #f5f5f5 0%, #ffffff 100%)',
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        {/* User Info Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar
            sx={{
              bgcolor: `${getRoleColor(user.role)}.main`,
              mr: 2,
              width: 48,
              height: 48,
            }}
          >
            {user.firstName?.[0]}{user.lastName?.[0]}
          </Avatar>
          <Box>
            <Typography variant="subtitle1" fontWeight="bold">
              {user.firstName} {user.lastName}
            </Typography>
            <Chip
              label={getRoleDisplayName(user.role)}
              size="small"
              color={getRoleColor(user.role) as any}
              variant="outlined"
            />
          </Box>
        </Box>
      </Box>

      <Divider />

      {/* Navigation Items */}
      <List sx={{ flexGrow: 1, pt: 1 }}>
        {navigationItems.map((item, index) => (
          <RoleGuard
            key={index}
            resource={item.resource}
            permission={item.permission}
          >
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => handleNavigation(item.path)}
                selected={isActivePath(item.path)}
                sx={{
                  mx: 1,
                  borderRadius: 1,
                  '&.Mui-selected': {
                    backgroundColor: 'primary.main',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'primary.dark',
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'white',
                    },
                  },
                  '&:hover': {
                    backgroundColor: 'primary.light',
                    color: 'primary.contrastText',
                  },
                }}
              >
                <ListItemIcon>
                  {iconMap[item.icon] || <Dashboard />}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontWeight: isActivePath(item.path) ? 'bold' : 'normal',
                  }}
                />
              </ListItemButton>
            </ListItem>
          </RoleGuard>
        ))}
      </List>

      {/* Footer */}
      <Box sx={{ p: 2 }}>
        <Divider sx={{ mb: 2 }} />
        <Typography variant="caption" color="text.secondary" align="center">
          Tazkartak Platform v1.0
        </Typography>
      </Box>
    </Drawer>
  );
};

export default RoleBasedNavigation;
