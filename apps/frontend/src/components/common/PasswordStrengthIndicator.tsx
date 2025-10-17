import React from 'react';
import {
  Box,
  LinearProgress,
  Typography,
  Chip,
  Stack,
} from '@mui/material';
import { checkPasswordStrength } from '../../utils/formValidation.util';

interface PasswordStrengthIndicatorProps {
  password: string;
  showFeedback?: boolean;
  minLength?: number;
}

const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
  showFeedback = true,
  minLength = 8,
}) => {
  const { score, feedback, isValid } = checkPasswordStrength(password);
  
  const getStrengthColor = (score: number): 'error' | 'warning' | 'info' | 'success' => {
    if (score < 2) return 'error';
    if (score < 3) return 'warning';
    if (score < 4) return 'info';
    return 'success';
  };

  const getStrengthText = (score: number): string => {
    if (score < 2) return 'Very Weak';
    if (score < 3) return 'Weak';
    if (score < 4) return 'Fair';
    if (score < 5) return 'Good';
    return 'Strong';
  };

  const getProgressValue = (score: number): number => {
    return (score / 5) * 100;
  };

  if (!password) {
    return null;
  }

  return (
    <Box sx={{ mt: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <LinearProgress
          variant="determinate"
          value={getProgressValue(score)}
          color={getStrengthColor(score)}
          sx={{
            flexGrow: 1,
            height: 6,
            borderRadius: 3,
          }}
        />
        <Typography
          variant="caption"
          color={`${getStrengthColor(score)}.main`}
          sx={{ minWidth: 60, textAlign: 'right' }}
        >
          {getStrengthText(score)}
        </Typography>
      </Box>
      
      {showFeedback && feedback.length > 0 && (
        <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
          {feedback.map((item, index) => (
            <Chip
              key={index}
              label={item}
              size="small"
              variant="outlined"
              color={getStrengthColor(score)}
              sx={{ fontSize: '0.7rem', height: 20 }}
            />
          ))}
        </Stack>
      )}
      
      {password.length > 0 && password.length < minLength && (
        <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
          Password must be at least {minLength} characters long
        </Typography>
      )}
    </Box>
  );
};

export default PasswordStrengthIndicator;
