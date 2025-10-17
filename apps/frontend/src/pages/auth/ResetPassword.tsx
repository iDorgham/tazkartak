import React, { useState } from 'react';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Link,
  Alert,
  InputAdornment,
  IconButton,
  useTheme,
} from '@mui/material';
import {
  Lock,
  Visibility,
  VisibilityOff,
  CheckCircle,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { resetPassword } from '../../store/auth.slice';
import { VALIDATION_RULES, ERROR_MESSAGES } from '../../utils/constants';

interface ResetPasswordFormData {
  password: string;
  confirmPassword: string;
}

const validationSchema = yup.object({
  password: yup
    .string()
    .required(ERROR_MESSAGES.REQUIRED)
    .matches(VALIDATION_RULES.PASSWORD, ERROR_MESSAGES.INVALID_PASSWORD),
  confirmPassword: yup
    .string()
    .required(ERROR_MESSAGES.REQUIRED)
    .oneOf([yup.ref('password')], ERROR_MESSAGES.PASSWORD_MISMATCH),
});

const ResetPassword: React.FC = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const { isLoading, error } = useSelector((state: RootState) => state.auth);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<ResetPasswordFormData>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
    mode: 'onChange',
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      return;
    }

    try {
      const resultAction = await dispatch(resetPassword({
        token,
        password: data.password,
      }));
      
      if (resetPassword.fulfilled.match(resultAction)) {
        setIsSuccess(true);
      }
    } catch (err) {
      // Error is handled by Redux
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  if (!token) {
    return (
      <Box sx={{ width: '100%' }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Invalid or missing reset token. Please request a new password reset link.
        </Alert>
        <Box sx={{ textAlign: 'center' }}>
          <Link
            component={RouterLink}
            to="/auth/forgot-password"
            variant="body2"
            sx={{ 
              textDecoration: 'none',
              fontWeight: 'bold',
              color: theme.palette.primary.main,
            }}
          >
            Request new reset link
          </Link>
        </Box>
      </Box>
    );
  }

  if (isSuccess) {
    return (
      <Box sx={{ width: '100%', textAlign: 'center' }}>
        <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
        <Typography variant="h5" component="h2" gutterBottom>
          Password Reset Successful
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Your password has been successfully reset. You can now sign in with your new password.
        </Typography>
        <Button
          component={RouterLink}
          to="/auth/login"
          variant="contained"
          fullWidth
          size="large"
          sx={{
            py: 1.5,
            fontSize: '1.1rem',
            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            '&:hover': {
              background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
            },
          }}
        >
          Sign In
        </Button>
      </Box>
    );
  }

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ width: '100%' }}>
      <Typography variant="h5" component="h2" gutterBottom align="center" sx={{ mb: 1 }}>
        Reset Password
      </Typography>
      
      <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
        Enter your new password below.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Controller
        name="password"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            fullWidth
            label="New Password"
            type={showPassword ? 'text' : 'password'}
            error={!!errors.password}
            helperText={errors.password?.message || 'Password must contain at least 8 characters, including uppercase, lowercase, number, and special character'}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock color="action" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={togglePasswordVisibility}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />
        )}
      />

      <Controller
        name="confirmPassword"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            fullWidth
            label="Confirm New Password"
            type={showConfirmPassword ? 'text' : 'password'}
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword?.message}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock color="action" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle confirm password visibility"
                    onClick={toggleConfirmPasswordVisibility}
                    edge="end"
                  >
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
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
        {isLoading ? 'Resetting Password...' : 'Reset Password'}
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
    </Box>
  );
};

export default ResetPassword;
