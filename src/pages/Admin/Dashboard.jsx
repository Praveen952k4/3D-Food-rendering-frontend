import React, { useEffect, useState } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  CircularProgress,
  Tabs,
  Tab,
  Box,
  Chip,
} from '@mui/material';
import {
  TrendingUp,
  ShoppingCart,
  AttachMoney,
  PendingActions,
  CheckCircle,
  HourglassEmpty,
  Cancel,
} from '@mui/icons-material';
import { getDashboard, getDailyReport, getMonthlyReport, getFeedbackSummary } from 'services/api';
import StatCard from 'components/dashboard/StatCard';
import FeedbackStats from 'components/dashboard/FeedbackStats';
import FeedbackSection from 'components/dashboard/FeedbackSection';
import DailyReportCharts from 'components/dashboard/DailyReportCharts';
import MonthlyReportCharts from 'components/dashboard/MonthlyReportCharts';

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [dailyReport, setDailyReport] = useState(null);
  const [monthlyReport, setMonthlyReport] = useState(null);
  const [feedbackSummary, setFeedbackSummary] = useState(null);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dashRes, dailyRes, monthlyRes, feedbackRes] = await Promise.all([
        getDashboard(),
        getDailyReport(),
        getMonthlyReport(),
        getFeedbackSummary(),
      ]);

      setDashboardData(dashRes.data.dashboard);
      setDailyReport(dailyRes.data.report);
      setMonthlyReport(monthlyRes.data.report);
      setFeedbackSummary(feedbackRes.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '80vh',
        gap: '16px',
      }}>
        <div style={{ position: 'relative', display: 'inline-flex' }}>
          <CircularProgress
            size={60}
            thickness={4}
            sx={{
              color: '#667eea',
              animationDuration: '1.2s',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <TrendingUp style={{ fontSize: 28, color: '#667eea' }} />
          </div>
        </div>
        <Typography variant="body2" sx={{ color: 'rgba(0,0,0,0.6)' }}>
          Loading dashboard...
        </Typography>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <Container>
        <Typography>Failed to load dashboard data</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Restaurant Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={4}>
        Real-time analytics and reports
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Today's Orders"
            value={dashboardData.today.orders}
            icon={<ShoppingCart fontSize="large" />}
            color="#667eea"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Today's Revenue"
            value={`₹${dashboardData.today.revenue.toFixed(0)}`}
            icon={<AttachMoney fontSize="large" />}
            color="#764ba2"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Monthly Revenue"
            value={`₹${dashboardData.month.revenue.toFixed(0)}`}
            icon={<TrendingUp fontSize="large" />}
            color="#f093fb"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Orders"
            value={dashboardData.overall.pendingOrders}
            icon={<PendingActions fontSize="large" />}
            color="#4facfe"
          />
        </Grid>
      </Grid>

      {/* Revenue & Orders Summary */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AttachMoney color="primary" />
              Revenue Overview
            </Typography>
            <Box sx={{ mt: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="body2" color="text.secondary">Total Revenue</Typography>
                <Typography variant="h6" fontWeight="bold" color="primary">
                  ₹{dashboardData.overall.totalRevenue.toFixed(2)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="body2" color="text.secondary">This Month</Typography>
                <Typography variant="body1" fontWeight="medium">
                  ₹{dashboardData.month.revenue.toFixed(2)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="body2" color="text.secondary">Today</Typography>
                <Typography variant="body1" fontWeight="medium">
                  ₹{dashboardData.today.revenue.toFixed(2)}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ShoppingCart color="primary" />
              Orders Summary
            </Typography>
            <Box sx={{ mt: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="body2" color="text.secondary">Total Orders</Typography>
                <Typography variant="h6" fontWeight="bold" color="primary">
                  {dashboardData.overall.totalOrders}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="body2" color="text.secondary">This Month</Typography>
                <Typography variant="body1" fontWeight="medium">
                  {dashboardData.month.orders}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="body2" color="text.secondary">Today</Typography>
                <Typography variant="body1" fontWeight="medium">
                  {dashboardData.today.orders}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Pending</Typography>
                <Chip 
                  label={dashboardData.overall.pendingOrders} 
                  color="warning" 
                  size="small"
                  icon={<PendingActions />}
                />
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Payment Status Summary */}
      {(dailyReport || monthlyReport) && (
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AttachMoney color="primary" />
            Payment Status Overview
          </Typography>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            {dailyReport && (
              <>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <CheckCircle sx={{ fontSize: 40, color: '#10b981', mb: 1 }} />
                    <Typography variant="h5" fontWeight="bold">
                      {dailyReport.successfulOrders || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Completed (Today)
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <HourglassEmpty sx={{ fontSize: 40, color: '#f59e0b', mb: 1 }} />
                    <Typography variant="h5" fontWeight="bold">
                      {dailyReport.pendingOrders || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Pending (Today)
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <HourglassEmpty sx={{ fontSize: 40, color: '#ef4444', mb: 1 }} />
                    <Typography variant="h5" fontWeight="bold">
                      {dailyReport.incompleteOrders || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Incomplete (Today)
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <Cancel sx={{ fontSize: 40, color: '#6b7280', mb: 1 }} />
                    <Typography variant="h5" fontWeight="bold">
                      {dailyReport.failedOrders || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Failed (Today)
                    </Typography>
                  </Box>
                </Grid>
              </>
            )}
          </Grid>
        </Paper>
      )}

      {/* Feedback Stats */}
      <FeedbackStats feedbackSummary={feedbackSummary} />

      {/* Recent Feedback */}
      {feedbackSummary && feedbackSummary.recentFeedback && feedbackSummary.recentFeedback.length > 0 && (
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Recent Customer Feedback
          </Typography>
          <FeedbackSection feedbackSummary={feedbackSummary} />
        </Paper>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab label="Daily Report" />
          <Tab label="Monthly Report" />
        </Tabs>
      </Paper>

      {/* Daily Report */}
      {tabValue === 0 && <DailyReportCharts dailyReport={dailyReport} />}

      {/* Monthly Report */}
      {tabValue === 1 && <MonthlyReportCharts monthlyReport={monthlyReport} />}
    </Container>
  );
};

export default AdminDashboard;
