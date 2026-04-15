import { ALL_TAGS } from '../../../../types';
import styles from './CategoryChips.module.css';

interface SingleSelectProps {
  multi?: false;
  selected: string;
  onChange: (tag: string) => void;
}

interface MultiSelectProps {
  multi: true;
  selected: string[];
  onChange: (tags: string[]) => void;
  maxSelections?: number;
}

type TagChipsProps = (SingleSelectProps | MultiSelectProps) & {
  tags?: readonly string[];
  showAll?: boolean;
};

const DEFAULT_MAX_SELECTIONS = 5;

/** Horizontally scrollable tag chip selector. Supports single-select (filter) and multi-select (creation) modes. */
export default function TagChips(props: TagChipsProps) {
  const { showAll = true, tags = ALL_TAGS } = props;

  const isActive = (tag: string): boolean => {
    if (props.multi) return props.selected.includes(tag);
    return props.selected === tag;
  };

  const handleClick = (tag: string): void => {
    if (props.multi) {
      const max = props.maxSelections ?? DEFAULT_MAX_SELECTIONS;
      const current = props.selected;
      if (current.includes(tag)) {
        props.onChange(current.filter((t) => t !== tag));
      } else if (current.length < max) {
        props.onChange([...current, tag]);
      }
    } else {
      props.onChange(tag);
    }
  };

  return (
    <div className={styles.wrapper}>
      {showAll && !props.multi && (
        <button
          className={`${styles.chip} ${props.selected === 'All' ? styles.chipActive : ''}`}
          onClick={() => (props as SingleSelectProps).onChange('All')}
        >
          All
        </button>
      )}
      {tags.map((tag) => (
        <button
          key={tag}
          className={`${styles.chip} ${isActive(tag) ? styles.chipActive : ''}`}
          onClick={() => handleClick(tag)}
        >
          {tag}
        </button>
      ))}
    </div>
  );
}
