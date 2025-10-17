import React from 'react';
import { useSelector } from 'react-redux';

import { RootState } from '@/store';
import { UserRole } from '@/types/auth.types';

import { BuyerTabNavigator } from '@/navigation/BuyerTabNavigator';
import { OrganizerTabNavigator } from '@/navigation/OrganizerTabNavigator';
import { VenueTabNavigator } from '@/navigation/VenueTabNavigator';
import { AdminTabNavigator } from '@/navigation/AdminTabNavigator';

export const RoleBasedNavigator: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  if (!user) {
    return null;
  }

  switch (user.role) {
    case UserRole.ADMIN:
      return <AdminTabNavigator />;
    case UserRole.ORGANIZER:
      return <OrganizerTabNavigator />;
    case UserRole.VENUE_OWNER:
      return <VenueTabNavigator />;
    case UserRole.BUYER:
    default:
      return <BuyerTabNavigator />;
  }
};

