import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  FormControlLabel,
  Switch,
  MenuItem,
  Button,
  Grid,
  Alert,
  AlertTitle,
  Chip,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SaveIcon from '@mui/icons-material/Save';
import StoreIcon from '@mui/icons-material/Store';

import { getGstProfile, updateGstProfile } from '../../../services/api';
import business from '../../../config/business';
import { FONT_DISPLAY } from '../../../theme/muiTheme';

const GSTProfileTab = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState({
    isGstRegistered: true,
    gstin: business.gstin || '33AAACA1234A1Z5',
    legalBusinessName: business.name || 'AR Automated Dining Pvt Ltd',
    tradeName: 'AR Automated Dining',
    registrationType: 'regular',
    state: 'Tamil Nadu',
    stateCode: '33',
    restaurantCategory: 'standalone_restaurant',
    taxTreatment: '5_percent_no_itc',
    itcEligible: false,
    inHotelPremises: false,
    hotelRoomTariffExceeds7500: false,
    invoiceSeriesPrefix: 'ARF',
    financialYear: '2026-27',
    reviewStatus: 'verified',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await getGstProfile();
      if (res.data.success && res.data.profile) {
        setProfile((prev) => ({
          ...prev,
          ...res.data.profile,
          gstin: res.data.profile.gstin || business.gstin || '33AAACA1234A1Z5',
          legalBusinessName: res.data.profile.legalBusinessName || business.name,
        }));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load GST profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setProfile((prev) => {
      const updated = { ...prev, [field]: value };
      // Automatic rule adjustments for standalone restaurant
      if (field === 'restaurantCategory' && value === 'standalone_restaurant') {
        updated.taxTreatment = '5_percent_no_itc';
        updated.itcEligible = false;
        updated.inHotelPremises = false;
      }
      if (field === 'taxTreatment' && value === '5_percent_no_itc') {
        updated.itcEligible = false;
      }
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setMessage(null);
      const res = await updateGstProfile(profile);
      if (res.data.success) {
        setProfile(res.data.profile);
        setMessage('GST Profile updated successfully!');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update GST profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress sx={{ color: 'var(--ad-ember)' }} />
      </Box>
    );
  }

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 1100, mx: 'auto' }}>
      {message && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: 'var(--ad-radius-sm)' }} onClose={() => setMessage(null)}>
          {message}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 'var(--ad-radius-sm)' }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {!profile.isGstRegistered && (
        <Alert
          severity="info"
          sx={{
            mb: 3,
            borderRadius: 'var(--ad-radius)',
            bgcolor: 'var(--ad-surface-2)',
            border: '1px solid var(--ad-line)',
          }}
        >
          <AlertTitle sx={{ fontWeight: 700 }}>Operating as Unregistered Supplier</AlertTitle>
          Your restaurant ordering and billing continue to operate normally. Per Section 9(1) of the CGST Act, GST return generation and filing are disabled for unregistered businesses.
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Profile Settings Card */}
        <Grid item xs={12} md={8}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 'var(--ad-radius)',
              border: '1px solid var(--ad-line)',
              bgcolor: 'background.paper',
            }}
          >
            <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <StoreIcon sx={{ color: 'var(--ad-ember)' }} />
                  <Typography sx={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 20 }}>
                    GST Registration &amp; Entity Profile
                  </Typography>
                </Box>
                <Chip
                  label={profile.reviewStatus === 'verified' ? 'Verified Profile' : 'Pending Review'}
                  sx={{
                    bgcolor: profile.reviewStatus === 'verified' ? 'var(--ad-basil-wash)' : 'var(--ad-saffron-wash)',
                    color: profile.reviewStatus === 'verified' ? 'var(--ad-basil)' : 'var(--ad-warn)',
                    border: profile.reviewStatus === 'verified' ? '1px solid var(--ad-basil)' : '1px solid var(--ad-saffron)',
                    fontWeight: 700,
                    fontSize: 11,
                  }}
                  size="small"
                />
              </Box>
              <Divider sx={{ mb: 3, borderColor: 'var(--ad-line)' }} />

              <Grid container spacing={2.5}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={profile.isGstRegistered}
                        onChange={(e) => handleChange('isGstRegistered', e.target.checked)}
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': {
                            color: 'var(--ad-ember)',
                          },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                            backgroundColor: 'var(--ad-ember)',
                          },
                        }}
                      />
                    }
                    label={
                      <Typography variant="body2" fontWeight="600">
                        Business is Registered under Goods &amp; Services Tax (GST)
                      </Typography>
                    }
                  />
                </Grid>

                {profile.isGstRegistered && (
                  <>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="GSTIN (15 Digits)"
                        value={profile.gstin}
                        onChange={(e) => handleChange('gstin', e.target.value.toUpperCase())}
                        placeholder="e.g. 33AAACA1234A1Z5"
                        required
                        helperText="2-digit State code (33) + 10-char PAN + 1Z + checksum"
                        size="small"
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 'var(--ad-radius-sm)' } }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        select
                        fullWidth
                        label="Registration Scheme"
                        value={profile.registrationType}
                        onChange={(e) => handleChange('registrationType', e.target.value)}
                        size="small"
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 'var(--ad-radius-sm)' } }}
                      >
                        <MenuItem value="regular">Regular Scheme (5% Composite)</MenuItem>
                        <MenuItem value="composition">Composition Scheme (Section 10)</MenuItem>
                      </TextField>
                    </Grid>
                  </>
                )}

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Legal Entity Name"
                    value={profile.legalBusinessName}
                    onChange={(e) => handleChange('legalBusinessName', e.target.value)}
                    required
                    size="small"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 'var(--ad-radius-sm)' } }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Trade / Brand Name"
                    value={profile.tradeName}
                    onChange={(e) => handleChange('tradeName', e.target.value)}
                    size="small"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 'var(--ad-radius-sm)' } }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="State Jurisdiction"
                    value={profile.state}
                    onChange={(e) => handleChange('state', e.target.value)}
                    size="small"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 'var(--ad-radius-sm)' } }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="GST State Code"
                    value={profile.stateCode}
                    onChange={(e) => handleChange('stateCode', e.target.value)}
                    size="small"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 'var(--ad-radius-sm)' } }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    fullWidth
                    label="Restaurant Classification"
                    value={profile.restaurantCategory}
                    onChange={(e) => handleChange('restaurantCategory', e.target.value)}
                    size="small"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 'var(--ad-radius-sm)' } }}
                  >
                    <MenuItem value="standalone_restaurant">Standalone Restaurant (Food &amp; Dining)</MenuItem>
                    <MenuItem value="hotel_restaurant_declared_tariff_below_7500">Hotel Restaurant (&le; ₹7,500 tariff)</MenuItem>
                    <MenuItem value="hotel_restaurant_declared_tariff_above_7500">Hotel Restaurant (&gt; ₹7,500 tariff / 18%)</MenuItem>
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    fullWidth
                    label="Statutory Tax Treatment"
                    value={profile.taxTreatment}
                    onChange={(e) => handleChange('taxTreatment', e.target.value)}
                    size="small"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 'var(--ad-radius-sm)' } }}
                  >
                    <MenuItem value="5_percent_no_itc">5% GST without ITC (CBIC Standalone)</MenuItem>
                    <MenuItem value="18_percent_with_itc">18% GST with ITC (Luxury Premise)</MenuItem>
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Invoice Series Prefix"
                    value={profile.invoiceSeriesPrefix}
                    onChange={(e) => handleChange('invoiceSeriesPrefix', e.target.value.toUpperCase())}
                    helperText="Prefix for continuous fiscal numbering"
                    size="small"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 'var(--ad-radius-sm)' } }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Current Financial Year"
                    value={profile.financialYear}
                    onChange={(e) => handleChange('financialYear', e.target.value)}
                    size="small"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 'var(--ad-radius-sm)' } }}
                  />
                </Grid>
              </Grid>

              <Box sx={{ mt: 3.5, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<SaveIcon />}
                  disabled={saving}
                  sx={{
                    bgcolor: 'var(--ad-ember)',
                    color: '#ffffff',
                    borderRadius: 'var(--ad-radius-sm)',
                    fontWeight: 600,
                    textTransform: 'none',
                    px: 3,
                    py: 1,
                    '&:hover': { bgcolor: 'var(--ad-ember-deep)' },
                  }}
                >
                  {saving ? 'Saving...' : 'Save GST Profile'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Statutory Compliance Checklist Sidebar */}
        <Grid item xs={12} md={4}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 'var(--ad-radius)',
              border: '1px solid var(--ad-line)',
              bgcolor: 'var(--ad-surface-2)',
            }}
          >
            <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
              <Typography sx={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 18, mb: 0.5 }}>
                Statutory Compliance Checklist
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2 }}>
                Mandatory CBIC Restaurant Rules (Notification No. 11/2017-CT(R))
              </Typography>
              <Divider sx={{ mb: 2, borderColor: 'var(--ad-line)' }} />

              <List disablePadding>
                {[
                  { title: 'Standalone Restaurant Rate', desc: 'Charged strictly at 5% GST (2.5% CGST + 2.5% SGST) for intra-state food supplies.' },
                  { title: 'Zero Input Tax Credit (ITC)', desc: 'ITC on raw material and kitchen equipment inputs cannot be claimed or offset under 5% composite treatment.' },
                  { title: 'Continuous Fiscal Invoices', desc: 'Sequential invoice numbering with GSTIN and SAC code 996331 prominently displayed on customer bills.' },
                  { title: 'Reverse Charge Compliance', desc: 'Inward supplies from unregistered vendors tracked and reconciled under Section 9(4).' },
                  { title: 'GSTR-1 & GSTR-3B Synchronization', desc: 'Outward supplies reported in Table 7 B2CS must exactly match Table 3.1 of GSTR-3B.' },
                ].map((item, idx) => (
                  <ListItem key={idx} disableGutters sx={{ alignItems: 'flex-start', py: 1 }}>
                    <ListItemIcon sx={{ minWidth: 32, mt: 0.3 }}>
                      <CheckCircleIcon sx={{ color: 'var(--ad-basil)', fontSize: 19 }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={<Typography variant="body2" fontWeight="700">{item.title}</Typography>}
                      secondary={<Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.3 }}>{item.desc}</Typography>}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default GSTProfileTab;
