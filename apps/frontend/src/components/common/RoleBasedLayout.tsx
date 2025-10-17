import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Box, useTheme, useMediaQuery } from '@mui/material';
import { RootState } from '../../store';
import { UserRole } from '../../types/auth.types';
import RoleBasedHeader from './RoleBasedHeader';
import RoleBasedNavigation from './RoleBasedNavigation';
import RoleGuard from './RoleGuard';

interface RoleBasedLayoutProps {
  children: React.ReactNode;
  title?: string;
  showNotifications?: boolean;
  notificationCount?: number;
}

const RoleBasedLayout: React.FC<RoleBasedLayoutProps> = ({
  children,
  title,
  showNotifications = true,
  notificationCount = 0,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Don't show layout for non-authenticated users or buyers on home page
  if (!isAuthenticated || !user) {
    return <>{children}</>;
  }

  // For buyers on the main site, don't show the full dashboard layout
  if (user.role === UserRole.BUYER && window.location.pathname === '/') {
    return <>{children}</>;
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Navigation Drawer */}
      <RoleGuard roles={[UserRole.ADMIN, UserRole.ORGANIZER, UserRole.VENUE_OWNER]}>
        <RoleBasedNavigation
          open={!isMobile || mobileOpen}
          onClose={() => setMobileOpen(false)}
          variant={isMobile ? 'temporary' : 'permanent'}
          width={280}
        />
      </RoleGuard>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          width: { sm: `calc(100% - 280px)` },
          ml: { sm: '280px' },
        }}
      >
        {/* Header */}
        <RoleBasedHeader
          onMenuClick={handleDrawerToggle}
          title={title}
          showNotifications={showNotifications}
          notificationCount={notificationCount}
        />

        {/* Page Content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            backgroundColor: '#f5f5f5',
            minHeight: 'calc(100vh - 64px)',
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default RoleBasedLayout;
