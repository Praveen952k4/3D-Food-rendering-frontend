import React from 'react';
import { Box, Chip, Typography } from '@mui/material';
import { Panel } from './OverviewCharts';

/**
 * How long each dish really takes, measured rather than promised.
 *
 * The clock runs from the moment staff confirm the order to the moment it
 * reaches the table — the wait the diner actually sat through, not the
 * kitchen's share of it. Every dish on a ticket carries the same gap,
 * because the ticket goes in whole and comes out whole.
 *
 * The menu's own estimate sits beside it where there is one, since the
 * useful question is rarely "how long?" on its own: it is whether the number
 * being quoted to diners is the truth.
 */

/** Slower than quoted is worth seeing; faster is not a problem. */
const toneFor = (actual, quoted) => {
  if (!quoted) return { color: 'var(--ad-text-3)', label: null };
  const over = actual - quoted;
  if (over > quoted * 0.5) return { color: 'var(--ad-ember)', label: `${Math.round(over)} min over` };
  if (over > 0) return { color: 'var(--ad-warn)', label: `${Math.round(over)} min over` };
  return { color: 'var(--ad-basil)', label: 'within quote' };
};

const DishTimings = ({ rows = [], loading }) => {
  const slowest = rows.reduce((longest, row) => Math.max(longest, row.averageMinutes), 0);

  return (
    <Panel
      title="How long each dish takes"
      subtitle="Confirmed to served, averaged over this period"
      loading={loading}
      isEmpty={rows.length === 0}
      emptyText="No order has been confirmed and served yet in this period."
      height={rows.length ? undefined : 180}
    >
      <Box sx={{ display: 'grid', gap: 1.75 }}>
        {rows.map((row) => {
          const tone = toneFor(row.averageMinutes, row.quotedMinutes);
          return (
            <Box key={row.name}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'baseline', mb: 0.5 }}>
                <Typography variant="body2" sx={{ flex: 1, fontWeight: 600 }}>
                  {row.name}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {row.averageMinutes} min
                </Typography>
              </Box>

              <Box sx={{ height: 6, borderRadius: 99, bgcolor: 'var(--ad-bg-2)', overflow: 'hidden' }}>
                <Box
                  sx={{
                    height: '100%',
                    width: `${slowest ? Math.max((row.averageMinutes / slowest) * 100, 2) : 0}%`,
                    bgcolor: tone.color,
                  }}
                />
              </Box>

              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 0.6, flexWrap: 'wrap' }}>
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                  {row.orders} order{row.orders === 1 ? '' : 's'} · {row.fastestMinutes}–
                  {row.slowestMinutes} min
                  {row.quotedMinutes ? ` · menu says ${row.quotedMinutes}` : ''}
                </Typography>
                {tone.label && (
                  <Chip
                    size="small"
                    label={tone.label}
                    sx={{
                      height: 18,
                      fontSize: 11,
                      fontWeight: 600,
                      color: tone.color,
                      bgcolor: 'var(--ad-bg-2)',
                    }}
                  />
                )}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Panel>
  );
};

export default DishTimings;
