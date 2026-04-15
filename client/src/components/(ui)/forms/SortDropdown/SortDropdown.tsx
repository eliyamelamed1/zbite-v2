import { useState, useRef, useCallback } from 'react';

import { useClickOutside } from '../../../../hooks/useClickOutside';
import styles from './SortDropdown.module.css';

export interface SortOption<T extends string = string> {
  key: T;
  label: string;
}

interface SortDropdownProps<T extends string> {
  options: ReadonlyArray<SortOption<T>>;
  selected: T;
  onChange: (key: T) => void;
}

/** Compact dropdown for selecting a sort order. */
export default function SortDropdown<T extends string>({
  options,
  selected,
  onChange,
}: SortDropdownProps<T>): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useClickOutside(containerRef, useCallback(() => setIsOpen(false), []));

  const selectedLabel = options.find((o) => o.key === selected)?.label ?? selected;

  const handleSelect = (key: T) => {
    onChange(key);
    setIsOpen(false);
  };

  return (
    <div className={styles.container} ref={containerRef}>
      <button
        className={styles.trigger}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className={styles.sortIcon}>↕</span>
        <span className={styles.label}>{selectedLabel}</span>
        <span className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}>▾</span>
      </button>

      {isOpen && (
        <ul className={styles.dropdown} role="listbox">
          {options.map((opt) => (
            <li key={opt.key} role="option" aria-selected={opt.key === selected}>
              <button
                className={`${styles.option} ${opt.key === selected ? styles.optionActive : ''}`}
                onClick={() => handleSelect(opt.key)}
              >
                <span>{opt.label}</span>
                {opt.key === selected && <span className={styles.check}>✓</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
