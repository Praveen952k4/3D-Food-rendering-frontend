/**
 * Restaurant identity and tax settings used on e-receipts and GST reports.
 * Edit here rather than in the receipt renderer.
 */
const business = {
  name: 'AR Automated Dining',
  tagline: 'Augmented reality menu · Table service',
  addressLines: [
    'Kumaraguru College of Technology',
    'Chinnavedampatti, Coimbatore 641049',
    'Tamil Nadu, India',
  ],
  phone: '+91 81485 45814',
  email: 'orders@arautomateddining.in',
  gstin: '33AAACA1234A1Z5',
  stateCode: '33 — Tamil Nadu',
  fssai: '12419015000123',
};

/** Restaurant supply: 5% GST, split evenly into CGST and SGST intra-state. */
export const GST_RATE = 0.05;
export const CGST_RATE = 0.025;
export const SGST_RATE = 0.025;

export const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

/**
 * Derive an order's GST breakdown. The stored `tax` is authoritative — older
 * orders keep whatever they were charged — and is only recomputed from the
 * taxable value when an order has none recorded.
 */
export const gstForOrder = (order = {}) => {
  const subtotal = Number(order.subtotal) || 0;
  const discount = (Number(order.discount) || 0) + (Number(order.couponDiscount) || 0);
  const taxableValue = round2(Math.max(subtotal - discount, 0));
  const total = order.tax == null ? round2(taxableValue * GST_RATE) : round2(order.tax);
  const cgst = round2(total / 2);

  return { taxableValue, discount: round2(discount), cgst, sgst: round2(total - cgst), total };
};

export const formatINR = (n, withPaise = true) =>
  `₹${(Number(n) || 0).toLocaleString('en-IN', {
    minimumFractionDigits: withPaise ? 2 : 0,
    maximumFractionDigits: withPaise ? 2 : 0,
  })}`;

export default business;
