import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  Typography,
  Button,
  TextField,
  Chip,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';

import { getGstDashboard, calculateGstSnapshot } from '../../../services/api';
import { formatINR } from '../../../config/business';
import { FONT_DISPLAY } from '../../../theme/muiTheme';
import StatCard from '../../../components/dashboard/StatCard';

const GSTDashboardTab = ({ onNavigateTab }) => {
  const getCurrentPeriod = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  const [period, setPeriod] = useState(getCurrentPeriod());
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboard(period);
  }, [period]);

  const fetchDashboard = async (selectedPeriod) => {
    try {
      setLoading(true);
      setError(null);
      const res = await getGstDashboard(selectedPeriod);
      if (res.data.success) {
        setDashboardData(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch GST dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculate = async () => {
    try {
      setCalculating(true);
      setError(null);
      await calculateGstSnapshot(period);
      await fetchDashboard(period);
    } catch (err) {
      setError(err.response?.data?.message || 'Recalculation failed.');
    } finally {
      setCalculating(false);
    }
  };

  const snapshot = dashboardData?.snapshot || {};
  const reconciliation = dashboardData?.reconciliation || {};
  const returns = dashboardData?.returns || {};
  const payment = dashboardData?.payment || {};

  const getStatusChipConfig = (status) => {
    switch (status) {
      case 'filed':
      case 'paid':
        return { bg: 'var(--ad-basil-wash)', fg: 'var(--ad-basil)', border: 'var(--ad-basil)' };
      case 'approved':
      case 'submitted':
        return { bg: 'var(--ad-ember-wash)', fg: 'var(--ad-ember)', border: 'var(--ad-ember)' };
      case 'ready_for_review':
        return { bg: 'var(--ad-saffron-wash)', fg: 'var(--ad-warn)', border: 'var(--ad-saffron)' };
      case 'failed':
        return { bg: 'rgba(197, 65, 47, 0.15)', fg: 'var(--ad-danger)', border: 'var(--ad-danger)' };
      default:
        return { bg: 'var(--ad-bg-2)', fg: 'var(--ad-text-3)', border: 'var(--ad-line)' };
    }
  };

  return (
    <Box>
      {/* Period Header Controls */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            label="Reporting Period (Month)"
            type="month"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            InputLabelProps={{ shrink: true }}
            size="small"
            sx={{
              minWidth: 200,
              '& .MuiOutlinedInput-root': {
                borderRadius: 'var(--ad-radius-sm)',
              },
            }}
          />
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={handleRecalculate}
            disabled={calculating || loading}
            size="medium"
            sx={{
              bgcolor: 'var(--ad-ember)',
              color: '#ffffff',
              borderRadius: 'var(--ad-radius-sm)',
              fontWeight: 600,
              textTransform: 'none',
              '&:hover': { bgcolor: 'var(--ad-ember-deep)' },
            }}
          >
            {calculating ? 'Calculating...' : 'Recalculate Eligible Sales'}
          </Button>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.2, alignItems: 'center', flexWrap: 'wrap' }}>
          <Chip
            label={dashboardData?.isGstRegistered ? `GSTIN: ${dashboardData.gstin}` : 'GST Registered'}
            sx={{
              bgcolor: 'var(--ad-ember-wash)',
              color: 'var(--ad-ember)',
              fontWeight: 700,
              borderRadius: 'var(--ad-radius-sm)',
              border: '1px solid var(--ad-ember)',
            }}
          />
          <Chip
            label={`FY ${dashboardData?.financialYear || '2026-27'}`}
            sx={{
              bgcolor: 'var(--ad-basil-wash)',
              color: 'var(--ad-basil)',
              fontWeight: 700,
              borderRadius: 'var(--ad-radius-sm)',
              border: '1px solid var(--ad-basil)',
            }}
          />
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 'var(--ad-radius-sm)' }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Mandatory Statutory Warning Alert */}
      <Alert
        severity="warning"
        icon={<WarningAmberIcon sx={{ color: 'var(--ad-warn)' }} />}
        sx={{
          mb: 3.5,
          borderRadius: 'var(--ad-radius)',
          bgcolor: 'var(--ad-saffron-wash)',
          color: 'var(--ad-text)',
          border: '1px solid var(--ad-saffron)',
          '& .MuiAlert-message': { width: '100%' },
        }}
      >
        <Typography variant="subtitle2" fontWeight="700">
          {dashboardData?.liabilityLabel || 'Estimated GST Liability — subject to reconciliation and review'}
        </Typography>
        <Typography variant="body2" sx={{ color: 'var(--ad-text-2)', mt: 0.3 }}>
          Values derived from completed restaurant orders represent outward taxable supplies (5% composite without ITC under CBIC Notification 11/2017-CT(R), SAC 996331). Final liability must be reconciled before return submission.
        </Typography>
      </Alert>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: 'var(--ad-ember)' }} />
        </Box>
      ) : (
        <>
          {/* 4 KPI Metric Cards using Ember & Basil palette */}
          <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total Eligible Sales"
                value={formatINR(snapshot.grossSales || 0)}
                hint={`${snapshot.totalEligibleOrders || 0} completed orders`}
                icon={<ShoppingBagIcon />}
                tone="ember"
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Taxable Turnover"
                value={formatINR(snapshot.taxableTurnover || 0)}
                hint={`Discounts: ${formatINR(snapshot.totalDiscounts || 0)}`}
                icon={<ReceiptLongIcon />}
                tone="basil"
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total Output GST (5%)"
                value={formatINR(snapshot.totalOutputTax || 0)}
                hint={`CGST: ${formatINR(snapshot.cgst || 0)} · SGST: ${formatINR(snapshot.sgst || 0)}`}
                icon={<AccountBalanceWalletIcon />}
                tone="saffron"
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Estimated Net Liability"
                value={formatINR(reconciliation.estimatedNetLiability ?? snapshot.totalOutputTax ?? 0)}
                hint={`Filing liability for ${period}`}
                icon={<CurrencyRupeeIcon />}
                tone="ember"
              />
            </Grid>
          </Grid>

          {/* Filing & Statutory Returns Status Row */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, sm: 3 },
              mb: 3.5,
              borderRadius: 'var(--ad-radius)',
              border: '1px solid var(--ad-line)',
              bgcolor: 'background.paper',
            }}
          >
            <Typography sx={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 19, mb: 2 }}>
              Statutory Return Status for {period}
            </Typography>

            <Grid container spacing={2}>
              {/* GSTR-1 Status */}
              <Grid item xs={12} md={4}>
                <Card
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: 'var(--ad-radius-sm)',
                    border: '1px solid var(--ad-line)',
                    bgcolor: 'var(--ad-surface-2)',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle2" fontWeight="700">
                        GSTR-1 (Outward Supplies)
                      </Typography>
                      {(() => {
                        const chip = getStatusChipConfig(returns.gstr1Status || 'pending');
                        return (
                          <Chip
                            label={(returns.gstr1Status || 'pending').replace('_', ' ').toUpperCase()}
                            size="small"
                            sx={{
                              bgcolor: chip.bg,
                              color: chip.fg,
                              fontWeight: 700,
                              fontSize: 10,
                              border: `1px solid ${chip.border}`,
                            }}
                          />
                        );
                      })()}
                    </Box>
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: 13 }}>
                      B2CS restaurant supply summary &amp; document issues register.
                    </Typography>
                    {returns.gstr1Arn && (
                      <Typography variant="caption" sx={{ color: 'var(--ad-basil)', fontWeight: 600, mt: 0.5, display: 'block' }}>
                        ARN: {returns.gstr1Arn}
                      </Typography>
                    )}
                  </Box>
                  <Button
                    size="small"
                    endIcon={<ArrowForwardIcon />}
                    onClick={() => onNavigateTab && onNavigateTab(2)}
                    sx={{
                      color: 'var(--ad-ember)',
                      fontWeight: 600,
                      justifyContent: 'flex-start',
                      px: 0,
                      mt: 1.5,
                      textTransform: 'none',
                    }}
                  >
                    View &amp; Prepare GSTR-1
                  </Button>
                </Card>
              </Grid>

              {/* GSTR-3B Status */}
              <Grid item xs={12} md={4}>
                <Card
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: 'var(--ad-radius-sm)',
                    border: '1px solid var(--ad-line)',
                    bgcolor: 'var(--ad-surface-2)',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle2" fontWeight="700">
                        GSTR-3B (Summary Return)
                      </Typography>
                      {(() => {
                        const chip = getStatusChipConfig(returns.gstr3bStatus || 'pending');
                        return (
                          <Chip
                            label={(returns.gstr3bStatus || 'pending').replace('_', ' ').toUpperCase()}
                            size="small"
                            sx={{
                              bgcolor: chip.bg,
                              color: chip.fg,
                              fontWeight: 700,
                              fontSize: 10,
                              border: `1px solid ${chip.border}`,
                            }}
                          />
                        );
                      })()}
                    </Box>
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: 13 }}>
                      Summary of outward supplies, ineligible ITC, and tax payable.
                    </Typography>
                    {returns.gstr3bArn && (
                      <Typography variant="caption" sx={{ color: 'var(--ad-basil)', fontWeight: 600, mt: 0.5, display: 'block' }}>
                        ARN: {returns.gstr3bArn}
                      </Typography>
                    )}
                  </Box>
                  <Button
                    size="small"
                    endIcon={<ArrowForwardIcon />}
                    onClick={() => onNavigateTab && onNavigateTab(3)}
                    sx={{
                      color: 'var(--ad-ember)',
                      fontWeight: 600,
                      justifyContent: 'flex-start',
                      px: 0,
                      mt: 1.5,
                      textTransform: 'none',
                    }}
                  >
                    View &amp; Prepare GSTR-3B
                  </Button>
                </Card>
              </Grid>

              {/* Tax Payment & Challan Status */}
              <Grid item xs={12} md={4}>
                <Card
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: 'var(--ad-radius-sm)',
                    border: '1px solid var(--ad-line)',
                    bgcolor: 'var(--ad-surface-2)',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle2" fontWeight="700">
                        Payment &amp; Challan Status
                      </Typography>
                      {(() => {
                        const chip = getStatusChipConfig(payment.status || 'pending');
                        return (
                          <Chip
                            label={(payment.status || 'pending').toUpperCase()}
                            size="small"
                            sx={{
                              bgcolor: chip.bg,
                              color: chip.fg,
                              fontWeight: 700,
                              fontSize: 10,
                              border: `1px solid ${chip.border}`,
                            }}
                          />
                        );
                      })()}
                    </Box>
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: 13 }}>
                      CPIN Challan generation and direct bank payment settlement.
                    </Typography>
                    {payment.cin && (
                      <Typography variant="caption" sx={{ color: 'var(--ad-basil)', fontWeight: 600, mt: 0.5, display: 'block' }}>
                        CIN: {payment.cin}
                      </Typography>
                    )}
                  </Box>
                  <Button
                    size="small"
                    endIcon={<ArrowForwardIcon />}
                    onClick={() => onNavigateTab && onNavigateTab(5)}
                    sx={{
                      color: 'var(--ad-ember)',
                      fontWeight: 600,
                      justifyContent: 'flex-start',
                      px: 0,
                      mt: 1.5,
                      textTransform: 'none',
                    }}
                  >
                    Manage Challans &amp; Pay
                  </Button>
                </Card>
              </Grid>
            </Grid>
          </Paper>

          {/* Category & HSN Sales Breakdown Table */}
          <Paper
            elevation={0}
            sx={{
              borderRadius: 'var(--ad-radius)',
              border: '1px solid var(--ad-line)',
              overflow: 'hidden',
              bgcolor: 'background.paper',
            }}
          >
            <Box sx={{ p: { xs: 2, sm: 2.5 }, borderBottom: '1px solid var(--ad-line)' }}>
              <Typography sx={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 19 }}>
                Sales Breakdown by Category &amp; SAC 996331
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Itemized outward supplies under standalone restaurant 5% GST classification.
              </Typography>
            </Box>

            <TableContainer>
              <Table size="small">
                <TableHead sx={{ bgcolor: 'var(--ad-surface-2)' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, color: 'text.secondary', py: 1.5 }}>CATEGORY</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: 'text.secondary', py: 1.5 }}>SAC CODE</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: 'text.secondary', py: 1.5 }}>TAXABLE VALUE</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: 'text.secondary', py: 1.5 }}>CGST (2.5%)</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: 'text.secondary', py: 1.5 }}>SGST (2.5%)</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: 'text.secondary', py: 1.5 }}>TOTAL GST (5%)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {snapshot.categoryBreakdown && snapshot.categoryBreakdown.length > 0 ? (
                    snapshot.categoryBreakdown.map((item, idx) => (
                      <TableRow key={idx} hover sx={{ '&:hover': { bgcolor: 'var(--ad-surface-2)' } }}>
                        <TableCell sx={{ fontWeight: 600, textTransform: 'capitalize', py: 1.5 }}>
                          {item.category || 'General Menu'}
                        </TableCell>
                        <TableCell sx={{ color: 'text.secondary', py: 1.5 }}>996331</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, py: 1.5 }}>
                          {formatINR(item.taxableValue || 0)}
                        </TableCell>
                        <TableCell align="right" sx={{ py: 1.5 }}>{formatINR(item.cgst || 0)}</TableCell>
                        <TableCell align="right" sx={{ py: 1.5 }}>{formatINR(item.sgst || 0)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: 'var(--ad-ember)', py: 1.5 }}>
                          {formatINR(item.totalGst || 0)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                        No orders recorded for period {period}. Click &quot;Recalculate Eligible Sales&quot; to compile data.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      )}
    </Box>
  );
};

export default GSTDashboardTab;
