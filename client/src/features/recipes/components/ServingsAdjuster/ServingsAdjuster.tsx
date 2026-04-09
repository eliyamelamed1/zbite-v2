import styles from './ServingsAdjuster.module.css';

interface ServingsAdjusterProps {
  servings: number;
  onChange: (newServings: number) => void;
}

const MIN_SERVINGS = 1;
const MAX_SERVINGS = 24;

/** +/- buttons to adjust serving count on recipe detail. */
export default function ServingsAdjuster({ servings, onChange }: ServingsAdjusterProps) {
  const handleDecrement = () => {
    if (servings > MIN_SERVINGS) onChange(servings - 1);
  };

  const handleIncrement = () => {
    if (servings < MAX_SERVINGS) onChange(servings + 1);
  };

  return (
    <div className={styles.adjuster}>
      <span className={styles.label}>Servings</span>
      <div className={styles.controls}>
        <button
          className={styles.btn}
          onClick={handleDecrement}
          disabled={servings <= MIN_SERVINGS}
          aria-label="Decrease servings"
        >
          −
        </button>
        <span className={styles.count}>{servings}</span>
        <button
          className={styles.btn}
          onClick={handleIncrement}
          disabled={servings >= MAX_SERVINGS}
          aria-label="Increase servings"
        >
          +
        </button>
      </div>
    </div>
  );
}
