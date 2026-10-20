import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardMedia,
  Chip,
  Container,
  Dialog,
  DialogContent,
  IconButton,
  MenuItem,
  Paper,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from '@mui/material';
import {
  TableRestaurant,
  CheckCircle,
  Add,
  Remove,
  ViewInAr,
  Close,
  Schedule,
  ArrowBack,
} from '@mui/icons-material';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage, useGLTF } from '@react-three/drei';
import { useNavigate } from 'react-router-dom';
import { format, addMinutes, roundToNearestMinutes } from 'date-fns';
import {
  getTableAvailability,
  createBooking,
  getFoodItems,
} from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useMessage } from '../../components/ui/MessageDialog';
import { Skeleton, SkeletonCards } from '../../components/ui/Loaders';
import { formatINR } from '../../config/business';
import { FONT_DISPLAY } from '../../theme/muiTheme';

/**
 * Booking a table for later, and optionally choosing the food now.
 *
 * Four steps, because each one narrows the next: when you are coming decides
 * which tables are free, which table you take decides nothing about the food,
 * and the food is optional — someone who has not decided yet orders at the
 * table as they always have.
 *
 * Nothing is held until the last step. The table is reserved for the window,
 * not occupied, so walk-ins can still use it beforehand; it is only taken for
 * real when the party checks in.
 */

const STEPS = ['When', 'Table', 'Food', 'Confirm'];

/** The next sensible slot: half an hour from now, on a quarter hour. */
const defaultSlot = () =>
  roundToNearestMinutes(addMinutes(new Date(), 30), { nearestTo: 15 });

/** <input type="datetime-local"> wants exactly this shape. */
const toLocalInput = (date) => format(date, "yyyy-MM-dd'T'HH:mm");

const Model = ({ url }) => {
  const gltf = useGLTF(url, true);
  const scene = useMemo(() => gltf.scene.clone(), [gltf.scene]);
  return <primitive object={scene} dispose={null} />;
};

/** The dish, turned around in 3D — the same models the menu uses. */
const ModelDialog = ({ food, onClose }) => (
  <Dialog open={Boolean(food)} onClose={onClose} maxWidth="sm" fullWidth>
    <DialogContent sx={{ p: 0, position: 'relative', height: 420, bgcolor: 'var(--ad-bg-2)' }}>
      <IconButton
        onClick={onClose}
        sx={{ position: 'absolute', top: 8, right: 8, zIndex: 2, bgcolor: 'var(--ad-surface)' }}
        aria-label="Close the 3D view"
      >
        <Close fontSize="small" />
      </IconButton>
      {food && (
        <>
          <Canvas camera={{ position: [0, 0, 3], fov: 45 }}>
            <Suspense fallback={null}>
              <Stage environment="city" intensity={0.5}>
                <Model url={food.modelPath || food.modelUrl} />
              </Stage>
              <OrbitControls enablePan={false} autoRotate autoRotateSpeed={1.2} />
            </Suspense>
          </Canvas>
          <Box sx={{ position: 'absolute', left: 16, bottom: 12 }}>
            <Typography sx={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 18 }}>
              {food.name}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Drag to turn it around
            </Typography>
          </Box>
        </>
      )}
    </DialogContent>
  </Dialog>
);

