export interface Subscription {
  id: string;
  organizerId: string;
  packageTier: PackageTier;
  startDate: string;
  endDate: string;
  status: SubscriptionStatus;
  price: number;
  eventLimit: number;
  eventsCreated: number;
  createdAt: string;
  updatedAt: string;
  organizer?: Organizer;
  payments?: Payment[];
}

export type PackageTier = 'BASIC' | 'PRO' | 'ENTERPRISE';
export type SubscriptionStatus = 'ACTIVE' | 'INACTIVE' | 'CANCELLED' | 'EXPIRED';

export interface CreateSubscriptionInput {
  organizerId: string;
  packageTier: PackageTier;
  startDate: string;
  endDate: string;
  price: number;
  eventLimit: number;
}

export interface UpdateSubscriptionInput {
  packageTier?: PackageTier;
  endDate?: string;
  status?: SubscriptionStatus;
  price?: number;
  eventLimit?: number;
}

export interface SubscriptionFilters {
  organizerId?: string;
  packageTier?: PackageTier;
  status?: SubscriptionStatus;
  page?: number;
  limit?: number;
}

export interface SubscriptionStats {
  totalSubscriptions: number;
  activeSubscriptions: number;
  expiredSubscriptions: number;
  cancelledSubscriptions: number;
  totalRevenue: number;
  averageSubscriptionValue: number;
}

export interface SubscriptionAnalytics {
  subscriptionsByTier: Array<{
    tier: PackageTier;
    count: number;
    revenue: number;
    percentage: number;
  }>;
  subscriptionsByStatus: Array<{
    status: SubscriptionStatus;
    count: number;
    percentage: number;
  }>;
  monthlyRevenue: Array<{
    month: string;
    revenue: number;
    newSubscriptions: number;
    renewals: number;
  }>;
  churnRate: number;
  averageLifetime: number;
}

export interface PackageDetails {
  tier: PackageTier;
  name: string;
  description: string;
  price: number;
  features: string[];
  limits: {
    events: number;
    ticketsPerEvent: number;
    analytics: boolean;
    customBranding: boolean;
    apiAccess: boolean;
    prioritySupport: boolean;
    customDomain: boolean;
    whiteLabel: boolean;
  };
  popular?: boolean;
}

export interface SubscriptionUpgradeRequest {
  currentSubscriptionId: string;
  newPackageTier: PackageTier;
  upgradeReason?: string;
}

export interface SubscriptionUpgradeResponse {
  success: boolean;
  newSubscription?: Subscription;
  proratedAmount?: number;
  message: string;
}

export interface SubscriptionRenewalRequest {
  subscriptionId: string;
  paymentMethod: string;
  autoRenew?: boolean;
}

export interface SubscriptionRenewalResponse {
  success: boolean;
  renewedSubscription: Subscription;
  paymentId: string;
  message: string;
}

export interface SubscriptionCancellationRequest {
  subscriptionId: string;
  reason: string;
  effectiveDate?: string; // If not provided, cancel immediately
}

export interface SubscriptionCancellationResponse {
  success: boolean;
  cancelledSubscription: Subscription;
  refundAmount?: number;
  message: string;
}

// Import from other types (to avoid circular dependencies)
interface Organizer {
  id: string;
  name: string;
  description?: string;
  contactEmail?: string;
}

interface Payment {
  id: string;
  amount: number;
  status: string;
  gateway: string;
  createdAt: string;
}
