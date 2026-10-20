import React from 'react';
import { Box, Divider, Typography } from '@mui/material';
import business, { gstForOrder, GST_RATE, formatINR } from '../../config/business';

/**
 * The e-receipt, drawn as ordinary HTML.
 *
 * The dialog used to preview the generated PDF in an iframe, which phones
 * refuse to render inline — Android Chrome offers a download instead of
 * showing it, and iOS Safari often shows nothing at all, so on a phone the
 * receipt was a blank grey box. This is the same receipt as markup, so it
 * renders anywhere, scales to the screen and can be read in dark mode. The
 * PDF is still what downloads and prints.
 */

const money = (n) => (Number(n) || 0).toFixed(2);

const formatDateTime = (value) => {
  const d = value ? new Date(value) : new Date();
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const Row = ({ label, value, bold, accent }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, py: bold ? 0.5 : 0.25 }}>
    <Typography
      sx={{
        fontSize: bold ? 15 : 13.5,
        fontWeight: bold ? 700 : 400,
        color: bold ? 'var(--ad-text)' : 'text.secondary',
      }}
    >
      {label}
    </Typography>
    <Typography
      sx={{
        fontSize: bold ? 16 : 13.5,
        fontWeight: 700,
        color: accent ? 'var(--ad-ember)' : 'var(--ad-text)',
        whiteSpace: 'nowrap',
      }}
    >
      ₹{money(value)}
    </Typography>
  </Box>
);

const Meta = ({ label, value }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, py: 0.35 }}>
    <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>{label}</Typography>
    <Typography sx={{ fontSize: 13, fontWeight: 600, textAlign: 'right' }}>{value}</Typography>
  </Box>
);

