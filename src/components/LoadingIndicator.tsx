import React from 'react';
import { Box, Typography, CircularProgress, useTheme, alpha } from '@mui/material';
import { motion } from 'framer-motion';

interface LoadingIndicatorProps {
  message?: string;
  fullHeight?: boolean;
  size?: 'small' | 'medium' | 'large';
  color?: string;
  withBackground?: boolean;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  message = 'Загрузка...',
  fullHeight = false,
  size = 'medium',
  color,
  withBackground = false,
}) => {
  const theme = useTheme();
  
  const primaryColor = color || theme.palette.primary.main;
  
  const getSizeValue = () => {
    switch (size) {
      case 'small':
        return { spinner: 32, fontSize: '0.875rem' };
      case 'large':
        return { spinner: 60, fontSize: '1.25rem' };
      case 'medium':
      default:
        return { spinner: 44, fontSize: '1rem' };
    }
  };
  
  const sizeValues = getSizeValue();
  
  const containerVariants = {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1,
      transition: { duration: 0.4 }
    },
    exit: { 
      opacity: 0,
      transition: { duration: 0.3 }
    }
  };
  
  const dotVariants = {
    initial: { y: 0 },
    animate: { 
      y: [0, -10, 0],
      transition: {
        repeat: Infinity,
        repeatType: "loop",
        duration: 1,
        ease: "easeInOut",
      }
    }
  };
  
  const pulseVariants = {
    initial: { scale: 0.8, opacity: 0.3 },
    animate: { 
      scale: [0.8, 1.2, 0.8],
      opacity: [0.3, 0.6, 0.3],
      transition: {
        repeat: Infinity,
        repeatType: "loop",
        duration: 2,
        ease: "easeInOut",
      }
    }
  };

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={containerVariants}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: fullHeight ? '50vh' : 'auto',
        padding: '24px',
        width: '100%',
        position: 'relative',
      }}
    >
      {withBackground && (
        <motion.div
          variants={pulseVariants}
          style={{
            position: 'absolute',
            width: sizeValues.spinner * 2.5,
            height: sizeValues.spinner * 2.5,
            borderRadius: '50%',
            backgroundColor: alpha(primaryColor, 0.1),
            zIndex: 0,
          }}
        />
      )}
      
      <Box sx={{ position: 'relative' }}>
        <CircularProgress 
          size={sizeValues.spinner} 
          thickness={4} 
          sx={{ 
            color: primaryColor,
            position: 'relative',
            zIndex: 1,
          }} 
        />
        
        <Box 
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <motion.div
            initial="initial"
            animate="animate"
            variants={pulseVariants}
          >
            <Box 
              sx={{ 
                width: sizeValues.spinner * 0.4, 
                height: sizeValues.spinner * 0.4, 
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${primaryColor}, ${alpha(primaryColor, 0.7)})`,
                boxShadow: `0 0 10px ${alpha(primaryColor, 0.5)}`,
              }} 
            />
          </motion.div>
        </Box>
      </Box>
      
      {message && (
        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
          <Typography 
            variant="body1" 
            color="text.secondary" 
            sx={{ 
              fontWeight: 500,
              fontSize: sizeValues.fontSize,
              mr: 0.5,
            }}
          >
            {message}
          </Typography>
          
          <Box sx={{ display: 'flex', ml: 0.5 }}>
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                variants={dotVariants}
                initial="initial"
                animate="animate"
                custom={i}
                style={{ 
                  display: 'inline-block',
                  width: '4px',
                  height: '4px',
                  margin: '0 2px',
                  borderRadius: '50%',
                  backgroundColor: theme.palette.text.secondary,
                  animationDelay: `${i * 0.2}s`
                }}
              />
            ))}
          </Box>
        </Box>
      )}
    </motion.div>
  );
};

export default LoadingIndicator; 