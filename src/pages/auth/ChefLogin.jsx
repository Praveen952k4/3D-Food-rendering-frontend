import React, { useState } from 'react';
import { Box, Button, IconButton, InputAdornment, TextField, Typography } from '@mui/material';
import BadgeIcon from '@mui/icons-material/Badge';
import LockIcon from '@mui/icons-material/Lock';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useNavigate } from 'react-router-dom';
import AuthShell from './AuthShell';
import { useAuth, defaultRouteFor } from '../../context/AuthContext';
import { useMessage } from '../../components/ui/MessageDialog';

/**
 * Kitchen sign-in: staff ID and password, checked against the hash held on
 * the staff record. A wrong ID and a wrong password give the same message, so
 * this page cannot be used to find out which staff IDs exist.
 */
const ChefLogin = () => {
  const navigate = useNavigate();
  const { loginStaff } = useAuth();
  const { showError } = useMessage();

  const [staffId, setStaffId] = useState('');
  const [password, setPassword] = useState('');
  const [reveal, setReveal] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!staffId.trim() || !password) {
      showError('Enter both your staff ID and your password.', { title: 'Missing details' });
      return;
    }

    setLoading(true);
    try {
      const staff = await loginStaff(staffId.trim(), password);
      navigate(defaultRouteFor(staff.role));
    } catch (err) {
      showError(
        err.response?.data?.message || 'Could not sign you in. Please try again.',
        { title: 'Not signed in' }
      );
      setPassword('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Kitchen"
      title="Kitchen studio"
      subtitle="Sign in with the staff ID and password you were given."
      back="/login"
      backLabel="Other ways to sign in"
      footer={
        <Typography variant="caption" sx={{ color: 'text.disabled' }}>
          Lost your password? Ask the restaurant owner to reset it from the admin panel.
        </Typography>
      }
    >
      <Box component="form" onSubmit={handleSubmit} sx={{ display: 'grid', gap: 2.5 }}>
        <TextField
          fullWidth
          label="Staff ID"
          value={staffId}
          onChange={(e) => setStaffId(e.target.value)}
          placeholder="chef01"
          autoFocus
          autoComplete="username"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <BadgeIcon fontSize="small" color="action" />
              </InputAdornment>
            ),
          }}
        />

        <TextField
          fullWidth
          label="Password"
          type={reveal ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LockIcon fontSize="small" color="action" />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setReveal((r) => !r)}
                  edge="end"
                  size="small"
                  aria-label={reveal ? 'Hide password' : 'Show password'}
                >
                  {reveal ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <Button type="submit" variant="contained" size="large" fullWidth disabled={loading}>
          {loading ? (
            <>
              <span className="ad-spinner" style={{ marginRight: 10 }} aria-hidden="true" />
              Signing in…
            </>
          ) : (
            'Sign in'
          )}
        </Button>
      </Box>
    </AuthShell>
  );
};

export default ChefLogin;
