import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
} from '@mui/icons-material';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useTelegramApp } from '../hooks/useTelegramApp';
import { createExpense, getGroupExpenses, deleteExpense, getGroups, Expense, Group } from '../services/firebase';
import { Timestamp } from 'firebase/firestore';
import { alpha as muiAlpha } from '@mui/material/styles';
import DebtSummary from '../components/DebtSummary';

// Expense categories with icons
const categories = [
  { id: 'food', name: 'Еда', icon: <RestaurantIcon /> },
  { id: 'grocery', name: 'Продукты', icon: <GroceryIcon /> },
  { id: 'transport', name: 'Транспорт', icon: <CarIcon /> },
  { id: 'housing', name: 'Жилье', icon: <HomeIcon /> },
  { id: 'health', name: 'Здоровье', icon: <HealthIcon /> },
  { id: 'education', name: 'Образование', icon: <EducationIcon /> },
  { id: 'entertainment', name: 'Развлечения', icon: <EntertainmentIcon /> },
  { id: 'other', name: 'Другое', icon: <MoreIcon /> },
];

const Expenses: React.FC = () => {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, showAlert, showConfirm } = useTelegramApp();
  const [searchParams] = useSearchParams();
  const groupId = searchParams.get('groupId');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [openAddDialog, setOpenAddDialog] = useState(false);
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

  // Fetch expenses for the group
  useEffect(() => {
    if (groupId) {
      setSelectedGroupId(groupId);
      fetchExpenses();
    } else {
      // Set empty expenses list if no group ID
      setExpenses([]);
      setLoading(false);
    }
  }, [groupId]);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      if (!groupId) {
        setLoading(false);
        return;
      }
      
      const fetchedExpenses = await getGroupExpenses(groupId);
      setExpenses(fetchedExpenses);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      showAlert('Ошибка при загрузке расходов');
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async () => {
    if (!amount) {
      showAlert('Пожалуйста, укажите сумму');
      return;
    }

    if (!selectedGroupId) {
      showAlert('Ошибка: группа не выбрана');
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
      // Get the selected group to get members
      const selectedGroup = groups.find(group => group.id === selectedGroupId);
      
      if (!selectedGroup) {
        throw new Error('Selected group not found');
      }
      
      // By default, split between all members of the group
      const splitBetween = selectedGroup.members;
      
      const newExpense = {
        groupId: selectedGroupId,
        amount: amountValue,
        category,
        description: description || '',
        createdBy: user.id.toString(),
        createdAt: new Date() as any, // Will be overridden by serverTimestamp()
        splitBetween,
        paidBy: [user.id.toString()],
      };

      console.log('Adding expense:', newExpense);
      const createdExpense = await createExpense(newExpense);
      
      // Create notifications for group members
      if (splitBetween.length > 1) {
        try {
          // Import here to avoid circular dependency
          const { createExpenseSplitNotifications } = require('../services/notifications');
          
          await createExpenseSplitNotifications(
            selectedGroupId,
            createdExpense.id,
            amountValue,
            description,
            user.id.toString(),
            splitBetween
          );
        } catch (notificationError) {
          console.error('Error creating notifications:', notificationError);
          // Don't fail the whole expense creation if notifications fail
        }
      }
      
      setOpenAddDialog(false);
      setAmount('');
      setDescription('');
      setCategory('food');
      showAlert('Расход успешно добавлен');
      
      // If we're already viewing this group, refresh expenses
      if (selectedGroupId === groupId) {
        await fetchExpenses();
      } else if (selectedGroupId) {
        // Navigate to the newly selected group
        navigate(`/expenses?groupId=${selectedGroupId}`);
      }
    } catch (error) {
      console.error('Error adding expense:', error);
      showAlert('Ошибка при добавлении расхода');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    try {
      // Используем JavaScript confirm напрямую, так как Telegram WebApp API для showConfirm может не работать
      const confirmed = await showConfirm('Вы уверены, что хотите удалить этот расход?');
      
      if (confirmed) {
        await deleteExpense(expenseId);
        showAlert('Расход удален');
        await fetchExpenses(); // Refresh expense list
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
      showAlert('Ошибка при удалении расхода');
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

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, pb: 9, maxWidth: '100vw', overflow: 'hidden' }}>
      <motion.div
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={containerVariants}
      >
        {/* Header section with blur effect and sticky positioning */}
        <Box 
          sx={{ 
            position: 'sticky', 
            top: 0, 
            zIndex: 10, 
            pt: 1,
            pb: 2,
            mb: 2,
            backdropFilter: 'blur(10px)',
            backgroundColor: muiAlpha(theme.palette.background.default, 0.8),
            borderRadius: '0 0 20px 20px',
          }}
        >
          <Box 
            sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
            }}
          >
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 'bold',
                fontSize: { xs: '1.75rem', sm: '2rem' },
                background: 'linear-gradient(45deg, #0088cc, #1d8bc0)',
                backgroundClip: 'text',
                color: 'transparent',
                WebkitBackgroundClip: 'text',
              }}
            >
              Расходы
            </Typography>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenAddDialog(true)}
                sx={{ 
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(0, 136, 204, 0.3)',
                  px: { xs: 2, sm: 3 },
                }}
              >
                Добавить
              </Button>
            </motion.div>
          </Box>

          {/* Updated Group selector with more visual appeal */}
          {!groupId && groups.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  mb: 1.5, 
                  fontWeight: 500, 
                  display: 'flex', 
                  alignItems: 'center',
                  color: theme.palette.text.secondary
                }}
              >
                <WorkspacesIcon sx={{ mr: 1, fontSize: '1.2rem', color: theme.palette.primary.main }} />
                Выберите группу расходов
              </Typography>
              
              <Box 
                sx={{ 
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                  gap: 2,
                }}
              >
                {groups.map((group) => (
                  <motion.div
                    key={group.id}
                    whileHover={{ scale: 1.03, y: -3 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Card 
                      onClick={() => {
                        setSelectedGroupId(group.id);
                        navigate(`/expenses?groupId=${group.id}`);
                      }}
                      raised={selectedGroupId === group.id}
                      sx={{ 
                        p: 2,
                        cursor: 'pointer',
                        borderRadius: '16px',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center',
                        transition: 'all 0.3s ease',
                        border: '1px solid',
                        borderColor: selectedGroupId === group.id 
                          ? theme.palette.primary.main 
                          : muiAlpha(theme.palette.divider, 0.1),
                        backgroundColor: selectedGroupId === group.id 
                          ? muiAlpha(theme.palette.primary.main, 0.1)
                          : theme.palette.background.paper,
                        boxShadow: selectedGroupId === group.id 
                          ? `0 8px 16px ${muiAlpha(theme.palette.primary.main, 0.2)}`
                          : 'none',
                        '&:hover': {
                          backgroundColor: selectedGroupId === group.id 
                            ? muiAlpha(theme.palette.primary.main, 0.15)
                            : muiAlpha(theme.palette.background.paper, 0.8),
                          boxShadow: `0 5px 15px ${muiAlpha(theme.palette.primary.main, 0.2)}`,
                        },
                      }}
                    >
                      <Badge 
                        overlap="circular"
                        badgeContent={group.members.length}
                        color="primary"
                        sx={{ 
                          '& .MuiBadge-badge': {
                            fontSize: '0.7rem',
                            height: '22px',
                            minWidth: '22px',
                            borderRadius: '50%',
                          }
                        }}
                      >
                        <Avatar 
                          sx={{ 
                            width: 56, 
                            height: 56, 
                            mb: 1.5,
                            bgcolor: getGroupColor(group.name),
                            fontSize: '1.5rem',
                            boxShadow: selectedGroupId === group.id 
                              ? `0 0 0 3px ${theme.palette.primary.main}`
                              : 'none',
                          }}
                        >
                          {group.name.charAt(0).toUpperCase()}
                        </Avatar>
                      </Badge>
                      <Typography 
                        variant="subtitle1" 
                        sx={{ 
                          fontWeight: 600,
                          color: selectedGroupId === group.id
                            ? theme.palette.primary.main
                            : theme.palette.text.primary,
                        }}
                        noWrap
                      >
                        {group.name}
                      </Typography>
                      <Tooltip title="Перейти к расходам группы">
                        <Box 
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            mt: 'auto',
                            pt: 1,
                            color: theme.palette.primary.main,
                            opacity: selectedGroupId === group.id ? 1 : 0.6,
                          }}
                        >
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              fontWeight: 500,
                              mr: 0.5 
                            }}
                          >
                            Перейти
                          </Typography>
                          <ArrowForwardIcon fontSize="small" />
                        </Box>
                      </Tooltip>
                    </Card>
                  </motion.div>
                ))}
              </Box>
            </Box>
          )}
          
          {/* If we already have a group selected, show a compact view */}
          {groupId && (
            <Box sx={{ mt: 2 }}>
              <Button
                variant="outlined"
                startIcon={<ViewListIcon />}
                onClick={() => navigate('/expenses')}
                size="small"
                sx={{ 
                  borderRadius: '10px',
                  textTransform: 'none',
                }}
              >
                Все группы
              </Button>
              
              {/* Current group indicator */}
              {selectedGroupId && groups.length > 0 && (
                <Box 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    mt: 2,
                    p: 1.5,
                    borderRadius: '12px',
                    backgroundColor: muiAlpha(theme.palette.primary.main, 0.1),
                  }}
                >
                  <Avatar 
                    sx={{ 
                      bgcolor: getGroupColor(
                        groups.find(g => g.id === selectedGroupId)?.name || ''
                      ),
                      mr: 2,
                    }}
                  >
                    {(groups.find(g => g.id === selectedGroupId)?.name || '').charAt(0).toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {groups.find(g => g.id === selectedGroupId)?.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {groups.find(g => g.id === selectedGroupId)?.members.length || 0} участников
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </Box>

        {expenses.length === 0 ? (
          <Box 
            sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              minHeight: '50vh',
              textAlign: 'center',
              py: 4
            }}
          >
            <AccountBalanceIcon 
              sx={{ 
                fontSize: 50, 
                color: theme.palette.primary.main, 
                opacity: 0.7, 
                mb: 3 
              }} 
            />
            <Typography variant="h6" sx={{ mb: 1, fontWeight: 500 }}>
              Расходов пока нет
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ mb: 4, maxWidth: '280px', mx: 'auto' }}
            >
              Добавьте расход, чтобы начать отслеживать финансы
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenAddDialog(true)}
              size="large"
              sx={{ borderRadius: '10px' }}
            >
              Добавить расход
            </Button>
          </Box>
        ) : (
          <motion.div variants={containerVariants}>
            {expenses.map((expense) => (
              <motion.div 
                key={expense.id} 
                variants={itemVariants}
                whileHover="hover"
                whileTap="tap"
              >
                <Card sx={{ 
                  mb: 2.5, 
                  borderRadius: '20px',
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  border: '1px solid',
                  borderColor: muiAlpha(theme.palette.divider, 0.1),
                  backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(250,250,255,0.85))',
                  backdropFilter: 'blur(8px)',
                }}>
                  <CardContent sx={{ p: 0 }}>
                    {/* Category color strip */}
                    <Box sx={{ 
                      height: '6px', 
                      background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${muiAlpha(theme.palette.primary.light, 0.7)})`,
                    }} />
                    
                    <Box sx={{ p: 2.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ 
                            bgcolor: muiAlpha(theme.palette.primary.main, 0.15), 
                            color: theme.palette.primary.main,
                            mr: 2,
                            boxShadow: `0 4px 12px ${muiAlpha(theme.palette.primary.main, 0.15)}`,
                            p: 1.5,
                            width: 48,
                            height: 48,
                          }}>
                            {getCategoryIcon(expense.category)}
                          </Avatar>
                          <Box>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                              {expense.description}
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
                                <Box 
                                  component="span" 
                                  sx={{ 
                                    width: 8, 
                                    height: 8, 
                                    bgcolor: theme.palette.primary.main,
                                    borderRadius: '50%',
                                    display: 'inline-block',
                                    mr: 0.5
                                  }} 
                                />
                                {formatDate(expense.createdAt)}
                              </Typography>
                              <Chip 
                                label={categories.find(c => c.id === expense.category)?.name || 'Другое'} 
                                size="small" 
                                sx={{ 
                                  height: 20,
                                  borderRadius: '10px',
                                  backgroundColor: muiAlpha(theme.palette.primary.main, 0.1),
                                  color: theme.palette.primary.main,
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
                              color: 'transparent',
                              backgroundImage: 'linear-gradient(45deg, #0088cc, #1d8bc0)',
                              backgroundClip: 'text',
                              WebkitBackgroundClip: 'text',
                            }}
                          >
                            {expense.amount.toFixed(2)} ₽
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Divider sx={{ my: 2, opacity: 0.6 }} />
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography 
                            variant="body2" 
                            color="text.secondary" 
                            sx={{ 
                              mb: 0.5,
                              fontWeight: 500,
                              fontSize: '0.75rem',
                              opacity: 0.8 
                            }}
                          >
                            Разделено между:
                          </Typography>
                          <AvatarGroup 
                            max={4}
                            sx={{
                              '& .MuiAvatar-root': {
                                width: 28,
                                height: 28,
                                fontSize: '0.75rem',
                                borderWidth: 1.5,
                                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)'
                              }
                            }}
                          >
                            {(expense.splitBetween || []).map((member, index) => (
                              <Avatar 
                                key={index} 
                                sx={{ 
                                  bgcolor: `hsl(${210 + index * 30}, 70%, 60%)`,
                                }}
                              >
                                {member && member.charAt(0).toUpperCase()}
                              </Avatar>
                            ))}
                          </AvatarGroup>
                        </Box>
                        <Box>
                          <Typography 
                            variant="body2" 
                            color="text.secondary" 
                            sx={{ 
                              mb: 0.5,
                              fontWeight: 500,
                              fontSize: '0.75rem',
                              opacity: 0.8,
                              textAlign: 'center'
                            }}
                          >
                            Оплачено:
                          </Typography>
                          <AvatarGroup 
                            max={3}
                            sx={{
                              '& .MuiAvatar-root': {
                                width: 28,
                                height: 28,
                                fontSize: '0.75rem',
                                borderWidth: 1.5,
                              }
                            }}
                          >
                            {(expense.paidBy || []).map((member, index) => (
                              <Avatar 
                                key={index} 
                                sx={{ 
                                  bgcolor: theme.palette.success.main,
                                  boxShadow: `0 2px 6px ${muiAlpha(theme.palette.success.main, 0.3)}`
                                }}
                              >
                                {member && member.charAt(0).toUpperCase()}
                              </Avatar>
                            ))}
                          </AvatarGroup>
                        </Box>
                        <Box>
                          <motion.div
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <IconButton 
                              color="error" 
                              onClick={() => handleDeleteExpense(expense.id)}
                              sx={{ 
                                boxShadow: `0 2px 8px ${muiAlpha(theme.palette.error.main, 0.2)}`,
                                backgroundColor: muiAlpha(theme.palette.error.main, 0.1),
                                width: 36,
                                height: 36,
                                '&:hover': {
                                  backgroundColor: muiAlpha(theme.palette.error.main, 0.15),
                                }
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </motion.div>
                        </Box>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Debt Summary Section */}
        {expenses.length > 0 && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <Card
              component={motion.div}
              variants={itemVariants}
              whileHover="hover"
              whileTap="tap"
              sx={{
                mb: 4,
                overflow: 'visible',
                borderRadius: '20px',
                border: '1px solid',
                borderColor: muiAlpha(theme.palette.divider, 0.1),
                backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(245,250,255,0.85))',
                backdropFilter: 'blur(8px)',
                position: 'relative',
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: -16,
                  left: 24,
                  backgroundColor: theme.palette.secondary.main,
                  color: theme.palette.secondary.contrastText,
                  borderRadius: '50%',
                  width: 48,
                  height: 48,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                  border: '3px solid white',
                }}
              >
                <AccountBalanceIcon />
              </Box>
              
              {/* Color stripe at the top */}
              <Box 
                sx={{ 
                  height: '6px', 
                  background: `linear-gradient(90deg, ${theme.palette.secondary.main}, ${muiAlpha(theme.palette.secondary.light, 0.7)})`,
                  borderTopLeftRadius: '20px',
                  borderTopRightRadius: '20px',
                }}
              />
              
              <CardContent sx={{ pt: 3.5, px: 3 }}>
                <Typography 
                  variant="h6" 
                  gutterBottom
                  sx={{ 
                    fontWeight: 600, 
                    ml: 4,
                    color: theme.palette.text.primary,
                  }}
                >
                  Сводка по долгам
                </Typography>
                
                <Box sx={{ position: 'relative', mt: 1.5 }}>
                  {(() => {
                    try {
                      if (groupId) {
                        return (
                          <DebtSummary 
                            groupId={groupId} 
                            expenses={expenses} 
                            onPaymentCreated={fetchExpenses}
                          />
                        );
                      } else {
                        return (
                          <Alert 
                            severity="info" 
                            sx={{ 
                              mt: 2,
                              borderRadius: '12px',
                              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                            }}
                          >
                            Выберите группу для просмотра долгов
                          </Alert>
                        );
                      }
                    } catch (error) {
                      console.error('Error rendering DebtSummary:', error);
                      return (
                        <Alert 
                          severity="error" 
                          sx={{ 
                            mt: 2,
                            borderRadius: '12px',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                          }}
                        >
                          Ошибка при загрузке данных о долгах. Попробуйте обновить страницу.
                        </Alert>
                      );
                    }
                  })()}
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </motion.div>

      {/* Add Expense Dialog */}
      <Dialog 
        open={openAddDialog} 
        onClose={() => setOpenAddDialog(false)}
        TransitionComponent={Slide}
        sx={{ '& .MuiDialog-paper': { margin: '16px' } }}
        PaperProps={{
          sx: {
            borderRadius: '24px',
            maxWidth: '95vw',
            width: '450px',
            mx: 'auto',
            overflow: 'hidden',
            backgroundImage: 'linear-gradient(to bottom, rgba(255,255,255,0.98), rgba(255,255,255,1))',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
            border: '1px solid',
            borderColor: muiAlpha('#fff', 0.3),
          }
        }}
        BackdropProps={{
          sx: {
            backdropFilter: 'blur(5px)',
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
          }
        }}
      >
        {/* Blue Gradient Top Bar */}
        <Box sx={{ 
          height: '8px', 
          background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${muiAlpha(theme.palette.primary.light, 0.7)})`,
        }} />
        
        {/* Modal Title with Plus Icon */}
        <DialogTitle sx={{ 
          fontSize: '1.25rem', 
          fontWeight: 600, 
          textAlign: 'center',
          pt: 3,
          pb: 1,
          color: theme.palette.primary.main,
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 1 }}>
            <Avatar
              sx={{
                bgcolor: theme.palette.primary.main,
                width: 48,
                height: 48,
                boxShadow: '0 4px 12px rgba(0, 136, 204, 0.3)',
              }}
            >
              <AddIcon sx={{ color: '#fff', fontSize: '1.8rem' }} />
            </Avatar>
          </Box>
          Добавить расход
        </DialogTitle>
        
        {/* Form Content */}
        <DialogContent sx={{ px: { xs: 2, sm: 3 }, py: 2 }}>
          <Grid container spacing={2.5}>
            {/* Group selection dropdown */}
            <Grid item xs={12}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Группа</InputLabel>
                <Select
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  label="Группа"
                  startAdornment={
                    <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                      <GroupIcon 
                        sx={{ 
                          color: theme.palette.primary.main,
                          fontSize: '1.25rem'
                        }} 
                      />
                    </Box>
                  }
                  disabled={loadingGroups}
                  sx={{ 
                    '& .MuiSelect-select': { 
                      display: 'flex',
                      alignItems: 'center',
                      pl: 0.5,
                    },
                    borderRadius: '12px', 
                    '& fieldset': {
                      transition: 'border-color 0.2s ease',
                      borderColor: muiAlpha(theme.palette.divider, 0.3),
                    },
                    '&:hover fieldset': {
                      borderColor: theme.palette.primary.main,
                    },
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        borderRadius: '12px',
                        mt: 1,
                        boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15)',
                      }
                    }
                  }}
                >
                  {groups.length === 0 ? (
                    <MenuItem value="" disabled>
                      Нет доступных групп
                    </MenuItem>
                  ) : (
                    groups.map((group) => (
                      <MenuItem 
                        key={group.id} 
                        value={group.id}
                        sx={{ 
                          borderRadius: '8px',
                          my: 0.5,
                          mx: 0.5,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            backgroundColor: muiAlpha(theme.palette.primary.main, 0.1),
                          },
                          '&.Mui-selected': {
                            backgroundColor: muiAlpha(theme.palette.primary.main, 0.1),
                            '&:hover': {
                              backgroundColor: muiAlpha(theme.palette.primary.main, 0.15),
                            }
                          }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar
                            sx={{
                              width: 28,
                              height: 28,
                              mr: 1.5,
                              fontSize: '0.75rem',
                              bgcolor: getGroupColor(group.name),
                            }}
                          >
                            {group.name.charAt(0).toUpperCase()}
                          </Avatar>
                          {group.name}
                        </Box>
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                autoFocus
                label="Сумма"
                type="number"
                fullWidth
                variant="outlined"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <Box component="span" sx={{ color: theme.palette.primary.main, mr: 1, fontWeight: 500 }}>
                      ₽
                    </Box>
                  ),
                  sx: {
                    borderRadius: '12px',
                  }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: muiAlpha(theme.palette.divider, 0.3),
                    },
                    '&:hover fieldset': {
                      borderColor: theme.palette.primary.main,
                    },
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                label="Описание"
                type="text"
                fullWidth
                variant="outlined"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                InputProps={{
                  sx: {
                    borderRadius: '12px',
                  }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: muiAlpha(theme.palette.divider, 0.3),
                    },
                    '&:hover fieldset': {
                      borderColor: theme.palette.primary.main,
                    },
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Категория</InputLabel>
                <Select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  label="Категория"
                  sx={{ 
                    borderRadius: '12px',
                    '& .MuiSelect-select': { 
                      display: 'flex',
                      alignItems: 'center' 
                    },
                    '& fieldset': {
                      borderColor: muiAlpha(theme.palette.divider, 0.3),
                    },
                    '&:hover fieldset': {
                      borderColor: theme.palette.primary.main,
                    },
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        borderRadius: '12px',
                        mt: 1,
                        boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15)',
                      }
                    }
                  }}
                >
                  {categories.map((cat) => (
                    <MenuItem 
                      key={cat.id} 
                      value={cat.id}
                      sx={{ 
                        borderRadius: '8px',
                        my: 0.5,
                        mx: 0.5,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          backgroundColor: muiAlpha(theme.palette.primary.main, 0.1),
                        },
                        '&.Mui-selected': {
                          backgroundColor: muiAlpha(theme.palette.primary.main, 0.1),
                          '&:hover': {
                            backgroundColor: muiAlpha(theme.palette.primary.main, 0.15),
                          }
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box 
                          sx={{ 
                            mr: 1.5, 
                            display: 'flex', 
                            alignItems: 'center',
                            color: theme.palette.primary.main,
                          }}
                        >
                          {cat.icon}
                        </Box>
                        <Typography>{cat.name}</Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        
        {/* Footer with action buttons */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'center',
          gap: 2,
          px: 3,
          py: 3,
          borderTop: '1px solid',
          borderColor: muiAlpha(theme.palette.divider, 0.1),
        }}>
          <Button 
            onClick={() => setOpenAddDialog(false)}
            variant="outlined"
            sx={{ 
              borderRadius: '12px',
              minWidth: '100px',
              fontWeight: 500,
              px: 3,
              py: 1,
            }}
          >
            Отмена
          </Button>
          <Button 
            onClick={() => {
              console.log('Add expense button clicked');
              handleAddExpense();
            }}
            variant="contained" 
            disabled={loading || !selectedGroupId || !amount}
            sx={{ 
              borderRadius: '12px',
              minWidth: '120px',
              fontWeight: 500,
              bgcolor: theme.palette.primary.main,
              '&:hover': {
                bgcolor: theme.palette.primary.dark,
              },
              boxShadow: '0 4px 12px rgba(0, 136, 204, 0.3)',
              px: 3,
              py: 1,
            }}
          >
            {loading ? (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box 
                  component="span" 
                  sx={{ 
                    display: 'inline-block', 
                    width: 18, 
                    height: 18, 
                    mr: 1,
                    borderRadius: '50%',
                    borderTop: '2px solid white',
                    borderRight: '2px solid transparent',
                    animation: 'spin 0.8s linear infinite',
                    '@keyframes spin': {
                      '0%': { transform: 'rotate(0deg)' },
                      '100%': { transform: 'rotate(360deg)' }
                    }
                  }} 
                />
                Добавление...
              </Box>
            ) : (
              'Добавить'
            )}
          </Button>
        </Box>
      </Dialog>
    </Box>
  );
};

export default Expenses; 