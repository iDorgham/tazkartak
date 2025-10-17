import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
import { theme } from '@/config/theme';

interface SkeletonEventCardProps {
  width?: number;
  height?: number;
}

const SkeletonEventCard: React.FC<SkeletonEventCardProps> = ({ 
  width = 350, 
  height = 200 
}) => {
  return (
    <SkeletonPlaceholder
      backgroundColor={theme.colors.surface}
      highlightColor={theme.colors.background}
      speed={1500}
    >
      <View style={[styles.container, { width, height }]}>
        {/* Image skeleton */}
        <View style={styles.imageSkeleton} />
        
        {/* Content skeleton */}
        <View style={styles.contentContainer}>
          {/* Title skeleton */}
          <View style={styles.titleSkeleton} />
          <View style={styles.titleSkeletonShort} />
          
          {/* Date skeleton */}
          <View style={styles.dateSkeleton} />
          
          {/* Location skeleton */}
          <View style={styles.locationSkeleton} />
          
          {/* Price skeleton */}
          <View style={styles.priceSkeleton} />
        </View>
      </View>
    </SkeletonPlaceholder>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  imageSkeleton: {
    width: '100%',
    height: 120,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  contentContainer: {
    padding: 16,
  },
  titleSkeleton: {
    width: '85%',
    height: 16,
    borderRadius: 4,
    marginBottom: 8,
  },
  titleSkeletonShort: {
    width: '60%',
    height: 16,
    borderRadius: 4,
    marginBottom: 12,
  },
  dateSkeleton: {
    width: '40%',
    height: 14,
    borderRadius: 4,
    marginBottom: 8,
  },
  locationSkeleton: {
    width: '70%',
    height: 14,
    borderRadius: 4,
    marginBottom: 12,
  },
  priceSkeleton: {
    width: '50%',
    height: 16,
    borderRadius: 4,
  },
});

export default SkeletonEventCard;
