import { describe, it, expect } from 'vitest';

import { scaleIngredients } from './scale-ingredients';

describe('scaleIngredients', () => {
  it('scales simple numeric amounts', () => {
    const result = scaleIngredients(
      [{ name: 'Spaghetti', amount: '400g' }],
      4,
      8,
    );

    expect(result[0].amount).toBe('800g');
    expect(result[0].originalAmount).toBe('400g');
  });

  it('scales fractions', () => {
    const result = scaleIngredients(
      [{ name: 'Butter', amount: '1/2 cup' }],
      4,
      8,
    );

    expect(result[0].amount).toBe('1 cup');
  });

  it('scales decimal amounts', () => {
    const result = scaleIngredients(
      [{ name: 'Oil', amount: '1.5 tbsp' }],
      4,
      8,
    );

    expect(result[0].amount).toBe('3 tbsp');
  });

  it('scales ranges', () => {
    const result = scaleIngredients(
      [{ name: 'Cloves garlic', amount: '3-4' }],
      4,
      8,
    );

    expect(result[0].amount).toBe('6-8');
  });

  it('leaves unscalable amounts unchanged', () => {
    const result = scaleIngredients(
      [
        { name: 'Salt', amount: 'a pinch' },
        { name: 'Pepper', amount: 'to taste' },
      ],
      4,
      8,
    );

    expect(result[0].amount).toBe('a pinch');
    expect(result[1].amount).toBe('to taste');
  });

  it('returns original amounts when target equals base servings', () => {
    const result = scaleIngredients(
      [{ name: 'Flour', amount: '200g' }],
      4,
      4,
    );

    expect(result[0].amount).toBe('200g');
  });

  it('handles division (scaling down)', () => {
    const result = scaleIngredients(
      [{ name: 'Spaghetti', amount: '400g' }],
      4,
      2,
    );

    expect(result[0].amount).toBe('200g');
  });

  it('handles amounts with no unit', () => {
    const result = scaleIngredients(
      [{ name: 'Eggs', amount: '3' }],
      4,
      8,
    );

    expect(result[0].amount).toBe('6');
  });
});
