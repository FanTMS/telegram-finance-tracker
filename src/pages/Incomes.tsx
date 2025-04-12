import React, { useState, useEffect } from 'react';
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
  Stack,
  Popover,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Radio,
  RadioGroup,
  styled,
  Autocomplete
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  AccountBalance as AccountBalanceIcon,
  AttachMoney as AttachMoneyIcon,
  Work as WorkIcon,
  Business as BusinessIcon,
  CardGiftcard as GiftIcon,
  Payments as PaymentsIcon,
  CurrencyExchange as InvestmentIcon,
  MoreHoriz as MoreIcon,
  Group as GroupIcon,
  ArrowForward as ArrowForwardIcon,
  ViewList as ViewListIcon,
  Workspaces as WorkspacesIcon,
  TrendingUp as TrendingUpIcon,
  EventRepeat as RepeatIcon,
  CalendarMonth as CalendarIcon,
  ShowChart as ChartIcon,
  CompareArrows as CompareIcon,
  AddAlert as NotificationIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useTelegramApp } from '../hooks/useTelegramApp';
import { 
  createIncome, 
  getUserIncomes, 
  getGroups, 
  getGroupIncomes,
  deleteIncome,
  createRegularIncome,
  getUserRegularIncomes,
  getGroupRegularIncomes,
  updateRegularIncome,
  deleteRegularIncome,
  Income, 
  Group,
  RegularIncome as RegularIncomeType
} from '../services/firebase';
import { Timestamp } from 'firebase/firestore';
import { alpha as muiAlpha } from '@mui/material/styles';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer } from 'recharts';

// Интерфейс для прогноза доходов
interface IncomeForecast {
  month: string;
  amount: number;
  predictedAmount: number;
}

// Интерфейс для сравнения периодов
interface PeriodComparison {
  currentPeriod: number;
  previousPeriod: number;
  change: number;
  changePercentage: number;
}

// Income categories with icons and colors
const categories = [
  { id: 'salary', name: 'Зарплата', icon: <WorkIcon />, color: '#2196F3' },
  { id: 'freelance', name: 'Фриланс', icon: <BusinessIcon />, color: '#9C27B0' },
  { id: 'investment', name: 'Инвестиции', icon: <InvestmentIcon />, color: '#4CAF50' },
  { id: 'gift', name: 'Подарок', icon: <GiftIcon />, color: '#FF9800' },
  { id: 'refund', name: 'Возврат', icon: <PaymentsIcon />, color: '#F44336' },
  { id: 'other', name: 'Другое', icon: <MoreIcon />, color: '#607D8B' },
];

