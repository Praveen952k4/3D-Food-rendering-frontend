import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Grid,
  Rating,
  Chip,
  Paper,
  Divider,
  CircularProgress,
  Alert,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Pagination,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import StarIcon from '@mui/icons-material/Star';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import { getItemsWithRatings } from '../../services/api';

const FoodRatings = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [foodItems, setFoodItems] = useState([]);
  const [stats, setStats] = useState({ totalItems: 0, avgRating: 0 });
  const [page, setPage] = useState(1);
  const [itemsPerPage] = useState(6);

  useEffect(() => {
    fetchRatings();
  }, []);

  const fetchRatings = async () => {
    try {
      setLoading(true);
      const response = await getItemsWithRatings();
      console.log('Food ratings response:', response.data);
      
      if (response.data.success) {
        const items = response.data.items || [];
        console.log('Food items with ratings:', items);
        
        // Log feedback details for debugging
        items.forEach(item => {
          console.log(`${item.name} - Feedbacks:`, item.recentFeedbacks);
        });
        
        setFoodItems(items);
        
        // Calculate stats
        const totalRatings = items.reduce((sum, item) => sum + item.totalRatings, 0);
        const avgRating = items.length > 0
          ? items.reduce((sum, item) => sum + item.averageRating, 0) / items.length
          : 0;
        
        setStats({
          totalItems: items.length,
          totalRatings,
          avgRating: avgRating.toFixed(1),
        });
      }
    } catch (err) {
      console.error('Failed to fetch ratings:', err);
      setError('Failed to load food ratings');
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (foodItems.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">
          No rated food items yet. Ratings will appear here once customers submit feedback.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <RestaurantIcon fontSize="large" />
          Food Ratings & Reviews
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Customer feedback for delivered orders
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 3, textAlign: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <Typography variant="h3" sx={{ color: 'white', fontWeight: 'bold' }}>
              {stats.totalItems}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
              Rated Items
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 3, textAlign: 'center', background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
              <Typography variant="h3" sx={{ color: 'white', fontWeight: 'bold' }}>
                {stats.avgRating}
              </Typography>
              <StarIcon sx={{ color: '#fbbf24', fontSize: 40 }} />
            </Box>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
              Average Rating
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 3, textAlign: 'center', background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
            <Typography variant="h3" sx={{ color: 'white', fontWeight: 'bold' }}>
              {stats.totalRatings}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
              Total Reviews
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Food Items Grid */}
      <Grid container spacing={3}>
        {paginatedItems.map((item) => (
          <Grid item xs={12} sm={6} md={4} key={item._id}>
            <Card 
              elevation={3}
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.3s',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: 6,
                },
              }}
            >
              {item.imageUrl && (
                <CardMedia
                  component="img"
                  height="200"
                  image={item.imageUrl}
                  alt={item.name}
                  sx={{ objectFit: 'cover' }}
                />
              )}
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  {item.name}
                </Typography>
                <Chip 
                  label={item.category} 
                  size="small" 
                  sx={{ mb: 2 }}
                  color="primary"
                  variant="outlined"
                />
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Rating 
                    value={item.averageRating} 
                    precision={0.1} 
                    readOnly 
                    size="large"
                    icon={<StarIcon fontSize="inherit" />}
                    emptyIcon={<StarIcon fontSize="inherit" />}
                    sx={{
                      '& .MuiRating-iconFilled': {
                        color: '#fbbf24',
                      },
                    }}
                  />
                  <Typography variant="body2" sx={{ ml: 1, fontWeight: 'bold' }}>
                    {item.averageRating.toFixed(1)}/5
                  </Typography>
                </Box>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Based on {item.totalRatings} review{item.totalRatings !== 1 ? 's' : ''}
                </Typography>

                {item.recentFeedbacks && item.recentFeedbacks.length > 0 && (
                  <Accordion sx={{ mt: 2 }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="body2" fontWeight="medium">
                        Recent Feedback ({item.recentFeedbacks.length})
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Stack spacing={2}>
                        {item.recentFeedbacks.map((feedback, index) => (
                          <Box key={index}>
                            {index > 0 && <Divider sx={{ mb: 2 }} />}
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                              <Rating 
                                value={feedback.rating} 
                                readOnly 
                                size="small"
                                icon={<StarIcon fontSize="inherit" />}
                                emptyIcon={<StarIcon fontSize="inherit" />}
                                sx={{
                                  '& .MuiRating-iconFilled': {
                                    color: '#fbbf24',
                                  },
                                }}
                              />
                              <Typography variant="caption" sx={{ ml: 1 }}>
                                {new Date(feedback.createdAt).toLocaleDateString()}
                              </Typography>
                            </Box>
                            {feedback.review && feedback.review.trim() !== '' ? (
                              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                "{feedback.review}"
                              </Typography>
                            ) : (
                              <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic', fontSize: '0.85rem' }}>
                                No written feedback provided
                              </Typography>
                            )}
                          </Box>
                        ))}
                      </Stack>
                    </AccordionDetails>
                  </Accordion>
                )}
              </CardContent>
            </Card>
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
    </Box>
  );
};

export default FoodRatings;
