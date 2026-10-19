import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Alert,
  Button,
} from '@mui/material';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import { useNavigate } from 'react-router-dom';
import { sendOTP } from '../services/api';
import { useAuth } from '../context/AuthContext';
import PhoneForm from '../components/auth/PhoneForm';
import OTPForm from '../components/auth/OTPForm';

const Login = () => {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('phone');
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
      console.log('Sending OTP to:', phone);
      const response = await sendOTP(phone);
      console.log('OTP Response:', response.data);
      
      // Show dummy OTP hint
      if (response.data.otp) {
        setDevOtp(response.data.otp);
      }
      
      setStep('otp');
      setError('');
    } catch (err) {
      console.error('OTP Error:', err);
      console.error('Error response:', err.response);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to send OTP. Make sure backend is running on port 5001.';
      setError(errorMessage);
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
        } else if (user.role === 'chef') {
          navigate('/chef/dashboard');
        } else {
          navigate('/customer/home');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePhone = () => {
    setStep('phone');
    setOtp('');
    setError('');
    setDevOtp('');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        background: 'radial-gradient(900px 420px at 80% 0%, rgba(212,177,90,0.18), transparent 55%), #0b0a09',
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
            <RestaurantIcon style={{ fontSize: 60, color: '#b8892d', marginBottom: 16 }} />
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              AR Automated Dining
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {step === 'phone' ? 'Sign in with your phone to order or open the kitchen studio.' : 'Enter the OTP sent to your phone'}
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

          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <Button
              onClick={() => navigate('/')}
              sx={{ color: '#b8892d', textTransform: 'none' }}
            >
              Back to AR Automated Dining
            </Button>
          </div>

          {step === 'phone' ? (
            <PhoneForm 
              phone={phone} 
              setPhone={setPhone} 
              onSendOTP={handleSendOTP} 
              loading={loading} 
            />
          ) : (
            <OTPForm 
              otp={otp} 
              setOtp={setOtp} 
              onVerifyOTP={handleVerifyOTP} 
              onChangePhone={handleChangePhone}
              loading={loading} 
            />
          )}
        </Paper>
      </Container>
    </div>
  );
};

export default Login;
