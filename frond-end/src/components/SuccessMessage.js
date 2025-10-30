import React from 'react';
import PropTypes from 'prop-types';
import { 
  Box, 
  Typography, 
  CheckCircleIcon,
  Paper,
  Button
} from '@mui/material';
import { CheckCircle } from '@mui/icons-material';

const SuccessMessage = ({ 
  title, 
  message, 
  actionText, 
  onAction, 
  secondaryText,
  onSecondaryAction 
}) => {
  return (
    <Paper 
      elevation={3}
      sx={{ 
        p: 4, 
        textAlign: 'center',
        borderRadius: 2,
        maxWidth: 400,
        mx: 'auto'
      }}
    >
      <Box mb={3}>
        <CheckCircle 
          sx={{ 
            fontSize: 64, 
            color: 'success.main',
            mb: 2
          }} 
        />
        <Typography variant="h5" color="success.main" fontWeight="bold" gutterBottom>
          {title}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {message}
        </Typography>
      </Box>

      {actionText && onAction && (
        <Box mb={2}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            fullWidth
            onClick={onAction}
          >
            {actionText}
          </Button>
        </Box>
      )}

      {secondaryText && onSecondaryAction && (
        <Box>
          <Button
            variant="text"
            color="primary"
            onClick={onSecondaryAction}
            sx={{ textDecoration: 'underline' }}
          >
            {secondaryText}
          </Button>
        </Box>
      )}
    </Paper>
  );
};

SuccessMessage.propTypes = {
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  actionText: PropTypes.string,
  onAction: PropTypes.func,
  secondaryText: PropTypes.string,
  onSecondaryAction: PropTypes.func
};

export default SuccessMessage;