const ReceiptView = ({ order }) => {
  if (!order) return null;
  const gst = gstForOrder(order);

  return (
    <Box
      sx={{
        bgcolor: 'var(--ad-surface)',
        p: { xs: 2, sm: 3 },
        mx: 'auto',
        maxWidth: 460,
        width: '100%',
      }}
    >
      {/* ----------------------------------------------------- letterhead */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: '11px',
            display: 'grid',
            placeItems: 'center',
            color: '#fff',
            fontWeight: 700,
            fontSize: 13,
            flex: 'none',
            background: 'linear-gradient(145deg, var(--ad-ember), var(--ad-saffron))',
          }}
        >
          AR
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontWeight: 700, fontSize: 18, lineHeight: 1.2 }}>
            {business.name}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {business.tagline}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ color: 'text.secondary', fontSize: 12, lineHeight: 1.6, mb: 1.5 }}>
        {business.addressLines.map((line) => (
          <div key={line}>{line}</div>
        ))}
        <div>
          {business.phone} · {business.email}
        </div>
        <div>
          GSTIN {business.gstin} · State {business.stateCode}
        </div>
        <div>FSSAI {business.fssai}</div>
      </Box>

      <Divider />

      {/* ------------------------------------------------------ title bar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mt: 2, mb: 1.5 }}>
        <Typography sx={{ fontWeight: 700, fontSize: 14, letterSpacing: '.02em' }}>
          TAX INVOICE / E-RECEIPT
        </Typography>
        <Typography sx={{ fontWeight: 700, fontSize: 13, color: 'var(--ad-ember)' }}>
          GST @ {(GST_RATE * 100).toFixed(0)}%
        </Typography>
      </Box>

      {/* -------------------------------------------------- order details */}
      <Meta label="Receipt no." value={order.orderNumber || order._id?.slice(-8) || '—'} />
      <Meta label="Date" value={formatDateTime(order.createdAt)} />
      <Meta label="Customer" value={order.customerName || 'Guest'} />
      <Meta label="Phone" value={order.customerPhone || '—'} />
      <Meta
        label="Service"
        value={
          order.orderType === 'dine-in'
            ? `Dine-in${order.tableNumber ? ` · Table ${order.tableNumber}` : ''}`
            : 'Takeaway'
        }
      />
      <Meta label="Payment" value={`${order.paymentMethod || 'cash'} · ${order.paymentStatus || 'pending'}`} />

      <Divider sx={{ my: 1.5 }} />

      {/* ------------------------------------------------------- the food */}
      <Box sx={{ display: 'flex', gap: 1, pb: 0.75 }}>
        <Typography sx={{ flex: 1, fontSize: 11, fontWeight: 700, color: 'text.disabled' }}>ITEM</Typography>
        <Typography sx={{ width: 34, fontSize: 11, fontWeight: 700, color: 'text.disabled', textAlign: 'right' }}>
          QTY
        </Typography>
        <Typography sx={{ width: 62, fontSize: 11, fontWeight: 700, color: 'text.disabled', textAlign: 'right' }}>
          RATE
        </Typography>
        <Typography sx={{ width: 74, fontSize: 11, fontWeight: 700, color: 'text.disabled', textAlign: 'right' }}>
          AMOUNT
        </Typography>
      </Box>
      <Divider />

      {(order.items || []).map((item, index) => {
        const extras = (item.customizations || [])
          .flatMap((c) => [
            c.spiceLevel ? `spice: ${c.spiceLevel}` : null,
            ...(c.extras || []),
            c.specialInstructions || null,
          ])
          .filter(Boolean);

        return (
          <Box key={item._id || `${item.name}-${index}`} sx={{ py: 1, borderBottom: '1px solid var(--ad-line)' }}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'baseline' }}>
              <Typography sx={{ flex: 1, fontSize: 13.5, minWidth: 0 }}>{item.name || 'Item'}</Typography>
              <Typography sx={{ width: 34, fontSize: 13.5, textAlign: 'right' }}>
                {item.quantity ?? 1}
              </Typography>
              <Typography sx={{ width: 62, fontSize: 13.5, textAlign: 'right' }}>
                {money(item.price)}
              </Typography>
              <Typography sx={{ width: 74, fontSize: 13.5, fontWeight: 700, textAlign: 'right' }}>
                {money(item.subtotal ?? (item.price || 0) * (item.quantity || 1))}
              </Typography>
            </Box>
            {extras.length > 0 && (
              <Typography sx={{ fontSize: 11.5, color: 'text.disabled', pl: 1, pt: 0.25 }}>
                {extras.join(' · ')}
              </Typography>
            )}
          </Box>
        );
      })}

      {/* ---------------------------------------------------- money totals */}
      <Box sx={{ mt: 1.5 }}>
        <Row label="Subtotal" value={order.subtotal} />
        {gst.discount > 0 && (
          <Row label={order.couponCode ? `Discount (${order.couponCode})` : 'Discount'} value={-gst.discount} />
        )}
        <Row label="Taxable value" value={gst.taxableValue} />
        <Row label="CGST @ 2.5%" value={gst.cgst} />
        <Row label="SGST @ 2.5%" value={gst.sgst} />
        <Divider sx={{ my: 1, borderStyle: 'dashed' }} />
        <Row label="Grand total (incl. GST)" value={order.grandTotal} bold accent />
      </Box>

      <Divider sx={{ my: 1.5 }} />

      <Typography sx={{ fontSize: 11, color: 'text.disabled', lineHeight: 1.6 }}>
        GST is charged at 5% on restaurant service (CGST 2.5% + SGST 2.5%).
        <br />
        This is a computer-generated receipt and needs no signature.
      </Typography>
      <Typography sx={{ textAlign: 'center', fontWeight: 700, fontSize: 14, mt: 2 }}>
        Thank you — see you again.
      </Typography>

      {/* The figure above is the one that downloads, so say so rather than
          leaving someone to wonder whether the PDF differs. */}
      <Typography sx={{ textAlign: 'center', fontSize: 11, color: 'text.disabled', mt: 1 }}>
        Download for the PDF copy · total {formatINR(order.grandTotal)}
      </Typography>
    </Box>
  );
};

export default ReceiptView;
