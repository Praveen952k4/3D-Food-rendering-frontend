import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Switch,
  FormControlLabel,
  IconButton,
  Typography,
  Box,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import ViewInArIcon from '@mui/icons-material/ViewInAr';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

const categories = [
  'Starters',
  'Tandoori',
  'Indian',
  'Special Platter',
  'Biryani',
  'Desserts',
  'Beverages',
];

const FoodDialog = ({ open, onClose, food, setFood, onSave, editMode, loading }) => {
  const [newIngredient, setNewIngredient] = useState({ name: '', quantity: '' });

  const handleAddIngredient = () => {
    if (newIngredient.name && newIngredient.quantity) {
      const ingredients = food.ingredients || [];
      setFood({ ...food, ingredients: [...ingredients, { ...newIngredient }] });
      setNewIngredient({ name: '', quantity: '' });
    }
  };

  const handleRemoveIngredient = (index) => {
    const ingredients = [...(food.ingredients || [])];
    ingredients.splice(index, 1);
    setFood({ ...food, ingredients });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {editMode ? 'Edit Food Item' : 'Add New Food Item'}
      </DialogTitle>
      <DialogContent>
        <div style={{ paddingTop: '16px' }}>
          <TextField
            fullWidth
            label="Food Name"
            value={food.name}
            onChange={(e) => setFood({ ...food, name: e.target.value })}
            sx={{ mb: 2 }}
          />

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={food.category}
              onChange={(e) => setFood({ ...food, category: e.target.value })}
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
            value={food.price}
            onChange={(e) => setFood({ ...food, price: parseFloat(e.target.value) })}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Description"
            multiline
            rows={3}
            value={food.description}
            onChange={(e) => setFood({ ...food, description: e.target.value })}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Calories"
            type="number"
            value={food.calories || 0}
            onChange={(e) => setFood({ ...food, calories: parseInt(e.target.value) || 0 })}
            sx={{ mb: 2 }}
            helperText="Enter calorie count (kcal) - Required"
            required
            error={!food.calories || food.calories === 0}
          />

          {/* Ingredients Section */}
          <Box sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: '8px' }}>
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
              Ingredients
            </Typography>
            
            {/* Existing Ingredients */}
            {food.ingredients && food.ingredients.length > 0 && (
              <Box sx={{ mb: 2 }}>
                {food.ingredients.map((ingredient, index) => (
                  <Box 
                    key={index} 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1, 
                      mb: 1,
                      p: 1,
                      backgroundColor: '#f5f5f5',
                      borderRadius: '4px',
                    }}
                  >
                    <Typography variant="body2" sx={{ flex: 1 }}>
                      {ingredient.name} - {ingredient.quantity}
                    </Typography>
                    <IconButton 
                      size="small" 
                      color="error" 
                      onClick={() => handleRemoveIngredient(index)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            )}

            {/* Add New Ingredient */}
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                size="small"
                label="Ingredient Name"
                value={newIngredient.name}
                onChange={(e) => setNewIngredient({ ...newIngredient, name: e.target.value })}
                sx={{ flex: 2 }}
              />
              <TextField
                size="small"
                label="Quantity"
                value={newIngredient.quantity}
                onChange={(e) => setNewIngredient({ ...newIngredient, quantity: e.target.value })}
                sx={{ flex: 1 }}
                placeholder="e.g., 100g"
              />
              <IconButton 
                color="primary" 
                onClick={handleAddIngredient}
                disabled={!newIngredient.name || !newIngredient.quantity}
              >
                <AddIcon />
              </IconButton>
            </Box>
          </Box>

          <TextField
            fullWidth
            label="Image URL"
            value={food.imageUrl}
            onChange={(e) => setFood({ ...food, imageUrl: e.target.value })}
            sx={{ mb: 2 }}
            helperText="Enter a URL for the food image"
          />

          <TextField
            fullWidth
            label="3D Model URL (.glb file)"
            value={food.modelUrl || ''}
            onChange={(e) => setFood({ ...food, modelUrl: e.target.value })}
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
                  const reader = new FileReader();
                  reader.onload = () => {
                    alert(`File selected: ${file.name}\nIn production, this would upload to cloud storage.`);
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
                  checked={food.isVeg}
                  onChange={(e) => setFood({ ...food, isVeg: e.target.checked })}
                />
              }
              label="Vegetarian"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={food.isAvailable}
                  onChange={(e) => setFood({ ...food, isAvailable: e.target.checked })}
                />
              }
              label="Available"
            />
          </div>
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button
          onClick={onSave}
          variant="contained"
          disabled={loading}
          sx={{
            background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
          }}
        >
          {editMode ? 'Update' : 'Add'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FoodDialog;