const CustomerBookTable = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showError } = useMessage();

  const [step, setStep] = useState(0);

  // step 1 — when
  const [slot, setSlot] = useState(toLocalInput(defaultSlot()));
  const [partySize, setPartySize] = useState(2);
  const [name, setName] = useState(user?.name || '');

  // step 2 — table
  const [tables, setTables] = useState(null);
  const [table, setTable] = useState('');

  // step 3 — food
  const [foods, setFoods] = useState(null);
  const [picked, setPicked] = useState({});
  const [preview, setPreview] = useState(null);

  const [saving, setSaving] = useState(false);
  const [booked, setBooked] = useState(null);

  const loadAvailability = useCallback(async () => {
    setTables(null);
    try {
      const response = await getTableAvailability(new Date(slot).toISOString(), partySize);
      setTables(response.data.tables || []);
    } catch (err) {
      showError(err.response?.data?.message || 'Could not check which tables are free.', {
        title: 'No tables loaded',
      });
      setTables([]);
    }
  }, [slot, partySize, showError]);

  useEffect(() => {
    if (step === 1) loadAvailability();
  }, [step, loadAvailability]);

  useEffect(() => {
    if (step !== 2 || foods) return;
    getFoodItems()
      .then((res) => setFoods((res.data.foodItems || []).filter((f) => f.isAvailable)))
      .catch(() => setFoods([]));
  }, [step, foods]);

  const chosen = useMemo(
    () => (foods || []).filter((food) => picked[food._id] > 0),
    [foods, picked]
  );
  const total = chosen.reduce((sum, food) => sum + food.price * picked[food._id], 0);
  // The kitchen cooks side by side, so the wait is the longest dish.
  const prepMinutes = chosen.reduce(
    (longest, food) => Math.max(longest, food.prepTimeMinutes ?? 15),
    0
  );

  const handleConfirm = async () => {
    setSaving(true);
    try {
      const response = await createBooking({
        tableNumber: table,
        partySize,
        scheduledFor: new Date(slot).toISOString(),
        customerName: name.trim() || user?.name || 'Guest',
        preOrderItems: chosen.map((food) => ({ foodId: food._id, quantity: picked[food._id] })),
      });
      setBooked(response.data.booking);
      setStep(3);
    } catch (err) {
      // The slot went while they were choosing. Send them back to the table
      // step with a fresh list rather than leaving a dead button.
      if (err.response?.status === 409) setStep(1);
      showError(err.response?.data?.message || 'Could not make that booking.', { title: 'Not booked' });
    } finally {
      setSaving(false);
    }
  };

  const free = (tables || []).filter((t) => t.isAvailable);

  return (
    <Container maxWidth="md" sx={{ py: { xs: 2, sm: 4 } }}>
      <Button startIcon={<ArrowBack />} onClick={() => navigate('/customer/home')} sx={{ mb: 1 }}>
        The menu
      </Button>

      <Typography className="ad-eyebrow">Booking</Typography>
      <Typography sx={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: { xs: 26, sm: 32 }, mb: 0.5 }}>
        Book a table
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
        Pick your time and table, and choose your food now if you already know what you want.
      </Typography>

      <Stepper activeStep={step} sx={{ mb: 4 }}>
        {STEPS.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* ------------------------------------------------------- 1. when */}
      {step === 0 && (
        <Paper sx={{ p: { xs: 2, sm: 3 }, display: 'grid', gap: 2.5 }}>
          <TextField
            label="Date and time"
            type="datetime-local"
            value={slot}
            onChange={(e) => setSlot(e.target.value)}
            InputLabelProps={{ shrink: true }}
            inputProps={{ min: toLocalInput(new Date()) }}
            fullWidth
          />
          <TextField
            select
            label="How many people?"
            value={partySize}
            onChange={(e) => setPartySize(Number(e.target.value))}
            fullWidth
          >
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <MenuItem key={n} value={n}>
                {n} {n === 1 ? 'person' : 'people'}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Name for the booking"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="So staff know whose table it is"
            fullWidth
          />
          <Button
            variant="contained"
            size="large"
            onClick={() => setStep(1)}
            disabled={!slot || !name.trim()}
          >
            Find a table
          </Button>
        </Paper>
      )}

      {/* ------------------------------------------------------ 2. table */}
      {step === 1 && (
        <Paper sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            {format(new Date(slot), 'EEEE d MMMM, HH:mm')} · {partySize}{' '}
            {partySize === 1 ? 'person' : 'people'}
            {tables ? ` · ${free.length} table${free.length === 1 ? '' : 's'} free` : ''}
          </Typography>

          {tables === null ? (
            <Skeleton height={140} radius="14px" />
          ) : free.length === 0 ? (
            <Alert severity="warning" sx={{ borderRadius: 'var(--ad-radius)' }}>
              Nothing free at that time. Try another time, or a smaller party.
            </Alert>
          ) : (
            <Box
              sx={{
                display: 'grid',
                gap: 1,
                gridTemplateColumns: 'repeat(auto-fill, minmax(104px, 1fr))',
              }}
            >
              {tables.map((t) => {
                const isSelected = table === t.number;
                return (
                  <Box
                    key={t.number}
                    role="button"
                    aria-disabled={!t.isAvailable}
                    tabIndex={t.isAvailable ? 0 : -1}
                    onClick={() => t.isAvailable && setTable(t.number)}
                    onKeyDown={(e) => {
                      if (!t.isAvailable) return;
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setTable(t.number);
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
                      cursor: t.isAvailable ? 'pointer' : 'not-allowed',
                      opacity: t.isAvailable ? 1 : 0.45,
                      '&:hover': t.isAvailable ? { borderColor: 'var(--ad-ember)' } : {},
                    }}
                  >
                    <TableRestaurant
                      sx={{ fontSize: 18, color: isSelected ? 'var(--ad-ember)' : 'text.disabled' }}
                    />
                    <Typography sx={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 14 }}>
                      {t.label || `Table ${t.number}`}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block' }}>
                      {t.isAvailable ? `${t.seats} seats` : t.unavailableReason}
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
          )}

          <Box sx={{ display: 'flex', gap: 1.5, mt: 3 }}>
            <Button onClick={() => setStep(0)}>Back</Button>
            <Button variant="contained" onClick={() => setStep(2)} disabled={!table} sx={{ ml: 'auto' }}>
              {table ? `Take table ${table}` : 'Pick a table'}
            </Button>
          </Box>
        </Paper>
      )}

      {/* ------------------------------------------------------- 3. food */}
      {step === 2 && (
        <Paper sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            Choose your food now and the kitchen will have it ready for you — or skip this and
            order at the table.
          </Typography>

          {foods === null ? (
            <SkeletonCards count={4} height={180} columns="repeat(auto-fill, minmax(190px, 1fr))" />
          ) : (
            <Box
              sx={{
                display: 'grid',
                gap: 1.5,
                gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
              }}
            >
              {foods.map((food) => {
                const quantity = picked[food._id] || 0;
                return (
                  <Card key={food._id} sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ position: 'relative' }}>
                      <CardMedia
                        component="img"
                        height="110"
                        image={food.imageUrl || 'https://via.placeholder.com/300x200?text=Food'}
                        alt={food.name}
                      />
                      {(food.modelPath || food.modelUrl) && (
                        <IconButton
                          size="small"
                          onClick={() => setPreview(food)}
                          aria-label={`View ${food.name} in 3D`}
                          sx={{
                            position: 'absolute',
                            top: 6,
                            right: 6,
                            bgcolor: 'var(--ad-surface)',
                            '&:hover': { bgcolor: 'var(--ad-surface)' },
                          }}
                        >
                          <ViewInAr fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                    <Box sx={{ p: 1.5, display: 'grid', gap: 0.75, flexGrow: 1 }}>
                      <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{food.name}</Typography>
                      <Chip
                        icon={<Schedule sx={{ fontSize: 13 }} />}
                        label={`${food.prepTimeMinutes ?? 15} min`}
                        size="small"
                        sx={{
                          width: 'fit-content',
                          bgcolor: 'var(--ad-saffron-wash)',
                          color: 'var(--ad-warn)',
                          fontWeight: 600,
                          '& .MuiChip-icon': { color: 'inherit' },
                        }}
                      />
                      <Typography sx={{ color: 'var(--ad-ember)', fontWeight: 700 }}>
                        {formatINR(food.price, false)}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 'auto' }}>
                        <IconButton
                          size="small"
                          disabled={!quantity}
                          onClick={() =>
                            setPicked((current) => {
                              const next = { ...current };
                              if (next[food._id] > 1) next[food._id] -= 1;
                              else delete next[food._id];
                              return next;
                            })
                          }
                        >
                          <Remove fontSize="small" />
                        </IconButton>
                        <Typography sx={{ flex: 1, textAlign: 'center', fontWeight: 600 }}>
                          {quantity}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() =>
                            setPicked((current) => ({ ...current, [food._id]: (current[food._id] || 0) + 1 }))
                          }
                        >
                          <Add fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  </Card>
                );
              })}
            </Box>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 3, flexWrap: 'wrap' }}>
            <Button onClick={() => setStep(1)}>Back</Button>
            {chosen.length > 0 && (
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {chosen.reduce((sum, f) => sum + picked[f._id], 0)} items · {formatINR(total, false)} · ready
                in about {prepMinutes} min
              </Typography>
            )}
            <Button
              variant="contained"
              onClick={handleConfirm}
              disabled={saving}
              sx={{ ml: 'auto' }}
            >
              {saving ? (
                <>
                  <span className="ad-spinner" style={{ marginRight: 10 }} aria-hidden="true" />
                  Booking…
                </>
              ) : chosen.length ? (
                'Book with this food'
              ) : (
                'Book without pre-ordering'
              )}
            </Button>
          </Box>
        </Paper>
      )}

      {/* ---------------------------------------------------- 4. confirm */}
      {step === 3 && booked && (
        <Paper sx={{ p: { xs: 2, sm: 4 }, textAlign: 'center' }}>
          <CheckCircle sx={{ fontSize: 46, color: 'var(--ad-basil)', mb: 1 }} />
          <Typography sx={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 24, mb: 0.5 }}>
            Table {booked.tableNumber} is yours
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2.5 }}>
            {format(new Date(booked.scheduledFor), 'EEEE d MMMM, HH:mm')} · {booked.partySize}{' '}
            {booked.partySize === 1 ? 'person' : 'people'}
            {booked.preOrderItems?.length
              ? ` · ${booked.preOrderItems.length} dishes pre-ordered`
              : ' · ordering at the table'}
          </Typography>
          <Alert severity="info" sx={{ textAlign: 'left', mb: 2.5, borderRadius: 'var(--ad-radius)' }}>
            Check in when you arrive and the kitchen starts straight away. Until then the table
            stays open for other guests, so please check in before sitting down.
          </Alert>
          <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button variant="contained" onClick={() => navigate('/customer/bookings')}>
              My bookings
            </Button>
            <Button onClick={() => navigate('/customer/home')}>Browse the menu</Button>
          </Box>
        </Paper>
      )}

      <ModelDialog food={preview} onClose={() => setPreview(null)} />
    </Container>
  );
};

export default CustomerBookTable;
