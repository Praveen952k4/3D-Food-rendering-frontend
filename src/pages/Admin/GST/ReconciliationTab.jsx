import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  MenuItem,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ReceiptIcon from '@mui/icons-material/Receipt';

import { getGstReconciliation, addGstReconciliationItem } from '../../../services/api';
import { formatINR } from '../../../config/business';
import { FONT_DISPLAY } from '../../../theme/muiTheme';

const ReconciliationTab = () => {
  const getCurrentPeriod = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  const [period, setPeriod] = useState(getCurrentPeriod());
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [newItem, setNewItem] = useState({
    type: 'purchase_invoice',
    referenceNumber: '',
    referenceDate: new Date().toISOString().split('T')[0],
    partyName: '',
    partyGstin: '',
    taxableValue: '',
    cgst: '',
    sgst: '',
    igst: '0',
    totalAmount: '',
    itcEligibility: 'ineligible',
    notes: '',
  });

  useEffect(() => {
    fetchReconciliation(period);
  }, [period]);

  const fetchReconciliation = async (selectedPeriod) => {
    try {
      setLoading(true);
      setError(null);
      const res = await getGstReconciliation(selectedPeriod);
      if (res.data.success) {
        setItems(res.data.items || []);
        setSummary(res.data.summary || null);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch reconciliation data.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = () => {
    setNewItem({
      type: 'purchase_invoice',
      referenceNumber: '',
      referenceDate: new Date().toISOString().split('T')[0],
      partyName: '',
      partyGstin: '',
      taxableValue: '',
      cgst: '',
      sgst: '',
      igst: '0',
      totalAmount: '',
      itcEligibility: 'ineligible',
      notes: '',
    });
    setDialogOpen(true);
  };

  const handleTaxableChange = (val) => {
    const taxable = parseFloat(val) || 0;
    const cgst = Math.round(taxable * 0.025 * 100) / 100;
    const sgst = Math.round(taxable * 0.025 * 100) / 100;
    const total = Math.round((taxable + cgst + sgst) * 100) / 100;

    setNewItem((prev) => ({
      ...prev,
      taxableValue: val,
      cgst: cgst.toString(),
      sgst: sgst.toString(),
      totalAmount: total.toString(),
    }));
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      const res = await addGstReconciliationItem({
        period,
        ...newItem,
        taxableValue: parseFloat(newItem.taxableValue) || 0,
        cgst: parseFloat(newItem.cgst) || 0,
        sgst: parseFloat(newItem.sgst) || 0,
        igst: parseFloat(newItem.igst) || 0,
        totalAmount: parseFloat(newItem.totalAmount) || 0,
      });

      if (res.data.success) {
        setSuccessMsg('Inward supply entry recorded successfully!');
        setDialogOpen(false);
        fetchReconciliation(period);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record entry.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 1050, mx: 'auto' }}>
      {/* Header and Controls */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            label="Reconciliation Period"
            type="month"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            InputLabelProps={{ shrink: true }}
            size="small"
            sx={{ minWidth: 200, '& .MuiOutlinedInput-root': { borderRadius: 'var(--ad-radius-sm)' } }}
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenDialog}
            sx={{
              bgcolor: 'var(--ad-ember)',
              color: '#ffffff',
              borderRadius: 'var(--ad-radius-sm)',
              fontWeight: 600,
              textTransform: 'none',
              '&:hover': { bgcolor: 'var(--ad-ember-deep)' },
            }}
          >
            Record Inward Invoice / Note
          </Button>
        </Box>

        {summary && (
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Inward Purchases: <strong>{formatINR(summary.totalPurchases || 0)}</strong>
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Inward Tax Paid: <strong>{formatINR(summary.totalInputTax || 0)}</strong>
            </Typography>
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
      ) : (
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
              Inward Supplies &amp; Purchase Register (GSTR-2B Cross-Check)
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Track raw vegetable, dairy, poultry, and packaging invoices for reconciliation and vendor verification.
            </Typography>
          </Box>

          <TableContainer>
            <Table size="small">
              <TableHead sx={{ bgcolor: 'var(--ad-surface-2)' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>DATE &bull; REF #</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>SUPPLIER VENDOR</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>SUPPLIER GSTIN</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: 'text.secondary' }}>TAXABLE VALUE</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: 'text.secondary' }}>INPUT TAX</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: 'text.secondary' }}>TOTAL INVOICE</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: 'text.secondary' }}>ITC STATUS</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.length > 0 ? (
                  items.map((item, idx) => (
                    <TableRow key={idx} hover sx={{ '&:hover': { bgcolor: 'var(--ad-surface-2)' } }}>
                      <TableCell sx={{ fontWeight: 600 }}>
                        {item.referenceDate ? new Date(item.referenceDate).toLocaleDateString() : 'N/A'}
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                          #{item.referenceNumber}
                        </Typography>
                      </TableCell>
                      <TableCell>{item.partyName || 'Vendor'}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{item.partyGstin || 'Unregistered'}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>{formatINR(item.taxableValue || 0)}</TableCell>
                      <TableCell align="right">{formatINR((item.cgst || 0) + (item.sgst || 0) + (item.igst || 0))}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: 'var(--ad-ember)' }}>
                        {formatINR(item.totalAmount || 0)}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={item.itcEligibility === 'eligible' ? 'ELIGIBLE' : 'INELIGIBLE (5%)'}
                          size="small"
                          sx={{
                            borderRadius: 'var(--ad-radius-sm)',
                            fontWeight: 700,
                            fontSize: 10,
                            bgcolor: item.itcEligibility === 'eligible' ? 'var(--ad-basil-wash)' : 'var(--ad-saffron-wash)',
                            color: item.itcEligibility === 'eligible' ? 'var(--ad-basil)' : 'var(--ad-warn)',
                            border: item.itcEligibility === 'eligible' ? '1px solid var(--ad-basil)' : '1px solid var(--ad-saffron)',
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                      <ReceiptIcon sx={{ fontSize: 40, color: 'var(--ad-line-strong)', mb: 1, display: 'block', mx: 'auto' }} />
                      No inward supply invoices recorded for period {period}.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Record Inward Invoice Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 'var(--ad-radius)' } }}
      >
        <DialogTitle sx={{ fontFamily: FONT_DISPLAY, fontWeight: 600 }}>
          Record Vendor Inward Supply / Purchase Invoice
        </DialogTitle>
        <Box component="form" onSubmit={handleSaveItem}>
          <DialogContent dividers sx={{ borderColor: 'var(--ad-line)' }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Document Type"
                  value={newItem.type}
                  onChange={(e) => setNewItem({ ...newItem, type: e.target.value })}
                  size="small"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 'var(--ad-radius-sm)' } }}
                >
                  <MenuItem value="purchase_invoice">Purchase Invoice (Raw Food / Packaging)</MenuItem>
                  <MenuItem value="debit_note">Debit Note</MenuItem>
                  <MenuItem value="credit_note">Credit Note</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Invoice / Ref Number"
                  value={newItem.referenceNumber}
                  onChange={(e) => setNewItem({ ...newItem, referenceNumber: e.target.value })}
                  required
                  size="small"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 'var(--ad-radius-sm)' } }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Invoice Date"
                  type="date"
                  value={newItem.referenceDate}
                  onChange={(e) => setNewItem({ ...newItem, referenceDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 'var(--ad-radius-sm)' } }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Supplier / Vendor Name"
                  value={newItem.partyName}
                  onChange={(e) => setNewItem({ ...newItem, partyName: e.target.value })}
                  required
                  placeholder="e.g. Metro Cash & Carry / Dairy Farm"
                  size="small"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 'var(--ad-radius-sm)' } }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Supplier GSTIN"
                  value={newItem.partyGstin}
                  onChange={(e) => setNewItem({ ...newItem, partyGstin: e.target.value.toUpperCase() })}
                  placeholder="15-digit GSTIN (leave blank if unregistered)"
                  size="small"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 'var(--ad-radius-sm)' } }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Taxable Amount (₹)"
                  type="number"
                  value={newItem.taxableValue}
                  onChange={(e) => handleTaxableChange(e.target.value)}
                  required
                  size="small"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 'var(--ad-radius-sm)' } }}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="CGST (2.5%)"
                  type="number"
                  value={newItem.cgst}
                  onChange={(e) => setNewItem({ ...newItem, cgst: e.target.value })}
                  size="small"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 'var(--ad-radius-sm)' } }}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="SGST (2.5%)"
                  type="number"
                  value={newItem.sgst}
                  onChange={(e) => setNewItem({ ...newItem, sgst: e.target.value })}
                  size="small"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 'var(--ad-radius-sm)' } }}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Total Invoice (₹)"
                  type="number"
                  value={newItem.totalAmount}
                  onChange={(e) => setNewItem({ ...newItem, totalAmount: e.target.value })}
                  size="small"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 'var(--ad-radius-sm)' } }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Purchase Notes / Item Details"
                  value={newItem.notes}
                  onChange={(e) => setNewItem({ ...newItem, notes: e.target.value })}
                  placeholder="e.g. 50kg basmati rice, cooking oil, spices"
                  size="small"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 'var(--ad-radius-sm)' } }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setDialogOpen(false)} sx={{ textTransform: 'none', color: 'text.secondary' }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={saving}
              sx={{
                bgcolor: 'var(--ad-ember)',
                color: '#ffffff',
                borderRadius: 'var(--ad-radius-sm)',
                fontWeight: 600,
                textTransform: 'none',
                '&:hover': { bgcolor: 'var(--ad-ember-deep)' },
              }}
            >
              {saving ? 'Recording...' : 'Record Invoice Entry'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
};

export default ReconciliationTab;
