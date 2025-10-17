import React from 'react';
import {
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  InputAdornment,
  IconButton,
  Box,
  Typography,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { Control, Controller, FieldError } from 'react-hook-form';

interface BaseFieldProps {
  name: string;
  control: Control<any>;
  error?: FieldError;
  label: string;
  required?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  helperText?: string;
}

interface TextFieldProps extends BaseFieldProps {
  type: 'text' | 'email' | 'password' | 'tel' | 'number';
  placeholder?: string;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  multiline?: boolean;
  rows?: number;
  showPasswordToggle?: boolean;
  showPassword?: boolean;
  onTogglePassword?: () => void;
  passwordStrength?: boolean;
  password?: string;
}

interface SelectFieldProps extends BaseFieldProps {
  type: 'select';
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}

type FormFieldProps = TextFieldProps | SelectFieldProps;

const FormField: React.FC<FormFieldProps> = (props) => {
  const {
    name,
    control,
    error,
    label,
    required = false,
    disabled = false,
    fullWidth = true,
    helperText,
  } = props;

  const renderTextField = (fieldProps: TextFieldProps) => {
    const {
      type,
      placeholder,
      startIcon,
      endIcon,
      multiline = false,
      rows,
      showPasswordToggle = false,
      showPassword = false,
      onTogglePassword,
      passwordStrength = false,
      password,
    } = fieldProps;

    const inputProps: any = {};

    if (startIcon) {
      inputProps.startAdornment = (
        <InputAdornment position="start">
          {startIcon}
        </InputAdornment>
      );
    }

    if (endIcon || showPasswordToggle) {
      inputProps.endAdornment = (
        <InputAdornment position="end">
          {showPasswordToggle ? (
            <IconButton
              aria-label="toggle password visibility"
              onClick={onTogglePassword}
              edge="end"
            >
              {showPassword ? <VisibilityOff /> : <Visibility />}
            </IconButton>
          ) : (
            endIcon
          )}
        </InputAdornment>
      );
    }

    return (
      <Box>
        <TextField
          {...control.register(name)}
          type={showPasswordToggle ? (showPassword ? 'text' : 'password') : type}
          label={label}
          placeholder={placeholder}
          error={!!error}
          helperText={error?.message || helperText}
          required={required}
          disabled={disabled}
          fullWidth={fullWidth}
          multiline={multiline}
          rows={rows}
          InputProps={inputProps}
        />
        {passwordStrength && password && (
          <Box sx={{ mt: 1 }}>
            {/* Password strength indicator will be added here */}
          </Box>
        )}
      </Box>
    );
  };

  const renderSelectField = (fieldProps: SelectFieldProps) => {
    const { options, placeholder } = fieldProps;

    return (
      <FormControl fullWidth={fullWidth} error={!!error} disabled={disabled}>
        <InputLabel required={required}>{label}</InputLabel>
        <Select
          {...control.register(name)}
          label={label}
          placeholder={placeholder}
        >
          {options.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
        {error && <FormHelperText>{error.message}</FormHelperText>}
        {helperText && !error && <FormHelperText>{helperText}</FormHelperText>}
      </FormControl>
    );
  };

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <Box>
          {props.type === 'select' ? renderSelectField(props as SelectFieldProps) : renderTextField(props as TextFieldProps)}
        </Box>
      )}
    />
  );
};

export default FormField;
