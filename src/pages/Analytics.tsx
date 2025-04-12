import React, { useState, useEffect, useMemo } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Button,
  ButtonGroup,
  useTheme,
  Skeleton,
  IconButton,
  Chip,
  Divider,
  Tab,
  Tabs,
  Paper,
  alpha,
  Avatar,
  Tooltip,
  Fade,
  useMediaQuery,
  SwipeableDrawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Zoom
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip as ChartTooltip, Legend } from 'chart.js';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useTelegramApp } from '../hooks/useTelegramApp';
import {
  TrendingUp,
  TrendingDown,
  CalendarMonth,
  DateRange as DateRangeIcon,
  SyncAlt,
  PieChart,
  BarChart,
  ShowChart,
  AttachMoney,
  Category,
  Info,
  TrendingFlat,
  ArrowUpward,
  ArrowDownward,
  FilterAlt,
  Refresh,
  Dashboard,
  KeyboardArrowDown,
  TuneRounded
} from '@mui/icons-material';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval, isSameMonth, differenceInMonths } from 'date-fns';
import { ru } from 'date-fns/locale';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, ChartTooltip, Legend);

// Type for trend direction
type TrendDirection = 'up' | 'down' | 'neutral';

// Interface for expenses from Firebase
interface ExpenseData {
  id: string;
  amount: number;
  category: string;
  description: string;
  createdAt: Timestamp;
  groupId: string;
  createdBy: string;
}

// Category definitions with colors
const categoryConfig = {
  'food': { color: 'rgba(255, 99, 132, 0.7)', borderColor: 'rgba(255, 99, 132, 1)', icon: '🍔' },
  'grocery': { color: 'rgba(54, 162, 235, 0.7)', borderColor: 'rgba(54, 162, 235, 1)', icon: '🛒' },
  'transport': { color: 'rgba(255, 206, 86, 0.7)', borderColor: 'rgba(255, 206, 86, 1)', icon: '🚗' },
  'housing': { color: 'rgba(75, 192, 192, 0.7)', borderColor: 'rgba(75, 192, 192, 1)', icon: '🏠' },
  'health': { color: 'rgba(153, 102, 255, 0.7)', borderColor: 'rgba(153, 102, 255, 1)', icon: '🏥' },
  'education': { color: 'rgba(255, 159, 64, 0.7)', borderColor: 'rgba(255, 159, 64, 1)', icon: '📚' },
  'entertainment': { color: 'rgba(59, 212, 174, 0.7)', borderColor: 'rgba(59, 212, 174, 1)', icon: '🎮' },
  'other': { color: 'rgba(201, 203, 207, 0.7)', borderColor: 'rgba(201, 203, 207, 1)', icon: '🔄' }
};

// Get category color with fallback
const getCategoryColor = (category: string, opacity: number = 0.7) => {
  const cat = categoryConfig[category as keyof typeof categoryConfig] || categoryConfig.other;
  return opacity === 1 ? cat.borderColor : cat.color;
};

// Get category icon
const getCategoryIcon = (category: string) => {
  return categoryConfig[category as keyof typeof categoryConfig]?.icon || '🔄';
};

// Component for displaying trend indicator with animation
interface TrendIndicatorProps {
  direction: TrendDirection;
  value: number;
  isPercentage?: boolean;
}

const TrendIndicator: React.FC<TrendIndicatorProps> = ({ direction, value, isPercentage = false }) => {
  const theme = useTheme();
  
  const getColor = () => {
    if (direction === 'up') return theme.palette.success.main;
    if (direction === 'down') return theme.palette.error.main;
    return theme.palette.grey[500];
  };
  
  const getIcon = () => {
    if (direction === 'up') return <ArrowUpward fontSize="small" />;
    if (direction === 'down') return <ArrowDownward fontSize="small" />;
    return <TrendingFlat fontSize="small" />;
  };
  
  return (
    <Chip
      icon={getIcon()}
      label={`${value > 0 ? '+' : ''}${value.toFixed(isPercentage ? 1 : 0)}${isPercentage ? '%' : ''}`}
      size="small"
      sx={{
        backgroundColor: alpha(getColor(), 0.15),
        color: getColor(),
        fontWeight: 500,
        fontSize: '0.75rem',
        '.MuiChip-icon': {
          fontSize: '0.875rem',
          color: 'inherit'
        }
      }}
    />
  );
};

