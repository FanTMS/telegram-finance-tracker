import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  useTheme,
  Container,
  alpha,
  Avatar,
  Button,
  Paper,
  Divider,
  useMediaQuery,
  Skeleton,
  Chip,
  AvatarGroup,
  Badge,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  People as GroupIcon,
  AccountBalance as ExpensesIcon,
  TrendingUp as IncomesIcon,
  ShoppingCart as PurchasesIcon,
  EmojiEvents as GoalsIcon,
  Analytics as AnalyticsIcon,
  ArrowForward as ArrowIcon,
  Refresh as RefreshIcon,
  Public as GlobalIcon,
  Groups as GroupsIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTelegramApp } from '../hooks/useTelegramApp';
import { getGroups, getUserExpenses, getUserFinancialSummary, getGroupExpenses, Group, Expense, Income } from '../services/firebase';

const Dashboard: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user } = useTelegramApp();
  const [hoveredItem, setHoveredItem] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [groupStats, setGroupStats] = useState<{
    totalExpenses: number;
    participants: number;
    expenses: Expense[];
  } | null>(null);

  // Financial data with proper typing
  const [stats, setStats] = useState({
    totalExpenses: 0,
    totalIncome: 0,
    balance: 0,
    recentActivity: [] as (Expense | Income)[],
    groupCount: 0,
  });

  // Fetch user data from Firebase
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.id) {
        // No user, use mock data for development
        setTimeout(() => {
          setStats({
            totalExpenses: 18500,
            totalIncome: 45000,
            balance: 26500,
            recentActivity: [],
            groupCount: 3,
          });
          
          setGroups([
            { id: 'mock-1', name: 'Семья', inviteCode: '123', members: ['123456'], createdAt: null as any, createdBy: '123456' },
            { id: 'mock-2', name: 'Друзья', inviteCode: '456', members: ['123456'], createdAt: null as any, createdBy: '123456' },
            { id: 'mock-3', name: 'Работа', inviteCode: '789', members: ['123456'], createdAt: null as any, createdBy: '123456' },
          ]);
          
          setIsLoading(false);
        }, 800);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        // Get user groups
        const userGroups = await getGroups(user.id.toString());
        setGroups(userGroups);
        
        // Get financial summary
        const financialSummary = await getUserFinancialSummary(user.id.toString());
        
        // Format data
        setStats({
          totalExpenses: Math.round(financialSummary.totalExpenses),
          totalIncome: Math.round(financialSummary.totalIncome),
          balance: Math.round(financialSummary.balance),
          recentActivity: [...financialSummary.recentExpenses, ...financialSummary.recentIncomes] as (Expense | Income)[],
          groupCount: userGroups.length,
        });
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Не удалось загрузить данные. Пожалуйста, попробуйте позже.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  // Fetch group statistics when a group is selected
  useEffect(() => {
    const fetchGroupStats = async () => {
      if (!selectedGroupId || selectedGroupId === 'all' || !user?.id) return;
      
      try {
        setIsLoading(true);
        
        // Get expenses for the selected group
        const groupExpenses = await getGroupExpenses(selectedGroupId);
        
        // Find the selected group
        const selectedGroup = groups.find(g => g.id === selectedGroupId);
        
        if (selectedGroup) {
          // Calculate total expenses for the group
          const totalGroupExpenses = groupExpenses.reduce((sum, expense) => sum + expense.amount, 0);
          
          setGroupStats({
            totalExpenses: totalGroupExpenses,
            participants: selectedGroup.members.length,
            expenses: groupExpenses
          });
        }
      } catch (err) {
        console.error('Error fetching group statistics:', err);
        setError('Не удалось загрузить данные о группе');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchGroupStats();
  }, [selectedGroupId, groups, user?.id]);

  // Refresh data
  const refreshData = async () => {
    if (!user?.id) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      if (selectedGroupId && selectedGroupId !== 'all') {
        // Refresh group statistics
        const groupExpenses = await getGroupExpenses(selectedGroupId);
        const selectedGroup = groups.find(g => g.id === selectedGroupId);
        
        if (selectedGroup) {
          const totalGroupExpenses = groupExpenses.reduce((sum, expense) => sum + expense.amount, 0);
          
          setGroupStats({
            totalExpenses: totalGroupExpenses,
            participants: selectedGroup.members.length,
            expenses: groupExpenses
          });
        }
      } else {
        // Refresh overall statistics
        const userGroups = await getGroups(user.id.toString());
        const financialSummary = await getUserFinancialSummary(user.id.toString());
        
        setStats({
          totalExpenses: Math.round(financialSummary.totalExpenses),
          totalIncome: Math.round(financialSummary.totalIncome),
          balance: Math.round(financialSummary.balance),
          recentActivity: [...financialSummary.recentExpenses, ...financialSummary.recentIncomes] as (Expense | Income)[],
          groupCount: userGroups.length,
        });
      }
    } catch (err) {
      console.error('Error refreshing data:', err);
      setError('Не удалось обновить данные');
    } finally {
      setIsLoading(false);
    }
  };

  // Group selection handler
  const handleGroupSelect = (groupId: string) => {
    setSelectedGroupId(groupId === selectedGroupId ? 'all' : groupId);
  };

  // Get group initials
  const getGroupInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Get group color based on name
  const getGroupColor = (name: string) => {
    const colors = [
      '#0088cc', // Blue
      '#e53935', // Red
      '#43a047', // Green
      '#fb8c00', // Orange
      '#8e24aa', // Purple
      '#039be5', // Light blue
      '#f44336', // Red
      '#009688', // Teal
      '#673ab7', // Deep Purple
    ];
    
    // Simple hash for consistent colors
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

  const menuItems = [
    {
      title: 'Группы',
      subtitle: 'Управление группами',
      icon: <GroupIcon fontSize="large" />,
      path: '/groups',
      color: '#0088cc', // Telegram blue
      bgColor: alpha('#e3f2fd', 0.8),
      badgeCount: stats.groupCount,
    },
    {
      title: 'Расходы',
      subtitle: 'Отслеживание трат',
      icon: <ExpensesIcon fontSize="large" />,
      path: '/expenses',
      color: '#e53935', // Red
      bgColor: alpha('#ffebee', 0.8),
      badgeCount: 0,
    },
    {
      title: 'Доходы',
      subtitle: 'Источники дохода',
      icon: <IncomesIcon fontSize="large" />,
      path: '/incomes',
      color: '#43a047', // Green
      bgColor: alpha('#e8f5e9', 0.8),
      badgeCount: 0,
    },
    {
      title: 'Покупки',
      subtitle: 'Планирование покупок',
      icon: <PurchasesIcon fontSize="large" />,
      path: '/purchases',
      color: '#fb8c00', // Orange
      bgColor: alpha('#fff3e0', 0.8),
      badgeCount: 0,
    },
    {
      title: 'Достижения',
      subtitle: 'Финансовые цели',
      icon: <GoalsIcon fontSize="large" />,
      path: '/goals',
      color: '#8e24aa', // Purple
      bgColor: alpha('#f3e5f5', 0.8),
      badgeCount: 0,
    },
    {
      title: 'Аналитика',
      subtitle: 'Финансовая статистика',
      icon: <AnalyticsIcon fontSize="large" />,
      path: '/analytics',
      color: '#039be5', // Light blue
      bgColor: alpha('#e1f5fe', 0.8),
      badgeCount: 0,
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 24,
      }
    },
    hover: {
      scale: 1.04,
      boxShadow: '0px 8px 25px rgba(0, 0, 0, 0.12)',
      y: -5,
      transition: {
        type: 'spring',
        stiffness: 350,
        damping: 20,
      }
    },
    tap: {
      scale: 0.98,
      boxShadow: '0px 3px 12px rgba(0, 0, 0, 0.1)',
      transition: {
        duration: 0.1,
      }
    }
  };

  const summaryVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30,
        delay: 0.1,
      }
    }
  };

  const headerVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      }
    }
  };

  // Function to render financial summary skeletons
  const renderSummarySkeletons = () => (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: { xs: 'column', sm: 'row' },
      gap: { xs: 2, sm: 4 },
      mt: 2,
    }}>
      {[1, 2, 3].map((item) => (
        <Box key={item}>
          <Skeleton variant="text" width={80} height={20} />
          <Skeleton variant="text" width={120} height={32} />
        </Box>
      ))}
    </Box>
  );

  // Render group selection scrollable row
  const renderGroupSelector = () => (
    <Box sx={{ mb: 3, mt: 1 }}>
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5, fontWeight: 500 }}>
        Выберите группу
      </Typography>
      <Box sx={{ 
        display: 'flex', 
        overflowX: 'auto', 
        pb: 1,
        pt: 0.5,
        scrollbarWidth: 'none',
        '&::-webkit-scrollbar': {
          display: 'none'
        },
        gap: 1.5
      }}>
        {/* Global stats selector */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Avatar
            sx={{
              width: 56,
              height: 56,
              bgcolor: selectedGroupId === 'all' || !selectedGroupId ? theme.palette.primary.main : alpha(theme.palette.grey[500], 0.6),
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: selectedGroupId === 'all' || !selectedGroupId ? '0 2px 8px rgba(0, 136, 204, 0.4)' : 'none',
              border: '2px solid',
              borderColor: selectedGroupId === 'all' || !selectedGroupId ? 'white' : 'transparent',
            }}
            onClick={() => handleGroupSelect('all')}
          >
            <GlobalIcon />
          </Avatar>
          <Typography variant="caption" sx={{ mt: 1, fontWeight: 500, fontSize: '0.7rem' }}>
            Общее
          </Typography>
        </Box>
        
        {/* Group selectors */}
        {groups.map((group) => {
          const groupColor = getGroupColor(group.name);
          const isSelected = selectedGroupId === group.id;
          
          return (
            <Box key={group.id} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Avatar
                sx={{
                  width: 56,
                  height: 56,
                  bgcolor: isSelected ? groupColor : alpha(groupColor, 0.5),
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: isSelected ? `0 2px 8px ${alpha(groupColor, 0.5)}` : 'none',
                  border: '2px solid',
                  borderColor: isSelected ? 'white' : 'transparent',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: `0 4px 10px ${alpha(groupColor, 0.4)}`
                  }
                }}
                onClick={() => handleGroupSelect(group.id)}
              >
                {getGroupInitials(group.name)}
              </Avatar>
              <Typography variant="caption" sx={{ mt: 1, fontWeight: 500, fontSize: '0.7rem', maxWidth: 70, textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {group.name}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );

  // Determine summary title based on selection
  const getSummaryTitle = () => {
    if (!selectedGroupId || selectedGroupId === 'all') {
      return 'Финансовый обзор';
    }
    
    const selectedGroup = groups.find(g => g.id === selectedGroupId);
    return selectedGroup ? `Группа "${selectedGroup.name}"` : 'Обзор группы';
  };

  // Render the financial summary content
  const renderFinancialContent = () => {
    if (isLoading) {
      return renderSummarySkeletons();
    }
    
    if (error) {
      return (
        <Typography color="error.light" sx={{ mt: 2 }}>
          {error}
        </Typography>
      );
    }
    
    // Show group statistics if a group is selected
    if (selectedGroupId && selectedGroupId !== 'all' && groupStats) {
      return (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 2, sm: 4 },
          mt: 2,
        }}>
          <Box>
            <Typography variant="caption" sx={{ opacity: 0.7 }}>
              Расходы группы
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              {groupStats.totalExpenses.toLocaleString()} ₽
            </Typography>
          </Box>
          
          <Box>
            <Typography variant="caption" sx={{ opacity: 0.7 }}>
              Участников
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
              <GroupsIcon sx={{ mr: 1, fontSize: '1.2rem' }} /> {groupStats.participants}
            </Typography>
          </Box>
          
          <Box>
            <Typography variant="caption" sx={{ opacity: 0.7 }}>
              Транзакций
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
              {groupStats.expenses.length}
            </Typography>
          </Box>
        </Box>
      );
    }
    
    // Otherwise show the overall statistics
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        gap: { xs: 2, sm: 4 },
        mt: 2,
      }}>
        <Box>
          <Typography variant="caption" sx={{ opacity: 0.7 }}>
            Доходы
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            {stats.totalIncome.toLocaleString()} ₽
          </Typography>
        </Box>
        
        <Box>
          <Typography variant="caption" sx={{ opacity: 0.7 }}>
            Расходы
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            {stats.totalExpenses.toLocaleString()} ₽
          </Typography>
        </Box>
        
        <Box>
          <Typography variant="caption" sx={{ opacity: 0.7 }}>
            Баланс
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            {stats.balance.toLocaleString()} ₽
          </Typography>
        </Box>
      </Box>
    );
  };

  return (
    <Container maxWidth="md" sx={{ py: { xs: 2, sm: 4 }, pb: 10 }}>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Header with welcome message */}
        <motion.div variants={headerVariants}>
          <Box sx={{ 
            mb: 3, 
            display: 'flex', 
            alignItems: 'center',
            justifyContent: 'space-between',
            flexDirection: { xs: 'column', sm: 'row' },
            textAlign: { xs: 'center', sm: 'left' },
          }}>
            <Box>
              <Typography 
                variant="h4" 
                component="h1" 
                sx={{ 
                  fontWeight: 700,
                  mb: 1,
                  fontSize: { xs: '1.75rem', sm: '2.25rem' },
                  background: 'linear-gradient(45deg, #0088cc, #2AABEE)',
                  backgroundClip: 'text',
                  color: 'transparent',
                  WebkitBackgroundClip: 'text',
                }}
              >
                Добро пожаловать
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                Управляйте финансами вместе с близкими
              </Typography>
            </Box>
            <Avatar
              sx={{
                width: { xs: 60, sm: 70 },
                height: { xs: 60, sm: 70 },
                bgcolor: theme.palette.primary.main,
                mt: { xs: 2, sm: 0 },
                boxShadow: '0 4px 12px rgba(0, 136, 204, 0.3)',
              }}
            >
              {user?.first_name ? user.first_name.charAt(0) : 'U'}
            </Avatar>
          </Box>
        </motion.div>

        {/* Group selector */}
        {!isLoading && groups.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {renderGroupSelector()}
          </motion.div>
        )}

        {/* Financial summary card */}
        <motion.div variants={summaryVariants}>
          <Paper 
            elevation={0}
            sx={{ 
              borderRadius: '24px',
              overflow: 'hidden',
              mb: 4,
              background: 'linear-gradient(145deg, #0088cc, #2AABEE)',
              boxShadow: '0 10px 30px rgba(0, 136, 204, 0.3)',
              position: 'relative'
            }}
          >
            {!isLoading && (
              <Button 
                size="small"
                sx={{ 
                  position: 'absolute', 
                  top: 8, 
                  right: 8,
                  minWidth: 'auto',
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  color: 'white',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.3)'
                  }
                }}
                onClick={refreshData}
              >
                <RefreshIcon fontSize="small" />
              </Button>
            )}
            
            <Box
              sx={{
                p: 3,
                color: 'white',
              }}
            >
              <Typography variant="h6" sx={{ mb: 0.5, fontWeight: 500 }}>
                {getSummaryTitle()}
              </Typography>
              
              {renderFinancialContent()}
            </Box>
          </Paper>
        </motion.div>

        {/* Main menu grid */}
        <Grid container spacing={2}>
          {menuItems.map((item, index) => (
            <Grid item xs={6} sm={4} key={index}>
              <motion.div
                variants={itemVariants}
                whileHover="hover"
                whileTap="tap"
                onHoverStart={() => setHoveredItem(index)}
                onHoverEnd={() => setHoveredItem(null)}
                onClick={() => navigate(item.path)}
              >
                <Card 
                  sx={{ 
                    height: '100%',
                    borderRadius: '20px',
                    backgroundColor: item.bgColor,
                    transition: 'all 0.3s ease',
                    border: '1px solid',
                    borderColor: alpha(item.color, 0.3),
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <CardContent sx={{ p: 2, pb: '16px !important' }}>
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                      height: '100%',
                    }}>
                      <Avatar
                        sx={{
                          bgcolor: alpha(item.color, 0.15),
                          color: item.color,
                          width: { xs: 50, sm: 60 },
                          height: { xs: 50, sm: 60 },
                          mb: 1.5,
                          '& .MuiSvgIcon-root': {
                            fontSize: { xs: '1.75rem', sm: '2rem' },
                          }
                        }}
                      >
                        {item.icon}
                      </Avatar>
                      
                      <Typography 
                        variant="h6" 
                        component="h2" 
                        sx={{ 
                          fontWeight: 600,
                          color: item.color,
                          mb: 0.5,
                          fontSize: { xs: '1rem', sm: '1.25rem' },
                        }}
                      >
                        {item.title}
                      </Typography>
                      
                      {!isMobile && (
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{ 
                            fontSize: '0.8rem',
                            opacity: 0.8,
                          }}
                        >
                          {item.subtitle}
                        </Typography>
                      )}

                      {/* Badge if needed */}
                      {item.badgeCount > 0 && (
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 16,
                            right: 16,
                            bgcolor: theme.palette.error.main,
                            color: 'white',
                            borderRadius: '50%',
                            width: 24,
                            height: 24,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                          }}
                        >
                          {item.badgeCount}
                        </Box>
                      )}
                      
                      {/* Arrow indicator on hover */}
                      <AnimatePresence>
                        {hoveredItem === index && !isMobile && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.5 }}
                            transition={{ duration: 0.2 }}
                            style={{
                              position: 'absolute',
                              bottom: 12,
                              right: 12,
                            }}
                          >
                            <ArrowIcon
                              sx={{
                                color: item.color,
                                opacity: 0.8,
                              }}
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </motion.div>
    </Container>
  );
};

export default Dashboard;