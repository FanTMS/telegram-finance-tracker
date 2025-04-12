import React from 'react';
import {
  Breadcrumbs as MuiBreadcrumbs,
  Link as MuiLink,
  Typography,
  styled,
  Box,
  IconButton
} from '@mui/material';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { ChevronRight as ChevronRightIcon, NavigateBefore as BackIcon } from '@mui/icons-material';
import { useMediaQuery, useTheme } from '@mui/material';

interface BreadcrumbItem {
  label: string;
  path: string;
  icon?: React.ReactNode;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  showBackButton?: boolean;
  onBack?: () => void;
}

const StyledBreadcrumbs = styled(MuiBreadcrumbs)(({ theme }) => ({
  padding: '12px 0',
  '& .MuiBreadcrumbs-separator': {
    marginLeft: '8px',
    marginRight: '8px',
  },
  // Мобильная адаптация
  [theme.breakpoints.down('sm')]: {
    padding: '8px 0',
    fontSize: '0.875rem',
    '& .MuiBreadcrumbs-separator': {
      marginLeft: '4px',
      marginRight: '4px',
    },
  },
}));

const StyledLink = styled(RouterLink)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  textDecoration: 'none',
  color: theme.palette.text.secondary,
  '&:hover': {
    color: theme.palette.primary.main,
    textDecoration: 'none',
  },
  // Увеличиваем область касания для мобильных
  [theme.breakpoints.down('sm')]: {
    padding: '4px 0',
    fontSize: '0.875rem',
  },
}));

const StyledBackButton = styled(IconButton)(({ theme }) => ({
  marginRight: '16px',
  padding: '8px',
  // Адаптация для мобильных - больший размер для касания
  [theme.breakpoints.down('sm')]: {
    padding: '10px',
    marginRight: '12px',
  },
}));

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ 
  items, 
  showBackButton = false,
  onBack
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const location = useLocation();
  
  // На мобильных показываем только последние 2 элемента для экономии места
  const displayItems = isMobile ? items.slice(-2) : items;
  
  // Если мобильный и есть кнопка назад, показываем только один последний элемент
  const finalItems = (isMobile && showBackButton) ? items.slice(-1) : displayItems;

  return (
    <Box display="flex" alignItems="center">
      {showBackButton && (
        <StyledBackButton 
          size="small" 
          onClick={onBack || (() => window.history.back())}
          aria-label="Назад"
        >
          <BackIcon />
        </StyledBackButton>
      )}
      
      <StyledBreadcrumbs 
        separator={<ChevronRightIcon fontSize="small" />}
        aria-label="breadcrumb"
      >
        {finalItems.map((item, index) => {
          const isLast = index === finalItems.length - 1;
          
          return isLast ? (
            <Typography 
              key={item.path} 
              color="text.primary"
              sx={{ 
                display: 'flex', 
                alignItems: 'center',
                fontWeight: 500
              }}
            >
              {item.icon && (
                <Box 
                  component="span" 
                  sx={{ 
                    display: 'inline-flex',
                    mr: 0.5, 
                    verticalAlign: 'middle' 
                  }}
                >
                  {item.icon}
                </Box>
              )}
              {item.label}
            </Typography>
          ) : (
            <StyledLink
              key={item.path}
              to={item.path}
            >
              {item.icon && (
                <Box 
                  component="span" 
                  sx={{ 
                    display: 'inline-flex',
                    mr: 0.5, 
                    verticalAlign: 'middle' 
                  }}
                >
                  {item.icon}
                </Box>
              )}
              {item.label}
            </StyledLink>
          );
        })}
      </StyledBreadcrumbs>
    </Box>
  );
};

export default Breadcrumbs; 