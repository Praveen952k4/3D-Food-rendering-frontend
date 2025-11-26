import React from 'react';
import { Grid, Card, CardContent, Typography, Chip } from '@mui/material';
import { Star } from '@mui/icons-material';
import { format } from 'date-fns';

const FeedbackSection = ({ feedbackSummary }) => {
  if (!feedbackSummary || !feedbackSummary.recentFeedback || feedbackSummary.recentFeedback.length === 0) {
    return null;
  }

  return (
    <Grid container spacing={2} mt={1}>
      {feedbackSummary.recentFeedback.slice(0, 6).map((order) => (
        <Grid item xs={12} md={6} key={order._id}>
          <Card sx={{ bgcolor: '#f8f9fa' }}>
            <CardContent>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <Typography variant="body2" fontWeight="bold">
                    {order.customerName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Order: {order.orderNumber}
                  </Typography>
                </div>
                <Chip
                  label={order.rating}
                  icon={<Star sx={{ fontSize: 16 }} />}
                  size="small"
                  sx={{
                    bgcolor: '#667eea',
                    color: 'white',
                    '& .MuiChip-icon': { color: 'white' },
                  }}
                />
              </div>
              {order.customerFeedback && (
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  "{order.customerFeedback}"
                </Typography>
              )}
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                {format(new Date(order.feedbackDate), 'MMM dd, yyyy')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default FeedbackSection;
