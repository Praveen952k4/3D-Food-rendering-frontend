import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Grid,
  Card,
  CardContent,
  Rating,
  Chip,
  Divider,
  Tab,
  Tabs,
  CircularProgress,
  Avatar,
} from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import FeedbackIcon from '@mui/icons-material/Feedback';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import { getAllFeedback, getFeedbackStats } from '../../services/api';

const FeedbackManagement = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [feedbackRes, statsRes] = await Promise.all([
        getAllFeedback(),
        getFeedbackStats(),
      ]);

      setFeedbacks(feedbackRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error fetching feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredFeedbacks = () => {
    if (tabValue === 0) return feedbacks;
    if (tabValue === 1) return feedbacks.filter(f => f.shopRating >= 4);
    if (tabValue === 2) return feedbacks.filter(f => f.shopRating < 4);
    return feedbacks;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight={700} mb={3}>
        Customer Feedback
      </Typography>

      {/* Statistics Cards */}
      {stats && (
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" fontWeight={700}>
                      {stats.totalFeedback}
                    </Typography>
                    <Typography variant="body2">Total Feedback</Typography>
                  </Box>
                  <FeedbackIcon sx={{ fontSize: 48, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" fontWeight={700}>
                      {stats.avgShopRating.toFixed(1)}
                    </Typography>
                    <Typography variant="body2">Avg Shop Rating</Typography>
                  </Box>
                  <StarIcon sx={{ fontSize: 48, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" fontWeight={700}>
                      {stats.avgServiceQuality.toFixed(1)}
                    </Typography>
                    <Typography variant="body2">Service Quality</Typography>
                  </Box>
                  <TrendingUpIcon sx={{ fontSize: 48, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" fontWeight={700}>
                      {stats.avgDeliverySpeed.toFixed(1)}
                    </Typography>
                    <Typography variant="body2">Delivery Speed</Typography>
                  </Box>
                  <RestaurantIcon sx={{ fontSize: 48, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(e, v) => setTabValue(v)}
          sx={{
            '& .MuiTab-root': { fontWeight: 600 },
          }}
        >
          <Tab label={`All (${feedbacks.length})`} />
          <Tab label={`Positive (${feedbacks.filter(f => f.shopRating >= 4).length})`} />
          <Tab label={`Needs Attention (${feedbacks.filter(f => f.shopRating < 4).length})`} />
        </Tabs>
      </Paper>

      {/* Feedback List */}
      <Grid container spacing={3}>
        {filteredFeedbacks().map((feedback) => (
          <Grid item xs={12} key={feedback._id}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: '#667eea' }}>
                    {feedback.userId?.name?.charAt(0) || 'U'}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {feedback.userId?.name || 'Anonymous'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Order #{feedback.orderNumber} • {new Date(feedback.createdAt).toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
                <Chip
                  label={feedback.shopRating >= 4 ? 'Positive' : 'Needs Attention'}
                  color={feedback.shopRating >= 4 ? 'success' : 'warning'}
                  size="small"
                />
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Shop Feedback */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  Overall Shop Experience
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <Rating value={feedback.shopRating} readOnly size="small" />
                  <Typography variant="body2" color="text.secondary">
                    {feedback.shopRating}/5
                  </Typography>
                </Box>
                {feedback.shopFeedback && (
                  <Paper sx={{ p: 2, bgcolor: '#f9fafb', mt: 1 }}>
                    <Typography variant="body2">{feedback.shopFeedback}</Typography>
                  </Paper>
                )}
              </Box>

              {/* Service Metrics */}
              <Grid container spacing={2} mb={3}>
                <Grid item xs={6}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Service Quality
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Rating value={feedback.serviceQuality} readOnly size="small" />
                      <Typography variant="caption">{feedback.serviceQuality}/5</Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Delivery Speed
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Rating value={feedback.deliverySpeed} readOnly size="small" />
                      <Typography variant="caption">{feedback.deliverySpeed}/5</Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>

              {/* Item Feedbacks */}
              {feedback.itemFeedbacks && feedback.itemFeedbacks.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Item Ratings
                  </Typography>
                  <Grid container spacing={2}>
                    {feedback.itemFeedbacks.map((item, idx) => (
                      <Grid item xs={12} sm={6} md={4} key={idx}>
                        <Paper sx={{ p: 2, bgcolor: '#f0f9ff', border: '1px solid #bae6fd' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            {item.foodId?.imageUrl && (
                              <Avatar
                                src={item.foodId.imageUrl}
                                sx={{ width: 32, height: 32 }}
                              />
                            )}
                            <Typography variant="body2" fontWeight={600} noWrap>
                              {item.foodName}
                            </Typography>
                          </Box>
                          <Rating value={item.rating} readOnly size="small" />
                          {item.comment && (
                            <Typography variant="caption" display="block" mt={1} color="text.secondary">
                              {item.comment}
                            </Typography>
                          )}
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}
            </Paper>
          </Grid>
        ))}
      </Grid>

      {filteredFeedbacks().length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">No feedback available</Typography>
        </Paper>
      )}
    </Container>
  );
};

export default FeedbackManagement;
