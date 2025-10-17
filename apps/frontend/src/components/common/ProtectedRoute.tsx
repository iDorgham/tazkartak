import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { initializeAuth } from '../../store/auth.slice';
import { tokenManager } from '../../utils/tokenManager.util';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  requireAuth?: boolean;
  fallbackPath?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles = [], 
  requireAuth = true,
  fallbackPath = '/auth/login'
}) => {
  const dispatch = useDispatch();
  const { isAuthenticated, user, isLoading } = useSelector((state: RootState) => state.auth);
  const location = useLocation();

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  // If authentication is not required, render children
  if (!requireAuth) {
    return <>{children}</>;
  }

  // Check if user is authenticated via token manager
  const isTokenValid = tokenManager.isAuthenticated();

  // If not authenticated, redirect to login
  if (!isAuthenticated || !user || !isTokenValid) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  // If specific roles are required, check if user has one of them
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on user role
    const roleDashboards = {
      ADMIN: '/admin/dashboard',
      ORGANIZER: '/organizer/dashboard',
      VENUE_OWNER: '/venue/dashboard',
      BUYER: '/',
    };
    
    const redirectPath = roleDashboards[user.role as keyof typeof roleDashboards] || '/';
    return <Navigate to={redirectPath} replace />;
  }

  // Check if token needs refresh
  if (tokenManager.needsRefresh()) {
    // TODO: Trigger token refresh in background
    // For now, we'll let the API interceptor handle it
  }

  return <>{children}</>;
};

export default ProtectedRoute;