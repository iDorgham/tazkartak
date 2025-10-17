import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Image,
  ImageProps,
  ActivityIndicator,
  StyleSheet,
  Animated,
  Dimensions,
  ViewStyle,
  ImageStyle,
} from 'react-native';
import FastImage, { FastImageProps, Priority, ResizeMode } from 'react-native-fast-image';
import { cacheService } from '@/services/cache.service';

interface OptimizedImageProps extends Omit<ImageProps, 'source'> {
  source: { uri: string } | number;
  width?: number;
  height?: number;
  borderRadius?: number;
  placeholder?: string;
  fallback?: string;
  priority?: Priority;
  resizeMode?: ResizeMode;
  enableProgressive?: boolean;
  enableCaching?: boolean;
  cacheKey?: string;
  style?: ViewStyle | ImageStyle;
  onLoadStart?: () => void;
  onLoadEnd?: () => void;
  onError?: (error: any) => void;
  showLoadingIndicator?: boolean;
  loadingIndicatorColor?: string;
  loadingIndicatorSize?: 'small' | 'large';
  blurRadius?: number;
  fadeDuration?: number;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  source,
  width,
  height,
  borderRadius = 0,
  placeholder,
  fallback,
  priority = FastImage.priority.normal,
  resizeMode = FastImage.resizeMode.cover,
  enableProgressive = true,
  enableCaching = true,
  cacheKey,
  style,
  onLoadStart,
  onLoadEnd,
  onError,
  showLoadingIndicator = true,
  loadingIndicatorColor = '#999',
  loadingIndicatorSize = 'small',
  blurRadius = 0,
  fadeDuration = 300,
  ...props
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [imageUri, setImageUri] = useState<string>('');
  const [thumbnailUri, setThumbnailUri] = useState<string>('');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    loadImage();
  }, [source]);

  const loadImage = async () => {
    try {
      setLoading(true);
      setError(false);
      onLoadStart?.();

      if (typeof source === 'number') {
        // Local image
        setImageUri('');
        setLoading(false);
        onLoadEnd?.();
        return;
      }

      const uri = source.uri;
      if (!uri) {
        throw new Error('No image URI provided');
      }

      // Check cache first
      if (enableCaching && cacheKey) {
        const cachedUri = await cacheService.get<string>(`image:${cacheKey}`);
        if (cachedUri) {
          setImageUri(cachedUri);
          setLoading(false);
          onLoadEnd?.();
          animateImage();
          return;
        }
      }

      // Generate thumbnail if progressive loading is enabled
      if (enableProgressive) {
        const thumbnail = await generateThumbnail(uri);
        if (thumbnail) {
          setThumbnailUri(thumbnail);
        }
      }

      // Load full image
      await loadFullImage(uri);
    } catch (err) {
      console.error('Error loading image:', err);
      setError(true);
      onError?.(err);
      setLoading(false);
      onLoadEnd?.();
    }
  };

  const generateThumbnail = async (uri: string): Promise<string | null> => {
    try {
      // Create a thumbnail URL by adding query parameters
      // This is a simplified approach - in production, you'd use a proper image resizing service
      const thumbnailUri = `${uri}?w=${Math.min(width || 200, 200)}&h=${Math.min(height || 200, 200)}&q=60`;
      return thumbnailUri;
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      return null;
    }
  };

  const loadFullImage = async (uri: string) => {
    try {
      // Simulate loading delay for demonstration
      await new Promise(resolve => setTimeout(resolve, 100));

      // Cache the image URI
      if (enableCaching && cacheKey) {
        await cacheService.set(`image:${cacheKey}`, uri, 7 * 24 * 60 * 60 * 1000); // 7 days
      }

      setImageUri(uri);
      setLoading(false);
      onLoadEnd?.();
      animateImage();
    } catch (error) {
      throw error;
    }
  };

  const animateImage = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: fadeDuration,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const getImageStyle = (): ViewStyle | ImageStyle => {
    const baseStyle: ViewStyle | ImageStyle = {
      width: width || '100%',
      height: height || 200,
      borderRadius,
      ...style,
    };

    return baseStyle;
  };

  const renderLoadingIndicator = () => {
    if (!showLoadingIndicator || !loading) return null;

    return (
      <View style={[styles.loadingContainer, getImageStyle()]}>
        <ActivityIndicator
          size={loadingIndicatorSize}
          color={loadingIndicatorColor}
        />
      </View>
    );
  };

  const renderThumbnail = () => {
    if (!enableProgressive || !thumbnailUri || imageUri) return null;

    return (
      <FastImage
        source={{ uri: thumbnailUri, priority: FastImage.priority.high }}
        style={[styles.thumbnail, getImageStyle()]}
        resizeMode={FastImage.resizeMode.cover}
      />
    );
  };

  const renderImage = () => {
    if (error && fallback) {
      return (
        <FastImage
          source={{ uri: fallback }}
          style={getImageStyle()}
          resizeMode={resizeMode}
          onLoadEnd={onLoadEnd}
        />
      );
    }

    if (typeof source === 'number') {
      return (
        <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
          <Image
            source={source}
            style={getImageStyle()}
            resizeMode={resizeMode as any}
            onLoadEnd={onLoadEnd}
            {...props}
          />
        </Animated.View>
      );
    }

    if (!imageUri && !error) return null;

    return (
      <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
        <FastImage
          source={{ 
            uri: imageUri, 
            priority,
            cache: enableCaching ? FastImage.cacheControl.immutable : FastImage.cacheControl.web
          }}
          style={getImageStyle()}
          resizeMode={resizeMode}
          onLoadEnd={onLoadEnd}
          onError={onError}
          blurRadius={blurRadius}
          {...props}
        />
      </Animated.View>
    );
  };

  return (
    <View style={getImageStyle()}>
      {renderThumbnail()}
      {renderImage()}
      {renderLoadingIndicator()}
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  thumbnail: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});

export default OptimizedImage;
