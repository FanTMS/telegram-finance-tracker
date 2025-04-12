import React from 'react';
import { 
  Button as MuiButton, 
  ButtonProps as MuiButtonProps, 
  styled, 
  alpha, 
  CircularProgress 
} from '@mui/material';

export interface ButtonProps extends MuiButtonProps {
  rounded?: boolean;
  loading?: boolean;
  fullWidthOnMobile?: boolean;
}

const StyledButton = styled(MuiButton, {
  shouldForwardProp: (prop) => !['rounded', 'loading', 'fullWidthOnMobile'].includes(prop as string),
})<ButtonProps>(({ theme, rounded, fullWidthOnMobile }) => ({
  borderRadius: rounded ? '50px' : '12px',
  textTransform: 'none',
  boxShadow: 'none',
  transition: 'all 0.2s ease-in-out',
  padding: '10px 20px',
  minHeight: '48px', // Увеличенная высота для лучшего взаимодействия на мобильных
  touchAction: 'manipulation', // Улучшенное взаимодействие для сенсорных экранов
  fontWeight: 500,
  letterSpacing: '0.01em',
  position: 'relative',
  overflow: 'hidden',
  
  '&:active': {
    transform: 'scale(0.98)', // Легкая анимация при нажатии
    boxShadow: 'none',
  },
  
  // Мобильная адаптация
  [theme.breakpoints.down('sm')]: {
    fontSize: '0.95rem',
    padding: '12px 16px',
    ...(fullWidthOnMobile && {
      width: '100%',
    }),
  },
  
  // Улучшения для десктопной версии
  [theme.breakpoints.up('md')]: {
    fontSize: '1rem',
    fontWeight: 600,
    
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 8px rgba(0,0,0,0.08)',
    },
  },
  
  // Варианты размеров
  '&.MuiButton-sizeSmall': {
    padding: '6px 12px',
    fontSize: '0.875rem',
    minHeight: '36px',
    
    [theme.breakpoints.up('md')]: {
      padding: '8px 16px',
      minHeight: '40px',
    },
  },
  
  '&.MuiButton-sizeLarge': {
    padding: '14px 22px',
    fontSize: '1rem',
    minHeight: '56px',
    
    [theme.breakpoints.up('md')]: {
      padding: '16px 28px',
      fontSize: '1.125rem',
      minHeight: '64px',
    },
  },
  
  // Варианты цветов с улучшенными эффектами для desktop
  '&.MuiButton-containedPrimary': {
    backgroundImage: 'linear-gradient(145deg, #0088cc, #2AABEE)',
    '&:hover': {
      backgroundImage: 'linear-gradient(145deg, #0079b8, #1a9be0)',
      boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.25)}`,
    },
  },
  
  '&.MuiButton-containedSecondary': {
    backgroundImage: 'linear-gradient(145deg, #2AABEE, #5bbcf2)',
    '&:hover': {
      backgroundImage: 'linear-gradient(145deg, #1a9be0, #4aadea)',
      boxShadow: `0 4px 12px ${alpha(theme.palette.secondary.main, 0.25)}`,
    },
  },
  
  '&.MuiButton-outlined': {
    borderWidth: '1.5px',
    
    [theme.breakpoints.up('md')]: {
      '&:hover': {
        borderWidth: '1.5px',
        borderColor: theme.palette.primary.main,
        backgroundColor: alpha(theme.palette.primary.main, 0.04),
      },
    },
  },
  
  '&.MuiButton-outlinedPrimary': {
    [theme.breakpoints.up('md')]: {
      '&:hover': {
        boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`,
      },
    },
  },
  
  '&.MuiButton-text': {
    [theme.breakpoints.up('md')]: {
      '&:hover': {
        backgroundColor: alpha(theme.palette.primary.main, 0.08),
      },
    },
  },
  
  // Стили для состояния loading
  '&.Mui-disabled': {
    backgroundColor: theme.palette.action.disabledBackground,
    color: theme.palette.action.disabled,
    
    [theme.breakpoints.up('md')]: {
      '&:hover': {
        boxShadow: 'none',
        transform: 'none',
      },
    },
  },
}));

const LoadingIndicator = styled(CircularProgress)(({ theme }) => ({
  position: 'absolute',
  top: '50%',
  left: '50%',
  marginTop: '-12px',
  marginLeft: '-12px',
  color: theme.palette.primary.main,
}));

const Button: React.FC<ButtonProps> = ({ 
  children, 
  rounded = false, 
  loading = false,
  fullWidthOnMobile = false,
  disabled,
  ...props 
}) => {
  return (
    <StyledButton
      rounded={rounded}
      loading={loading}
      fullWidthOnMobile={fullWidthOnMobile}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <LoadingIndicator size={24} />}
      <span style={{ visibility: loading ? 'hidden' : 'visible' }}>
        {children}
      </span>
    </StyledButton>
  );
};

export default Button; 