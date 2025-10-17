import React from 'react';
import {
  Alert,
  AlertTitle,
  Collapse,
  IconButton,
  Box,
  Typography,
} from '@mui/material';
import { Close, Error, Warning, Info } from '@mui/icons-material';

export interface FormError {
  message: string;
  type?: 'error' | 'warning' | 'info';
  details?: string;
  code?: string;
}

interface FormErrorHandlerProps {
  error: FormError | string | null;
  onClose?: () => void;
  showDetails?: boolean;
  variant?: 'filled' | 'outlined' | 'standard';
}

const FormErrorHandler: React.FC<FormErrorHandlerProps> = ({
  error,
  onClose,
  showDetails = false,
  variant = 'filled',
}) => {
  if (!error) {
    return null;
  }

  const normalizeError = (error: FormError | string): FormError => {
    if (typeof error === 'string') {
      return {
        message: error,
        type: 'error',
      };
    }
    return error;
  };

  const normalizedError = normalizeError(error);
  const { message, type = 'error', details, code } = normalizedError;

  const getSeverity = (type: string): 'error' | 'warning' | 'info' => {
    switch (type) {
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      default:
        return 'error';
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <Warning />;
      case 'info':
        return <Info />;
      default:
        return <Error />;
    }
  };

  return (
    <Collapse in={!!error}>
      <Alert
        severity={getSeverity(type)}
        variant={variant}
        icon={getIcon(type)}
        action={
          onClose && (
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={onClose}
            >
              <Close fontSize="inherit" />
            </IconButton>
          )
        }
        sx={{ mb: 2 }}
      >
        {code && (
          <AlertTitle>
            Error {code}
          </AlertTitle>
        )}
        <Typography variant="body2">
          {message}
        </Typography>
        {showDetails && details && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="caption" color="text.secondary">
              {details}
            </Typography>
          </Box>
        )}
      </Alert>
    </Collapse>
  );
};

// Helper function to parse API errors
export const parseApiError = (error: any): FormError => {
  // Handle different error formats
  if (error?.response?.data?.message) {
    return {
      message: error.response.data.message,
      type: 'error',
      code: error.response.status?.toString(),
      details: error.response.data.details,
    };
  }

  if (error?.response?.data?.errors && Array.isArray(error.response.data.errors)) {
    return {
      message: error.response.data.errors.join(', '),
      type: 'error',
      code: error.response.status?.toString(),
    };
  }

  if (error?.message) {
    return {
      message: error.message,
      type: 'error',
    };
  }

  if (typeof error === 'string') {
    return {
      message: error,
      type: 'error',
    };
  }

  return {
    message: 'An unexpected error occurred',
    type: 'error',
  };
};

// Helper function to group multiple errors
export const groupErrors = (errors: FormError[]): FormError => {
  if (errors.length === 0) {
    return {
      message: 'No errors',
      type: 'info',
    };
  }

  if (errors.length === 1) {
    return errors[0];
  }

  const errorTypes = [...new Set(errors.map(e => e.type))];
  const primaryType = errorTypes.includes('error') ? 'error' : 
                     errorTypes.includes('warning') ? 'warning' : 'info';

  return {
    message: `${errors.length} errors occurred`,
    type: primaryType,
    details: errors.map(e => e.message).join('\n'),
  };
};

export default FormErrorHandler;