const Incomes: React.FC = () => {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, showAlert, showConfirm } = useTelegramApp();
  const [searchParams] = useSearchParams();
  const groupId = searchParams.get('groupId');
  const initialAction = searchParams.get('action');
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [openAddDialog, setOpenAddDialog] = useState(initialAction === 'add');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('salary');
  const [selectedGroupId, setSelectedGroupId] = useState(groupId || '');
  const [loading, setLoading] = useState(false);
  const [loadingGroups, setLoadingGroups] = useState(false);
  
  // Новые состояния для улучшенного функционала
  const [viewMode, setViewMode] = useState<'list' | 'forecast' | 'regular'>('list');
  const [forecastData, setForecastData] = useState<IncomeForecast[]>([]);
  const [periodComparison, setPeriodComparison] = useState<PeriodComparison | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year'>('month');
  const [openRegularDialog, setOpenRegularDialog] = useState(false);
  const [regularIncomes, setRegularIncomes] = useState<RegularIncomeType[]>([]);
  const [regularFormData, setRegularFormData] = useState({
    description: '',
    amount: '',
    category: 'salary',
    frequency: 'monthly',
    nextDate: new Date(),
    active: true,
    groupId: selectedGroupId
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'category'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [forecastMonths, setForecastMonths] = useState(6);

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

  // Fetch incomes for the user
  useEffect(() => {
    if (user?.id) {
      fetchIncomes();
    } else {
      // Set empty incomes list if no user ID
      setIncomes([]);
      setLoading(false);
    }
  }, [user?.id, selectedGroupId]);

  const fetchIncomes = async () => {
    setLoading(true);
    try {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      
      let fetchedIncomes: Income[] = [];
      
      if (selectedGroupId) {
        // Fetch group incomes if a group is selected
        fetchedIncomes = await getGroupIncomes(selectedGroupId);
      } else {
        // Otherwise fetch user's incomes
        fetchedIncomes = await getUserIncomes(user.id.toString());
      }
      
      setIncomes(fetchedIncomes);
    } catch (error) {
      console.error('Error fetching incomes:', error);
      showAlert('Ошибка при загрузке доходов');
    } finally {
      setLoading(false);
    }
  };

  const handleAddIncome = async () => {
    if (!amount) {
      showAlert('Пожалуйста, укажите сумму');
      return;
    }

    if (!user) {
      showAlert('Ошибка: пользователь не авторизован');
      return;
    }

    // Validate amount as a number
    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      showAlert('Сумма должна быть положительным числом');
      return;
    }

    setLoading(true);
    try {
      const newIncome = {
        userId: user.id.toString(),
        amount: amountValue,
        category,
        description: description || '',
        date: Timestamp.now(),
        ...(selectedGroupId && { groupId: selectedGroupId }), // Add groupId if selected
      };

      console.log('Adding income:', newIncome);
      await createIncome(newIncome);
      
      setOpenAddDialog(false);
      setAmount('');
      setDescription('');
      setCategory('salary');
      showAlert('Доход успешно добавлен');
      
      // Refresh incomes list
      await fetchIncomes();
    } catch (error) {
      console.error('Error adding income:', error);
      showAlert('Ошибка при добавлении дохода');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteIncome = async (incomeId: string) => {
    try {
      const confirmed = await showConfirm('Вы уверены, что хотите удалить этот доход?');
      
      if (confirmed) {
        await deleteIncome(incomeId);
        setIncomes(incomes.filter(income => income.id !== incomeId));
        showAlert('Доход удален');
      }
    } catch (error) {
      console.error('Error deleting income:', error);
      showAlert('Ошибка при удалении дохода');
    }
  };

  const getCategoryIcon = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.icon : <MoreIcon />;
  };

  const formatDate = (timestamp: Timestamp) => {
    return timestamp.toDate().toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Get random color for group avatar
  const getGroupColor = (name: string) => {
    const colors = [
      '#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5', 
      '#2196F3', '#03A9F4', '#00BCD4', '#009688', '#4CAF50', 
      '#8BC34A', '#CDDC39', '#FFC107', '#FF9800', '#FF5722'
    ];
    
    if (!name || name.length === 0) {
      return colors[0];
    }
    
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  // Генерация данных прогноза доходов
  useEffect(() => {
    if (incomes.length > 0) {
      generateForecastData();
    }
  }, [incomes, forecastMonths]);

  // Генерация данных сравнения периодов
  useEffect(() => {
    if (incomes.length > 0) {
      generatePeriodComparison();
    }
  }, [incomes, selectedPeriod]);

  // Генерация фиктивных регулярных доходов
  useEffect(() => {
    if (user?.id) {
      fetchRegularIncomes();
    }
  }, [user?.id, selectedGroupId]);

  // Fetch regular incomes based on selected group or user
  const fetchRegularIncomes = async () => {
    try {
      if (!user?.id) return;
      
      let fetchedRegularIncomes: RegularIncomeType[] = [];
      
      if (selectedGroupId) {
        // Fetch group regular incomes if a group is selected
        fetchedRegularIncomes = await getGroupRegularIncomes(selectedGroupId);
      } else {
        // Otherwise fetch user's regular incomes
        fetchedRegularIncomes = await getUserRegularIncomes(user.id.toString());
      }
      
      setRegularIncomes(fetchedRegularIncomes);
    } catch (error) {
      console.error('Error fetching regular incomes:', error);
      showAlert('Ошибка при загрузке регулярных доходов');
    }
  };

  // Генерация данных для прогноза
  const generateForecastData = () => {
    const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    // Группируем доходы по месяцам за последние 6 месяцев
    const pastMonthsData: { [key: string]: number } = {};
    
    // Заполняем данные за прошедшие месяцы
    for (let i = 5; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      const year = currentMonth - i < 0 ? currentYear - 1 : currentYear;
      const key = `${months[monthIndex]} ${year}`;
      pastMonthsData[key] = 0;
    }
    
    // Суммируем фактические доходы по месяцам
    incomes.forEach(income => {
      const date = income.date.toDate();
      const monthIndex = date.getMonth();
      const year = date.getFullYear();
      const key = `${months[monthIndex]} ${year}`;
      
      // Учитываем только последние 6 месяцев
      if (pastMonthsData[key] !== undefined) {
        pastMonthsData[key] += income.amount;
      }
    });
    
    // Формируем массив данных для графика
    const pastData = Object.entries(pastMonthsData).map(([month, amount]) => ({
      month,
      amount,
      predictedAmount: amount // Для прошедших месяцев предсказание = фактическому значению
    }));
    
    // Прогнозируем доходы на будущие месяцы
    const futureData: IncomeForecast[] = [];
    
    // Вычисляем среднее значение за последние 3 месяца для прогноза
    const lastThreeMonths = Object.values(pastMonthsData).slice(-3);
    const avgIncome = lastThreeMonths.reduce((sum, val) => sum + val, 0) / lastThreeMonths.length;
    
    // Добавляем прогноз на указанное количество месяцев вперед
    for (let i = 1; i <= forecastMonths; i++) {
      const monthIndex = (currentMonth + i) % 12;
      const year = currentMonth + i >= 12 ? currentYear + 1 : currentYear;
      const key = `${months[monthIndex]} ${year}`;
      
      // Рассчитываем прогноз с небольшими колебаниями
      const factor = 0.9 + Math.random() * 0.25; // случайный фактор от 0.9 до 1.15
      const predictedAmount = Math.round(avgIncome * factor);
      
      futureData.push({
        month: key,
        amount: 0, // нет фактических данных
        predictedAmount
      });
    }
    
    setForecastData([...pastData, ...futureData]);
  };

  // Генерация данных сравнения с предыдущим периодом
  const generatePeriodComparison = () => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    let currentPeriodIncomes: Income[] = [];
    let previousPeriodIncomes: Income[] = [];
    
    if (selectedPeriod === 'month') {
      // Текущий месяц
      currentPeriodIncomes = incomes.filter(income => {
        const date = income.date.toDate();
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      });
      
      // Предыдущий месяц
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      previousPeriodIncomes = incomes.filter(income => {
        const date = income.date.toDate();
        return date.getMonth() === prevMonth && date.getFullYear() === prevYear;
      });
    } else if (selectedPeriod === 'quarter') {
      // Текущий квартал
      const currentQuarter = Math.floor(currentMonth / 3);
      currentPeriodIncomes = incomes.filter(income => {
        const date = income.date.toDate();
        return Math.floor(date.getMonth() / 3) === currentQuarter && date.getFullYear() === currentYear;
      });
      
      // Предыдущий квартал
      const prevQuarter = currentQuarter === 0 ? 3 : currentQuarter - 1;
      const prevYear = currentQuarter === 0 ? currentYear - 1 : currentYear;
      previousPeriodIncomes = incomes.filter(income => {
        const date = income.date.toDate();
        return Math.floor(date.getMonth() / 3) === prevQuarter && date.getFullYear() === prevYear;
      });
    } else if (selectedPeriod === 'year') {
      // Текущий год
      currentPeriodIncomes = incomes.filter(income => {
        const date = income.date.toDate();
        return date.getFullYear() === currentYear;
      });
      
      // Предыдущий год
      previousPeriodIncomes = incomes.filter(income => {
        const date = income.date.toDate();
        return date.getFullYear() === currentYear - 1;
      });
    }
    
    const currentTotal = currentPeriodIncomes.reduce((sum, income) => sum + income.amount, 0);
    const previousTotal = previousPeriodIncomes.reduce((sum, income) => sum + income.amount, 0);
    const change = currentTotal - previousTotal;
    const changePercentage = previousTotal > 0 ? (change / previousTotal) * 100 : 0;
    
    setPeriodComparison({
      currentPeriod: currentTotal,
      previousPeriod: previousTotal,
      change,
      changePercentage
    });
  };

  // Добавление регулярного дохода
  const handleAddRegularIncome = async () => {
    // Проверка заполнения полей формы
    if (!regularFormData.description || !regularFormData.amount) {
      showAlert('Пожалуйста, заполните все поля');
      return;
    }

    if (!user) {
      showAlert('Ошибка: пользователь не авторизован');
      return;
    }

    try {
      // Создаем новый регулярный доход
      const newRegularIncome = {
        userId: user.id.toString(),
        description: regularFormData.description,
        amount: parseFloat(regularFormData.amount),
        category: regularFormData.category,
        frequency: regularFormData.frequency as 'monthly',
        nextDate: Timestamp.fromDate(regularFormData.nextDate),
        active: true,
        ...(regularFormData.groupId && { groupId: regularFormData.groupId }), // Add groupId if selected
      };
      
      // Добавляем в базу данных
      await createRegularIncome(newRegularIncome);
      
      // Сбрасываем форму и закрываем диалог
      setRegularFormData({
        description: '',
        amount: '',
        category: 'salary',
        frequency: 'monthly',
        nextDate: new Date(),
        active: true,
        groupId: ''
      });
      setOpenRegularDialog(false);
      
      // Обновляем список регулярных доходов
      await fetchRegularIncomes();
      
      showAlert('Регулярный доход добавлен');
    } catch (error) {
      console.error('Error adding regular income:', error);
      showAlert('Ошибка при добавлении регулярного дохода');
    }
  };

  // Переключение статуса регулярного дохода
  const handleToggleRegularIncome = async (id: string) => {
    try {
      const income = regularIncomes.find(inc => inc.id === id);
      if (!income) return;
      
      // Обновляем статус в базе данных
      await updateRegularIncome(id, { active: !income.active });
      
      // Обновляем локальное состояние
      setRegularIncomes(prev => 
        prev.map(income => 
          income.id === id ? { ...income, active: !income.active } : income
        )
      );
      
      showAlert(`Регулярный доход ${income.active ? 'деактивирован' : 'активирован'}`);
    } catch (error) {
      console.error('Error toggling regular income:', error);
      showAlert('Ошибка при изменении статуса дохода');
    }
  };

  // Удаление регулярного дохода
  const handleDeleteRegularIncome = async (id: string) => {
    try {
      const confirmed = await showConfirm('Вы уверены, что хотите удалить этот регулярный доход?');
      
      if (confirmed) {
        await deleteRegularIncome(id);
        setRegularIncomes(prev => prev.filter(income => income.id !== id));
        showAlert('Регулярный доход удален');
      }
    } catch (error) {
      console.error('Error deleting regular income:', error);
      showAlert('Ошибка при удалении регулярного дохода');
    }
  };

  // Получение цвета категории
  const getCategoryColor = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.color || '#607D8B';
  };

  // Получение текстового описания частоты
  const getFrequencyText = (frequency: string) => {
    switch (frequency) {
      case 'daily': return 'Ежедневно';
      case 'weekly': return 'Еженедельно';
      case 'monthly': return 'Ежемесячно';
      case 'yearly': return 'Ежегодно';
      default: return 'Регулярно';
    }
  };

  // Render income forecast
  const renderIncomeForecast = () => {
    if (forecastData.length === 0) {
      return (
        <Box sx={{ py: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">
            Недостаточно данных для прогнозирования
          </Typography>
        </Box>
      );
    }
    
    return (
      <Box>
        <Paper 
          sx={{ 
            p: 2, 
            mb: 3, 
            borderRadius: 2,
            bgcolor: 'background.paper',
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
          }}
        >
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
              <TrendingUpIcon sx={{ mr: 1 }} />
              Прогноз доходов
            </Typography>
            
            <FormControl size="small" sx={{ width: 120 }}>
              <Select
                value={forecastMonths}
                onChange={(e) => setForecastMonths(Number(e.target.value))}
                size="small"
              >
                <MenuItem value={3}>3 месяца</MenuItem>
                <MenuItem value={6}>6 месяцев</MenuItem>
                <MenuItem value={12}>12 месяцев</MenuItem>
              </Select>
            </FormControl>
          </Box>
          
          <Box sx={{ height: 300, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={forecastData}
                margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12 }} 
                  tickFormatter={value => value.split(' ')[0]}
                />
                <YAxis 
                  width={60}
                  tickFormatter={value => value === 0 ? '0' : `${Math.round(value / 1000)}K`}
                />
                <ChartTooltip 
                  formatter={(value: any) => [`${Number(value).toLocaleString()} ₽`, '']}
                  labelFormatter={(label) => `${label}`}
                />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke={theme.palette.primary.main}
                  strokeWidth={2}
                  name="Фактические"
                  activeDot={{ r: 8 }}
                />
                <Line
                  type="monotone"
                  dataKey="predictedAmount"
                  stroke={theme.palette.warning.main}
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  name="Прогнозируемые"
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
          
          <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
            <Typography variant="body2" color="text.secondary">
              Прогноз основан на анализе ваших доходов за последние 3 месяца.
              Данные и прогноз могут меняться в зависимости от вашей финансовой активности.
            </Typography>
          </Box>
        </Paper>
        
        {/* Период сравнения */}
        {periodComparison && (
          <Paper 
            sx={{ 
              p: 2, 
              mb: 3, 
              borderRadius: 2,
              bgcolor: 'background.paper',
              boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
            }}
          >
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                <CompareIcon sx={{ mr: 1 }} fontSize="small" />
                Сравнение периодов
              </Typography>
              
              <ToggleButtonGroup
                value={selectedPeriod}
                exclusive
                onChange={(e, newValue) => newValue && setSelectedPeriod(newValue)}
                size="small"
              >
                <ToggleButton value="month" size="small">
                  <Typography variant="caption">Месяц</Typography>
                </ToggleButton>
                <ToggleButton value="quarter" size="small">
                  <Typography variant="caption">Квартал</Typography>
                </ToggleButton>
                <ToggleButton value="year" size="small">
                  <Typography variant="caption">Год</Typography>
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: muiAlpha(theme.palette.primary.main, 0.05) }}>
                  <Typography variant="caption" color="text.secondary">
                    Текущий {selectedPeriod === 'month' ? 'месяц' : selectedPeriod === 'quarter' ? 'квартал' : 'год'}
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {periodComparison.currentPeriod.toLocaleString()} ₽
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: muiAlpha(theme.palette.primary.main, 0.05) }}>
                  <Typography variant="caption" color="text.secondary">
                    Предыдущий {selectedPeriod === 'month' ? 'месяц' : selectedPeriod === 'quarter' ? 'квартал' : 'год'}
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
                    ? muiAlpha(theme.palette.success.main, 0.1) 
                    : muiAlpha(theme.palette.error.main, 0.1),
                  color: periodComparison.change >= 0 
                    ? theme.palette.success.main 
                    : theme.palette.error.main,
                  fontWeight: 500,
                }}
              />
            </Box>
          </Paper>
        )}
      </Box>
    );
  };

  // Render regular incomes
  const renderRegularIncomes = () => {
    return (
      <Box>
        <Paper 
          sx={{ 
            p: 2, 
            mb: 3, 
            borderRadius: 2,
            bgcolor: 'background.paper',
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
          }}
        >
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
              <RepeatIcon sx={{ mr: 1 }} />
              Регулярные доходы
            </Typography>
            
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => setOpenRegularDialog(true)}
            >
              Добавить
            </Button>
          </Box>
          
          {regularIncomes.length === 0 ? (
            <Box sx={{ py: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">
                У вас нет регулярных доходов
              </Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                sx={{ mt: 2 }}
                onClick={() => setOpenRegularDialog(true)}
              >
                Добавить
              </Button>
            </Box>
          ) : (
            <List>
              {regularIncomes.map((income) => (
                <React.Fragment key={income.id}>
                  <ListItem 
                    sx={{ 
                      px: 2, 
                      borderRadius: 2,
                      mb: 1,
                      bgcolor: muiAlpha(getCategoryColor(income.category), 0.05)
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar
                            sx={{
                              width: 32,
                              height: 32,
                              mr: 1.5,
                              bgcolor: muiAlpha(getCategoryColor(income.category), 0.2),
                              color: getCategoryColor(income.category)
                            }}
                          >
                            {getCategoryIcon(income.category)}
                          </Avatar>
                          <Typography variant="subtitle2">
                            {income.description}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Typography component="div">
                          <Box sx={{ pl: 5, pt: 0.5 }}>
                            <Typography variant="body2" component="span">
                              {income.amount.toLocaleString()} ₽
                            </Typography>
                            <Typography variant="caption" component="span" sx={{ mx: 1, color: 'text.secondary' }}>•</Typography>
                            <Typography variant="caption" component="span" color="text.secondary">
                              {getFrequencyText(income.frequency)}
                            </Typography>
                            <Typography variant="caption" component="span" sx={{ mx: 1, color: 'text.secondary' }}>•</Typography>
                            <Typography variant="caption" component="span" color="text.secondary">
                              Следующее поступление: {income.nextDate.toDate().toLocaleDateString()}
                            </Typography>
                          </Box>
                        </Typography>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteRegularIncome(income.id)}
                          sx={{ mr: 1 }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                        <FormControlLabel
                          control={
                            <Switch 
                              size="small"
                              checked={income.active}
                              onChange={() => handleToggleRegularIncome(income.id)}
                            />
                          }
                          label=""
                        />
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                  <Divider sx={{ mb: 1 }} />
                </React.Fragment>
              ))}
            </List>
          )}
        </Paper>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Регулярные доходы позволяют отслеживать повторяющиеся поступления. 
          Активируйте уведомления, чтобы получать напоминания о предстоящих платежах.
        </Typography>
        
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Button
            variant="outlined"
            startIcon={<NotificationIcon />}
            onClick={() => showAlert('Уведомления о регулярных доходах активированы')}
          >
            Включить уведомления
          </Button>
        </Box>
      </Box>
    );
  };

  // Dialog for adding regular income
  const renderRegularIncomeDialog = () => (
    <Dialog 
      open={openRegularDialog}
      onClose={() => setOpenRegularDialog(false)}
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle>Добавить регулярный доход</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <TextField
            fullWidth
            label="Описание"
            margin="normal"
            value={regularFormData.description}
            onChange={(e) => setRegularFormData(prev => ({ ...prev, description: e.target.value }))}
          />
          
          <TextField
            fullWidth
            label="Сумма"
            margin="normal"
            type="number"
            value={regularFormData.amount}
            onChange={(e) => setRegularFormData(prev => ({ ...prev, amount: e.target.value }))}
            InputProps={{
              startAdornment: <Typography component="span" sx={{ mr: 0.5 }}>₽</Typography>,
            }}
          />
          
          <FormControl fullWidth margin="normal">
            <InputLabel>Категория</InputLabel>
            <Select
              value={regularFormData.category}
              label="Категория"
              onChange={(e) => setRegularFormData(prev => ({ ...prev, category: e.target.value }))}
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
          
          <FormControl fullWidth margin="normal">
            <InputLabel>Частота</InputLabel>
            <Select
              value={regularFormData.frequency}
              label="Частота"
              onChange={(e) => setRegularFormData(prev => ({ ...prev, frequency: e.target.value }))}
            >
              <MenuItem value="daily">Ежедневно</MenuItem>
              <MenuItem value="weekly">Еженедельно</MenuItem>
              <MenuItem value="monthly">Ежемесячно</MenuItem>
              <MenuItem value="yearly">Ежегодно</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl fullWidth margin="normal">
            <InputLabel>Группа (опционально)</InputLabel>
            <Select
              value={regularFormData.groupId}
              label="Группа (опционально)"
              onChange={(e) => setRegularFormData(prev => ({ ...prev, groupId: e.target.value }))}
            >
              <MenuItem value="">Личный доход</MenuItem>
              {groups.map((group) => (
                <MenuItem key={group.id} value={group.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar 
                      sx={{ 
                        width: 24, 
                        height: 24, 
                        mr: 1,
                        bgcolor: muiAlpha(getGroupColor(group.name), 0.2),
                        color: getGroupColor(group.name)
                      }}
                    >
                      <GroupIcon fontSize="small" />
                    </Avatar>
                    {group.name}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <TextField
            fullWidth
            label="Дата следующего поступления"
            margin="normal"
            type="date"
            value={regularFormData.nextDate.toISOString().split('T')[0]}
            onChange={(e) => setRegularFormData(prev => ({ 
              ...prev, 
              nextDate: new Date(e.target.value) 
            }))}
            InputLabelProps={{ shrink: true }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setOpenRegularDialog(false)}>Отмена</Button>
        <Button 
          variant="contained"
          onClick={handleAddRegularIncome}
          disabled={!regularFormData.description || !regularFormData.amount}
        >
          Добавить
        </Button>
      </DialogActions>
    </Dialog>
  );

  // Render incomes list
  const renderIncomesList = () => {
    const filteredIncomes = incomes
      .filter(income => searchQuery ? income.description.toLowerCase().includes(searchQuery.toLowerCase()) : true)
      .sort((a, b) => {
        if (sortBy === 'date') {
          return sortOrder === 'asc' 
            ? a.date.toDate().getTime() - b.date.toDate().getTime()
            : b.date.toDate().getTime() - a.date.toDate().getTime();
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
    
    if (filteredIncomes.length === 0) {
      return (
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography color="text.secondary" gutterBottom>
            {searchQuery ? 'Нет доходов по вашему запросу' : 'У вас пока нет доходов'}
          </Typography>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setOpenAddDialog(true)}
            sx={{ mt: 2 }}
          >
            Добавить доход
          </Button>
        </Box>
      );
    }
    
    return (
      <motion.div variants={containerVariants}>
        {filteredIncomes.map((income) => (
          <motion.div 
            key={income.id} 
            variants={itemVariants}
            whileHover="hover"
            whileTap="tap"
          >
            <Card sx={{ 
              mb: 2.5, 
              borderRadius: '20px',
              overflow: 'hidden',
              border: '1px solid',
              borderColor: muiAlpha(theme.palette.divider, 0.1),
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: 4,
                backgroundColor: getCategoryColor(income.category),
              }
            }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ 
                      bgcolor: muiAlpha(getCategoryColor(income.category), 0.15), 
                      color: getCategoryColor(income.category),
                      mr: 2,
                      width: 48,
                      height: 48,
                    }}>
                      {getCategoryIcon(income.category)}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {income.description}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography 
                          variant="caption" 
                          sx={{
                            color: theme.palette.text.secondary,
                            display: 'flex',
                            alignItems: 'center',
                            fontWeight: 500,
                          }}
                        >
                          {formatDate(income.date)}
                        </Typography>
                        <Chip 
                          label={categories.find(c => c.id === income.category)?.name || 'Другое'} 
                          size="small" 
                          sx={{ 
                            height: 20,
                            borderRadius: '10px',
                            backgroundColor: muiAlpha(getCategoryColor(income.category), 0.1),
                            color: getCategoryColor(income.category),
                            fontWeight: 500,
                            fontSize: '0.7rem',
                            '& .MuiChip-label': { px: 1 },
                          }}
                        />
                      </Box>
                    </Box>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 700,
                        color: theme.palette.success.main
                      }}
                    >
                      +{income.amount.toLocaleString()} ₽
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mt: 2 }}>
                  <IconButton 
                    color="error" 
                    onClick={() => handleDeleteIncome(income.id)}
                    size="small"
                    sx={{ 
                      backgroundColor: muiAlpha(theme.palette.error.main, 0.1),
                      width: 32,
                      height: 32,
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    );
  };
  
  // Render dialog for adding a new income
  const renderAddIncomeDialog = () => (
    <Dialog 
      open={openAddDialog} 
      onClose={() => setOpenAddDialog(false)}
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3 }
      }}
    >
      <DialogTitle>Добавить доход</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <TextField
            label="Сумма"
            type="number"
            fullWidth
            margin="normal"
            autoFocus
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            InputProps={{
              startAdornment: <Typography component="span" sx={{ mr: 0.5 }}>₽</Typography>,
            }}
          />
          
          <TextField
            label="Описание"
            fullWidth
            margin="normal"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          
          <FormControl fullWidth margin="normal">
            <InputLabel>Категория</InputLabel>
            <Select
              value={category}
              label="Категория"
              onChange={(e) => setCategory(e.target.value)}
            >
              {categories.map((cat) => (
                <MenuItem key={cat.id} value={cat.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar 
                      sx={{ 
                        width: 24, 
                        height: 24, 
                        mr: 1,
                        bgcolor: muiAlpha(cat.color, 0.1),
                        color: cat.color
                      }}
                    >
                      {cat.icon}
                    </Avatar>
                    {cat.name}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal">
            <InputLabel>Группа (опционально)</InputLabel>
            <Select
              value={selectedGroupId}
              label="Группа (опционально)"
              onChange={(e) => setSelectedGroupId(e.target.value)}
            >
              <MenuItem value="">Личный доход</MenuItem>
              {groups.map((group) => (
                <MenuItem key={group.id} value={group.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar 
                      sx={{ 
                        width: 24, 
                        height: 24, 
                        mr: 1,
                        bgcolor: muiAlpha(getGroupColor(group.name), 0.2),
                        color: getGroupColor(group.name)
                      }}
                    >
                      <GroupIcon fontSize="small" />
                    </Avatar>
                    {group.name}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setOpenAddDialog(false)}>Отмена</Button>
        <Button
          variant="contained"
          onClick={handleAddIncome}
          disabled={!amount || !description}
        >
          Добавить
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Container maxWidth="md" sx={{ py: 2 }}>
      {/* Dialogs */}
      {renderAddIncomeDialog()}
      {renderRegularIncomeDialog()}
      
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Header */}
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Typography variant="h5" component="h1" sx={{ fontWeight: 600 }}>
            Доходы
          </Typography>
          
          <Box>
            <Button
              variant="outlined"
              startIcon={<RepeatIcon />}
              onClick={() => setOpenRegularDialog(true)}
              sx={{ mr: 1, display: { xs: 'none', sm: 'inline-flex' } }}
            >
              Регулярные
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenAddDialog(true)}
            >
              Добавить
            </Button>
          </Box>
        </Box>

        {/* Group selector */}
        <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Выберите группу</InputLabel>
            <Select
              value={selectedGroupId}
              label="Выберите группу"
              onChange={(e) => {
                setSelectedGroupId(e.target.value);
                // Refresh data when group changes
                if (user?.id) {
                  fetchIncomes();
                  fetchRegularIncomes();
                }
              }}
              displayEmpty
            >
              <MenuItem value="">Личные доходы</MenuItem>
              {loadingGroups ? (
                <MenuItem disabled>
                  <CircularProgress size={20} />
                </MenuItem>
              ) : (
                groups.map((group) => (
                  <MenuItem key={group.id} value={group.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar 
                        sx={{ 
                          width: 24, 
                          height: 24, 
                          mr: 1,
                          bgcolor: muiAlpha(getGroupColor(group.name), 0.2),
                          color: getGroupColor(group.name)
                        }}
                      >
                        <GroupIcon fontSize="small" />
                      </Avatar>
                      {group.name}
                    </Box>
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>
        </Paper>
        
        {/* View mode and tabs */}
        <Box sx={{ mb: 3 }}>
          <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <Tabs
              value={viewMode}
              onChange={(e, newValue) => setViewMode(newValue)}
              variant="fullWidth"
              sx={{
                '& .MuiTab-root': {
                  minHeight: 48,
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  textTransform: 'none',
                }
              }}
            >
              <Tab 
                icon={<ViewListIcon fontSize="small" sx={{ mr: 1 }} />} 
                label="Список" 
                value="list" 
                iconPosition="start"
              />
              <Tab 
                icon={<TrendingUpIcon fontSize="small" sx={{ mr: 1 }} />} 
                label="Прогноз" 
                value="forecast" 
                iconPosition="start"
              />
              <Tab 
                icon={<RepeatIcon fontSize="small" sx={{ mr: 1 }} />} 
                label="Регулярные" 
                value="regular" 
                iconPosition="start"
              />
            </Tabs>
          </Paper>
        </Box>
        
        {/* Search and filter bar (for list view) */}
        {viewMode === 'list' && (
          <Box sx={{ mb: 3 }}>
            <Paper
              sx={{
                p: 1,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <TextField
                placeholder="Поиск доходов..."
                size="small"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />,
                  sx: { 
                    borderRadius: 4,
                    height: 40,
                    width: { xs: '100%', sm: 200 }
                  }
                }}
              />
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FormControl size="small" sx={{ width: 120, display: { xs: 'none', sm: 'block' } }}>
                  <Select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'date' | 'amount' | 'category')}
                    displayEmpty
                    startAdornment={<SortIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />}
                    sx={{ height: 40, borderRadius: 4 }}
                  >
                    <MenuItem value="date">По дате</MenuItem>
                    <MenuItem value="amount">По сумме</MenuItem>
                    <MenuItem value="category">По категории</MenuItem>
                  </Select>
                </FormControl>
                
                <IconButton 
                  size="small" 
                  onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                  sx={{ display: { xs: 'none', sm: 'flex' } }}
                >
                  <ArrowForwardIcon 
                    fontSize="small" 
                    sx={{ 
                      transform: sortOrder === 'asc' ? 'rotate(-90deg)' : 'rotate(90deg)',
                      transition: 'transform 0.2s'
                    }} 
                  />
                </IconButton>
              </Box>
            </Paper>
          </Box>
        )}
        
        {/* View content based on selected mode */}
        <AnimatePresence mode="wait">
          {loading ? (
            <Box sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
              <CircularProgress />
            </Box>
          ) : viewMode === 'list' ? (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {renderIncomesList()}
            </motion.div>
          ) : viewMode === 'forecast' ? (
            <motion.div
              key="forecast"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {renderIncomeForecast()}
            </motion.div>
          ) : (
            <motion.div
              key="regular"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {renderRegularIncomes()}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </Container>
  );
};

export default Incomes; 