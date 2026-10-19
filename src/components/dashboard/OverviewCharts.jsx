import React, { useMemo } from 'react';
import { Box, Grid, Paper, Typography } from '@mui/material';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { useChartTheme, ChartTooltip } from './chartTheme';
import { formatINR } from '../../config/business';
import { FONT_DISPLAY } from '../../theme/muiTheme';
import { SkeletonChart } from '../ui/Loaders';

/** A chart panel with a heading, and its own loading / empty states. */
export const Panel = ({ title, subtitle, action, loading, isEmpty, emptyText, height = 280, children }) => (
  <Paper sx={{ p: { xs: 2, sm: 3 }, height: '100%', display: 'flex', flexDirection: 'column' }}>
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 19 }}>{title}</Typography>
        {subtitle && (
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {action && <Box sx={{ ml: 'auto' }}>{action}</Box>}
    </Box>

    {loading ? (
      <SkeletonChart height={height - 40} />
    ) : isEmpty ? (
      <Box
        sx={{
          flex: 1,
          minHeight: height,
          display: 'grid',
          placeItems: 'center',
          textAlign: 'center',
          color: 'text.disabled',
          border: '1px dashed var(--ad-line-strong)',
          borderRadius: 'var(--ad-radius)',
          px: 3,
          fontSize: 13.5,
        }}
      >
        {emptyText || 'Nothing to show for this period yet.'}
      </Box>
    ) : (
      <Box sx={{ flex: 1 }}>{children}</Box>
    )}
  </Paper>
);

/** Turn a series bucket key into a short axis label for the chosen bucket. */
const labelFor = (key, bucket) => {
  try {
    if (bucket === 'month') return format(parseISO(`${key}-01`), 'MMM yy');
    return format(parseISO(key), bucket === 'week' ? 'dd MMM' : 'dd MMM');
  } catch {
    return key;
  }
};

const OverviewCharts = ({ overview, loading }) => {
  const c = useChartTheme();

  const series = useMemo(
    () =>
      (overview?.series || []).map((p) => ({
        ...p,
        label: labelFor(p.key, overview?.bucket || 'day'),
      })),
    [overview]
  );

  const hasActivity = series.some((p) => p.orders > 0 || p.revenue > 0);
  const topDishes = overview?.topDishes || [];
  const categories = overview?.categoryBreakdown || [];
  const money = (v) => formatINR(v, false);

  return (
    <Grid container spacing={3}>
      {/* Revenue over time */}
      <Grid item xs={12} lg={8}>
        <Panel
          title="Revenue"
          subtitle={`${overview?.rangeLabel || ''} · paid orders, GST inclusive`}
          loading={loading}
          isEmpty={!hasActivity}
          emptyText="No paid orders in this period. Pick a wider range to see the trend."
          height={300}
        >
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={series} margin={{ top: 6, right: 8, left: -14, bottom: 0 }}>
              <defs>
                <linearGradient id="adRevenueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={c.revenue} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={c.revenue} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={c.grid} vertical={false} />
              <XAxis dataKey="label" tick={c.tick} tickLine={false} axisLine={{ stroke: c.grid }} minTickGap={16} />
              <YAxis tick={c.tick} tickLine={false} axisLine={false} width={64} tickFormatter={money} />
              <Tooltip content={<ChartTooltip formatter={(v) => formatINR(v)} />} cursor={{ stroke: c.grid }} />
              <Area
                type="monotone"
                dataKey="revenue"
                name="Revenue"
                stroke={c.revenue}
                strokeWidth={2.4}
                fill="url(#adRevenueFill)"
              />
              <Area
                type="monotone"
                dataKey="gst"
                name="GST collected"
                stroke={c.gst}
                strokeWidth={1.6}
                strokeDasharray="4 3"
                fill="none"
              />
              <Legend wrapperStyle={{ fontSize: 12, color: c.axis }} iconType="plainline" />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>
      </Grid>

      {/* Category split */}
      <Grid item xs={12} lg={4}>
        <Panel
          title="Sales by category"
          subtitle="Share of item revenue"
          loading={loading}
          isEmpty={categories.length === 0}
          emptyText="No items sold in this period."
          height={300}
        >
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categories}
                dataKey="revenue"
                nameKey="category"
                cx="50%"
                cy="46%"
                innerRadius={58}
                outerRadius={94}
                paddingAngle={2}
                stroke={c.surface}
                strokeWidth={2}
              >
                {categories.map((entry, i) => (
                  <Cell key={entry.category} fill={c.series[i % c.series.length]} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip formatter={(v) => formatINR(v)} />} />
              <Legend wrapperStyle={{ fontSize: 12, color: c.axis }} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </Panel>
      </Grid>

      {/* Orders over time */}
      <Grid item xs={12} lg={7}>
        <Panel
          title="Orders placed"
          subtitle={overview?.rangeLabel}
          loading={loading}
          isEmpty={!hasActivity}
          emptyText="No orders in this period."
          height={260}
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={series} margin={{ top: 6, right: 8, left: -22, bottom: 0 }}>
              <CartesianGrid stroke={c.grid} vertical={false} />
              <XAxis dataKey="label" tick={c.tick} tickLine={false} axisLine={{ stroke: c.grid }} minTickGap={16} />
              <YAxis tick={c.tick} tickLine={false} axisLine={false} allowDecimals={false} width={44} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: c.grid }} />
              <Bar dataKey="orders" name="Orders" fill={c.orders} radius={[6, 6, 0, 0]} maxBarSize={44} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </Grid>

      {/* Top dishes */}
      <Grid item xs={12} lg={5}>
        <Panel
          title="Top dishes"
          subtitle="By revenue"
          loading={loading}
          isEmpty={topDishes.length === 0}
          emptyText="No dishes sold in this period."
          height={260}
        >
          <Box sx={{ display: 'grid', gap: 1.25 }}>
            {topDishes.slice(0, 6).map((dish, i) => {
              const max = topDishes[0]?.revenue || 1;
              return (
                <Box key={dish.name}>
                  <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'baseline', mb: 0.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 0, flex: 1 }} noWrap title={dish.name}>
                      {dish.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.disabled', flex: 'none' }}>
                      ×{dish.quantity}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, flex: 'none' }}>
                      {formatINR(dish.revenue, false)}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      height: 7,
                      borderRadius: 99,
                      bgcolor: 'var(--ad-bg-2)',
                      border: '1px solid var(--ad-line)',
                      overflow: 'hidden',
                    }}
                  >
                    <Box
                      sx={{
                        height: '100%',
                        width: `${Math.max((dish.revenue / max) * 100, 3)}%`,
                        background: c.series[i % c.series.length],
                        borderRadius: 99,
                      }}
                    />
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Panel>
      </Grid>
    </Grid>
  );
};

export default OverviewCharts;
