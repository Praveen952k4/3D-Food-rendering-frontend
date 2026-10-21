import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Alert,
  AlertTitle,
  CircularProgress,
  Divider,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import ArticleIcon from '@mui/icons-material/Article';
import PaymentIcon from '@mui/icons-material/Payment';

import { generateGstr3b, getGstr3b, approveGstr3b, submitGstr3b, createGstChallan } from '../../../services/api';
import { formatINR } from '../../../config/business';
import { FONT_DISPLAY } from '../../../theme/muiTheme';
import GSTPaymentModal from './GSTPaymentModal';

const GSTR3BTab = ({ onNavigateTab }) => {
  const getCurrentPeriod = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  const [period, setPeriod] = useState(getCurrentPeriod());
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState(null);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [challanCreated, setChallanCreated] = useState(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [activeChallanForPayment, setActiveChallanForPayment] = useState(null);

  useEffect(() => {
    loadDraft(period);
  }, [period]);

  const loadDraft = async (selectedPeriod) => {
    try {
      setLoading(true);
      setError(null);
      const res = await getGstr3b(selectedPeriod);
      if (res.data.success) {
        setDraft(res.data.draft);
      }
    } catch (err) {
      setDraft(null);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccessMsg(null);
      const res = await generateGstr3b(period);
      if (res.data.success) {
        setDraft(res.data.draft);
        setSuccessMsg(res.data.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate GSTR-3B draft.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!draft) return;
    try {
      setSubmitting(true);
      setError(null);
      const res = await approveGstr3b(draft._id, approvalNotes);
      if (res.data.success) {
        setDraft(res.data.draft);
        setSuccessMsg('GSTR-3B Draft approved by authorized signatory.');
        setApprovalDialogOpen(false);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Approval failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!draft) return;
    try {
      setSubmitting(true);
      setError(null);
      setSuccessMsg(null);
      const res = await submitGstr3b(draft._id);
      if (res.data.success) {
        setDraft(res.data.draft);
        setSuccessMsg(res.data.message);
      } else {
        setError(res.data.message || 'Submission failed.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Submission error.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateChallan = async () => {
    if (!draft) return;
    try {
      setSubmitting(true);
      setError(null);
      const res = await createGstChallan({
        period,
        netPayable: draft.netPayableAmount,
        cgst: draft.cgstAmount,
        sgst: draft.sgstAmount,
        igst: draft.igstAmount,
      });
      if (res.data.success) {
        setChallanCreated(res.data.challan);
        setSuccessMsg(`GST Payment Challan generated with CPIN: ${res.data.challan.cpin}`);
        return res.data.challan;
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate challan.');
      return null;
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDirectPay = async () => {
    if (!draft) return;
    try {
      let targetChallan = challanCreated;
      if (!targetChallan || targetChallan.period !== period) {
        targetChallan = await handleCreateChallan();
      }
      if (targetChallan) {
        setActiveChallanForPayment(targetChallan);
        setPaymentModalOpen(true);
      }
    } catch (err) {
      setError('Unable to open payment modal.');
    }
  };

  const handlePaymentSuccess = async (updatedChallan) => {
    setChallanCreated(updatedChallan);
    setSuccessMsg(`Tax payment of ${formatINR(updatedChallan.totalAmount)} confirmed with CIN: ${updatedChallan.cin}. Tax liability offset completed.`);
    await loadDraft(period);
  };

  return (
    <Box sx={{ maxWidth: 1050, mx: 'auto' }}>
      {/* Header and Controls */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            label="Reporting Period"
            type="month"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            InputLabelProps={{ shrink: true }}
            size="small"
            sx={{ minWidth: 200, '& .MuiOutlinedInput-root': { borderRadius: 'var(--ad-radius-sm)' } }}
          />
          <Button
            variant="contained"
            startIcon={<ArticleIcon />}
            onClick={handleGenerate}
            disabled={loading}
            sx={{
              bgcolor: 'var(--ad-ember)',
              color: '#ffffff',
              borderRadius: 'var(--ad-radius-sm)',
              fontWeight: 600,
              textTransform: 'none',
              '&:hover': { bgcolor: 'var(--ad-ember-deep)' },
            }}
          >
            {draft ? 'Regenerate GSTR-3B Draft' : 'Generate GSTR-3B Draft'}
          </Button>
        </Box>

        {draft && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip
              label={`Draft v${draft.version}`}
              variant="outlined"
              sx={{ borderRadius: 'var(--ad-radius-sm)', borderColor: 'var(--ad-line)', fontWeight: 600 }}
            />
            <Chip
              label={(draft.status || 'draft').toUpperCase()}
              sx={{
                borderRadius: 'var(--ad-radius-sm)',
                fontWeight: 700,
                bgcolor: draft.status === 'filed' ? 'var(--ad-basil-wash)' : draft.status === 'approved' ? 'var(--ad-ember-wash)' : 'var(--ad-saffron-wash)',
                color: draft.status === 'filed' ? 'var(--ad-basil)' : draft.status === 'approved' ? 'var(--ad-ember)' : 'var(--ad-warn)',
                border: draft.status === 'filed' ? '1px solid var(--ad-basil)' : '1px solid var(--ad-line)',
              }}
            />
          </Box>
        )}
      </Box>

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

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: 'var(--ad-ember)' }} />
        </Box>
      ) : !draft ? (
        <Card
          elevation={0}
          sx={{
            borderRadius: 'var(--ad-radius)',
            border: '1px solid var(--ad-line)',
            bgcolor: 'background.paper',
          }}
        >
          <CardContent sx={{ textAlign: 'center', py: 7 }}>
            <ArticleIcon sx={{ fontSize: 56, color: 'var(--ad-ember)', mb: 2 }} />
            <Typography sx={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 22, mb: 1 }}>
              No GSTR-3B Draft for Period {period}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 520, mx: 'auto', mb: 3 }}>
              Generate Table 3.1 outward supplies, review Section 17(5) ineligible ITC disclaimers, compute net tax payable, and authorize payment challans.
            </Typography>
            <Button
              variant="contained"
              onClick={handleGenerate}
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
              Generate GSTR-3B Draft Now
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Official ARN Banner if filed */}
          {draft.arn && (
            <Alert
              severity="success"
              sx={{
                mb: 3,
                borderRadius: 'var(--ad-radius)',
                bgcolor: 'var(--ad-basil-wash)',
                color: 'var(--ad-text)',
                border: '1px solid var(--ad-basil)',
              }}
              icon={<CheckCircleOutlineIcon sx={{ color: 'var(--ad-basil)' }} />}
            >
              <AlertTitle sx={{ fontWeight: 700 }}>GSTR-3B Authoritatively Filed &amp; Tax Settled</AlertTitle>
              Acknowledgement Reference Number (ARN): <strong style={{ color: 'var(--ad-basil)' }}>{draft.arn}</strong>
              <br />
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Filing confirmed on: {draft.filingDate ? new Date(draft.filingDate).toLocaleString() : 'Recent'}
              </Typography>
            </Alert>
          )}

          {/* Table 3.1: Details of Outward Supplies and inward supplies liable to reverse charge */}
          <Paper
            elevation={0}
            sx={{
              borderRadius: 'var(--ad-radius)',
              border: '1px solid var(--ad-line)',
              overflow: 'hidden',
              mb: 3,
              bgcolor: 'background.paper',
            }}
          >
            <Box sx={{ p: 2.5, borderBottom: '1px solid var(--ad-line)' }}>
              <Typography sx={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 18 }}>
                Table 3.1: Outward Taxable Supplies (Restaurant Dining)
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Summary of outward food services charged at 5% GST (Intra-state).
              </Typography>
            </Box>

            <TableContainer>
              <Table size="small">
                <TableHead sx={{ bgcolor: 'var(--ad-surface-2)' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>NATURE OF SUPPLY</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: 'text.secondary' }}>TOTAL TAXABLE VALUE</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: 'text.secondary' }}>INTEGRATED TAX (IGST)</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: 'text.secondary' }}>CENTRAL TAX (CGST 2.5%)</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: 'text.secondary' }}>STATE TAX (SGST 2.5%)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow hover sx={{ '&:hover': { bgcolor: 'var(--ad-surface-2)' } }}>
                    <TableCell sx={{ fontWeight: 600 }}>(a) Outward taxable supplies (other than zero rated)</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>{formatINR(draft.taxableTurnover || 0)}</TableCell>
                    <TableCell align="right">{formatINR(draft.igstAmount || 0)}</TableCell>
                    <TableCell align="right">{formatINR(draft.cgstAmount || 0)}</TableCell>
                    <TableCell align="right">{formatINR(draft.sgstAmount || 0)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* Table 4: Eligible & Ineligible ITC */}
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 'var(--ad-radius)',
              border: '1px solid var(--ad-line)',
              mb: 3,
              bgcolor: 'var(--ad-surface-2)',
            }}
          >
            <Typography sx={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 18, mb: 0.5 }}>
              Table 4: Input Tax Credit (ITC) Summary
            </Typography>
            <Alert
              severity="warning"
              sx={{
                mt: 1.5,
                bgcolor: 'var(--ad-saffron-wash)',
                border: '1px solid var(--ad-saffron)',
                borderRadius: 'var(--ad-radius-sm)',
                color: 'var(--ad-text)',
              }}
            >
              <Typography variant="subtitle2" fontWeight="700">
                Ineligible ITC under Section 17(5)
              </Typography>
              <Typography variant="caption" sx={{ color: 'var(--ad-text-2)' }}>
                Per CBIC Notification No. 11/2017-CT(R), standalone restaurants enjoy the concessional 5% GST rate subject to the strict statutory condition that credit of input tax charged on goods and services used in supplying the service has NOT been taken. Eligible ITC claimed: ₹0.00.
              </Typography>
            </Alert>
          </Paper>

          {/* Table 6.1: Payment of Tax & Liability Callout */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 'var(--ad-radius)',
              border: '1px solid var(--ad-line)',
              mb: 3,
              bgcolor: 'background.paper',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
              <Box>
                <Typography sx={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 18 }}>
                  Table 6.1: Net Tax Payable
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Total outward tax payable in cash via Electronic Cash Ledger.
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    CGST: <strong>{formatINR(draft.cgstAmount || 0)}</strong>
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    SGST: <strong>{formatINR(draft.sgstAmount || 0)}</strong>
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', fontWeight: 700 }}>
                  NET TAX PAYABLE
                </Typography>
                <Typography sx={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 28, color: 'var(--ad-ember)' }}>
                  {formatINR(draft.netPayableAmount || 0)}
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 2.5, borderColor: 'var(--ad-line)' }} />

            {/* Direct Online Payment & Challan Actions */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {challanCreated?.cin
                  ? `Offset recorded with CIN: ${challanCreated.cin}`
                  : 'Pay tax liability via Electronic Cash Ledger challan to offset return dues.'}
              </Typography>

              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  startIcon={<PaymentIcon />}
                  onClick={handleOpenDirectPay}
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
                  Pay Dues Online (Dev Sandbox)
                </Button>

                {!draft.managerApproval?.approved && draft.status !== 'filed' && (
                  <Button
                    variant="outlined"
                    startIcon={<VerifiedUserIcon />}
                    onClick={() => setApprovalDialogOpen(true)}
                    sx={{
                      borderColor: 'var(--ad-basil)',
                      color: 'var(--ad-basil)',
                      borderRadius: 'var(--ad-radius-sm)',
                      fontWeight: 600,
                      textTransform: 'none',
                      '&:hover': { bgcolor: 'var(--ad-basil-wash)', borderColor: 'var(--ad-basil)' },
                    }}
                  >
                    Authorize Sign-Off
                  </Button>
                )}

                {draft.managerApproval?.approved && draft.status !== 'filed' && (
                  <Button
                    variant="contained"
                    startIcon={<SendIcon />}
                    onClick={handleSubmit}
                    disabled={submitting}
                    sx={{
                      bgcolor: 'var(--ad-basil)',
                      color: '#ffffff',
                      borderRadius: 'var(--ad-radius-sm)',
                      fontWeight: 600,
                      textTransform: 'none',
                      '&:hover': { bgcolor: 'var(--ad-basil-soft)' },
                    }}
                  >
                    {submitting ? 'Filing...' : 'Submit & Offset GSTR-3B'}
                  </Button>
                )}
              </Box>
            </Box>
          </Paper>
        </>
      )}

      {/* Approval Dialog */}
      <Dialog
        open={approvalDialogOpen}
        onClose={() => setApprovalDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 'var(--ad-radius)' } }}
      >
        <DialogTitle sx={{ fontFamily: FONT_DISPLAY, fontWeight: 600 }}>
          Authorize &amp; Sign-Off GSTR-3B Draft
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            I confirm that outward supplies reported in Table 3.1 match our GSTR-1 return, ineligible ITC has been appropriately flagged, and net tax payable of <strong>{formatINR(draft?.netPayableAmount || 0)}</strong> has been verified.
          </Typography>
          <TextField
            fullWidth
            label="Manager Sign-off Notes"
            multiline
            rows={3}
            value={approvalNotes}
            onChange={(e) => setApprovalNotes(e.target.value)}
            placeholder="e.g. Cross-checked with GSTR-1 and bank payments."
            size="small"
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 'var(--ad-radius-sm)' } }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setApprovalDialogOpen(false)} sx={{ textTransform: 'none', color: 'text.secondary' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleApprove}
            disabled={submitting}
            sx={{
              bgcolor: 'var(--ad-basil)',
              color: '#ffffff',
              borderRadius: 'var(--ad-radius-sm)',
              fontWeight: 600,
              textTransform: 'none',
              '&:hover': { bgcolor: 'var(--ad-basil-soft)' },
            }}
          >
            {submitting ? 'Signing...' : 'Confirm Sign-Off'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* In-App Direct Payment Modal */}
      <GSTPaymentModal
        open={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        challan={activeChallanForPayment}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </Box>
  );
};

export default GSTR3BTab;
