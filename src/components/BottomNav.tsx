import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  BottomNavigation, 
  BottomNavigationAction, 
  Paper, 
  Badge,
  Box,
  useTheme,
} from '@mui/material';
import { 
  Home as HomeIcon,
  Group as GroupIcon,
  Payments as PaymentsIcon,
  Savings as SavingsIcon,
  Analytics as AnalyticsIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useTelegramApp } from '../hooks/useTelegramApp';
import { getUnreadNotificationsCount } from '../services/notifications';

interface BottomNavProps {
  badgeCounts?: {
    dashboard?: number;
    groups?: number;
    expenses?: number;
    incomes?: number;
    analytics?: number;
  };
}

const BottomNav: React.FC<BottomNavProps> = ({ badgeCounts = {} }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;
  const theme = useTheme();
  const { user } = useTelegramApp();
  const [notificationsCount, setNotificationsCount] = useState(0);
  
  // Fetch notifications count for the expenses badge
  useEffect(() => {
    const fetchNotificationsCount = async () => {
      if (!user?.id) return;
      
      try {
        const count = await getUnreadNotificationsCount(user.id.toString());
        setNotificationsCount(count);
      } catch (error) {
        console.error('Error fetching notifications count:', error);
      }
    };
    
    fetchNotificationsCount();
    
    // Set interval to check for new notifications
    const interval = setInterval(fetchNotificationsCount, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [user]);
  
  // Combine provided badge counts with notifications count
  const combinedBadgeCounts = {
    ...badgeCounts,
    expenses: (badgeCounts.expenses || 0) + notificationsCount,
  };

  // Animation for the active indicator
  const indicatorVariants = {
    initial: { 
      opacity: 0, 
      width: 0,
    },
    animate: { 
      opacity: 1, 
      width: '50%', 
      transition: { type: 'spring', stiffness: 400, damping: 30 } 
    },
    exit: { 
      opacity: 0, 
      width: 0, 
      transition: { duration: 0.2 } 
    }
  };

  // Animation for icons
  const iconVariants = {
    initial: { y: 0 },
    hover: { y: -3, transition: { type: 'spring', stiffness: 400, damping: 15 } },
    tap: { y: 2, scale: 0.95, transition: { duration: 0.1 } },
    selected: { scale: 1.1, y: -3, transition: { type: 'spring', stiffness: 400, damping: 15 } }
  };

  return (
    <Paper 
      sx={{ 
        position: 'fixed', 
        bottom: 0, 
        left: 0, 
        right: 0, 
        zIndex: 1000,
        borderRadius: '20px 20px 0 0',
        boxShadow: '0px -2px 14px rgba(0, 0, 0, 0.12)',
        overflow: 'hidden',
        backdropFilter: 'blur(10px)',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
      }} 
      elevation={0}
    >
      <BottomNavigation
        value={path}
        onChange={(event, newValue) => {
          navigate(newValue);
        }}
        showLabels
        sx={{ 
          height: '68px',
          background: 'transparent',
          '& .MuiBottomNavigationAction-root': {
            minWidth: 'auto',
            padding: '8px 0 12px',
            transition: 'all 0.25s ease',
            '&.Mui-selected': {
              color: theme.palette.primary.main,
              paddingTop: '6px'
            }
          },
          '& .MuiBottomNavigationAction-label': {
            fontSize: '0.7rem',
            opacity: 0.7,
            '&.Mui-selected': {
              opacity: 1,
              fontSize: '0.75rem',
              fontWeight: 500
            }
          }
        }}
      >
        <BottomNavigationAction 
          value="/" 
          icon={
            <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', height: 28 }}>
              <motion.div
                variants={iconVariants}
                initial="initial"
                whileHover="hover"
                whileTap="tap"
                animate={path === '/' ? 'selected' : 'initial'}
              >
                <Badge 
                  color="error" 
                  badgeContent={badgeCounts.dashboard || 0} 
                  invisible={!badgeCounts.dashboard}
                  sx={{ '& .MuiBadge-badge': { fontSize: '0.65rem', minWidth: 16, height: 16, padding: 0 } }}
                >
                  <HomeIcon />
                </Badge>
              </motion.div>
              <AnimatePresence>
                {path === '/' && (
                  <motion.div
                    variants={indicatorVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    style={{
                      position: 'absolute',
                      bottom: -12,
                      height: 3,
                      borderRadius: '3px',
                      backgroundColor: theme.palette.primary.main
                    }}
                  />
                )}
              </AnimatePresence>
            </Box>
          } 
          label="Главная" 
        />
        <BottomNavigationAction 
          value="/groups" 
          icon={
            <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', height: 28 }}>
              <motion.div
                variants={iconVariants}
                initial="initial"
                whileHover="hover"
                whileTap="tap"
                animate={path === '/groups' ? 'selected' : 'initial'}
              >
                <Badge 
                  color="error" 
                  badgeContent={badgeCounts.groups || 0} 
                  invisible={!badgeCounts.groups}
                  sx={{ '& .MuiBadge-badge': { fontSize: '0.65rem', minWidth: 16, height: 16, padding: 0 } }}
                >
                  <GroupIcon />
                </Badge>
              </motion.div>
              <AnimatePresence>
                {path === '/groups' && (
                  <motion.div
                    variants={indicatorVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    style={{
                      position: 'absolute',
                      bottom: -12,
                      height: 3,
                      borderRadius: '3px',
                      backgroundColor: theme.palette.primary.main
                    }}
                  />
                )}
              </AnimatePresence>
            </Box>
          } 
          label="Группы" 
        />
        <BottomNavigationAction 
          value="/expenses" 
          icon={
            <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', height: 28 }}>
              <motion.div
                variants={iconVariants}
                initial="initial"
                whileHover="hover"
                whileTap="tap"
                animate={path === '/expenses' ? 'selected' : 'initial'}
              >
                <Badge 
                  color="error" 
                  badgeContent={combinedBadgeCounts.expenses || 0} 
                  invisible={!combinedBadgeCounts.expenses}
                  sx={{ '& .MuiBadge-badge': { fontSize: '0.65rem', minWidth: 16, height: 16, padding: 0 } }}
                >
                  <PaymentsIcon />
                </Badge>
              </motion.div>
              <AnimatePresence>
                {path === '/expenses' && (
                  <motion.div
                    variants={indicatorVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    style={{
                      position: 'absolute',
                      bottom: -12,
                      height: 3,
                      borderRadius: '3px',
                      backgroundColor: theme.palette.primary.main
                    }}
                  />
                )}
              </AnimatePresence>
            </Box>
          } 
          label="Расходы" 
        />
        <BottomNavigationAction 
          value="/incomes" 
          icon={
            <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', height: 28 }}>
              <motion.div
                variants={iconVariants}
                initial="initial"
                whileHover="hover"
                whileTap="tap"
                animate={path === '/incomes' ? 'selected' : 'initial'}
              >
                <Badge 
                  color="error" 
                  badgeContent={badgeCounts.incomes || 0} 
                  invisible={!badgeCounts.incomes}
                  sx={{ '& .MuiBadge-badge': { fontSize: '0.65rem', minWidth: 16, height: 16, padding: 0 } }}
                >
                  <SavingsIcon />
                </Badge>
              </motion.div>
              <AnimatePresence>
                {path === '/incomes' && (
                  <motion.div
                    variants={indicatorVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    style={{
                      position: 'absolute',
                      bottom: -12,
                      height: 3,
                      borderRadius: '3px',
                      backgroundColor: theme.palette.primary.main
                    }}
                  />
                )}
              </AnimatePresence>
            </Box>
          } 
          label="Доходы" 
        />
        <BottomNavigationAction 
          value="/analytics" 
          icon={
            <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', height: 28 }}>
              <motion.div
                variants={iconVariants}
                initial="initial"
                whileHover="hover"
                whileTap="tap"
                animate={path === '/analytics' ? 'selected' : 'initial'}
              >
                <Badge 
                  color="error" 
                  badgeContent={badgeCounts.analytics || 0} 
                  invisible={!badgeCounts.analytics}
                  sx={{ '& .MuiBadge-badge': { fontSize: '0.65rem', minWidth: 16, height: 16, padding: 0 } }}
                >
                  <AnalyticsIcon />
                </Badge>
              </motion.div>
              <AnimatePresence>
                {path === '/analytics' && (
                  <motion.div
                    variants={indicatorVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    style={{
                      position: 'absolute',
                      bottom: -12,
                      height: 3,
                      borderRadius: '3px',
                      backgroundColor: theme.palette.primary.main
                    }}
                  />
                )}
              </AnimatePresence>
            </Box>
          } 
          label="Аналитика" 
        />
      </BottomNavigation>
    </Paper>
  );
};

export default BottomNav; 