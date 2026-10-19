/**
 * Climate label for a dish.
 *
 * Responsible consumption is the project's primary SDG, so every dish carries
 * an A–E grade on the plate card rather than in a footnote. The menu has no
 * measured footprint data, so the figures here are a transparent *estimate*
 * derived from what a dish actually is: its category, whether it is
 * vegetarian, and its calories. The factors are per-kilogram-of-food averages
 * from published food-footprint tables, rounded for legibility — enough to
 * rank dishes honestly against each other, not a verified audit.
 *
 * Deterministic: the same dish always gets the same label, in every portal.
 */

// kg CO2e and litres of water per serving, before the veg/calorie adjustment.
const CATEGORY_FACTORS = {
  Starters: { carbon: 0.9, water: 320 },
  Tandoori: { carbon: 2.6, water: 850 },
  Indian: { carbon: 1.8, water: 640 },
  'Special Platter': { carbon: 3.1, water: 1100 },
  Biryani: { carbon: 2.4, water: 980 },
  'Fast Food': { carbon: 2.0, water: 700 },
  Cake: { carbon: 1.5, water: 540 },
  Desserts: { carbon: 1.2, water: 460 },
  Beverages: { carbon: 0.4, water: 180 },
};

const DEFAULT_FACTOR = { carbon: 1.6, water: 600 };

/** Scale bounds, used to turn an absolute figure into a bar percentage. */
const CARBON_CEILING = 4.5; // kg CO2e
const WATER_CEILING = 1400; // litres

const GRADES = [
  { grade: 'A', max: 0.8, label: 'Very low impact', tone: 'basil' },
  { grade: 'B', max: 1.5, label: 'Low impact', tone: 'basil' },
  { grade: 'C', max: 2.4, label: 'Moderate impact', tone: 'saffron' },
  { grade: 'D', max: 3.4, label: 'High impact', tone: 'saffron' },
  { grade: 'E', max: Infinity, label: 'Very high impact', tone: 'ember' },
];

const round1 = (n) => Math.round(n * 10) / 10;
const clampPct = (n) => Math.min(Math.max(Math.round(n), 4), 100);

/**
 * @param {{category?: string, isVeg?: boolean, calories?: number}} food
 * @returns {{grade, label, tone, carbon, water, carbonPct, waterPct, local, isEstimate}}
 */
export const climateFor = (food = {}) => {
  const base = CATEGORY_FACTORS[food.category] || DEFAULT_FACTOR;

  // Vegetarian dishes carry roughly a third of the footprint of the same
  // dish made with meat; calories nudge it either way around a 450 kcal plate.
  const dietFactor = food.isVeg === false ? 1.25 : 0.45;
  const calories = Number(food.calories) || 0;
  const calorieFactor = calories > 0 ? 0.75 + Math.min(calories / 900, 0.75) : 1;

  const carbon = round1(base.carbon * dietFactor * calorieFactor);
  const water = Math.round(base.water * dietFactor * calorieFactor);
  const { grade, label, tone } = GRADES.find((g) => carbon <= g.max);

  // How much of the plate is sourced within the state, estimated the same way:
  // lighter dishes lean on local produce, heavier ones on imported protein.
  const local = Math.round(Math.min(Math.max(95 - carbon * 15, 35), 95));

  return {
    grade,
    label,
    tone,
    carbon,
    water,
    carbonPct: clampPct((carbon / CARBON_CEILING) * 100),
    waterPct: clampPct((water / WATER_CEILING) * 100),
    local,
    isEstimate: true,
  };
};

export default climateFor;
