import { useState, useEffect, useCallback, useMemo } from 'react';

/**
 * Хук для оптимизации рендеринга длинных списков данных
 * с возможностью сортировки, фильтрации и пагинации
 * 
 * @param data Исходный массив данных для обработки
 * @param options Опции для обработки данных
 * @returns Объект с обработанными данными и методами управления
 */
export const useOptimizedRender = <T extends Record<string, any>>(
  data: T[],
  options?: {
    sortBy?: keyof T;
    sortDirection?: 'asc' | 'desc';
    filterBy?: keyof T;
    filterValue?: string | number;
    itemsPerPage?: number;
    initialPage?: number;
    customFilter?: (item: T) => boolean;
    customSort?: (a: T, b: T) => number;
    debounceMs?: number;
  }
) => {
  // Извлекаем и устанавливаем значения по умолчанию
  const {
    sortBy,
    sortDirection = 'asc',
    filterBy,
    filterValue,
    itemsPerPage = 20,
    initialPage = 1,
    customFilter,
    customSort,
    debounceMs = 300
  } = options || {};
  
  // Состояния
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [currentSortBy, setCurrentSortBy] = useState<keyof T | undefined>(sortBy);
  const [currentSortDirection, setCurrentSortDirection] = useState(sortDirection);
  const [currentFilterValue, setCurrentFilterValue] = useState<string | number | undefined>(filterValue);
  const [isLoading, setIsLoading] = useState(false);
  
  // Сбрасываем страницу при изменении фильтра
  useEffect(() => {
    setCurrentPage(1);
  }, [currentFilterValue, currentSortBy, currentSortDirection]);
  
  // Фильтрация данных с мемоизацией
  const filteredData = useMemo(() => {
    if (!data?.length) return [];
    
    // Применяем кастомный фильтр, если он предоставлен
    if (customFilter) {
      return data.filter(customFilter);
    }
    
    // Применяем фильтрацию по свойству, если указано
    if (filterBy && currentFilterValue !== undefined && currentFilterValue !== '') {
      return data.filter(item => {
        const value = item[filterBy];
        
        if (typeof value === 'string') {
          return value.toLowerCase().includes(String(currentFilterValue).toLowerCase());
        }
        
        if (typeof value === 'number') {
          return value === Number(currentFilterValue);
        }
        
        return false;
      });
    }
    
    return data;
  }, [data, filterBy, currentFilterValue, customFilter]);
  
  // Сортировка данных с мемоизацией
  const sortedData = useMemo(() => {
    if (!filteredData?.length) return [];
    
    // Создаем копию для сортировки, чтобы не мутировать исходные данные
    const dataToSort = [...filteredData];
    
    // Применяем кастомную сортировку, если она предоставлена
    if (customSort) {
      return dataToSort.sort(customSort);
    }
    
    // Применяем сортировку по свойству, если указано
    if (currentSortBy) {
      return dataToSort.sort((a, b) => {
        const valueA = a[currentSortBy];
        const valueB = b[currentSortBy];
        
        // Для строк используем localeCompare
        if (typeof valueA === 'string' && typeof valueB === 'string') {
          return currentSortDirection === 'asc'
            ? valueA.localeCompare(valueB)
            : valueB.localeCompare(valueA);
        }
        
        // Для чисел используем обычное сравнение
        if (typeof valueA === 'number' && typeof valueB === 'number') {
          return currentSortDirection === 'asc'
            ? valueA - valueB
            : valueB - valueA;
        }
        
        // Для дат
        if (
          valueA && 
          valueB && 
          typeof valueA === 'object' && 
          typeof valueB === 'object' &&
          'getTime' in valueA && 
          'getTime' in valueB && 
          typeof valueA.getTime === 'function' && 
          typeof valueB.getTime === 'function'
        ) {
          return currentSortDirection === 'asc'
            ? valueA.getTime() - valueB.getTime()
            : valueB.getTime() - valueA.getTime();
        }
        
        return 0;
      });
    }
    
    return dataToSort;
  }, [filteredData, currentSortBy, currentSortDirection, customSort]);
  
  // Пагинация данных с мемоизацией
  const paginatedData = useMemo(() => {
    if (!sortedData?.length) return [];
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, currentPage, itemsPerPage]);
  
  // Общее количество страниц
  const totalPages = useMemo(() => {
    return Math.ceil(sortedData.length / itemsPerPage);
  }, [sortedData, itemsPerPage]);
  
  // Методы управления
  const handleSort = useCallback((sortKey: keyof T) => {
    // Если сортировка уже по этому полю, меняем направление
    if (currentSortBy === sortKey) {
      setCurrentSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      // Иначе устанавливаем новое поле и направление по умолчанию
      setCurrentSortBy(sortKey);
      setCurrentSortDirection('asc');
    }
  }, [currentSortBy]);
  
  // Устанавливаем фильтр с задержкой для оптимизации
  const handleFilter = useCallback((value: string | number | undefined) => {
    setIsLoading(true);
    
    // Используем setTimeout для дебаунса частых изменений
    const timer = setTimeout(() => {
      setCurrentFilterValue(value);
      setIsLoading(false);
    }, debounceMs);
    
    return () => clearTimeout(timer);
  }, [debounceMs]);
  
  // Навигация по страницам
  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  }, [totalPages]);
  
  const nextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  }, [currentPage, totalPages]);
  
  const prevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  }, [currentPage]);
  
  // Возвращаем данные и методы
  return {
    data: paginatedData,
    filteredData: sortedData,
    totalItems: sortedData.length,
    currentPage,
    totalPages,
    isLoading,
    
    // Методы управления
    setFilter: handleFilter,
    setSort: handleSort,
    goToPage,
    nextPage,
    prevPage,
    
    // Текущие настройки
    sortBy: currentSortBy,
    sortDirection: currentSortDirection,
    filterValue: currentFilterValue,
    itemsPerPage,
  };
};

export default useOptimizedRender; 