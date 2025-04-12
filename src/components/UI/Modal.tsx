import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  styled,
  useTheme,
  useMediaQuery,
  Box,
  Backdrop,
  Slide
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { TransitionProps } from '@mui/material/transitions';
import { MOBILE } from '../../styles/theme.constants';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  actions?: React.ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  fullScreen?: boolean;
  disableBackdropClick?: boolean;
  hideCloseButton?: boolean;
  dividers?: boolean;
}

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialogTitle-root': {
    padding: theme.spacing(2, 3),
  },
  '& .MuiDialogContent-root': {
    padding: theme.spacing(2, 3),
  },
  '& .MuiDialogActions-root': {
    padding: theme.spacing(1.5, 3),
  },
  
  // Оптимизация для мобильных устройств
  [theme.breakpoints.down('sm')]: {
    '& .MuiDialog-paper': {
      margin: '16px',
      width: 'calc(100% - 32px)',
      maxWidth: '100%',
      borderRadius: '16px',
    },
    '& .MuiDialogTitle-root': {
      padding: theme.spacing(2),
    },
    '& .MuiDialogContent-root': {
      padding: theme.spacing(2),
    },
    '& .MuiDialogActions-root': {
      padding: theme.spacing(1.5, 2),
    },
  },
}));

const TitleContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  width: '100%',
  
  // Увеличиваем высоту заголовка на мобильных для удобства взаимодействия
  [theme.breakpoints.down('sm')]: {
    minHeight: '48px',
  },
}));

const CloseButton = styled(IconButton)(({ theme }) => ({
  marginRight: theme.spacing(-1),
  
  // Увеличиваем размер кнопки закрытия на мобильных для удобства нажатия
  [theme.breakpoints.down('sm')]: {
    padding: '10px',
  },
}));

// Анимация появления модального окна с разных сторон в зависимости от размера экрана
const SlideTransition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement;
  },
  ref: React.Ref<unknown>,
) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  return (
    <Slide direction={isMobile ? 'up' : 'down'} ref={ref} {...props} />
  );
});

const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  children,
  actions,
  maxWidth = 'sm',
  fullWidth = true,
  fullScreen = false,
  disableBackdropClick = false,
  hideCloseButton = false,
  dividers = false,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  
  // Минимальное расстояние свайпа для закрытия модального окна
  const minSwipeDistance = 100;
  
  // Автоматически устанавливаем fullScreen на мобильных устройствах
  const isFullScreen = fullScreen || (isMobile && maxWidth === 'xs');
  
  // Обработка жестов свайпа для закрытия модального окна на мобильных устройствах
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientY);
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientY);
  };
  
  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isSwipeDown = distance < -minSwipeDistance;
    
    if (isSwipeDown && !disableBackdropClick) {
      onClose();
    }
  };
  
  // Обработка нажатия на задний фон (backdrop)
  const handleBackdropClick = () => {
    if (!disableBackdropClick) {
      onClose();
    }
  };
  
  // Для доступности - закрытие по Escape
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && open && !disableBackdropClick) {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [open, onClose, disableBackdropClick]);
  
  return (
    <StyledDialog
      open={open}
      onClose={disableBackdropClick ? undefined : onClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      fullScreen={isFullScreen}
      TransitionComponent={SlideTransition}
      BackdropComponent={Backdrop}
      BackdropProps={{
        onClick: handleBackdropClick,
        sx: { 
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(2px)'
        },
      }}
      aria-labelledby="modal-title"
      PaperProps={{
        onTouchStart: isMobile ? handleTouchStart : undefined,
        onTouchMove: isMobile ? handleTouchMove : undefined,
        onTouchEnd: isMobile ? handleTouchEnd : undefined,
      }}
    >
      {title && (
        <DialogTitle id="modal-title" sx={{ p: 0 }}>
          <TitleContainer>
            {typeof title === 'string' ? (
              <Typography variant="h6" component="h2" sx={{ fontWeight: 500 }}>
                {title}
              </Typography>
            ) : (
              title
            )}
            
            {!hideCloseButton && (
              <CloseButton
                aria-label="Закрыть"
                onClick={onClose}
                size="medium"
              >
                <CloseIcon />
              </CloseButton>
            )}
          </TitleContainer>
        </DialogTitle>
      )}
      
      <DialogContent dividers={dividers}>
        {children}
      </DialogContent>
      
      {actions && (
        <DialogActions>
          {actions}
        </DialogActions>
      )}
      
      {/* Индикатор свайпа для мобильных устройств */}
      {isMobile && isFullScreen && (
        <Box 
          sx={{ 
            position: 'absolute', 
            top: 6, 
            left: '50%', 
            transform: 'translateX(-50%)',
            width: 36, 
            height: 5, 
            backgroundColor: 'rgba(0,0,0,0.2)', 
            borderRadius: 4,
            zIndex: 1
          }} 
        />
      )}
    </StyledDialog>
  );
};

export default Modal; 