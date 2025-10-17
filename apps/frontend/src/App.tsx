import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

// Layout Components
import Layout from './components/common/Layout';
import AuthLayout from './components/common/AuthLayout';
import RoleBasedLayout from './components/common/RoleBasedLayout';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/Users';
import AdminEvents from './pages/admin/Events';
import AdminVenues from './pages/admin/Venues';
import VenueVerification from './pages/admin/VenueVerification';
import AdminPayments from './pages/admin/Payments';
import AdminSubscriptions from './pages/admin/Subscriptions';
import AdminAnalytics from './pages/admin/Analytics';
import AdminSettings from './pages/admin/Settings';
import AdminSecurity from './pages/admin/Security';

// Organizer Pages
import OrganizerDashboard from './pages/organizer/OrganizerDashboard';
import OrganizerEvents from './pages/organizer/MyEvents';
import CreateEvent from './pages/organizer/CreateEvent';
import BrowseVenues from './pages/organizer/BrowseVenues';
import TicketManagement from './pages/organizer/TicketManagement';
import QRScannerPage from './pages/organizer/QRScannerPage';
import OrganizerAnalytics from './pages/organizer/Analytics';
import Revenue from './pages/organizer/Revenue';
import MyVenues from './pages/organizer/MyVenues';
import Marketing from './pages/organizer/Marketing';
import WebsiteIntegration from './pages/organizer/WebsiteIntegration';
import OrganizerSettings from './pages/organizer/Settings';

// Venue Pages
import VenueDashboard from './pages/venue/VenueDashboard';
import VenueProfile from './pages/venue/VenueProfile';
import HostedEvents from './pages/venue/HostedEvents';
import Bookings from './pages/venue/Bookings';
import VenueSettings from './pages/venue/Settings';

// Public Pages
import Landing from './pages/public/Landing';
import Pricing from './pages/public/Pricing';
import About from './pages/public/About';
import Contact from './pages/public/Contact';

// Protected Route Component
import ProtectedRoute from './components/common/ProtectedRoute';

// Types
import { RootState } from './store';

const App: React.FC = () => {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />

      {/* Auth Routes */}
      <Route
        path="/auth/*"
        element={
          isAuthenticated ? (
            <Navigate to={`/${user?.role.toLowerCase()}/dashboard`} replace />
          ) : (
            <AuthLayout />
          )
        }
      >
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="reset-password" element={<ResetPassword />} />
      </Route>

      {/* Admin Routes */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <RoleBasedLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="events" element={<AdminEvents />} />
        <Route path="venues" element={<AdminVenues />} />
        <Route path="venues/verification" element={<VenueVerification />} />
        <Route path="payments" element={<AdminPayments />} />
        <Route path="subscriptions" element={<AdminSubscriptions />} />
        <Route path="analytics" element={<AdminAnalytics />} />
        <Route path="settings" element={<AdminSettings />} />
        <Route path="security" element={<AdminSecurity />} />
      </Route>

      {/* Organizer Routes */}
      <Route
        path="/organizer/*"
        element={
          <ProtectedRoute allowedRoles={['ORGANIZER', 'ADMIN']}>
            <RoleBasedLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<OrganizerDashboard />} />
        <Route path="events" element={<OrganizerEvents />} />
        <Route path="create-event" element={<CreateEvent />} />
        <Route path="venues" element={<BrowseVenues />} />
        <Route path="my-venues" element={<MyVenues />} />
        <Route path="tickets" element={<TicketManagement />} />
        <Route path="qr-scanner" element={<QRScannerPage />} />
        <Route path="analytics" element={<OrganizerAnalytics />} />
        <Route path="revenue" element={<Revenue />} />
        <Route path="marketing" element={<Marketing />} />
        <Route path="integration" element={<WebsiteIntegration />} />
        <Route path="settings" element={<OrganizerSettings />} />
      </Route>

      {/* Venue Routes */}
      <Route
        path="/venue/*"
        element={
          <ProtectedRoute allowedRoles={['VENUE_OWNER', 'ADMIN']}>
            <RoleBasedLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<VenueDashboard />} />
        <Route path="profile" element={<VenueProfile />} />
        <Route path="events" element={<HostedEvents />} />
        <Route path="bookings" element={<Bookings />} />
        <Route path="settings" element={<VenueSettings />} />
      </Route>

      {/* Default Redirect */}
      <Route
        path="*"
        element={
          isAuthenticated ? (
            <Navigate to={`/${user?.role.toLowerCase()}/dashboard`} replace />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
    </Routes>
  );
};

export default App;
