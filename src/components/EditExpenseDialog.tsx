import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Avatar,
  FormControlLabel,
  Switch,
  Checkbox,
  ListItemText,
  Divider,
  Chip
} from '@mui/material';
import { alpha as muiAlpha } from '@mui/material/styles';
import {
  Restaurant as RestaurantIcon,
  LocalGroceryStore as GroceryIcon,
  DirectionsCar as CarIcon,
  Home as HomeIcon,
  LocalHospital as HealthIcon,
  School as EducationIcon,
  SportsEsports as EntertainmentIcon,
  MoreHoriz as MoreIcon,
  PeopleAlt as PeopleIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { Expense, Group, User } from '../services/firebase';

// Define categories 
const categories = [
  { id: 'food', name: 'Еда', icon: <RestaurantIcon />, color: '#FF5722' },
  { id: 'grocery', name: 'Продукты', icon: <GroceryIcon />, color: '#4CAF50' },
  { id: 'transport', name: 'Транспорт', icon: <CarIcon />, color: '#2196F3' },
  { id: 'housing', name: 'Жилье', icon: <HomeIcon />, color: '#9C27B0' },
  { id: 'health', name: 'Здоровье', icon: <HealthIcon />, color: '#E91E63' },
  { id: 'education', name: 'Образование', icon: <EducationIcon />, color: '#3F51B5' },
  { id: 'entertainment', name: 'Развлечения', icon: <EntertainmentIcon />, color: '#FF9800' },
  { id: 'other', name: 'Другое', icon: <MoreIcon />, color: '#607D8B' },
];

interface EditExpenseDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (expenseId: string, expenseData: {
    amount: number;
    description: string;
    category: string;
    splitBetween: string[];
    paidBy: string[];
  }) => void;
  loading: boolean;
  expense: Expense | null;
  groups?: Group[];
  groupMembers?: User[];
  currentUserId?: string;
}

const EditExpenseDialog: React.FC<EditExpenseDialogProps> = ({
  open,
  onClose,
  onSubmit,
  loading,
  expense,
  groups = [],
  groupMembers = [],
  currentUserId = '',
}) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('food');
  const [splitBetween, setSplitBetween] = useState<string[]>([]);
  const [paidBy, setPaidBy] = useState<string[]>([]);
  const [skipSplitUsers, setSkipSplitUsers] = useState(false);
  const [skipPaidByUsers, setSkipPaidByUsers] = useState(false);

  // Загружаем данные при открытии диалога
  useEffect(() => {
    if (expense) {
      setAmount(expense.amount.toString());
      setDescription(expense.description);
      setCategory(expense.category);
      setSplitBetween(expense.splitBetween || []);
      setPaidBy(expense.paidBy || []);
      setSkipSplitUsers(expense.splitBetween.length === 0);
      setSkipPaidByUsers(expense.paidBy.length === 0);
    }
  }, [expense]);

  const handleSubmit = () => {
    if (!amount || !description || !expense) return;
    
    onSubmit(expense.id, {
      amount: parseFloat(amount),
      description,
      category,
      splitBetween: skipSplitUsers ? [] : splitBetween,
      paidBy: skipPaidByUsers ? [] : paidBy,
    });
  };

  const getUserName = (userId: string) => {
    const user = groupMembers.find(m => m.id === userId);
    return user ? (user.name || user.username || `ID: ${userId}`) : `ID: ${userId}`;
  };

  // Если нет данных о расходе, не показываем диалог
  if (!expense) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: { borderRadius: 3 }
      }}
    >
      <DialogTitle>Редактировать расход</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 1 }}>
          <TextField
            fullWidth
            label="Сумма"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            margin="normal"
            autoFocus
            InputProps={{
              startAdornment: <Typography sx={{ mr: 0.5 }}>₽</Typography>,
            }}
          />
          
          <TextField
            fullWidth
            label="Описание"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            margin="normal"
          />
          
          <FormControl fullWidth margin="normal">
            <InputLabel>Категория</InputLabel>
            <Select
              value={category}
              label="Категория"
              onChange={(e) => setCategory(e.target.value)}
            >
              {categories.map((cat) => (
                <MenuItem key={cat.id} value={cat.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar 
                      sx={{ 
                        width: 24, 
                        height: 24, 
                        mr: 1,
                        bgcolor: muiAlpha(cat.color, 0.1),
                        color: cat.color
                      }}
                    >
                      {cat.icon}
                    </Avatar>
                    {cat.name}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <Divider sx={{ my: 2 }} />
          
          {/* Переключатель для пропуска выбора участников */}
          <FormControlLabel
            control={
              <Switch 
                checked={skipSplitUsers}
                onChange={(e) => {
                  setSkipSplitUsers(e.target.checked);
                  if (e.target.checked) {
                    setSplitBetween([]);
                  } else if (groupMembers.length > 0) {
                    setSplitBetween(groupMembers.map(m => m.id));
                  }
                }}
              />
            }
            label="Не указывать участников для разделения расхода"
          />
          
          {/* Выбор участников для разделения расходов */}
          {!skipSplitUsers && (
            <FormControl fullWidth margin="normal">
              <InputLabel id="split-between-label">
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <PeopleIcon fontSize="small" sx={{ mr: 1 }} />
                  Разделить между
                </Box>
              </InputLabel>
              <Select
                labelId="split-between-label"
                multiple
                value={splitBetween}
                onChange={(e) => setSplitBetween(
                  typeof e.target.value === 'string' 
                    ? e.target.value.split(',') 
                    : e.target.value
                )}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip 
                        key={value} 
                        label={getUserName(value)} 
                        size="small"
                      />
                    ))}
                  </Box>
                )}
              >
                {groupMembers.map((member) => (
                  <MenuItem key={member.id} value={member.id}>
                    <Checkbox checked={splitBetween.indexOf(member.id) > -1} />
                    <ListItemText primary={getUserName(member.id)} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          
          <Divider sx={{ my: 2 }} />
          
          {/* Переключатель для пропуска выбора плательщиков */}
          <FormControlLabel
            control={
              <Switch 
                checked={skipPaidByUsers}
                onChange={(e) => {
                  setSkipPaidByUsers(e.target.checked);
                  if (e.target.checked) {
                    setPaidBy([]);
                  } else if (currentUserId) {
                    setPaidBy([currentUserId]);
                  }
                }}
              />
            }
            label="Не указывать кто оплатил"
          />
          
          {/* Выбор кто оплатил */}
          {!skipPaidByUsers && (
            <FormControl fullWidth margin="normal">
              <InputLabel id="paid-by-label">
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <PersonIcon fontSize="small" sx={{ mr: 1 }} />
                  Кто оплатил
                </Box>
              </InputLabel>
              <Select
                labelId="paid-by-label"
                multiple
                value={paidBy}
                onChange={(e) => setPaidBy(
                  typeof e.target.value === 'string' 
                    ? e.target.value.split(',') 
                    : e.target.value
                )}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip 
                        key={value} 
                        label={getUserName(value)} 
                        size="small"
                      />
                    ))}
                  </Box>
                )}
              >
                {groupMembers.map((member) => (
                  <MenuItem key={member.id} value={member.id}>
                    <Checkbox checked={paidBy.indexOf(member.id) > -1} />
                    <ListItemText primary={getUserName(member.id)} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Отмена
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary"
          disabled={loading || !amount || !description}
        >
          {loading ? 'Сохранение...' : 'Сохранить'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditExpenseDialog; 