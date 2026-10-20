import React, { useEffect, useRef, useState } from 'react';
import { Alert, Box, Button, TextField, Typography } from '@mui/material';
import { TableRestaurant, CheckCircle } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import AuthShell from './AuthShell';
import { useAuth, defaultRouteFor } from '../../context/AuthContext';
import { useMessage } from '../../components/ui/MessageDialog';
import { getTables } from '../../services/api';
import { Skeleton } from '../../components/ui/Loaders';
import { FONT_DISPLAY } from '../../theme/muiTheme';

/**
 * Booking: pick one of the free tables and have it held in your name.
 *
 * Only tables nobody is sitting at are offered, and the list keeps itself
 * current over the socket — if someone takes a table while this page is open
 * it drops out from under the cursor. The server checks again on submit, so
 * two people choosing the same table seconds apart still ends with one of
 * them being told to pick another.
 */
const BookTable = () => {
  const navigate = useNavigate();
  const { bookTable } = useAuth();
  const { showError } = useMessage();

  const [tables, setTables] = useState(null);
  const [selected, setSelected] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    getTables()
      .then((res) => {
        if (!cancelled) setTables(res.data.tables || []);
      })
      .catch((err) => {
        console.error('Failed to load tables:', err);
        if (!cancelled) setTables([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // A table taken anywhere else should stop being offered here.
  useEffect(() => {
    const SOCKET_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5001';
    socketRef.current = io(SOCKET_URL, { transports: ['websocket', 'polling'] });

    socketRef.current.on('tableChange', (changed) => {
      if (!changed) return;
      setTables((current) =>
        current
          ? current.map((table) =>
              table.number === changed.number ? { ...table, isOccupied: changed.isOccupied } : table
            )
          : current
      );
      // Do not leave a table selected that somebody else has just taken.
      setSelected((current) => (changed.isOccupied && current === changed.number ? '' : current));
    });

    return () => socketRef.current?.disconnect();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selected) {
      showError('Please pick one of the free tables.', { title: 'Which table?' });
      return;
    }
    if (!name.trim()) {
      showError('Please give the name to hold the table under.', { title: 'Whose table?' });
      return;
    }

    setLoading(true);
    try {
      const guest = await bookTable(selected, name.trim());
      navigate(defaultRouteFor(guest.role));
    } catch (err) {
      // A 409 means it went in the seconds since the list was drawn, so mark
      // it taken here rather than leaving a button that cannot work.
      if (err.response?.status === 409) {
        setTables((current) =>
          current
            ? current.map((table) => (table.number === selected ? { ...table, isOccupied: true } : table))
            : current
        );
        setSelected('');
      }
      showError(err.response?.data?.message || 'Could not book that table. Please try again.', {
        title: 'Not booked',
      });
    } finally {
      setLoading(false);
    }
  };

  const free = (tables || []).filter((table) => !table.isOccupied);
  const taken = (tables || []).filter((table) => table.isOccupied);

  return (
    <AuthShell
      eyebrow="Booking"
      title="Book a table"
      subtitle="Pick a free table and we will hold it in your name."
      back="/login"
      backLabel="Other ways to sign in"
      footer={
        <Typography variant="caption" sx={{ color: 'text.disabled' }}>
          Your table is held until your order has been served.
        </Typography>
      }
    >
      <Box component="form" onSubmit={handleSubmit} sx={{ display: 'grid', gap: 2.5 }}>
        {tables === null ? (
          <Skeleton height={120} radius="14px" />
        ) : free.length === 0 ? (
          <Alert severity="warning" sx={{ borderRadius: 'var(--ad-radius)' }}>
            Every table is taken right now. Please ask a member of staff, or try again in a few
            minutes.
          </Alert>
        ) : (
          <Box>
            <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mb: 1 }}>
              {free.length} free · {taken.length} taken
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gap: 1,
                gridTemplateColumns: 'repeat(auto-fill, minmax(104px, 1fr))',
              }}
            >
              {tables.map((table) => {
                const isSelected = selected === table.number;
                return (
                  <Box
                    key={table.number}
                    role="button"
                    aria-disabled={table.isOccupied}
                    tabIndex={table.isOccupied ? -1 : 0}
                    onClick={() => !table.isOccupied && setSelected(table.number)}
                    onKeyDown={(e) => {
                      if (table.isOccupied) return;
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelected(table.number);
                      }
                    }}
                    sx={{
                      position: 'relative',
                      p: 1.5,
                      textAlign: 'center',
                      borderRadius: 'var(--ad-radius-sm)',
                      border: '1px solid',
                      borderColor: isSelected ? 'var(--ad-ember)' : 'var(--ad-line)',
                      bgcolor: isSelected ? 'var(--ad-ember-wash)' : 'var(--ad-surface)',
                      cursor: table.isOccupied ? 'not-allowed' : 'pointer',
                      opacity: table.isOccupied ? 0.45 : 1,
                      transition: 'border-color .15s ease, background-color .15s ease',
                      '&:hover': table.isOccupied
                        ? {}
                        : { borderColor: 'var(--ad-ember)' },
                    }}
                  >
                    <TableRestaurant
                      sx={{
                        fontSize: 18,
                        color: isSelected ? 'var(--ad-ember)' : 'text.disabled',
                      }}
                    />
                    <Typography sx={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 14 }}>
                      {table.label || `Table ${table.number}`}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block' }}>
                      {table.isOccupied ? 'Occupied' : `${table.seats} seats`}
                    </Typography>
                    {isSelected && (
                      <CheckCircle
                        sx={{
                          position: 'absolute',
                          top: 4,
                          right: 4,
                          fontSize: 15,
                          color: 'var(--ad-ember)',
                        }}
                      />
                    )}
                  </Box>
                );
              })}
            </Box>
          </Box>
        )}

        <TextField
          fullWidth
          label="Name for the booking"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="So staff know whose table it is"
        />

        <Button
          type="submit"
          variant="contained"
          size="large"
          fullWidth
          disabled={loading || !selected || !name.trim()}
        >
          {loading ? (
            <>
              <span className="ad-spinner" style={{ marginRight: 10 }} aria-hidden="true" />
              Booking…
            </>
          ) : selected ? (
            `Book table ${selected}`
          ) : (
            'Pick a table'
          )}
        </Button>
      </Box>
    </AuthShell>
  );
};

export default BookTable;
