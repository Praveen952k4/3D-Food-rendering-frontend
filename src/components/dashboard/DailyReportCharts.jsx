import React from 'react';
import { Grid, Paper, Typography } from '@mui/material';
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';

const DailyReportCharts = ({ dailyReport }) => {
  if (!dailyReport) return null;

  return (
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
            {dailyReport.topItems.slice(0, 5).map((item, index) => (
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
  );
};

export default DailyReportCharts;
