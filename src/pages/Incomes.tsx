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
} from '@mui/icons-material';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useTelegramApp } from '../hooks/useTelegramApp';
import { createIncome, getUserIncomes, getGroups, Income, Group } from '../services/firebase';
import { Timestamp } from 'firebase/firestore';
import { alpha as muiAlpha } from '@mui/material/styles';

// Income categories with icons
const categories = [
  { id: 'salary', name: 'Зарплата', icon: <WorkIcon /> },
  { id: 'freelance', name: 'Фриланс', icon: <BusinessIcon /> },
  { id: 'investment', name: 'Инвестиции', icon: <InvestmentIcon /> },
  { id: 'gift', name: 'Подарок', icon: <GiftIcon /> },
  { id: 'refund', name: 'Возврат', icon: <PaymentsIcon /> },
  { id: 'other', name: 'Другое', icon: <MoreIcon /> },
];

const Incomes: React.FC = () => {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, showAlert, showConfirm } = useTelegramApp();
  const [searchParams] = useSearchParams();
  const groupId = searchParams.get('groupId');
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('salary');
  const [selectedGroupId, setSelectedGroupId] = useState(groupId || '');
  const [loading, setLoading] = useState(false);
  const [loadingGroups, setLoadingGroups] = useState(false);

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
  }, [user?.id]);

  const fetchIncomes = async () => {
    setLoading(true);
    try {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      
      const fetchedIncomes = await getUserIncomes(user.id.toString());
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
        // В реальном коде здесь должна быть функция удаления дохода
        // await deleteIncome(incomeId);
        
        // Для демонстрации просто удаляем из локального состояния
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
                background: 'linear-gradient(45deg, #4caf50, #2e7d32)',
                backgroundClip: 'text',
                color: 'transparent',
                WebkitBackgroundClip: 'text',
              }}
            >
              Доходы
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
                  boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)',
                  px: { xs: 2, sm: 3 },
                  bgcolor: '#4caf50',
                  '&:hover': {
                    bgcolor: '#2e7d32',
                  }
                }}
              >
                Добавить
              </Button>
            </motion.div>
          </Box>

          {/* Group selector */}
          {groups.length > 0 && (
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
                <WorkspacesIcon sx={{ mr: 1, fontSize: '1.2rem', color: '#4caf50' }} />
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
                        navigate(`/incomes?groupId=${group.id}`);
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
                          ? '#4caf50' 
                          : muiAlpha(theme.palette.divider, 0.1),
                        backgroundColor: selectedGroupId === group.id 
                          ? muiAlpha('#4caf50', 0.1)
                          : theme.palette.background.paper,
                        boxShadow: selectedGroupId === group.id 
                          ? `0 8px 16px ${muiAlpha('#4caf50', 0.2)}`
                          : 'none',
                        '&:hover': {
                          backgroundColor: selectedGroupId === group.id 
                            ? muiAlpha('#4caf50', 0.15)
                            : muiAlpha(theme.palette.background.paper, 0.8),
                          boxShadow: `0 5px 15px ${muiAlpha('#4caf50', 0.2)}`,
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
                            bgcolor: '#4caf50',
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
                              ? `0 0 0 3px #4caf50`
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
                            ? '#4caf50'
                            : theme.palette.text.primary,
                        }}
                        noWrap
                      >
                        {group.name}
                      </Typography>
                      <Tooltip title="Перейти к доходам группы">
                        <Box 
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            mt: 'auto',
                            pt: 1,
                            color: '#4caf50',
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
        </Box>

        {incomes.length === 0 ? (
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
            <AttachMoneyIcon 
              sx={{ 
                fontSize: 50, 
                color: '#4caf50', 
                opacity: 0.7, 
                mb: 3 
              }} 
            />
            <Typography variant="h6" sx={{ mb: 1, fontWeight: 500 }}>
              Доходов пока нет
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ mb: 4, maxWidth: '280px', mx: 'auto' }}
            >
              Добавьте доход, чтобы начать отслеживать финансы
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenAddDialog(true)}
              size="large"
              sx={{ 
                borderRadius: '10px',
                bgcolor: '#4caf50',
                '&:hover': {
                  bgcolor: '#2e7d32',
                }
              }}
            >
              Добавить доход
            </Button>
          </Box>
        ) : (
          <motion.div variants={containerVariants}>
            {incomes.map((income) => (
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
                  transition: 'all 0.3s ease',
                  border: '1px solid',
                  borderColor: muiAlpha(theme.palette.divider, 0.1),
                  backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(250,255,250,0.85))',
                  backdropFilter: 'blur(8px)',
                }}>
                  <CardContent sx={{ p: 0 }}>
                    {/* Category color strip */}
                    <Box sx={{ 
                      height: '6px', 
                      background: `linear-gradient(90deg, #4caf50, ${muiAlpha('#4caf50', 0.7)})`,
                    }} />
                    
                    <Box sx={{ p: 2.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ 
                            bgcolor: muiAlpha('#4caf50', 0.15), 
                            color: '#4caf50',
                            mr: 2,
                            boxShadow: `0 4px 12px ${muiAlpha('#4caf50', 0.15)}`,
                            p: 1.5,
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
                                <Box 
                                  component="span" 
                                  sx={{ 
                                    width: 8, 
                                    height: 8, 
                                    bgcolor: '#4caf50',
                                    borderRadius: '50%',
                                    display: 'inline-block',
                                    mr: 0.5
                                  }} 
                                />
                                {formatDate(income.date)}
                              </Typography>
                              <Chip 
                                label={categories.find(c => c.id === income.category)?.name || 'Другое'} 
                                size="small" 
                                sx={{ 
                                  height: 20,
                                  borderRadius: '10px',
                                  backgroundColor: muiAlpha('#4caf50', 0.1),
                                  color: '#4caf50',
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
                              backgroundImage: 'linear-gradient(45deg, #4caf50, #2e7d32)',
                              backgroundClip: 'text',
                              WebkitBackgroundClip: 'text',
                            }}
                          >
                            +{income.amount.toFixed(2)} ₽
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Divider sx={{ my: 2, opacity: 0.6 }} />
                      
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <IconButton 
                            color="error" 
                            onClick={() => handleDeleteIncome(income.id)}
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
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>

      {/* Add Income Dialog */}
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
        {/* Green Gradient Top Bar */}
        <Box sx={{ 
          height: '8px', 
          background: `linear-gradient(90deg, #4caf50, ${muiAlpha('#4caf50', 0.7)})`,
        }} />
        
        {/* Modal Title with Plus Icon */}
        <DialogTitle sx={{ 
          fontSize: '1.25rem', 
          fontWeight: 600, 
          textAlign: 'center',
          pt: 3,
          pb: 1,
          color: '#4caf50',
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 1 }}>
            <Avatar
              sx={{
                bgcolor: '#4caf50',
                width: 48,
                height: 48,
                boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)',
              }}
            >
              <AddIcon sx={{ color: '#fff', fontSize: '1.8rem' }} />
            </Avatar>
          </Box>
          Добавить доход
        </DialogTitle>
        
        {/* Form Content */}
        <DialogContent sx={{ px: { xs: 2, sm: 3 }, py: 2 }}>
          <Grid container spacing={2.5}>
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
                    <Box component="span" sx={{ color: '#4caf50', mr: 1, fontWeight: 500 }}>
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
                      borderColor: '#4caf50',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#4caf50',
                    }
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
                      borderColor: '#4caf50',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#4caf50',
                    }
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
                      borderColor: '#4caf50',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#4caf50',
                    }
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
                          backgroundColor: muiAlpha('#4caf50', 0.1),
                        },
                        '&.Mui-selected': {
                          backgroundColor: muiAlpha('#4caf50', 0.1),
                          '&:hover': {
                            backgroundColor: muiAlpha('#4caf50', 0.15),
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
                            color: '#4caf50',
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
              borderColor: '#4caf50',
              color: '#4caf50',
            }}
          >
            Отмена
          </Button>
          <Button 
            onClick={() => {
              console.log('Add button clicked');
              handleAddIncome();
            }}
            variant="contained" 
            disabled={loading || !amount}
            sx={{ 
              borderRadius: '12px',
              minWidth: '120px',
              fontWeight: 500,
              bgcolor: '#4caf50',
              '&:hover': {
                bgcolor: '#3d8b40',
              },
              boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)',
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

export default Incomes; 