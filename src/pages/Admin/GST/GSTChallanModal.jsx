import React, { useMemo, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  IconButton,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PrintIcon from '@mui/icons-material/Print';
import DownloadIcon from '@mui/icons-material/Download';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import CodeIcon from '@mui/icons-material/Code';

import { useThemeMode } from '../../../context/ThemeContext';
import { FONT_DISPLAY } from '../../../theme/muiTheme';
import { formatINR } from '../../../config/business';
import { parseChallanFromEvent, numberToWordsINR, buildChallanPdf } from '../../../utils/challanPdf';

const GSTChallanModal = ({ open, event, profile, onClose }) => {
  const frameRef = useRef(null);
  const { isDark } = useThemeMode();

  const challan = useMemo(() => {
    return parseChallanFromEvent(event, profile);
  }, [event, profile]);

  if (!challan) return null;

  const handleDownloadPdf = () => {
    try {
      const doc = buildChallanPdf(challan);
      doc.save(`GST-Challan-PMT06-${challan.cpin || 'receipt'}.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    }
  };

  const handlePrint = () => {
    try {
      const doc = buildChallanPdf(challan);
      const blobUrl = URL.createObjectURL(doc.output('blob'));

      const isMobile = typeof window !== 'undefined' && window.innerWidth < 600;
      if (isMobile) {
        window.open(blobUrl, '_blank', 'noopener');
        return;
      }

      // Hidden iframe print
      if (frameRef.current) {
        frameRef.current.remove();
      }
      const frame = document.createElement('iframe');
      frame.style.position = 'fixed';
      frame.style.right = '0';
      frame.style.bottom = '0';
      frame.style.width = '0';
      frame.style.height = '0';
      frame.style.border = '0';
      frame.src = blobUrl;
      frame.onload = () => {
        try {
          frame.contentWindow.focus();
          frame.contentWindow.print();
        } catch {
          window.open(blobUrl, '_blank', 'noopener');
        }
        setTimeout(() => {
          frame.remove();
          URL.revokeObjectURL(blobUrl);
        }, 60000);
      };
      document.body.appendChild(frame);
      frameRef.current = frame;
    } catch (err) {
      console.error('Print failed:', err);
      window.print();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 'var(--ad-radius)',
          bgcolor: 'var(--ad-surface)',
          color: 'var(--ad-text)',
          border: '1px solid var(--ad-line)',
          maxHeight: '94vh',
          backgroundImage: 'none',
        },
      }}
    >
      {/* Modal Action Header */}
      <DialogTitle
        sx={{
          p: { xs: 2, sm: 2.5 },
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid var(--ad-line)',
          bgcolor: 'var(--ad-surface-2)',
          color: 'var(--ad-text)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: '10px',
              bgcolor: 'var(--ad-ember-wash)',
              color: 'var(--ad-ember)',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <AccountBalanceIcon sx={{ fontSize: 20 }} />
          </Box>
          <Box>
            <Typography sx={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: { xs: 16, sm: 18 }, color: 'var(--ad-text)' }}>
              FORM GST PMT-06: Tax Deposit Challan
            </Typography>
            <Typography variant="caption" sx={{ color: 'var(--ad-text-2)', display: 'block' }}>
              Action: <strong style={{ color: 'var(--ad-text)' }}>{challan.action}</strong> &bull; Ref: {challan.correlationId}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            size="small"
            variant="contained"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
            sx={{
              bgcolor: 'var(--ad-ember)',
              color: '#ffffff',
              fontWeight: 600,
              textTransform: 'none',
              borderRadius: 'var(--ad-radius-sm)',
              '&:hover': { bgcolor: 'var(--ad-ember-deep)' },
            }}
          >
            Print Challan
          </Button>

          <Button
            size="small"
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleDownloadPdf}
            sx={{
              borderColor: 'var(--ad-line)',
              color: 'var(--ad-text)',
              fontWeight: 600,
              textTransform: 'none',
              borderRadius: 'var(--ad-radius-sm)',
              '&:hover': { borderColor: 'var(--ad-line-strong)', bgcolor: 'var(--ad-surface-2)' },
            }}
          >
            PDF
          </Button>

          <IconButton onClick={onClose} size="small" sx={{ color: 'var(--ad-text-2)', '&:hover': { color: 'var(--ad-text)' } }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </DialogTitle>

      {/* Challan Document Body */}
      <DialogContent sx={{ p: { xs: 2, sm: 3 }, bgcolor: 'var(--ad-bg-2)' }}>
        {/* Printable Form GST PMT-06 Card */}
        <Paper
          elevation={0}
          id="printable-gst-challan"
          sx={{
            p: { xs: 2.5, sm: 4 },
            borderRadius: 'var(--ad-radius-sm)',
            border: '1px solid var(--ad-line-strong)',
            bgcolor: 'var(--ad-surface)',
            color: 'var(--ad-text)',
            boxShadow: 'var(--ad-shadow-sm)',
            mx: 'auto',
            maxWidth: 800,
            backgroundImage: 'none',
          }}
        >
          {/* Official Document Banner */}
          <Box sx={{ textAlign: 'center', pb: 2, borderBottom: '2px solid var(--ad-line-strong)', mb: 2.5 }}>
            <Typography sx={{ fontWeight: 800, fontSize: 16, letterSpacing: '0.5px', color: 'var(--ad-text)' }}>
              GOODS AND SERVICES TAX (GST) PAYMENT CHALLAN
            </Typography>
            <Typography sx={{ fontWeight: 700, fontSize: 13, color: 'var(--ad-ember)', mt: 0.5 }}>
              FORM GST PMT-06
            </Typography>
            <Typography variant="caption" sx={{ color: 'var(--ad-text-2)', display: 'block', mt: 0.25 }}>
              [See Rule 87(2)] &bull; Challan for Deposit of Goods and Services Tax
            </Typography>
          </Box>

          {/* Identification & Status Grid */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              gap: 1.5,
              p: 2,
              bgcolor: 'var(--ad-surface-2)',
              border: '1px solid var(--ad-line)',
              borderRadius: 'var(--ad-radius-sm)',
              mb: 2.5,
            }}
          >
            <Box>
              <Typography variant="caption" sx={{ color: 'var(--ad-text-2)', display: 'block' }}>
                CPIN (Common Portal Identification No.)
              </Typography>
              <Typography sx={{ fontWeight: 700, fontSize: 14, fontFamily: 'monospace', color: 'var(--ad-text)' }}>
                {challan.cpin}
              </Typography>

              <Typography variant="caption" sx={{ color: 'var(--ad-text-2)', display: 'block', mt: 1 }}>
                Generation Date &amp; Time
              </Typography>
              <Typography sx={{ fontWeight: 600, fontSize: 13, color: 'var(--ad-text)' }}>
                {new Date(challan.challanDate).toLocaleString('en-IN')}
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption" sx={{ color: 'var(--ad-text-2)', display: 'block' }}>
                CIN (Bank Challan Identification No.)
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography sx={{ fontWeight: 700, fontSize: 14, fontFamily: 'monospace', color: 'var(--ad-text)' }}>
                  {challan.cin || 'Pending Bank Realization'}
                </Typography>
                {challan.isPaid && (
                  <Chip
                    icon={<CheckCircleIcon sx={{ fontSize: 13, color: 'inherit !important' }} />}
                    label="PAID"
                    size="small"
                    sx={{
                      bgcolor: 'var(--ad-basil-wash)',
                      color: 'var(--ad-basil)',
                      border: '1px solid var(--ad-basil)',
                      fontWeight: 700,
                      fontSize: 10,
                      height: 20,
                    }}
                  />
                )}
              </Box>

              <Typography variant="caption" sx={{ color: 'var(--ad-text-2)', display: 'block', mt: 1 }}>
                Reporting Tax Period &bull; Payment Mode
              </Typography>
              <Typography sx={{ fontWeight: 600, fontSize: 13, color: 'var(--ad-text)' }}>
                {challan.period} &bull; {challan.paymentMethod}
              </Typography>
            </Box>
          </Box>

          {/* Section 1: Taxpayer Particulars */}
          <Box sx={{ mb: 2.5 }}>
            <Typography sx={{ fontWeight: 700, fontSize: 12, color: 'var(--ad-text)', mb: 1, textTransform: 'uppercase' }}>
              1. Details of Taxpayer
            </Typography>
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid var(--ad-line)', borderRadius: 'var(--ad-radius-sm)', bgcolor: 'var(--ad-surface)' }}>
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell sx={{ bgcolor: 'var(--ad-surface-2)', fontWeight: 600, width: '22%', color: 'var(--ad-text-2)', py: 1, borderBottom: '1px solid var(--ad-line)' }}>
                      GSTIN
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--ad-text)', py: 1, borderBottom: '1px solid var(--ad-line)' }}>
                      {challan.gstin}
                    </TableCell>
                    <TableCell sx={{ bgcolor: 'var(--ad-surface-2)', fontWeight: 600, width: '22%', color: 'var(--ad-text-2)', py: 1, borderBottom: '1px solid var(--ad-line)' }}>
                      Legal Business Name
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'var(--ad-text)', py: 1, borderBottom: '1px solid var(--ad-line)' }}>
                      {challan.legalName}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ bgcolor: 'var(--ad-surface-2)', fontWeight: 600, color: 'var(--ad-text-2)', py: 1, borderBottom: 'none' }}>
                      Trade Name
                    </TableCell>
                    <TableCell sx={{ color: 'var(--ad-text)', py: 1, borderBottom: 'none' }}>
                      {challan.tradeName}
                    </TableCell>
                    <TableCell sx={{ bgcolor: 'var(--ad-surface-2)', fontWeight: 600, color: 'var(--ad-text-2)', py: 1, borderBottom: 'none' }}>
                      State / Jurisdiction
                    </TableCell>
                    <TableCell sx={{ color: 'var(--ad-text)', py: 1, borderBottom: 'none' }}>
                      {challan.state} (State Code: {challan.stateCode})
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          {/* Section 2: Details of Tax Deposit */}
          <Box sx={{ mb: 2.5 }}>
            <Typography sx={{ fontWeight: 700, fontSize: 12, color: 'var(--ad-text)', mb: 1, textTransform: 'uppercase' }}>
              2. Details of Deposit (All amounts in INR)
            </Typography>
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid var(--ad-line)', borderRadius: 'var(--ad-radius-sm)', bgcolor: 'var(--ad-surface)' }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: 'var(--ad-surface-2)' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, color: 'var(--ad-text)', py: 1, borderBottom: '1px solid var(--ad-line)' }}>Major Head</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: 'var(--ad-text)', py: 1, borderBottom: '1px solid var(--ad-line)' }}>Tax (₹)</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: 'var(--ad-text)', py: 1, borderBottom: '1px solid var(--ad-line)' }}>Interest (₹)</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: 'var(--ad-text)', py: 1, borderBottom: '1px solid var(--ad-line)' }}>Penalty (₹)</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: 'var(--ad-text)', py: 1, borderBottom: '1px solid var(--ad-line)' }}>Fees (₹)</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: 'var(--ad-text)', py: 1, borderBottom: '1px solid var(--ad-line)' }}>Total (₹)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow hover sx={{ '&:hover': { bgcolor: 'var(--ad-surface-2)' } }}>
                    <TableCell sx={{ fontWeight: 600, color: 'var(--ad-text)', py: 1, borderBottom: '1px solid var(--ad-line)' }}>
                      Central Tax (CGST 2.5%)
                    </TableCell>
                    <TableCell align="right" sx={{ py: 1, color: 'var(--ad-text)', borderBottom: '1px solid var(--ad-line)' }}>{challan.cgstAmount.toFixed(2)}</TableCell>
                    <TableCell align="right" sx={{ py: 1, color: 'var(--ad-text-2)', borderBottom: '1px solid var(--ad-line)' }}>0.00</TableCell>
                    <TableCell align="right" sx={{ py: 1, color: 'var(--ad-text-2)', borderBottom: '1px solid var(--ad-line)' }}>0.00</TableCell>
                    <TableCell align="right" sx={{ py: 1, color: 'var(--ad-text-2)', borderBottom: '1px solid var(--ad-line)' }}>0.00</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, py: 1, color: 'var(--ad-text)', borderBottom: '1px solid var(--ad-line)' }}>{challan.cgstAmount.toFixed(2)}</TableCell>
                  </TableRow>

                  <TableRow hover sx={{ bgcolor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'var(--ad-surface-2)', '&:hover': { bgcolor: 'var(--ad-surface-2)' } }}>
                    <TableCell sx={{ fontWeight: 600, color: 'var(--ad-text)', py: 1, borderBottom: '1px solid var(--ad-line)' }}>
                      State Tax (SGST 2.5%)
                    </TableCell>
                    <TableCell align="right" sx={{ py: 1, color: 'var(--ad-text)', borderBottom: '1px solid var(--ad-line)' }}>{challan.sgstAmount.toFixed(2)}</TableCell>
                    <TableCell align="right" sx={{ py: 1, color: 'var(--ad-text-2)', borderBottom: '1px solid var(--ad-line)' }}>0.00</TableCell>
                    <TableCell align="right" sx={{ py: 1, color: 'var(--ad-text-2)', borderBottom: '1px solid var(--ad-line)' }}>0.00</TableCell>
                    <TableCell align="right" sx={{ py: 1, color: 'var(--ad-text-2)', borderBottom: '1px solid var(--ad-line)' }}>0.00</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, py: 1, color: 'var(--ad-text)', borderBottom: '1px solid var(--ad-line)' }}>{challan.sgstAmount.toFixed(2)}</TableCell>
                  </TableRow>

                  <TableRow hover sx={{ '&:hover': { bgcolor: 'var(--ad-surface-2)' } }}>
                    <TableCell sx={{ color: 'var(--ad-text-2)', py: 1, borderBottom: '1px solid var(--ad-line)' }}>
                      Integrated Tax (IGST)
                    </TableCell>
                    <TableCell align="right" sx={{ py: 1, color: 'var(--ad-text-2)', borderBottom: '1px solid var(--ad-line)' }}>{challan.igstAmount.toFixed(2)}</TableCell>
                    <TableCell align="right" sx={{ py: 1, color: 'var(--ad-text-2)', borderBottom: '1px solid var(--ad-line)' }}>0.00</TableCell>
                    <TableCell align="right" sx={{ py: 1, color: 'var(--ad-text-2)', borderBottom: '1px solid var(--ad-line)' }}>0.00</TableCell>
                    <TableCell align="right" sx={{ py: 1, color: 'var(--ad-text-2)', borderBottom: '1px solid var(--ad-line)' }}>0.00</TableCell>
                    <TableCell align="right" sx={{ py: 1, color: 'var(--ad-text-2)', borderBottom: '1px solid var(--ad-line)' }}>{challan.igstAmount.toFixed(2)}</TableCell>
                  </TableRow>

                  {/* Table Total Highlight */}
                  <TableRow sx={{ bgcolor: 'var(--ad-surface-2)', borderTop: '2px solid var(--ad-line-strong)' }}>
                    <TableCell sx={{ fontWeight: 800, fontSize: 13, color: 'var(--ad-text)', py: 1.25, borderBottom: 'none' }}>
                      TOTAL CHALLAN AMOUNT
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, py: 1.25, color: 'var(--ad-text)', borderBottom: 'none' }}>
                      {(challan.cgstAmount + challan.sgstAmount + challan.igstAmount).toFixed(2)}
                    </TableCell>
                    <TableCell align="right" sx={{ py: 1.25, color: 'var(--ad-text-2)', borderBottom: 'none' }}>0.00</TableCell>
                    <TableCell align="right" sx={{ py: 1.25, color: 'var(--ad-text-2)', borderBottom: 'none' }}>0.00</TableCell>
                    <TableCell align="right" sx={{ py: 1.25, color: 'var(--ad-text-2)', borderBottom: 'none' }}>0.00</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, fontSize: 14, color: 'var(--ad-ember)', py: 1.25, borderBottom: 'none' }}>
                      {formatINR(challan.totalAmount)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>

            {/* Total in words */}
            <Box sx={{ mt: 1.5, p: 1.25, bgcolor: 'var(--ad-surface-2)', borderRadius: 'var(--ad-radius-sm)', border: '1px solid var(--ad-line)' }}>
              <Typography variant="body2" sx={{ color: 'var(--ad-text-2)', fontSize: 12 }}>
                <strong style={{ color: 'var(--ad-text)' }}>Total Amount in Words:</strong> {numberToWordsINR(challan.totalAmount)}
              </Typography>
            </Box>
          </Box>

          {/* Section 3: Bank Settlement & Audit Info */}
          <Box sx={{ mb: 2.5 }}>
            <Typography sx={{ fontWeight: 700, fontSize: 12, color: 'var(--ad-text)', mb: 1, textTransform: 'uppercase' }}>
              3. Bank Particulars &amp; Audit Traceability
            </Typography>
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid var(--ad-line)', borderRadius: 'var(--ad-radius-sm)', bgcolor: 'var(--ad-surface)' }}>
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell sx={{ bgcolor: 'var(--ad-surface-2)', fontWeight: 600, width: '22%', color: 'var(--ad-text-2)', py: 1, borderBottom: '1px solid var(--ad-line)' }}>
                      Remitting Agency Bank
                    </TableCell>
                    <TableCell sx={{ color: 'var(--ad-text)', py: 1, borderBottom: '1px solid var(--ad-line)' }}>{challan.bankName}</TableCell>
                    <TableCell sx={{ bgcolor: 'var(--ad-surface-2)', fontWeight: 600, width: '22%', color: 'var(--ad-text-2)', py: 1, borderBottom: '1px solid var(--ad-line)' }}>
                      Bank Reference No. (BRN)
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--ad-text)', py: 1, borderBottom: '1px solid var(--ad-line)' }}>
                      {challan.brn}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ bgcolor: 'var(--ad-surface-2)', fontWeight: 600, color: 'var(--ad-text-2)', py: 1, borderBottom: 'none' }}>
                      Initiated / Signed By
                    </TableCell>
                    <TableCell sx={{ color: 'var(--ad-text)', py: 1, borderBottom: 'none' }}>{challan.userName}</TableCell>
                    <TableCell sx={{ bgcolor: 'var(--ad-surface-2)', fontWeight: 600, color: 'var(--ad-text-2)', py: 1, borderBottom: 'none' }}>
                      Audit Correlation ID
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--ad-text-2)', py: 1, borderBottom: 'none' }}>
                      {challan.correlationId}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          {/* Statutory Certification & Stamp */}
          <Box
            sx={{
              pt: 2,
              borderTop: '1px dashed var(--ad-line-strong)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              flexWrap: 'wrap',
              gap: 2,
            }}
          >
            <Box sx={{ maxWidth: 460 }}>
              <Typography variant="caption" sx={{ color: 'var(--ad-text-2)', display: 'block', lineHeight: 1.4 }}>
                1. Generated under Section 49(1) of the CGST Act, 2017 &amp; Rule 87(2) of the GST Rules, 2017.
              </Typography>
              <Typography variant="caption" sx={{ color: 'var(--ad-text-2)', display: 'block', lineHeight: 1.4 }}>
                2. Applicable for restaurant dining service supplies categorized under SAC 996331 (5% Composite GST).
              </Typography>
              <Typography variant="caption" sx={{ color: 'var(--ad-text-2)', display: 'block', lineHeight: 1.4 }}>
                3. Immutable record permanently verified in the GST compliance audit register.
              </Typography>
            </Box>

            <Box sx={{ textAlign: 'right' }}>
              <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, color: 'var(--ad-basil)', mb: 0.5 }}>
                <VerifiedUserIcon sx={{ fontSize: 16 }} />
                <Typography sx={{ fontWeight: 700, fontSize: 11, letterSpacing: '0.3px', color: 'var(--ad-basil)' }}>
                  DIGITALLY AUTHENTICATED
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ color: 'var(--ad-text-3)', display: 'block', fontSize: 10 }}>
                AR Food Dining GST Compliance Engine
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* Optional Collapsible Technical Raw Payload */}
        <Accordion
          elevation={0}
          sx={{
            mt: 2.5,
            borderRadius: 'var(--ad-radius-sm) !important',
            border: '1px solid var(--ad-line)',
            bgcolor: 'var(--ad-surface)',
            color: 'var(--ad-text)',
            backgroundImage: 'none',
            '&:before': { display: 'none' },
          }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ fontSize: 18, color: 'var(--ad-text-2)' }} />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CodeIcon sx={{ fontSize: 16, color: 'var(--ad-text-2)' }} />
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'var(--ad-text-2)' }}>
                Technical Audit Details (Raw Event Payload)
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 0 }}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                bgcolor: 'var(--ad-surface-2)',
                border: '1px solid var(--ad-line)',
                borderRadius: 'var(--ad-radius-sm)',
                maxHeight: 250,
                overflow: 'auto',
                backgroundImage: 'none',
              }}
            >
              <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: 11.5, color: 'var(--ad-text)' }}>
                {JSON.stringify(event?.details || {}, null, 2)}
              </pre>
            </Paper>
          </AccordionDetails>
        </Accordion>
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: '1px solid var(--ad-line)', justifyContent: 'space-between', bgcolor: 'var(--ad-surface-2)' }}>
        <Typography variant="caption" sx={{ color: 'var(--ad-text-2)' }}>
          Form GST PMT-06 electronic verification copy &bull; Ready for physical print and PDF archive
        </Typography>
        <Button onClick={onClose} sx={{ textTransform: 'none', color: 'var(--ad-text-2)', fontWeight: 600, '&:hover': { color: 'var(--ad-text)' } }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GSTChallanModal;
