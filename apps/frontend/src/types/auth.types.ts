export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  organizer?: Organizer;
  venueOwner?: Venue;
}

export interface Organizer {
  id: string;
  userId: string;
  name: string;
  description?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  logoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Venue {
  id: string;
  userId: string;
  name: string;
  location: string;
  capacity: number;
  contactEmail?: string;
  contactPhone?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'ADMIN' | 'ORGANIZER' | 'VENUE_OWNER' | 'BUYER';

export interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
  role: UserRole;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  password: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  message?: string;
}

export interface RefreshTokenResponse {
  token: string;
  user: User;
}
