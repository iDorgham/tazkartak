import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Box,
  Chip,
  Button,
  Badge,
  Tooltip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications,
  AccountCircle,
  Logout,
  Settings,
  Person,
} from '@mui/icons-material';
import { RootState } from '../../store';
import { logout } from '../../store/auth.slice';
import { getRoleDisplayName, getRoleColor } from '../../utils/rbac.util';
import RoleGuard from './RoleGuard';

interface RoleBasedHeaderProps {
  onMenuClick: () => void;
  title?: string;
  showNotifications?: boolean;
  notificationCount?: number;
}

const RoleBasedHeader: React.FC<RoleBasedHeaderProps> = ({
  onMenuClick,
  title,
  showNotifications = true,
  notificationCount = 0,
}) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState<null | HTMLElement>(null);

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchorEl(event.currentTarget);
  };

  const handleNotificationMenuClose = () => {
    setNotificationAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await dispatch(logout()).unwrap();
      navigate('/auth/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
    handleProfileMenuClose();
  };

  const handleProfile = () => {
    navigate('/profile');
    handleProfileMenuClose();
  };

  const handleSettings = () => {
    // Navigate to role-specific settings
    const settingsPath = user?.role === 'ADMIN' 
      ? '/admin/settings' 
      : user?.role === 'ORGANIZER' 
      ? '/organizer/settings'
      : user?.role === 'VENUE_OWNER'
      ? '/venue/settings'
      : '/profile/settings';
    
    navigate(settingsPath);
    handleProfileMenuClose();
  };

  if (!user) {
    return null;
  }

  const getRoleBasedTitle = (): string => {
    if (title) return title;
    
    switch (user.role) {
      case 'ADMIN':
        return 'Admin Dashboard';
      case 'ORGANIZER':
        return 'Organizer Dashboard';
      case 'VENUE_OWNER':
        return 'Venue Dashboard';
      case 'BUYER':
        return 'Tazkartak';
      default:
        return 'Dashboard';
    }
  };

  return (
    <AppBar position="sticky" elevation={1} sx={{ backgroundColor: 'white', color: 'text.primary' }}>
      <Toolbar>
        {/* Menu Button */}
        <IconButton
          edge="start"
          color="inherit"
          aria-label="menu"
          onClick={onMenuClick}
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>

        {/* Title */}
        <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
          {getRoleBasedTitle()}
        </Typography>

        {/* Notifications */}
        <RoleGuard roles={['ADMIN', 'ORGANIZER']}>
          {showNotifications && (
            <Tooltip title="Notifications">
              <IconButton
                color="inherit"
                onClick={handleNotificationMenuOpen}
                sx={{ mr: 1 }}
              >
                <Badge badgeContent={notificationCount} color="error">
                  <Notifications />
                </Badge>
              </IconButton>
            </Tooltip>
          )}
        </RoleGuard>

        {/* User Role Badge */}
        <Chip
          label={getRoleDisplayName(user.role)}
          size="small"
          color={getRoleColor(user.role) as any}
          variant="outlined"
          sx={{ mr: 2 }}
        />

        {/* Profile Menu */}
        <Tooltip title="Account">
          <IconButton
            edge="end"
            aria-label="account of current user"
            aria-controls="profile-menu"
            aria-haspopup="true"
            onClick={handleProfileMenuOpen}
            color="inherit"
          >
            <Avatar
              sx={{
                width: 32,
                height: 32,
                bgcolor: `${getRoleColor(user.role)}.main`,
              }}
            >
              {user.firstName?.[0]}{user.lastName?.[0]}
            </Avatar>
          </IconButton>
        </Tooltip>

        {/* Profile Menu */}
        <Menu
          anchorEl={anchorEl}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          keepMounted
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          open={Boolean(anchorEl)}
          onClose={handleProfileMenuClose}
        >
          <MenuItem onClick={handleProfile}>
            <Person sx={{ mr: 1 }} />
            Profile
          </MenuItem>
          <MenuItem onClick={handleSettings}>
            <Settings sx={{ mr: 1 }} />
            Settings
          </MenuItem>
          <MenuItem onClick={handleLogout}>
            <Logout sx={{ mr: 1 }} />
            Logout
          </MenuItem>
        </Menu>

        {/* Notifications Menu */}
        <Menu
          anchorEl={notificationAnchorEl}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          keepMounted
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          open={Boolean(notificationAnchorEl)}
          onClose={handleNotificationMenuClose}
        >
          {notificationCount > 0 ? (
            <>
              <MenuItem>
                <Typography variant="body2" color="text.secondary">
                  You have {notificationCount} new notifications
                </Typography>
              </MenuItem>
              <MenuItem>
                <Button size="small" fullWidth>
                  View All Notifications
                </Button>
              </MenuItem>
            </>
          ) : (
            <MenuItem>
              <Typography variant="body2" color="text.secondary">
                No new notifications
              </Typography>
            </MenuItem>
          )}
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default RoleBasedHeader;
