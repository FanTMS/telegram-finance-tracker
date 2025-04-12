import React, { useState } from 'react';
import {
  ResponsiveContainer,
  PieChart, Pie,
  Cell,
  BarChart, Bar,
  XAxis, YAxis,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  CartesianGrid
} from 'recharts';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Divider,
  Button,
  IconButton,
  Paper,
  Chip,
  useTheme,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent
} from '@mui/material';
import {
  KeyboardArrowLeft as ArrowLeftIcon,
  ShowChart as ChartIcon,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  Close as CloseIcon,
  Info as InfoIcon
} from '@mui/icons-material';

// Типы для категорий и расходов
interface Category {
  id: string;
  name: string;
  color: string;
  icon: React.ReactNode;
}

interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: Date | string;
  createdBy: string;
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

interface ExpenseChartsProps {
  expenses: Expense[];
  categories: Category[];
  categoryStats: CategoryStat[];
  onBackToList: () => void;
}

type ChartType = 'pie' | 'bar' | 'area';

const ExpenseCharts: React.FC<ExpenseChartsProps> = ({
  expenses,
  categories,
  categoryStats,
  onBackToList
}) => {
  const theme = useTheme();
  const [chartType, setChartType] = useState<ChartType>('pie');
  const [selectedCategory, setSelectedCategory] = useState<CategoryStat | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  
  // Подготовка данных для временного графика
  const prepareTimeSeriesData = () => {
    if (!expenses || expenses.length === 0) return [];
    
    const dateMap = new Map<string, {date: string, total: number, [key: string]: any}>();
    
    // Сортируем расходы по дате
    const sortedExpenses = [...expenses].sort((a, b) => {
      const dateA = a.date instanceof Date ? a.date : new Date(a.date);
      const dateB = b.date instanceof Date ? b.date : new Date(b.date);
      return dateA.getTime() - dateB.getTime();
    });
    
    // Группируем расходы по дате и категории
    sortedExpenses.forEach(expense => {
      const date = expense.date instanceof Date 
        ? expense.date.toISOString().split('T')[0]
        : new Date(expense.date).toISOString().split('T')[0];
      
      const existingDate = dateMap.get(date) || { date, total: 0 };
      const category = expense.category || 'other';
      
      existingDate.total = (existingDate.total || 0) + expense.amount;
      existingDate[category] = (existingDate[category] || 0) + expense.amount;
      
      dateMap.set(date, existingDate);
    });
    
    return Array.from(dateMap.values());
  };
  
  // Создаем цветовую схему для графиков
  const getCategoryColor = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.color || theme.palette.grey[500];
  };
  
  // Обработчик клика по элементу графика
  const handleChartClick = (data: any) => {
    if (!data || !data.payload) return;
    
    const clickedCategory = categoryStats.find(c => c.id === data.payload.id);
    if (clickedCategory) {
      setSelectedCategory(clickedCategory);
      setDetailsOpen(true);
    }
  };
  
  // Отображение подсказки для графиков
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    
    if (chartType === 'pie' || chartType === 'bar') {
      const data = payload[0].payload;
      return (
        <Paper sx={{ p: 1.5, boxShadow: theme.shadows[3], maxWidth: 250 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
            {data.name}
          </Typography>
          <Typography variant="body2">
            {data.amount.toLocaleString()} ₽ ({data.percentage.toFixed(1)}%)
          </Typography>
        </Paper>
      );
    }
    
    if (chartType === 'area') {
      return (
        <Paper sx={{ p: 1.5, boxShadow: theme.shadows[3], maxWidth: 250 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
            {new Date(label).toLocaleDateString('ru-RU')}
          </Typography>
          {payload.map((entry: any, index: number) => (
            <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <Box 
                sx={{ 
                  width: 12, 
                  height: 12, 
                  borderRadius: '50%', 
                  bgcolor: entry.color,
                  mr: 1
                }} 
              />
              <Typography variant="caption" sx={{ mr: 1 }}>
                {categories.find(c => c.id === entry.dataKey)?.name || entry.dataKey}:
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                {entry.value.toLocaleString()} ₽
              </Typography>
            </Box>
          ))}
          <Divider sx={{ my: 0.5 }} />
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Всего: {payload.reduce((sum: number, entry: any) => sum + entry.value, 0).toLocaleString()} ₽
          </Typography>
        </Paper>
      );
    }
    
    return null;
  };
  
  // Рендер пирога или гистограммы в зависимости от выбранного типа
  const renderCategoryChart = () => {
    if (categoryStats.length === 0) {
      return (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">
            Нет данных для построения графика
          </Typography>
        </Box>
      );
    }

    if (chartType === 'pie') {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={categoryStats}
              dataKey="amount"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              innerRadius={60}
              labelLine={false}
              onClick={handleChartClick}
              label={({ name, percentage }) => `${name} (${percentage.toFixed(0)}%)`}
            >
              {categoryStats.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      );
    }
    
    if (chartType === 'bar') {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={categoryStats}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="amount" 
              name="Сумма" 
              onClick={handleChartClick}
            >
              {categoryStats.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color} 
                  cursor="pointer"
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      );
    }
    
    return null;
  };
  
  // Рендер временного графика
  const renderTimeSeriesChart = () => {
    const data = prepareTimeSeriesData();
    
    if (data.length === 0) {
      return (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">
            Нет данных для временного графика
          </Typography>
        </Box>
      );
    }
    
    // Получаем все уникальные категории из данных
    const uniqueCategories = Array.from(
      new Set(
        Object.keys(data.reduce((acc, current) => {
          Object.keys(current).forEach(key => {
            if (key !== 'date' && key !== 'total') {
              acc[key] = true;
            }
          });
          return acc;
        }, {} as Record<string, boolean>))
      )
    );
    
    return (
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="date" 
            tickFormatter={(date) => new Date(date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}
          />
          <YAxis />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          {uniqueCategories.map((category, index) => (
            <Area
              key={category}
              type="monotone"
              dataKey={category}
              stackId="1"
              fill={getCategoryColor(category)}
              stroke={getCategoryColor(category)}
              fillOpacity={0.6}
              name={categories.find(c => c.id === category)?.name || category}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    );
  };
  
  // Диалог с детальной информацией о категории
  const renderCategoryDetailsDialog = () => {
    if (!selectedCategory) return null;
    
    return (
      <Dialog 
        open={detailsOpen} 
        onClose={() => setDetailsOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box 
              sx={{ 
                width: 20, 
                height: 20, 
                borderRadius: '50%', 
                bgcolor: selectedCategory.color,
                mr: 1.5
              }} 
            />
            <Typography variant="h6">
              {selectedCategory.name}
            </Typography>
          </Box>
          <IconButton onClick={() => setDetailsOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
              {selectedCategory.amount.toLocaleString()} ₽
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {selectedCategory.percentage.toFixed(1)}% от общей суммы расходов
            </Typography>
          </Box>
          
          <Divider sx={{ mb: 2 }} />
          
          <Typography variant="subtitle1" sx={{ mb: 1.5, fontWeight: 600 }}>
            Расходы в этой категории:
          </Typography>
          
          {expenses
            .filter(exp => exp.category === selectedCategory.id)
            .sort((a, b) => {
              const dateA = a.date instanceof Date ? a.date : new Date(a.date);
              const dateB = b.date instanceof Date ? b.date : new Date(b.date);
              return dateB.getTime() - dateA.getTime(); // сортировка от новых к старым
            })
            .map(expense => (
              <Paper 
                key={expense.id} 
                variant="outlined" 
                sx={{ p: 1.5, mb: 1.5, borderRadius: 2 }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {expense.description}
                  </Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {expense.amount.toLocaleString()} ₽
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {expense.date instanceof Date 
                    ? expense.date.toLocaleDateString() 
                    : new Date(expense.date).toLocaleDateString()}
                </Typography>
              </Paper>
            ))}
        </DialogContent>
      </Dialog>
    );
  };
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Button 
          variant="outlined" 
          startIcon={<ArrowLeftIcon />}
          onClick={onBackToList}
          size="small"
        >
          Вернуться к списку
        </Button>
        
        <Box>
          <IconButton 
            onClick={() => setChartType('pie')} 
            color={chartType === 'pie' ? 'primary' : 'default'}
            sx={{ mr: 1 }}
          >
            <PieChartIcon />
          </IconButton>
          <IconButton 
            onClick={() => setChartType('bar')} 
            color={chartType === 'bar' ? 'primary' : 'default'}
            sx={{ mr: 1 }}
          >
            <BarChartIcon />
          </IconButton>
          <IconButton 
            onClick={() => setChartType('area')} 
            color={chartType === 'area' ? 'primary' : 'default'}
          >
            <ChartIcon />
          </IconButton>
        </Box>
      </Box>
      
      <Card sx={{ mb: 3, borderRadius: 3, overflow: 'hidden' }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {chartType === 'area' 
                ? 'Расходы по времени' 
                : 'Расходы по категориям'}
            </Typography>
            
            <Chip 
              icon={<InfoIcon fontSize="small" />}
              label="Нажмите на категорию для деталей"
              size="small"
              variant="outlined"
            />
          </Box>
          
          {chartType === 'area' ? renderTimeSeriesChart() : renderCategoryChart()}
        </CardContent>
      </Card>
      
      <Box>
        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
          Статистика по категориям
        </Typography>
        
        {categoryStats.length > 0 ? (
          categoryStats.map((category) => (
            <Paper 
              key={category.id}
              sx={{ 
                p: 1.5, 
                mb: 1.5, 
                borderRadius: 2,
                cursor: 'pointer',
                '&:hover': {
                  boxShadow: theme.shadows[3],
                  transform: 'translateY(-2px)',
                  transition: 'all 0.2s ease'
                }
              }}
              onClick={() => {
                setSelectedCategory(category);
                setDetailsOpen(true);
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box 
                    sx={{ 
                      width: 16, 
                      height: 16, 
                      borderRadius: '50%', 
                      bgcolor: category.color,
                      mr: 1.5
                    }} 
                  />
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {category.name}
                  </Typography>
                </Box>
                
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {category.amount.toLocaleString()} ₽
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {category.percentage.toFixed(1)}%
                  </Typography>
                </Box>
              </Box>
            </Paper>
          ))
        ) : (
          <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
            Нет данных о расходах по категориям
          </Typography>
        )}
      </Box>
      
      {renderCategoryDetailsDialog()}
    </Box>
  );
};

export default ExpenseCharts; 