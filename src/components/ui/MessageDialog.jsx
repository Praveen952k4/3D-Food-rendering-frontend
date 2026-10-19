import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, Typography } from '@mui/material';
import { ErrorOutline, CheckCircleOutline, InfoOutlined, HelpOutline } from '@mui/icons-material';
import { FONT_DISPLAY } from '../../theme/muiTheme';

/**
 * One centred dialog for every message the app shows — errors, confirmations
 * and the occasional success note. It replaces the browser's own alert() and
 * confirm() popups, which were unthemed, left the page, and could not be
 * styled light or dark.
 *
 *   const { showError, showSuccess, showInfo, confirmAction } = useMessage();
 *   showError('The order could not be updated.');
 *   if (await confirmAction({ message: 'Delete this coupon?' })) { ... }
 */

const MessageContext = createContext(null);

const TONES = {
  error: {
    icon: <ErrorOutline />,
    title: 'Something went wrong',
    fg: 'var(--ad-danger)',
    wash: 'rgba(197, 65, 47, 0.14)',
    glow: 'rgba(197, 65, 47, 0.16)',
  },
  success: {
    icon: <CheckCircleOutline />,
    title: 'Done',
    fg: 'var(--ad-basil)',
    wash: 'var(--ad-basil-wash)',
    glow: 'rgba(47, 125, 98, 0.16)',
  },
  info: {
    icon: <InfoOutlined />,
    title: 'Just so you know',
    fg: 'var(--ad-ember)',
    wash: 'var(--ad-ember-wash)',
    glow: 'var(--ad-ember-wash)',
  },
  confirm: {
    icon: <HelpOutline />,
    title: 'Are you sure?',
    fg: 'var(--ad-ember)',
    wash: 'var(--ad-ember-wash)',
    glow: 'var(--ad-ember-wash)',
  },
};

export const MessageProvider = ({ children }) => {
  const [message, setMessage] = useState(null);
  const resolverRef = useRef(null);

  const close = useCallback((result) => {
    setMessage(null);
    const resolve = resolverRef.current;
    resolverRef.current = null;
    if (resolve) resolve(result);
  }, []);

  const api = useMemo(() => {
    const show = (tone) => (body, options = {}) =>
      setMessage({
        tone,
        body: typeof body === 'string' ? body : String(body ?? ''),
        ...(typeof options === 'string' ? { title: options } : options),
      });

    return {
      showError: show('error'),
      showSuccess: show('success'),
      showInfo: show('info'),
      /** Resolves true when the person confirms, false when they cancel. */
      confirmAction: ({ message: body, title, confirmLabel = 'Confirm', cancelLabel = 'Cancel', destructive = false }) =>
        new Promise((resolve) => {
          resolverRef.current = resolve;
          setMessage({ tone: 'confirm', body, title, confirmLabel, cancelLabel, destructive, isConfirm: true });
        }),
    };
  }, []);

  const tone = TONES[message?.tone] || TONES.info;

  return (
    <MessageContext.Provider value={api}>
      {children}

      <Dialog
        open={!!message}
        onClose={() => close(false)}
        maxWidth="xs"
        fullWidth
        // Centred in the viewport, on every screen size.
        sx={{ '& .MuiDialog-container': { alignItems: 'center', justifyContent: 'center' } }}
        PaperProps={{ sx: { m: 2, width: '100%', maxWidth: 420, overflow: 'hidden', textAlign: 'center' } }}
      >
        <DialogContent sx={{ px: 3, pt: 4, pb: 2, background: `radial-gradient(90% 90% at 50% 0%, ${tone.glow}, transparent 70%)` }}>
          <Box
            sx={{
              width: 54,
              height: 54,
              mx: 'auto',
              mb: 2,
              borderRadius: '17px',
              display: 'grid',
              placeItems: 'center',
              bgcolor: tone.wash,
              color: tone.fg,
              '& svg': { fontSize: 27 },
            }}
          >
            {tone.icon}
          </Box>

          <Typography sx={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 21, mb: 0.75 }}>
            {message?.title || tone.title}
          </Typography>

          <Typography
            variant="body2"
            sx={{ color: 'text.secondary', whiteSpace: 'pre-line', mx: 'auto', maxWidth: 330 }}
          >
            {message?.body}
          </Typography>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, pt: 0, gap: 1, justifyContent: 'center' }}>
          {message?.isConfirm ? (
            <>
              <Button onClick={() => close(false)} variant="outlined" sx={{ flex: 1 }}>
                {message.cancelLabel}
              </Button>
              <Button
                onClick={() => close(true)}
                variant="contained"
                color={message.destructive ? 'error' : 'primary'}
                sx={{ flex: 1 }}
                autoFocus
              >
                {message.confirmLabel}
              </Button>
            </>
          ) : (
            <Button onClick={() => close(true)} variant="contained" fullWidth autoFocus>
              {message?.dismissLabel || 'Close'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </MessageContext.Provider>
  );
};

export const useMessage = () => {
  const context = useContext(MessageContext);
  if (!context) throw new Error('useMessage must be used within a MessageProvider');
  return context;
};

export default MessageProvider;
