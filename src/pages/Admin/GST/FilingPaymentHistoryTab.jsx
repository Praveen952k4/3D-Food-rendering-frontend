import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  CircularProgress,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PaymentIcon from '@mui/icons-material/Payment';

import { getGstHistory, verifyGstPayment } from '../../../services/api';
import { formatINR } from '../../../config/business';
import { FONT_DISPLAY } from '../../../theme/muiTheme';
import GSTPaymentModal from './GSTPaymentModal';

const FilingPaymentHistoryTab = () => {
  const [loading, setLoading] = useState(true);
  const [returns, setReturns] = useState([]);
  const [challans, setChallans] = useState([]);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Payment confirmation dialog
  const [selectedChallan, setSelectedChallan] = useState(null);
  const [cin, setCin] = useState('');
  const [brn, setBrn] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('net_banking');
  const [submitting, setSubmitting] = useState(false);

  // In-App direct payment dialog
  const [directPayModalOpen, setDirectPayModalOpen] = useState(false);
  const [challanForDirectPay, setChallanForDirectPay] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getGstHistory();
      if (res.data.success) {
        setReturns(res.data.returns || []);
        setChallans(res.data.challans || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load history.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDirectPay = (challan) => {
    setChallanForDirectPay(challan);
    setDirectPayModalOpen(true);
  };

  const handleDirectPaymentSuccess = async (paidChallan) => {
    setSuccessMsg(`Direct tax payment completed for CPIN: ${paidChallan.cpin} with CIN: ${paidChallan.cin}. Tax liability offset completed.`);
    await fetchHistory();
  };

  const handleOpenPaymentDialog = (challan) => {
    setSelectedChallan(challan);
    setCin('');
    setBrn('');
    setPaymentMethod('net_banking');
  };

  const handleConfirmPayment = async (e) => {
    e.preventDefault();
    if (!selectedChallan || !cin.trim()) return;

    try {
      setSubmitting(true);
      setError(null);
      const res = await verifyGstPayment({
        challanId: selectedChallan._id,
        cin: cin.trim(),
        brn: brn.trim(),
        paymentMethod,
      });

      if (res.data.success) {
        setSuccessMsg('Payment confirmation & CIN recorded successfully.');
        setSelectedChallan(null);
        fetchHistory();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed.');
    } finally {
      setSubmitting(false);
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
    <Box sx={{ maxWidth: 1050, mx: 'auto' }}>
      {successMsg && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: 'var(--ad-radius-sm)' }} onClose={() => setSuccessMsg(null)}>
          {successMsg}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 'var(--ad-radius-sm)' }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filed Returns Archive Table */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 'var(--ad-radius)',
          border: '1px solid var(--ad-line)',
          overflow: 'hidden',
          mb: 4,
          bgcolor: 'background.paper',
        }}
      >
        <Box sx={{ p: 2.5, borderBottom: '1px solid var(--ad-line)' }}>
          <Typography sx={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 18 }}>
            Filed GST Returns Archive &amp; Reference Log
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Historical record of GSTR-1 and GSTR-3B filings with official Acknowledgement Reference Numbers (ARNs).
          </Typography>
        </Box>

        <TableContainer>
          <Table size="small">
            <TableHead sx={{ bgcolor: 'var(--ad-surface-2)' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>RETURN TYPE</TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>PERIOD</TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>STATUS</TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>ACKNOWLEDGEMENT REF (ARN)</TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>FILING DATE</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: 'text.secondary' }}>NET TAX / TURNOVER</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {returns.length > 0 ? (
                returns.map((ret, idx) => (
                  <TableRow key={idx} hover sx={{ '&:hover': { bgcolor: 'var(--ad-surface-2)' } }}>
                    <TableCell sx={{ fontWeight: 700 }}>
                      <Chip
                        label={ret.returnType}
                        size="small"
                        sx={{
                          bgcolor: ret.returnType === 'GSTR1' ? 'var(--ad-ember-wash)' : 'var(--ad-basil-wash)',
                          color: ret.returnType === 'GSTR1' ? 'var(--ad-ember)' : 'var(--ad-basil)',
                          fontWeight: 700,
                          fontSize: 10,
                          borderRadius: 'var(--ad-radius-sm)',
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{ret.period}</TableCell>
                    <TableCell>
                      <Chip
                        label={(ret.status || 'draft').toUpperCase()}
                        size="small"
                        sx={{
                          borderRadius: 'var(--ad-radius-sm)',
                          fontWeight: 700,
                          fontSize: 10,
                          bgcolor: ret.status === 'filed' ? 'var(--ad-basil-wash)' : 'var(--ad-saffron-wash)',
                          color: ret.status === 'filed' ? 'var(--ad-basil)' : 'var(--ad-warn)',
                          border: ret.status === 'filed' ? '1px solid var(--ad-basil)' : '1px solid var(--ad-saffron)',
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontWeight: 700, color: ret.arn ? 'var(--ad-basil)' : 'text.disabled' }}>
                      {ret.arn || 'Pending Submission'}
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>
                      {ret.filingDate ? new Date(ret.filingDate).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      {formatINR(ret.netPayableAmount || ret.taxableTurnover || 0)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No return history recorded yet. Returns filed through GSTR-1 or GSTR-3B will appear here.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Payment Challans Section */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 'var(--ad-radius)',
          border: '1px solid var(--ad-line)',
          overflow: 'hidden',
          bgcolor: 'background.paper',
        }}
      >
        <Box sx={{ p: 2.5, borderBottom: '1px solid var(--ad-line)' }}>
          <Typography sx={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 18 }}>
            GST Payment Challans (PMT-06 Electronic Cash Ledger)
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Generated CPINs, in-app direct sandbox settlements, and 17-digit CIN bank receipts.
          </Typography>
        </Box>

        <TableContainer>
          <Table size="small">
            <TableHead sx={{ bgcolor: 'var(--ad-surface-2)' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>CPIN NUMBER</TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>PERIOD</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: 'text.secondary' }}>AMOUNT</TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>PAYMENT STATUS</TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>BANK CIN</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: 'text.secondary' }}>ACTIONS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {challans.length > 0 ? (
                challans.map((ch, idx) => (
                  <TableRow key={idx} hover sx={{ '&:hover': { bgcolor: 'var(--ad-surface-2)' } }}>
                    <TableCell sx={{ fontFamily: 'monospace', fontWeight: 700 }}>{ch.cpin}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{ch.period}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: 'var(--ad-ember)' }}>
                      {formatINR(ch.totalAmount || 0)}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={(ch.paymentStatus || 'pending').toUpperCase()}
                        size="small"
                        sx={{
                          borderRadius: 'var(--ad-radius-sm)',
                          fontWeight: 700,
                          fontSize: 10,
                          bgcolor: ch.paymentStatus === 'paid' ? 'var(--ad-basil-wash)' : 'var(--ad-saffron-wash)',
                          color: ch.paymentStatus === 'paid' ? 'var(--ad-basil)' : 'var(--ad-warn)',
                          border: ch.paymentStatus === 'paid' ? '1px solid var(--ad-basil)' : '1px solid var(--ad-saffron)',
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: 12, color: ch.cin ? 'var(--ad-basil)' : 'text.disabled' }}>
                      {ch.cin || 'Awaiting Payment'}
                    </TableCell>
                    <TableCell align="center">
                      {ch.paymentStatus !== 'paid' ? (
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                          <Button
                            size="small"
                            variant="contained"
                            startIcon={<PaymentIcon />}
                            onClick={() => handleOpenDirectPay(ch)}
                            sx={{
                              bgcolor: 'var(--ad-ember)',
                              color: '#ffffff',
                              borderRadius: 'var(--ad-radius-sm)',
                              fontWeight: 600,
                              textTransform: 'none',
                              fontSize: 11,
                              '&:hover': { bgcolor: 'var(--ad-ember-deep)' },
                            }}
                          >
                            Pay Online (Sandbox)
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleOpenPaymentDialog(ch)}
                            sx={{
                              borderColor: 'var(--ad-line)',
                              color: 'text.primary',
                              borderRadius: 'var(--ad-radius-sm)',
                              fontWeight: 600,
                              textTransform: 'none',
                              fontSize: 11,
                            }}
                          >
                            Record Bank CIN
                          </Button>
                        </Box>
                      ) : (
                        <Chip
                          icon={<CheckCircleIcon sx={{ fontSize: 14 }} />}
                          label="Liability Offset"
                          size="small"
                          sx={{
                            bgcolor: 'var(--ad-basil-wash)',
                            color: 'var(--ad-basil)',
                            fontWeight: 700,
                            fontSize: 11,
                            borderRadius: 'var(--ad-radius-sm)',
                          }}
                        />
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No payment challans generated yet. Create a challan from the GSTR-3B tab to offset tax dues.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Manual CIN Confirmation Dialog */}
      <Dialog
        open={!!selectedChallan}
        onClose={() => setSelectedChallan(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 'var(--ad-radius)' } }}
      >
        <DialogTitle sx={{ fontFamily: FONT_DISPLAY, fontWeight: 600 }}>
          Record Bank CIN Payment
        </DialogTitle>
        <Box component="form" onSubmit={handleConfirmPayment}>
          <DialogContent dividers sx={{ borderColor: 'var(--ad-line)' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
              CPIN: <strong>{selectedChallan?.cpin}</strong> | Amount:{' '}
              <strong style={{ color: 'var(--ad-ember)' }}>{formatINR(selectedChallan?.totalAmount || 0)}</strong>
            </Typography>

            <TextField
              fullWidth
              label="17-Digit Bank CIN"
              value={cin}
              onChange={(e) => setCin(e.target.value.toUpperCase())}
              required
              placeholder="e.g. HDFC2610189912345"
              helperText="3-character Bank code + 14-digit number"
              size="small"
              sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 'var(--ad-radius-sm)' } }}
            />

            <TextField
              fullWidth
              label="Bank Reference Number (BRN)"
              value={brn}
              onChange={(e) => setBrn(e.target.value)}
              placeholder="Optional transaction reference"
              size="small"
              sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 'var(--ad-radius-sm)' } }}
            />

            <TextField
              select
              fullWidth
              label="Payment Channel"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              size="small"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 'var(--ad-radius-sm)' } }}
            >
              <MenuItem value="net_banking">Internet Banking</MenuItem>
              <MenuItem value="over_the_counter">Over the Counter (Cheque/Cash)</MenuItem>
              <MenuItem value="neft_rtgs">NEFT / RTGS</MenuItem>
            </TextField>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setSelectedChallan(null)} sx={{ textTransform: 'none', color: 'text.secondary' }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
              sx={{
                bgcolor: 'var(--ad-ember)',
                color: '#ffffff',
                borderRadius: 'var(--ad-radius-sm)',
                fontWeight: 600,
                textTransform: 'none',
                '&:hover': { bgcolor: 'var(--ad-ember-deep)' },
              }}
            >
              {submitting ? 'Confirming...' : 'Record Payment'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* In-App Direct Payment Modal */}
      <GSTPaymentModal
        open={directPayModalOpen}
        onClose={() => setDirectPayModalOpen(false)}
        challan={challanForDirectPay}
        onPaymentSuccess={handleDirectPaymentSuccess}
      />
    </Box>
  );
};

export default FilingPaymentHistoryTab;
