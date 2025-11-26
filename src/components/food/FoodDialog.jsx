import React from 'react';
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
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import ViewInArIcon from '@mui/icons-material/ViewInAr';

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
