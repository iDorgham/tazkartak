import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, TextInput, Button, Card, useTheme, Chip } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import DateTimePicker from '@react-native-community/datetimepicker';
import { launchImageLibrary } from 'react-native-image-picker';

import { OrganizerStackParamList } from '@/navigation/OrganizerNavigator';
import { theme } from '@/config/theme';
import { CreateEventInput } from '@/types/event.types';
import { eventsService } from '@/services/events.service';

type CreateEventNavigationProp = StackNavigationProp<OrganizerStackParamList, 'CreateEvent'>;

interface EventFormData {
  title: string;
  description: string;
  category: string;
  startDate: Date;
  endDate: Date;
  venueId: string;
  imageUrl: string;
  maxAttendees: string;
  isPublic: boolean;
}

const CATEGORIES = [
  'music', 'sports', 'conference', 'workshop', 'exhibition', 
  'festival', 'networking', 'education', 'entertainment', 'other'
];

export const CreateEventScreen: React.FC = () => {
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    category: '',
    startDate: new Date(),
    endDate: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours later
    venueId: '',
    imageUrl: '',
    maxAttendees: '',
    isPublic: true,
  });

  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  
  const navigation = useNavigation<CreateEventNavigationProp>();
  const { colors } = useTheme();

  const totalSteps = 4;

  const handleInputChange = (field: keyof EventFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDateChange = (field: 'startDate' | 'endDate', event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setFormData(prev => ({ ...prev, [field]: selectedDate }));
    }
    
    if (field === 'startDate') {
      setShowStartDatePicker(false);
    } else {
      setShowEndDatePicker(false);
    }
  };

  const handleImagePicker = () => {
    const options = {
      mediaType: 'photo' as const,
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
    };

    launchImageLibrary(options, (response) => {
      if (response.assets && response.assets[0]) {
        // In a real implementation, you would upload the image to your server
        // and get back a URL
        setFormData(prev => ({ ...prev, imageUrl: response.assets![0].uri! }));
      }
    });
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return formData.title.trim().length > 0 && formData.category.length > 0;
      case 2:
        return formData.description.trim().length > 0;
      case 3:
        return formData.startDate < formData.endDate;
      case 4:
        return formData.maxAttendees.length > 0;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    } else {
      Alert.alert('Validation Error', 'Please fill in all required fields');
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const eventData: CreateEventInput = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        startDate: formData.startDate.toISOString(),
        endDate: formData.endDate.toISOString(),
        venueId: formData.venueId,
        imageUrl: formData.imageUrl,
        maxAttendees: parseInt(formData.maxAttendees),
        isPublic: formData.isPublic,
        status: 'draft',
      };

      const response = await eventsService.createEvent(eventData);
      
      Alert.alert(
        'Success',
        'Event created successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to create event. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {Array.from({ length: totalSteps }, (_, index) => (
        <View
          key={index}
          style={[
            styles.stepDot,
            {
              backgroundColor: index < currentStep 
                ? theme.colors.primary 
                : theme.colors.outline,
            },
          ]}
        />
      ))}
    </View>
  );

  const renderStep1 = () => (
    <Card style={styles.stepCard}>
      <Card.Content>
        <Text style={styles.stepTitle}>Basic Information</Text>
        
        <TextInput
          label="Event Title *"
          value={formData.title}
          onChangeText={(value) => handleInputChange('title', value)}
          mode="outlined"
          style={styles.input}
          placeholder="Enter event title"
        />

        <Text style={styles.categoryLabel}>Category *</Text>
        <View style={styles.categoryContainer}>
          {CATEGORIES.map((category) => (
            <Chip
              key={category}
              selected={formData.category === category}
              onPress={() => handleInputChange('category', category)}
              style={styles.categoryChip}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </Chip>
          ))}
        </View>

        <Button
          mode="outlined"
          onPress={handleImagePicker}
          style={styles.imageButton}
          icon="image"
        >
          {formData.imageUrl ? 'Change Image' : 'Add Event Image'}
        </Button>
      </Card.Content>
    </Card>
  );

  const renderStep2 = () => (
    <Card style={styles.stepCard}>
      <Card.Content>
        <Text style={styles.stepTitle}>Event Details</Text>
        
        <TextInput
          label="Description *"
          value={formData.description}
          onChangeText={(value) => handleInputChange('description', value)}
          mode="outlined"
          multiline
          numberOfLines={6}
          style={styles.input}
          placeholder="Describe your event..."
        />

        <TextInput
          label="Maximum Attendees *"
          value={formData.maxAttendees}
          onChangeText={(value) => handleInputChange('maxAttendees', value)}
          mode="outlined"
          keyboardType="numeric"
          style={styles.input}
          placeholder="e.g., 100"
        />
      </Card.Content>
    </Card>
  );

  const renderStep3 = () => (
    <Card style={styles.stepCard}>
      <Card.Content>
        <Text style={styles.stepTitle}>Date & Time</Text>
        
        <View style={styles.dateContainer}>
          <Text style={styles.dateLabel}>Start Date & Time *</Text>
          <Button
            mode="outlined"
            onPress={() => setShowStartDatePicker(true)}
            style={styles.dateButton}
          >
            {formatDate(formData.startDate)}
          </Button>
        </View>

        <View style={styles.dateContainer}>
          <Text style={styles.dateLabel}>End Date & Time *</Text>
          <Button
            mode="outlined"
            onPress={() => setShowEndDatePicker(true)}
            style={styles.dateButton}
          >
            {formatDate(formData.endDate)}
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  const renderStep4 = () => (
    <Card style={styles.stepCard}>
      <Card.Content>
        <Text style={styles.stepTitle}>Final Details</Text>
        
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Event Summary</Text>
          <Text style={styles.summaryItem}>Title: {formData.title}</Text>
          <Text style={styles.summaryItem}>Category: {formData.category}</Text>
          <Text style={styles.summaryItem}>Start: {formatDate(formData.startDate)}</Text>
          <Text style={styles.summaryItem}>End: {formatDate(formData.endDate)}</Text>
          <Text style={styles.summaryItem}>Max Attendees: {formData.maxAttendees}</Text>
        </View>
      </Card.Content>
    </Card>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      default:
        return renderStep1();
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {renderStepIndicator()}
        
        <Text style={styles.progressText}>
          Step {currentStep} of {totalSteps}
        </Text>

        {renderCurrentStep()}
      </ScrollView>

      <View style={styles.buttonContainer}>
        {currentStep > 1 && (
          <Button
            mode="outlined"
            onPress={handlePrevious}
            style={styles.button}
          >
            Previous
          </Button>
        )}
        
        {currentStep < totalSteps ? (
          <Button
            mode="contained"
            onPress={handleNext}
            style={[styles.button, styles.primaryButton]}
          >
            Next
          </Button>
        ) : (
          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={isLoading}
            disabled={isLoading}
            style={[styles.button, styles.primaryButton]}
          >
            Create Event
          </Button>
        )}
      </View>

      {/* Date Pickers */}
      {showStartDatePicker && (
        <DateTimePicker
          value={formData.startDate}
          mode="datetime"
          is24Hour={true}
          display="default"
          onChange={(event, selectedDate) => handleDateChange('startDate', event, selectedDate)}
        />
      )}

      {showEndDatePicker && (
        <DateTimePicker
          value={formData.endDate}
          mode="datetime"
          is24Hour={true}
          display="default"
          onChange={(event, selectedDate) => handleDateChange('endDate', event, selectedDate)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.md,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  progressText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.onSurface,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    fontWeight: theme.typography.fontWeight.semiBold,
  },
  stepCard: {
    elevation: 2,
    marginBottom: theme.spacing.lg,
  },
  stepTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.onSurface,
    marginBottom: theme.spacing.lg,
  },
  input: {
    marginBottom: theme.spacing.md,
  },
  categoryLabel: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.onSurface,
    marginBottom: theme.spacing.sm,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  categoryChip: {
    marginRight: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  imageButton: {
    marginTop: theme.spacing.md,
  },
  dateContainer: {
    marginBottom: theme.spacing.lg,
  },
  dateLabel: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.onSurface,
    marginBottom: theme.spacing.sm,
  },
  dateButton: {
    justifyContent: 'flex-start',
  },
  summaryContainer: {
    backgroundColor: theme.colors.surfaceVariant,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  summaryTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.onSurface,
    marginBottom: theme.spacing.md,
  },
  summaryItem: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.onSurface,
    marginBottom: theme.spacing.xs,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outline,
  },
  button: {
    flex: 1,
    marginHorizontal: theme.spacing.xs,
  },
  primaryButton: {
    marginLeft: theme.spacing.md,
  },
});
