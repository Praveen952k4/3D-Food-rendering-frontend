import React, { useState } from 'react';
import {
  useTheme,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  IconButton,
  Alert,
  CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SendIcon from '@mui/icons-material/Send';
import StoreIcon from '@mui/icons-material/Store';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { submitSalesEnquiry } from '../../services/api';
import { FONT_DISPLAY } from '../../theme/muiTheme';

const TalkToSalesDialog = ({ open, onClose, defaultPlan = '' }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    description: defaultPlan ? `Interested in ${defaultPlan} Plan.` : '',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState(null);

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) {
      errs.name = 'Name is required.';
    } else if (formData.name.trim().length < 2) {
      errs.name = 'Name must be at least 2 characters.';
    }

    if (!formData.phone.trim()) {
      errs.phone = 'Phone number is required.';
    } else if (!/^[0-9+\-\s()]{7,20}$/.test(formData.phone.trim())) {
      errs.phone = 'Please enter a valid phone number (e.g. +91 9876543210).';
    }

    if (!formData.email.trim()) {
      errs.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = 'Please enter a valid email address.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate() || loading) return;

    try {
      setLoading(true);
      setServerError(null);

      const res = await submitSalesEnquiry(formData);
      if (res.data.success) {
        setSubmitted(true);
      } else {
        setServerError(res.data.message || 'Submission failed. Please try again.');
      }
    } catch (err) {
      setServerError(
        err.response?.data?.message || 'Unable to connect to the server. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetAndClose = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      description: '',
    });
    setErrors({});
    setServerError(null);
    setSubmitted(false);
    onClose();
  };

  const handleReturnHome = () => {
    handleResetAndClose();
    if (window.location.hash) {
      window.location.hash = '';
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : handleResetAndClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: { xs: 0, sm: 'var(--ad-radius)' },
          bgcolor: 'var(--ad-surface)',
          backgroundImage: 'none',
          boxShadow: 'var(--ad-shadow)',
          border: { xs: 'none', sm: '1px solid var(--ad-line)' },
          overflow: 'hidden',
        },
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          p: { xs: 2.5, sm: 3 },
          borderBottom: '1px solid var(--ad-line)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: 'var(--ad-surface-2)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: '12px',
              bgcolor: 'var(--ad-ember-wash)',
              color: 'var(--ad-ember)',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <StoreIcon sx={{ fontSize: 22 }} />
          </Box>
          <Box>
            <Typography
              sx={{
                fontFamily: FONT_DISPLAY,
                fontSize: { xs: 18, sm: 20 },
                fontWeight: 600,
                lineHeight: 1.2,
                color: 'var(--ad-text)',
              }}
            >
              Talk to Sales
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
              Custom deployment &bull; 3D modelling assistance &bull; Multi-outlet rollout
            </Typography>
          </Box>
        </Box>
        {!loading && (
          <IconButton
            onClick={handleResetAndClose}
            size="small"
            aria-label="Close dialog"
            sx={{ color: 'text.secondary' }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        )}
      </DialogTitle>

      {/* Body Content */}
      <DialogContent sx={{ p: { xs: 2.5, sm: 3 } }}>
        {submitted ? (
          <Box
            sx={{
              py: 4,
              px: 2,
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                bgcolor: 'var(--ad-basil-wash)',
                color: 'var(--ad-basil)',
                display: 'grid',
                placeItems: 'center',
                boxShadow: '0 8px 24px rgba(47, 125, 98, 0.25)',
              }}
            >
              <CheckCircleIcon sx={{ fontSize: 38 }} />
            </Box>

            <Typography
              sx={{
                fontFamily: FONT_DISPLAY,
                fontSize: 22,
                fontWeight: 700,
                color: 'var(--ad-text)',
              }}
            >
              Thanks for contacting us. We'll get back to you shortly.
            </Typography>

            <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 420, lineHeight: 1.6 }}>
              Our enterprise hospitality solutions team has received your enquiry and will connect with
              you within one business day with demo access and tailored onboarding pricing.
            </Typography>

            <Button
              variant="contained"
              onClick={handleReturnHome}
              startIcon={<ArrowBackIcon />}
              sx={{
                mt: 2,
                borderRadius: 999,
                bgcolor: 'var(--ad-ember)',
                color: '#fff',
                px: 3.5,
                py: 1.25,
                fontWeight: 600,
                textTransform: 'none',
                boxShadow: '0 10px 24px -10px rgba(226, 85, 43, 0.8)',
                '&:hover': {
                  bgcolor: 'var(--ad-ember-soft)',
                },
              }}
            >
              Return to Home
            </Button>
          </Box>
        ) : (
          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
            {serverError && (
              <Alert severity="error" sx={{ mb: 2.5, borderRadius: '12px' }}>
                {serverError}
              </Alert>
            )}

            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2.5, lineHeight: 1.5 }}>
              Share your restaurant or franchise details below. Our team will tailor a live demonstration
              and provide an exact quote for your menu.
            </Typography>

            <Box sx={{ display: 'grid', gap: 2 }}>
              <TextField
                required
                fullWidth
                label="Full Name"
                placeholder="e.g. Ramesh Krishnan"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                error={Boolean(errors.name)}
                helperText={errors.name}
                disabled={loading}
                variant="outlined"
                size="small"
                inputProps={{ 'aria-label': 'Full Name' }}
              />

              <TextField
                required
                fullWidth
                label="Phone Number"
                placeholder="e.g. +91 9876543210"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                error={Boolean(errors.phone)}
                helperText={errors.phone}
                disabled={loading}
                variant="outlined"
                size="small"
                inputProps={{ 'aria-label': 'Phone Number' }}
              />

              <TextField
                required
                fullWidth
                type="email"
                label="Business Email"
                placeholder="e.g. ramesh@restaurant.com"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                error={Boolean(errors.email)}
                helperText={errors.email}
                disabled={loading}
                variant="outlined"
                size="small"
                inputProps={{ 'aria-label': 'Business Email' }}
              />

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description & Requirements (Optional)"
                placeholder="Tell us about your restaurant, number of tables, outlets, or custom 3D model requirements..."
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                error={Boolean(errors.description)}
                helperText={errors.description}
                disabled={loading}
                variant="outlined"
                size="small"
                inputProps={{ 'aria-label': 'Description and requirements' }}
              />
            </Box>

            <DialogActions sx={{ px: 0, pt: 3, pb: 0, justifyContent: 'flex-end', gap: 1.5 }}>
              <Button
                type="button"
                onClick={handleResetAndClose}
                disabled={loading}
                sx={{
                  color: 'text.secondary',
                  textTransform: 'none',
                  fontWeight: 600,
                  borderRadius: 999,
                  px: 2.5,
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <SendIcon sx={{ fontSize: 18 }} />}
                sx={{
                  bgcolor: 'var(--ad-ember)',
                  color: '#fff',
                  textTransform: 'none',
                  fontWeight: 600,
                  borderRadius: 999,
                  px: 3,
                  py: 1,
                  boxShadow: '0 10px 24px -10px rgba(226, 85, 43, 0.8)',
                  '&:hover': {
                    bgcolor: 'var(--ad-ember-soft)',
                  },
                }}
              >
                {loading ? 'Submitting…' : 'Submit Enquiry'}
              </Button>
            </DialogActions>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TalkToSalesDialog;
