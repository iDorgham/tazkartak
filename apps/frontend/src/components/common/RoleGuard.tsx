import React from 'react';
import { useSelector } from 'react-redux';
import { Alert } from '@mui/material';
import { RootState } from '../../store';
import { UserRole } from '../../types/auth.types';
import { hasPermission, canAccessResource, hasHigherRole } from '../../utils/rbac.util';
import { Resource, Permission } from '../../utils/rbac.util';

interface RoleGuardProps {
  children: React.ReactNode;
  roles?: UserRole[];
  resource?: Resource;
  permission?: Permission;
  requireHigherRole?: UserRole;
  fallback?: React.ReactNode;
  showError?: boolean;
}

const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  roles = [],
  resource,
  permission,
  requireHigherRole,
  fallback = null,
  showError = false,
}) => {
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);

  // If not authenticated, show fallback
  if (!isAuthenticated || !user) {
    return <>{fallback}</>;
  }

  // Check role requirements
  if (roles.length > 0 && !roles.includes(user.role)) {
    if (showError) {
      return (
        <Alert severity="error" sx={{ mb: 2 }}>
          Access denied. Required roles: {roles.join(', ')}
        </Alert>
      );
    }
    return <>{fallback}</>;
  }

  // Check resource access
  if (resource && !canAccessResource(user.role, resource)) {
    if (showError) {
      return (
        <Alert severity="error" sx={{ mb: 2 }}>
          Access denied. You don't have permission to access {resource} resources.
        </Alert>
      );
    }
    return <>{fallback}</>;
  }

  // Check specific permission
  if (resource && permission && !hasPermission(user.role, resource, permission)) {
    if (showError) {
      return (
        <Alert severity="error" sx={{ mb: 2 }}>
          Access denied. You don't have permission to {permission} {resource}.
        </Alert>
      );
    }
    return <>{fallback}</>;
  }

  // Check if user has higher role than required
  if (requireHigherRole && !hasHigherRole(user.role, requireHigherRole)) {
    if (showError) {
      return (
        <Alert severity="error" sx={{ mb: 2 }}>
          Access denied. Higher role required.
        </Alert>
      );
    }
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default RoleGuard;
