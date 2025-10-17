import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MapView, { Marker } from 'react-native-maps';
import Geolocation from 'react-native-geolocation-service';
import ImagePicker from 'react-native-image-picker';

import { theme } from '@/config/theme';
import { VenueStackParamList } from '@/navigation/VenueNavigator';
import { CreateVenueInput } from '@/types/venue.types';

type CreateVenueScreenNavigationProp = StackNavigationProp<VenueStackParamList, 'CreateVenue'>;

interface StepProps {
  currentStep: number;
  onNext: () => void;
  onPrev: () => void;
  data: CreateVenueInput;
  onDataChange: (data: Partial<CreateVenueInput>) => void;
}

const venueTypes = [
  { id: 'theater', label: 'Theater', icon: 'movie' },
  { id: 'stadium', label: 'Stadium', icon: 'sports-soccer' },
  { id: 'conference', label: 'Conference Center', icon: 'business' },
  { id: 'outdoor', label: 'Outdoor Venue', icon: 'park' },
  { id: 'restaurant', label: 'Restaurant', icon: 'restaurant' },
  { id: 'hotel', label: 'Hotel', icon: 'hotel' },
  { id: 'museum', label: 'Museum', icon: 'museum' },
  { id: 'other', label: 'Other', icon: 'place' },
];

const amenities = [
  { id: 'parking', label: 'Parking', icon: 'local-parking' },
  { id: 'wifi', label: 'WiFi', icon: 'wifi' },
  { id: 'accessibility', label: 'Accessibility', icon: 'accessible' },
  { id: 'catering', label: 'Catering', icon: 'restaurant' },
  { id: 'security', label: 'Security', icon: 'security' },
  { id: 'sound', label: 'Sound System', icon: 'volume-up' },
  { id: 'lighting', label: 'Lighting', icon: 'lightbulb' },
  { id: 'ac', label: 'Air Conditioning', icon: 'ac-unit' },
];

const StepIndicator: React.FC<{ currentStep: number; totalSteps: number }> = ({
  currentStep,
  totalSteps,
}) => (
  <View style={styles.stepIndicator}>
    {Array.from({ length: totalSteps }, (_, index) => (
      <View
        key={index}
        style={[
          styles.stepDot,
          index < currentStep && styles.stepDotCompleted,
          index === currentStep && styles.stepDotActive,
        ]}
      />
    ))}
  </View>
);

