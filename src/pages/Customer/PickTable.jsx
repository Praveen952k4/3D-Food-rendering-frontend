import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Box, Button, Container, Paper, Typography } from '@mui/material';
import { TableRestaurant, CheckCircle } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import { getTables, takeTable, getMyTable } from '../../services/api';
import { useMessage } from '../../components/ui/MessageDialog';
import { Skeleton } from '../../components/ui/Loaders';
import { FONT_DISPLAY } from '../../theme/muiTheme';

/**
 * The first thing a diner does after signing in: say which table they are at.
 *
 * This is not paperwork — it is the start of the clock. Everything the admin
 * sees afterwards is measured from this moment: how long before they ordered,
 * how long the kitchen took, how long until the food reached them. Nothing
 * before it can be timed, which is why it comes before the menu rather than
 * being asked for at checkout.
 */
const PickTable = () => {
  const navigate = useNavigate();
  const { showError } = useMessage();

  const [tables, setTables] = useState(null);
  const [selected, setSelected] = useState('');
  const [saving, setSaving] = useState(false);
  const socketRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const response = await getTables();
      setTables(response.data.tables || []);
    } catch (err) {
      console.error('Failed to load tables:', err);
      setTables([]);
    }
  }, []);

  useEffect(() => {
    // Someone who already has a table does not need to be asked again.
    getMyTable()
      .then((res) => {
        if (res.data.table) navigate('/customer/home', { replace: true });
      })
      .catch(() => {});
    load();
  }, [load, navigate]);

  // Tables go while people are looking at this screen, so it keeps itself
  // current rather than failing on submit.
  useEffect(() => {
    const SOCKET_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5001';
    socketRef.current = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socketRef.current.on('tableChange', (changed) => {
      if (!changed) return;
      setTables((current) =>
        current
          ? current.map((t) => (t.number === changed.number ? { ...t, isOccupied: changed.isOccupied } : t))
          : current
      );
      setSelected((current) => (changed.isOccupied && current === changed.number ? '' : current));
    });
    return () => socketRef.current?.disconnect();
  }, []);

  const handleSit = async () => {
    setSaving(true);
    try {
      await takeTable(selected);
      navigate('/customer/home', { replace: true });
    } catch (err) {
      if (err.response?.status === 409) {
        setSelected('');
        load();
      }
      showError(err.response?.data?.message || 'Could not seat you at that table.', {
        title: 'Not seated',
      });
    } finally {
      setSaving(false);
    }
  };

  const free = (tables || []).filter((t) => !t.isOccupied);

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 3, sm: 6 } }}>
      <Typography className="ad-eyebrow">Welcome</Typography>
      <Typography sx={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: { xs: 26, sm: 32 }, mb: 0.5 }}>
        Which table are you at?
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
        The number is on your table card. We will bring your food there.
      </Typography>

      <Paper sx={{ p: { xs: 2, sm: 3 } }}>
        {tables === null ? (
          <Skeleton height={140} radius="14px" />
        ) : free.length === 0 ? (
          <Alert severity="warning" sx={{ borderRadius: 'var(--ad-radius)' }}>
            Every table is taken right now. Please ask a member of staff.
          </Alert>
        ) : (
          <>
            <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mb: 1 }}>
              {free.length} free · {(tables || []).length - free.length} taken
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gap: 1,
                gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
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
                      '&:hover': table.isOccupied ? {} : { borderColor: 'var(--ad-ember)' },
                    }}
                  >
                    <TableRestaurant
                      sx={{ fontSize: 18, color: isSelected ? 'var(--ad-ember)' : 'text.disabled' }}
                    />
                    <Typography sx={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 14 }}>
                      {table.label || `Table ${table.number}`}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block' }}>
                      {table.isOccupied ? 'Occupied' : `${table.seats} seats`}
                    </Typography>
                    {isSelected && (
                      <CheckCircle
                        sx={{ position: 'absolute', top: 4, right: 4, fontSize: 15, color: 'var(--ad-ember)' }}
                      />
                    )}
                  </Box>
                );
              })}
            </Box>
          </>
        )}

        <Button
          variant="contained"
          size="large"
          fullWidth
          sx={{ mt: 3 }}
          disabled={!selected || saving}
          onClick={handleSit}
        >
          {saving ? (
            <>
              <span className="ad-spinner" style={{ marginRight: 10 }} aria-hidden="true" />
              Seating you…
            </>
          ) : selected ? (
            `Sit at table ${selected} and see the menu`
          ) : (
            'Choose your table'
          )}
        </Button>
      </Paper>
    </Container>
  );
};

export default PickTable;
