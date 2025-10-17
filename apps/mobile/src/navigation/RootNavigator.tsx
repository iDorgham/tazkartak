import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';

export const RootNavigator: React.FC = () => {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  // Show auth flow if user is not authenticated
  if (!isAuthenticated || !user) {
    return <AuthNavigator />;
  }

  // Show main app based on user role
  return <MainNavigator />;
};