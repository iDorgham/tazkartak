import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
import { theme } from '@/config/theme';

interface SkeletonListProps {
  itemCount?: number;
  itemHeight?: number;
  showHeader?: boolean;
  showFooter?: boolean;
}

const SkeletonList: React.FC<SkeletonListProps> = ({ 
  itemCount = 5, 
  itemHeight = 80,
  showHeader = false,
  showFooter = false 
}) => {
  const renderSkeletonItem = () => (
    <View style={[styles.item, { height: itemHeight }]}>
      {/* Avatar or icon skeleton */}
      <View style={styles.avatarSkeleton} />
      
      {/* Content skeleton */}
      <View style={styles.contentContainer}>
        <View style={styles.titleSkeleton} />
        <View style={styles.subtitleSkeleton} />
        <View style={styles.descriptionSkeleton} />
      </View>
      
      {/* Action skeleton */}
      <View style={styles.actionSkeleton} />
    </View>
  );

  return (
    <SkeletonPlaceholder
      backgroundColor={theme.colors.surface}
      highlightColor={theme.colors.background}
      speed={1500}
    >
      <View style={styles.container}>
        {/* Header skeleton */}
        {showHeader && (
          <View style={styles.headerSkeleton}>
            <View style={styles.headerTitleSkeleton} />
            <View style={styles.headerSubtitleSkeleton} />
          </View>
        )}
        
        {/* List items skeleton */}
        <View style={styles.listContainer}>
          {Array.from({ length: itemCount }).map((_, index) => (
            <View key={index}>
              {renderSkeletonItem()}
              {index < itemCount - 1 && <View style={styles.separator} />}
            </View>
          ))}
        </View>
        
        {/* Footer skeleton */}
        {showFooter && (
          <View style={styles.footerSkeleton}>
            <View style={styles.footerButtonSkeleton} />
            <View style={styles.footerButtonSkeleton} />
          </View>
        )}
      </View>
    </SkeletonPlaceholder>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  headerSkeleton: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  headerTitleSkeleton: {
    width: '60%',
    height: 20,
    borderRadius: 4,
    marginBottom: 8,
  },
  headerSubtitleSkeleton: {
    width: '40%',
    height: 14,
    borderRadius: 4,
  },
  listContainer: {
    flex: 1,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.surface,
  },
  avatarSkeleton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
  },
  titleSkeleton: {
    width: '70%',
    height: 16,
    borderRadius: 4,
    marginBottom: 6,
  },
  subtitleSkeleton: {
    width: '50%',
    height: 14,
    borderRadius: 4,
    marginBottom: 4,
  },
  descriptionSkeleton: {
    width: '85%',
    height: 12,
    borderRadius: 4,
  },
  actionSkeleton: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  separator: {
    height: 1,
    backgroundColor: theme.colors.outline,
    marginLeft: 76, // avatar width + margin
  },
  footerSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outline,
  },
  footerButtonSkeleton: {
    width: '40%',
    height: 40,
    borderRadius: 8,
  },
});

export default SkeletonList;
