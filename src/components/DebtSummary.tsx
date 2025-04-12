import React, { useState, useEffect } from 'react';
import {
  Box,
  Alert,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Button,
  CircularProgress,
  Divider,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import { 
  Payment as PaymentIcon, 
  ArrowForward as ArrowForwardIcon,
  AccountCircle as AccountCircleIcon
} from '@mui/icons-material';
import { Expense, getUser, User, createPayment } from '../services/firebase';
import { calculateDebts } from '../services/debtCalculator';
import { useTelegramApp } from '../hooks/useTelegramApp';

interface DebtItem {
  fromUserId: string;
  toUserId: string;
  amount: number;
}

interface DebtSummaryProps {
  groupId: string;
  expenses: Expense[];
  onPaymentCreated?: () => void;
}

const DebtSummary: React.FC<DebtSummaryProps> = ({ groupId, expenses, onPaymentCreated }) => {
  const [debts, setDebts] = useState<DebtItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userMap, setUserMap] = useState<Record<string, User>>({});
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<DebtItem | null>(null);
  const [paymentDescription, setPaymentDescription] = useState('');
  const { user, showAlert } = useTelegramApp();

  useEffect(() => {
    calculateDebtSummary();
  }, [expenses]);

  const calculateDebtSummary = async () => {
    try {
      setLoading(true);
      setError(null);

      // Расчет долгов
      const calculatedDebts = calculateDebts(expenses);
      setDebts(calculatedDebts);

      // Загрузка информации о пользователях
      const userIds = new Set<string>();
      calculatedDebts.forEach(debt => {
        userIds.add(debt.fromUserId);
        userIds.add(debt.toUserId);
      });

      const userPromises = Array.from(userIds).map(async (userId) => {
        const userDoc = await getUser(userId);
        return userDoc;
      });

      const users = await Promise.all(userPromises);
      const userMapObj: Record<string, User> = {};
      
      users.forEach(user => {
        if (user) {
          userMapObj[user.id] = user;
        }
      });
      
      setUserMap(userMapObj);
    } catch (err) {
      console.error('Error calculating debt summary:', err);
      setError('Произошла ошибка при расчете долгов');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePayment = async () => {
    if (!selectedDebt || !user) return;
    
    try {
      if (!paymentDescription) {
        setPaymentDescription('Оплата долга');
      }
      
      await createPayment({
        groupId,
        amount: selectedDebt.amount,
        fromUserId: selectedDebt.fromUserId,
        toUserId: selectedDebt.toUserId,
        description: paymentDescription || 'Оплата долга'
      });
      
      showAlert('Платеж создан успешно');
      setOpenPaymentDialog(false);
      setSelectedDebt(null);
      setPaymentDescription('');
      
      if (onPaymentCreated) {
        onPaymentCreated();
      }
    } catch (error) {
      console.error('Error creating payment:', error);
      showAlert('Ошибка при создании платежа');
    }
  };

  const openPayment = (debt: DebtItem) => {
    setSelectedDebt(debt);
    setOpenPaymentDialog(true);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  if (debts.length === 0) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        В группе нет долгов
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h6" sx={{ mt: 3, mb: 2, fontWeight: 'medium' }}>
        Сводка по долгам
      </Typography>
      
      <List>
        {debts.map((debt, index) => (
          <Card 
            key={`${debt.fromUserId}-${debt.toUserId}-${index}`} 
            sx={{ mb: 2, borderRadius: '16px' }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <ListItemAvatar>
                    <Avatar src={userMap[debt.fromUserId]?.photoURL}>
                      {userMap[debt.fromUserId]?.name?.[0] || <AccountCircleIcon />}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={userMap[debt.fromUserId]?.name || 'Пользователь'}
                    secondary="Должен"
                  />
                </Box>
                
                <ArrowForwardIcon sx={{ mx: 1, color: 'text.secondary' }} />
                
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <ListItemText
                    primary={userMap[debt.toUserId]?.name || 'Пользователь'}
                    secondary="Получает"
                    sx={{ textAlign: 'right' }}
                  />
                  <ListItemAvatar sx={{ ml: 1 }}>
                    <Avatar src={userMap[debt.toUserId]?.photoURL}>
                      {userMap[debt.toUserId]?.name?.[0] || <AccountCircleIcon />}
                    </Avatar>
                  </ListItemAvatar>
                </Box>
              </Box>
              
              <Divider sx={{ my: 1.5 }} />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                <Chip 
                  label={`${debt.amount.toFixed(2)} ₽`} 
                  color="primary" 
                  sx={{ fontWeight: 'bold' }}
                />
                
                {user && debt.fromUserId === user.id.toString() && (
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<PaymentIcon />}
                    onClick={() => openPayment(debt)}
                  >
                    Оплатить
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        ))}
      </List>
      
      <Dialog open={openPaymentDialog} onClose={() => setOpenPaymentDialog(false)}>
        <DialogTitle>Создать платеж</DialogTitle>
        <DialogContent>
          {selectedDebt && (
            <>
              <Typography variant="body1" gutterBottom>
                Вы собираетесь отправить платеж:
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                <strong>{selectedDebt.amount.toFixed(2)} ₽</strong> пользователю {userMap[selectedDebt.toUserId]?.name || 'Пользователь'}
              </Typography>
              <TextField
                autoFocus
                margin="dense"
                label="Описание платежа"
                type="text"
                fullWidth
                variant="outlined"
                value={paymentDescription}
                onChange={(e) => setPaymentDescription(e.target.value)}
                placeholder="Оплата долга"
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPaymentDialog(false)}>Отмена</Button>
          <Button onClick={handleCreatePayment} variant="contained">Создать платеж</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DebtSummary;
