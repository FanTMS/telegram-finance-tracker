import React, { useMemo } from 'react';
import {
  Box,
  Pagination as MuiPagination,
  PaginationItem,
  IconButton,
  Typography,
  useTheme,
  useMediaQuery,
  styled
} from '@mui/material';
import {
  NavigateBefore as PrevIcon,
  NavigateNext as NextIcon,
  FirstPage as FirstPageIcon,
  LastPage as LastPageIcon
} from '@mui/icons-material';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  onPageChange: (page: number) => void;
  showFirstLastButtons?: boolean;
  showItemsPerPage?: boolean;
  itemsPerPage?: number;
  itemsName?: string;
  size?: 'small' | 'medium' | 'large';
  hideOnSinglePage?: boolean;
}

const PaginationContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(2),
  
  // Оптимизация для мобильных устройств
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column',
    gap: theme.spacing(1),
  },
}));

const PageInfo = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  
  // Оптимизация для мобильных устройств
  [theme.breakpoints.down('sm')]: {
    fontSize: '0.875rem',
    order: 2,
  },
}));

const NavigationContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  
  // Оптимизация для мобильных устройств
  [theme.breakpoints.down('sm')]: {
    width: '100%',
    justifyContent: 'center',
    order: 1,
  },
}));

const StyledPaginationItem = styled(PaginationItem)(({ theme }) => ({
  minWidth: '32px',
  height: '32px',
  borderRadius: '8px',
  
  // Увеличенная область касания для мобильных устройств
  [theme.breakpoints.down('sm')]: {
    minWidth: '36px',
    height: '36px',
    fontSize: '0.9rem',
    
    '&.MuiPaginationItem-ellipsis': {
      height: '36px',
    },
  },
}));

const NavButton = styled(IconButton)(({ theme }) => ({
  padding: '4px',
  
  // Увеличенный размер для мобильных устройств
  [theme.breakpoints.down('sm')]: {
    padding: '8px',
  },
}));

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
  showFirstLastButtons = false,
  showItemsPerPage = true,
  itemsPerPage = 20,
  itemsName = 'элементов',
  size = 'medium',
  hideOnSinglePage = true,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Не показываем компонент, если страница одна и настроено скрытие
  if (hideOnSinglePage && totalPages <= 1) {
    return null;
  }
  
  // Вычисляем диапазон отображаемых элементов
  const currentRange = useMemo(() => {
    if (!totalItems) return null;
    
    const firstItem = (currentPage - 1) * itemsPerPage + 1;
    const lastItem = Math.min(currentPage * itemsPerPage, totalItems);
    
    return { firstItem, lastItem };
  }, [currentPage, itemsPerPage, totalItems]);
  
  // Определение количества отображаемых страниц в зависимости от размера экрана
  const getPaginationCount = () => {
    return isMobile ? 3 : (size === 'small' ? 5 : 7);
  };
  
  // Генерируем информацию о текущей странице
  const getPageInfo = () => {
    if (totalItems && currentRange) {
      return `${currentRange.firstItem}-${currentRange.lastItem} из ${totalItems} ${itemsName}`;
    }
    
    return `Страница ${currentPage} из ${totalPages}`;
  };
  
  // Обработчики навигации
  const handlePrevPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };
  
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };
  
  const handleFirstPage = () => {
    onPageChange(1);
  };
  
  const handleLastPage = () => {
    onPageChange(totalPages);
  };
  
  return (
    <PaginationContainer>
      {showItemsPerPage && (
        <PageInfo variant="body2">
          {getPageInfo()}
        </PageInfo>
      )}
      
      <NavigationContainer>
        {showFirstLastButtons && (
          <NavButton
            onClick={handleFirstPage}
            disabled={currentPage === 1}
            aria-label="Перейти к первой странице"
            size={isMobile ? 'medium' : 'small'}
          >
            <FirstPageIcon fontSize={isMobile ? 'small' : 'inherit'} />
          </NavButton>
        )}
        
        <NavButton
          onClick={handlePrevPage}
          disabled={currentPage === 1}
          aria-label="Предыдущая страница"
          size={isMobile ? 'medium' : 'small'}
        >
          <PrevIcon fontSize={isMobile ? 'small' : 'inherit'} />
        </NavButton>
        
        <MuiPagination 
          count={totalPages}
          page={currentPage}
          onChange={(_, page) => onPageChange(page)}
          size={size}
          siblingCount={isMobile ? 0 : 1}
          boundaryCount={0}
          hideNextButton
          hidePrevButton
          renderItem={(item) => (
            <StyledPaginationItem
              {...item}
              shape="rounded"
            />
          )}
        />
        
        <NavButton
          onClick={handleNextPage}
          disabled={currentPage === totalPages}
          aria-label="Следующая страница"
          size={isMobile ? 'medium' : 'small'}
        >
          <NextIcon fontSize={isMobile ? 'small' : 'inherit'} />
        </NavButton>
        
        {showFirstLastButtons && (
          <NavButton
            onClick={handleLastPage}
            disabled={currentPage === totalPages}
            aria-label="Перейти к последней странице"
            size={isMobile ? 'medium' : 'small'}
          >
            <LastPageIcon fontSize={isMobile ? 'small' : 'inherit'} />
          </NavButton>
        )}
      </NavigationContainer>
    </PaginationContainer>
  );
};

export default Pagination; 