import React, { useState, useEffect } from 'react';
import { styled, keyframes } from '@mui/material/styles';
import { Box, useTheme, alpha } from '@mui/material';
import { 
  CheckCircleOutline as SuccessIcon,
  ErrorOutline as ErrorIcon,
  InfoOutlined as InfoIcon,
  Replay as LoadingIcon
} from '@mui/icons-material';

export type FeedbackType = 'success' | 'error' | 'info' | 'loading';

export interface FeedbackProps {
  type?: FeedbackType;
  message?: string;
  icon?: React.ReactNode;
  visible?: boolean;
  duration?: number;
  size?: 'small' | 'medium' | 'large';
  withBackground?: boolean;
  onComplete?: () => void;
}

// Анимация появления
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
`;

// Анимация исчезновения
const fadeOut = keyframes`
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.8);
  }
`;

// Анимация вращения для индикатора загрузки
const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

// Анимация пульсации для успешного статуса
const pulse = keyframes`
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
`;

const FeedbackContainer = styled(Box, {
  shouldForwardProp: (prop) => 
    !['visible', 'withBackground', 'feedbackType', 'size'].includes(prop as string),
})<{ 
  visible: boolean; 
  withBackground: boolean; 
  feedbackType: FeedbackType;
  size: string;
}>(({ theme, visible, withBackground, feedbackType, size }) => {
  // Определяем цвет в зависимости от типа
  const getColorByType = () => {
    switch (feedbackType) {
      case 'success':
        return theme.palette.success.main;
      case 'error':
        return theme.palette.error.main;
      case 'info':
        return theme.palette.info.main;
      case 'loading':
        return theme.palette.primary.main;
      default:
        return theme.palette.primary.main;
    }
  };
  
  // Определяем размер в зависимости от пропа size
  const getSizeValue = () => {
    switch (size) {
      case 'small':
        return { icon: 32, container: 60 };
      case 'large':
        return { icon: 64, container: 120 };
      case 'medium':
      default:
        return { icon: 48, container: 90 };
    }
  };
  
  const sizeValues = getSizeValue();
  const color = getColorByType();
  
  return {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 1000,
    padding: withBackground ? theme.spacing(2) : 0,
    borderRadius: withBackground ? 12 : 0,
    backgroundColor: withBackground ? alpha(theme.palette.background.paper, 0.9) : 'transparent',
    backdropFilter: withBackground ? 'blur(4px)' : 'none',
    boxShadow: withBackground ? '0 4px 20px rgba(0, 0, 0, 0.15)' : 'none',
    width: withBackground ? sizeValues.container * 2 : 'auto',
    height: withBackground ? sizeValues.container * 2 : 'auto',
    opacity: 0,
    pointerEvents: 'none',
    animation: visible
      ? `${fadeIn} 0.3s ease forwards`
      : `${fadeOut} 0.3s ease forwards`,
    
    // Иконка
    '& .feedback-icon': {
      fontSize: sizeValues.icon,
      color: color,
      marginBottom: theme.spacing(1),
    },
    
    // Анимации для разных типов
    '& .feedback-icon.success': {
      animation: `${pulse} 0.5s ease-in-out`,
    },
    
    '& .feedback-icon.loading': {
      animation: `${rotate} 1.5s linear infinite`,
    },
    
    // Оптимизация для мобильных устройств
    [theme.breakpoints.down('sm')]: {
      '& .feedback-icon': {
        fontSize: sizeValues.icon * 0.8,
      },
      
      width: withBackground ? sizeValues.container * 1.5 : 'auto',
      height: withBackground ? sizeValues.container * 1.5 : 'auto',
    },
  };
});

const MessageText = styled('div')(({ theme }) => ({
  marginTop: theme.spacing(1),
  textAlign: 'center',
  color: theme.palette.text.primary,
  fontWeight: 500,
  
  // Оптимизация для мобильных устройств
  [theme.breakpoints.down('sm')]: {
    fontSize: '0.875rem',
  },
}));

const Feedback: React.FC<FeedbackProps> = ({
  type = 'success',
  message,
  icon,
  visible = false,
  duration = 2000,
  size = 'medium',
  withBackground = true,
  onComplete,
}) => {
  const [isVisible, setIsVisible] = useState(visible);
  const theme = useTheme();

  // Управление видимостью и обработка завершения
  useEffect(() => {
    setIsVisible(visible);
    
    if (visible && duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        
        // Еще небольшая задержка для завершения анимации исчезновения
        setTimeout(() => {
          if (onComplete) {
            onComplete();
          }
        }, 300);
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [visible, duration, onComplete]);
  
  // Выбор иконки в зависимости от типа
  const renderIcon = () => {
    if (icon) return icon;
    
    switch (type) {
      case 'success':
        return <SuccessIcon className="feedback-icon success" />;
      case 'error':
        return <ErrorIcon className="feedback-icon error" />;
      case 'info':
        return <InfoIcon className="feedback-icon info" />;
      case 'loading':
        return <LoadingIcon className="feedback-icon loading" />;
      default:
        return null;
    }
  };
  
  return (
    <FeedbackContainer
      visible={isVisible}
      withBackground={withBackground}
      feedbackType={type}
      size={size}
    >
      {renderIcon()}
      
      {message && (
        <MessageText>
          {message}
        </MessageText>
      )}
    </FeedbackContainer>
  );
};

export default Feedback; 