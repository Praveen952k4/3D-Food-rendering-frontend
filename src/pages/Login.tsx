import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Alert,
  InputAdornment,
} from '@mui/material';
import PhoneIcon from '@mui/icons-material/Phone';
import LockIcon from '@mui/icons-material/Lock';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import { useNavigate } from 'react-router-dom';
import { sendOTP } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Login: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [devOtp, setDevOtp] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSendOTP = async () => {
    setError('');
    
    if (!phone || phone.length < 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    setLoading(true);
    try {
      const response = await sendOTP(phone);
      
      // Show dummy OTP hint
      if (response.data.otp) {
        setDevOtp(response.data.otp);
      }
      
      setStep('otp');
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    setError('');
    
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      await login(phone, otp);
      
      // Check user role and redirect
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user.role === 'admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/customer/menu');
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 10) {
      setPhone(value);
    }
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 6) {
      setOtp(value);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '32px 0',
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={10}
          style={{
            padding: 32,
            borderRadius: 12,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <RestaurantIcon style={{ fontSize: 60, color: '#667eea', marginBottom: 16 }} />
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              AR Food Ordering
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {step === 'phone' ? 'Enter your phone number' : 'Enter OTP sent to your phone'}
            </Typography>
          </div>

          {error && (
            <Alert severity="error" style={{ marginBottom: 24 }}>
              {error}
            </Alert>
          )}

          {devOtp && (
            <Alert severity="info" style={{ marginBottom: 24 }}>
              <strong>Dummy OTP:</strong> {devOtp}
              <br />
              <Typography variant="caption">
                SMS integration is disabled. Use this OTP to login.
              </Typography>
            </Alert>
          )}

          {step === 'phone' ? (
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
                onClick={handleSendOTP}
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
          ) : (
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
                onClick={handleVerifyOTP}
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
                onClick={() => {
                  setStep('phone');
                  setOtp('');
                  setError('');
                  setDevOtp('');
                }}
              >
                Change Phone Number
              </Button>
            </>
          )}
        </Paper>
      </Container>
    </div>
  );
};

export default Login;