// StatCard component for unified card design
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  trend?: {
    direction: TrendDirection;
    value: number;
    isPercentage?: boolean;
  };
  delay?: number;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, trend, delay = 0 }) => {
  const theme = useTheme();
  
  return (
    <Zoom in style={{ transitionDelay: `${delay}ms` }}>
      <Card
        sx={{
          borderRadius: 3,
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
          height: '100%',
          background: `linear-gradient(135deg, ${alpha(color, 0.15)} 0%, ${alpha(color, 0.05)} 100%)`,
          border: `1px solid ${alpha(color, 0.12)}`,
          transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.08)'
          }
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Typography color="text.secondary" fontWeight="500" fontSize="0.875rem" gutterBottom>
                {title}
              </Typography>
              <Typography variant="h5" component="div" color={color} fontWeight="600" sx={{ mb: 1 }}>
                {value}
              </Typography>
              {trend && (
                <TrendIndicator 
                  direction={trend.direction} 
                  value={trend.value} 
                  isPercentage={trend.isPercentage} 
                />
              )}
            </Box>
            <Avatar
              sx={{
                backgroundColor: alpha(color, 0.15),
                color: color,
                width: 40,
                height: 40
              }}
            >
              {icon}
            </Avatar>
          </Box>
        </CardContent>
      </Card>
    </Zoom>
  );
};

