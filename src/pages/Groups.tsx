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
  Avatar,
  Divider,
  Chip,
  useTheme,
  Container,
  Fab,
  Tooltip,
  InputAdornment,
  alpha,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Group as GroupIcon,
  ContentCopy as CopyIcon,
  Delete as DeleteIcon,
  PersonAdd as PersonAddIcon,
  ArrowBack as ArrowBackIcon,
  Share as ShareIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTelegramApp } from '../hooks/useTelegramApp';
import { 
  createGroup, 
  getGroups, 
  getGroupByInviteCode, 
  joinGroup, 
  deleteGroup, 
  Group, 
  getUser 
} from '../services/firebase';
import LoadingIndicator from '../components/LoadingIndicator';

const randomMemberNames = [
  'Алексей', 'Мария', 'Иван', 'Екатерина', 'Дмитрий', 'Анна', 'Сергей', 'Ольга',
  'Андрей', 'Наталья', 'Владимир', 'Елена', 'Михаил', 'Татьяна', 'Александр'
];

const getMemberName = (memberId: string | undefined) => {
  // Handle undefined or invalid memberId
  if (!memberId || typeof memberId !== 'string') return 'Гость';
  
  // In a real app, you would fetch user data from your database
  if (memberId === '123456') return 'Вы';
  
  // Return a random name for demo purposes
  const index = parseInt(memberId) % randomMemberNames.length;
  return randomMemberNames[index] || 'Участник'; // Fallback if randomMemberNames[index] is undefined
};

// Generate random avatar color
const getAvatarColor = (name: string) => {
  const colors = [
    '#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5', 
    '#2196F3', '#03A9F4', '#00BCD4', '#009688', '#4CAF50', 
    '#8BC34A', '#CDDC39', '#FFC107', '#FF9800', '#FF5722'
  ];
  
  // Handle undefined or empty name
  if (!name || name.length === 0) {
    return colors[0]; // Default to first color
  }
  
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
};

