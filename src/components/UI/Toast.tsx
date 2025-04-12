import React, { forwardRef } from 'react';
import {
  Snackbar,
  SnackbarProps,
  Alert as MuiAlert,
  AlertProps,
  styled,
  useTheme,
  useMediaQuery,
  Box,
  Typography,
  IconButton
} from '@mui/material';
import {
  Close as CloseIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps extends Omit<SnackbarProps, 'TransitionProps'> {
  message: string;
  variant?: ToastVariant;
  description?: string;
  showIcon?: boolean;
  action?: React.ReactNode;
  onClose?: () => void;
}

// Стилизованный Alert компонент с улучшениями для мобильных устройств
const Alert = forwardRef<HTMLDivElement, AlertProps>(function Alert(
  props,
  ref,
) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const StyledAlert = styled(Alert)(({ theme, severity }) => ({
  width: '100%',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  borderRadius: 8,
  
  // Стили для разных типов оповещений
  ...(severity === 'success' && {
    backgroundColor: theme.palette.success.main,
  }),
  ...(severity === 'error' && {
    backgroundColor: theme.palette.error.main,
  }),
  ...(severity === 'warning' && {
    backgroundColor: theme.palette.warning.main,
  }),
  ...(severity === 'info' && {
    backgroundColor: theme.palette.info.main,
  }),
  
  // Увеличиваем размер иконки для лучшей видимости
  '& .MuiAlert-icon': {
    padding: theme.spacing(1, 0),
    marginRight: theme.spacing(1),
    fontSize: 24,
  },
  
  // Адаптация для мобильных устройств
  [theme.breakpoints.down('sm')]: {
    borderRadius: 6,
    padding: theme.spacing(1, 1.5),
    
    '& .MuiAlert-icon': {
      padding: theme.spacing(0.5, 0),
      marginRight: theme.spacing(1),
    },
    
    '& .MuiAlert-action': {
      margin: 0,
      padding: 0,
    },
  },
}));

const ToastContent = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  
  // Адаптация для мобильных устройств
  [theme.breakpoints.down('sm')]: {
    '& .MuiTypography-body2': {
      fontSize: '0.75rem',
    },
  },
}));

const Toast: React.FC<ToastProps> = ({
  message,
  variant = 'info',
  description,
  showIcon = true,
  action,
  onClose,
  ...snackbarProps
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Настройка иконок для разных типов оповещений
  const getIcon = () => {
    switch (variant) {
      case 'success':
        return <SuccessIcon fontSize="inherit" />;
      case 'error':
        return <ErrorIcon fontSize="inherit" />;
      case 'warning':
        return <WarningIcon fontSize="inherit" />;
      case 'info':
      default:
        return <InfoIcon fontSize="inherit" />;
    }
  };
  
  // Настройка положения для разных размеров экрана
  const getSnackbarPosition = () => {
    if (isMobile) {
      return {
        vertical: 'bottom' as const,
        horizontal: 'center' as const,
      };
    }
    
    return {
      vertical: 'top' as const,
      horizontal: 'right' as const,
    };
  };
  
  const position = getSnackbarPosition();
  
  // Обработчик закрытия с правильной типизацией
  const handleClose = (event: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    
    if (onClose) {
      onClose();
    }
    
    if (snackbarProps.onClose) {
      snackbarProps.onClose(event, reason as any);
    }
  };
  
  return (
    <Snackbar
      autoHideDuration={6000}
      anchorOrigin={position}
      {...snackbarProps}
      onClose={handleClose}
      sx={{
        width: isMobile ? '100%' : 'auto',
        maxWidth: isMobile ? '100%' : '400px',
        bottom: isMobile ? 0 : 24,
        left: isMobile ? 0 : 'auto',
        right: isMobile ? 0 : 24,
        '& .MuiPaper-root': {
          width: '100%',
        },
      }}
    >
      <StyledAlert
        severity={variant}
        icon={showIcon ? getIcon() : false}
        action={
          action || (
            <IconButton
              size="small"
              aria-label="закрыть"
              color="inherit"
              onClick={() => onClose && onClose()}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          )
        }
      >
        <ToastContent>
          <Typography variant="body1" fontWeight={500}>
            {message}
          </Typography>
          
          {description && (
            <Typography variant="body2" sx={{ mt: 0.5, opacity: 0.9 }}>
              {description}
            </Typography>
          )}
        </ToastContent>
      </StyledAlert>
    </Snackbar>
  );
};

export default Toast; 