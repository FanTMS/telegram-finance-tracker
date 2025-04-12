import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Avatar,
  AvatarGroup,
  useTheme,
  Alert,
  Slide,
  Container,
  Badge,
  Tooltip,
  CircularProgress,
  Tab,
  Tabs,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  Switch,
  FormControlLabel,
  LinearProgress,
  Autocomplete,
  Stack,
  Popover,
  styled,
  Fab
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  AccountBalance as AccountBalanceIcon,
  Restaurant as RestaurantIcon,
  LocalGroceryStore as GroceryIcon,
  DirectionsCar as CarIcon,
  Home as HomeIcon,
  LocalHospital as HealthIcon,
  School as EducationIcon,
  SportsEsports as EntertainmentIcon,
  MoreHoriz as MoreIcon,
  Group as GroupIcon,
  ArrowForward as ArrowForwardIcon,
  ViewList as ViewListIcon,
  Workspaces as WorkspacesIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
  CalendarMonth as CalendarIcon,
  ShowChart as ChartIcon,
  CompareArrows as CompareIcon,
  AutoAwesome as SmartIcon,
  EventRepeat as RepeatIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  People as PeopleIcon,
  Person as PersonIcon,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  ShowChart as LineChartIcon,
  Notifications as NotificationsIcon,
  ShoppingCart as ShoppingCartIcon,
  Pets as PetsIcon,
  Celebration as CelebrationIcon,
  LocalLaundryService as ClothingIcon,
  Wifi as InternetIcon,
  Receipt as ReceiptIcon,
  Money as InvestmentIcon,
  Lightbulb as UtilityIcon,
  CardGiftcard as GiftIcon,
  Category as CategoryIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  AccountCircle as AccountCircleIcon,
  EmojiEmotions as EmojiIcon,
  Restore as ResetIcon
} from '@mui/icons-material';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useTelegramApp } from '../hooks/useTelegramApp';
import { createExpense, getGroupExpenses, deleteExpense, getGroups, Expense, Group, getUser, updateExpense, User } from '../services/firebase';
import { Timestamp } from 'firebase/firestore';
import { alpha as muiAlpha } from '@mui/material/styles';
import DebtSummary from '../components/DebtSummary';
import toast from 'react-hot-toast';
import { Header } from '../components/UI';
import AddExpenseDialog from '../components/AddExpenseDialog';
import RecurringExpenseDialog from '../components/RecurringExpenseDialog';
import EditExpenseDialog from '../components/EditExpenseDialog';
import { createExpenseSplitNotifications, createExpenseUpdateNotifications, createRecurringExpenseNotification } from '../services/notifications';
import { collection, addDoc, getDocs, query, where, orderBy, deleteDoc, doc, updateDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

// Импортируем компоненты для интерактивных графиков
import {
  ResponsiveContainer,
  PieChart, Pie,
  Cell,
  BarChart, Bar,
  XAxis, YAxis,
  Tooltip as ChartTooltip,
  Legend,
  LineChart, Line,
  CartesianGrid,
  AreaChart, Area
} from 'recharts';

// Интерфейс для статистики категорий
interface CategoryStat {
  id: string;
  name: string;
  amount: number;
  percentage: number;
  icon: React.ReactNode;
  color: string;
}

// Интерфейс для периодических расходов
interface RecurringExpense {
  id: string;
  description: string;
  amount: number;
  category: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  nextDate: Date;
  groupId: string;
  active: boolean;
  createdBy?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// Интерфейс для сравнения периодов
interface PeriodComparison {
  currentPeriod: number;
  previousPeriod: number;
  change: number;
  changePercentage: number;
}

// Expense categories with icons and colors
const categories = [
  { id: 'food', name: 'Еда', icon: <RestaurantIcon />, color: '#FF5722' },
  { id: 'grocery', name: 'Продукты', icon: <GroceryIcon />, color: '#4CAF50' },
  { id: 'transport', name: 'Транспорт', icon: <CarIcon />, color: '#2196F3' },
  { id: 'housing', name: 'Жилье', icon: <HomeIcon />, color: '#9C27B0' },
  { id: 'health', name: 'Здоровье', icon: <HealthIcon />, color: '#E91E63' },
  { id: 'education', name: 'Образование', icon: <EducationIcon />, color: '#3F51B5' },
  { id: 'entertainment', name: 'Развлечения', icon: <EntertainmentIcon />, color: '#FF9800' },
  { id: 'other', name: 'Другое', icon: <MoreIcon />, color: '#607D8B' },
];

// Обновляем интерфейс Expense чтобы соответствовать структуре из firebase
export interface ExpenseWithTimestamp extends Expense {
  timestamp: Timestamp;
}

const Expenses = (): JSX.Element => {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, showAlert, showConfirm } = useTelegramApp();
  const [searchParams] = useSearchParams();
  const groupId = searchParams.get('groupId');
  const initialAction = searchParams.get('action');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [openAddDialog, setOpenAddDialog] = useState(initialAction === 'add');
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('food');
  const [selectedGroupId, setSelectedGroupId] = useState(groupId || '');
  const [loading, setLoading] = useState(false);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    category: '',
    description: '',
  });
  const [groupMembers, setGroupMembers] = useState<User[]>([]);
  
  // Новые состояния для улучшенного функционала
  const [viewMode, setViewMode] = useState<'list' | 'categories'>('list');
  const [categoryStats, setCategoryStats] = useState<CategoryStat[]>([]);
  const [periodComparison, setPeriodComparison] = useState<PeriodComparison | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [openRecurringDialog, setOpenRecurringDialog] = useState(false);
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
  const [showRecurringExpenses, setShowRecurringExpenses] = useState(false);
  const [recurringFormData, setRecurringFormData] = useState({
    description: '',
    amount: '',
    category: 'food',
    frequency: 'monthly',
    nextDate: new Date(),
    groupId: '',
    active: true
  });
  const [filterAnchorEl, setFilterAnchorEl] = useState<HTMLElement | null>(null);
  const [filters, setFilters] = useState({
    minAmount: '',
    maxAmount: '',
    categories: [] as string[],
    dateFrom: null as Date | null,
    dateTo: null as Date | null,
  });
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'category'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterActive, setIsFilterActive] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  // Добавляем состояние для интерактивных графиков
  const [showChartDetails, setShowChartDetails] = useState(false);
  const [selectedCategoryForDetails, setSelectedCategoryForDetails] = useState<string | null>(null);
  const [chartType, setChartType] = useState<'pie' | 'bar' | 'line'>('pie');

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        when: "beforeChildren",
        duration: 0.3,
      },
    },
    exit: {
      opacity: 0,
      transition: {
        staggerChildren: 0.05,
        staggerDirection: -1,
        when: "afterChildren",
      }
    }
  };

  const itemVariants = {
    hidden: { 
      opacity: 0, 
      y: 20,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 350,
        damping: 25,
      },
    },
    exit: {
      opacity: 0,
      y: -10,
      transition: {
        duration: 0.2,
      }
    },
    hover: {
      y: -4,
      scale: 1.02,
      boxShadow: '0px 6px 20px rgba(0, 0, 0, 0.1)',
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 15,
      }
    },
    tap: {
      scale: 0.98,
      boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.1)',
      transition: {
        type: 'spring',
        stiffness: 500,
        damping: 20,
      }
    }
  };

  // Fetch user's groups
  useEffect(() => {
    async function fetchUserGroups() {
      if (!user?.id) return;
      
      setLoadingGroups(true);
      try {
        const userGroups = await getGroups(user.id.toString());
        setGroups(userGroups);
        
        // If no group is selected and we have groups, select the first one
        if (!selectedGroupId && userGroups.length > 0) {
          setSelectedGroupId(userGroups[0].id);
        }
      } catch (error) {
        console.error('Error fetching groups:', error);
        showAlert('Ошибка при загрузке групп');
      } finally {
        setLoadingGroups(false);
      }
    }
    
    fetchUserGroups();
  }, [user]);

  // Fetch expenses for the group when selectedGroupId changes
  useEffect(() => {
    if (selectedGroupId) {
      fetchExpenses();
      fetchGroupMembers();
    } else {
      // Set empty expenses list if no group ID
      setExpenses([]);
      setLoading(false);
    }
  }, [selectedGroupId]);
  
  // Fetch group members
  const fetchGroupMembers = async () => {
    if (!selectedGroupId) return;
    
    try {
      const selectedGroup = groups.find(g => g.id === selectedGroupId);
      if (!selectedGroup || !selectedGroup.members) return;
      
      const membersPromises = selectedGroup.members.map(async (memberId) => {
        try {
          const user = await getUser(memberId);
          return user || { id: memberId, name: `Пользователь ${memberId}` };
        } catch (error) {
          console.error(`Error fetching user ${memberId}:`, error);
          return { id: memberId, name: `Пользователь ${memberId}` };
        }
      });
      
      const members = await Promise.all(membersPromises);
      setGroupMembers(members.filter(Boolean) as User[]);
    } catch (error) {
      console.error('Error fetching group members:', error);
    }
  };

  const fetchExpenses = async () => {
    if (!selectedGroupId) return;
    
    setLoading(true);
    try {
      const groupExpenses = await getGroupExpenses(selectedGroupId);
      setExpenses(groupExpenses);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      showAlert('Ошибка при загрузке расходов');
    } finally {
      setLoading(false);
    }
  };

  // Определяем тип для функции handleAddExpense, использующей правильное преобразование timestamp
  const handleAddExpense = async (expenseData?: {
    amount: number;
    description: string;
    category: string;
    groupId: string;
    splitBetween: string[];
    paidBy: string[];
  }) => {
    try {
      setLoading(true);
      
      // Если данные пришли из диалога, используем их
      const newExpense: Omit<Expense, "id"> = expenseData ? {
        groupId: expenseData.groupId,
        amount: expenseData.amount,
        category: expenseData.category,
        description: expenseData.description,
        createdBy: user?.id?.toString() || '',
        createdAt: Timestamp.now(),
        splitBetween: expenseData.splitBetween,
        paidBy: expenseData.paidBy
      } : {
        // Используем данные из состояния (старая логика)
        groupId: selectedGroupId,
        amount: parseFloat(amount),
        category: category,
        description: description,
        createdBy: user?.id?.toString() || '',
        createdAt: Timestamp.now(),
        splitBetween: [],
        paidBy: []
      };
      
      const createdExpense = await createExpense(newExpense);
      
      // Создаем уведомления о новом расходе
      if (user?.id && newExpense.splitBetween.length > 0) {
        await createExpenseSplitNotifications(
          newExpense.groupId,
          createdExpense.id,
          newExpense.amount,
          newExpense.description,
          user.id.toString(),
          newExpense.splitBetween
        );
      }
      
      toast.success('Расход успешно добавлен');
      setOpenAddDialog(false);
      fetchExpenses();
      
      // Сбрасываем форму
      setAmount('');
      setDescription('');
      setCategory('food');
    } catch (error) {
      console.error('Error adding expense:', error);
      toast.error('Ошибка при добавлении расхода');
    } finally {
      setLoading(false);
    }
  };

  // Функция редактирования расхода
  const handleEditExpense = async (expenseId: string, expenseData: {
    amount: number;
    description: string;
    category: string;
    splitBetween: string[];
    paidBy: string[];
  }) => {
    try {
      setLoading(true);
      
      await updateExpense(expenseId, {
        amount: expenseData.amount,
        description: expenseData.description,
        category: expenseData.category,
        splitBetween: expenseData.splitBetween,
        paidBy: expenseData.paidBy
      });
      
      // Создаем уведомления об изменении расхода
      if (user?.id && selectedGroupId) {
        await createExpenseUpdateNotifications(
          selectedGroupId,
          expenseId,
          expenseData.amount,
          expenseData.description,
          user.id.toString(),
          expenseData.splitBetween,
          expenseData.paidBy
        );
      }
      
      toast.success('Расход успешно обновлен');
      setOpenEditDialog(false);
      setSelectedExpense(null);
      fetchExpenses();
    } catch (error) {
      console.error('Error updating expense:', error);
      toast.error('Ошибка при обновлении расхода');
    } finally {
      setLoading(false);
    }
  };

  // Функция для открытия диалога редактирования
  const handleOpenEditDialog = (expense: Expense) => {
    setSelectedExpense(expense);
    setOpenEditDialog(true);
  };

  // Handle deleting an expense
  const handleDeleteExpense = async (expenseId: string) => {
    const confirmed = await showConfirm('Вы уверены, что хотите удалить этот расход?');
    if (!confirmed) return;
    
    setLoading(true);
    try {
      await deleteExpense(expenseId);
      
      // Refresh the list
      fetchExpenses();
      
      showAlert('Расход успешно удален');
    } catch (error) {
      console.error('Error deleting expense:', error);
      showAlert('Ошибка при удалении расхода');
    } finally {
      setLoading(false);
    }
  };

  // Get category icon
  const getCategoryIcon = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.icon || <MoreIcon />;
  };

  // Format timestamp to readable date
  const formatDate = (timestamp: Timestamp) => {
    return timestamp.toDate().toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // Generate color for group
  const getGroupColor = (name: string) => {
    const colors = [
      '#1976d2', // Blue
      '#388e3c', // Green
      '#d32f2f', // Red
      '#f57c00', // Orange
      '#7b1fa2', // Purple
      '#0097a7', // Teal
      '#c2185b', // Pink
      '#00897b', // Green-Teal
      '#5c6bc0', // Indigo
      '#fbc02d', // Yellow
    ];
    
    // Simple hash function to get a consistent color for the same name
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Use the hash to pick a color
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  // Вычисление статистики по категориям
  useEffect(() => {
    if (expenses.length > 0) {
      const categoryTotals: Record<string, number> = {};
      let total = 0;
      
      // Суммируем расходы по категориям
      expenses.forEach(expense => {
        const cat = expense.category || 'other';
        categoryTotals[cat] = (categoryTotals[cat] || 0) + expense.amount;
        total += expense.amount;
      });
      
      // Формируем статистику по категориям с процентами
      const stats: CategoryStat[] = categories.map(cat => {
        const amount = categoryTotals[cat.id] || 0;
        const percentage = total > 0 ? (amount / total) * 100 : 0;
        return {
          id: cat.id,
          name: cat.name,
          amount,
          percentage,
          icon: cat.icon,
          color: cat.color
        };
      }).filter(stat => stat.amount > 0)
      .sort((a, b) => b.amount - a.amount);
      
      setCategoryStats(stats);
    } else {
      setCategoryStats([]);
    }
  }, [expenses]);

  // Сравнение с предыдущим периодом
  useEffect(() => {
    // Имитация получения данных для сравнения периодов
    // В реальном приложении здесь должен быть запрос к API
    const simulateComparisonData = () => {
      if (expenses.length === 0) return;
      
      const currentTotal = expenses.reduce((sum, exp) => sum + exp.amount, 0);
      // Симуляция предыдущего периода (85-115% от текущего)
      const randomFactor = 0.85 + Math.random() * 0.3;
      const previousTotal = Math.round(currentTotal * randomFactor);
      const change = currentTotal - previousTotal;
      const changePercentage = previousTotal > 0 ? (change / previousTotal) * 100 : 0;
      
      setPeriodComparison({
        currentPeriod: currentTotal,
        previousPeriod: previousTotal,
        change,
        changePercentage
      });
    };
    
    simulateComparisonData();
  }, [expenses, selectedPeriod]);

  // Функция для обработки клика по категории в графике
  const handleCategoryClick = (category: string) => {
    setSelectedCategoryForDetails(category);
    setShowChartDetails(true);
  };
  
  // Функция для отображения детальной информации о расходах по категории
  const renderCategoryDetails = () => {
    if (!selectedCategoryForDetails) return null;
    
    const categoryExpenses = expenses.filter(exp => exp.category === selectedCategoryForDetails) as ExpenseWithTimestamp[];
    const categoryName = categories.find(c => c.id === selectedCategoryForDetails)?.name || 'Неизвестная категория';
    const categoryColor = getGroupColor(selectedCategoryForDetails);
    
    return (
      <Dialog 
        open={showChartDetails} 
        onClose={() => setShowChartDetails(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar
              sx={{
                width: 32,
                height: 32,
                mr: 1.5,
                bgcolor: muiAlpha(categoryColor, 0.2),
                color: categoryColor
              }}
            >
              {getCategoryIcon(selectedCategoryForDetails)}
            </Avatar>
            <Typography variant="h6">{categoryName}</Typography>
          </Box>
          <IconButton onClick={() => setShowChartDetails(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {categoryExpenses.length > 0 ? (
            <>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                  Распределение по дням
                </Typography>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart
                    data={getDailyExpenseDataForCategory(selectedCategoryForDetails)}
                    margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(date) => new Date(date).toLocaleDateString('ru', { day: '2-digit', month: '2-digit' })}
                    />
                    <YAxis />
                    <ChartTooltip
                      formatter={(value: number) => [`${value.toLocaleString()} ₽`, 'Сумма']}
                      labelFormatter={(label) => new Date(label).toLocaleDateString('ru')}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="amount" 
                      stroke={categoryColor} 
                      activeDot={{ r: 8 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
              
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                Список расходов
              </Typography>
              <List>
                {categoryExpenses.map((expense) => (
                  <React.Fragment key={expense.id}>
                    <ListItem>
                      <Box>
                        <Typography variant="body1">
                          {expense.description}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                          <Typography component="span" variant="body2">
                            {expense.amount.toLocaleString()} ₽
                          </Typography>
                          <Typography component="span" variant="body2" sx={{ mx: 1, color: 'text.secondary' }}>•</Typography>
                          <Typography component="span" variant="body2" color="text.secondary">
                            {expense.timestamp ? expense.timestamp.toDate().toLocaleDateString() : 'Нет даты'}
                          </Typography>
                        </Box>
                      </Box>
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                ))}
              </List>
            </>
          ) : (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">
                Нет расходов в этой категории
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowChartDetails(false)}>Закрыть</Button>
        </DialogActions>
      </Dialog>
    );
  };
  
  // Функция для получения данных по дням для выбранной категории
  const getDailyExpenseDataForCategory = (categoryId: string) => {
    if (!expenses || expenses.length === 0) return [];
    
    const categoryExpenses = expenses.filter(exp => exp.category === categoryId) as ExpenseWithTimestamp[];
    const dateMap = new Map<string, { date: string, amount: number }>();
    
    categoryExpenses.forEach(expense => {
      if (!expense.timestamp) return;
      
      const date = expense.timestamp.toDate().toISOString().split('T')[0];
      const existing = dateMap.get(date) || { date, amount: 0 };
      
      existing.amount += expense.amount;
      dateMap.set(date, existing);
    });
    
    return Array.from(dateMap.values()).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  };
  
  // Функция для отображения интерактивного графика категорий
  const renderInteractiveChart = () => {
    // Подготовка данных для графика
    const chartData = categories.map(category => {
      const categoryExpenses = expenses.filter(exp => exp.category === category.id);
      const totalAmount = categoryExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      const percentage = expenses.length > 0 ? (totalAmount / expenses.reduce((sum, exp) => sum + exp.amount, 0)) * 100 : 0;
      
      return {
        id: category.id,
        name: category.name,
        amount: totalAmount,
        percentage
      };
    }).filter(item => item.amount > 0);
    
    if (chartData.length === 0) {
      return (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">
            Нет данных для построения графика
          </Typography>
        </Box>
      );
    }
    
    // Переключатель типа графика
    const renderChartTypeSelector = () => (
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
        <IconButton 
          onClick={() => setChartType('pie')}
          color={chartType === 'pie' ? 'primary' : 'default'}
        >
          <PieChartIcon />
        </IconButton>
        <IconButton 
          onClick={() => setChartType('bar')}
          color={chartType === 'bar' ? 'primary' : 'default'}
        >
          <BarChartIcon />
        </IconButton>
        <IconButton 
          onClick={() => setChartType('line')}
          color={chartType === 'line' ? 'primary' : 'default'}
        >
          <LineChartIcon />
        </IconButton>
      </Box>
    );
    
    return (
      <Paper 
        sx={{ 
          p: 2, 
          mb: 3, 
          borderRadius: 3,
          bgcolor: muiAlpha(theme.palette.background.paper, 0.6),
          backdropFilter: 'blur(10px)',
        }}
      >
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, textAlign: 'center' }}>
          Распределение расходов по категориям
        </Typography>
        
        {renderChartTypeSelector()}
        
        {chartType === 'pie' && (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                dataKey="amount"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                innerRadius={60}
                labelLine={false}
                onClick={(data) => handleCategoryClick(data.id)}
                label={({ name, percentage }) => `${name} (${percentage.toFixed(0)}%)`}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={getGroupColor(entry.id)} 
                    style={{ cursor: 'pointer' }}
                  />
                ))}
              </Pie>
              <ChartTooltip 
                formatter={(value: number) => [`${value.toLocaleString()} ₽`, 'Сумма']}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
        
        {chartType === 'bar' && (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <ChartTooltip
                formatter={(value: number) => [`${value.toLocaleString()} ₽`, 'Сумма']}
              />
              <Bar 
                dataKey="amount" 
                onClick={(data) => handleCategoryClick(data.id)} 
                style={{ cursor: 'pointer' }}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getGroupColor(entry.id)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
        
        {chartType === 'line' && (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={getTimeSeriesData()}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(date) => new Date(date).toLocaleDateString('ru', { day: '2-digit', month: '2-digit' })}
              />
              <YAxis />
              <ChartTooltip
                formatter={(value: number) => [`${value.toLocaleString()} ₽`, 'Сумма']}
                labelFormatter={(label) => new Date(label).toLocaleDateString('ru')}
              />
              <Legend />
              {categories.map((category) => {
                // Проверяем, есть ли расходы для этой категории
                const hasExpenses = getTimeSeriesData().some(item => item[category.id] > 0);
                if (!hasExpenses) return null;
                
                return (
                  <Line
                    key={category.id}
                    type="monotone"
                    dataKey={category.id}
                    name={category.name}
                    stroke={getGroupColor(category.id)}
                    activeDot={{ r: 8, onClick: () => handleCategoryClick(category.id) }}
                    style={{ cursor: 'pointer' }}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        )}
        
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            Нажмите на категорию для просмотра детальной информации
          </Typography>
        </Box>
      </Paper>
    );
  };
  
  // Функция для подготовки данных временного ряда для линейного графика
  const getTimeSeriesData = () => {
    if (!expenses || expenses.length === 0) return [];
    
    const dateMap = new Map<string, {date: string, [key: string]: any}>();
    
    (expenses as ExpenseWithTimestamp[]).forEach(expense => {
      if (!expense.timestamp) return;
      
      const date = expense.timestamp.toDate().toISOString().split('T')[0];
      const existingDate = dateMap.get(date) || { date };
      const category = expense.category || 'other';
      
      existingDate[category] = (existingDate[category] || 0) + expense.amount;
      dateMap.set(date, existingDate);
    });
    
    return Array.from(dateMap.values()).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  };

  // Функция для отображения списка расходов
  const renderExpenses = () => {
    const filteredExpenses = getFilteredAndSortedExpenses();
    
    if (filteredExpenses.length === 0) {
      return (
        <Paper 
          sx={{ 
            p: 3, 
            mb: 3, 
            borderRadius: 3,
            textAlign: 'center',
            bgcolor: muiAlpha(theme.palette.background.paper, 0.6),
          }}
        >
          <Typography color="text.secondary" gutterBottom>
            Нет данных о расходах
          </Typography>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setOpenAddDialog(true)}
            sx={{ mt: 2 }}
          >
            Добавить расход
          </Button>
        </Paper>
      );
    }
    
    return (
      <Box>
        {/* Панель поиска и фильтрации */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 2,
          mt: 1
        }}>
          <TextField
            placeholder="Поиск по описанию..."
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
              sx: { borderRadius: 2 }
            }}
            sx={{ mr: 1, flexGrow: 1 }}
          />
          
          <IconButton 
            onClick={handleOpenFilter}
            color={isFilterActive ? "primary" : "default"}
            sx={{ 
              borderRadius: 2,
              bgcolor: isFilterActive ? muiAlpha(theme.palette.primary.main, 0.1) : 'transparent'
            }}
          >
            <Badge 
              color="primary" 
              variant="dot" 
              invisible={!isFilterActive}
            >
              <FilterIcon />
            </Badge>
          </IconButton>
          
          <IconButton 
            onClick={() => {
              setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
            }}
            sx={{ borderRadius: 2, ml: 1 }}
          >
            <SortIcon sx={{ 
              transform: sortOrder === 'asc' ? 'rotate(0deg)' : 'rotate(180deg)',
              transition: 'transform 0.2s'
            }} />
          </IconButton>
          
          <ToggleButtonGroup
            value={sortBy}
            exclusive
            onChange={(e, newValue) => {
              if (newValue) setSortBy(newValue);
            }}
            size="small"
            sx={{ ml: 1 }}
          >
            <ToggleButton value="date" aria-label="sort by date">
              <CalendarIcon fontSize="small" />
            </ToggleButton>
            <ToggleButton value="amount" aria-label="sort by amount">
              <Typography variant="caption">₽</Typography>
            </ToggleButton>
            <ToggleButton value="category" aria-label="sort by category">
              <WorkspacesIcon fontSize="small" />
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
        
        {/* Статистика */}
        <Box sx={{ mb: 3 }}>
          <Button 
            variant="outlined" 
            color="primary"
            startIcon={<ChartIcon />}
            onClick={() => setViewMode('categories')}
            fullWidth
            sx={{ borderRadius: 2, py: 1 }}
          >
            Показать статистику по категориям
          </Button>
        </Box>
        
        {/* Список расходов */}
        <AnimatePresence>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {filteredExpenses.map((expense) => (
              <motion.div
                key={expense.id}
                variants={itemVariants}
                whileHover="hover"
                whileTap="tap"
                layout
              >
                <Card 
                  sx={{ 
                    mb: 2, 
                    borderRadius: 3,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                    overflow: 'visible'
                  }}
                >
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                        <Avatar
                          sx={{
                            bgcolor: muiAlpha(getGroupColor(expense.category || 'other'), 0.1),
                            color: getGroupColor(expense.category || 'other'),
                            width: 40,
                            height: 40,
                            mr: 1.5
                          }}
                        >
                          {getCategoryIcon(expense.category || 'other')}
                        </Avatar>
                        
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                            {expense.description}
                          </Typography>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                            <Chip 
                              label={categories.find(c => c.id === expense.category)?.name || 'Другое'} 
                              size="small"
                              sx={{ 
                                mr: 1, 
                                mb: 0.5,
                                bgcolor: muiAlpha(getGroupColor(expense.category || 'other'), 0.07),
                                color: 'text.secondary',
                                fontWeight: 500,
                              }}
                            />
                            
                            <Typography variant="caption" color="text.secondary" sx={{ mr: 1, mb: 0.5 }}>
                              {expense.timestamp ? formatDate(expense.timestamp) : 'Нет даты'}
                            </Typography>
                            
                            {expense.splitBetween && expense.splitBetween.length > 0 && (
                              <Tooltip title="Разделено между">
                                <Chip
                                  icon={<PeopleIcon fontSize="small" />}
                                  label={expense.splitBetween.length}
                                  size="small"
                                  sx={{ 
                                    mb: 0.5,
                                    bgcolor: 'rgba(0, 0, 0, 0.04)',
                                  }}
                                />
                              </Tooltip>
                            )}
                            
                            {expense.paidBy && expense.paidBy.length > 0 && (
                              <Tooltip title="Оплачено">
                                <Chip
                                  icon={<PersonIcon fontSize="small" />}
                                  label={expense.paidBy.length}
                                  size="small"
                                  sx={{ 
                                    mb: 0.5,
                                    ml: 0.5,
                                    bgcolor: 'rgba(0, 0, 0, 0.04)',
                                  }}
                                />
                              </Tooltip>
                            )}
                          </Box>
                        </Box>
                      </Box>
                      
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                          {expense.amount.toLocaleString()} ₽
                        </Typography>
                        
                        <Box>
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => handleOpenEditDialog(expense)}
                            sx={{ mt: 0.5, mr: 0.5 }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => handleDeleteExpense(expense.id)}
                            sx={{ mt: 0.5 }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </Box>
    );
  };

  // Заменяем получение фиктивных данных на работу с базой данных
  useEffect(() => {
    // Получение регулярных расходов из базы данных
    const fetchRecurringExpenses = async () => {
      if (!selectedGroupId || !user?.id) return;
      
      try {
        // Запрос к Firebase для получения регулярных расходов
        const recurringExpensesRef = collection(db, 'recurringExpenses');
        const q = query(
          recurringExpensesRef,
          where('groupId', '==', selectedGroupId),
          orderBy('nextDate', 'asc')
        );
        
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          // Преобразуем данные из Firestore, приводя timestamp к Date
          const fetchedExpenses = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              nextDate: data.nextDate.toDate() // Преобразуем Timestamp в Date
            } as RecurringExpense;
          });
          
          setRecurringExpenses(fetchedExpenses);
        } else {
          // Проверяем, есть ли данные в localStorage для миграции
          const localStorageKey = `recurringExpenses_${selectedGroupId}`;
          const savedExpenses = localStorage.getItem(localStorageKey);
          
          if (savedExpenses) {
            // Мигрируем данные из localStorage в Firebase
            const parsedExpenses = JSON.parse(savedExpenses, (key, value) => {
              if (key === 'nextDate') return new Date(value);
              return value;
            });
            
            // Добавляем записи в Firebase
            const migratePromises = parsedExpenses.map(async (expense: any) => {
              // Create a new object without the id
              const { id, ...expenseDataWithoutId } = expense;
              
              const expenseData = {
                ...expenseDataWithoutId,
                createdBy: user.id,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                nextDate: Timestamp.fromDate(new Date(expense.nextDate))
              };
              
              const docRef = await addDoc(collection(db, 'recurringExpenses'), expenseData);
              return {
                id: docRef.id,
                ...expenseDataWithoutId,
                nextDate: expense.nextDate
              };
            });
            
            const migratedExpenses = await Promise.all(migratePromises);
            setRecurringExpenses(migratedExpenses);
            
            // Удаляем данные из localStorage после миграции
            localStorage.removeItem(localStorageKey);
          } else {
            // Если данных нет ни в Firebase, ни в localStorage, устанавливаем пустой массив
            setRecurringExpenses([]);
          }
        }
      } catch (error) {
        console.error('Error fetching recurring expenses:', error);
        toast.error('Ошибка при загрузке регулярных расходов');
      }
    };
    
    fetchRecurringExpenses();
  }, [selectedGroupId, user?.id]);

  // Обновляем также функцию handleAddRecurringExpense для сохранения в Firebase
  const handleAddRecurringExpense = async () => {
    // Validate required fields
    if (!recurringFormData.description || !recurringFormData.amount) {
      toast.error('Пожалуйста, заполните все обязательные поля');
      return;
    }

    try {
      const groupId = recurringFormData.groupId || selectedGroupId;
      const userId = typeof user?.id === 'number' ? user.id.toString() : user?.id || '';
      
      // Создаем объект с данными для Firebase
      const newExpenseData = {
        description: recurringFormData.description,
        amount: parseFloat(recurringFormData.amount),
        category: recurringFormData.category,
        frequency: recurringFormData.frequency as 'monthly',
        nextDate: Timestamp.fromDate(recurringFormData.nextDate),
        groupId: groupId,
        active: true,
        createdBy: userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      // Добавляем в Firebase
      const docRef = await addDoc(collection(db, 'recurringExpenses'), newExpenseData);
      
      // Создаем объект для локального состояния
      const newExpense = {
        id: docRef.id,
        description: recurringFormData.description,
        amount: parseFloat(recurringFormData.amount),
        category: recurringFormData.category,
        frequency: recurringFormData.frequency as 'monthly',
        nextDate: recurringFormData.nextDate,
        groupId: groupId,
        active: true,
        createdBy: userId
      };
      
      // Добавляем в текущее состояние
      setRecurringExpenses(prev => [...prev, newExpense as RecurringExpense]);
      
      // Создаем уведомление о новом регулярном платеже, если группа имеет участников
      const selectedGroup = groups.find(g => g.id === groupId);
      
      // Если у группы есть другие участники, кроме создателя, отправляем им уведомления
      if (selectedGroup && selectedGroup.members && selectedGroup.members.length > 1) {
        // Создаем уведомления для всех участников группы кроме создателя
        const otherMembers = selectedGroup.members.filter(memberId => memberId !== userId);
        
        // Используем новую функцию для уведомлений о регулярных расходах
        try {
          await createRecurringExpenseNotification(
            groupId,
            docRef.id,
            newExpense.amount,
            newExpense.description,
            userId,
            otherMembers
          );
        } catch (error) {
          console.error('Error creating notifications:', error);
          // Не прерываем выполнение, продолжаем даже при ошибке уведомлений
        }
      }
      
      // Use toast for notification
      toast.success(`Регулярный платеж "${newExpense.description}" добавлен`);
      
      // Reset form data after successful addition
      setRecurringFormData({
        description: '',
        amount: '',
        category: 'food',
        frequency: 'monthly',
        nextDate: new Date(),
        groupId: '',
        active: true
      });
      setOpenRecurringDialog(false);
    } catch (error) {
      console.error('Error adding recurring expense:', error);
      toast.error('Ошибка при добавлении регулярного платежа');
    }
  };

  // Обновляем функцию handleToggleRecurringExpense для работы с Firebase
  const handleToggleRecurringExpense = async (id: string) => {
    const expense = recurringExpenses.find(exp => exp.id === id);
    if (!expense) return;
    
    const newStatus = !expense.active;
    
    try {
      // Обновляем запись в Firebase
      const recurringExpenseRef = doc(db, 'recurringExpenses', id);
      await updateDoc(recurringExpenseRef, {
        active: newStatus,
        updatedAt: serverTimestamp()
      });
      
      // Обновляем состояние
      const updatedExpenses = recurringExpenses.map(exp => 
        exp.id === id ? { ...exp, active: newStatus } : exp
      );
      setRecurringExpenses(updatedExpenses);
      
      // Show toast notification
      toast.success(`Регулярный платеж "${expense.description}" ${newStatus ? 'активирован' : 'деактивирован'}`);
    } catch (error) {
      console.error('Error updating recurring expense:', error);
      toast.error('Ошибка при обновлении статуса платежа');
    }
  };

  // Обновляем функцию удаления регулярного платежа для работы с Firebase
  const handleDeleteRecurringExpense = async (id: string) => {
    try {
      // Находим удаляемый платеж для показа уведомления
      const expense = recurringExpenses.find(exp => exp.id === id);
      if (!expense) return;
      
      // Удаляем из Firebase
      const recurringExpenseRef = doc(db, 'recurringExpenses', id);
      await deleteDoc(recurringExpenseRef);
      
      // Удаляем из текущего состояния
      const updatedExpenses = recurringExpenses.filter(exp => exp.id !== id);
      setRecurringExpenses(updatedExpenses);
      
      // Показываем уведомление об успешном удалении
      toast.success(`Регулярный платеж "${expense.description}" удален`);
      
    } catch (error) {
      console.error('Error deleting recurring expense:', error);
      toast.error('Ошибка при удалении регулярного платежа');
    }
  };

  // Фильтрация и сортировка списка расходов
  const getFilteredAndSortedExpenses = () => {
    let filteredExpenses = [...expenses] as ExpenseWithTimestamp[];
    
    // Применяем поиск
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredExpenses = filteredExpenses.filter(exp => 
        exp.description.toLowerCase().includes(query)
      );
    }
    
    // Применяем фильтры
    if (isFilterActive) {
      if (filters.minAmount) {
        filteredExpenses = filteredExpenses.filter(exp => 
          exp.amount >= parseFloat(filters.minAmount)
        );
      }
      
      if (filters.maxAmount) {
        filteredExpenses = filteredExpenses.filter(exp => 
          exp.amount <= parseFloat(filters.maxAmount)
        );
      }
      
      if (filters.categories.length > 0) {
        filteredExpenses = filteredExpenses.filter(exp => 
          filters.categories.includes(exp.category || 'other')
        );
      }
      
      if (filters.dateFrom) {
        filteredExpenses = filteredExpenses.filter(exp => 
          exp.timestamp?.toDate() >= (filters.dateFrom as Date)
        );
      }
      
      if (filters.dateTo) {
        filteredExpenses = filteredExpenses.filter(exp => 
          exp.timestamp?.toDate() <= (filters.dateTo as Date)
        );
      }
    }
    
    // Применяем сортировку
    filteredExpenses.sort((a, b) => {
      if (sortBy === 'date') {
        return sortOrder === 'asc' 
          ? a.timestamp?.toDate().getTime() - b.timestamp?.toDate().getTime()
          : b.timestamp?.toDate().getTime() - a.timestamp?.toDate().getTime();
      } else if (sortBy === 'amount') {
        return sortOrder === 'asc' ? a.amount - b.amount : b.amount - a.amount;
      } else if (sortBy === 'category') {
        const catA = a.category || 'other';
        const catB = b.category || 'other';
        return sortOrder === 'asc' 
          ? catA.localeCompare(catB)
          : catB.localeCompare(catA);
      }
      return 0;
    });
    
    return filteredExpenses;
  };

  // Get frequency text
  const getFrequencyText = (frequency: string) => {
    switch (frequency) {
      case 'daily': return 'Ежедневно';
      case 'weekly': return 'Еженедельно';
      case 'monthly': return 'Ежемесячно';
      case 'yearly': return 'Ежегодно';
      default: return 'Регулярно';
    }
  };

  // Open filter popover
  const handleOpenFilter = (event: React.MouseEvent<HTMLElement>) => {
    setFilterAnchorEl(event.currentTarget);
  };

  // Close filter popover
  const handleCloseFilter = () => {
    setFilterAnchorEl(null);
  };

  // Apply filters
  const handleApplyFilters = () => {
    setIsFilterActive(true);
    handleCloseFilter();
  };

  // Reset filters
  const handleResetFilters = () => {
    setFilters({
      minAmount: '',
      maxAmount: '',
      categories: [],
      dateFrom: null,
      dateTo: null,
    });
    setIsFilterActive(false);
    handleCloseFilter();
  };

  // Filter popover
  const renderFilterPopover = () => {
    const open = Boolean(filterAnchorEl);
    const id = open ? 'filter-popover' : undefined;
    
    return (
      <Popover
        id={id}
        open={open}
        anchorEl={filterAnchorEl}
        onClose={handleCloseFilter}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        PaperProps={{
          sx: { 
            width: 320, 
            p: 2,
            borderRadius: 2,
            mt: 1
          }
        }}
      >
        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>Фильтры</Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="Мин. сумма"
              size="small"
              type="number"
              value={filters.minAmount}
              onChange={(e) => setFilters(prev => ({ ...prev, minAmount: e.target.value }))}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="Макс. сумма"
              size="small"
              type="number"
              value={filters.maxAmount}
              onChange={(e) => setFilters(prev => ({ ...prev, maxAmount: e.target.value }))}
            />
          </Grid>
        </Grid>
        
        <FormControl fullWidth sx={{ mt: 2 }}>
          <InputLabel size="small">Категории</InputLabel>
          <Select
            multiple
            size="small"
            value={filters.categories}
            label="Категории"
            onChange={(e) => setFilters(prev => ({ 
              ...prev, 
              categories: typeof e.target.value === 'string' 
                ? e.target.value.split(',') 
                : e.target.value 
            }))}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((value) => {
                  const category = categories.find(c => c.id === value);
                  return (
                    <Chip 
                      key={value} 
                      label={category?.name} 
                      size="small"
                      sx={{ 
                        bgcolor: muiAlpha(getGroupColor(value), 0.1),
                        color: getGroupColor(value),
                      }}
                    />
                  );
                })}
              </Box>
            )}
          >
            {categories.map((category) => (
              <MenuItem key={category.id} value={category.id}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar 
                    sx={{ 
                      width: 24, 
                      height: 24, 
                      mr: 1,
                      bgcolor: muiAlpha(category.color, 0.1),
                      color: category.color
                    }}
                  >
                    {category.icon}
                  </Avatar>
                  {category.name}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="Дата с"
              size="small"
              type="date"
              value={filters.dateFrom ? filters.dateFrom.toISOString().split('T')[0] : ''}
              onChange={(e) => setFilters(prev => ({ 
                ...prev, 
                dateFrom: e.target.value ? new Date(e.target.value) : null 
              }))}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="Дата по"
              size="small"
              type="date"
              value={filters.dateTo ? filters.dateTo.toISOString().split('T')[0] : ''}
              onChange={(e) => setFilters(prev => ({ 
                ...prev, 
                dateTo: e.target.value ? new Date(e.target.value) : null 
              }))}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Button onClick={handleResetFilters} size="small">
            Сбросить
          </Button>
          <Button 
            variant="contained" 
            onClick={handleApplyFilters}
            size="small"
          >
            Применить
          </Button>
        </Box>
      </Popover>
    );
  };

  // Render group selector
  const renderGroupSelector = () => {
    if (loadingGroups) {
      return <CircularProgress size={24} sx={{ display: 'block', mx: 'auto' }} />;
    }
    
    if (groups.length === 0) {
      return (
        <Alert severity="info" sx={{ mb: 2 }}>
          У вас нет доступных групп. Создайте группу для отслеживания расходов.
        </Alert>
      );
    }
    
    return (
      <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
        <InputLabel>Выберите группу</InputLabel>
        <Select
          value={selectedGroupId}
          onChange={(e) => {
            setSelectedGroupId(e.target.value);
            // Fetch expenses for this group
            if (e.target.value) {
              fetchExpenses();
            }
          }}
          label="Выберите группу"
        >
          {groups.map((group) => (
            <MenuItem key={group.id} value={group.id}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar 
                  sx={{ 
                    width: 24, 
                    height: 24, 
                    bgcolor: muiAlpha(getGroupColor(group.name), 0.2),
                    color: getGroupColor(group.name),
                    fontSize: '0.8rem',
                    mr: 1
                  }}
                >
                  {group.name.charAt(0).toUpperCase()}
                </Avatar>
                {group.name}
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    );
  };

  // Восстанавливаем функцию для отображения сравнения периодов
  const renderPeriodComparison = () => {
    if (!periodComparison) return null;
    
    return (
      <Paper 
        sx={{ 
          p: 2, 
          mb: 3, 
          borderRadius: 3,
          bgcolor: muiAlpha(theme.palette.background.paper, 0.6),
          backdropFilter: 'blur(10px)',
          border: `1px solid ${theme.palette.divider}`
        }}
      >
        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center' }}>
          <CompareIcon sx={{ mr: 1 }} />
          Сравнение с предыдущим периодом
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: muiAlpha(theme.palette.primary.main, 0.05) }}>
              <Typography variant="caption" color="text.secondary">
                Текущий {selectedPeriod === 'week' ? 'неделя' : selectedPeriod === 'month' ? 'месяц' : 'год'}
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {periodComparison.currentPeriod.toLocaleString()} ₽
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: muiAlpha(theme.palette.primary.main, 0.05) }}>
              <Typography variant="caption" color="text.secondary">
                Предыдущий {selectedPeriod === 'week' ? 'неделя' : selectedPeriod === 'month' ? 'месяц' : 'год'}
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {periodComparison.previousPeriod.toLocaleString()} ₽
              </Typography>
            </Box>
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Chip
            icon={
              <ArrowForwardIcon 
                fontSize="small" 
                sx={{ 
                  transform: periodComparison.change >= 0 ? 'rotate(45deg)' : 'rotate(-45deg)',
                  color: 'inherit',
                }} 
              />
            }
            label={`${periodComparison.change >= 0 ? '+' : ''}${periodComparison.change.toLocaleString()} ₽ (${periodComparison.changePercentage >= 0 ? '+' : ''}${periodComparison.changePercentage.toFixed(1)}%)`}
            sx={{
              bgcolor: periodComparison.change >= 0 
                ? muiAlpha(theme.palette.error.main, 0.1) 
                : muiAlpha(theme.palette.success.main, 0.1),
              color: periodComparison.change >= 0 
                ? theme.palette.error.main 
                : theme.palette.success.main,
              fontWeight: 500,
            }}
          />
        </Box>
        
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
          <ToggleButtonGroup
            value={selectedPeriod}
            exclusive
            onChange={(e, newValue) => newValue && setSelectedPeriod(newValue)}
            size="small"
          >
            <ToggleButton value="week" size="small">
              <Typography variant="caption">Неделя</Typography>
            </ToggleButton>
            <ToggleButton value="month" size="small">
              <Typography variant="caption">Месяц</Typography>
            </ToggleButton>
            <ToggleButton value="year" size="small">
              <Typography variant="caption">Год</Typography>
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Paper>
    );
  };

  // Восстанавливаем функцию для отображения статистики по категориям
  const renderCategoryStats = () => {
    if (categoryStats.length === 0) {
      return (
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography color="text.secondary" gutterBottom>
            Нет данных для отображения статистики
          </Typography>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setOpenAddDialog(true)}
            sx={{ mt: 2 }}
          >
            Добавить расход
          </Button>
        </Box>
      );
    }
    
    return (
      <Box>
        <Paper 
          sx={{ 
            p: 2, 
            mb: 3, 
            borderRadius: 3,
            bgcolor: muiAlpha(theme.palette.background.paper, 0.6),
          }}
        >
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Распределение по категориям
          </Typography>
          
          <Box sx={{ mb: 3 }}>
            {categoryStats.map((category) => (
              <Box key={category.id} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                  <Avatar
                    sx={{
                      width: 28,
                      height: 28,
                      bgcolor: muiAlpha(category.color, 0.1),
                      color: category.color,
                      mr: 1.5
                    }}
                  >
                    {category.icon}
                  </Avatar>
                  <Typography variant="body2" sx={{ fontWeight: 500, flex: 1 }}>
                    {category.name}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {category.amount.toLocaleString()} ₽
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 1, width: 40, textAlign: 'right' }}>
                    {category.percentage.toFixed(1)}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={category.percentage}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: muiAlpha(category.color, 0.1),
                    '& .MuiLinearProgress-bar': {
                      bgcolor: category.color,
                    }
                  }}
                />
              </Box>
            ))}
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Button
              variant="outlined"
              onClick={() => setViewMode('list')}
              startIcon={<ViewListIcon />}
              size="small"
            >
              Показать список расходов
            </Button>
          </Box>
        </Paper>
      </Box>
    );
  };

  // Восстанавливаем функцию для отображения регулярных расходов
  const renderRecurringExpenses = () => {
    if (recurringExpenses.length === 0) {
      return (
        <Box sx={{ py: 2, textAlign: 'center' }}>
          <Typography color="text.secondary">
            У вас нет регулярных расходов
          </Typography>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setOpenRecurringDialog(true)}
            sx={{ mt: 2 }}
          >
            Добавить
          </Button>
        </Box>
      );
    }
    
    // Фильтруем расходы только для выбранной группы
    const filteredRecurringExpenses = recurringExpenses.filter(
      expense => expense.groupId === selectedGroupId
    );
    
    if (filteredRecurringExpenses.length === 0) {
      return (
        <Box sx={{ py: 2, textAlign: 'center' }}>
          <Typography color="text.secondary">
            В выбранной группе нет регулярных расходов
          </Typography>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setOpenRecurringDialog(true)}
            sx={{ mt: 2 }}
          >
            Добавить
          </Button>
        </Box>
      );
    }
    
    return (
      <List>
        {filteredRecurringExpenses.map((expense) => (
          <React.Fragment key={expense.id}>
            <ListItem>
              <Box sx={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        mr: 1.5,
                        bgcolor: muiAlpha(getGroupColor(expense.category), 0.2),
                        color: getGroupColor(expense.category)
                      }}
                    >
                      {getCategoryIcon(expense.category)}
                    </Avatar>
                    <Typography variant="subtitle2">
                      {expense.description}
                    </Typography>
                  </Box>
                  <Box sx={{ pl: 5, pt: 0.5, display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}>
                    <Typography variant="body2" component="span">
                      {expense.amount.toLocaleString()} ₽
                    </Typography>
                    <Typography variant="caption" component="span" sx={{ mx: 1, color: 'text.secondary' }}>•</Typography>
                    <Typography variant="caption" component="span" color="text.secondary">
                      {getFrequencyText(expense.frequency)}
                    </Typography>
                    <Typography variant="caption" component="span" sx={{ mx: 1, color: 'text.secondary' }}>•</Typography>
                    <Typography variant="caption" component="span" color="text.secondary">
                      Следующий платеж: {expense.nextDate.toLocaleDateString()}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FormControlLabel
                    control={
                      <Switch 
                        size="small"
                        checked={expense.active}
                        onChange={() => handleToggleRecurringExpense(expense.id)}
                      />
                    }
                    label=""
                  />
                  <IconButton 
                    edge="end" 
                    aria-label="delete"
                    size="small"
                    color="error"
                    onClick={() => handleDeleteRecurringExpense(expense.id)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            </ListItem>
            <Divider sx={{ mb: 1 }} />
          </React.Fragment>
        ))}
      </List>
    );
  };

  // Функция для проверки и уведомления о скорых платежах
  const checkUpcomingPayments = () => {
    // Проверяем только если есть регулярные платежи и пользователь авторизован
    if (recurringExpenses.length === 0 || !user?.id) return;
    
    // Получаем сегодняшнюю дату
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Получаем дату через 3 дня
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(today.getDate() + 3);
    threeDaysFromNow.setHours(23, 59, 59, 999);
    
    // Фильтруем платежи, которые нужно оплатить в ближайшие 3 дня
    const upcomingPayments = recurringExpenses.filter(expense => {
      if (!expense.active) return false;
      
      const nextDate = new Date(expense.nextDate);
      nextDate.setHours(0, 0, 0, 0);
      
      return nextDate >= today && nextDate <= threeDaysFromNow;
    });
    
    // Если есть предстоящие платежи, показываем уведомление
    if (upcomingPayments.length > 0) {
      const paymentsList = upcomingPayments.map((payment: RecurringExpense) => 
        `${payment.description}: ${payment.amount.toLocaleString()} ₽ (${payment.nextDate.toLocaleDateString()})`
      ).join('\n');
      
      // Показываем уведомление о предстоящих платежах
      setTimeout(() => {
        toast.success(
          <div>
            <Typography variant="subtitle2">У вас скоро предстоят платежи:</Typography>
            <ul style={{ marginTop: 8, paddingLeft: 16 }}>
              {upcomingPayments.map((payment: RecurringExpense) => (
                <li key={payment.id} style={{ marginBottom: 4 }}>
                  <strong>{payment.description}</strong>: {payment.amount.toLocaleString()} ₽ 
                  <span style={{ fontSize: '0.85rem', color: '#666', marginLeft: 4 }}>
                    ({payment.nextDate.toLocaleDateString()})
                  </span>
                </li>
              ))}
            </ul>
          </div>,
          { duration: 10000 }
        );
      }, 1000);
    }
  };
  
  // Проверяем предстоящие платежи при загрузке компонента
  useEffect(() => {
    checkUpcomingPayments();
  }, [recurringExpenses]);

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Header title="Расходы" />
      
      {/* Добавляем селектор групп для фильтрации расходов */}
      {renderGroupSelector()}
      
      {/* Tabs для переключения между различными представлениями */}
      <Tabs
        value={activeTab}
        onChange={(e, newValue) => setActiveTab(newValue)}
        variant="fullWidth"
        sx={{ mb: 3 }}
      >
        <Tab label="Обзор" />
        <Tab label="Регулярные" />
      </Tabs>
      
      {/* Основной контент - зависит от выбранной вкладки */}
      {activeTab === 0 ? (
        // Вкладка "Обзор"
        <Box>
          {/* Фильтры и сортировка */}
          <Paper 
            sx={{ 
              p: 2, 
              mb: 3, 
              borderRadius: 3,
              bgcolor: muiAlpha(theme.palette.background.paper, 0.6),
              backdropFilter: 'blur(10px)',
              border: `1px solid ${theme.palette.divider}`
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                <RepeatIcon sx={{ mr: 1 }} />
                Сравнение с предыдущим периодом
              </Typography>
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                onClick={() => setOpenRecurringDialog(true)}
              >
                Добавить регулярный расход
              </Button>
            </Box>
            
            {renderPeriodComparison()}
          </Paper>
          
          {/* Интерактивный график для категорий */}
          {renderInteractiveChart()}
          
          {/* Содержимое в зависимости от режима просмотра */}
          {viewMode === 'categories' ? (
            // Статистика
            renderCategoryStats()
          ) : (
            // Список расходов
            renderExpenses()
          )}
          
          {/* Диалог с деталями категории */}
          {renderCategoryDetails()}
        </Box>
      ) : (
        // Вкладка "Регулярные"
        <Box>
          {/* Карточка с информацией о регулярных расходах */}
          <Paper 
            sx={{ 
              p: 2, 
              mb: 3,
              borderRadius: 3,
              bgcolor: muiAlpha(theme.palette.background.paper, 0.6),
              backdropFilter: 'blur(10px)',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                <RepeatIcon sx={{ mr: 1 }} />
                Регулярные расходы
              </Typography>
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                onClick={() => setOpenRecurringDialog(true)}
              >
                Добавить
              </Button>
            </Box>
            
            {renderRecurringExpenses()}
            
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Button
                variant="outlined"
                startIcon={<NotificationsIcon />}
                onClick={() => {
                  toast.success('Уведомления о регулярных платежах включены');
                  checkUpcomingPayments();
                }}
              >
                Включить уведомления о платежах
              </Button>
            </Box>
          </Paper>
        </Box>
      )}
      
      {/* FAB для добавления нового расхода (только на вкладке "Обзор") */}
      {activeTab === 0 && (
        <Fab 
          color="primary" 
          aria-label="add"
          onClick={() => setOpenAddDialog(true)}
          sx={{
            position: 'fixed',
            bottom: 80,
            right: 24,
          }}
        >
          <AddIcon />
        </Fab>
      )}
      
      {/* Диалоги */}
      <AddExpenseDialog 
        open={openAddDialog} 
        onClose={() => setOpenAddDialog(false)}
        onSubmit={handleAddExpense}
        loading={loading}
        groups={groups}
        selectedGroupId={selectedGroupId}
        currentUserId={user?.id?.toString()}
        groupMembers={groupMembers}
      />
      
      <EditExpenseDialog
        open={openEditDialog}
        onClose={() => {
          setOpenEditDialog(false);
          setSelectedExpense(null);
        }}
        onSubmit={handleEditExpense}
        loading={loading}
        expense={selectedExpense}
        groupMembers={groupMembers}
        currentUserId={user?.id?.toString()}
      />
      
      <RecurringExpenseDialog 
        open={openRecurringDialog}
        onClose={() => setOpenRecurringDialog(false)}
        onSubmit={(formData) => {
          setRecurringFormData(formData);
          handleAddRecurringExpense();
        }}
        groups={groups}
        selectedGroupId={selectedGroupId}
      />
    </Container>
  );
};

export default Expenses; 