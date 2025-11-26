import React from 'react';
import {
  Card,
  CardMedia,
  CardContent,
  Typography,
  Chip,
  IconButton,
  FormControlLabel,
  Switch,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const FoodCard = ({ food, onEdit, onDelete, onToggleAvailability }) => {
  return (
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
                onChange={() => onToggleAvailability(food)}
                size="small"
              />
            }
            label={<Typography variant="caption">Available</Typography>}
          />
          <div>
            <IconButton
              size="small"
              color="primary"
              onClick={() => onEdit(food)}
            >
              <EditIcon />
            </IconButton>
            <IconButton
              size="small"
              color="error"
              onClick={() => onDelete(food._id)}
            >
              <DeleteIcon />
            </IconButton>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FoodCard;
