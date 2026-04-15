import { useState, useCallback } from 'react';

import styles from './IngredientInput.module.css';

interface IngredientInputProps {
  ingredients: string[];
  onChange: (ingredients: string[]) => void;
}

/** Chip-style input for adding/removing ingredients. Enter to add, x to remove. */
export default function IngredientInput({ ingredients, onChange }: IngredientInputProps) {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    const trimmed = inputValue.trim().toLowerCase();
    if (!trimmed || ingredients.includes(trimmed)) return;
    onChange([...ingredients, trimmed]);
    setInputValue('');
  }, [inputValue, ingredients, onChange]);

  const handleRemove = useCallback((ingredient: string) => {
    onChange(ingredients.filter((item) => item !== ingredient));
  }, [ingredients, onChange]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.chipRow}>
        {ingredients.map((ingredient) => (
          <span key={ingredient} className={styles.chip}>
            {ingredient}
            <button
              className={styles.chipRemove}
              onClick={() => handleRemove(ingredient)}
              aria-label={`Remove ${ingredient}`}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <input
        className={styles.input}
        type="text"
        value={inputValue}
        onChange={(event) => setInputValue(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={ingredients.length === 0 ? 'Type an ingredient and press Enter' : 'Add more...'}
      />
    </div>
  );
}
