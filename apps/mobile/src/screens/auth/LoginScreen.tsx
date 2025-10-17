import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, TextInput, Button, Card, useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useDispatch } from 'react-redux';

import { AuthStackParamList } from '@/navigation/AuthNavigator';
import { theme } from '@/config/theme';
import { login } from '@/store/auth.slice';
import { biometricService } from '@/services/biometric.service';

type LoginScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Login'>;

export const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const dispatch = useDispatch();
  const { colors } = useTheme();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      const resultAction = await dispatch(login({ email: email.trim(), password }));
      
      if (login.fulfilled.match(resultAction)) {
        // Login successful - navigation will be handled by RootNavigator
        console.log('Login successful');
      } else {
        const error = resultAction.payload as string;
        Alert.alert('Login Failed', error);
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    try {
      const isEnabled = await biometricService.isBiometricEnabled();
      if (!isEnabled) {
        Alert.alert(
          'Biometric Login Not Set Up',
          'Please enable biometric authentication in settings first.',
          [{ text: 'OK' }]
        );
        return;
      }

      const success = await biometricService.authenticateWithPrompt(
        'Use biometric authentication to login'
      );

      if (success) {
        // In a real implementation, you would retrieve stored credentials
        // and attempt login automatically
        Alert.alert('Success', 'Biometric authentication successful');
      }
    } catch (error) {
      Alert.alert('Error', 'Biometric authentication failed');
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  const handleRegister = () => {
    navigation.navigate('Register');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Card style={styles.card}>
        <Card.Content style={styles.content}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>

          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            style={styles.input}
            left={<TextInput.Icon icon="email" />}
          />

          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            mode="outlined"
            secureTextEntry={!showPassword}
            autoComplete="password"
            style={styles.input}
            left={<TextInput.Icon icon="lock" />}
            right={
              <TextInput.Icon
                icon={showPassword ? 'eye-off' : 'eye'}
                onPress={() => setShowPassword(!showPassword)}
              />
            }
          />

          <Button
            mode="contained"
            onPress={handleLogin}
            loading={isLoading}
            disabled={isLoading}
            style={styles.loginButton}
          >
            Sign In
          </Button>

          <Button
            mode="outlined"
            onPress={handleBiometricLogin}
            style={styles.biometricButton}
            icon="fingerprint"
          >
            Use Biometric
          </Button>

          <View style={styles.linkContainer}>
            <Button mode="text" onPress={handleForgotPassword}>
              Forgot Password?
            </Button>
          </View>

          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Don't have an account? </Text>
            <Button mode="text" onPress={handleRegister}>
              Sign Up
            </Button>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  card: {
    elevation: 4,
    borderRadius: theme.borderRadius.lg,
  },
  content: {
    padding: theme.spacing.xl,
  },
  title: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.onSurface,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.onSurface,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    opacity: 0.7,
  },
  input: {
    marginBottom: theme.spacing.md,
  },
  loginButton: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  biometricButton: {
    marginBottom: theme.spacing.lg,
  },
  linkContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  registerText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.onSurface,
  },
});