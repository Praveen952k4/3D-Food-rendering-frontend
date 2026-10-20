import React, { useState } from 'react';
import { Alert, Box, Button, InputAdornment, TextField, Typography } from '@mui/material';
import PhoneIcon from '@mui/icons-material/Phone';
import LockClockIcon from '@mui/icons-material/LockClock';
import { useNavigate } from 'react-router-dom';
import AuthShell from './AuthShell';
import { sendOTP } from '../../services/api';
import { useAuth, defaultRouteFor } from '../../context/AuthContext';
import { useMessage } from '../../components/ui/MessageDialog';

/**
 * Kitchen sign-in: the staff phone number and a one-time code, the same flow
 * customers and admins use. The role comes from the number itself — the staff
 * number is listed in CHEF_PHONES on the server — so whoever signs in here
 * lands on the page their stored role points at.
 */
const ChefLogin = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showError } = useMessage();

  const [step, setStep] = useState('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async (event) => {
    event.preventDefault();
    if (phone.length < 10) {
      showError('Please enter a valid 10-digit phone number.', { title: 'Check the number' });
      return;
    }

    setLoading(true);
    try {
      const response = await sendOTP(phone);
      if (response.data.otp) setDevOtp(response.data.otp);
      setStep('otp');
    } catch (err) {
      showError(
        err.response?.data?.message || 'Could not send the code. Check that the API is reachable.',
        { title: 'No code sent' }
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (event) => {
    event.preventDefault();
    if (otp.length !== 6) {
      showError('The code is six digits long.', { title: 'Check the code' });
      return;
    }

    setLoading(true);
    try {
      const staff = await login(phone, otp);
      navigate(defaultRouteFor(staff.role));
    } catch (err) {
      showError(err.response?.data?.message || 'That code was not accepted.', { title: 'Not signed in' });
    } finally {
      setLoading(false);
    }
  };

  const isPhoneStep = step === 'phone';

  return (
    <AuthShell
      eyebrow="Kitchen"
      title={isPhoneStep ? 'Kitchen studio' : 'Check your phone'}
      subtitle={
        isPhoneStep
          ? 'Sign in with the kitchen phone number and a one-time code.'
          : `We sent a six-digit code to ${phone}.`
      }
      back="/login"
      backLabel="Other ways to sign in"
      footer={
        <Typography variant="caption" sx={{ color: 'text.disabled' }}>
          Not reaching the kitchen studio? Ask the restaurant owner to check the number is
          registered as staff.
        </Typography>
      }
    >
      {devOtp && (
        <Alert severity="info" sx={{ mb: 2.5, borderRadius: 'var(--ad-radius)' }}>
          <strong>Development code: {devOtp}</strong>
          <Typography variant="caption" display="block">
            SMS is switched off, so the code is shown here instead.
          </Typography>
        </Alert>
      )}

      {isPhoneStep ? (
        <Box component="form" onSubmit={handleSendOTP} sx={{ display: 'grid', gap: 2.5 }}>
          <TextField
            fullWidth
            label="Phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
            placeholder="9999999999"
            autoFocus
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PhoneIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
            }}
          />

          <Button type="submit" variant="contained" size="large" fullWidth disabled={loading || phone.length < 10}>
            {loading ? (
              <>
                <span className="ad-spinner" style={{ marginRight: 10 }} aria-hidden="true" />
                Sending…
              </>
            ) : (
              'Send me a code'
            )}
          </Button>
        </Box>
      ) : (
        <Box component="form" onSubmit={handleVerifyOTP} sx={{ display: 'grid', gap: 2.5 }}>
          <TextField
            fullWidth
            label="Six-digit code"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="123456"
            autoFocus
            inputProps={{ inputMode: 'numeric', style: { letterSpacing: '0.32em', fontWeight: 600 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockClockIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
            }}
          />

          <Button type="submit" variant="contained" size="large" fullWidth disabled={loading || otp.length !== 6}>
            {loading ? (
              <>
                <span className="ad-spinner" style={{ marginRight: 10 }} aria-hidden="true" />
                Checking…
              </>
            ) : (
              'Sign in'
            )}
          </Button>

          <Button
            onClick={() => {
              setStep('phone');
              setOtp('');
              setDevOtp('');
            }}
            sx={{ color: 'text.secondary' }}
          >
            Use a different number
          </Button>
        </Box>
      )}
    </AuthShell>
  );
};

export default ChefLogin;
