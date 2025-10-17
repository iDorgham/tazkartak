import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Link,
  Alert,
  InputAdornment,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  useTheme,
} from '@mui/material';
import {
  Email,
  Lock,
  Person,
  Phone,
  Visibility,
  VisibilityOff,
  PersonAdd,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { register } from '../../store/auth.slice';
import { VALIDATION_RULES, ERROR_MESSAGES, USER_ROLES } from '../../utils/constants';

interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
  confirmPassword: string;
  role: string;
}

const validationSchema = yup.object({
  firstName: yup
    .string()
    .required(ERROR_MESSAGES.REQUIRED)
    .matches(VALIDATION_RULES.NAME, ERROR_MESSAGES.INVALID_NAME),
  lastName: yup
    .string()
    .required(ERROR_MESSAGES.REQUIRED)
    .matches(VALIDATION_RULES.NAME, ERROR_MESSAGES.INVALID_NAME),
  email: yup
    .string()
    .required(ERROR_MESSAGES.REQUIRED)
    .matches(VALIDATION_RULES.EMAIL, ERROR_MESSAGES.INVALID_EMAIL),
  phone: yup
    .string()
    .matches(VALIDATION_RULES.PHONE, ERROR_MESSAGES.INVALID_PHONE),
  password: yup
    .string()
    .required(ERROR_MESSAGES.REQUIRED)
    .matches(VALIDATION_RULES.PASSWORD, ERROR_MESSAGES.INVALID_PASSWORD),
  confirmPassword: yup
    .string()
    .required(ERROR_MESSAGES.REQUIRED)
    .oneOf([yup.ref('password')], ERROR_MESSAGES.PASSWORD_MISMATCH),
  role: yup
    .string()
    .required(ERROR_MESSAGES.REQUIRED),
});

const Register: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { isLoading, error } = useSelector((state: RootState) => state.auth);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<RegisterFormData>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      role: USER_ROLES.ORGANIZER,
    },
    mode: 'onChange',
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const { confirmPassword, ...registerData } = data;
      const resultAction = await dispatch(register(registerData));
      
      if (register.fulfilled.match(resultAction)) {
        navigate(`/${resultAction.payload.user.role.toLowerCase()}/dashboard`, { replace: true });
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

  const roleOptions = [
    { value: USER_ROLES.ORGANIZER, label: 'Event Organizer' },
    { value: USER_ROLES.VENUE_OWNER, label: 'Venue Owner' },
    { value: USER_ROLES.BUYER, label: 'Ticket Buyer' },
  ];

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ width: '100%' }}>
      <Typography variant="h5" component="h2" gutterBottom align="center" sx={{ mb: 3 }}>
        Create Account
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Controller
          name="firstName"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label="First Name"
              error={!!errors.firstName}
              helperText={errors.firstName?.message}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person color="action" />
                  </InputAdornment>
                ),
              }}
            />
          )}
        />

        <Controller
          name="lastName"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label="Last Name"
              error={!!errors.lastName}
              helperText={errors.lastName?.message}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person color="action" />
                  </InputAdornment>
                ),
              }}
            />
          )}
        />
      </Box>

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
            sx={{ mb: 2 }}
          />
        )}
      />

      <Controller
        name="phone"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            fullWidth
            label="Phone Number (Optional)"
            error={!!errors.phone}
            helperText={errors.phone?.message}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Phone color="action" />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />
        )}
      />

      <Controller
        name="role"
        control={control}
        render={({ field }) => (
          <FormControl fullWidth error={!!errors.role} sx={{ mb: 2 }}>
            <InputLabel>Account Type</InputLabel>
            <Select
              {...field}
              label="Account Type"
            >
              {roleOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
            {errors.role && (
              <Typography variant="caption" color="error" sx={{ mt: 1, ml: 2 }}>
                {errors.role.message}
              </Typography>
            )}
          </FormControl>
        )}
      />

      <Controller
        name="password"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            fullWidth
            label="Password"
            type={showPassword ? 'text' : 'password'}
            error={!!errors.password}
            helperText={errors.password?.message}
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
            label="Confirm Password"
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
        startIcon={isLoading ? null : <PersonAdd />}
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
        {isLoading ? 'Creating Account...' : 'Create Account'}
      </Button>

      <Divider sx={{ my: 2 }}>
        <Typography variant="body2" color="text.secondary">
          OR
        </Typography>
      </Divider>

      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Already have an account?{' '}
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

export default Register;
