// Утилиты для работы с расходами

interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: Date | string;
  createdBy: string;
}

interface Category {
  id: string;
  name: string;
  color: string;
  icon: React.ReactNode;
}

interface CategoryStat {
  id: string;
  name: string;
  amount: number;
  percentage: number;
  color: string;
  icon?: React.ReactNode;
  expenses?: Expense[];
}

/**
 * Рассчитывает статистику расходов по категориям
 */
export function calculateCategoryStats(
  expenses: Expense[],
  categories: Category[]
): CategoryStat[] {
  if (!expenses || expenses.length === 0 || !categories || categories.length === 0) {
    return [];
  }

  // Подсчитываем общую сумму расходов
  const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  
  // Группируем расходы по категориям
  const categoryAmounts = expenses.reduce((acc, expense) => {
    const categoryId = expense.category;
    acc[categoryId] = (acc[categoryId] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);
  
  // Формируем статистику по каждой категории
  const stats = categories
    .map(category => {
      const amount = categoryAmounts[category.id] || 0;
      const percentage = totalAmount > 0 ? (amount / totalAmount) * 100 : 0;
      
      return {
        id: category.id,
        name: category.name,
        amount,
        percentage,
        color: category.color,
        icon: category.icon
      };
    })
    .filter(stat => stat.amount > 0) // Исключаем категории с нулевыми расходами
    .sort((a, b) => b.amount - a.amount); // Сортируем по убыванию суммы
  
  return stats;
}

/**
 * Возвращает расходы, отфильтрованные и отсортированные по параметрам
 */
export function getFilteredAndSortedExpenses(
  expenses: Expense[],
  searchQuery: string = '',
  minAmount: number | null = null,
  maxAmount: number | null = null,
  categories: string[] = [],
  dateFrom: Date | null = null,
  dateTo: Date | null = null,
  sortBy: 'date' | 'amount' | 'category' = 'date',
  sortOrder: 'asc' | 'desc' = 'desc'
): Expense[] {
  if (!expenses || expenses.length === 0) {
    return [];
  }

  let filtered = [...expenses];
  
  // Применяем фильтрацию
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(expense => 
      expense.description.toLowerCase().includes(query)
    );
  }
  
  if (minAmount !== null) {
    filtered = filtered.filter(expense => expense.amount >= minAmount);
  }
  
  if (maxAmount !== null) {
    filtered = filtered.filter(expense => expense.amount <= maxAmount);
  }
  
  if (categories.length > 0) {
    filtered = filtered.filter(expense => categories.includes(expense.category));
  }
  
  if (dateFrom) {
    const fromTime = dateFrom.getTime();
    filtered = filtered.filter(expense => {
      const expenseDate = expense.date instanceof Date ? 
        expense.date : new Date(expense.date);
      return expenseDate.getTime() >= fromTime;
    });
  }
  
  if (dateTo) {
    const toTime = dateTo.getTime();
    filtered = filtered.filter(expense => {
      const expenseDate = expense.date instanceof Date ? 
        expense.date : new Date(expense.date);
      return expenseDate.getTime() <= toTime;
    });
  }
  
  // Применяем сортировку
  filtered.sort((a, b) => {
    let comparison = 0;
    
    if (sortBy === 'date') {
      const dateA = a.date instanceof Date ? a.date : new Date(a.date);
      const dateB = b.date instanceof Date ? b.date : new Date(b.date);
      comparison = dateA.getTime() - dateB.getTime();
    } else if (sortBy === 'amount') {
      comparison = a.amount - b.amount;
    } else if (sortBy === 'category') {
      comparison = a.category.localeCompare(b.category);
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });
  
  return filtered;
}

/**
 * Рассчитывает сравнение расходов с предыдущим периодом
 */
export function compareWithPreviousPeriod(
  currentPeriodExpenses: Expense[],
  previousPeriodExpenses: Expense[]
): {
  currentTotal: number;
  previousTotal: number;
  difference: number;
  percentageChange: number;
} {
  const currentTotal = currentPeriodExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const previousTotal = previousPeriodExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  
  const difference = currentTotal - previousTotal;
  const percentageChange = previousTotal > 0 
    ? (difference / previousTotal) * 100 
    : difference > 0 ? 100 : 0;
  
  return {
    currentTotal,
    previousTotal,
    difference,
    percentageChange
  };
}

/**
 * Определяет границы предыдущего периода на основе текущего периода
 */
export function getPreviousPeriodDates(
  currentFrom: Date,
  currentTo: Date
): { from: Date, to: Date } {
  const currentDuration = currentTo.getTime() - currentFrom.getTime();
  
  const previousTo = new Date(currentFrom.getTime() - 1); // день перед началом текущего периода
  const previousFrom = new Date(previousTo.getTime() - currentDuration);
  
  return { from: previousFrom, to: previousTo };
} 