const Analytics: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user, setHeaderColor, isReady, enableClosingConfirmation } = useTelegramApp();
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<ExpenseData[]>([]);
  const [previousExpenses, setPreviousExpenses] = useState<ExpenseData[]>([]);
  const [timeframe, setTimeframe] = useState<'month' | 'quarter' | 'year'>('month');
  const [dateRange, setDateRange] = useState<[Date, Date]>([
    startOfMonth(new Date()),
    endOfMonth(new Date())
  ]);
  const [tabValue, setTabValue] = useState(0);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  
  // Set Telegram header color and enable closing confirmation on component mount
  useEffect(() => {
    if (isReady) {
      setHeaderColor('bg_color');
      enableClosingConfirmation();
    }
  }, [isReady, setHeaderColor, enableClosingConfirmation]);

  // Fetch expenses data from Firebase
  useEffect(() => {
    const fetchExpenses = async () => {
      if (!user?.id) {
        // Use mock data for development/demo if no user
        setTimeout(() => {
          const mockData = generateMockExpenses();
          setExpenses(mockData);
          
          // Generate previous period data for trends
          const previousPeriodData = generateMockExpenses(true);
          setPreviousExpenses(previousPeriodData);
          
          setLoading(false);
        }, 600);
        return;
      }

      try {
        setLoading(true);
        const expensesRef = collection(db, 'expenses');
        const q = query(
          expensesRef,
          // Filter by user ID in splitBetween array
          where('splitBetween', 'array-contains', String(user.id)),
          orderBy('createdAt', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        const expensesData: ExpenseData[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data() as Omit<ExpenseData, 'id'>;
          expensesData.push({
            id: doc.id,
            ...data
          });
        });
        
        setExpenses(expensesData);
        
        // Calculate previous period
        const today = new Date();
        const currentStart = startOfMonth(today);
        const previousPeriodStart = subMonths(currentStart, 1);
        
        const previousPeriodExpenses = expensesData.filter(expense => {
          const date = expense.createdAt.toDate();
          return date >= previousPeriodStart && date < currentStart;
        });
        
        setPreviousExpenses(previousPeriodExpenses);
      } catch (error) {
        console.error('Error fetching expenses:', error);
        // Use mock data as fallback if fetch fails
        const mockData = generateMockExpenses();
        setExpenses(mockData);
        
        // Generate previous period data for trends
        const previousPeriodData = generateMockExpenses(true);
        setPreviousExpenses(previousPeriodData);
      } finally {
        setLoading(false);
      }
    };
    
    fetchExpenses();
  }, [user?.id]);

  // Generate mock data for development
  const generateMockExpenses = (isPrevious = false): ExpenseData[] => {
    const categories = ['food', 'grocery', 'transport', 'housing', 'health', 'education', 'entertainment', 'other'];
    const mockExpenses: ExpenseData[] = [];
    
    const baseDate = isPrevious 
      ? subMonths(new Date(), 1) 
      : new Date();
    
    // Generate expenses for the current or previous period
    const count = isPrevious ? 90 : 120;
    for (let i = 0; i < count; i++) {
      const date = new Date(baseDate);
      date.setDate(date.getDate() - Math.floor(Math.random() * 180));
      
      mockExpenses.push({
        id: `mock-${isPrevious ? 'prev-' : ''}${i}`,
        amount: Math.floor(Math.random() * 1500) + 100,
        category: categories[Math.floor(Math.random() * categories.length)],
        description: `Sample expense ${i + 1}`,
        createdAt: Timestamp.fromDate(date),
        groupId: `group-${Math.floor(Math.random() * 3) + 1}`,
        createdBy: 'mock-user'
      });
    }
    
    return mockExpenses;
  };

  // Filter expenses by selected date range
  const getFilteredExpenses = (expenseList = expenses) => {
    if (!dateRange[0] || !dateRange[1]) return expenseList;
    
    return expenseList.filter((expense) => {
      const expenseDate = expense.createdAt.toDate();
      return isWithinInterval(expenseDate, {
        start: dateRange[0],
        end: dateRange[1]
      });
    });
  };

  // Handle timeframe change
  const handleTimeframeChange = (newTimeframe: 'month' | 'quarter' | 'year') => {
    setTimeframe(newTimeframe);
    const today = new Date();
    
    switch (newTimeframe) {
      case 'month':
        setDateRange([startOfMonth(today), endOfMonth(today)]);
        break;
      case 'quarter':
        setDateRange([startOfMonth(subMonths(today, 2)), endOfMonth(today)]);
        break;
      case 'year':
        setDateRange([startOfMonth(subMonths(today, 11)), endOfMonth(today)]);
        break;
    }
  };

  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Toggle filter drawer
  const toggleFilterDrawer = (open: boolean) => (event: React.KeyboardEvent | React.MouseEvent) => {
    if (
      event &&
      event.type === 'keydown' &&
      ((event as React.KeyboardEvent).key === 'Tab' ||
        (event as React.KeyboardEvent).key === 'Shift')
    ) {
      return;
    }

    setFilterDrawerOpen(open);
  };

  // Calculate trends and stats - memoized for performance
  const { chartData, stats, trends } = useMemo(() => {
    const filteredExpenses = getFilteredExpenses();
    const filteredPreviousExpenses = getFilteredExpenses(previousExpenses);
    
    // Expenses by category
    const categoriesData: Record<string, number> = {};
    filteredExpenses.forEach((expense) => {
      const category = expense.category || 'other';
      categoriesData[category] = (categoriesData[category] || 0) + expense.amount;
    });
    
    // Group expenses by month
    const monthlyData: Record<string, number> = {};
    filteredExpenses.forEach((expense) => {
      const month = format(expense.createdAt.toDate(), 'MMM yyyy', { locale: ru });
      monthlyData[month] = (monthlyData[month] || 0) + expense.amount;
    });
    
    // Sort months chronologically
    const sortedMonths = Object.keys(monthlyData).sort((a, b) => {
      const dateA = new Date(a);
      const dateB = new Date(b);
      return dateA.getTime() - dateB.getTime();
    });
    
    // Calculate statistics
    const totalExpenses = filteredExpenses.reduce((total, expense) => total + expense.amount, 0);
    const totalPreviousExpenses = filteredPreviousExpenses.reduce((total, expense) => total + expense.amount, 0);
    
    const expenseCount = filteredExpenses.length;
    const previousExpenseCount = filteredPreviousExpenses.length;
    
    // Average expense
    const avgExpense = expenseCount > 0 ? totalExpenses / expenseCount : 0;
    const previousAvgExpense = previousExpenseCount > 0 ? totalPreviousExpenses / previousExpenseCount : 0;
    
    // Largest expense
    const largestExpense = expenseCount > 0 
      ? Math.max(...filteredExpenses.map(expense => expense.amount)) 
      : 0;
    const previousLargestExpense = previousExpenseCount > 0
      ? Math.max(...filteredPreviousExpenses.map(expense => expense.amount))
      : 0;
    
    // Most expensive category
    const categoryTotals: Record<string, number> = {};
    filteredExpenses.forEach((expense) => {
      const category = expense.category || 'other';
      categoryTotals[category] = (categoryTotals[category] || 0) + expense.amount;
    });
    
    let topCategory = 'other';
    let maxAmount = 0;
    
    Object.entries(categoryTotals).forEach(([category, amount]) => {
      if (amount > maxAmount) {
        topCategory = category;
        maxAmount = amount;
      }
    });
    
    // Calculate previous period top category
    const previousCategoryTotals: Record<string, number> = {};
    filteredPreviousExpenses.forEach((expense) => {
      const category = expense.category || 'other';
      previousCategoryTotals[category] = (previousCategoryTotals[category] || 0) + expense.amount;
    });
    
    // Calculate trends
    const calculateTrend = (current: number, previous: number): { direction: TrendDirection, value: number } => {
      if (previous === 0) return { direction: 'neutral', value: 0 };
      
      const diff = current - previous;
      const percentChange = (diff / previous) * 100;
      
      if (Math.abs(percentChange) < 1) return { direction: 'neutral', value: 0 };
      if (percentChange > 0) return { direction: 'up', value: percentChange };
      return { direction: 'down', value: Math.abs(percentChange) };
    };
    
    // Calculate each trend
    const totalTrend = calculateTrend(totalExpenses, totalPreviousExpenses);
    const avgTrend = calculateTrend(avgExpense, previousAvgExpense);
    const largestTrend = calculateTrend(largestExpense, previousLargestExpense);
    
    // Calculate category trend
    let categoryTrend = { direction: 'neutral' as TrendDirection, value: 0 };
    if (topCategory in previousCategoryTotals) {
      categoryTrend = calculateTrend(
        categoryTotals[topCategory] || 0,
        previousCategoryTotals[topCategory] || 0
      );
    }
    
    return {
      chartData: {
        categories: Object.keys(categoriesData),
        categoryAmounts: Object.values(categoriesData),
        categoryColors: Object.keys(categoriesData).map(cat => getCategoryColor(cat)),
        categoryBorderColors: Object.keys(categoriesData).map(cat => getCategoryColor(cat, 1)),
        months: sortedMonths,
        monthlyAmounts: sortedMonths.map(month => monthlyData[month])
      },
      stats: {
        totalExpenses,
        avgExpense,
        largestExpense,
        topCategory,
        topCategoryAmount: maxAmount,
        expenseCount
      },
      trends: {
        totalTrend,
        avgTrend,
        largestTrend,
        categoryTrend
      }
    };
  }, [expenses, previousExpenses, dateRange]);

  // Loading skeleton
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ pt: 1, pb: 6 }}>
        <Box sx={{ py: 2 }}>
          <Skeleton variant="text" width="40%" height={40} />
          <Box sx={{ my: 2 }}>
            <Skeleton variant="rectangular" height={40} sx={{ borderRadius: 2 }} />
          </Box>
          
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {[1, 2, 3, 4].map((item) => (
              <Grid item xs={6} md={3} key={item}>
                <Skeleton variant="rectangular" height={isMobile ? 100 : 120} sx={{ borderRadius: 3 }} />
              </Grid>
            ))}
          </Grid>
          
          <Skeleton variant="rectangular" height={40} sx={{ mb: 2, borderRadius: 2 }} />
          
          <Skeleton 
            variant="rectangular" 
            height={isMobile ? 300 : 400} 
            sx={{ borderRadius: 3 }} 
          />
        </Box>
      </Container>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Container maxWidth="lg" sx={{ pt: 1, pb: 6 }}>
        <Box sx={{ py: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" component="h1" fontWeight="600">
              Финансовая аналитика
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Фильтры">
                <IconButton 
                  onClick={toggleFilterDrawer(true)}
                  sx={{ 
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.2) }
                  }}
                  aria-label="Открыть фильтры"
                >
                  <TuneRounded />
                </IconButton>
              </Tooltip>
              <ButtonGroup 
                variant="outlined" 
                size="small" 
                aria-label="выбор периода"
                sx={{ 
                  backgroundColor: theme.palette.background.paper,
                  borderRadius: 2,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  display: { xs: 'none', sm: 'flex' },
                  '.MuiButtonGroup-grouped': {
                    borderRadius: '8px !important',
                    minWidth: { xs: '60px', sm: 'auto' },
                    px: { xs: 1, sm: 2 }
                  }
                }}
              >
                <Button 
                  onClick={() => handleTimeframeChange('month')} 
                  variant={timeframe === 'month' ? 'contained' : 'outlined'}
                  startIcon={<CalendarMonth fontSize="small" />}
                >
                  Месяц
                </Button>
                <Button 
                  onClick={() => handleTimeframeChange('quarter')} 
                  variant={timeframe === 'quarter' ? 'contained' : 'outlined'}
                  startIcon={<DateRangeIcon fontSize="small" />}
                >
                  Квартал
                </Button>
                <Button 
                  onClick={() => handleTimeframeChange('year')} 
                  variant={timeframe === 'year' ? 'contained' : 'outlined'}
                  startIcon={<ShowChart fontSize="small" />}
                >
                  Год
                </Button>
              </ButtonGroup>
            </Box>
          </Box>

          {/* Filter Drawer for mobile */}
          <SwipeableDrawer
            anchor="bottom"
            open={filterDrawerOpen}
            onClose={toggleFilterDrawer(false)}
            onOpen={toggleFilterDrawer(true)}
            sx={{
              '.MuiDrawer-paper': {
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
                maxHeight: '70vh'
              }
            }}
          >
            <Box sx={{ p: 2 }}>
              <Typography variant="h6" fontWeight="600" sx={{ mb: 2 }}>
                Настройки отображения
              </Typography>
              
              <Typography variant="subtitle2" fontWeight="500" sx={{ mb: 1 }}>
                Выберите период
              </Typography>
              
              <ButtonGroup 
                variant="outlined" 
                fullWidth
                size="medium"
                aria-label="выбор периода"
                sx={{ mb: 3 }}
              >
                <Button 
                  onClick={() => handleTimeframeChange('month')} 
                  variant={timeframe === 'month' ? 'contained' : 'outlined'}
                >
                  Месяц
                </Button>
                <Button 
                  onClick={() => handleTimeframeChange('quarter')} 
                  variant={timeframe === 'quarter' ? 'contained' : 'outlined'}
                >
                  3 Месяца
                </Button>
                <Button 
                  onClick={() => handleTimeframeChange('year')} 
                  variant={timeframe === 'year' ? 'contained' : 'outlined'}
                >
                  Год
                </Button>
              </ButtonGroup>
              
              <Button 
                variant="contained" 
                fullWidth 
                onClick={toggleFilterDrawer(false)}
                sx={{ mt: 2 }}
              >
                Применить
              </Button>
            </Box>
          </SwipeableDrawer>
          
          {/* Period indicator for mobile */}
          <Box 
            sx={{ 
              display: { xs: 'flex', sm: 'none' }, 
              mb: 2,
              justifyContent: 'center'
            }}
          >
            <Chip
              label={
                timeframe === 'month' ? 'Текущий месяц' :
                timeframe === 'quarter' ? 'Последние 3 месяца' : 'Последний год'
              }
              color="primary"
              variant="outlined"
              size="medium"
              deleteIcon={<KeyboardArrowDown />}
              onDelete={toggleFilterDrawer(true)}
              sx={{ fontWeight: 500, px: 1 }}
            />
          </Box>
          
          {/* Summary Cards */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6} md={3}>
              <StatCard
                title="Всего расходов"
                value={`${stats.totalExpenses.toLocaleString()} ₽`}
                icon={<TrendingDown />}
                color={theme.palette.error.main}
                trend={trends.totalTrend.direction !== 'neutral' ? {
                  direction: trends.totalTrend.direction,
                  value: trends.totalTrend.value,
                  isPercentage: true
                } : undefined}
                delay={50}
              />
            </Grid>
            
            <Grid item xs={6} md={3}>
              <StatCard
                title="Средний расход"
                value={`${Math.round(stats.avgExpense).toLocaleString()} ₽`}
                icon={<SyncAlt />}
                color={theme.palette.info.main}
                trend={trends.avgTrend.direction !== 'neutral' ? {
                  direction: trends.avgTrend.direction,
                  value: trends.avgTrend.value,
                  isPercentage: true
                } : undefined}
                delay={100}
              />
            </Grid>
            
            <Grid item xs={6} md={3}>
              <StatCard
                title="Макс. расход"
                value={`${stats.largestExpense.toLocaleString()} ₽`}
                icon={<AttachMoney />}
                color={theme.palette.warning.main}
                trend={trends.largestTrend.direction !== 'neutral' ? {
                  direction: trends.largestTrend.direction,
                  value: trends.largestTrend.value,
                  isPercentage: true
                } : undefined}
                delay={150}
              />
            </Grid>
            
            <Grid item xs={6} md={3}>
              <StatCard
                title="Топ категория"
                value={`${getCategoryIcon(stats.topCategory)} ${stats.topCategory}`}
                icon={<Category />}
                color={theme.palette.success.main}
                trend={trends.categoryTrend.direction !== 'neutral' ? {
                  direction: trends.categoryTrend.direction,
                  value: trends.categoryTrend.value,
                  isPercentage: true
                } : undefined}
                delay={200}
              />
            </Grid>
          </Grid>
          
          {/* Tab Navigation */}
          <Box sx={{ mb: 3 }}>
            <Paper 
              elevation={0}
              sx={{ 
                borderRadius: 3, 
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                overflow: 'hidden'
              }}
            >
              <Tabs 
                value={tabValue} 
                onChange={handleTabChange} 
                indicatorColor="primary"
                textColor="primary"
                variant="fullWidth"
                sx={{ 
                  '.MuiTab-root': {
                    minHeight: '48px',
                    fontWeight: 500,
                    fontSize: '0.875rem',
                    textTransform: 'none',
                  },
                }}
              >
                <Tab 
                  label="По категориям" 
                  icon={<PieChart fontSize="small" />} 
                  iconPosition="start"
                />
                <Tab 
                  label="По месяцам" 
                  icon={<BarChart fontSize="small" />} 
                  iconPosition="start"
                />
              </Tabs>
            </Paper>
          </Box>
          
          {/* Chart Tabs */}
          <AnimatePresence mode="wait">
            {tabValue === 0 && (
              <motion.div
                key="categories"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Paper 
                  elevation={0}
                  sx={{ 
                    p: 3, 
                    borderRadius: 3, 
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    overflow: 'hidden'
                  }}
                >
                  <Typography variant="h6" fontWeight="600" gutterBottom>
                    Распределение расходов по категориям
                  </Typography>
                  <Box sx={{ height: { xs: 300, sm: 400 }, display: 'flex', justifyContent: 'center', my: 2 }}>
                    {chartData.categories.length > 0 ? (
                      <Doughnut 
                        data={{
                          labels: chartData.categories,
                          datasets: [
                            {
                              label: 'Расходы',
                              data: chartData.categoryAmounts,
                              backgroundColor: chartData.categoryColors,
                              borderColor: chartData.categoryBorderColors,
                              borderWidth: 1,
                            }
                          ]
                        }} 
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: isMobile ? 'bottom' : 'right',
                              labels: {
                                usePointStyle: true,
                                boxWidth: 8,
                                font: {
                                  size: 12
                                },
                                padding: 15
                              }
                            },
                            tooltip: {
                              callbacks: {
                                label: (context) => `${context.label}: ${context.raw} ₽`
                              },
                              padding: 10,
                              titleFont: {
                                size: 14
                              },
                              bodyFont: {
                                size: 13
                              }
                            }
                          }
                        }} 
                      />
                    ) : (
                      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                        <Typography color="text.secondary">Нет данных для отображения</Typography>
                      </Box>
                    )}
                  </Box>
                </Paper>
              </motion.div>
            )}
            
            {tabValue === 1 && (
              <motion.div
                key="monthly"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Paper 
                  elevation={0}
                  sx={{ 
                    p: 3, 
                    borderRadius: 3, 
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    overflow: 'hidden'
                  }}
                >
                  <Typography variant="h6" fontWeight="600" gutterBottom>
                    Динамика расходов по месяцам
                  </Typography>
                  <Box sx={{ height: { xs: 300, sm: 400 }, my: 2 }}>
                    {chartData.months.length > 0 ? (
                      <Bar 
                        data={{
                          labels: chartData.months,
                          datasets: [
                            {
                              label: 'Расходы',
                              data: chartData.monthlyAmounts,
                              backgroundColor: theme.palette.primary.main,
                              borderRadius: 8,
                              maxBarThickness: 40
                            }
                          ]
                        }} 
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              display: false
                            },
                            tooltip: {
                              callbacks: {
                                label: (context) => `Расходы: ${parseInt(context.raw as string).toLocaleString()} ₽`
                              },
                              padding: 10,
                              titleFont: {
                                size: 14
                              },
                              bodyFont: {
                                size: 13
                              }
                            }
                          },
                          scales: {
                            y: {
                              beginAtZero: true,
                              ticks: {
                                callback: (value) => `${value} ₽`,
                                font: {
                                  size: 11
                                }
                              },
                              grid: {
                                color: alpha(theme.palette.text.primary, 0.05),
                                drawBorder: false
                              }
                            },
                            x: {
                              grid: {
                                display: false
                              },
                              ticks: {
                                font: {
                                  size: 11
                                }
                              }
                            }
                          }
                        }} 
                      />
                    ) : (
                      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                        <Typography color="text.secondary">Нет данных для отображения</Typography>
                      </Box>
                    )}
                  </Box>
                </Paper>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Information Chip */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Tooltip title="Данные обновляются автоматически при добавлении новых расходов">
              <Chip
                icon={<Info fontSize="small" />}
                label={`${stats.expenseCount} расход${stats.expenseCount % 10 === 1 && stats.expenseCount % 100 !== 11 ? '' : stats.expenseCount % 10 >= 2 && stats.expenseCount % 10 <= 4 && (stats.expenseCount % 100 < 10 || stats.expenseCount % 100 >= 20) ? 'а' : 'ов'} за период`}
                variant="outlined"
                size="small"
                sx={{
                  backgroundColor: alpha(theme.palette.primary.main, 0.05),
                  borderColor: alpha(theme.palette.primary.main, 0.2),
                  color: theme.palette.text.secondary,
                  fontWeight: 500,
                  '& .MuiChip-icon': {
                    color: theme.palette.primary.main
                  }
                }}
              />
            </Tooltip>
          </Box>
        </Box>
      </Container>
    </motion.div>
  );
};

export default Analytics; 