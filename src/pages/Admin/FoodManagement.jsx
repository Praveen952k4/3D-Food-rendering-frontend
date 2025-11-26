import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Button,
  Grid,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { getFoodItems, createFoodItem, updateFoodItem, deleteFoodItem } from 'services/api';
import FoodCard from 'components/food/FoodCard';
import FoodDialog from 'components/food/FoodDialog';

const AdminFoodManagement = () => {
  const [foodItems, setFoodItems] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentFood, setCurrentFood] = useState({
    name: '',
    category: 'Starters',
    price: 0,
    description: '',
    imageUrl: '',
    modelUrl: '',
    isVeg: true,
    isAvailable: true,
  });

  useEffect(() => {
    fetchFoodItems();
  }, []);

  const fetchFoodItems = async () => {
    try {
      const response = await getFoodItems();
      setFoodItems(response.data.foodItems || []);
    } catch (error) {
      console.error('Failed to fetch food items:', error);
    }
  };

  const handleOpenDialog = (food) => {
    if (food) {
      setCurrentFood(food);
      setEditMode(true);
    } else {
      setCurrentFood({
        name: '',
        category: 'Starters',
        price: 0,
        description: '',
        imageUrl: '',
        modelUrl: '',
        isVeg: true,
        isAvailable: true,
      });
      setEditMode(false);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditMode(false);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (editMode && currentFood._id) {
        await updateFoodItem(currentFood._id, currentFood);
      } else {
        await createFoodItem(currentFood);
      }
      fetchFoodItems();
      handleCloseDialog();
    } catch (error) {
      console.error('Failed to save food item:', error);
      alert('Failed to save food item');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this food item?')) {
      try {
        await deleteFoodItem(id);
        fetchFoodItems();
      } catch (error) {
        console.error('Failed to delete food item:', error);
        alert('Failed to delete food item');
      }
    }
  };

  const handleToggleAvailability = async (food) => {
    try {
      await updateFoodItem(food._id, { ...food, isAvailable: !food.isAvailable });
      fetchFoodItems();
    } catch (error) {
      console.error('Failed to update availability:', error);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Food Items Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Add, edit, or remove food items from the menu
          </Typography>
        </div>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog(null)}
          sx={{
            background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
            py: 1.5,
            px: 3,
          }}
        >
          Add Food Item
        </Button>
      </div>

      {/* Food Items Grid */}
      <Grid container spacing={3}>
        {foodItems.map((food) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={food._id}>
            <FoodCard
              food={food}
              onEdit={handleOpenDialog}
              onDelete={handleDelete}
              onToggleAvailability={handleToggleAvailability}
            />
          </Grid>
        ))}
      </Grid>

      {/* Add/Edit Dialog */}
      <FoodDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        food={currentFood}
        setFood={setCurrentFood}
        onSave={handleSave}
        editMode={editMode}
        loading={loading}
      />
    </Container>
  );
};

export default AdminFoodManagement;
