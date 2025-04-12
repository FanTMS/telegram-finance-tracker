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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  Chip,
  Avatar,
  Grid,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Checkbox,
  ListItem,
  ListItemText,
  List,
  ListItemSecondaryAction,
  Divider,
  Tooltip,
  Paper,
  alpha,
  FormControlLabel
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import GroupIcon from '@mui/icons-material/Group';
import { motion, AnimatePresence } from 'framer-motion';
import { useTelegramApp } from '../hooks/useTelegramApp';
import LoadingIndicator from '../components/LoadingIndicator';
import { Timestamp } from 'firebase/firestore';
import { 
  Group, 
  ShoppingList, 
  ShoppingItem, 
  createShoppingList,
  getShoppingLists,
  updateShoppingList,
  deleteShoppingList,
  addShoppingItem,
  updateShoppingItem,
  deleteShoppingItem,
  getGroups,
  getUser
} from '../services/firebase';

const Purchases: React.FC = () => {
  const { user, isAuthenticating, showAlert, showConfirm } = useTelegramApp();
  const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  
  // Dialog states
  const [openListDialog, setOpenListDialog] = useState(false);
  const [openItemDialog, setOpenItemDialog] = useState(false);
  const [listTitle, setListTitle] = useState('');
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [hasPriceEstimate, setHasPriceEstimate] = useState(true);
  const [itemQuantity, setItemQuantity] = useState('');
  const [hasQuantity, setHasQuantity] = useState(false);
  const [itemPurchaseDate, setItemPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [hasPurchaseDate, setHasPurchaseDate] = useState(false);
  const [editingList, setEditingList] = useState<ShoppingList | null>(null);
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);
  const [currentListId, setCurrentListId] = useState<string>('');

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
  };

  // Add a state for users
  const [usersCache, setUsersCache] = useState<{[key: string]: {name: string}}>({}); 

  // Add a function to get the user's name
  const getUserName = (userId: string): string => {
    // Return cached user name if available
    if (usersCache[userId]) {
      return usersCache[userId].name;
    }
    
    // If it's the current user
    if (user && userId === user.id.toString()) {
      return "Вы";
    }
    
    // Fetch user data
    getUser(userId).then(userData => {
      if (userData) {
        setUsersCache(prev => ({
          ...prev,
          [userId]: { name: userData.name }
        }));
      }
    }).catch(error => {
      console.error('Error fetching user:', error);
    });
    
    // Return a placeholder while loading
    return "Участник";
  };

  // Fetch user's groups from Firebase
  useEffect(() => {
    if (isAuthenticating || !user?.id) return;

    const fetchGroups = async () => {
      try {
        const fetchedGroups = await getGroups(user.id.toString());
        
        setGroups(fetchedGroups);
        
        if (fetchedGroups.length > 0 && !selectedGroupId) {
          setSelectedGroupId(fetchedGroups[0].id);
        }
        
      } catch (error) {
        console.error('Error fetching groups:', error);
        showAlert('Ошибка при загрузке групп');
        
        // Mock data for development
        if (process.env.NODE_ENV !== 'production') {
          const mockGroups: Group[] = [
            {
              id: '1',
              name: 'Семья',
              members: [user.id.toString(), '789012', '345678'],
              inviteCode: 'FAMILY1',
              createdAt: Timestamp.now(),
              createdBy: user.id.toString()
            },
            {
              id: '2',
              name: 'Друзья',
              members: [user.id.toString(), '234567'],
              inviteCode: 'FRIEND1',
              createdAt: Timestamp.now(),
              createdBy: user.id.toString()
            }
          ];
          
          setGroups(mockGroups);
          if (!selectedGroupId) {
            setSelectedGroupId(mockGroups[0].id);
          }
        }
      }
    };
    
    fetchGroups();
  }, [user, isAuthenticating, showAlert]);

  // Fetch shopping lists when selectedGroupId changes
  useEffect(() => {
    if (!selectedGroupId || !user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const fetchShoppingLists = async () => {
      try {
        const lists = await getShoppingLists(selectedGroupId);
        setShoppingLists(lists);
      } catch (error) {
        console.error('Error fetching shopping lists:', error);
        showAlert('Ошибка при загрузке списков покупок');
        
        // Mock data for development
        if (process.env.NODE_ENV !== 'production') {
          const now = Timestamp.now();
          const mockLists: ShoppingList[] = [
            {
              id: '1',
              title: 'Продукты на неделю',
              groupId: selectedGroupId,
              items: [
                {
                  id: '1',
                  name: 'Молоко',
                  estimatedPrice: 89,
                  completed: false,
                  createdBy: user.id.toString(),
                  createdAt: now
                },
                {
                  id: '2',
                  name: 'Хлеб',
                  estimatedPrice: 55,
                  completed: true,
                  createdBy: user.id.toString(),
                  createdAt: now
                }
              ],
              createdBy: user.id.toString(),
              createdAt: now
            },
            {
              id: '2',
              title: 'Для ремонта',
              groupId: selectedGroupId,
              items: [
                {
                  id: '3',
                  name: 'Краска',
                  estimatedPrice: 1200,
                  completed: false,
                  createdBy: user.id.toString(),
                  createdAt: now
                }
              ],
              createdBy: user.id.toString(),
              createdAt: now
            }
          ];
          
          setShoppingLists(mockLists);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchShoppingLists();
  }, [selectedGroupId, user, showAlert]);

  // Handle group selection change
  const handleGroupChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setSelectedGroupId(event.target.value as string);
  };

  // Handle opening list dialog
  const handleOpenListDialog = (list: ShoppingList | null = null) => {
    if (list) {
      setEditingList(list);
      setListTitle(list.title);
    } else {
      setEditingList(null);
      setListTitle('');
    }
    setOpenListDialog(true);
  };

  // Handle closing list dialog
  const handleCloseListDialog = () => {
    setOpenListDialog(false);
  };

  // Handle save list
  const handleSaveList = async () => {
    if (!listTitle || !selectedGroupId || !user?.id) return;

    try {
      if (editingList) {
        // Update existing list
        await updateShoppingList(editingList.id, { title: listTitle });
      } else {
        // Add new list
        await createShoppingList({
          title: listTitle,
          groupId: selectedGroupId,
          items: [],
          createdBy: user.id.toString(),
          createdAt: Timestamp.now()
        });
      }
      
      // Refresh the list
      const updatedLists = await getShoppingLists(selectedGroupId);
      setShoppingLists(updatedLists);
      
      handleCloseListDialog();
    } catch (error) {
      console.error('Error saving shopping list:', error);
      showAlert('Ошибка при сохранении списка покупок');
    }
  };

  // Handle delete list
  const handleDeleteList = async (listId: string) => {
    const confirmed = await showConfirm('Вы уверены, что хотите удалить этот список покупок?');
    if (!confirmed) return;

    try {
      await deleteShoppingList(listId);
      
      // Update the state
      setShoppingLists(prevLists => prevLists.filter(list => list.id !== listId));
    } catch (error) {
      console.error('Error deleting shopping list:', error);
      showAlert('Ошибка при удалении списка покупок');
    }
  };

  // Handle opening item dialog
  const handleOpenItemDialog = (listId: string, item: ShoppingItem | null = null) => {
    setCurrentListId(listId);
    
    if (item) {
      setEditingItem(item);
      setItemName(item.name);
      setHasPriceEstimate(item.hasPriceEstimate);
      setItemPrice(item.estimatedPrice.toString());
      setHasQuantity(item.hasQuantity);
      setItemQuantity(item.quantity?.toString() || '');
      setHasPurchaseDate(item.hasPurchaseDate);
      setItemPurchaseDate(item.purchaseDate ? item.purchaseDate.toDate().toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    } else {
      setEditingItem(null);
      setItemName('');
      setHasPriceEstimate(true);
      setItemPrice('');
      setHasQuantity(false);
      setItemQuantity('');
      setHasPurchaseDate(false);
      setItemPurchaseDate(new Date().toISOString().split('T')[0]);
    }
    
    setOpenItemDialog(true);
  };

  // Handle closing item dialog
  const handleCloseItemDialog = () => {
    setOpenItemDialog(false);
  };

  // Handle save item
  const handleSaveItem = async () => {
    if (!itemName || !currentListId || !user?.id) return;

    try {
      const listToUpdate = shoppingLists.find(list => list.id === currentListId);
      
      if (!listToUpdate) return;
      
      if (editingItem) {
        // Update existing item
        await updateShoppingItem(
          currentListId,
          editingItem.id,
          { 
            name: itemName, 
            hasPriceEstimate: hasPriceEstimate,
            estimatedPrice: hasPriceEstimate ? (Number(itemPrice) || 0) : 0,
            hasQuantity: hasQuantity,
            quantity: hasQuantity ? (Number(itemQuantity) || undefined) : undefined,
            hasPurchaseDate: hasPurchaseDate,
            purchaseDate: hasPurchaseDate ? Timestamp.fromDate(new Date(itemPurchaseDate)) : undefined,
            updatedBy: user.id.toString() 
          },
          listToUpdate.items
        );
      } else {
        // Add new item
        await addShoppingItem(
          currentListId,
          {
            name: itemName,
            hasPriceEstimate: hasPriceEstimate,
            estimatedPrice: hasPriceEstimate ? (Number(itemPrice) || 0) : 0,
            hasQuantity: hasQuantity,
            quantity: hasQuantity ? (Number(itemQuantity) || undefined) : undefined,
            hasPurchaseDate: hasPurchaseDate,
            purchaseDate: hasPurchaseDate ? Timestamp.fromDate(new Date(itemPurchaseDate)) : undefined,
            completed: false,
            createdBy: user.id.toString(),
          },
          listToUpdate.items
        );
      }
      
      // Refresh the list
      const updatedLists = await getShoppingLists(selectedGroupId);
      setShoppingLists(updatedLists);
      
      handleCloseItemDialog();
    } catch (error) {
      console.error('Error saving shopping item:', error);
      showAlert('Ошибка при сохранении товара');
    }
  };

  // Handle toggle item completion
  const handleToggleItem = async (listId: string, itemId: string) => {
    try {
      const listToUpdate = shoppingLists.find(list => list.id === listId);
      
      if (!listToUpdate || !user?.id) return;
      
      const item = listToUpdate.items.find(item => item.id === itemId);
      
      if (!item) return;
      
      await updateShoppingItem(
        listId,
        itemId,
        { 
          completed: !item.completed,
          updatedBy: user.id.toString() 
        },
        listToUpdate.items
      );
      
      // Update state locally for immediate feedback
      setShoppingLists(prevLists => 
        prevLists.map(list => 
          list.id === listId 
            ? {
                ...list,
                items: list.items.map(item => 
                  item.id === itemId 
                    ? { ...item, completed: !item.completed, updatedBy: user.id.toString() }
                    : item
                )
              }
            : list
        )
      );
      
    } catch (error) {
      console.error('Error toggling item completion:', error);
      showAlert('Ошибка при обновлении статуса товара');
    }
  };

  // Handle delete item
  const handleDeleteItem = async (listId: string, itemId: string) => {
    try {
      const listToUpdate = shoppingLists.find(list => list.id === listId);
      
      if (!listToUpdate) return;
      
      await deleteShoppingItem(
        listId,
        itemId,
        listToUpdate.items
      );
      
      // Update state locally
      setShoppingLists(prevLists => 
        prevLists.map(list => 
          list.id === listId 
            ? {
                ...list,
                items: list.items.filter(item => item.id !== itemId)
              }
            : list
        )
      );
      
    } catch (error) {
      console.error('Error deleting shopping item:', error);
      showAlert('Ошибка при удалении товара');
    }
  };

  // Calculate total price for a list
  const calculateTotalPrice = (items: ShoppingItem[]) => {
    return items.reduce((total, item) => total + item.estimatedPrice, 0);
  };
  
  // Calculate completed items count
  const calculateCompletedCount = (items: ShoppingItem[]) => {
    return items.filter(item => item.completed).length;
  };

  // If still authenticating, show loading indicator
  if (isAuthenticating) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <LoadingIndicator message="Авторизация..." fullHeight />
      </Container>
    );
  }

  // If user is not authenticated, show error
  if (!user?.id) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h5" color="error" textAlign="center">
          Вы не авторизованы. Пожалуйста, войдите в систему.
        </Typography>
      </Container>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <Container maxWidth="md">
        <Box sx={{ py: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Списки покупок
          </Typography>
          
          {/* Group selection */}
          <Box sx={{ mb: 3, mt: 2 }}>
            <FormControl fullWidth variant="outlined">
              <InputLabel id="group-select-label">Группа</InputLabel>
              <Select
                labelId="group-select-label"
                value={selectedGroupId}
                onChange={handleGroupChange as any}
                label="Группа"
                startAdornment={
                  <InputAdornment position="start">
                    <GroupIcon />
                  </InputAdornment>
                }
              >
                {groups.map((group) => (
                  <MenuItem key={group.id} value={group.id}>
                    {group.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          
          {/* Add new list button */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />} 
              onClick={() => handleOpenListDialog()}
              sx={{ 
                borderRadius: '24px',
                px: 3,
                py: 1,
                backgroundImage: 'linear-gradient(90deg, #0088cc, #2AABEE)'
              }}
            >
              Создать список
            </Button>
          </Box>

          {/* Loading state */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <AnimatePresence>
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {/* No shopping lists */}
                {shoppingLists.length === 0 ? (
                  <motion.div variants={itemVariants}>
                    <Paper 
                      sx={{
                        textAlign: 'center',
                        py: 6,
                        px: 4,
                        borderRadius: 4,
                        bgcolor: (theme) => alpha(theme.palette.background.paper, 0.7),
                        backdropFilter: 'blur(10px)'
                      }}
                    >
                      <Box sx={{ mb: 3 }}>
                        <Avatar 
                          sx={{ 
                            width: 80, 
                            height: 80, 
                            mx: 'auto',
                            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                            color: 'primary.main'
                          }}
                        >
                          <ShoppingCartIcon sx={{ fontSize: 40 }} />
                        </Avatar>
                      </Box>
                      <Typography variant="h6" gutterBottom>
                        Нет списков покупок
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Создайте свой первый список покупок для этой группы
                      </Typography>
                      <Button 
                        variant="contained" 
                        startIcon={<AddIcon />} 
                        onClick={() => handleOpenListDialog()}
                        sx={{ 
                          borderRadius: '24px',
                          px: 3,
                          py: 1,
                          backgroundImage: 'linear-gradient(90deg, #0088cc, #2AABEE)'
                        }}
                      >
                        Создать список
                      </Button>
                    </Paper>
                  </motion.div>
                ) : (
                  // Shopping lists grid
                  <Grid container spacing={3}>
                    {shoppingLists.map((list) => (
                      <Grid item xs={12} key={list.id}>
                        <motion.div 
                          variants={itemVariants}
                          whileHover="hover"
                        >
                          <Paper 
                            sx={{ 
                              borderRadius: 3, 
                              overflow: 'hidden',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                            }}
                          >
                            <Box 
                              sx={{ 
                                px: 3, 
                                py: 2,
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05)
                              }}
                            >
                              <Box>
                                <Typography variant="h6" fontWeight="500">
                                  {list.title}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                                  <Chip 
                                    size="small" 
                                    label={`${calculateCompletedCount(list.items)}/${list.items.length} товаров`}
                                    sx={{ mr: 1, bgcolor: (theme) => alpha(theme.palette.success.main, 0.1), color: 'success.main' }}
                                  />
                                  <Chip 
                                    size="small" 
                                    label={`${calculateTotalPrice(list.items)} ₽`}
                                    sx={{ mr: 1, bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}
                                  />
                                  <Typography variant="caption" color="text.secondary">
                                    Создал: {getUserName(list.createdBy)}
                                  </Typography>
                                </Box>
                              </Box>
                              <Box>
                                <Tooltip title="Редактировать список">
                                  <IconButton 
                                    onClick={() => handleOpenListDialog(list)}
                                    size="small"
                                    sx={{ mr: 1 }}
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Удалить список">
                                  <IconButton 
                                    onClick={() => handleDeleteList(list.id)}
                                    size="small"
                                    color="error"
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </Box>
                            
                            <Divider />
                            
                            <List sx={{ py: 0 }}>
                              {list.items.length === 0 ? (
                                <ListItem>
                                  <ListItemText 
                                    primary="Нет товаров" 
                                    primaryTypographyProps={{ 
                                      color: 'text.secondary',
                                      textAlign: 'center'
                                    }} 
                                  />
                                </ListItem>
                              ) : (
                                list.items.map((item) => (
                                  <React.Fragment key={item.id}>
                                    <ListItem
                                      sx={{
                                        bgcolor: item.completed ? (theme) => alpha(theme.palette.success.light, 0.05) : 'inherit',
                                        transition: 'background-color 0.3s'
                                      }}
                                    >
                                      <Checkbox
                                        checked={item.completed}
                                        onChange={() => handleToggleItem(list.id, item.id)}
                                        color="success"
                                        icon={<motion.div whileHover={{ scale: 1.1 }} />}
                                        checkedIcon={<CheckCircleIcon />}
                                      />
                                      <ListItemText
                                        primary={
                                          <Typography
                                            variant="body1"
                                            sx={{
                                              textDecoration: item.completed ? 'line-through' : 'none',
                                              color: item.completed ? 'text.secondary' : 'text.primary',
                                            }}
                                          >
                                            {item.name}
                                          </Typography>
                                        }
                                        secondary={
                                          <Box sx={{ mt: 0.5 }}>
                                            {item.hasPriceEstimate && (
                                              <Chip 
                                                size="small" 
                                                label={`${item.estimatedPrice} ₽`}
                                                sx={{ mr: 0.5, mb: 0.5, bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}
                                              />
                                            )}
                                            {item.hasQuantity && item.quantity && (
                                              <Chip 
                                                size="small" 
                                                label={`Кол-во: ${item.quantity}`}
                                                sx={{ mr: 0.5, mb: 0.5, bgcolor: (theme) => alpha(theme.palette.info.main, 0.1), color: 'info.main' }}
                                              />
                                            )}
                                            {item.hasPurchaseDate && item.purchaseDate && (
                                              <Chip 
                                                size="small" 
                                                label={`Дата: ${item.purchaseDate.toDate().toLocaleDateString()}`}
                                                sx={{ mr: 0.5, mb: 0.5, bgcolor: (theme) => alpha(theme.palette.warning.main, 0.1), color: 'warning.main' }}
                                              />
                                            )}
                                            <Typography variant="caption" display="block" sx={{ mt: 0.5, color: 'text.secondary' }}>
                                              Добавил: {getUserName(item.createdBy)}
                                            </Typography>
                                          </Box>
                                        }
                                      />
                                      <ListItemSecondaryAction>
                                        <Tooltip title="Редактировать товар">
                                          <IconButton 
                                            edge="end" 
                                            onClick={() => handleOpenItemDialog(list.id, item)}
                                            size="small"
                                            sx={{ mr: 1 }}
                                          >
                                            <EditIcon fontSize="small" />
                                          </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Удалить товар">
                                          <IconButton 
                                            edge="end" 
                                            onClick={() => handleDeleteItem(list.id, item.id)}
                                            size="small"
                                            color="error"
                                          >
                                            <DeleteIcon fontSize="small" />
                                          </IconButton>
                                        </Tooltip>
                                      </ListItemSecondaryAction>
                                    </ListItem>
                                    <Divider component="li" />
                                  </React.Fragment>
                                ))
                              )}
                            </List>
                            
                            <Box sx={{ p: 2, textAlign: 'center' }}>
                              <Button
                                startIcon={<AddIcon />}
                                onClick={() => handleOpenItemDialog(list.id)}
                                variant="outlined"
                                sx={{ borderRadius: '24px' }}
                              >
                                Добавить товар
                              </Button>
                            </Box>
                          </Paper>
                        </motion.div>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </Box>

        {/* Dialog for adding/editing shopping list */}
        <Dialog 
          open={openListDialog} 
          onClose={handleCloseListDialog}
          PaperProps={{
            sx: {
              borderRadius: 3,
              minWidth: '350px'
            }
          }}
        >
          <DialogTitle>
            {editingList ? 'Редактировать список' : 'Создать список покупок'}
          </DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Название списка"
              type="text"
              fullWidth
              variant="outlined"
              value={listTitle}
              onChange={(e) => setListTitle(e.target.value)}
              sx={{ mt: 1 }}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button 
              onClick={handleCloseListDialog}
              sx={{ borderRadius: 2 }}
            >
              Отмена
            </Button>
            <Button 
              onClick={handleSaveList} 
              variant="contained"
              sx={{ 
                borderRadius: 2,
                px: 3,
                backgroundImage: 'linear-gradient(90deg, #0088cc, #2AABEE)'
              }}
            >
              Сохранить
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog for adding/editing list item */}
        <Dialog 
          open={openItemDialog} 
          onClose={handleCloseItemDialog}
          PaperProps={{
            sx: {
              borderRadius: 3,
              minWidth: '400px'
            }
          }}
        >
          <DialogTitle>
            {editingItem ? 'Редактировать товар' : 'Добавить товар'}
          </DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Название товара"
              type="text"
              fullWidth
              variant="outlined"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              sx={{ mb: 2, mt: 1 }}
            />

            <Box sx={{ mb: 2 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={hasPriceEstimate}
                    onChange={(e) => setHasPriceEstimate(e.target.checked)}
                    color="primary"
                  />
                }
                label="Указать примерную стоимость"
              />
              {hasPriceEstimate && (
                <TextField
                  margin="dense"
                  label="Примерная стоимость"
                  type="number"
                  fullWidth
                  variant="outlined"
                  InputProps={{
                    endAdornment: <InputAdornment position="end">₽</InputAdornment>,
                  }}
                  value={itemPrice}
                  onChange={(e) => setItemPrice(e.target.value)}
                />
              )}
            </Box>

            <Box sx={{ mb: 2 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={hasQuantity}
                    onChange={(e) => setHasQuantity(e.target.checked)}
                    color="primary"
                  />
                }
                label="Указать количество"
              />
              {hasQuantity && (
                <TextField
                  margin="dense"
                  label="Количество"
                  type="number"
                  fullWidth
                  variant="outlined"
                  value={itemQuantity}
                  onChange={(e) => setItemQuantity(e.target.value)}
                />
              )}
            </Box>

            <Box sx={{ mb: 1 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={hasPurchaseDate}
                    onChange={(e) => setHasPurchaseDate(e.target.checked)}
                    color="primary"
                  />
                }
                label="Указать дату покупки"
              />
              {hasPurchaseDate && (
                <TextField
                  margin="dense"
                  label="Дата покупки"
                  type="date"
                  fullWidth
                  variant="outlined"
                  value={itemPurchaseDate}
                  onChange={(e) => setItemPurchaseDate(e.target.value)}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              )}
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button 
              onClick={handleCloseItemDialog}
              sx={{ borderRadius: 2 }}
            >
              Отмена
            </Button>
            <Button 
              onClick={handleSaveItem} 
              variant="contained"
              sx={{ 
                borderRadius: 2,
                px: 3,
                backgroundImage: 'linear-gradient(90deg, #0088cc, #2AABEE)'
              }}
            >
              Сохранить
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </motion.div>
  );
};

export default Purchases; 