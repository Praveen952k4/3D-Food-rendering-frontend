import React, { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Button,
  Container,
  Grid,
  IconButton,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  ShoppingCart,
  CurrencyRupee,
  ReceiptLong,
  PendingActions,
  Refresh,
  ArrowForward,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getOverview, getFeedbackSummary } from 'services/api';
import StatCard from 'components/dashboard/StatCard';
import OverviewCharts, { Panel } from 'components/dashboard/OverviewCharts';
import FeedbackStats from 'components/dashboard/FeedbackStats';
import FeedbackSection from 'components/dashboard/FeedbackSection';
import ServiceTimeline from 'components/dashboard/ServiceTimeline';
import { formatINR } from 'config/business';
import { FONT_DISPLAY } from 'theme/muiTheme';
import { SkeletonText } from 'components/ui/Loaders';
import { useMessage } from 'components/ui/MessageDialog';

const RANGES = [
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
  { value: '12m', label: '12 months' },
  { value: 'all', label: 'All time' },
];

/** status → themed swatch, shared by both breakdown lists. */
const TONE = {
  pending: 'var(--ad-saffron)',
  confirmed: 'var(--ad-saffron)',
  preparing: 'var(--ad-ember)',
  ready: 'var(--ad-basil)',
  delivered: 'var(--ad-basil)',
  completed: 'var(--ad-basil)',
  success: 'var(--ad-basil)',
  cancelled: 'var(--ad-text-3)',
  failed: '#c5412f',
  incomplete: '#c5412f',
};

