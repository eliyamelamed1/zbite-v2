import { useState } from 'react';
import styles from './StarRating.module.css';

interface StarRatingProps {
  value?: number;
  onChange?: (stars: number) => void;
  readOnly?: boolean;
}

export default function StarRating({ value = 0, onChange, readOnly = false }: StarRatingProps) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className={`${styles.wrapper} ${readOnly ? styles.readOnly : ''}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`${styles.star} ${(hovered || value) >= star ? styles.filled : ''}`}
          onClick={() => !readOnly && onChange?.(star)}
          onMouseEnter={() => !readOnly && setHovered(star)}
          onMouseLeave={() => !readOnly && setHovered(0)}
          disabled={readOnly}
        >
          &#9733;
        </button>
      ))}
    </div>
  );
}
