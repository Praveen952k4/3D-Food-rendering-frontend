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

import { generateGstr1, getGstr1, approveGstr1, submitGstr1 } from '../../../services/api';
import { formatINR } from '../../../config/business';
import { FONT_DISPLAY } from '../../../theme/muiTheme';

const GSTR1Tab = () => {
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

  useEffect(() => {
    loadDraft(period);
  }, [period]);

  const loadDraft = async (selectedPeriod) => {
    try {
      setLoading(true);
      setError(null);
      const res = await getGstr1(selectedPeriod);
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
      const res = await generateGstr1(period);
      if (res.data.success) {
        setDraft(res.data.draft);
        setSuccessMsg(res.data.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate GSTR-1 draft.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!draft) return;
    try {
      setSubmitting(true);
      setError(null);
      const res = await approveGstr1(draft._id, approvalNotes);
      if (res.data.success) {
        setDraft(res.data.draft);
        setSuccessMsg('GSTR-1 Draft approved by authorized signatory.');
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
      const res = await submitGstr1(draft._id);
      if (res.data.success) {
        setDraft(res.data.draft);
        setSuccessMsg(res.data.message);
      } else {
        setError(res.data.message || 'Submission was not completed.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Submission error.');
    } finally {
      setSubmitting(false);
    }
  };

  const hasBlockingErrors = draft?.validationErrors?.some((e) => e.severity === 'error');

  return (
    <Box sx={{ maxWidth: 1050, mx: 'auto' }}>
      {/* Header and Period Selector */}
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
            {draft ? 'Regenerate GSTR-1 Draft' : 'Generate GSTR-1 Draft'}
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
              No GSTR-1 Draft for Period {period}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 520, mx: 'auto', mb: 3 }}>
              Compile a statutory GSTR-1 return using your existing completed restaurant orders. You can review Table 7 B2CS, validate invoices, and sign off before transmission.
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
              Generate GSTR-1 Draft Now
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
              <AlertTitle sx={{ fontWeight: 700 }}>GSTR-1 Authoritatively Filed &amp; Transmitted</AlertTitle>
              Acknowledgement Reference Number (ARN): <strong style={{ color: 'var(--ad-basil)' }}>{draft.arn}</strong>
              <br />
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Filing confirmed on: {draft.filingDate ? new Date(draft.filingDate).toLocaleString() : 'Recent'}
              </Typography>
            </Alert>
          )}

          {/* Table 7: B2CS Outward Supplies Summary */}
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
                Table 7: B2C Small Supplies (Unregistered Consumer Dining)
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Restaurant services categorized under SAC 996331 (5% Standalone Rate, Intra-State).
              </Typography>
            </Box>

            <TableContainer>
              <Table size="small">
                <TableHead sx={{ bgcolor: 'var(--ad-surface-2)' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>TYPE</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>PLACE OF SUPPLY</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, color: 'text.secondary' }}>RATE</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: 'text.secondary' }}>TAXABLE VALUE</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: 'text.secondary' }}>CGST (2.5%)</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: 'text.secondary' }}>SGST (2.5%)</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: 'text.secondary' }}>TOTAL TAX</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {draft.payload?.b2cs && draft.payload.b2cs.length > 0 ? (
                    draft.payload.b2cs.map((row, idx) => (
                      <TableRow key={idx} hover sx={{ '&:hover': { bgcolor: 'var(--ad-surface-2)' } }}>
                        <TableCell sx={{ fontWeight: 600 }}>{row.sply_ty || 'Intra-State'}</TableCell>
                        <TableCell>{row.pos || '33 - Tamil Nadu'}</TableCell>
                        <TableCell align="center">{row.rt || 5.0}%</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>{formatINR(row.txval || 0)}</TableCell>
                        <TableCell align="right">{formatINR(row.camt || 0)}</TableCell>
                        <TableCell align="right">{formatINR(row.samt || 0)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: 'var(--ad-ember)' }}>
                          {formatINR((row.camt || 0) + (row.samt || 0))}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                        No B2CS transactions compiled in this draft.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* Manager Sign-Off & Submission Box */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 'var(--ad-radius)',
              border: '1px solid var(--ad-line)',
              bgcolor: 'var(--ad-surface-2)',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
              <Box>
                <Typography sx={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 18 }}>
                  Manager Authorization &amp; GSTN Submission
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                  {draft.managerApproval?.approved
                    ? `Sign-off complete by ${draft.managerApproval.approvedBy || 'Manager'} on ${new Date(draft.managerApproval.approvalDate).toLocaleDateString()}`
                    : 'Manager review and authorization sign-off required before provider transmission.'}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 1.5 }}>
                {!draft.managerApproval?.approved && draft.status !== 'filed' && (
                  <Button
                    variant="contained"
                    startIcon={<VerifiedUserIcon />}
                    onClick={() => setApprovalDialogOpen(true)}
                    disabled={hasBlockingErrors}
                    sx={{
                      bgcolor: 'var(--ad-basil)',
                      color: '#ffffff',
                      borderRadius: 'var(--ad-radius-sm)',
                      fontWeight: 600,
                      textTransform: 'none',
                      '&:hover': { bgcolor: 'var(--ad-basil-soft)' },
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
                      bgcolor: 'var(--ad-ember)',
                      color: '#ffffff',
                      borderRadius: 'var(--ad-radius-sm)',
                      fontWeight: 600,
                      textTransform: 'none',
                      '&:hover': { bgcolor: 'var(--ad-ember-deep)' },
                    }}
                  >
                    {submitting ? 'Transmitting...' : 'Transmit GSTR-1 to GSTN'}
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
          Authorize &amp; Sign-Off GSTR-1 Draft
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            I declare that I have verified the sales turnover, eligible standalone restaurant classification (5% without ITC), and continuous fiscal invoice series for period <strong>{period}</strong>.
          </Typography>
          <TextField
            fullWidth
            label="Manager Notes / Approval Reference"
            multiline
            rows={3}
            value={approvalNotes}
            onChange={(e) => setApprovalNotes(e.target.value)}
            placeholder="e.g. Verified with daily POS register; all 137 orders reconciled."
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
    </Box>
  );
};

export default GSTR1Tab;
