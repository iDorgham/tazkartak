import { UserRole } from '../types/auth.types';

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

// Navigation items by role
export const ROLE_NAVIGATION: Record<UserRole, Array<{
  label: string;
  path: string;
  icon: string;
  permission?: Permission;
  resource?: Resource;
}>> = {
  [UserRole.ADMIN]: [
    { label: 'Dashboard', path: '/admin/dashboard', icon: 'Dashboard' },
    { label: 'Users', path: '/admin/users', icon: 'People', permission: 'read', resource: 'users' },
    { label: 'Events', path: '/admin/events', icon: 'Event', permission: 'read', resource: 'events' },
    { label: 'Venues', path: '/admin/venues', icon: 'LocationOn', permission: 'read', resource: 'venues' },
    { label: 'Subscriptions', path: '/admin/subscriptions', icon: 'CreditCard', permission: 'read', resource: 'subscriptions' },
    { label: 'Analytics', path: '/admin/analytics', icon: 'Analytics', permission: 'read', resource: 'analytics' },
    { label: 'Settings', path: '/admin/settings', icon: 'Settings' },
  ],
  [UserRole.ORGANIZER]: [
    { label: 'Dashboard', path: '/organizer/dashboard', icon: 'Dashboard' },
    { label: 'My Events', path: '/organizer/events', icon: 'Event', permission: 'read', resource: 'events' },
    { label: 'Create Event', path: '/organizer/events/create', icon: 'Add', permission: 'create', resource: 'events' },
    { label: 'Tickets', path: '/organizer/tickets', icon: 'ConfirmationNumber', permission: 'read', resource: 'tickets' },
    { label: 'QR Scanner', path: '/organizer/scanner', icon: 'QrCodeScanner', permission: 'read', resource: 'tickets' },
    { label: 'Analytics', path: '/organizer/analytics', icon: 'Analytics', permission: 'read', resource: 'analytics' },
    { label: 'Subscription', path: '/organizer/subscription', icon: 'CreditCard', permission: 'read', resource: 'subscriptions' },
    { label: 'Integration', path: '/organizer/integration', icon: 'Integration' },
  ],
  [UserRole.VENUE_OWNER]: [
    { label: 'Dashboard', path: '/venue/dashboard', icon: 'Dashboard' },
    { label: 'My Venue', path: '/venue/profile', icon: 'LocationOn', permission: 'read', resource: 'venues' },
    { label: 'Events', path: '/venue/events', icon: 'Event', permission: 'read', resource: 'events' },
    { label: 'Bookings', path: '/venue/bookings', icon: 'CalendarToday' },
  ],
  [UserRole.BUYER]: [
    { label: 'Home', path: '/', icon: 'Home' },
    { label: 'Events', path: '/events', icon: 'Event', permission: 'read', resource: 'events' },
    { label: 'My Tickets', path: '/tickets', icon: 'ConfirmationNumber', permission: 'read', resource: 'tickets' },
    { label: 'Profile', path: '/profile', icon: 'Person' },
  ],
};

// Subscription limits by plan
export const SUBSCRIPTION_LIMITS = {
  BASIC: {
    events: 5,
    attendees: 1000,
    features: ['basic_analytics', 'email_support'],
    price: 299,
    currency: 'EGP',
  },
  PRO: {
    events: 20,
    attendees: 5000,
    features: ['basic_analytics', 'advanced_analytics', 'custom_branding', 'email_support', 'phone_support'],
    price: 799,
    currency: 'EGP',
  },
  ENTERPRISE: {
    events: -1, // Unlimited
    attendees: -1, // Unlimited
    features: ['basic_analytics', 'advanced_analytics', 'custom_branding', 'white_label', 'api_access', 'priority_support', 'dedicated_account_manager'],
    price: 1999,
    currency: 'EGP',
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
    console.error('Error checking permission:', error);
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
    console.error('Error checking resource access:', error);
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
    console.error('Error getting permissions:', error);
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
 * Get navigation items for a role
 */
export const getNavigationItems = (role: UserRole) => {
  return ROLE_NAVIGATION[role] || [];
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
 * Get role color for UI
 */
export const getRoleColor = (role: UserRole): string => {
  const colors = {
    [UserRole.ADMIN]: 'error',
    [UserRole.ORGANIZER]: 'primary',
    [UserRole.VENUE_OWNER]: 'secondary',
    [UserRole.BUYER]: 'success',
  };
  
  return colors[role] || 'default';
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
    console.error('Error checking subscription permission:', error);
    return {
      allowed: false,
      reason: 'Error validating subscription permissions',
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
    console.error('Error getting accessible resources:', error);
    return [];
  }
};

/**
 * Check if current user can access a route
 */
export const canAccessRoute = (
  userRole: UserRole,
  route: string
): boolean => {
  try {
    const navigationItems = getNavigationItems(userRole);
    return navigationItems.some(item => route.startsWith(item.path));
  } catch (error) {
    console.error('Error checking route access:', error);
    return false;
  }
};
