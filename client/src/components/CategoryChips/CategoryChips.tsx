import { CATEGORIES } from '../../types';
import styles from './CategoryChips.module.css';

interface CategoryChipsProps {
  selected: string;
  onChange: (category: string) => void;
  showAll?: boolean;
}

export default function CategoryChips({ selected, onChange, showAll = true }: CategoryChipsProps) {
  return (
    <div className={styles.wrapper}>
      {showAll && (
        <button
          className={`${styles.chip} ${selected === 'All' ? styles.chipActive : ''}`}
          onClick={() => onChange('All')}
        >
          All
        </button>
      )}
      {CATEGORIES.map((cat) => (
        <button
          key={cat}
          className={`${styles.chip} ${selected === cat ? styles.chipActive : ''}`}
          onClick={() => onChange(cat)}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
