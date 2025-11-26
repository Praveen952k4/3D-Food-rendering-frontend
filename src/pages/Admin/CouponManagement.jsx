import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Typography,
  Button,
  Card,
  CardContent,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Stack,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  ContentCopy,
  ToggleOn,
  ToggleOff,
} from '@mui/icons-material';
import { getCoupons, createCoupon, updateCoupon, deleteCoupon, toggleCoupon } from '../../services/api';
import { format } from 'date-fns';

const CouponManagement = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'percentage',
    discountValue: 0,
    minOrderValue: 0,
    maxDiscount: '',
    usageLimit: '',
    validFrom: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    validUntil: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd'T'HH:mm"),
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const response = await getCoupons();
      if (response.data.success) {
        setCoupons(response.data.coupons);
      }
    } catch (error) {
      console.error('Failed to fetch coupons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (coupon) => {
    if (coupon) {
      setEditingCoupon(coupon);
      setFormData({
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        minOrderValue: coupon.minOrderValue,
        maxDiscount: coupon.maxDiscount?.toString() || '',
        usageLimit: coupon.usageLimit?.toString() || '',
        validFrom: format(new Date(coupon.validFrom), "yyyy-MM-dd'T'HH:mm"),
        validUntil: format(new Date(coupon.validUntil), "yyyy-MM-dd'T'HH:mm"),
      });
    } else {
      setEditingCoupon(null);
      setFormData({
        code: '',
        description: '',
        discountType: 'percentage',
        discountValue: 0,
        minOrderValue: 0,
        maxDiscount: '',
        usageLimit: '',
        validFrom: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        validUntil: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd'T'HH:mm"),
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingCoupon(null);
  };

  const handleSubmit = async () => {
    try {
      const data = {
        ...formData,
        maxDiscount: formData.maxDiscount ? parseFloat(formData.maxDiscount) : null,
        usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null,
      };

      if (editingCoupon) {
        await updateCoupon(editingCoupon._id, data);
      } else {
        await createCoupon(data);
      }

      fetchCoupons();
      handleCloseDialog();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to save coupon');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this coupon?')) {
      try {
        await deleteCoupon(id);
        fetchCoupons();
      } catch (error) {
        alert('Failed to delete coupon');
      }
    }
  };

  const handleToggle = async (id) => {
    try {
      await toggleCoupon(id);
      fetchCoupons();
    } catch (error) {
      alert('Failed to toggle coupon status');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Coupon code copied!');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress size={60} />
      </div>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" fontWeight="bold">
          Coupon Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          }}
        >
          Create Coupon
        </Button>
      </Stack>

      <Grid container spacing={3}>
        {coupons.map((coupon) => (
          <Grid item xs={12} md={6} lg={4} key={coupon._id}>
            <Card sx={{ height: '100%', position: 'relative' }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <div>
                    <Typography variant="h6" fontWeight="bold" color="primary">
                      {coupon.code}
                      <IconButton size="small" onClick={() => copyToClipboard(coupon.code)}>
                        <ContentCopy fontSize="small" />
                      </IconButton>
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {coupon.description}
                    </Typography>
                  </div>
                  <Chip
                    label={coupon.isActive ? 'Active' : 'Inactive'}
                    color={coupon.isActive ? 'success' : 'default'}
                    size="small"
                  />
                </Stack>

                <div style={{ marginBottom: '16px' }}>
                  <Typography variant="body2" fontWeight="bold">
                    Discount:{' '}
                    {coupon.discountType === 'percentage'
                      ? `${coupon.discountValue}%`
                      : `₹${coupon.discountValue}`}
                    {coupon.maxDiscount && ` (Max: ₹${coupon.maxDiscount})`}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Min Order: ₹{coupon.minOrderValue}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Usage: {coupon.usedCount}{coupon.usageLimit ? ` / ${coupon.usageLimit}` : ' (Unlimited)'}
                  </Typography>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <Typography variant="caption" color="text.secondary">
                    Valid: {format(new Date(coupon.validFrom), 'MMM dd, yyyy')} - {format(new Date(coupon.validUntil), 'MMM dd, yyyy')}
                  </Typography>
                </div>

                <Stack direction="row" spacing={1}>
                  <IconButton
                    size="small"
                    onClick={() => handleToggle(coupon._id)}
                    color={coupon.isActive ? 'success' : 'default'}
                  >
                    {coupon.isActive ? <ToggleOn /> : <ToggleOff />}
                  </IconButton>
                  <IconButton size="small" onClick={() => handleOpenDialog(coupon)} color="primary">
                    <Edit />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDelete(coupon._id)} color="error">
                    <Delete />
                  </IconButton>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Coupon Code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="SAVE10"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Discount Type</InputLabel>
                <Select
                  value={formData.discountType}
                  label="Discount Type"
                  onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                >
                  <MenuItem value="percentage">Percentage (%)</MenuItem>
                  <MenuItem value="fixed">Fixed Amount (₹)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Discount Value"
                type="number"
                value={formData.discountValue}
                onChange={(e) => setFormData({ ...formData, discountValue: parseFloat(e.target.value) })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Min Order Value (₹)"
                type="number"
                value={formData.minOrderValue}
                onChange={(e) => setFormData({ ...formData, minOrderValue: parseFloat(e.target.value) })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Max Discount (₹)"
                type="number"
                value={formData.maxDiscount}
                onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                placeholder="Optional"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Usage Limit"
                type="number"
                value={formData.usageLimit}
                onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                placeholder="Leave empty for unlimited"
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Valid From"
                type="datetime-local"
                value={formData.validFrom}
                onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Valid Until"
                type="datetime-local"
                value={formData.validUntil}
                onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}
          >
            {editingCoupon ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CouponManagement;
