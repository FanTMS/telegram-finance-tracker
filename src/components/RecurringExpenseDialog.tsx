import React, { useState } from 'react';
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
  Avatar
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
} from '@mui/icons-material';

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

interface Group {
  id: string;
  name: string;
}

interface RecurringExpenseDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (formData: {
    description: string;
    amount: string;
    category: string;
    frequency: string;
    nextDate: Date;
    groupId: string;
    active: boolean;
  }) => void;
  groups?: Group[];
  selectedGroupId?: string;
}

const RecurringExpenseDialog: React.FC<RecurringExpenseDialogProps> = ({
  open,
  onClose,
  onSubmit,
  groups = [],
  selectedGroupId = '',
}) => {
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: 'food',
    frequency: 'monthly',
    nextDate: new Date(),
    groupId: selectedGroupId,
    active: true
  });

  const handleChange = (field: string, value: string | boolean | Date) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    onSubmit(formData);
  };

  // Reset form when dialog opens
  React.useEffect(() => {
    if (open) {
      setFormData({
        description: '',
        amount: '',
        category: 'food',
        frequency: 'monthly',
        nextDate: new Date(),
        groupId: selectedGroupId,
        active: true
      });
    }
  }, [open, selectedGroupId]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3 }
      }}
    >
      <DialogTitle>Добавить регулярный расход</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 1 }}>
          <TextField
            fullWidth
            label="Описание"
            margin="normal"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            required
          />
          
          <TextField
            fullWidth
            label="Сумма"
            margin="normal"
            type="number"
            value={formData.amount}
            onChange={(e) => handleChange('amount', e.target.value)}
            InputProps={{
              startAdornment: <Typography sx={{ mr: 0.5 }}>₽</Typography>,
            }}
            required
          />
          
          <FormControl fullWidth margin="normal">
            <InputLabel>Категория</InputLabel>
            <Select
              value={formData.category}
              label="Категория"
              onChange={(e) => handleChange('category', e.target.value)}
            >
              {categories.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar 
                      sx={{ 
                        width: 24, 
                        height: 24, 
                        mr: 1,
                        bgcolor: muiAlpha(category.color, 0.1),
                        color: category.color
                      }}
                    >
                      {category.icon}
                    </Avatar>
                    {category.name}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl fullWidth margin="normal">
            <InputLabel>Частота</InputLabel>
            <Select
              value={formData.frequency}
              label="Частота"
              onChange={(e) => handleChange('frequency', e.target.value)}
            >
              <MenuItem value="daily">Ежедневно</MenuItem>
              <MenuItem value="weekly">Еженедельно</MenuItem>
              <MenuItem value="monthly">Ежемесячно</MenuItem>
              <MenuItem value="yearly">Ежегодно</MenuItem>
            </Select>
          </FormControl>
          
          <TextField
            fullWidth
            label="Дата следующего платежа"
            margin="normal"
            type="date"
            value={formData.nextDate.toISOString().split('T')[0]}
            onChange={(e) => handleChange('nextDate', new Date(e.target.value))}
            InputLabelProps={{ shrink: true }}
          />
          
          {groups.length > 0 && (
            <FormControl fullWidth margin="normal">
              <InputLabel>Группа</InputLabel>
              <Select
                value={formData.groupId}
                label="Группа"
                onChange={(e) => handleChange('groupId', e.target.value)}
              >
                {groups.map((group) => (
                  <MenuItem key={group.id} value={group.id}>
                    {group.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Отмена</Button>
        <Button 
          variant="contained" 
          onClick={handleSubmit}
          disabled={!formData.description || !formData.amount}
        >
          Добавить
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RecurringExpenseDialog; 