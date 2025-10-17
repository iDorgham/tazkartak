import { UserRole } from '@prisma/client';
import { logger } from './logger.util';

// Permission types
export type Permission = 'create' | 'read' | 'update' | 'delete' | 'publish' | 'cancel' | 'verify' | 'refund' | 'suspend' | 'upgrade' | 'export';
export type Resource = 'events' | 'venues' | 'tickets' | 'users' | 'payments' | 'subscriptions' | 'analytics';

// Role hierarchy (higher number = more privileges)
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.BUYER]: 1,
  [UserRole.VENUE_OWNER]: 2,
  [UserRole.ORGANIZER]: 3,
  [UserRole.ADMIN]: 4,
};

// Permission matrix defining what each role can do
export const PERMISSION_MATRIX: Record<UserRole, Partial<Record<Resource, Permission[]>>> = {
  [UserRole.ADMIN]: {
    events: ['create', 'read', 'update', 'delete', 'publish', 'cancel'],
    venues: ['create', 'read', 'update', 'delete', 'verify'],
    tickets: ['create', 'read', 'update', 'delete', 'refund'],
    users: ['create', 'read', 'update', 'delete', 'suspend'],
    payments: ['read', 'update', 'refund'],
    subscriptions: ['create', 'read', 'update', 'delete'],
    analytics: ['read', 'export'],
  },
  [UserRole.ORGANIZER]: {
    events: ['create', 'read', 'update', 'delete', 'publish', 'cancel'],
    venues: ['read'],
    tickets: ['read', 'update', 'refund'],
    payments: ['read'],
    subscriptions: ['read', 'upgrade'],
    analytics: ['read'],
  },
  [UserRole.VENUE_OWNER]: {
    venues: ['create', 'read', 'update'],
    events: ['read'],
    tickets: ['read'],
  },
  [UserRole.BUYER]: {
    events: ['read'],
    tickets: ['create', 'read'],
    payments: ['create', 'read'],
  },
};

// Resource ownership rules
export const RESOURCE_OWNERSHIP: Record<Resource, string[]> = {
  events: ['organizerId'],
  venues: ['ownerId'],
  tickets: ['buyerId', 'organizerId'], // Buyer can read their tickets, organizer can manage
  payments: ['buyerId', 'organizerId'], // Buyer can read their payments, organizer can manage
  users: ['id'], // Users can only access their own profile
  subscriptions: ['userId'],
  analytics: ['organizerId'], // Organizers can only see their own analytics
};

// Subscription limits by plan
export const SUBSCRIPTION_LIMITS = {
  BASIC: {
    events: 5,
    attendees: 1000,
    features: ['basic_analytics', 'email_support'],
  },
  PRO: {
    events: 20,
    attendees: 5000,
    features: ['basic_analytics', 'advanced_analytics', 'custom_branding', 'email_support', 'phone_support'],
  },
  ENTERPRISE: {
    events: -1, // Unlimited
    attendees: -1, // Unlimited
    features: ['basic_analytics', 'advanced_analytics', 'custom_branding', 'white_label', 'api_access', 'priority_support', 'dedicated_account_manager'],
  },
};

/**
 * Check if a role has permission to perform an action on a resource
 */
export const hasPermission = (
  role: UserRole,
  resource: Resource,
  permission: Permission
): boolean => {
  try {
    const rolePermissions = PERMISSION_MATRIX[role];
    if (!rolePermissions || !rolePermissions[resource]) {
      return false;
    }

    return rolePermissions[resource]!.includes(permission);
  } catch (error) {
    logger.error('Error checking permission:', error);
    return false;
  }
};

/**
 * Check if a role can access a resource type
 */
export const canAccessResource = (role: UserRole, resource: Resource): boolean => {
  try {
    const rolePermissions = PERMISSION_MATRIX[role];
    return !!(rolePermissions && rolePermissions[resource]);
  } catch (error) {
    logger.error('Error checking resource access:', error);
    return false;
  }
};

/**
 * Get all permissions for a role on a resource
 */
export const getPermissions = (role: UserRole, resource: Resource): Permission[] => {
  try {
    const rolePermissions = PERMISSION_MATRIX[role];
    return rolePermissions?.[resource] || [];
  } catch (error) {
    logger.error('Error getting permissions:', error);
    return [];
  }
};

/**
 * Check if a role is higher in hierarchy than another
 */
export const hasHigherRole = (userRole: UserRole, targetRole: UserRole): boolean => {
  return ROLE_HIERARCHY[userRole] > ROLE_HIERARCHY[targetRole];
};

/**
 * Check if a role can manage another role
 */
