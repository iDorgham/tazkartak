import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Link,
  Alert,
  InputAdornment,
  useTheme,
} from '@mui/material';
import { Email, Send } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { forgotPassword } from '../../store/auth.slice';
import { VALIDATION_RULES, ERROR_MESSAGES } from '../../utils/constants';

interface ForgotPasswordFormData {
  email: string;
}

const validationSchema = yup.object({
  email: yup
    .string()
    .required(ERROR_MESSAGES.REQUIRED)
    .matches(VALIDATION_RULES.EMAIL, ERROR_MESSAGES.INVALID_EMAIL),
});

const ForgotPassword: React.FC = () => {
  const theme = useTheme();
  const dispatch = useDispatch();

  const { isLoading, error } = useSelector((state: RootState) => state.auth);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm<ForgotPasswordFormData>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      email: '',
    },
    mode: 'onChange',
  });

  const emailValue = watch('email');

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      await dispatch(forgotPassword(data.email));
    } catch (err) {
      // Error is handled by Redux
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ width: '100%' }}>
      <Typography variant="h5" component="h2" gutterBottom align="center" sx={{ mb: 1 }}>
        Forgot Password
      </Typography>
      
      <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
        Enter your email address and we'll send you a link to reset your password.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Controller
        name="email"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            fullWidth
            label="Email Address"
            type="email"
            error={!!errors.email}
            helperText={errors.email?.message}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Email color="action" />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 3 }}
          />
        )}
      />

      <Button
        type="submit"
        fullWidth
        variant="contained"
        size="large"
        disabled={!isValid || isLoading}
        startIcon={isLoading ? null : <Send />}
        sx={{
          mb: 3,
          py: 1.5,
          fontSize: '1.1rem',
          background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
          '&:hover': {
            background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
          },
        }}
      >
        {isLoading ? 'Sending...' : 'Send Reset Link'}
      </Button>

      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Remember your password?{' '}
          <Link
            component={RouterLink}
            to="/auth/login"
            variant="body2"
            sx={{ 
              textDecoration: 'none',
              fontWeight: 'bold',
              color: theme.palette.primary.main,
            }}
          >
            Sign in here
          </Link>
        </Typography>
      </Box>

      {emailValue && !error && (
        <Alert severity="info" sx={{ mt: 2 }}>
          If an account with the email "{emailValue}" exists, you will receive a password reset link shortly.
        </Alert>
      )}
    </Box>
  );
};

export default ForgotPassword;
