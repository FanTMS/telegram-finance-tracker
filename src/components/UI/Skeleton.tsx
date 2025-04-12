import React from 'react';
import { Skeleton as MuiSkeleton, SkeletonProps as MuiSkeletonProps, styled, Box } from '@mui/material';

export interface SkeletonProps extends MuiSkeletonProps {
  type?: 'text' | 'circular' | 'rectangular' | 'card' | 'button' | 'avatar';
  lines?: number;
  height?: number | string;
  width?: number | string;
}

const StyledSkeleton = styled(MuiSkeleton)(({ theme }) => ({
  borderRadius: '8px',
  '&.MuiSkeleton-text': {
    borderRadius: '4px',
  },
  '&.MuiSkeleton-circular': {
    borderRadius: '50%',
  },
  // Адаптация для мобильных устройств
  [theme.breakpoints.down('sm')]: {
    marginBottom: '8px',  // Меньшие отступы на мобильных
  },
}));

const Skeleton: React.FC<SkeletonProps> = ({
  type = 'text',
  lines = 1,
  height,
  width,
  ...props
}) => {
  let variant: MuiSkeletonProps['variant'] = 'text';
  let defaultHeight: string | number = 20;
  let defaultWidth: string | number = '100%';

  // Настройка вариантов скелетонов
  switch (type) {
    case 'circular':
      variant = 'circular';
      defaultHeight = 40;
      defaultWidth = 40;
      break;
    case 'rectangular':
      variant = 'rectangular';
      defaultHeight = 120;
      break;
    case 'card':
      variant = 'rectangular';
      defaultHeight = 160;
      defaultWidth = '100%';
      break;
    case 'button':
      variant = 'rectangular';
      defaultHeight = 40;
      defaultWidth = 120;
      break;
    case 'avatar':
      variant = 'circular';
      defaultHeight = 48;
      defaultWidth = 48;
      break;
  }

  // Если нужно несколько строк текста
  if (type === 'text' && lines > 1) {
    return (
      <Box sx={{ width: width || defaultWidth }}>
        {Array.from(new Array(lines)).map((_, index) => (
          <StyledSkeleton
            key={index}
            variant="text"
            height={height || defaultHeight}
            width={index === lines - 1 ? '80%' : '100%'} // Последняя строка короче
            {...props}
            sx={{
              ...props.sx,
              mb: index !== lines - 1 ? 1 : 0,
            }}
          />
        ))}
      </Box>
    );
  }

  return (
    <StyledSkeleton
      variant={variant}
      height={height || defaultHeight}
      width={width || defaultWidth}
      {...props}
    />
  );
};

export default Skeleton; 