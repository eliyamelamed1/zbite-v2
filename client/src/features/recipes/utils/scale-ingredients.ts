/**
 * Pure functions for scaling recipe ingredient amounts.
 * Handles formats: "400g", "1/2 cup", "2.5 tbsp", "3-4", "a pinch", "to taste".
 */

interface Ingredient {
  name: string;
  amount: string;
}

interface ScaledIngredient {
  name: string;
  amount: string;
  originalAmount: string;
}

/** Regex to extract a leading number (integer, decimal, or fraction) from an amount string. */
const NUMERIC_PREFIX_PATTERN = /^(\d+\/\d+|\d+\.?\d*)/;

/** Regex to detect a range like "3-4" or "2-3". */
const RANGE_PATTERN = /^(\d+\.?\d*)\s*-\s*(\d+\.?\d*)/;

/** Convert a fraction string like "1/2" to a decimal. */
function fractionToDecimal(fraction: string): number {
  const parts = fraction.split('/');
  if (parts.length !== 2) return Number(fraction);
  return Number(parts[0]) / Number(parts[1]);
}

/** Format a decimal number nicely — avoid ugly floating point results. */
function formatNumber(value: number): string {
  // Common fractions
  const QUARTER = 0.25;
  const THIRD = 1 / 3;
  const HALF = 0.5;
  const TWO_THIRDS = 2 / 3;
  const THREE_QUARTERS = 0.75;
  const TOLERANCE = 0.01;

  const wholePart = Math.floor(value);
  const fractionalPart = value - wholePart;

  if (fractionalPart < TOLERANCE) return String(wholePart);

  const fractionMap: ReadonlyArray<[number, string]> = [
    [QUARTER, '1/4'],
    [THIRD, '1/3'],
    [HALF, '1/2'],
    [TWO_THIRDS, '2/3'],
    [THREE_QUARTERS, '3/4'],
  ];

  for (const [target, display] of fractionMap) {
    if (Math.abs(fractionalPart - target) < TOLERANCE) {
      return wholePart > 0 ? `${wholePart} ${display}` : display;
    }
  }

  // Fall back to rounded decimal
  const rounded = Math.round(value * 100) / 100;
  return String(rounded);
}

/** Scale a single amount string by a ratio. Returns the original if unscalable. */
function scaleAmountString(amount: string, ratio: number): string {
  const trimmed = amount.trim();

  // Handle ranges like "3-4"
  const rangeMatch = trimmed.match(RANGE_PATTERN);
  if (rangeMatch) {
    const low = Number(rangeMatch[1]) * ratio;
    const high = Number(rangeMatch[2]) * ratio;
    const suffix = trimmed.replace(RANGE_PATTERN, '').trim();
    return `${formatNumber(low)}-${formatNumber(high)}${suffix ? ` ${suffix}` : ''}`;
  }

  // Handle numeric prefix like "400g", "1/2 cup", "2.5 tbsp"
  const numericMatch = trimmed.match(NUMERIC_PREFIX_PATTERN);
  if (numericMatch) {
    const numericPart = numericMatch[1];
    const suffix = trimmed.slice(numericPart.length).trim();
    const value = numericPart.includes('/')
      ? fractionToDecimal(numericPart)
      : Number(numericPart);

    if (isNaN(value)) return trimmed;

    const scaled = value * ratio;
    const formatted = formatNumber(scaled);
    return suffix ? `${formatted}${/^[a-zA-Z]/.test(suffix) ? '' : ' '}${suffix}` : formatted;
  }

  // Non-numeric amounts like "a pinch", "to taste" — return unchanged
  return trimmed;
}

/** Scale a list of ingredients by a serving ratio. */
export function scaleIngredients(
  ingredients: readonly Ingredient[],
  baseServings: number,
  targetServings: number,
): ScaledIngredient[] {
  if (baseServings <= 0 || targetServings <= 0) {
    return ingredients.map((ing) => ({ ...ing, originalAmount: ing.amount }));
  }

  if (baseServings === targetServings) {
    return ingredients.map((ing) => ({ ...ing, originalAmount: ing.amount }));
  }

  const ratio = targetServings / baseServings;

  return ingredients.map((ing) => ({
    name: ing.name,
    amount: scaleAmountString(ing.amount, ratio),
    originalAmount: ing.amount,
  }));
}
