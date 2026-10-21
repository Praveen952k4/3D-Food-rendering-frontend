import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Alert,
  Pagination,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SecurityIcon from '@mui/icons-material/Security';

import { getGstAuditTrail } from '../../../services/api';
import { FONT_DISPLAY } from '../../../theme/muiTheme';

const AuditTrailTab = () => {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAuditEvents(pagination.page);
  }, [pagination.page]);

  const fetchAuditEvents = async (page) => {
    try {
      setLoading(true);
      setError(null);
      const res = await getGstAuditTrail({ page, limit: 15 });
      if (res.data.success) {
        setEvents(res.data.events || []);
        setPagination(res.data.pagination || { page: 1, totalPages: 1 });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load audit events.');
    } finally {
      setLoading(false);
    }
  };

  const getActionChipConfig = (action) => {
    if (action.includes('APPROVED') || action.includes('CONFIRMED') || action.includes('PAID')) {
      return { bg: 'var(--ad-basil-wash)', fg: 'var(--ad-basil)', border: 'var(--ad-basil)' };
    }
    if (action.includes('SUBMIT') || action.includes('CALCULATED') || action.includes('GENERATED')) {
      return { bg: 'var(--ad-ember-wash)', fg: 'var(--ad-ember)', border: 'var(--ad-ember)' };
    }
    return { bg: 'var(--ad-saffron-wash)', fg: 'var(--ad-warn)', border: 'var(--ad-saffron)' };
  };

  return (
    <Box sx={{ maxWidth: 1050, mx: 'auto' }}>
      <Alert
        severity="info"
        sx={{
          mb: 3,
          borderRadius: 'var(--ad-radius)',
          bgcolor: 'var(--ad-surface-2)',
          border: '1px solid var(--ad-line)',
          color: 'var(--ad-text)',
        }}
        icon={<SecurityIcon sx={{ color: 'var(--ad-ember)' }} />}
      >
        <Typography variant="subtitle2" fontWeight="700">
          Tamper-Evident Immutable Audit Log
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          All statutory GST actions, profile adjustments, calculation snapshots, manager authorizations, provider transmissions, and payments are permanently recorded with timestamp, user identity, and correlation identifiers. Records cannot be overwritten or deleted.
        </Typography>
      </Alert>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 'var(--ad-radius-sm)' }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper
        elevation={0}
        sx={{
          borderRadius: 'var(--ad-radius)',
          border: '1px solid var(--ad-line)',
          overflow: 'hidden',
          bgcolor: 'background.paper',
        }}
      >
        <Box sx={{ p: 2.5, borderBottom: '1px solid var(--ad-line)' }}>
          <Typography sx={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 18 }}>
            Compliance Activity Trail &amp; Event Register
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Full traceability for statutory verification and tax officer audits.
          </Typography>
        </Box>

        <TableContainer>
          <Table size="small">
            <TableHead sx={{ bgcolor: 'var(--ad-surface-2)' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>TIMESTAMP</TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>ACTION</TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>ACTOR / USER</TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>CORRELATION ID</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: 'text.secondary' }}>PAYLOAD</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                    <CircularProgress sx={{ color: 'var(--ad-ember)' }} size={32} />
                  </TableCell>
                </TableRow>
              ) : events.length > 0 ? (
                events.map((ev, idx) => {
                  const chip = getActionChipConfig(ev.action || '');
                  return (
                    <TableRow key={idx} hover sx={{ '&:hover': { bgcolor: 'var(--ad-surface-2)' } }}>
                      <TableCell sx={{ color: 'text.secondary', fontSize: 12 }}>
                        {new Date(ev.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={ev.action}
                          size="small"
                          sx={{
                            borderRadius: 'var(--ad-radius-sm)',
                            fontWeight: 700,
                            fontSize: 10,
                            bgcolor: chip.bg,
                            color: chip.fg,
                            border: `1px solid ${chip.border}`,
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{ev.userName || ev.userPhone || 'System'}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: 11, color: 'text.secondary' }}>
                        {ev.correlationId || '—'}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => setSelectedEvent(ev)}
                          sx={{ color: 'var(--ad-ember)', '&:hover': { bgcolor: 'var(--ad-ember-wash)' } }}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No audit records logged yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {pagination.totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2, borderTop: '1px solid var(--ad-line)' }}>
            <Pagination
              count={pagination.totalPages}
              page={pagination.page}
              onChange={(e, p) => setPagination((prev) => ({ ...prev, page: p }))}
              sx={{
                '& .Mui-selected': {
                  bgcolor: 'var(--ad-ember) !important',
                  color: '#ffffff',
                },
              }}
            />
          </Box>
        )}
      </Paper>

      {/* Payload Inspection Modal */}
      <Dialog
        open={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 'var(--ad-radius)' } }}
      >
        <DialogTitle sx={{ fontFamily: FONT_DISPLAY, fontWeight: 600 }}>
          Audit Event Details: {selectedEvent?.action}
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: 'var(--ad-line)' }}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Logged At: <strong>{selectedEvent ? new Date(selectedEvent.timestamp).toLocaleString() : ''}</strong> &bull; Performed By: <strong>{selectedEvent?.userName || 'System'}</strong>
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Correlation ID: {selectedEvent?.correlationId}
            </Typography>
          </Box>

          <Typography variant="subtitle2" fontWeight="700" sx={{ mb: 1 }}>
            Sanitized Event Payload:
          </Typography>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              bgcolor: 'var(--ad-surface-2)',
              border: '1px solid var(--ad-line)',
              borderRadius: 'var(--ad-radius-sm)',
              maxHeight: 350,
              overflow: 'auto',
            }}
          >
            <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: 12, color: 'var(--ad-text)' }}>
              {JSON.stringify(selectedEvent?.details || {}, null, 2)}
            </pre>
          </Paper>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setSelectedEvent(null)} sx={{ textTransform: 'none', color: 'text.secondary' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AuditTrailTab;
