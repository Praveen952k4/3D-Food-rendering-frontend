import React from 'react';
import { Box } from '@mui/material';

/**
 * Shared loading affordances, built on the `.ad-sk` / `.ad-spinner` classes in
 * styles/theme.css so every portal shimmers the same way in light and dark.
 */

/** A shimmering block. Size it with `width` / `height`. */
export const Skeleton = ({ width = '100%', height = 12, radius, sx, ...rest }) => (
  <Box
    className="ad-sk"
    aria-hidden="true"
    sx={{ width, height, borderRadius: radius, ...sx }}
    {...rest}
  />
);

/** A stack of shimmering text lines, the last one short. */
export const SkeletonText = ({ lines = 3, gap = 1, widths }) => (
  <Box sx={{ display: 'grid', gap }}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        height={11}
        width={widths?.[i] || (i === lines - 1 ? '60%' : '100%')}
      />
    ))}
  </Box>
);

/** Card-shaped placeholders for a grid of tiles. */
export const SkeletonCards = ({ count = 6, height = 150, columns = 'repeat(auto-fill, minmax(260px, 1fr))' }) => (
  <Box sx={{ display: 'grid', gridTemplateColumns: columns, gap: 2 }}>
    {Array.from({ length: count }).map((_, i) => (
      <Box
        key={i}
        sx={{
          border: '1px solid var(--ad-line)',
          borderRadius: 'var(--ad-radius-lg)',
          bgcolor: 'var(--ad-surface)',
          p: 2.5,
        }}
      >
        <Skeleton height={14} width="45%" />
        <Box sx={{ mt: 2 }}>
          <SkeletonText lines={3} />
        </Box>
        <Box sx={{ mt: 2 }}>
          <Skeleton height={height - 96 > 20 ? height - 96 : 24} radius="14px" />
        </Box>
      </Box>
    ))}
  </Box>
);

/** Placeholder sized like a chart panel. */
export const SkeletonChart = ({ height = 260 }) => (
  <Box>
    <Skeleton height={13} width="32%" />
    <Box sx={{ mt: 2.5, display: 'flex', alignItems: 'flex-end', gap: 1, height }}>
      {[62, 38, 84, 50, 73, 44, 92, 58, 36, 70, 48, 80].map((h, i) => (
        <Skeleton key={i} height={`${h}%`} radius="8px" sx={{ flex: 1 }} />
      ))}
    </Box>
  </Box>
);

/** Small inline spinner with a caption, for refreshes and polled data. */
export const LoadingNote = ({ children = 'Loading…' }) => (
  <div className="ad-loading-note" role="status">
    <span className="ad-spinner" aria-hidden="true" />
    {children}
  </div>
);

/** Full-panel loading state. */
export const LoadingPanel = ({ children = 'Loading…', minHeight = '60vh' }) => (
  <Box
    role="status"
    sx={{
      minHeight,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
      color: 'text.secondary',
      fontSize: 14,
    }}
  >
    <span className="ad-spinner is-lg" aria-hidden="true" />
    {children}
  </Box>
);

export default Skeleton;
