import React from 'react';
import { Card, CardContent, Typography } from '@mui/material';

const StatCard = ({ title, value, icon, color }) => (
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

export default StatCard;
