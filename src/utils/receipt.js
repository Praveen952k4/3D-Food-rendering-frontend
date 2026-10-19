import { jsPDF } from 'jspdf';
import business, { gstForOrder, GST_RATE } from '../config/business';

/**
 * Render a GST-inclusive e-receipt for one order as a real PDF.
 *
 * Drawn with jsPDF's vector primitives rather than rasterised from the DOM, so
 * the text stays selectable and the file stays small. Returns the jsPDF
 * document; callers turn it into a blob URL for preview, a download, or a
 * print window.
 */

const INK = [30, 23, 20];
const MUTED = [122, 107, 98];
const EMBER = [226, 85, 43];
const LINE = [224, 214, 205];

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

export const receiptFileName = (order) =>
  `receipt-${order?.orderNumber || order?._id?.slice(-6) || 'order'}.pdf`;

export const buildReceiptPdf = (order) => {
  const doc = new jsPDF({ unit: 'pt', format: [420, 760], compress: true });
  const W = 420;
  const M = 30; // page margin
  const right = W - M;
  const gst = gstForOrder(order);

  let y = 44;

  const text = (value, x, opts = {}) => {
    const { size = 9.5, style = 'normal', color = INK, align = 'left' } = opts;
    doc.setFont('helvetica', style);
    doc.setFontSize(size);
    doc.setTextColor(...color);
    doc.text(String(value ?? ''), x, y, { align });
  };

  const rule = (dashed = false) => {
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.7);
    if (dashed && doc.setLineDash) doc.setLineDash([2, 2], 0);
    doc.line(M, y, right, y);
    if (dashed && doc.setLineDash) doc.setLineDash([], 0);
  };

  // ------------------------------------------------------------ letterhead
  doc.setFillColor(...EMBER);
  doc.roundedRect(M, y - 20, 26, 26, 8, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('AR', M + 13, y - 2, { align: 'center' });

  text(business.name, M + 36, { size: 15, style: 'bold' });
  y += 13;
  text(business.tagline, M + 36, { size: 8.5, color: MUTED });

  y += 20;
  business.addressLines.forEach((line) => {
    text(line, M, { size: 8.5, color: MUTED });
    y += 11;
  });
  text(`${business.phone}  ·  ${business.email}`, M, { size: 8.5, color: MUTED });
  y += 11;
  text(`GSTIN ${business.gstin}  ·  State ${business.stateCode}`, M, { size: 8.5, color: MUTED });
  y += 11;
  text(`FSSAI ${business.fssai}`, M, { size: 8.5, color: MUTED });

  y += 18;
  rule();

  // ------------------------------------------------------------- title bar
  y += 22;
  text('TAX INVOICE / E-RECEIPT', M, { size: 11, style: 'bold' });
  text(`GST @ ${(GST_RATE * 100).toFixed(0)}%`, right, { size: 9, color: EMBER, style: 'bold', align: 'right' });

  // --------------------------------------------------------- order details
  y += 18;
  const meta = [
    ['Receipt no.', order?.orderNumber || order?._id?.slice(-8) || '—'],
    ['Date', formatDateTime(order?.createdAt)],
    ['Customer', order?.customerName || 'Guest'],
    ['Phone', order?.customerPhone || '—'],
    [
      'Service',
      order?.orderType === 'dine-in'
        ? `Dine-in${order?.tableNumber ? ` · Table ${order.tableNumber}` : ''}`
        : 'Takeaway',
    ],
    ['Payment', `${order?.paymentMethod || 'cash'} · ${order?.paymentStatus || 'pending'}`],
  ];
  meta.forEach(([label, value]) => {
    text(label, M, { size: 9, color: MUTED });
    text(value, right, { size: 9, align: 'right', style: 'bold' });
    y += 14;
  });

  y += 6;
  rule();

  // --------------------------------------------------------- item columns
  y += 18;
  text('ITEM', M, { size: 8, style: 'bold', color: MUTED });
  text('QTY', right - 120, { size: 8, style: 'bold', color: MUTED, align: 'right' });
  text('RATE', right - 62, { size: 8, style: 'bold', color: MUTED, align: 'right' });
  text('AMOUNT', right, { size: 8, style: 'bold', color: MUTED, align: 'right' });
  y += 8;
  rule();
  y += 16;

  (order?.items || []).forEach((item) => {
    const name = doc.splitTextToSize(item.name || 'Item', 190);
    text(name[0], M, { size: 9.5 });
    text(item.quantity ?? 1, right - 120, { size: 9.5, align: 'right' });
    text(money(item.price), right - 62, { size: 9.5, align: 'right' });
    text(money(item.subtotal ?? (item.price || 0) * (item.quantity || 1)), right, {
      size: 9.5,
      align: 'right',
      style: 'bold',
    });

    // wrapped name continuation + customisations
    name.slice(1).forEach((line) => {
      y += 11;
      text(line, M, { size: 9.5 });
    });

    const extras = (item.customizations || [])
      .flatMap((c) => [
        c.spiceLevel ? `spice: ${c.spiceLevel}` : null,
        ...(c.extras || []),
        c.specialInstructions || null,
      ])
      .filter(Boolean);
    if (extras.length) {
      y += 11;
      doc.splitTextToSize(extras.join(' · '), 240).forEach((line, i) => {
        if (i) y += 10;
        text(line, M + 8, { size: 8, color: MUTED });
      });
    }

    y += 17;
  });

  y -= 4;
  rule();

  // ---------------------------------------------------------- money totals
  y += 18;
  const row = (label, value, opts = {}) => {
    text(label, M, { size: opts.bold ? 10.5 : 9.5, color: opts.bold ? INK : MUTED, style: opts.bold ? 'bold' : 'normal' });
    text(`Rs. ${money(value)}`, right, {
      size: opts.bold ? 11.5 : 9.5,
      align: 'right',
      style: 'bold',
      color: opts.accent ? EMBER : INK,
    });
    y += opts.bold ? 20 : 15;
  };

  row('Subtotal', order?.subtotal);
  if (gst.discount > 0) {
    row(order?.couponCode ? `Discount (${order.couponCode})` : 'Discount', -gst.discount);
  }
  row('Taxable value', gst.taxableValue);
  row('CGST @ 2.5%', gst.cgst);
  row('SGST @ 2.5%', gst.sgst);

  y += 2;
  rule(true);
  y += 20;
  row('Grand total (incl. GST)', order?.grandTotal, { bold: true, accent: true });

  // --------------------------------------------------------------- footer
  y += 6;
  rule();
  y += 18;
  text('GST is charged at 5% on restaurant service (CGST 2.5% + SGST 2.5%).', M, {
    size: 7.8,
    color: MUTED,
  });
  y += 11;
  text('This is a computer-generated receipt and needs no signature.', M, { size: 7.8, color: MUTED });
  y += 20;
  text('Thank you — see you again.', W / 2, { size: 10, style: 'bold', align: 'center' });

  doc.setProperties({
    title: `E-receipt ${order?.orderNumber || ''}`.trim(),
    subject: 'Tax invoice',
    author: business.name,
  });

  return doc;
};

export default buildReceiptPdf;