export const canManageRole = (userRole: UserRole, targetRole: UserRole): boolean => {
  // Only admins can manage other admins
  if (targetRole === UserRole.ADMIN) {
    return userRole === UserRole.ADMIN;
  }
  
  // Higher roles can manage lower roles
  return ROLE_HIERARCHY[userRole] > ROLE_HIERARCHY[targetRole];
};

/**
 * Get subscription limits for a plan
 */
export const getSubscriptionLimits = (plan: string) => {
  return SUBSCRIPTION_LIMITS[plan as keyof typeof SUBSCRIPTION_LIMITS] || SUBSCRIPTION_LIMITS.BASIC;
};

/**
 * Check if a subscription plan supports a feature
 */
export const hasFeature = (plan: string, feature: string): boolean => {
  const limits = getSubscriptionLimits(plan);
  return limits.features.includes(feature);
};

/**
 * Get ownership fields for a resource
 */
export const getOwnershipFields = (resource: Resource): string[] => {
  return RESOURCE_OWNERSHIP[resource] || [];
};

/**
 * Check if user owns a resource
 */
export const ownsResource = (
  userId: string,
  resource: Resource,
  resourceData: any
): boolean => {
  try {
    const ownershipFields = getOwnershipFields(resource);
    
    for (const field of ownershipFields) {
      if (resourceData[field] === userId) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    logger.error('Error checking resource ownership:', error);
    return false;
  }
};

/**
 * Get role display name
 */
export const getRoleDisplayName = (role: UserRole): string => {
  const displayNames = {
    [UserRole.ADMIN]: 'Administrator',
    [UserRole.ORGANIZER]: 'Event Organizer',
    [UserRole.VENUE_OWNER]: 'Venue Owner',
    [UserRole.BUYER]: 'Ticket Buyer',
  };
  
  return displayNames[role] || role;
};

/**
 * Get role description
 */
export const getRoleDescription = (role: UserRole): string => {
  const descriptions = {
    [UserRole.ADMIN]: 'Full system access with all permissions',
    [UserRole.ORGANIZER]: 'Create and manage events, sell tickets, view analytics',
    [UserRole.VENUE_OWNER]: 'Manage venue information and hosted events',
    [UserRole.BUYER]: 'Purchase tickets and view purchase history',
  };
  
  return descriptions[role] || 'User role';
};

/**
 * Validate resource access with ownership check
 */
export const validateResourceAccess = (
  userRole: UserRole,
  userId: string,
  resource: Resource,
  permission: Permission,
  resourceData?: any
): { allowed: boolean; reason?: string } => {
  try {
    // Check if role has permission
    if (!hasPermission(userRole, resource, permission)) {
      return {
        allowed: false,
        reason: `Role ${userRole} does not have permission to ${permission} ${resource}`,
      };
    }

    // Check ownership for non-admin users
    if (userRole !== UserRole.ADMIN && resourceData) {
      if (!ownsResource(userId, resource, resourceData)) {
        return {
          allowed: false,
          reason: 'Access denied. You can only access your own resources.',
        };
      }
    }

    return { allowed: true };
  } catch (error) {
    logger.error('Error validating resource access:', error);
    return {
      allowed: false,
      reason: 'Error validating access permissions',
    };
  }
};

/**
 * Get accessible resources for a role
 */
export const getAccessibleResources = (role: UserRole): Resource[] => {
  try {
    const rolePermissions = PERMISSION_MATRIX[role];
    return Object.keys(rolePermissions) as Resource[];
  } catch (error) {
    logger.error('Error getting accessible resources:', error);
    return [];
  }
};

/**
 * Check if user can perform action based on subscription
 */
export const checkSubscriptionPermission = (
  plan: string,
  action: string,
  currentUsage?: number
): { allowed: boolean; reason?: string } => {
  try {
    const limits = getSubscriptionLimits(plan);
    
    // Check specific limits
    if (action === 'create_event' && limits.events !== -1) {
      if (currentUsage && currentUsage >= limits.events) {
        return {
          allowed: false,
          reason: `Event limit reached for ${plan} plan (${limits.events} events/month). Upgrade your plan to create more events.`,
        };
      }
    }
    
    if (action === 'create_ticket' && limits.attendees !== -1) {
      if (currentUsage && currentUsage >= limits.attendees) {
        return {
          allowed: false,
          reason: `Attendee limit reached for ${plan} plan (${limits.attendees} attendees/event). Upgrade your plan to support more attendees.`,
        };
      }
    }
    
    return { allowed: true };
  } catch (error) {
    logger.error('Error checking subscription permission:', error);
    return {
      allowed: false,
      reason: 'Error validating subscription permissions',
    };
  }
};
