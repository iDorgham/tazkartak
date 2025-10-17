import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
import { theme } from '@/config/theme';

interface SkeletonTicketCardProps {
  width?: number;
  height?: number;
}

const SkeletonTicketCard: React.FC<SkeletonTicketCardProps> = ({ 
  width = 350, 
  height = 150 
}) => {
  return (
    <SkeletonPlaceholder
      backgroundColor={theme.colors.surface}
      highlightColor={theme.colors.background}
      speed={1500}
    >
      <View style={[styles.container, { width, height }]}>
        {/* Header with QR code skeleton */}
        <View style={styles.header}>
          <View style={styles.qrCodeSkeleton} />
          <View style={styles.headerTextContainer}>
            <View style={styles.eventTitleSkeleton} />
            <View style={styles.eventDateSkeleton} />
          </View>
        </View>
        
        {/* Ticket details */}
        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <View style={styles.detailLabelSkeleton} />
            <View style={styles.detailValueSkeleton} />
          </View>
          
          <View style={styles.detailRow}>
            <View style={styles.detailLabelSkeletonShort} />
            <View style={styles.detailValueSkeletonShort} />
          </View>
          
          <View style={styles.detailRow}>
            <View style={styles.detailLabelSkeleton} />
            <View style={styles.detailValueSkeleton} />
          </View>
        </View>
        
        {/* Status badge skeleton */}
        <View style={styles.statusSkeleton} />
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
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  qrCodeSkeleton: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 16,
  },
  headerTextContainer: {
    flex: 1,
  },
  eventTitleSkeleton: {
    width: '80%',
    height: 16,
    borderRadius: 4,
    marginBottom: 8,
  },
  eventDateSkeleton: {
    width: '60%',
    height: 14,
    borderRadius: 4,
  },
  detailsContainer: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabelSkeleton: {
    width: '30%',
    height: 12,
    borderRadius: 4,
  },
  detailValueSkeleton: {
    width: '40%',
    height: 12,
    borderRadius: 4,
  },
  detailLabelSkeletonShort: {
    width: '25%',
    height: 12,
    borderRadius: 4,
  },
  detailValueSkeletonShort: {
    width: '35%',
    height: 12,
    borderRadius: 4,
  },
  statusSkeleton: {
    width: '20%',
    height: 20,
    borderRadius: 10,
    alignSelf: 'flex-end',
  },
});

export default SkeletonTicketCard;
