import React, { useEffect, useState } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Tab,
  Tabs,
  Rating,
  Chip,
} from '@mui/material';
import {
  TrendingUp,
  ShoppingCart,
  AttachMoney,
  PendingActions,
  Star,
  RateReview,
} from '@mui/icons-material';
import { getDashboard, getDailyReport, getMonthlyReport, getFeedbackSummary } from '../../services/api';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';

const COLORS = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#00f2fe', '#43e97b'];

interface DashboardData {
  today: {
    orders: number;
    revenue: number;
    successfulOrders: number;
  };
  month: {
    orders: number;
    revenue: number;
    successfulOrders: number;
  };
  overall: {
    totalOrders: number;
    totalRevenue: number;
    pendingOrders: number;
  };
}

const AdminDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [dailyReport, setDailyReport] = useState<any>(null);
  const [monthlyReport, setMonthlyReport] = useState<any>(null);
  const [feedbackSummary, setFeedbackSummary] = useState<any>(null);
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

  const StatCard = ({ title, value, icon, color }: any) => (
    <Card
      sx={{
        height: '100%',
        background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
        color: 'white',
      }}
    >
      <CardContent>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Typography variant="body2" style={{ opacity: 0.9 }}>
              {title}
            </Typography>
            <Typography variant="h4" fontWeight="bold" mt={1}>
              {value}
            </Typography>
          </div>
          <div
            style={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              borderRadius: '50%',
              padding: '16px',
            }}
          >
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );

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
            title="Monthly Orders"
            value={dashboardData.month.orders}
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

      {/* Feedback Stats */}
      {feedbackSummary && feedbackSummary.summary && (
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
      )}

      {/* Recent Feedback */}
      {feedbackSummary && feedbackSummary.recentFeedback && feedbackSummary.recentFeedback.length > 0 && (
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Recent Customer Feedback
          </Typography>
          <Grid container spacing={2} mt={1}>
            {feedbackSummary.recentFeedback.slice(0, 6).map((order: any) => (
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
      {tabValue === 0 && dailyReport && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Hourly Sales
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dailyReport.hourlyStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="orders" fill="#667eea" name="Orders" />
                  <Bar dataKey="revenue" fill="#764ba2" name="Revenue (₹)" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Top Items Today
              </Typography>
              <div>
                {dailyReport.topItems.slice(0, 5).map((item: any, index: number) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '16px',
                      paddingBottom: '16px',
                      borderBottom: '1px solid #f0f0f0',
                    }}
                  >
                    <Typography variant="body2">{item.name}</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {item.quantity} × ₹{item.revenue.toFixed(0)}
                    </Typography>
                  </div>
                ))}
              </div>
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Daily Summary - {dailyReport.date}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} md={3}>
                  <Typography color="text.secondary">Total Orders</Typography>
                  <Typography variant="h5">{dailyReport.totalOrders}</Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography color="text.secondary">Successful</Typography>
                  <Typography variant="h5">{dailyReport.successfulOrders}</Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography color="text.secondary">Revenue</Typography>
                  <Typography variant="h5">₹{dailyReport.revenue.toFixed(0)}</Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography color="text.secondary">Avg Order Value</Typography>
                  <Typography variant="h5">₹{dailyReport.avgOrderValue.toFixed(0)}</Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Monthly Report */}
      {tabValue === 1 && monthlyReport && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Daily Sales - {monthlyReport.monthName} {monthlyReport.year}
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyReport.dailyStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date) => format(new Date(date), 'dd')}
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="orders"
                    stroke="#667eea"
                    strokeWidth={2}
                    name="Orders"
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#764ba2"
                    strokeWidth={2}
                    name="Revenue (₹)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Category Breakdown
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={monthlyReport.categoryBreakdown}
                    dataKey="revenue"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {monthlyReport.categoryBreakdown.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Top Items This Month
              </Typography>
              <div>
                {monthlyReport.topItems.map((item: any, index: number) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '16px',
                      padding: '16px',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '8px',
                    }}
                  >
                    <div>
                      <Typography variant="body1" fontWeight="bold">
                        {item.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Sold: {item.quantity} items
                      </Typography>
                    </div>
                    <Typography variant="h6" color="primary">
                      ₹{item.revenue.toFixed(0)}
                    </Typography>
                  </div>
                ))}
              </div>
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Monthly Summary
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={6} md={3}>
                  <Typography color="text.secondary">Total Orders</Typography>
                  <Typography variant="h5">{monthlyReport.totalOrders}</Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography color="text.secondary">Successful</Typography>
                  <Typography variant="h5">{monthlyReport.successfulOrders}</Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography color="text.secondary">Total Revenue</Typography>
                  <Typography variant="h5">₹{monthlyReport.revenue.toFixed(0)}</Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography color="text.secondary">Avg Order Value</Typography>
                  <Typography variant="h5">₹{monthlyReport.avgOrderValue.toFixed(0)}</Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Container>
  );
};

export default AdminDashboard;
