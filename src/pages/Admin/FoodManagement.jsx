import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Button,
  Grid,
  Pagination,
  Box,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { getAdminFoodItems, createFoodItem, updateFoodItem, deleteFoodItem } from 'services/api';
import FoodCard from 'components/food/FoodCard';
import FoodDialog from 'components/food/FoodDialog';

const AdminFoodManagement = () => {
  const [foodItems, setFoodItems] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [currentFood, setCurrentFood] = useState({
    name: '',
    category: 'Starters',
    price: 0,
    description: '',
    imageUrl: '',
    modelUrl: '',
    ingredients: [],
    calories: 0,
    isVeg: true,
    isAvailable: true,
  });

  useEffect(() => {
    fetchFoodItems();
  }, []);

  const fetchFoodItems = async () => {
    try {
      const response = await getAdminFoodItems();
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
        ingredients: [],
        calories: 0,
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
    // Validation
    if (!currentFood.name || !currentFood.price || !currentFood.calories || currentFood.calories === 0) {
      alert('Please fill in all required fields: Name, Price, and Calories');
      return;
    }
    
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
      alert('Failed to save food item: ' + (error.response?.data?.message || error.message));
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

  const handleChangePage = (event, value) => {
    setPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Get paginated data
  const totalPages = Math.ceil(foodItems.length / itemsPerPage);
  const paginatedItems = foodItems.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

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
        {paginatedItems.map((food) => (
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

      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={handleChangePage}
            color="primary"
            size="large"
            showFirstButton
            showLastButton
          />
        </Box>
      )}

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
