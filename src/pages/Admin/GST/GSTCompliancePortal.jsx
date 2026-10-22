import React, { useState } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Container,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import StoreIcon from '@mui/icons-material/Store';
import AssignmentIcon from '@mui/icons-material/Assignment';
import DescriptionIcon from '@mui/icons-material/Description';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import HistoryIcon from '@mui/icons-material/History';
import SecurityIcon from '@mui/icons-material/Security';

import GSTDashboardTab from './GSTDashboardTab';
import GSTProfileTab from './GSTProfileTab';
import GSTR1Tab from './GSTR1Tab';
import GSTR3BTab from './GSTR3BTab';
import ReconciliationTab from './ReconciliationTab';
import FilingPaymentHistoryTab from './FilingPaymentHistoryTab';
import AuditTrailTab from './AuditTrailTab';
import { FONT_DISPLAY } from '../../../theme/muiTheme';

const GSTCompliancePortal = () => {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 3.5 }, px: { xs: 1.5, sm: 3 } }}>
      {/* Page Header */}
      <Box sx={{ mb: 3 }}>
        <Typography className="ad-eyebrow">Admin &bull; Compliance</Typography>
        <Typography
          sx={{
            fontFamily: FONT_DISPLAY,
            fontWeight: 600,
            fontSize: { xs: 26, sm: 34 },
            color: 'text.primary',
            letterSpacing: '-0.02em',
            mt: 0.5,
          }}
        >
          GST Compliance &amp; Tax Returns
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
          Statutory 5% GST calculations (CGST 2.5% + SGST 2.5%), GSTR-1, GSTR-3B, ITC reconciliation, and in-app challans.
        </Typography>
      </Box>

      {/* Tabs Navigation Bar */}
      <Paper
        elevation={0}
        sx={{
          mb: 3.5,
          borderRadius: 'var(--ad-radius)',
          border: '1px solid var(--ad-line)',
          bgcolor: 'background.paper',
          overflow: 'hidden',
          boxShadow: 'var(--ad-shadow-sm)',
        }}
      >
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            minHeight: 52,
            borderBottom: '1px solid var(--ad-line)',
            '& .MuiTabs-indicator': {
              backgroundColor: 'var(--ad-ember)',
              height: 3,
              borderRadius: '3px 3px 0 0',
            },
            '& .MuiTab-root': {
              minHeight: 52,
              fontWeight: 600,
              fontSize: '0.825rem',
              color: 'text.secondary',
              textTransform: 'none',
              transition: 'color .2s ease',
              '&:hover': {
                color: 'var(--ad-ember)',
                bgcolor: 'var(--ad-ember-wash)',
              },
              '&.Mui-selected': {
                color: 'var(--ad-ember)',
                fontWeight: 700,
              },
            },
          }}
        >
          <Tab icon={<DashboardIcon fontSize="small" />} iconPosition="start" label="GST Dashboard" />
          <Tab icon={<StoreIcon fontSize="small" />} iconPosition="start" label="GST Profile" />
          <Tab icon={<AssignmentIcon fontSize="small" />} iconPosition="start" label="GSTR-1 (Outward)" />
          <Tab icon={<DescriptionIcon fontSize="small" />} iconPosition="start" label="GSTR-3B (Net Tax)" />
          <Tab icon={<CompareArrowsIcon fontSize="small" />} iconPosition="start" label="Inward Supplies &amp; ITC" />
          <Tab icon={<HistoryIcon fontSize="small" />} iconPosition="start" label="Returns &amp; Challans" />
          <Tab icon={<SecurityIcon fontSize="small" />} iconPosition="start" label="Audit Trail" />
        </Tabs>
      </Paper>

      {/* Tab Panels */}
      <Box sx={{ mt: 1 }}>
        {activeTab === 0 && <GSTDashboardTab onNavigateTab={(index) => setActiveTab(index)} />}
        {activeTab === 1 && <GSTProfileTab />}
        {activeTab === 2 && <GSTR1Tab />}
        {activeTab === 3 && <GSTR3BTab onNavigateTab={(index) => setActiveTab(index)} />}
        {activeTab === 4 && <ReconciliationTab />}
        {activeTab === 5 && <FilingPaymentHistoryTab />}
        {activeTab === 6 && <AuditTrailTab />}
      </Box>
    </Container>
  );
};

export default GSTCompliancePortal;