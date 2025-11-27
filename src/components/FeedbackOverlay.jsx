import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Rating,
  TextField,
  Button,
  IconButton,
  Divider,
  Stack,
  Alert,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import StarIcon from '@mui/icons-material/Star';

const FeedbackOverlay = ({ order, onClose, onSubmit }) => {
  const [ratings, setRatings] = useState({});
  const [feedbacks, setFeedbacks] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Initialize ratings for all items
  React.useEffect(() => {
    if (order?.items) {
      const initialRatings = {};
      const initialFeedbacks = {};
      order.items.forEach(item => {
        if (item.foodId?._id) {
          initialRatings[item.foodId._id] = 5;
          initialFeedbacks[item.foodId._id] = '';
        }
      });
      setRatings(initialRatings);
      setFeedbacks(initialFeedbacks);
    }
  }, [order]);

  const handleRatingChange = (foodId, value) => {
    setRatings(prev => ({ ...prev, [foodId]: value }));
  };

  const handleFeedbackChange = (foodId, value) => {
    setFeedbacks(prev => ({ ...prev, [foodId]: value }));
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError('');

      // Prepare feedback data for each item
      const itemFeedbacks = order.items
        .filter(item => item.foodId?._id)
        .map(item => ({
          foodId: item.foodId._id,
          foodName: item.foodId.name || item.name,
          rating: ratings[item.foodId._id] || 5,
          feedback: feedbacks[item.foodId._id] || '',
        }));

      await onSubmit({
        orderId: order._id,
        orderNumber: order.orderNumber,
        itemFeedbacks,
      });

      onClose();
    } catch (err) {
      console.error('Submit feedback error:', err);
      setError('Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!order) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: 2,
      }}
    >
      <Paper
        elevation={24}
        sx={{
          maxWidth: 600,
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          borderRadius: 3,
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <Box
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            p: 3,
            position: 'sticky',
            top: 0,
            zIndex: 1,
          }}
        >
          <IconButton
            onClick={onClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: 'white',
            }}
          >
            <CloseIcon />
          </IconButton>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            Rate Your Order
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            Order #{order.orderNumber}
          </Typography>
        </Box>

        {/* Content */}
        <Box sx={{ p: 3 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <RestaurantIcon color="primary" />
            How was your food?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Please rate each item in your order
          </Typography>

          <Stack spacing={3}>
            {order.items?.map((item, index) => {
              const foodId = item.foodId?._id;
              if (!foodId) return null;

              return (
                <Paper
                  key={foodId}
                  elevation={2}
                  sx={{
                    p: 2.5,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    transition: 'all 0.3s',
                    '&:hover': {
                      borderColor: 'primary.main',
                      transform: 'translateY(-2px)',
                      boxShadow: 4,
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    {item.foodId?.imageUrl && (
                      <Box
                        component="img"
                        src={item.foodId.imageUrl}
                        alt={item.foodId.name || item.name}
                        sx={{
                          width: 60,
                          height: 60,
                          borderRadius: 2,
                          objectFit: 'cover',
                          mr: 2,
                        }}
                      />
                    )}
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {item.foodId?.name || item.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Quantity: {item.quantity}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                    <Rating
                      value={ratings[foodId] || 5}
                      onChange={(e, newValue) => handleRatingChange(foodId, newValue)}
                      size="large"
                      icon={<StarIcon fontSize="inherit" />}
                      emptyIcon={<StarIcon fontSize="inherit" />}
                      sx={{
                        '& .MuiRating-iconFilled': {
                          color: '#fbbf24',
                        },
                      }}
                    />
                    <Typography variant="body2" sx={{ ml: 1, fontWeight: 'medium' }}>
                      {ratings[foodId] || 5}/5
                    </Typography>
                  </Box>

                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    placeholder="Tell us what you think about this dish..."
                    value={feedbacks[foodId] || ''}
                    onChange={(e) => handleFeedbackChange(foodId, e.target.value)}
                    variant="outlined"
                    size="small"
                    autoComplete="off"
                    InputProps={{
                      style: { cursor: 'text' }
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1.5,
                        cursor: 'text',
                      },
                      '& .MuiInputBase-input': {
                        cursor: 'text',
                      },
                    }}
                  />
                </Paper>
              );
            })}
          </Stack>

          <Divider sx={{ my: 3 }} />

          {/* Submit Button */}
          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={handleSubmit}
            disabled={submitting}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              py: 1.5,
              borderRadius: 2,
              fontWeight: 'bold',
              fontSize: '1rem',
              '&:hover': {
                background: 'linear-gradient(135deg, #5568d3 0%, #63408a 100%)',
              },
            }}
          >
            {submitting ? 'Submitting...' : 'Submit Feedback'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default FeedbackOverlay;
