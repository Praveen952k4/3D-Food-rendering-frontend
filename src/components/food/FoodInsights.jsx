import React, { useEffect, useState } from 'react';
import { Box, Chip, Divider, Rating, Typography } from '@mui/material';
import { Schedule, Insights } from '@mui/icons-material';
import { getFoodItem, getItemRatings } from '../../services/api';
import { SkeletonText } from '../ui/Loaders';

/**
 * What this dish actually takes, and what people thought of it.
 *
 * The preparation time here is measured, not typed in: it is the average gap
 * between the kitchen starting this dish and it being ready, across the
 * orders it has been on. The admin's own figure is an estimate used to quote
 * a wait before anything is cooked — useful, but it is a promise rather than
 * a record, so the two are shown side by side and only one of them can be
 * edited.
 */
const FoodInsights = ({ foodId, estimateMinutes }) => {
  const [actual, setActual] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!foodId) return undefined;
    let cancelled = false;
    setLoading(true);

    Promise.allSettled([getFoodItem(foodId), getItemRatings(foodId)]).then(([detail, ratings]) => {
      if (cancelled) return;
      if (detail.status === 'fulfilled') setActual(detail.value.data.actualPrepTime || null);
      // Ratings need a signed-in diner; a guest without them simply sees no
      // reviews rather than an error.
      if (ratings.status === 'fulfilled') setFeedback(ratings.value.data.foodItem || null);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [foodId]);

  if (loading) return <SkeletonText lines={3} />;

  const measured = actual?.sampleSize ? actual : null;
  const reviews = (feedback?.ratings || []).filter((r) => r.review);

  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      {/* ------------------------------------------- what it actually takes */}
      <Box
        sx={{
          p: 1.75,
          borderRadius: 'var(--ad-radius-sm)',
          border: '1px solid var(--ad-line)',
          bgcolor: 'var(--ad-surface)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
          <Insights sx={{ fontSize: 16, color: 'var(--ad-ember)' }} />
          <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: '.04em' }}>
            PREPARATION TIME
          </Typography>
        </Box>

        {measured ? (
          <>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
              <Typography sx={{ fontSize: 26, fontWeight: 700, color: 'var(--ad-ember)' }}>
                {measured.averageMinutes} min
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                average, measured
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block' }}>
              From {measured.sampleSize} order{measured.sampleSize === 1 ? '' : 's'} the kitchen has
              cooked · fastest {measured.fastestMinutes} min, slowest {measured.slowestMinutes} min
            </Typography>
          </>
        ) : (
          <>
            <Typography sx={{ fontSize: 20, fontWeight: 700 }}>
              {estimateMinutes ?? 15} min
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block' }}>
              The kitchen's estimate — no cooked orders to measure yet.
            </Typography>
          </>
        )}

        {measured && estimateMinutes !== undefined && estimateMinutes !== null && (
          <Chip
            icon={<Schedule sx={{ fontSize: 13 }} />}
            label={`Kitchen quotes ${estimateMinutes} min`}
            size="small"
            sx={{
              mt: 1,
              bgcolor: 'var(--ad-saffron-wash)',
              color: 'var(--ad-warn)',
              fontWeight: 600,
              '& .MuiChip-icon': { color: 'inherit' },
            }}
          />
        )}
      </Box>

      {/* ------------------------------------------------ what people said */}
      {feedback && feedback.totalRatings > 0 && (
        <Box
          sx={{
            p: 1.75,
            borderRadius: 'var(--ad-radius-sm)',
            border: '1px solid var(--ad-line)',
            bgcolor: 'var(--ad-surface)',
          }}
        >
          <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: '.04em' }}>
            WHAT DINERS SAID
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1, mb: reviews.length ? 1.5 : 0 }}>
            <Typography sx={{ fontSize: 24, fontWeight: 700 }}>
              {Number(feedback.averageRating || 0).toFixed(1)}
            </Typography>
            <Box>
              <Rating value={Number(feedback.averageRating) || 0} precision={0.1} size="small" readOnly />
              <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block' }}>
                {feedback.totalRatings} rating{feedback.totalRatings === 1 ? '' : 's'}
              </Typography>
            </Box>
          </Box>

          {reviews.slice(0, 3).map((review, index) => (
            <Box key={review._id || index}>
              {index > 0 && <Divider sx={{ my: 1 }} />}
              <Rating value={review.rating} size="small" readOnly />
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                “{review.review}”
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                {review.userId?.name || 'A diner'}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default FoodInsights;
