import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { TableRestaurant } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import AuthShell from './AuthShell';
import { useAuth, defaultRouteFor } from '../../context/AuthContext';
import { useMessage } from '../../components/ui/MessageDialog';
import { getTables } from '../../services/api';
import { Skeleton } from '../../components/ui/Loaders';

/**
 * Guest sign-in: the table number is the whole credential. It is checked
 * against the restaurant's tables on the server, so an unknown or
 * out-of-service table is refused rather than quietly accepted.
 */
const GuestLogin = () => {
  const navigate = useNavigate();
  const { loginGuest } = useAuth();
  const { showError } = useMessage();

  const [tables, setTables] = useState(null);
  const [tableNumber, setTableNumber] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getTables()
      .then((res) => {
        if (!cancelled) setTables(res.data.tables || []);
      })
      .catch((err) => {
        console.error('Failed to load tables:', err);
        // Not fatal — the number can still be typed and the server validates it.
        if (!cancelled) setTables([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!tableNumber) {
      showError('Please choose or enter your table number.', { title: 'Which table?' });
      return;
    }

    setLoading(true);
    try {
      const guest = await loginGuest(tableNumber, name);
      navigate(defaultRouteFor(guest.role));
    } catch (err) {
      showError(
        err.response?.data?.message || 'Could not start your guest session. Please try again.',
        { title: 'Not signed in' }
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Guest"
      title="Sitting down with us?"
      subtitle="Enter the number on your table card and start ordering. No account needed."
      back="/login"
      backLabel="Other ways to sign in"
      footer={
        <Typography variant="caption" sx={{ color: 'text.disabled' }}>
          Your order stays with this table for the length of your visit.
        </Typography>
      }
    >
      <Box component="form" onSubmit={handleSubmit} sx={{ display: 'grid', gap: 2.5 }}>
        {tables === null ? (
          <Skeleton height={56} radius="14px" />
        ) : tables.length > 0 ? (
          <FormControl fullWidth>
            <InputLabel id="guest-table-label">Table number</InputLabel>
            <Select
              labelId="guest-table-label"
              label="Table number"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              autoFocus
              startAdornment={
                <TableRestaurant sx={{ fontSize: 18, color: 'text.disabled', mr: 1 }} />
              }
            >
              {tables.map((table) => (
                <MenuItem key={table.number} value={table.number}>
                  {table.label || `Table ${table.number}`}
                  <Typography component="span" variant="caption" sx={{ color: 'text.disabled', ml: 1 }}>
                    · {table.seats} seats
                  </Typography>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        ) : (
          <TextField
            fullWidth
            label="Table number"
            value={tableNumber}
            onChange={(e) => setTableNumber(e.target.value.replace(/\D/g, '').slice(0, 3))}
            placeholder="7"
            autoFocus
          />
        )}

        <TextField
          fullWidth
          label="Your name (optional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="So the kitchen knows who to greet"
        />

        <Button type="submit" variant="contained" size="large" fullWidth disabled={loading}>
          {loading ? (
            <>
              <span className="ad-spinner" style={{ marginRight: 10 }} aria-hidden="true" />
              Starting…
            </>
          ) : (
            'Start ordering'
          )}
        </Button>
      </Box>
    </AuthShell>
  );
};

export default GuestLogin;