const Breakdown = ({ rows, total }) => (
  <Box sx={{ display: 'grid', gap: 1.5 }}>
    {rows.map((row) => (
      <Box key={row.name}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'baseline', mb: 0.5 }}>
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: 99,
              bgcolor: TONE[row.name] || 'var(--ad-text-3)',
              flex: 'none',
            }}
          />
          <Typography variant="body2" sx={{ textTransform: 'capitalize', flex: 1 }}>
            {row.name}
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            {row.value}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.disabled', width: 42, textAlign: 'right' }}>
            {total ? `${Math.round((row.value / total) * 100)}%` : '—'}
          </Typography>
        </Box>
        <Box sx={{ height: 6, borderRadius: 99, bgcolor: 'var(--ad-bg-2)', overflow: 'hidden' }}>
          <Box
            sx={{
              height: '100%',
              width: `${total ? Math.max((row.value / total) * 100, 2) : 0}%`,
              bgcolor: TONE[row.name] || 'var(--ad-text-3)',
            }}
          />
        </Box>
      </Box>
    ))}
  </Box>
);

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [range, setRange] = useState('30d');
  const [overview, setOverview] = useState(null);
  const [feedbackSummary, setFeedbackSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const { confirmAction } = useMessage();
  const [reloadKey, setReloadKey] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    let failed = false;
    try {
      const [overviewRes, feedbackRes] = await Promise.allSettled([
        getOverview(range),
        getFeedbackSummary(),
      ]);

      if (overviewRes.status === 'fulfilled') {
        setOverview(overviewRes.value.data.overview);
      } else {
        console.error('Failed to fetch overview:', overviewRes.reason);
        failed = true;
      }

      if (feedbackRes.status === 'fulfilled') {
        setFeedbackSummary(feedbackRes.value.data);
      }
    } finally {
      setLoading(false);
    }

    // Reported in the centred dialog, which offers the retry.
    if (failed) {
      const retry = await confirmAction({
        title: 'Could not load analytics',
        message: 'Check that the API is reachable, then try again.',
        confirmLabel: 'Retry',
        cancelLabel: 'Dismiss',
      });
      if (retry) setReloadKey((n) => n + 1);
    }
  }, [range, confirmAction]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchData, reloadKey]);

  const kpis = overview?.kpis;
  const statusRows = overview?.statusBreakdown || [];
  const paymentRows = overview?.paymentBreakdown || [];
  const totalOrders = kpis?.orders || 0;

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 1.5, sm: 3 } }}>
      {/* ------------------------------------------------------------ head */}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-end',
          gap: 2,
          mb: 3,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography className="ad-eyebrow">Admin</Typography>
          <Typography sx={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: { xs: 28, sm: 36 }, mt: 0.5 }}>
            Restaurant dashboard
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {overview ? `${overview.rangeLabel} · live figures from your orders` : 'Live figures from your orders'}
          </Typography>
        </Box>

        <Box sx={{ ml: { md: 'auto' }, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <ToggleButtonGroup
            size="small"
            exclusive
            value={range}
            onChange={(e, v) => v && setRange(v)}
            sx={{
              bgcolor: 'var(--ad-surface)',
              borderRadius: 'var(--ad-radius-sm)',
              p: 0.5,
              border: '1px solid var(--ad-line-strong)',
              flexWrap: 'wrap',
              '& .MuiToggleButton-root': {
                border: 0,
                borderRadius: '8px !important',
                px: 1.75,
                py: 0.5,
                fontSize: 12.5,
                fontWeight: 600,
                color: 'text.disabled',
              },
              '& .Mui-selected': {
                bgcolor: 'var(--ad-ember) !important',
                color: '#fff !important',
              },
            }}
          >
            {RANGES.map((r) => (
              <ToggleButton key={r.value} value={r.value}>
                {r.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>

          <Tooltip title="Refresh">
            <span>
              <IconButton onClick={fetchData} disabled={loading} sx={{ border: '1px solid var(--ad-line-strong)' }}>
                <Refresh fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </Box>

      {/* ------------------------------------------------------------ KPIs */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={6} lg={3}>
          <StatCard
            title="Revenue"
            value={formatINR(kpis?.revenue, false)}
            hint={kpis ? `${kpis.paidOrders} paid orders · avg ${formatINR(kpis.avgOrderValue, false)}` : ''}
            icon={<CurrencyRupee />}
            tone="ember"
            loading={loading}
          />
        </Grid>
        <Grid item xs={6} sm={6} lg={3}>
          <StatCard
            title="Orders"
            value={kpis?.orders ?? 0}
            hint={kpis ? `${kpis.cancelledOrders} cancelled` : ''}
            icon={<ShoppingCart />}
            tone="basil"
            loading={loading}
          />
        </Grid>
        <Grid item xs={6} sm={6} lg={3}>
          <StatCard
            title="GST collected"
            value={formatINR(kpis?.gst, false)}
            hint="5% · CGST 2.5% + SGST 2.5%"
            icon={<ReceiptLong />}
            tone="saffron"
            loading={loading}
          />
        </Grid>
        <Grid item xs={6} sm={6} lg={3}>
          <StatCard
            title="In the kitchen"
            value={kpis?.pendingOrders ?? 0}
            hint="Pending, confirmed or preparing"
            icon={<PendingActions />}
            tone="ember"
            loading={loading}
          />
        </Grid>
      </Grid>

      {/* -------------------------------------------------- service timing */}
      <Box sx={{ mb: 3 }}>
        <ServiceTimeline />
      </Box>

      {/* ---------------------------------------------------------- graphs */}
      <OverviewCharts overview={overview} loading={loading} />

      {/* --------------------------------------------- GST + status splits */}
      <Grid container spacing={3} sx={{ mt: 0 }}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography className="ad-eyebrow">GST</Typography>
            <Typography sx={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 19, mt: 0.5, mb: 2 }}>
              Tax for this period
            </Typography>

            {loading ? (
              <SkeletonText lines={4} />
            ) : (
              <Box sx={{ display: 'grid', gap: 1.25, fontSize: 14 }}>
                {[
                  ['Taxable value', overview?.gst?.taxableValue],
                  ['CGST @ 2.5%', overview?.gst?.cgst],
                  ['SGST @ 2.5%', overview?.gst?.sgst],
                ].map(([label, value]) => (
                  <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>{label}</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatINR(value)}</Typography>
                  </Box>
                ))}
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    borderTop: '1px solid var(--ad-line)',
                    pt: 1.25,
                    mt: 0.5,
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>Total GST</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: 'var(--ad-ember)' }}>
                    {formatINR(overview?.gst?.total)}
                  </Typography>
                </Box>
              </Box>
            )}

            <Button
              endIcon={<ArrowForward />}
              onClick={() => navigate('/admin/gst')}
              sx={{ mt: 2.5, px: 0 }}
            >
              Open GST report
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Panel
            title="Order status"
            subtitle="Every order in this period"
            loading={loading}
            isEmpty={statusRows.length === 0}
            emptyText="No orders in this period."
            height={180}
          >
            <Breakdown rows={statusRows} total={totalOrders} />
          </Panel>
        </Grid>

        <Grid item xs={12} md={4}>
          <Panel
            title="Payments"
            subtitle="Settlement state"
            loading={loading}
            isEmpty={paymentRows.length === 0}
            emptyText="No payments in this period."
            height={180}
          >
            <Breakdown rows={paymentRows} total={totalOrders} />
          </Panel>
        </Grid>
      </Grid>

      {/* -------------------------------------------------------- feedback */}
      <Box sx={{ mt: 4 }}>
        <FeedbackStats feedbackSummary={feedbackSummary} />
      </Box>

      {feedbackSummary?.recentFeedback?.length > 0 && (
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography sx={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 19, mb: 1 }}>
            Recent customer feedback
          </Typography>
          <FeedbackSection feedbackSummary={feedbackSummary} />
        </Paper>
      )}
    </Container>
  );
};

export default AdminDashboard;