const Groups: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user, isAuthenticating, showAlert, showConfirm } = useTelegramApp();
  
  const [groups, setGroups] = useState<Group[]>([]);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openJoinDialog, setOpenJoinDialog] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shareCode, setShareCode] = useState('');

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
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
        damping: 20,
      },
    },
    hover: {
      scale: 1.02,
      boxShadow: '0px 5px 15px rgba(0, 0, 0, 0.1)',
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 15,
      }
    },
    tap: {
      scale: 0.98,
      transition: {
        type: 'spring',
        stiffness: 500,
        damping: 15,
      }
    }
  };

  const fabVariants = {
    initial: { scale: 0, opacity: 0 },
    animate: { 
      scale: 1, 
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 15,
        delay: 0.2
      }
    },
    hover: {
      scale: 1.1,
      boxShadow: '0px 6px 15px rgba(0, 0, 0, 0.2)',
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 10,
      }
    },
    tap: {
      scale: 0.9,
      transition: {
        type: 'spring',
        stiffness: 600,
        damping: 15,
      }
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
        setLoading(false);
      } catch (error) {
        console.error('Error fetching groups:', error);
        
        // For development purposes, use mock data if there's an error
        if (process.env.NODE_ENV !== 'production' && user) {
          console.warn('Using mock groups data due to Firestore error');
          const mockGroups: Group[] = [
            {
              id: '1',
              name: 'Семья',
              inviteCode: 'FAMILY1',
              members: [user.id.toString(), '789012', '345678'],
              createdAt: new Date() as any,
              createdBy: user.id.toString()
            },
            {
              id: '2',
              name: 'Друзья',
              inviteCode: 'FRIEND1',
              members: [user.id.toString(), '234567'],
              createdAt: new Date() as any,
              createdBy: user.id.toString()
            }
          ];
          
          setGroups(mockGroups);
        }
        
        showAlert('Ошибка при загрузке групп');
        setLoading(false);
      }
    }
    
    if (!isAuthenticating) {
      fetchGroups();
    }
  }, [user, showAlert, isAuthenticating]);

  // If still authenticating, show loading indicator
  if (isAuthenticating) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <LoadingIndicator message="Авторизация..." fullHeight />
      </Container>
    );
  }

  // If no user found, show error message
  if (!user) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <Typography variant="h6" color="error" gutterBottom>
            Ошибка: пользователь не авторизован
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => window.location.reload()}
            sx={{ mt: 2 }}
          >
            Обновить страницу
          </Button>
        </Box>
      </Container>
    );
  }

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      showAlert('Пожалуйста, введите название группы');
      return;
    }

    if (!user) {
      showAlert('Ошибка: пользователь не авторизован');
      return;
    }

    setIsSubmitting(true);
    try {
      // Generate a random invite code
      const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      const newGroup = await createGroup({
        name: newGroupName,
        inviteCode: randomCode,
        members: [user.id.toString()],
        createdBy: user.id.toString(),
        createdAt: new Date() as any // Will be overridden by serverTimestamp()
      });
      
      setGroups([...groups, newGroup]);
      setOpenCreateDialog(false);
      setNewGroupName('');
      
      // Show share dialog
      setShareCode(randomCode);
    } catch (error) {
      console.error('Error creating group:', error);
      
      // For development, create a mock group if there's an error
      if (process.env.NODE_ENV !== 'production' && user) {
        console.warn('Creating mock group due to Firestore error');
        const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        
        const mockGroup: Group = {
          id: Date.now().toString(),
          name: newGroupName,
          inviteCode: randomCode,
          members: [user.id.toString()],
          createdBy: user.id.toString(),
          createdAt: new Date() as any
        };
        
        setGroups([...groups, mockGroup]);
        setOpenCreateDialog(false);
        setNewGroupName('');
        
        // Show share dialog
        setShareCode(randomCode);
        return;
      }
      
      showAlert('Ошибка при создании группы');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinGroup = async () => {
    if (!inviteCode.trim()) {
      showAlert('Пожалуйста, введите код приглашения');
      return;
    }

    if (!user) {
      showAlert('Ошибка: пользователь не авторизован');
      return;
    }

    setIsSubmitting(true);
    try {
      const group = await getGroupByInviteCode(inviteCode);
      
      if (!group) {
        showAlert('Группа с таким кодом не найдена');
        setIsSubmitting(false);
        setOpenJoinDialog(false);
        return;
      }
      
      if (group.members.includes(user.id.toString())) {
        showAlert('Вы уже состоите в этой группе');
        setIsSubmitting(false);
        setOpenJoinDialog(false);
        return;
      }
      
      await joinGroup(group.id, user.id.toString());
      
      // Add the group to the local state
      const updatedGroup = {
        ...group,
        members: [...group.members, user.id.toString()]
      };
      
      setGroups([...groups, updatedGroup]);
      setOpenJoinDialog(false);
      setInviteCode('');
      showAlert(`Вы присоединились к группе "${group.name}"`);
    } catch (error) {
      console.error('Error joining group:', error);
      
      // For development, create a mock join if there's an error
      if (process.env.NODE_ENV !== 'production' && user) {
        console.warn('Joining mock group due to Firestore error');
        
        // Create a mock group with the invite code
        const mockGroup: Group = {
          id: Date.now().toString(),
          name: `Группа ${inviteCode}`,
          inviteCode: inviteCode,
          members: [user.id.toString()],
          createdBy: 'unknown',
          createdAt: new Date() as any
        };
        
        setGroups([...groups, mockGroup]);
        setOpenJoinDialog(false);
        setInviteCode('');
        showAlert(`Вы присоединились к группе "${mockGroup.name}"`);
        setIsSubmitting(false);
        return;
      }
      
      showAlert('Ошибка при присоединении к группе');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    const confirmed = await showConfirm('Вы уверены, что хотите удалить эту группу?');
    
    if (confirmed) {
      try {
        await deleteGroup(groupId);
        setGroups(groups.filter(group => group.id !== groupId));
        showAlert('Группа удалена');
      } catch (error) {
        console.error('Error deleting group:', error);
        showAlert('Ошибка при удалении группы');
      }
    }
  };

  const copyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code);
    showAlert('Код приглашения скопирован');
  };

  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <LoadingIndicator message="Загрузка групп..." fullHeight />
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 4, pb: 8 }}>
      <Box sx={{ position: 'relative', minHeight: '100vh', pt: 2, pb: 10 }}>
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <Box 
            sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              mb: 3,
              px: 1 
            }}
          >
            <IconButton 
              onClick={() => navigate('/')}
              sx={{ 
                color: theme.palette.primary.main,
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                mr: 1.5
              }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography 
              variant="h5" 
              sx={{ 
                fontWeight: 'bold',
                flexGrow: 1 
              }}
            >
              Мои группы
            </Typography>
          </Box>

          {groups.length === 0 ? (
            <Card 
              sx={{ 
                p: 4, 
                textAlign: 'center',
                borderRadius: 4,
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                backgroundColor: alpha(theme.palette.background.paper, 0.7),
                backdropFilter: 'blur(10px)'
              }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <Avatar 
                  sx={{ 
                    width: 80, 
                    height: 80, 
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.primary.main,
                    mx: 'auto',
                    mb: 2
                  }}
                >
                  <GroupIcon sx={{ fontSize: 40 }} />
                </Avatar>
              </motion.div>
              <Typography variant="h6" gutterBottom>
                У вас пока нет групп
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Создайте новую группу или присоединитесь к существующей
              </Typography>
              <Button
                variant="contained"
                size="large"
                startIcon={<AddIcon />}
                onClick={() => setOpenCreateDialog(true)}
                sx={{ 
                  borderRadius: 8,
                  px: 3,
                  backgroundImage: 'linear-gradient(90deg, #0088cc, #2AABEE)'
                }}
              >
                Создать группу
              </Button>
            </Card>
          ) : (
            <motion.div variants={containerVariants}>
              {groups.map((group) => (
                <motion.div 
                  key={group.id} 
                  variants={itemVariants}
                  whileHover="hover"
                  whileTap="tap"
                >
                  <Card 
                    sx={{ 
                      mb: 2.5, 
                      borderRadius: 3,
                      overflow: 'visible',
                      backgroundColor: alpha(theme.palette.background.paper, 0.7),
                      backdropFilter: 'blur(10px)',
                      transition: 'all 0.3s ease',
                      border: '1px solid',
                      borderColor: alpha('#000', 0.04)
                    }}
                  >
                    <CardContent sx={{ p: 2.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar 
                            sx={{ 
                              bgcolor: getAvatarColor(group.name),
                              width: 48,
                              height: 48,
                              mr: 2
                            }}
                          >
                            {group.name && group.name.charAt(0).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography variant="h6" fontWeight="600">
                              {group.name}
                            </Typography>
                            <Box 
                              sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                mt: 0.5 
                              }}
                            >
                              <Chip 
                                icon={<PersonIcon fontSize="small" />}
                                label={`${group.members.length} участников`} 
                                size="small" 
                                sx={{ 
                                  mr: 1,
                                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                                  color: theme.palette.primary.main,
                                  fontWeight: 500,
                                  '& .MuiChip-icon': {
                                    color: theme.palette.primary.main
                                  }
                                }}
                              />
                            </Box>
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex' }}>
                          <IconButton 
                            color="primary" 
                            onClick={() => copyInviteCode(group.inviteCode)}
                            sx={{ 
                              mr: 1,
                              bgcolor: alpha(theme.palette.primary.main, 0.1),
                            }}
                          >
                            <CopyIcon fontSize="small" />
                          </IconButton>
                          <IconButton 
                            color="error" 
                            onClick={() => handleDeleteGroup(group.id)}
                            sx={{ 
                              bgcolor: alpha(theme.palette.error.main, 0.1),
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                      
                      <Box 
                        sx={{ 
                          bgcolor: alpha(theme.palette.background.default, 0.5),
                          borderRadius: 1.5,
                          px: 2,
                          py: 1,
                          mt: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <Typography variant="body2" fontWeight={500}>
                          Код: <span style={{ fontWeight: 'bold' }}>{group.inviteCode}</span>
                        </Typography>
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => setShareCode(group.inviteCode)}
                        >
                          <ShareIcon fontSize="small" />
                        </IconButton>
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 2, mb: 1 }}>
                        Участники:
                      </Typography>
                      
                      <Box 
                        sx={{ 
                          display: 'flex', 
                          flexWrap: 'wrap',
                          gap: 1
                        }}
                      >
                        {group.members.map((member, index) => (
                          <Chip
                            key={index}
                            avatar={
                              <Avatar 
                                sx={{ 
                                  bgcolor: member === user?.id?.toString() 
                                    ? theme.palette.primary.main 
                                    : getAvatarColor(getMemberName(member))
                                }}
                              >
                                {getMemberName(member) ? getMemberName(member).charAt(0) : '?'}
                              </Avatar>
                            }
                            label={getMemberName(member)}
                            size="small"
                            variant="outlined"
                            sx={{ 
                              borderColor: 'transparent',
                              bgcolor: alpha(theme.palette.background.default, 0.8)
                            }}
                          />
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
        </motion.div>
        
        {/* Floating Action Buttons */}
        <Box
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
          }}
        >
          {/* Join Group Button */}
          <motion.div
            variants={fabVariants}
            initial="initial"
            animate="animate"
            whileHover="hover"
            whileTap="tap"
          >
            <Tooltip title="Присоединиться к группе" placement="left">
              <Fab
                size="medium"
                color="secondary"
                aria-label="join"
                onClick={() => setOpenJoinDialog(true)}
                sx={{
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                }}
              >
                <PersonAddIcon />
              </Fab>
            </Tooltip>
          </motion.div>
          
          {/* Create Group Button */}
          <motion.div
            variants={fabVariants}
            initial="initial"
            animate="animate"
            whileHover="hover"
            whileTap="tap"
          >
            <Fab
              color="primary"
              aria-label="add"
              onClick={() => setOpenCreateDialog(true)}
              sx={{
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                backgroundImage: 'linear-gradient(45deg, #0088cc, #2AABEE)',
              }}
            >
              <AddIcon />
            </Fab>
          </motion.div>
        </Box>
      </Box>

      {/* Create Group Dialog */}
      <Dialog 
        open={openCreateDialog} 
        onClose={() => !isSubmitting && setOpenCreateDialog(false)}
        PaperProps={{
          sx: {
            borderRadius: 4,
            px: 1
          }
        }}
      >
        <DialogTitle>Создать новую группу</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Название группы"
            fullWidth
            variant="outlined"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            disabled={isSubmitting}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ pb: 2, px: 3 }}>
          <Button 
            onClick={() => setOpenCreateDialog(false)} 
            disabled={isSubmitting}
            sx={{ borderRadius: 2 }}
          >
            Отмена
          </Button>
          <Button 
            onClick={handleCreateGroup} 
            variant="contained" 
            disabled={isSubmitting}
            startIcon={isSubmitting && (
              <Box sx={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }}/>
            )}
            sx={{ borderRadius: 2 }}
          >
            {isSubmitting ? 'Создание...' : 'Создать'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Join Group Dialog */}
      <Dialog 
        open={openJoinDialog} 
        onClose={() => !isSubmitting && setOpenJoinDialog(false)}
        PaperProps={{
          sx: {
            borderRadius: 4,
            px: 1
          }
        }}
      >
        <DialogTitle>Присоединиться к группе</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Код приглашения"
            fullWidth
            variant="outlined"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            disabled={isSubmitting}
            sx={{ mt: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <GroupIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
            }}
          />
        </DialogContent>
        <DialogActions sx={{ pb: 2, px: 3 }}>
          <Button 
            onClick={() => setOpenJoinDialog(false)} 
            disabled={isSubmitting}
            sx={{ borderRadius: 2 }}
          >
            Отмена
          </Button>
          <Button 
            onClick={handleJoinGroup} 
            variant="contained" 
            disabled={isSubmitting}
            startIcon={isSubmitting && (
              <Box sx={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }}/>
            )}
            sx={{ borderRadius: 2 }}
          >
            {isSubmitting ? 'Присоединение...' : 'Присоединиться'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Share Code Dialog */}
      <Dialog 
        open={!!shareCode} 
        onClose={() => setShareCode('')}
        PaperProps={{
          sx: {
            borderRadius: 4,
            px: 1
          }
        }}
      >
        <DialogTitle>Пригласить участников</DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: theme.palette.primary.main,
                  margin: '0 auto',
                  mb: 2,
                }}
              >
                <ShareIcon sx={{ fontSize: 40 }} />
              </Avatar>
            </motion.div>
            
            <Typography variant="body1" sx={{ mb: 3 }}>
              Поделитесь этим кодом с другими участниками группы:
            </Typography>
            
            <Box 
              sx={{ 
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                borderRadius: 2,
                py: 2,
                px: 3,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                mb: 2
              }}
            >
              <Typography 
                variant="h4" 
                fontWeight="bold"
                color="primary"
                letterSpacing={1}
              >
                {shareCode}
              </Typography>
            </Box>
            
            <Button
              variant="outlined"
              startIcon={<CopyIcon />}
              onClick={() => copyInviteCode(shareCode)}
              sx={{ mt: 1, borderRadius: 2 }}
            >
              Копировать код
            </Button>
          </Box>
        </DialogContent>
        <DialogActions sx={{ pb: 2, px: 3 }}>
          <Button 
            onClick={() => setShareCode('')}
            variant="contained"
            sx={{ borderRadius: 2 }}
          >
            Готово
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Groups;
