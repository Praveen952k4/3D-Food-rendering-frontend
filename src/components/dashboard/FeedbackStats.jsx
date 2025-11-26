import React from 'react';
import { Grid, Card, CardContent, Typography, Rating } from '@mui/material';
import { Star, RateReview } from '@mui/icons-material';

const FeedbackStats = ({ feedbackSummary }) => {
  if (!feedbackSummary || !feedbackSummary.summary) {
    return null;
  }

  return (
    <Grid container spacing={3} mb={4}>
      <Grid item xs={12} md={4}>
        <Card
          sx={{
            height: '100%',
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            color: 'white',
          }}
        >
          <CardContent>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Typography variant="body2" style={{ opacity: 0.9 }}>
                  Average Rating
                </Typography>
                <div style={{ display: 'flex', alignItems: 'center', marginTop: 8 }}>
                  <Typography variant="h3" fontWeight="bold">
                    {feedbackSummary.summary.avgRating.toFixed(1)}
                  </Typography>
                  <Star sx={{ fontSize: 32, ml: 1 }} />
                </div>
                <Rating
                  value={feedbackSummary.summary.avgRating}
                  readOnly
                  precision={0.1}
                  sx={{ mt: 1 }}
                />
              </div>
              <div
                style={{
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  borderRadius: '50%',
                  padding: '16px',
                }}
              >
                <Star fontSize="large" />
              </div>
            </div>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={4}>
        <Card
          sx={{
            height: '100%',
            background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            color: 'white',
          }}
        >
          <CardContent>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Typography variant="body2" style={{ opacity: 0.9 }}>
                  Total Feedback
                </Typography>
                <Typography variant="h3" fontWeight="bold" sx={{ mt: 1 }}>
                  {feedbackSummary.summary.totalFeedback}
                </Typography>
                <Typography variant="caption" style={{ opacity: 0.8, marginTop: 8 }}>
                  Customer reviews
                </Typography>
              </div>
              <div
                style={{
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  borderRadius: '50%',
                  padding: '16px',
                }}
              >
                <RateReview fontSize="large" />
              </div>
            </div>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={4}>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Rating Distribution
            </Typography>
            <div style={{ marginTop: 16 }}>
              {[5, 4, 3, 2, 1].map((rating) => (
                <div key={rating} style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                  <Typography variant="body2" sx={{ minWidth: 30 }}>
                    {rating}★
                  </Typography>
                  <div
                    style={{
                      flex: 1,
                      height: 8,
                      backgroundColor: '#f0f0f0',
                      borderRadius: 4,
                      margin: '0 8px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        backgroundColor: '#667eea',
                        width: `${
                          feedbackSummary.summary.totalFeedback > 0
                            ? (feedbackSummary.summary.ratingDistribution[rating] /
                                feedbackSummary.summary.totalFeedback) *
                              100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  <Typography variant="body2" sx={{ minWidth: 30 }}>
                    {feedbackSummary.summary.ratingDistribution[rating] || 0}
                  </Typography>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default FeedbackStats;
