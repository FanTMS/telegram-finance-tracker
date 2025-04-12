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
  InputAdornment
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { motion } from 'framer-motion';

// Define Goal interface
interface Goal {
  id: number;
  name: string;
  targetAmount: number;
  currentAmount: number;
}

// Basic Goal page component
const Goals: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [goalName, setGoalName] = useState('');
  const [goalAmount, setGoalAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  // Mock data for initial development
  useEffect(() => {
    // Simulating API call
    setTimeout(() => {
      setGoals([
        { id: 1, name: 'New Car', targetAmount: 20000, currentAmount: 5000 },
        { id: 2, name: 'Vacation', targetAmount: 3000, currentAmount: 1500 },
        { id: 3, name: 'Emergency Fund', targetAmount: 10000, currentAmount: 7500 }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const handleOpenDialog = (goal: Goal | null = null) => {
    if (goal) {
      setEditingGoal(goal);
      setGoalName(goal.name);
      setGoalAmount(goal.targetAmount.toString());
      setCurrentAmount(goal.currentAmount.toString());
    } else {
      setEditingGoal(null);
      setGoalName('');
      setGoalAmount('');
      setCurrentAmount('0');
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleSaveGoal = () => {
    if (!goalName || !goalAmount) return;

    if (editingGoal) {
      // Update existing goal
      setGoals(goals.map(g => 
        g.id === editingGoal.id 
          ? { ...g, name: goalName, targetAmount: Number(goalAmount), currentAmount: Number(currentAmount) } 
          : g
      ));
    } else {
      // Add new goal
      const newGoal: Goal = {
        id: Date.now(),
        name: goalName,
        targetAmount: Number(goalAmount),
        currentAmount: Number(currentAmount) || 0
      };
      setGoals([...goals, newGoal]);
    }
    handleCloseDialog();
  };

  const handleDeleteGoal = (id: number) => {
    setGoals(goals.filter(goal => goal.id !== id));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <Container maxWidth="sm">
        <Box sx={{ py: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              Financial Goals
            </Typography>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />} 
              onClick={() => handleOpenDialog()}
            >
              New Goal
            </Button>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {goals.length === 0 ? (
                <Card sx={{ mb: 2, textAlign: 'center', py: 4 }}>
                  <CardContent>
                    <Typography variant="body1" color="text.secondary">
                      No goals yet. Create your first goal!
                    </Typography>
                  </CardContent>
                </Card>
              ) : (
                goals.map((goal) => {
                  const progress = (goal.currentAmount / goal.targetAmount) * 100;
                  
                  return (
                    <Card key={goal.id} sx={{ mb: 2 }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="h6">{goal.name}</Typography>
                          <Box>
                            <IconButton 
                              size="small" 
                              onClick={() => handleOpenDialog(goal)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton 
                              size="small" 
                              onClick={() => handleDeleteGoal(goal.id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Box>
                        
                        <Box sx={{ mt: 2 }}>
                          <LinearProgress 
                            variant="determinate" 
                            value={progress} 
                            sx={{ height: 10, borderRadius: 5 }}
                          />
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                            <Typography variant="body2">
                              ${goal.currentAmount.toLocaleString()}
                            </Typography>
                            <Typography variant="body2">
                              ${goal.targetAmount.toLocaleString()}
                            </Typography>
                          </Box>
                          <Typography variant="body2" align="center" sx={{ mt: 1 }}>
                            {progress.toFixed(0)}% complete
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </>
          )}
        </Box>

        {/* Dialog for adding/editing goals */}
        <Dialog open={openDialog} onClose={handleCloseDialog}>
          <DialogTitle>
            {editingGoal ? 'Edit Goal' : 'Add New Goal'}
          </DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Goal Name"
              type="text"
              fullWidth
              variant="outlined"
              value={goalName}
              onChange={(e) => setGoalName(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="Target Amount"
              type="number"
              fullWidth
              variant="outlined"
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
              value={goalAmount}
              onChange={(e) => setGoalAmount(e.target.value)}
              sx={{ mb: 2 }}
            />
            {editingGoal && (
              <TextField
                margin="dense"
                label="Current Amount"
                type="number"
                fullWidth
                variant="outlined"
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                value={currentAmount}
                onChange={(e) => setCurrentAmount(e.target.value)}
              />
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleSaveGoal} variant="contained">
              Save
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </motion.div>
  );
};

export default Goals; 