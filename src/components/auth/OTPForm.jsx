import React from 'react';
import {
  TextField,
  Button,
  CircularProgress,
  InputAdornment,
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';

const OTPForm = ({ otp, setOtp, onVerifyOTP, onChangePhone, loading }) => {
  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 6) {
      setOtp(value);
    }
  };

  return (
    <>
      <TextField
        fullWidth
        label="OTP"
        value={otp}
        onChange={handleOtpChange}
        placeholder="Enter 6-digit OTP"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <LockIcon color="action" />
            </InputAdornment>
          ),
        }}
        style={{ marginBottom: 24 }}
        autoFocus
      />

      <Button
        fullWidth
        variant="contained"
        size="large"
        onClick={onVerifyOTP}
        disabled={loading || otp.length !== 6}
        style={{
          padding: '12px 0',
          marginBottom: 16,
          background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
        }}
      >
        {loading ? <CircularProgress size={24} color="inherit" /> : 'Verify OTP'}
      </Button>

      <Button
        fullWidth
        variant="text"
        onClick={onChangePhone}
      >
        Change Phone Number
      </Button>
    </>
  );
};

export default OTPForm;
