import React from 'react';
import { Paper, PaperProps, styled, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';

interface StyledCardProps extends PaperProps {
  interactive?: boolean;
  highlightOnHover?: boolean;
  elevated?: boolean;
}

const StyledCard = styled(Paper, {
  shouldForwardProp: (prop) => !['interactive', 'highlightOnHover', 'elevated'].includes(prop as string),
})<StyledCardProps>(({ theme, interactive, highlightOnHover, elevated }) => ({
  borderRadius: '16px',
  overflow: 'hidden',
  transition: 'all 0.3s ease',
  boxShadow: elevated ? `0 6px 16px ${alpha(theme.palette.common.black, 0.08)}` : 'none',
  border: `1px solid ${theme.palette.divider}`,
  
  ...(interactive && {
    cursor: 'pointer',
  }),
  
  // Desktop hover effects
  '&:hover': {
    ...(interactive && {
      transform: 'translateY(-4px)',
      boxShadow: `0 8px 24px ${alpha(theme.palette.common.black, 0.12)}`,
    }),
    
    ...(highlightOnHover && {
      borderColor: theme.palette.primary.main,
      boxShadow: `0 6px 16px ${alpha(theme.palette.primary.main, 0.15)}`,
    }),
  },
  
  // Mobile adaptations
  [theme.breakpoints.down('sm')]: {
    borderRadius: '12px',
    '&:hover': {
      transform: 'none', // Disable hover transform on mobile
    },
    '&:active': {
      backgroundColor: interactive ? alpha(theme.palette.action.active, 0.05) : 'inherit',
    },
  },
  
  // Desktop-specific enhancements
  [theme.breakpoints.up('md')]: {
    padding: theme.spacing(3),
    borderRadius: '20px',
  },
}));

export interface CardProps extends Omit<PaperProps, 'component'> {
  interactive?: boolean;
  highlightOnHover?: boolean;
  elevated?: boolean;
  children: React.ReactNode;
}

const Card: React.FC<CardProps> = ({
  children,
  interactive = false,
  highlightOnHover = false,
  elevated = false,
  ...rest
}) => {
  const theme = useTheme();
  
  return (
    <StyledCard
      interactive={interactive} 
      highlightOnHover={highlightOnHover}
      elevated={elevated}
      {...rest}
    >
      {children}
    </StyledCard>
  );
};

export default Card; 