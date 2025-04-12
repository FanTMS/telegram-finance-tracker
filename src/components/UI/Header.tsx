import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

const Header: React.FC<HeaderProps> = ({ title, subtitle }) => {
  const theme = useTheme();
  
  return (
    <Box sx={{ mb: 3 }}>
      <Typography 
        variant="h5" 
        component="h1" 
        sx={{ 
          fontWeight: 600,
          mb: subtitle ? 0.5 : 0
        }}
      >
        {title}
      </Typography>
      
      {subtitle && (
        <Typography 
          variant="body2" 
          color="text.secondary"
        >
          {subtitle}
        </Typography>
      )}
    </Box>
  );
};

export default Header; 