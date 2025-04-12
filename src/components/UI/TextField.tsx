import React from 'react';
import { 
  TextField as MuiTextField, 
  TextFieldProps as MuiTextFieldProps,
  InputAdornment,
  styled
} from '@mui/material';

export interface TextFieldProps extends Omit<MuiTextFieldProps, 'variant'> {
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  variant?: 'outlined' | 'filled' | 'standard';
}

const StyledTextField = styled(MuiTextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: '12px',
    transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
    
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: theme.palette.primary.light,
    },
    
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderWidth: '1px',
      boxShadow: `0 0 0 2px ${theme.palette.primary.light}25`,
    },
  },
  
  '& .MuiInputBase-input': {
    padding: '14px 16px',
  },
  
  // Оптимизация для мобильных устройств
  [theme.breakpoints.down('sm')]: {
    '& .MuiOutlinedInput-root': {
      borderRadius: '10px',
    },
    
    '& .MuiInputBase-input': {
      padding: '12px 14px',
      fontSize: '1rem', // Чуть больше для удобства на мобильных
    },
    
    '& .MuiInputLabel-root': {
      fontSize: '0.95rem',
    },
    
    // Увеличиваем размер полей ввода для лучшего взаимодействия
    '& input, & textarea': {
      '-webkit-tap-highlight-color': 'transparent', // Убираем подсветку при тапе на iOS
    },
  },
}));

const TextField: React.FC<TextFieldProps> = ({
  startIcon,
  endIcon,
  variant = 'outlined',
  ...props
}) => {
  return (
    <StyledTextField
      variant={variant}
      InputProps={{
        ...props.InputProps,
        ...(startIcon && {
          startAdornment: (
            <InputAdornment position="start">
              {startIcon}
            </InputAdornment>
          ),
        }),
        ...(endIcon && {
          endAdornment: (
            <InputAdornment position="end">
              {endIcon}
            </InputAdornment>
          ),
        }),
      }}
      {...props}
    />
  );
};

export default TextField; 