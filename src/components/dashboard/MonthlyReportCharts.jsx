import React from 'react';
import { Grid, Paper, Typography } from '@mui/material';
import { format } from 'date-fns';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';

const COLORS = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#00f2fe', '#43e97b'];

const MonthlyReportCharts = ({ monthlyReport }) => {
  if (!monthlyReport) return null;

  return (
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
                {monthlyReport.categoryBreakdown.map((entry, index) => (
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
            {monthlyReport.topItems.map((item, index) => (
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
  );
};

export default MonthlyReportCharts;
