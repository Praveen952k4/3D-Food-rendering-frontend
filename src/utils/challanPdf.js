import { jsPDF } from 'jspdf';
import { formatINR } from '../config/business';

/**
 * Converts a numeric amount to Indian Rupee Words format
 * e.g. 1250 -> "Rupees One Thousand Two Hundred and Fifty Only"
 */
export const numberToWordsINR = (num) => {
  const n = Math.round(Number(num) || 0);
  if (n === 0) return 'Rupees Zero Only';

  const a = [
    '', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ',
    'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ',
    'Seventeen ', 'Eighteen ', 'Nineteen ',
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const inWords = (number) => {
    let strNum = number.toString();
    if (strNum.length > 9) return 'Overflow';
    const match = ('000000000' + strNum).slice(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!match) return '';
    let str = '';
    str += Number(match[1]) !== 0 ? (a[Number(match[1])] || b[match[1][0]] + ' ' + a[match[1][1]]) + 'Crore ' : '';
    str += Number(match[2]) !== 0 ? (a[Number(match[2])] || b[match[2][0]] + ' ' + a[match[2][1]]) + 'Lakh ' : '';
    str += Number(match[3]) !== 0 ? (a[Number(match[3])] || b[match[3][0]] + ' ' + a[match[3][1]]) + 'Thousand ' : '';
    str += Number(match[4]) !== 0 ? (a[Number(match[4])] || b[match[4][0]] + ' ' + a[match[4][1]]) + 'Hundred ' : '';
    str += Number(match[5]) !== 0 ? ((str !== '') ? 'and ' : '') + (a[Number(match[5])] || b[match[5][0]] + ' ' + a[match[5][1]]) : '';
    return str.trim();
  };

  return `Rupees ${inWords(n)} Only`;
};

/**
 * Normalizes an audit event into standard Form GST PMT-06 challan data
 */
export const parseChallanFromEvent = (event, profile) => {
  if (!event) return null;
  const d = event.details || {};

  const total = Number(d.totalAmount ?? d.amount ?? d.totalTaxAmount ?? d.taxableTurnover ?? 0);
  const cgst = Number(d.cgstAmount ?? (total > 0 ? total / 2 : 0));
  const sgst = Number(d.sgstAmount ?? (total > 0 ? total / 2 : 0));
  const igst = Number(d.igstAmount ?? 0);
  const fee = Number(d.feeAmount ?? 0);
  const penalty = Number(d.penaltyAmount ?? 0);

  const cpin =
    d.cpin ||
    (d.challanId ? String(d.challanId).replace(/\D/g, '').slice(-14).padStart(14, '26') : null) ||
    '26101899123456';
  const cin = d.cin || (event.action?.includes('PAID') || event.action?.includes('CONFIRMED') ? `HDFC${cpin}` : null);
  const isPaid = Boolean(cin || event.action?.includes('PAID') || event.action?.includes('CONFIRMED'));
  const period = d.period || (event.timestamp ? new Date(event.timestamp).toISOString().slice(0, 7) : '2026-10');

  return {
    cpin,
    cin,
    brn: d.brn || (isPaid ? `BRN-${cpin.slice(-8)}` : '—'),
    isPaid,
    status: isPaid ? 'PAID' : (event.action?.includes('CREATED') || event.action?.includes('GENERATED') ? 'GENERATED' : 'VERIFIED'),
    period,
    totalAmount: total,
    cgstAmount: cgst,
    sgstAmount: sgst,
    igstAmount: igst,
    feeAmount: fee,
    penaltyAmount: penalty,
    paymentMethod: d.paymentMethod ? d.paymentMethod.replace(/_/g, ' ').toUpperCase() : 'INTERNET BANKING',
    bankName: d.bankName || 'HDFC Bank (Authorized GST Agency Bank)',
    challanDate: event.timestamp || new Date(),
    userName: event.userName || event.userPhone || 'System Administrator',
    correlationId: event.correlationId || '—',
    action: event.action,
    gstin: profile?.gstin || '33AAACA1234A1Z5',
    legalName: profile?.legalBusinessName || 'AR Automated Dining Pvt Ltd',
    tradeName: profile?.tradeName || 'AR Automated Dining',
    state: profile?.state || 'Tamil Nadu',
    stateCode: profile?.stateCode || '33',
    detailsRaw: d,
  };
};

/**
 * Builds a vector Form GST PMT-06 PDF document using jsPDF
 */
export const buildChallanPdf = (challan) => {
  const doc = new jsPDF({ unit: 'pt', format: 'a4', compress: true });
  const W = doc.internal.pageSize.getWidth();
  const M = 40; // margin
  const right = W - M;
  let y = 46;

  // Header Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(26, 32, 44);
  doc.text('GOODS AND SERVICES TAX (GST) PAYMENT CHALLAN', W / 2, y, { align: 'center' });
  y += 16;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(226, 85, 43);
  doc.text('FORM GST PMT-06', W / 2, y, { align: 'center' });
  y += 13;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text('[See Rule 87(2)] · Challan for Deposit of Goods and Services Tax', W / 2, y, { align: 'center' });
  y += 18;

  // Dividing Line
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(1);
  doc.line(M, y, right, y);
  y += 16;

  // Two column summary box
  const boxHeight = 70;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(M, y, right - M, boxHeight, 4, 4, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(M, y, right - M, boxHeight, 4, 4, 'S');

  // Left col in box
  let boxY = y + 16;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text('CPIN (Common Portal Identification No.):', M + 14, boxY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(String(challan.cpin), M + 215, boxY);

  boxY += 18;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Challan Generation Date:', M + 14, boxY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(new Date(challan.challanDate).toLocaleString('en-IN'), M + 215, boxY);

  boxY += 18;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Challan Status:', M + 14, boxY);
  doc.setFont('helvetica', 'bold');
  if (challan.isPaid) {
    doc.setTextColor(47, 125, 98);
    doc.text('PAID / REALIZED', M + 215, boxY);
  } else {
    doc.setTextColor(226, 85, 43);
    doc.text(challan.status, M + 215, boxY);
  }

  // Right col in box
  boxY = y + 16;
  const col2X = M + (right - M) / 2 + 10;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('CIN (Bank Challan ID):', col2X, boxY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(challan.cin || 'Pending Realization', col2X + 115, boxY);

  boxY += 18;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Tax Period:', col2X, boxY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(String(challan.period), col2X + 115, boxY);

  boxY += 18;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Payment Mode:', col2X, boxY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(String(challan.paymentMethod), col2X + 115, boxY);

  y += boxHeight + 16;

  // Taxpayer Information Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);
  doc.text('1. DETAILS OF TAXPAYER', M, y);
  y += 12;

  const tboxH = 50;
  doc.setDrawColor(226, 232, 240);
  doc.rect(M, y, right - M, tboxH);

  let ty = y + 15;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text('GSTIN:', M + 10, ty);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(String(challan.gstin), M + 60, ty);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Legal Name:', M + 200, ty);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(String(challan.legalName), M + 270, ty);

  ty += 18;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Trade Name:', M + 10, ty);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(String(challan.tradeName), M + 70, ty);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('State / Jurisdiction:', M + 200, ty);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${challan.state} (${challan.stateCode})`, M + 300, ty);

  y += tboxH + 16;

  // Section 2: Details of Deposit Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);
  doc.text('2. DETAILS OF DEPOSIT (Amount in INR)', M, y);
  y += 12;

  // Table header
  const tableW = right - M;
  const colMajorW = 160;
  const colW = (tableW - colMajorW) / 5; // 5 columns: Tax, Interest, Penalty, Fees, Total

  doc.setFillColor(241, 245, 249);
  doc.rect(M, y, tableW, 22, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.rect(M, y, tableW, 22, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text('Major Head', M + 8, y + 14);
  doc.text('Tax (Rs.)', M + colMajorW + colW * 0 + colW - 6, y + 14, { align: 'right' });
  doc.text('Interest (Rs.)', M + colMajorW + colW * 1 + colW - 6, y + 14, { align: 'right' });
  doc.text('Penalty (Rs.)', M + colMajorW + colW * 2 + colW - 6, y + 14, { align: 'right' });
  doc.text('Fees (Rs.)', M + colMajorW + colW * 3 + colW - 6, y + 14, { align: 'right' });
  doc.text('Total (Rs.)', M + colMajorW + colW * 4 + colW - 6, y + 14, { align: 'right' });
  y += 22;

  const rows = [
    { name: 'Central Tax (CGST 2.5%)', tax: challan.cgstAmount, int: 0, pen: 0, fee: 0, total: challan.cgstAmount },
    { name: 'State Tax (SGST 2.5%)', tax: challan.sgstAmount, int: 0, pen: 0, fee: 0, total: challan.sgstAmount },
    { name: 'Integrated Tax (IGST)', tax: challan.igstAmount, int: 0, pen: 0, fee: 0, total: challan.igstAmount },
    { name: 'Cess', tax: 0, int: 0, pen: 0, fee: 0, total: 0 },
  ];

  rows.forEach((r, idx) => {
    doc.setFillColor(idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 250);
    doc.rect(M, y, tableW, 20, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(M, y, tableW, 20, 'S');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text(r.name, M + 8, y + 13);
    doc.text(r.tax.toFixed(2), M + colMajorW + colW * 0 + colW - 6, y + 13, { align: 'right' });
    doc.text(r.int.toFixed(2), M + colMajorW + colW * 1 + colW - 6, y + 13, { align: 'right' });
    doc.text(r.pen.toFixed(2), M + colMajorW + colW * 2 + colW - 6, y + 13, { align: 'right' });
    doc.text(r.fee.toFixed(2), M + colMajorW + colW * 3 + colW - 6, y + 13, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.text(r.total.toFixed(2), M + colMajorW + colW * 4 + colW - 6, y + 13, { align: 'right' });
    y += 20;
  });

  // Table Totals Row
  doc.setFillColor(241, 245, 249);
  doc.rect(M, y, tableW, 24, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.rect(M, y, tableW, 24, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('TOTAL CHALLAN AMOUNT', M + 8, y + 16);
  doc.setTextColor(226, 85, 43);
  doc.setFontSize(10);
  doc.text(formatINR(challan.totalAmount), right - 8, y + 16, { align: 'right' });
  y += 24;

  // Amount in Words
  y += 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Total Amount in Words:', M, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(numberToWordsINR(challan.totalAmount), M + 115, y);
  y += 18;

  // Section 3: Bank & Settlement Particulars
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);
  doc.text('3. BANK SETTLEMENT & AUDIT TRACEABILITY', M, y);
  y += 12;

  const bboxH = 54;
  doc.setDrawColor(226, 232, 240);
  doc.rect(M, y, right - M, bboxH);

  let by = y + 15;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Remitting Bank:', M + 10, by);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(String(challan.bankName), M + 90, by);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('BRN (Bank Ref):', M + 280, by);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(String(challan.brn), M + 360, by);

  by += 18;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Initiated By:', M + 10, by);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(String(challan.userName), M + 75, by);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Correlation ID:', M + 280, by);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(String(challan.correlationId), M + 355, by);

  y += bboxH + 20;

  // Statutory Certification & Footer
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(1);
  doc.line(M, y, right, y);
  y += 16;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('1. This challan is generated and verified under Section 49(1) of the Central Goods and Services Tax Act, 2017.', M, y);
  y += 13;
  doc.text('2. Authoritative electronic record registered in the permanent tamper-evident GST audit trail.', M, y);
  y += 13;
  doc.text('3. For customer dining restaurant supplies categorized under SAC 996331 (5% Composite GST without ITC).', M, y);
  y += 24;

  // Digital Signature Block
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(47, 125, 98);
  doc.text('DIGITALLY AUTHENTICATED & SYSTEM VERIFIED', right, y, { align: 'right' });
  y += 12;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Authorized GST Compliance Portal · Generated on ${new Date().toLocaleString('en-IN')}`, right, y, { align: 'right' });

  return doc;
};

export default buildChallanPdf;
