import React from 'react';
import {
  TextField,
  Button,
  CircularProgress,
  InputAdornment,
  Typography,
} from '@mui/material';
import PhoneIcon from '@mui/icons-material/Phone';

const PhoneForm = ({ phone, setPhone, onSendOTP, loading }) => {
  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 10) {
      setPhone(value);
    }
  };

  return (
    <>
      <TextField
        fullWidth
        label="Phone Number"
        value={phone}
        onChange={handlePhoneChange}
        placeholder="8148545814"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <PhoneIcon color="action" />
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
        onClick={onSendOTP}
        disabled={loading || phone.length < 10}
        style={{
          padding: '12px 0',
          background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
        }}
      >
        {loading ? <CircularProgress size={24} color="inherit" /> : 'Send OTP'}
      </Button>

      <Typography variant="caption" display="block" textAlign="center" style={{ marginTop: 16 }}>
        Admin phone: 8148545814
      </Typography>
    </>
  );
};

export default PhoneForm;
