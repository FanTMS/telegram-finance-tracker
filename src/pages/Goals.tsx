import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Card, 
  CardContent, 
  Button, 
  TextField, 
  CircularProgress, 
  Grid,
  IconButton,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Avatar,
  Chip,
  Tooltip,
  Snackbar,
  Alert,
  alpha,
  useTheme
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import NotificationsIcon from '@mui/icons-material/Notifications';
import GroupIcon from '@mui/icons-material/Group';
import { motion, AnimatePresence } from 'framer-motion';
import { useTelegramApp } from '../hooks/useTelegramApp';
import { 
  getGroups, 
  Group, 
  createGoal, 
  updateGoalProgress,
  getGoalsByGroup,
  deleteGoal,
  Goal as GoalType
} from '../services/firebase';
import { Timestamp } from 'firebase/firestore';
import { formatCurrency } from '../utils/formatters';

// Extended Goal interface for our UI
interface GoalWithProgress extends GoalType {
  progress: number;
}

// Goal page component with animations and Firebase integration
const Goals: React.FC = () => {
  const theme = useTheme();
  const { user, isAuthenticating, showAlert } = useTelegramApp();
  
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [goals, setGoals] = useState<GoalWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingGoals, setLoadingGoals] = useState(false);
  
  const [openDialog, setOpenDialog] = useState(false);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalAmount, setGoalAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [goalDeadline, setGoalDeadline] = useState('');
  const [editingGoal, setEditingGoal] = useState<GoalWithProgress | null>(null);
  
  const [openContributeDialog, setOpenContributeDialog] = useState(false);
  const [contributeAmount, setContributeAmount] = useState('');
  const [contributingGoal, setContributingGoal] = useState<GoalWithProgress | null>(null);
  const [isAdding, setIsAdding] = useState(true);
  
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 300, damping: 24 }
    },
    exit: { 
      opacity: 0, 
      y: -20,
      transition: { duration: 0.2 } 
    }
  };

  // Fetch user's groups from Firebase
  useEffect(() => {
    async function fetchGroups() {
      try {
        if (isAuthenticating) {
          return; // Wait for authentication to complete
        }
        
        if (!user?.id) {
          setLoading(false);
          showAlert('Ошибка: пользователь не авторизован');
          return;
        }
        
        const userGroups = await getGroups(user.id.toString());
        setGroups(userGroups);
        
        if (userGroups.length > 0) {
          setSelectedGroupId(userGroups[0].id);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching groups:', error);
        setLoading(false);
        
        // Handle error with mock data during development
        if (process.env.NODE_ENV !== 'production') {
          const mockGroups: Group[] = [
            {
              id: '1',
              name: 'Семья',
              inviteCode: 'FAMILY1',
              members: [user?.id.toString() || '123456', '789012', '345678'],
              createdAt: Timestamp.now(),
              createdBy: user?.id.toString() || '123456'
            }
          ];
          setGroups(mockGroups);
          setSelectedGroupId('1');
        }
      }
    }

    fetchGroups();
  }, [user, isAuthenticating, showAlert]);

  // Fetch goals when a group is selected
  useEffect(() => {
    async function fetchGoals() {
      if (!selectedGroupId) return;
      
      try {
        setLoadingGoals(true);
        const fetchedGoals = await getGoalsByGroup(selectedGroupId);
        
        // Calculate progress for each goal
        const goalsWithProgress = fetchedGoals.map(goal => ({
          ...goal,
          progress: Math.min(100, (goal.currentAmount / goal.targetAmount) * 100)
        }));
        
        setGoals(goalsWithProgress);
        setLoadingGoals(false);
      } catch (error) {
        console.error('Error fetching goals:', error);
        setLoadingGoals(false);
        
        // Mock data for development
        if (process.env.NODE_ENV !== 'production') {
          const mockGoals: GoalWithProgress[] = [
            { 
              id: '1', 
              groupId: selectedGroupId, 
              title: 'Новый автомобиль', 
              targetAmount: 20000, 
              currentAmount: 5000,
              deadline: Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
              createdBy: user?.id.toString() || '123456',
              progress: 25
            },
            { 
              id: '2', 
              groupId: selectedGroupId, 
              title: 'Отпуск', 
              targetAmount: 3000, 
              currentAmount: 1500,
              deadline: Timestamp.fromDate(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)),
              createdBy: user?.id.toString() || '123456',
              progress: 50
            },
            { 
              id: '3', 
              groupId: selectedGroupId, 
              title: 'Резервный фонд', 
              targetAmount: 10000, 
              currentAmount: 7500,
              deadline: Timestamp.fromDate(new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)),
              createdBy: user?.id.toString() || '123456',
              progress: 75
            }
          ];
          setGoals(mockGoals);
        }
      }
    }

    fetchGoals();
  }, [selectedGroupId, user]);

  const handleOpenDialog = (goal: GoalWithProgress | null = null) => {
    if (goal) {
      setEditingGoal(goal);
      setGoalTitle(goal.title);
      setGoalAmount(goal.targetAmount.toString());
      setCurrentAmount(goal.currentAmount.toString());
      setGoalDeadline(goal.deadline.toDate().toISOString().split('T')[0]);
    } else {
      setEditingGoal(null);
      setGoalTitle('');
      setGoalAmount('');
      setCurrentAmount('0');
      setGoalDeadline(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleSaveGoal = async () => {
    if (!goalTitle || !goalAmount || !selectedGroupId || !user?.id) {
      setNotification({
        open: true,
        message: 'Пожалуйста, заполните все поля',
        severity: 'warning'
      });
      return;
    }

    try {
      if (editingGoal) {
        // Update existing goal
        await updateGoalProgress(editingGoal.id, Number(currentAmount));
        
        // Update local state
        setGoals(goals.map(g => 
          g.id === editingGoal.id 
            ? { 
                ...g, 
                currentAmount: Number(currentAmount),
                progress: Math.min(100, (Number(currentAmount) / g.targetAmount) * 100)
              } 
            : g
        ));
        
        setNotification({
          open: true,
          message: 'Цель успешно обновлена',
          severity: 'success'
        });
      } else {
        // Add new goal
        const newGoalData = {
          groupId: selectedGroupId,
          title: goalTitle,
          targetAmount: Number(goalAmount),
          currentAmount: Number(currentAmount) || 0,
          deadline: Timestamp.fromDate(new Date(goalDeadline)),
          createdBy: user.id.toString()
        };
        
        const newGoal = await createGoal(newGoalData);
        
        // Update local state
        const goalWithProgress = {
          ...newGoal,
          progress: Math.min(100, (Number(currentAmount) / Number(goalAmount)) * 100)
        };
        
        setGoals([...goals, goalWithProgress]);
        
        setNotification({
          open: true,
          message: 'Новая цель успешно создана',
          severity: 'success'
        });
      }
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving goal:', error);
      setNotification({
        open: true,
        message: 'Произошла ошибка при сохранении цели',
        severity: 'error'
      });
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      await deleteGoal(goalId);
      setGoals(goals.filter(goal => goal.id !== goalId));
      
      setNotification({
        open: true,
        message: 'Цель успешно удалена',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error deleting goal:', error);
      setNotification({
        open: true,
        message: 'Произошла ошибка при удалении цели',
        severity: 'error'
      });
    }
  };

  const handleOpenContributeDialog = (goal: GoalWithProgress, isAdd: boolean = true) => {
    setContributingGoal(goal);
    setContributeAmount('');
    setIsAdding(isAdd);
    setOpenContributeDialog(true);
  };

  const handleCloseContributeDialog = () => {
    setOpenContributeDialog(false);
  };

  const handleContributeToGoal = async () => {
    if (!contributingGoal || !contributeAmount) return;
    
    try {
      const contributionAmount = Number(contributeAmount);
      if (contributionAmount <= 0) {
        setNotification({
          open: true,
          message: 'Пожалуйста, введите положительное значение',
          severity: 'warning'
        });
        return;
      }
      
      // Calculate new amount
      let newAmount = contributingGoal.currentAmount;
      if (isAdding) {
        newAmount += contributionAmount;
      } else {
        newAmount = Math.max(0, newAmount - contributionAmount);
      }
      
      // Update in Firebase
      await updateGoalProgress(contributingGoal.id, newAmount);
      
      // Update local state
      setGoals(goals.map(g => 
        g.id === contributingGoal.id 
          ? { 
              ...g, 
              currentAmount: newAmount,
              progress: Math.min(100, (newAmount / g.targetAmount) * 100)
            } 
          : g
      ));
      
      setNotification({
        open: true,
        message: isAdding ? 'Пополнение успешно добавлено' : 'Сумма успешно списана',
        severity: 'success'
      });
      
      handleCloseContributeDialog();
    } catch (error) {
      console.error('Error contributing to goal:', error);
      setNotification({
        open: true,
        message: 'Произошла ошибка при обновлении цели',
        severity: 'error'
      });
    }
  };

  const handleCloseNotification = () => {
    setNotification({
      ...notification,
      open: false
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ minHeight: '100vh' }}
    >
      <Container maxWidth="sm" sx={{ py: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
            Финансовые цели
          </Typography>
          
          {/* Group selection */}
          {!loading && groups.length > 0 && (
            <FormControl fullWidth variant="outlined" sx={{ mt: 2, mb: 2 }}>
              <InputLabel id="group-select-label">Выберите группу</InputLabel>
              <Select
                labelId="group-select-label"
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                label="Выберите группу"
                startAdornment={
                  <InputAdornment position="start">
                    <GroupIcon color="primary" />
                  </InputAdornment>
                }
              >
                {groups.map(group => (
                  <MenuItem key={group.id} value={group.id}>
                    {group.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          
          {/* Actions */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3, mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 500, alignSelf: 'center' }}>
              {loadingGoals ? 'Загрузка целей...' : goals.length === 0 ? 'Нет целей' : 'Ваши цели'}
            </Typography>
            {selectedGroupId && (
              <Button 
                variant="contained" 
                startIcon={<AddIcon />} 
                onClick={() => handleOpenDialog()}
                sx={{ 
                  borderRadius: '12px',
                  boxShadow: theme.shadows[2],
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: theme.shadows[4],
                  }
                }}
              >
                Новая цель
              </Button>
            )}
          </Box>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {groups.length === 0 ? (
              <Card sx={{ 
                p: 3, 
                textAlign: 'center', 
                borderRadius: '16px',
                boxShadow: theme.shadows[2],
                bgcolor: alpha(theme.palette.primary.main, 0.05)
              }}>
                <GroupIcon sx={{ fontSize: 48, color: 'primary.main', opacity: 0.7, mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  У вас пока нет групп
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Для работы с финансовыми целями необходимо создать или присоединиться к группе
                </Typography>
                <Button 
                  variant="contained" 
                  onClick={() => window.location.href = '/groups'}
                  sx={{ borderRadius: '12px' }}
                >
                  Перейти к группам
                </Button>
              </Card>
            ) : selectedGroupId && loadingGoals ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                <CircularProgress />
              </Box>
            ) : selectedGroupId && goals.length === 0 ? (
              <motion.div 
                variants={itemVariants}
                initial="hidden"
                animate="visible"
              >
                <Card sx={{ 
                  p: 3, 
                  textAlign: 'center', 
                  borderRadius: '16px',
                  boxShadow: theme.shadows[2],
                  bgcolor: alpha(theme.palette.background.default, 0.7)
                }}>
                  <AddIcon sx={{ fontSize: 48, color: 'primary.main', opacity: 0.7, mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Целей пока нет
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Создайте первую финансовую цель для вашей группы
                  </Typography>
                  <Button 
                    variant="contained" 
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenDialog()}
                    sx={{ borderRadius: '12px' }}
                  >
                    Создать цель
                  </Button>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                <AnimatePresence>
                  {goals.map((goal) => (
                    <motion.div 
                      key={goal.id} 
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      layout
                    >
                      <Card sx={{ 
                        mb: 2.5, 
                        borderRadius: '16px',
                        overflow: 'visible',
                        boxShadow: theme.shadows[1],
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          boxShadow: theme.shadows[3],
                          transform: 'translateY(-2px)'
                        }
                      }}>
                        <CardContent sx={{ pb: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
                              {goal.title}
                            </Typography>
                            <Box>
                              <Tooltip title="Редактировать цель">
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleOpenDialog(goal)}
                                  sx={{ 
                                    color: 'primary.main',
                                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.1) }
                                  }}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Удалить цель">
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleDeleteGoal(goal.id)}
                                  sx={{ 
                                    color: 'error.main',
                                    '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.1) }
                                  }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </Box>
                          
                          <Box sx={{ mb: 1 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                              Срок: {goal.deadline?.toDate().toLocaleDateString() || 'Не указан'}
                            </Typography>
                          </Box>
                          
                          <Box sx={{ mt: 2, mb: 1.5 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, display: 'flex', justifyContent: 'space-between' }}>
                              <span>Прогресс:</span>
                              <span>{goal.progress.toFixed(0)}%</span>
                            </Typography>
                            <LinearProgress 
                              variant="determinate" 
                              value={goal.progress} 
                              sx={{ 
                                height: 8, 
                                borderRadius: 4,
                                bgcolor: alpha(theme.palette.primary.main, 0.15),
                                '& .MuiLinearProgress-bar': {
                                  borderRadius: 4,
                                  backgroundColor: goal.progress >= 100 
                                    ? theme.palette.success.main 
                                    : goal.progress > 60 
                                      ? theme.palette.primary.main 
                                      : goal.progress > 30 
                                        ? theme.palette.warning.main 
                                        : theme.palette.error.main,
                                }
                              }}
                            />
                          </Box>
                          
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                Текущая сумма
                              </Typography>
                              <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                                {formatCurrency(goal.currentAmount)}
                              </Typography>
                            </Box>
                            <Box>
                              <Typography variant="body2" color="text.secondary" align="right">
                                Целевая сумма
                              </Typography>
                              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                {formatCurrency(goal.targetAmount)}
                              </Typography>
                            </Box>
                          </Box>
                          
                          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2 }}>
                            <Button 
                              size="small" 
                              variant="contained" 
                              color="primary"
                              startIcon={<ArrowUpwardIcon />}
                              onClick={() => handleOpenContributeDialog(goal, true)}
                              sx={{ borderRadius: '12px', flex: 1 }}
                            >
                              Пополнить
                            </Button>
                            <Button 
                              size="small" 
                              variant="outlined" 
                              color="primary"
                              startIcon={<ArrowDownwardIcon />}
                              onClick={() => handleOpenContributeDialog(goal, false)}
                              sx={{ borderRadius: '12px', flex: 1 }}
                            >
                              Списать
                            </Button>
                          </Box>
                          
                          {goal.progress >= 100 && (
                            <Chip 
                              icon={<NotificationsIcon fontSize="small" />} 
                              label="Цель достигнута!" 
                              color="success"
                              size="small"
                              sx={{ mt: 2, borderRadius: '8px' }}
                            />
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </>
        )}

        {/* Dialog for adding/editing goals */}
        <Dialog 
          open={openDialog} 
          onClose={handleCloseDialog}
          PaperProps={{
            sx: { borderRadius: '16px', px: 1 }
          }}
        >
          <DialogTitle sx={{ pb: 1, pt: 2 }}>
            {editingGoal ? 'Редактировать цель' : 'Добавить новую цель'}
          </DialogTitle>
          <DialogContent sx={{ pb: 1 }}>
            <TextField
              autoFocus
              margin="dense"
              label="Название цели"
              type="text"
              fullWidth
              variant="outlined"
              value={goalTitle}
              onChange={(e) => setGoalTitle(e.target.value)}
              sx={{ mb: 2, mt: 1 }}
            />
            <TextField
              margin="dense"
              label="Целевая сумма"
              type="number"
              fullWidth
              variant="outlined"
              InputProps={{
                startAdornment: <InputAdornment position="start">₽</InputAdornment>,
              }}
              value={goalAmount}
              onChange={(e) => setGoalAmount(e.target.value)}
              disabled={editingGoal !== null}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="Текущая сумма"
              type="number"
              fullWidth
              variant="outlined"
              InputProps={{
                startAdornment: <InputAdornment position="start">₽</InputAdornment>,
              }}
              value={currentAmount}
              onChange={(e) => setCurrentAmount(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="Срок достижения"
              type="date"
              fullWidth
              variant="outlined"
              value={goalDeadline}
              onChange={(e) => setGoalDeadline(e.target.value)}
              disabled={editingGoal !== null}
              sx={{ mb: 1 }}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleCloseDialog} sx={{ borderRadius: '10px' }}>
              Отмена
            </Button>
            <Button 
              onClick={handleSaveGoal} 
              variant="contained"
              sx={{ borderRadius: '10px' }}
            >
              Сохранить
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog for contributing to goals */}
        <Dialog 
          open={openContributeDialog} 
          onClose={handleCloseContributeDialog}
          PaperProps={{
            sx: { borderRadius: '16px', px: 1 }
          }}
        >
          <DialogTitle sx={{ pb: 1, pt: 2 }}>
            {isAdding ? 'Пополнить цель' : 'Списать с цели'}
          </DialogTitle>
          <DialogContent sx={{ pb: 1 }}>
            {contributingGoal && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {contributingGoal.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Текущая сумма: {formatCurrency(contributingGoal.currentAmount)}
                </Typography>
              </Box>
            )}
            <TextField
              autoFocus
              margin="dense"
              label={isAdding ? "Сумма пополнения" : "Сумма списания"}
              type="number"
              fullWidth
              variant="outlined"
              InputProps={{
                startAdornment: <InputAdornment position="start">₽</InputAdornment>,
              }}
              value={contributeAmount}
              onChange={(e) => setContributeAmount(e.target.value)}
              sx={{ mb: 1, mt: 1 }}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleCloseContributeDialog} sx={{ borderRadius: '10px' }}>
              Отмена
            </Button>
            <Button 
              onClick={handleContributeToGoal} 
              variant="contained"
              color={isAdding ? "primary" : "warning"}
              sx={{ borderRadius: '10px' }}
            >
              {isAdding ? "Пополнить" : "Списать"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Notifications */}
        <Snackbar 
          open={notification.open} 
          autoHideDuration={4000} 
          onClose={handleCloseNotification}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            onClose={handleCloseNotification} 
            severity={notification.severity}
            variant="filled"
            sx={{ width: '100%', borderRadius: '12px' }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      </Container>
    </motion.div>
  );
};

export default Goals; 