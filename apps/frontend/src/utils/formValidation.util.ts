import * as yup from 'yup';
import { VALIDATION_RULES, ERROR_MESSAGES } from './constants';

// Common validation schemas
export const emailValidation = yup
  .string()
  .required(ERROR_MESSAGES.REQUIRED)
  .matches(VALIDATION_RULES.EMAIL, ERROR_MESSAGES.INVALID_EMAIL);

export const passwordValidation = yup
  .string()
  .required(ERROR_MESSAGES.REQUIRED)
  .matches(VALIDATION_RULES.PASSWORD, ERROR_MESSAGES.INVALID_PASSWORD);

export const nameValidation = yup
  .string()
  .required(ERROR_MESSAGES.REQUIRED)
  .matches(VALIDATION_RULES.NAME, ERROR_MESSAGES.INVALID_NAME);

export const phoneValidation = yup
  .string()
  .matches(VALIDATION_RULES.PHONE, ERROR_MESSAGES.INVALID_PHONE);

export const confirmPasswordValidation = yup
  .string()
  .required(ERROR_MESSAGES.REQUIRED)
  .oneOf([yup.ref('password')], ERROR_MESSAGES.PASSWORD_MISMATCH);

// Form validation schemas
export const loginValidationSchema = yup.object({
  email: emailValidation,
  password: yup.string().required(ERROR_MESSAGES.REQUIRED),
  rememberMe: yup.boolean(),
});

export const registerValidationSchema = yup.object({
  firstName: nameValidation,
  lastName: nameValidation,
  email: emailValidation,
  phone: phoneValidation,
  password: passwordValidation,
  confirmPassword: confirmPasswordValidation,
  role: yup.string().required(ERROR_MESSAGES.REQUIRED),
});

export const forgotPasswordValidationSchema = yup.object({
  email: emailValidation,
});

export const resetPasswordValidationSchema = yup.object({
  password: passwordValidation,
  confirmPassword: confirmPasswordValidation,
});

export const changePasswordValidationSchema = yup.object({
  currentPassword: yup.string().required(ERROR_MESSAGES.REQUIRED),
  newPassword: passwordValidation,
  confirmPassword: yup
    .string()
    .required(ERROR_MESSAGES.REQUIRED)
    .oneOf([yup.ref('newPassword')], ERROR_MESSAGES.PASSWORD_MISMATCH),
});

export const updateProfileValidationSchema = yup.object({
  firstName: nameValidation,
  lastName: nameValidation,
  phone: phoneValidation,
  email: emailValidation,
});

// Password strength checker
export const checkPasswordStrength = (password: string): {
  score: number;
  feedback: string[];
  isValid: boolean;
} => {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('At least 8 characters');
  }

  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('One lowercase letter');
  }

  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('One uppercase letter');
  }

  if (/\d/.test(password)) {
    score += 1;
  } else {
    feedback.push('One number');
  }

  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    score += 1;
  } else {
    feedback.push('One special character');
  }

  return {
    score,
    feedback,
    isValid: score >= 4,
  };
};

// Real-time validation helpers
export const validateEmail = (email: string): boolean => {
  return VALIDATION_RULES.EMAIL.test(email);
};

export const validatePhone = (phone: string): boolean => {
  return VALIDATION_RULES.PHONE.test(phone);
};

export const validateName = (name: string): boolean => {
  return VALIDATION_RULES.NAME.test(name);
};

// Form field validation helpers
export const getFieldError = (errors: any, fieldName: string): string | undefined => {
  return errors[fieldName]?.message;
};

export const hasFieldError = (errors: any, fieldName: string): boolean => {
  return !!errors[fieldName];
};

// Debounced validation for real-time feedback
export const createDebouncedValidator = (validator: (value: string) => boolean, delay: number = 300) => {
  let timeoutId: NodeJS.Timeout;
  
  return (value: string, callback: (isValid: boolean) => void) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      callback(validator(value));
    }, delay);
  };
};

// Form submission helpers
export const handleFormError = (error: any): string => {
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  if (error?.response?.data?.errors && Array.isArray(error.response.data.errors)) {
    return error.response.data.errors.join(', ');
  }
  if (error?.message) {
    return error.message;
  }
  return ERROR_MESSAGES.SERVER_ERROR;
};

export const isFormValid = (errors: any): boolean => {
  return Object.keys(errors).length === 0;
};

// Password visibility toggle helper
export const createPasswordToggle = (initialState: boolean = false) => {
  const [showPassword, setShowPassword] = useState(initialState);
  
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  return {
    showPassword,
    togglePasswordVisibility,
  };
};

// Import useState for the password toggle helper
import { useState } from 'react';
