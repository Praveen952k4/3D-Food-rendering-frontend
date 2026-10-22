import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  TextField,
  MenuItem,
  Alert,
  AlertTitle,
  CircularProgress,
  Chip,
  Divider,
  Paper,
  Grid,
} from '@mui/material';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SecurityIcon from '@mui/icons-material/Security';

import { payGstDirect } from '../../../services/api';
import { formatINR } from '../../../config/business';
import { FONT_DISPLAY } from '../../../theme/muiTheme';

const GSTPaymentModal = ({ open, onClose, challan, onPaymentSuccess }) => {
  const [bankCode, setBankCode] = useState('HDFC');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentResult, setPaymentResult] = useState(null);

  if (!challan) return null;

  const banks = [
    { code: 'HDFC', name: 'HDFC Bank' },
    { code: 'SBIN', name: 'State Bank of India (SBI)' },
    { code: 'ICIC', name: 'ICICI Bank' },
    { code: 'UTIB', name: 'Axis Bank' },
    { code: 'KKBK', name: 'Kotak Mahindra Bank' },
    { code: 'PUNB', name: 'Punjab National Bank (PNB)' },
  ];

  const handlePay = async (e) => {
    e.preventDefault();
    if (!otp.trim()) {
      setError('Please enter the 6-digit simulated bank OTP (or click the quick-fill chip).');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await payGstDirect({
        challanId: challan._id,
        paymentMethod: 'net_banking',
        bankName: bankCode,
      });

      if (res.data.success) {
        setPaymentResult(res.data.paymentResult || res.data.challan);
        if (onPaymentSuccess) {
          onPaymentSuccess(res.data.challan);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Payment simulation failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPaymentResult(null);
    setOtp('');
    setError(null);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 'var(--ad-radius)',
          border: '1px solid var(--ad-line)',
          bgcolor: 'var(--ad-surface)',
          color: 'var(--ad-text)',
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1, color: 'var(--ad-text)' }}>
        <AccountBalanceIcon sx={{ color: 'var(--ad-ember)' }} />
        <Typography sx={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 20, color: 'inherit' }}>
          Pay GST Dues Online
        </Typography>
        <Chip
          label="DEV SANDBOX"
          size="small"
          sx={{
            ml: 'auto',
            bgcolor: 'var(--ad-ember-wash)',
            color: 'var(--ad-ember)',
            fontWeight: 800,
            fontSize: 10,
            border: '1px solid var(--ad-ember)',
          }}
        />
      </DialogTitle>

      <DialogContent dividers sx={{ borderColor: 'var(--ad-line)' }}>
        {/* Development Sandbox Safety Notice */}
        <Alert
          severity="info"
          sx={{
            mb: 3,
            borderRadius: 'var(--ad-radius-sm)',
            bgcolor: 'var(--ad-surface-2)',
            color: 'var(--ad-text)',
            border: '1px solid var(--ad-line)',
          }}
          icon={<SecurityIcon sx={{ color: 'var(--ad-ember)' }} />}
        >
          <AlertTitle sx={{ fontWeight: 700 }}>Sandbox Feasibility Simulation</AlertTitle>
          This is an interactive development simulation. <strong>No real money will be debited</strong> and zero live government APIs or banks are contacted. It validates the user experience, CIN generation, and automated liability offset.
        </Alert>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 'var(--ad-radius-sm)' }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {paymentResult ? (
          // Success Receipt View
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <CheckCircleIcon sx={{ fontSize: 60, color: 'var(--ad-basil)', mb: 1 }} />
            <Typography sx={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 22, color: 'var(--ad-basil)', mb: 0.5 }}>
              Payment Confirmed!
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
              Tax liability for period <strong>{challan.period}</strong> has been successfully offset.
            </Typography>

            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                bgcolor: 'var(--ad-surface-2)',
                border: '1px solid var(--ad-line)',
                borderRadius: 'var(--ad-radius-sm)',
                textAlign: 'left',
              }}
            >
              <Grid container spacing={1.5}>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', fontWeight: 600 }}>CHALLAN CPIN</Typography>
                  <Typography variant="body2" fontWeight="700">{challan.cpin}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', fontWeight: 600 }}>AMOUNT PAID</Typography>
                  <Typography variant="body2" fontWeight="800" sx={{ color: 'var(--ad-ember)' }}>
                    {formatINR(challan.totalAmount)}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Divider sx={{ my: 0.5, borderColor: 'var(--ad-line)' }} />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', fontWeight: 600 }}>CHALLAN IDENTIFICATION NUMBER (CIN)</Typography>
                  <Typography variant="body1" fontWeight="800" sx={{ fontFamily: 'monospace', color: 'var(--ad-basil)', letterSpacing: '0.5px' }}>
                    {paymentResult.cin}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', fontWeight: 600 }}>BANK REF NUMBER (BRN)</Typography>
                  <Typography variant="body2">{paymentResult.brn}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', fontWeight: 600 }}>PAYMENT CHANNEL</Typography>
                  <Typography variant="body2">{paymentResult.paymentMode?.toUpperCase() || 'NET_BANKING'}</Typography>
                </Grid>
              </Grid>
            </Paper>

            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 2 }}>
              &bull; Official 17-digit CIN has been attached to the challan and audit trail.
            </Typography>
          </Box>
        ) : (
          // Payment Form View
          <Box component="form" onSubmit={handlePay}>
            {/* Challan Summary Card */}
            <Paper
              elevation={0}
              sx={{
                p: 2,
                bgcolor: 'var(--ad-surface-2)',
                border: '1px solid var(--ad-line)',
                borderRadius: 'var(--ad-radius-sm)',
                mb: 3,
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    CHALLAN CPIN: <strong>{challan.cpin}</strong>
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Period: {challan.period} &bull; GSTR-3B Tax Dues
                  </Typography>
                </div>
                <Typography variant="h5" fontWeight="800" sx={{ color: 'var(--ad-ember)' }}>
                  {formatINR(challan.totalAmount)}
                </Typography>
              </Box>
            </Paper>

            {/* Statutory Payment Channel */}
            <Box sx={{ mb: 2.5 }}>
              <Typography variant="caption" sx={{ color: 'var(--ad-text-2)', fontWeight: 700, textTransform: 'uppercase', display: 'block', mb: 1, letterSpacing: '0.5px' }}>
                Statutory Payment Channel
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  p: 1.5,
                  bgcolor: 'var(--ad-surface-2)',
                  borderRadius: 'var(--ad-radius-sm)',
                  border: '1px solid var(--ad-line)',
                }}
              >
                <AccountBalanceIcon sx={{ color: 'var(--ad-ember)', fontSize: 24 }} />
                <Box>
                  <Typography variant="body2" fontWeight="700" sx={{ color: 'var(--ad-text)' }}>
                    Internet Banking (Authorized Agency Bank)
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'var(--ad-text-2)', display: 'block' }}>
                    Form GST PMT-06 electronic tax remittance via designated GST collection gateway
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Select Authorized Bank */}
            <TextField
              select
              fullWidth
              label="Select Authorized Bank"
              value={bankCode}
              onChange={(e) => setBankCode(e.target.value)}
              sx={{
                mb: 2.5,
                '& .MuiOutlinedInput-root': { borderRadius: 'var(--ad-radius-sm)' },
                '& .MuiInputLabel-root': { color: 'var(--ad-text-2)' },
                '& .MuiSelect-select': { color: 'var(--ad-text)' },
              }}
              size="small"
            >
              {banks.map((b) => (
                <MenuItem key={b.code} value={b.code}>
                  {b.name}
                </MenuItem>
              ))}
            </TextField>

            {/* 2FA OTP Prompt */}
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                <Typography variant="caption" fontWeight="700" sx={{ color: 'text.secondary' }}>
                  Simulated Bank 2FA OTP
                </Typography>
                <Chip
                  label="Quick Fill: 123456"
                  size="small"
                  onClick={() => setOtp('123456')}
                  clickable
                  sx={{
                    bgcolor: 'var(--ad-ember-wash)',
                    color: 'var(--ad-ember)',
                    fontWeight: 700,
                    fontSize: 10,
                  }}
                />
              </Box>
              <TextField
                fullWidth
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter 6-digit OTP"
                size="small"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 'var(--ad-radius-sm)' } }}
              />
            </Box>

            <DialogActions sx={{ px: 0, pt: 1 }}>
              <Button onClick={handleClose} sx={{ textTransform: 'none', color: 'text.secondary' }}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                sx={{
                  bgcolor: 'var(--ad-ember)',
                  color: '#ffffff',
                  borderRadius: 'var(--ad-radius-sm)',
                  fontWeight: 600,
                  textTransform: 'none',
                  px: 3,
                  '&:hover': { bgcolor: 'var(--ad-ember-deep)' },
                }}
              >
                {loading ? <CircularProgress size={20} color="inherit" /> : `Authorize Payment (${formatINR(challan.totalAmount)})`}
              </Button>
            </DialogActions>
          </Box>
        )}
      </DialogContent>

      {paymentResult && (
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={handleClose}
            variant="contained"
            sx={{
              bgcolor: 'var(--ad-basil)',
              color: '#ffffff',
              borderRadius: 'var(--ad-radius-sm)',
              fontWeight: 600,
              textTransform: 'none',
              px: 3,
              '&:hover': { bgcolor: 'var(--ad-basil-soft)' },
            }}
          >
            Done
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};

export default GSTPaymentModal;
