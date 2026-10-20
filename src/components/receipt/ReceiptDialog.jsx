import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from '@mui/material';
import { Close, Download, Print, Send, TaskAlt } from '@mui/icons-material';
import { buildReceiptPdf, receiptFileName } from '../../utils/receipt';
import ReceiptView from './ReceiptView';
import { gstForOrder, formatINR } from '../../config/business';
import { LoadingPanel } from '../ui/Loaders';

/**
 * Shows a GST-inclusive e-receipt for one order, with Download and Print
 * beneath it.
 *
 * The receipt on screen is HTML, not the PDF. Phones refuse to render a PDF
 * inside an iframe — Android Chrome offers a download instead of showing it,
 * iOS Safari often shows nothing — so on a phone the preview was a blank grey
 * box. The PDF is still built, and is still exactly what downloads and
 * prints.
 *
 * The admin also gets "Send to customer", which releases the receipt — the
 * customer cannot view or download it until that happens. Pass
 * `allowPrint={false}` for the customer's copy, which is view and download
 * only.
 */
const ReceiptDialog = ({
  order,
  open,
  onClose,
  allowPrint = true,
  canSend = false,
  sent = false,
  sending = false,
  onSend,
}) => {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const docRef = useRef(null);
  const frameRef = useRef(null);

  const gst = useMemo(() => (order ? gstForOrder(order) : null), [order]);

  useEffect(() => {
    if (!open || !order) return undefined;

    let objectUrl = '';
    try {
      const doc = buildReceiptPdf(order);
      docRef.current = doc;
      objectUrl = URL.createObjectURL(doc.output('blob'));
      setUrl(objectUrl);
      setError('');
    } catch (err) {
      console.error('Failed to build receipt:', err);
      setError('The receipt could not be generated for this order.');
    }

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      setUrl('');
      docRef.current = null;
    };
  }, [open, order]);

  const handleDownload = () => {
    if (docRef.current) docRef.current.save(receiptFileName(order));
  };

  const handlePrint = () => {
    if (!url) return;

    // Print the PDF itself rather than the page: load it into an off-screen
    // frame, print that, and drop the frame afterwards. A phone has no print
    // frame to speak of, so there it just opens the PDF and lets the system
    // share sheet do the rest.
    const isPhone = typeof window !== 'undefined' && window.innerWidth < 600;
    if (isPhone) {
      window.open(url, '_blank', 'noopener');
      return;
    }

    const frame = document.createElement('iframe');
    frame.style.position = 'fixed';
    frame.style.right = '0';
    frame.style.bottom = '0';
    frame.style.width = '0';
    frame.style.height = '0';
    frame.style.border = '0';
    frame.src = url;
    frame.onload = () => {
      try {
        frame.contentWindow.focus();
        frame.contentWindow.print();
      } catch {
        // Some embedded viewers refuse a print command from script.
        window.open(url, '_blank', 'noopener');
      }
      setTimeout(() => frame.remove(), 60000);
    };
    document.body.appendChild(frame);
    frameRef.current = frame;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { height: { xs: '100%', sm: '92vh' }, m: { xs: 0, sm: 2 } } }}
      fullScreen={typeof window !== 'undefined' && window.innerWidth < 600}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, pb: 1 }}>
        <Box sx={{ minWidth: 0 }}>
          E-receipt
          <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', fontFamily: 'var(--ad-font)' }}>
            {order?.orderNumber || order?._id?.slice(-8)} ·{' '}
            {gst ? `${formatINR(order?.grandTotal)} incl. ${formatINR(gst.total)} GST` : ''}
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ ml: 'auto' }} aria-label="Close receipt">
          <Close fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent
        dividers
        sx={{ p: 0, bgcolor: 'var(--ad-bg-2)', display: 'flex', flexDirection: 'column' }}
      >
        {error ? (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
          </Alert>
        ) : order ? (
          <Box sx={{ flex: 1, overflowY: 'auto', py: { xs: 1.5, sm: 2.5 } }}>
            <ReceiptView order={order} />
          </Box>
        ) : (
          <LoadingPanel minHeight={420}>Generating receipt…</LoadingPanel>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 2, py: 1.5, gap: 1, flexWrap: 'wrap' }}>
        <Typography
          variant="caption"
          sx={{ color: sent ? 'var(--ad-basil)' : 'text.disabled', mr: 'auto', display: { xs: 'none', sm: 'block' } }}
        >
          {sent ? 'Shared with the customer' : 'GST 5% · CGST 2.5% + SGST 2.5%'}
        </Typography>

        {canSend && (
          <Button
            onClick={onSend}
            startIcon={sending ? null : sent ? <TaskAlt /> : <Send />}
            variant="outlined"
            color={sent ? 'success' : 'primary'}
            disabled={!url || sending}
          >
            {sending ? (
              <>
                <span className="ad-spinner" style={{ marginRight: 8 }} aria-hidden="true" />
                Sending…
              </>
            ) : sent ? (
              'Sent · send again'
            ) : (
              'Send to customer'
            )}
          </Button>
        )}

        <Button
          onClick={handleDownload}
          startIcon={<Download />}
          variant={allowPrint ? 'outlined' : 'contained'}
          disabled={!url}
        >
          Download
        </Button>
        {allowPrint && (
          <Button onClick={handlePrint} startIcon={<Print />} variant="contained" disabled={!url}>
            Print
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ReceiptDialog;
