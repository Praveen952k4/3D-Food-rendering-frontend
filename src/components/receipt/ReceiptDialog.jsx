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
import { gstForOrder, formatINR } from '../../config/business';
import { LoadingPanel } from '../ui/Loaders';

/**
 * Shows a GST-inclusive e-receipt for one order: the generated PDF is rendered
 * in-place in an iframe, with Download and Print beneath it.
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
    // Print the PDF already rendered in the iframe; fall back to a new window
    // if the embedded viewer will not accept a print command.
    const frame = frameRef.current;
    try {
      if (frame?.contentWindow) {
        frame.contentWindow.focus();
        frame.contentWindow.print();
        return;
      }
    } catch {
      /* cross-origin viewer — fall through */
    }
    if (docRef.current) docRef.current.output('dataurlnewwindow');
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
        ) : url ? (
          <iframe
            ref={frameRef}
            src={`${url}#toolbar=0&navpanes=0&view=FitH`}
            title="E-receipt preview"
            style={{ border: 0, width: '100%', flex: 1, minHeight: 420, background: 'var(--ad-bg-2)' }}
          />
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
