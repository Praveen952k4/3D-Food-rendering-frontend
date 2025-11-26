import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardMedia,
  CardContent,
  IconButton,
  Chip,
  Switch,
  FormControlLabel,
  Grid,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import ViewInArIcon from '@mui/icons-material/ViewInAr';
import { getFoodItems, createFoodItem, updateFoodItem, deleteFoodItem } from '../../services/api';

interface FoodItem {
  _id?: string;
  name: string;
  category: string;
  price: number;
  description: string;
  imageUrl: string;
  modelUrl?: string;
  isVeg: boolean;
  isAvailable: boolean;
}

const categories = [
  'Starters',
  'Tandoori',
  'Indian',
  'Special Platter',
  'Biryani',
  'Desserts',
  'Beverages',
];

const AdminFoodManagement: React.FC = () => {
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentFood, setCurrentFood] = useState<FoodItem>({
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

  const handleOpenDialog = (food?: FoodItem) => {
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
    }
  };

  const handleDelete = async (id: string) => {
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

  const handleToggleAvailability = async (food: FoodItem) => {
    try {
      await updateFoodItem(food._id!, { ...food, isAvailable: !food.isAvailable });
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
          onClick={() => handleOpenDialog()}
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
            <Card
              sx={{
                position: 'relative',
                opacity: food.isAvailable ? 1 : 0.6,
              }}
            >
              <CardMedia
                component="img"
                height="200"
                image={food.imageUrl || 'https://via.placeholder.com/300?text=Food'}
                alt={food.name}
              />

              {/* Status Badge */}
              {!food.isAvailable && (
                <Chip
                  label="Unavailable"
                  color="error"
                  size="small"
                  sx={{
                    position: 'absolute',
                    top: 8,
                    left: 8,
                  }}
                />
              )}

              {/* Veg/Non-veg indicator */}
              <div
                style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  width: '20px',
                  height: '20px',
                  border: `2px solid ${food.isVeg ? 'green' : 'red'}`,
                  backgroundColor: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: food.isVeg ? 'green' : 'red',
                  }}
                />
              </div>

              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom noWrap>
                  {food.name}
                </Typography>
                <Chip
                  label={food.category}
                  size="small"
                  sx={{ mb: 1 }}
                />
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, height: 40, overflow: 'hidden' }}>
                  {food.description}
                </Typography>
                <Typography variant="h5" color="primary" fontWeight="bold" gutterBottom>
                  ₹{food.price}
                </Typography>

                <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between', alignItems: 'center' }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={food.isAvailable}
                        onChange={() => handleToggleAvailability(food)}
                        size="small"
                      />
                    }
                    label={<Typography variant="caption">Available</Typography>}
                  />
                  <div>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleOpenDialog(food)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(food._id!)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editMode ? 'Edit Food Item' : 'Add New Food Item'}
        </DialogTitle>
        <DialogContent>
          <div style={{ paddingTop: '16px' }}>
            <TextField
              fullWidth
              label="Food Name"
              value={currentFood.name}
              onChange={(e) => setCurrentFood({ ...currentFood, name: e.target.value })}
              sx={{ mb: 2 }}
            />

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={currentFood.category}
                onChange={(e) => setCurrentFood({ ...currentFood, category: e.target.value })}
                label="Category"
              >
                {categories.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {cat}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Price (₹)"
              type="number"
              value={currentFood.price}
              onChange={(e) => setCurrentFood({ ...currentFood, price: parseFloat(e.target.value) })}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={currentFood.description}
              onChange={(e) => setCurrentFood({ ...currentFood, description: e.target.value })}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Image URL"
              value={currentFood.imageUrl}
              onChange={(e) => setCurrentFood({ ...currentFood, imageUrl: e.target.value })}
              sx={{ mb: 2 }}
              helperText="Enter a URL for the food image"
            />

            <TextField
              fullWidth
              label="3D Model URL (.glb file)"
              value={currentFood.modelUrl || ''}
              onChange={(e) => setCurrentFood({ ...currentFood, modelUrl: e.target.value })}
              sx={{ mb: 2 }}
              helperText="Enter a URL for the GLB 3D model file (optional)"
              InputProps={{
                startAdornment: <ViewInArIcon sx={{ mr: 1, color: 'action.active' }} />,
              }}
            />

            <Button
              variant="outlined"
              component="label"
              startIcon={<UploadFileIcon />}
              sx={{ mb: 2 }}
              fullWidth
            >
              Upload GLB File
              <input
                type="file"
                hidden
                accept=".glb,.gltf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    // For demo purposes, show file name. In production, upload to server/cloud storage
                    const reader = new FileReader();
                    reader.onload = () => {
                      alert(`File selected: ${file.name}\nIn production, this would upload to cloud storage.`);
                      // Here you would upload the file to your server or cloud storage
                      // and get back a URL to store in modelUrl
                    };
                    reader.readAsArrayBuffer(file);
                  }
                }}
              />
            </Button>

            <div style={{ display: 'flex', gap: '16px' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={currentFood.isVeg}
                    onChange={(e) => setCurrentFood({ ...currentFood, isVeg: e.target.checked })}
                  />
                }
                label="Vegetarian"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={currentFood.isAvailable}
                    onChange={(e) => setCurrentFood({ ...currentFood, isAvailable: e.target.checked })}
                  />
                }
                label="Available"
              />
            </div>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            sx={{
              background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
            }}
          >
            {editMode ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminFoodManagement;
