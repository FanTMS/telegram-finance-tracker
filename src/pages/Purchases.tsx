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
  Grid
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { motion } from 'framer-motion';

// Define Purchase interface
interface Purchase {
  id: number;
  name: string;
  amount: number;
  date: string;
  category: string;
  notes?: string;
}

const Purchases: React.FC = () => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [purchaseName, setPurchaseName] = useState('');
  const [purchaseAmount, setPurchaseAmount] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [purchaseCategory, setPurchaseCategory] = useState('');
  const [purchaseNotes, setPurchaseNotes] = useState('');
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);

  // Categories for purchases
  const categories = ['Groceries', 'Electronics', 'Clothing', 'Entertainment', 'Home', 'Transport', 'Other'];

  // Mock data for initial development
  useEffect(() => {
    // Simulating API call
    setTimeout(() => {
      setPurchases([
        { id: 1, name: 'Laptop', amount: 1200, date: '2023-05-15', category: 'Electronics', notes: 'For work' },
        { id: 2, name: 'Groceries', amount: 85.50, date: '2023-05-20', category: 'Groceries' },
        { id: 3, name: 'Running Shoes', amount: 120, date: '2023-05-22', category: 'Clothing' }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const handleOpenDialog = (purchase: Purchase | null = null) => {
    if (purchase) {
      setEditingPurchase(purchase);
      setPurchaseName(purchase.name);
      setPurchaseAmount(purchase.amount.toString());
      setPurchaseDate(purchase.date);
      setPurchaseCategory(purchase.category);
      setPurchaseNotes(purchase.notes || '');
    } else {
      setEditingPurchase(null);
      setPurchaseName('');
      setPurchaseAmount('');
      setPurchaseDate(new Date().toISOString().split('T')[0]);
      setPurchaseCategory('');
      setPurchaseNotes('');
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleSavePurchase = () => {
    if (!purchaseName || !purchaseAmount || !purchaseDate || !purchaseCategory) return;

    if (editingPurchase) {
      // Update existing purchase
      setPurchases(purchases.map(p => 
        p.id === editingPurchase.id 
          ? { 
              ...p, 
              name: purchaseName, 
              amount: Number(purchaseAmount), 
              date: purchaseDate,
              category: purchaseCategory,
              notes: purchaseNotes
            } 
          : p
      ));
    } else {
      // Add new purchase
      const newPurchase: Purchase = {
        id: Date.now(),
        name: purchaseName,
        amount: Number(purchaseAmount),
        date: purchaseDate,
        category: purchaseCategory,
        notes: purchaseNotes || undefined
      };
      setPurchases([...purchases, newPurchase]);
    }
    handleCloseDialog();
  };

  const handleDeletePurchase = (id: number) => {
    setPurchases(purchases.filter(purchase => purchase.id !== id));
  };

  // Get category color based on category name
  const getCategoryColor = (category: string) => {
    const colorMap: Record<string, string> = {
      'Groceries': '#4caf50',
      'Electronics': '#2196f3',
      'Clothing': '#9c27b0',
      'Entertainment': '#ff9800',
      'Home': '#795548',
      'Transport': '#607d8b',
      'Other': '#9e9e9e'
    };
    return colorMap[category] || '#9e9e9e';
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <Container maxWidth="md">
        <Box sx={{ py: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              Purchases
            </Typography>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />} 
              onClick={() => handleOpenDialog()}
            >
              Add Purchase
            </Button>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {purchases.length === 0 ? (
                <Card sx={{ mb: 2, textAlign: 'center', py: 4 }}>
                  <CardContent>
                    <Typography variant="body1" color="text.secondary">
                      No purchases yet. Add your first purchase!
                    </Typography>
                  </CardContent>
                </Card>
              ) : (
                <Grid container spacing={2}>
                  {purchases.map((purchase) => (
                    <Grid item xs={12} sm={6} md={4} key={purchase.id}>
                      <Card sx={{ height: '100%' }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Box>
                              <Typography variant="h6" component="div" sx={{ mb: 1 }}>
                                {purchase.name}
                              </Typography>
                              <Typography variant="body1" color="text.primary" sx={{ fontWeight: 'bold', mb: 1 }}>
                                ${purchase.amount.toFixed(2)}
                              </Typography>
                            </Box>
                            <Avatar sx={{ bgcolor: getCategoryColor(purchase.category) }}>
                              <ShoppingCartIcon />
                            </Avatar>
                          </Box>
                          
                          <Chip 
                            label={purchase.category} 
                            size="small" 
                            sx={{ 
                              bgcolor: getCategoryColor(purchase.category),
                              color: 'white',
                              my: 1
                            }} 
                          />
                          
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            Date: {new Date(purchase.date).toLocaleDateString()}
                          </Typography>
                          
                          {purchase.notes && (
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              Notes: {purchase.notes}
                            </Typography>
                          )}
                          
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                            <IconButton 
                              size="small" 
                              onClick={() => handleOpenDialog(purchase)}
                              sx={{ mr: 1 }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton 
                              size="small" 
                              onClick={() => handleDeletePurchase(purchase.id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </>
          )}
        </Box>

        {/* Dialog for adding/editing purchases */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editingPurchase ? 'Edit Purchase' : 'Add New Purchase'}
          </DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Purchase Name"
              type="text"
              fullWidth
              variant="outlined"
              value={purchaseName}
              onChange={(e) => setPurchaseName(e.target.value)}
              sx={{ mb: 2 }}
            />
            
            <TextField
              margin="dense"
              label="Amount"
              type="number"
              fullWidth
              variant="outlined"
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
              value={purchaseAmount}
              onChange={(e) => setPurchaseAmount(e.target.value)}
              sx={{ mb: 2 }}
            />
            
            <TextField
              margin="dense"
              label="Date"
              type="date"
              fullWidth
              variant="outlined"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              sx={{ mb: 2 }}
            />
            
            <TextField
              select
              margin="dense"
              label="Category"
              fullWidth
              variant="outlined"
              value={purchaseCategory}
              onChange={(e) => setPurchaseCategory(e.target.value)}
              sx={{ mb: 2 }}
              SelectProps={{
                native: true,
              }}
            >
              <option value="" disabled>Select a category</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </TextField>
            
            <TextField
              margin="dense"
              label="Notes (Optional)"
              type="text"
              fullWidth
              variant="outlined"
              multiline
              rows={3}
              value={purchaseNotes}
              onChange={(e) => setPurchaseNotes(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleSavePurchase} variant="contained">
              Save
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </motion.div>
  );
};

export default Purchases; 