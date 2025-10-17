import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, Container, Paper, useTheme, useMediaQuery } from '@mui/material';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

// Auth Pages
import Login from '../../pages/auth/Login';
import Register from '../../pages/auth/Register';
import ForgotPassword from '../../pages/auth/ForgotPassword';
import ResetPassword from '../../pages/auth/ResetPassword';

const AuthLayout: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  // If user is already authenticated, redirect to appropriate dashboard
  if (isAuthenticated && user) {
    const roleDashboards = {
      ADMIN: '/admin/dashboard',
      ORGANIZER: '/organizer/dashboard',
      VENUE: '/venue/dashboard',
      BUYER: '/',
    };
    
    const redirectPath = roleDashboards[user.role as keyof typeof roleDashboards] || '/';
    return <Navigate to={redirectPath} replace />;
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${theme.palette.primary.main}15, ${theme.palette.secondary.main}15)`,
        py: 2,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={24}
          sx={{
            p: isMobile ? 3 : 4,
            borderRadius: 3,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          }}
        >
          <Routes>
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="forgot-password" element={<ForgotPassword />} />
            <Route path="reset-password" element={<ResetPassword />} />
            <Route path="*" element={<Navigate to="login" replace />} />
          </Routes>
        </Paper>
      </Container>
    </Box>
  );
};

export default AuthLayout;