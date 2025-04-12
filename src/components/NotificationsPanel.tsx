import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Badge,
  Popover,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button,
  Divider,
  Tooltip,
  useTheme,
  CircularProgress,
  alpha,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  MarkEmailRead as MarkReadIcon,
  PaymentRounded as PaymentIcon,
  Receipt as ReceiptIcon,
  Group as GroupIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTelegramApp } from '../hooks/useTelegramApp';
import { Notification, getUserNotifications, markAllNotificationsAsRead, markNotificationAsRead, getUnreadNotificationsCount } from '../services/notifications';

const NotificationsPanel: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user, showAlert } = useTelegramApp();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  
  const handleOpenNotifications = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
    fetchNotifications();
  };
  
  const handleCloseNotifications = () => {
    setAnchorEl(null);
  };
  
  const fetchNotifications = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const userNotifications = await getUserNotifications(user.id.toString());
      setNotifications(userNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      showAlert('Ошибка при загрузке уведомлений');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchUnreadCount = async () => {
    if (!user?.id) return;
    
    try {
      const count = await getUnreadNotificationsCount(user.id.toString());
      setUnreadCount(count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };
  
  const handleMarkAllAsRead = async () => {
    if (!user?.id) return;
    
    try {
      await markAllNotificationsAsRead(user.id.toString());
      
      // Update local state
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => ({
          ...notification,
          isRead: true
        }))
      );
      
      setUnreadCount(0);
      showAlert('Все уведомления отмечены как прочитанные');
    } catch (error) {
      console.error('Error marking all as read:', error);
      showAlert('Ошибка при обновлении уведомлений');
    }
  };
  
  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
      
      // Update local state
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => 
          notification.id === notificationId 
            ? { ...notification, isRead: true } 
            : notification
        )
      );
      
      if (unreadCount > 0) {
        setUnreadCount(unreadCount - 1);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      showAlert('Ошибка при обновлении уведомления');
    }
  };
  
  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (!notification.isRead) {
      await handleMarkAsRead(notification.id);
    }
    
    // Navigate based on notification type
    switch (notification.type) {
      case 'expense':
        if (notification.data.groupId) {
          navigate(`/expenses?groupId=${notification.data.groupId}`);
        }
        break;
      case 'payment':
        if (notification.data.groupId) {
          navigate(`/expenses?groupId=${notification.data.groupId}`);
        }
        break;
      case 'debt':
        if (notification.data.groupId) {
          navigate(`/expenses?groupId=${notification.data.groupId}`);
        }
        break;
      case 'invitation':
        navigate('/groups');
        break;
      default:
        // Do nothing for unknown types
        break;
    }
    
    handleCloseNotifications();
  };
  
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'expense':
        return <ReceiptIcon color="primary" />;
      case 'payment':
        return <PaymentIcon color="success" />;
      case 'debt':
        return <PaymentIcon color="error" />;
      case 'invitation':
        return <GroupIcon color="info" />;
      default:
        return <InfoIcon color="action" />;
    }
  };
  
  // Fetch notifications on component mount and when user changes
  useEffect(() => {
    if (user?.id) {
      fetchUnreadCount();
    }
    
    // Set up polling for unread count
    const interval = setInterval(() => {
      if (user?.id) {
        fetchUnreadCount();
      }
    }, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, [user]);
  
  const open = Boolean(anchorEl);
  const id = open ? 'notifications-popover' : undefined;
  
  return (
    <>
      <Tooltip title="Уведомления">
        <IconButton
          aria-describedby={id}
          onClick={handleOpenNotifications}
          sx={{
            position: 'relative',
            transition: 'all 0.2s'
          }}
          component={motion.button}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <Badge badgeContent={unreadCount} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>
      </Tooltip>
      
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleCloseNotifications}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            width: 350,
            maxHeight: 450,
            borderRadius: 2,
            boxShadow: theme.shadows[10],
            overflow: 'hidden'
          }
        }}
      >
        <Box sx={{ p: 2, bgcolor: theme.palette.primary.main, color: 'white' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Уведомления</Typography>
            
            <Tooltip title="Отметить все как прочитанные">
              <span>
                <IconButton
                  size="small"
                  onClick={handleMarkAllAsRead}
                  disabled={unreadCount === 0 || loading}
                  sx={{ color: 'white' }}
                >
                  <MarkReadIcon />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        </Box>
        
        <Divider />
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress size={40} />
          </Box>
        ) : notifications.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="textSecondary">У вас нет уведомлений</Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {notifications.map((notification) => (
              <ListItem
                key={notification.id}
                button
                onClick={() => handleNotificationClick(notification)}
                sx={{
                  backgroundColor: !notification.isRead 
                    ? alpha(theme.palette.primary.light, 0.1)
                    : 'transparent',
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.light, 0.15)
                  }
                }}
                component={motion.li}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
              >
                <ListItemIcon>
                  {getNotificationIcon(notification.type)}
                </ListItemIcon>
                <ListItemText
                  primary={notification.title}
                  secondary={notification.message}
                  primaryTypographyProps={{
                    variant: 'body1',
                    fontWeight: !notification.isRead ? 600 : 400
                  }}
                  secondaryTypographyProps={{
                    variant: 'body2',
                    noWrap: false,
                    sx: { 
                      whiteSpace: 'normal',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical'
                    }
                  }}
                />
              </ListItem>
            ))}
          </List>
        )}
        
        <Divider />
        
        <Box sx={{ p: 1.5, display: 'flex', justifyContent: 'center' }}>
          <Button
            size="small"
            color="primary"
            onClick={() => {
              handleCloseNotifications();
              // You could navigate to a notifications page here if needed
            }}
          >
            Все уведомления
          </Button>
        </Box>
      </Popover>
    </>
  );
};

export default NotificationsPanel; 