import styles from './StepPills.module.css';

interface PillOption {
  label: string;
  value: string | number;
}

interface StepPillsProps {
  options: readonly PillOption[];
  onSelect: (value: string | number) => void;
  columns?: 2 | 3;
}

const DEFAULT_COLUMNS = 2;

/** Reusable pill grid for step-based selection flows. */
export default function StepPills({ options, onSelect, columns = DEFAULT_COLUMNS }: StepPillsProps) {
  return (
    <div
      className={styles.grid}
      style={{ '--pill-columns': columns } as React.CSSProperties}
    >
      {options.map((option) => (
        <button
          key={option.value}
          className={styles.pill}
          onClick={() => onSelect(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