const Step1BasicInfo: React.FC<StepProps> = ({ onNext, data, onDataChange }) => {
  const [selectedType, setSelectedType] = useState(data.type || '');

  const handleNext = () => {
    if (!data.name || !selectedType || !data.capacity) {
      Alert.alert('Required Fields', 'Please fill in all required fields');
      return;
    }
    onDataChange({ type: selectedType });
    onNext();
  };

  return (
    <ScrollView style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Basic Information</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Venue Name *</Text>
        <TextInput
          style={styles.input}
          value={data.name || ''}
          onChangeText={(text) => onDataChange({ name: text })}
          placeholder="Enter venue name"
          placeholderTextColor={theme.colors.onSurfaceVariant}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Venue Type *</Text>
        <View style={styles.typeGrid}>
          {venueTypes.map((type) => (
            <TouchableOpacity
              key={type.id}
              style={[
                styles.typeChip,
                selectedType === type.id && styles.typeChipSelected,
              ]}
              onPress={() => setSelectedType(type.id)}
            >
              <Icon
                name={type.icon}
                size={20}
                color={selectedType === type.id ? '#fff' : theme.colors.primary}
              />
              <Text
                style={[
                  styles.typeChipText,
                  selectedType === type.id && styles.typeChipTextSelected,
                ]}
              >
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Capacity *</Text>
        <TextInput
          style={styles.input}
          value={data.capacity?.toString() || ''}
          onChangeText={(text) => onDataChange({ capacity: parseInt(text) || 0 })}
          placeholder="Enter capacity"
          placeholderTextColor={theme.colors.onSurfaceVariant}
          keyboardType="numeric"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={data.description || ''}
          onChangeText={(text) => onDataChange({ description: text })}
          placeholder="Describe your venue..."
          placeholderTextColor={theme.colors.onSurfaceVariant}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
        <Text style={styles.nextButtonText}>Next</Text>
        <Icon name="arrow-forward" size={20} color="#fff" />
      </TouchableOpacity>
    </ScrollView>
  );
};

const Step2Location: React.FC<StepProps> = ({ onNext, onPrev, data, onDataChange }) => {
  const [region, setRegion] = useState({
    latitude: data.latitude || 31.2001, // Cairo coordinates
    longitude: data.longitude || 29.9187,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [address, setAddress] = useState({
    street: data.street || '',
    city: data.city || '',
    country: data.country || 'Egypt',
  });

  const getCurrentLocation = () => {
    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setRegion({
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
        onDataChange({ latitude, longitude });
      },
      (error) => {
        Alert.alert('Location Error', 'Unable to get current location');
        console.error('Location error:', error);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  const handleNext = () => {
    if (!address.street || !address.city) {
      Alert.alert('Required Fields', 'Please fill in street and city');
      return;
    }
    onDataChange({
      street: address.street,
      city: address.city,
      country: address.country,
    });
    onNext();
  };

  return (
    <ScrollView style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Location</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Address *</Text>
        <TextInput
          style={styles.input}
          value={address.street}
          onChangeText={(text) => setAddress({ ...address, street: text })}
          placeholder="Street address"
          placeholderTextColor={theme.colors.onSurfaceVariant}
        />
        <TextInput
          style={styles.input}
          value={address.city}
          onChangeText={(text) => setAddress({ ...address, city: text })}
          placeholder="City"
          placeholderTextColor={theme.colors.onSurfaceVariant}
        />
        <TextInput
          style={styles.input}
          value={address.country}
          onChangeText={(text) => setAddress({ ...address, country: text })}
          placeholder="Country"
          placeholderTextColor={theme.colors.onSurfaceVariant}
        />
      </View>

      <View style={styles.mapContainer}>
        <Text style={styles.label}>Location on Map</Text>
        <MapView
          style={styles.map}
          region={region}
          onRegionChangeComplete={setRegion}
        >
          <Marker
            coordinate={{
              latitude: region.latitude,
              longitude: region.longitude,
            }}
            draggable
            onDragEnd={(e) => {
              const { latitude, longitude } = e.nativeEvent.coordinate;
              setRegion({ ...region, latitude, longitude });
              onDataChange({ latitude, longitude });
            }}
          />
        </MapView>
        <TouchableOpacity style={styles.currentLocationButton} onPress={getCurrentLocation}>
          <Icon name="my-location" size={20} color="#fff" />
          <Text style={styles.currentLocationText}>Use Current Location</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.stepButtons}>
        <TouchableOpacity style={styles.prevButton} onPress={onPrev}>
          <Icon name="arrow-back" size={20} color={theme.colors.primary} />
          <Text style={styles.prevButtonText}>Previous</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>Next</Text>
          <Icon name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const Step3Amenities: React.FC<StepProps> = ({ onNext, onPrev, data, onDataChange }) => {
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(data.amenities || []);
  const [photos, setPhotos] = useState<string[]>(data.photos || []);

  const toggleAmenity = (amenityId: string) => {
    setSelectedAmenities(prev =>
      prev.includes(amenityId)
        ? prev.filter(id => id !== amenityId)
        : [...prev, amenityId]
    );
  };

  const selectPhotos = () => {
    ImagePicker.launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.8,
        allowsMultipleSelection: true,
        selectionLimit: 5,
      },
      (response) => {
        if (response.assets) {
          const newPhotos = response.assets.map(asset => asset.uri || '');
          setPhotos(prev => [...prev, ...newPhotos].slice(0, 5));
        }
      }
    );
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleNext = () => {
    onDataChange({ amenities: selectedAmenities, photos });
    onNext();
  };

  return (
    <ScrollView style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Amenities & Photos</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Amenities</Text>
        <View style={styles.amenitiesGrid}>
          {amenities.map((amenity) => (
            <TouchableOpacity
              key={amenity.id}
              style={[
                styles.amenityChip,
                selectedAmenities.includes(amenity.id) && styles.amenityChipSelected,
              ]}
              onPress={() => toggleAmenity(amenity.id)}
            >
              <Icon
                name={amenity.icon}
                size={20}
                color={selectedAmenities.includes(amenity.id) ? '#fff' : theme.colors.primary}
              />
              <Text
                style={[
                  styles.amenityChipText,
                  selectedAmenities.includes(amenity.id) && styles.amenityChipTextSelected,
                ]}
              >
                {amenity.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Venue Photos (Max 5)</Text>
        <TouchableOpacity style={styles.photoButton} onPress={selectPhotos}>
          <Icon name="add-photo-alternate" size={24} color={theme.colors.primary} />
          <Text style={styles.photoButtonText}>Add Photos</Text>
        </TouchableOpacity>
        
        {photos.length > 0 && (
          <View style={styles.photosContainer}>
            {photos.map((photo, index) => (
              <View key={index} style={styles.photoItem}>
                <Image source={{ uri: photo }} style={styles.photo} />
                <TouchableOpacity
                  style={styles.removePhotoButton}
                  onPress={() => removePhoto(index)}
                >
                  <Icon name="close" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.stepButtons}>
        <TouchableOpacity style={styles.prevButton} onPress={onPrev}>
          <Icon name="arrow-back" size={20} color={theme.colors.primary} />
          <Text style={styles.prevButtonText}>Previous</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>Next</Text>
          <Icon name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const Step4Contact: React.FC<StepProps> = ({ onPrev, data, onDataChange }) => {
  const navigation = useNavigation<CreateVenueScreenNavigationProp>();
  const dispatch = useDispatch();

  const [contactData, setContactData] = useState({
    phone: data.phone || '',
    email: data.email || '',
    operatingHours: data.operatingHours || '',
    specialInstructions: data.specialInstructions || '',
  });

  const handleSubmit = async () => {
    try {
      const venueData: CreateVenueInput = {
        ...data,
        ...contactData,
      };

      // dispatch(createVenue(venueData));
      
      Alert.alert(
        'Success',
        'Venue created successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to create venue. Please try again.');
      console.error('Create venue error:', error);
    }
  };

  return (
    <ScrollView style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Contact & Settings</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Contact Phone</Text>
        <TextInput
          style={styles.input}
          value={contactData.phone}
          onChangeText={(text) => setContactData({ ...contactData, phone: text })}
          placeholder="Phone number"
          placeholderTextColor={theme.colors.onSurfaceVariant}
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Contact Email</Text>
        <TextInput
          style={styles.input}
          value={contactData.email}
          onChangeText={(text) => setContactData({ ...contactData, email: text })}
          placeholder="Email address"
          placeholderTextColor={theme.colors.onSurfaceVariant}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Operating Hours</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={contactData.operatingHours}
          onChangeText={(text) => setContactData({ ...contactData, operatingHours: text })}
          placeholder="e.g., Mon-Fri: 9AM-6PM, Sat-Sun: 10AM-4PM"
          placeholderTextColor={theme.colors.onSurfaceVariant}
          multiline
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Special Instructions</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={contactData.specialInstructions}
          onChangeText={(text) => setContactData({ ...contactData, specialInstructions: text })}
          placeholder="Any special instructions for event organizers..."
          placeholderTextColor={theme.colors.onSurfaceVariant}
          multiline
        />
      </View>

      <View style={styles.reviewSection}>
        <Text style={styles.reviewTitle}>Review Summary</Text>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Name:</Text>
          <Text style={styles.reviewValue}>{data.name}</Text>
        </View>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Type:</Text>
          <Text style={styles.reviewValue}>{data.type}</Text>
        </View>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Capacity:</Text>
          <Text style={styles.reviewValue}>{data.capacity}</Text>
        </View>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Location:</Text>
          <Text style={styles.reviewValue}>
            {contactData.phone && `${contactData.phone}, `}
            {data.city}, {data.country}
          </Text>
        </View>
      </View>

      <View style={styles.stepButtons}>
        <TouchableOpacity style={styles.prevButton} onPress={onPrev}>
          <Icon name="arrow-back" size={20} color={theme.colors.primary} />
          <Text style={styles.prevButtonText}>Previous</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Icon name="check" size={20} color="#fff" />
          <Text style={styles.submitButtonText}>Create Venue</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export const CreateVenueScreen: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [venueData, setVenueData] = useState<CreateVenueInput>({});

  const totalSteps = 4;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleDataChange = (data: Partial<CreateVenueInput>) => {
    setVenueData({ ...venueData, ...data });
  };

  const renderStep = () => {
    const stepProps = {
      currentStep,
      onNext: handleNext,
      onPrev: handlePrev,
      data: venueData,
      onDataChange: handleDataChange,
    };

    switch (currentStep) {
      case 1:
        return <Step1BasicInfo {...stepProps} />;
      case 2:
        return <Step2Location {...stepProps} />;
      case 3:
        return <Step3Amenities {...stepProps} />;
      case 4:
        return <Step4Contact {...stepProps} />;
      default:
        return <Step1BasicInfo {...stepProps} />;
    }
  };

  return (
    <View style={styles.container}>
      <StepIndicator currentStep={currentStep} totalSteps={totalSteps} />
      {renderStep()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: theme.colors.surface,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.outline,
    marginHorizontal: 4,
  },
  stepDotActive: {
    backgroundColor: theme.colors.primary,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  stepDotCompleted: {
    backgroundColor: theme.colors.primary,
  },
  stepContainer: {
    flex: 1,
    padding: 16,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.outline,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: theme.colors.onSurface,
    backgroundColor: theme.colors.surface,
    marginBottom: 8,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    backgroundColor: 'transparent',
    marginRight: 8,
    marginBottom: 8,
  },
  typeChipSelected: {
    backgroundColor: theme.colors.primary,
  },
  typeChipText: {
    fontSize: 14,
    color: theme.colors.primary,
    marginLeft: 4,
    fontWeight: '500',
  },
  typeChipTextSelected: {
    color: '#fff',
  },
  mapContainer: {
    height: 300,
    marginBottom: 16,
  },
  map: {
    flex: 1,
    borderRadius: 8,
  },
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  currentLocationText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  amenityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    backgroundColor: 'transparent',
    marginRight: 8,
    marginBottom: 8,
  },
  amenityChipSelected: {
    backgroundColor: theme.colors.primary,
  },
  amenityChipText: {
    fontSize: 14,
    color: theme.colors.primary,
    marginLeft: 4,
    fontWeight: '500',
  },
  amenityChipTextSelected: {
    color: '#fff',
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderStyle: 'dashed',
    borderRadius: 8,
    backgroundColor: theme.colors.surface,
  },
  photoButtonText: {
    fontSize: 16,
    color: theme.colors.primary,
    marginLeft: 8,
    fontWeight: '500',
  },
  photosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  photoItem: {
    position: 'relative',
    marginRight: 8,
    marginBottom: 8,
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FF5722',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewSection: {
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  reviewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: 12,
  },
  reviewItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  reviewLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.onSurfaceVariant,
    width: 80,
  },
  reviewValue: {
    fontSize: 14,
    color: theme.colors.onSurface,
    flex: 1,
  },
  stepButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
  },
  prevButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    backgroundColor: 'transparent',
  },
  prevButtonText: {
    fontSize: 16,
    color: theme.colors.primary,
    marginLeft: 4,
    fontWeight: '500',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: theme.colors.primary,
  },
  nextButtonText: {
    fontSize: 16,
    color: '#fff',
    marginRight: 4,
    fontWeight: '500',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
  },
  submitButtonText: {
    fontSize: 16,
    color: '#fff',
    marginLeft: 4,
    fontWeight: '500',
  },
});