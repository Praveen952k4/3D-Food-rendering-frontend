import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Button,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { ReceiptLong, Download, CurrencyRupee, Percent } from '@mui/icons-material';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { format, parseISO } from 'date-fns';

import { getGstSummary } from '../../../services/api';
import StatCard from '../../../components/dashboard/StatCard';
import { Panel } from '../../../components/dashboard/OverviewCharts';
import { useChartTheme, ChartTooltip } from '../../../components/dashboard/chartTheme';
import { SkeletonText } from '../../../components/ui/Loaders';
import { formatINR } from '../../../config/business';
import { FONT_DISPLAY } from '../../../theme/muiTheme';
import { useMessage } from '../../../components/ui/MessageDialog';

const today = () => new Date().toISOString().slice(0, 10);
const monthsAgo = (n) => {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  d.setDate(1);
  return d.toISOString().slice(0, 10);
};

const periodLabel = (period, groupBy) => {
  try {
    return groupBy === 'month'
      ? format(parseISO(`${period}-01`), 'MMM yyyy')
      : format(parseISO(period), 'dd MMM yyyy');
  } catch {
    return period;
  }
};

/** Export the per-period register as CSV, for filing or a spreadsheet. */
const downloadCsv = (summary) => {
  const rows = [
    ['Period', 'Orders', 'Taxable value', 'CGST 2.5%', 'SGST 2.5%', 'Total GST', 'Gross sales'],
    ...summary.periods.map((p) => [
      p.period,
      p.orders,
      p.taxableValue.toFixed(2),
      p.cgst.toFixed(2),
      p.sgst.toFixed(2),
      p.total.toFixed(2),
      p.grossSales.toFixed(2),
    ]),
    [],
    [
      'Total',
      summary.periods.reduce((s, p) => s + p.orders, 0),
      summary.totals.taxableValue.toFixed(2),
      summary.totals.cgst.toFixed(2),
      summary.totals.sgst.toFixed(2),
      summary.totals.total.toFixed(2),
      '',
    ],
  ];
  const csv = rows.map((r) => r.join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `gst-summary-${summary.from.slice(0, 10)}-to-${summary.to.slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

const GstRegisterTab = () => {
  const c = useChartTheme();
  const [from, setFrom] = useState(monthsAgo(5));
  const [to, setTo] = useState(today());
  const [groupBy, setGroupBy] = useState('month');
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const { confirmAction } = useMessage();

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getGstSummary({ from, to, groupBy });
      setSummary(res.data.gstSummary);
    } catch (err) {
      console.error('Failed to fetch GST summary:', err);
      const retry = await confirmAction({
        title: 'Could not load the GST summary',
        message: 'Check that the API is reachable, then try again.',
        confirmLabel: 'Retry',
        cancelLabel: 'Dismiss',
      });
      if (retry) {
        setLoading(false);
        return fetchSummaryRef.current?.();
      }
    } finally {
      setLoading(false);
    }
  }, [from, to, groupBy, confirmAction]);

  const fetchSummaryRef = useRef(null);
  fetchSummaryRef.current = fetchSummary;

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const chartData = useMemo(
    () =>
      [...(summary?.periods || [])]
        .reverse()
        .map((p) => ({ ...p, label: periodLabel(p.period, summary?.groupBy || 'month') })),
    [summary]
  );

  const totals = summary?.totals;

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      {/* Head with Export Action */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography sx={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 20 }}>
            Period Register &amp; Sales Breakdown
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Periodic tax register grouped by day or month with direct spreadsheet export.
          </Typography>
        </Box>
        <Button
          startIcon={<Download />}
          variant="contained"
          disabled={!summary || loading}
          onClick={() => summary && downloadCsv(summary)}
          sx={{
            bgcolor: 'var(--ad-ember)',
            color: '#ffffff',
            borderRadius: 'var(--ad-radius-sm)',
            fontWeight: 600,
            textTransform: 'none',
            '&:hover': { bgcolor: 'var(--ad-ember-deep)' },
          }}
        >
          Export CSV Spreadsheet
        </Button>
      </Box>

      {/* Period Picker */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          display: 'flex',
          gap: 2,
          flexWrap: 'wrap',
          alignItems: 'center',
          borderRadius: 'var(--ad-radius)',
          border: '1px solid var(--ad-line)',
          bgcolor: 'background.paper',
        }}
      >
        <TextField
          label="From"
          type="date"
          size="small"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 'var(--ad-radius-sm)' } }}
        />
        <TextField
          label="To"
          type="date"
          size="small"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 'var(--ad-radius-sm)' } }}
        />
        <ToggleButtonGroup
          size="small"
          exclusive
          value={groupBy}
          onChange={(e, v) => v && setGroupBy(v)}
          sx={{
            borderRadius: 'var(--ad-radius-sm)',
            p: 0.5,
            border: '1px solid var(--ad-line-strong)',
            '& .MuiToggleButton-root': {
              border: 0,
              borderRadius: '8px !important',
              px: 2,
              py: 0.5,
              fontSize: 12.5,
              fontWeight: 600,
              color: 'text.secondary',
            },
            '& .Mui-selected': { bgcolor: 'var(--ad-ember) !important', color: '#fff !important' },
          }}
        >
          <ToggleButton value="day">Daily</ToggleButton>
          <ToggleButton value="month">Monthly</ToggleButton>
        </ToggleButtonGroup>

        {summary && !loading && (
          <Typography variant="caption" sx={{ color: 'text.secondary', ml: 'auto' }}>
            {summary.orders?.length || 0} paid order{summary.orders?.length === 1 ? '' : 's'}
            {summary.unpaidOrders > 0 && ` &bull; ${summary.unpaidOrders} unpaid excluded`}
          </Typography>
        )}
      </Paper>

      {/* Totals */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard title="Taxable value" value={formatINR(totals?.taxableValue || 0, false)} icon={<CurrencyRupee />} tone="basil" loading={loading} />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard title="CGST @ 2.5%" value={formatINR(totals?.cgst || 0, false)} icon={<Percent />} tone="saffron" loading={loading} />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard title="SGST @ 2.5%" value={formatINR(totals?.sgst || 0, false)} icon={<Percent />} tone="saffron" loading={loading} />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard title="Total GST payable" value={formatINR(totals?.total || 0, false)} icon={<ReceiptLong />} tone="ember" loading={loading} />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Chart */}
        <Grid item xs={12} lg={8}>
          <Panel
            title="GST Collected Over Time"
            subtitle={summary ? `${periodLabel(chartData[0]?.period, summary.groupBy)} → ${periodLabel(chartData[chartData.length - 1]?.period, summary.groupBy)}` : ''}
            loading={loading}
            isEmpty={chartData.length === 0}
            emptyText="No paid orders fall in this period."
            height={300}
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} margin={{ top: 6, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid stroke={c.grid} vertical={false} />
                <XAxis dataKey="label" tick={c.tick} tickLine={false} axisLine={{ stroke: c.grid }} minTickGap={12} />
                <YAxis tick={c.tick} tickLine={false} axisLine={false} width={60} tickFormatter={(v) => formatINR(v, false)} />
                <Tooltip content={<ChartTooltip formatter={(v) => formatINR(v)} />} cursor={{ fill: c.grid }} />
                <Legend wrapperStyle={{ fontSize: 12, color: c.axis }} iconType="circle" />
                <Bar dataKey="cgst" name="CGST" stackId="gst" fill={c.series[0]} radius={[0, 0, 0, 0]} maxBarSize={52} />
                <Bar dataKey="sgst" name="SGST" stackId="gst" fill={c.series[2]} radius={[6, 6, 0, 0]} maxBarSize={52} />
              </BarChart>
            </ResponsiveContainer>
          </Panel>
        </Grid>

        {/* Category Split */}
        <Grid item xs={12} lg={4}>
          <Panel
            title="GST by Food Category"
            subtitle="Taxable value apportioned per line"
            loading={loading}
            isEmpty={!summary?.byCategory?.length}
            emptyText="No items sold in this period."
            height={300}
          >
            <Box sx={{ display: 'grid', gap: 1.5 }}>
              {(summary?.byCategory || []).map((row, i) => {
                const max = summary.byCategory[0]?.taxableValue || 1;
                return (
                  <Box key={row.category}>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'baseline', mb: 0.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, flex: 1 }} noWrap>
                        {row.category}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {formatINR(row.taxableValue, false)}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {formatINR(row.gst)}
                      </Typography>
                    </Box>
                    <Box sx={{ height: 7, borderRadius: 99, bgcolor: 'var(--ad-bg-2)', overflow: 'hidden', border: '1px solid var(--ad-line)' }}>
                      <Box
                        sx={{
                          height: '100%',
                          width: `${Math.max((row.taxableValue / max) * 100, 3)}%`,
                          bgcolor: c.series[i % c.series.length],
                        }}
                      />
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Panel>
        </Grid>

        {/* Register Table */}
        <Grid item xs={12}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, sm: 3 },
              borderRadius: 'var(--ad-radius)',
              border: '1px solid var(--ad-line)',
              bgcolor: 'background.paper',
            }}
          >
            <Typography sx={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 19, mb: 0.5 }}>
              Periodic GST Register
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Aggregated per {summary?.groupBy === 'day' ? 'day' : 'month'}, paid orders only
            </Typography>

            {loading ? (
              <Box sx={{ mt: 2 }}>
                <SkeletonText lines={6} />
              </Box>
            ) : !summary?.periods?.length ? (
              <Box sx={{ py: 5, textAlign: 'center', color: 'text.secondary', fontSize: 14 }}>
                No GST transactions to report for this period.
              </Box>
            ) : (
              <TableContainer sx={{ mt: 2 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: 'var(--ad-surface-2)' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>PERIOD</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: 'text.secondary' }}>ORDERS</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: 'text.secondary' }}>TAXABLE VALUE</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: 'text.secondary' }}>CGST (2.5%)</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: 'text.secondary' }}>SGST (2.5%)</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: 'text.secondary' }}>TOTAL GST (5%)</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: 'text.secondary' }}>GROSS SALES</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {summary.periods.map((p) => (
                      <TableRow key={p.period} hover sx={{ '&:hover': { bgcolor: 'var(--ad-surface-2)' } }}>
                        <TableCell sx={{ fontWeight: 600 }}>{periodLabel(p.period, summary.groupBy)}</TableCell>
                        <TableCell align="right">{p.orders}</TableCell>
                        <TableCell align="right">{formatINR(p.taxableValue)}</TableCell>
                        <TableCell align="right">{formatINR(p.cgst)}</TableCell>
                        <TableCell align="right">{formatINR(p.sgst)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: 'var(--ad-ember)' }}>
                          {formatINR(p.total)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>{formatINR(p.grossSales)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow sx={{ bgcolor: 'var(--ad-surface-2)' }}>
                      <TableCell sx={{ fontWeight: 700 }}>Total</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>
                        {summary.periods.reduce((s, p) => s + p.orders, 0)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>{formatINR(totals?.taxableValue || 0)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>{formatINR(totals?.cgst || 0)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>{formatINR(totals?.sgst || 0)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, color: 'var(--ad-ember)' }}>{formatINR(totals?.total || 0)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>
                        {formatINR(summary.periods.reduce((s, p) => s + p.grossSales, 0))}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default GstRegisterTab;
