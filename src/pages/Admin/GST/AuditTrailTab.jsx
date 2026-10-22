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
  Button,
  CircularProgress,
  Alert,
  Pagination,
} from '@mui/material';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import SecurityIcon from '@mui/icons-material/Security';

import { getGstAuditTrail, getGstProfile } from '../../../services/api';
import { FONT_DISPLAY } from '../../../theme/muiTheme';
import GSTChallanModal from './GSTChallanModal';

const AuditTrailTab = () => {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getGstProfile()
      .then((res) => {
        if (res.data?.success && res.data.profile) {
          setProfile(res.data.profile);
        }
      })
      .catch(() => {});
  }, []);

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
                <TableCell align="right" sx={{ fontWeight: 700, color: 'text.secondary' }}>CHALLAN / RECEIPT</TableCell>
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
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<ReceiptLongIcon sx={{ fontSize: 15 }} />}
                          onClick={() => setSelectedEvent(ev)}
                          sx={{
                            fontSize: 11,
                            fontWeight: 600,
                            textTransform: 'none',
                            py: 0.35,
                            px: 1.25,
                            borderColor: 'var(--ad-line)',
                            color: 'var(--ad-ember)',
                            borderRadius: 'var(--ad-radius-sm)',
                            '&:hover': {
                              borderColor: 'var(--ad-ember)',
                              bgcolor: 'var(--ad-ember-wash)',
                            },
                          }}
                        >
                          View Challan
                        </Button>
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

      {/* Printable Form GST PMT-06 Challan Modal */}
      <GSTChallanModal
        open={!!selectedEvent}
        event={selectedEvent}
        profile={profile}
        onClose={() => setSelectedEvent(null)}
      />
    </Box>
  );
};

export default AuditTrailTab;
