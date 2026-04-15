import SortDropdown from '../../../../components/(ui)/forms/SortDropdown/SortDropdown';
import TagChips from '../../../../components/(ui)/forms/CategoryChips/CategoryChips';
import styles from './FilterBar.module.css';

import type { SortOption } from '../../../../components/(ui)/forms/SortDropdown/SortDropdown';

export type FeedSortKey = 'following' | 'trending' | 'recent' | 'topRated' | 'quick';

const SORT_OPTIONS: ReadonlyArray<SortOption<FeedSortKey>> = [
  { key: 'following', label: 'Following' },
  { key: 'trending', label: 'Trending' },
  { key: 'recent', label: 'Recent' },
  { key: 'topRated', label: 'Top Rated' },
  { key: 'quick', label: 'Quick (<30min)' },
];

interface FilterBarProps {
  sort: FeedSortKey;
  tag: string;
  onSortChange: (sort: FeedSortKey) => void;
  onTagChange: (tag: string) => void;
}

/** Single-row filter bar combining a sort dropdown and horizontally-scrollable tag chips. */
export default function FilterBar({
  sort,
  tag,
  onSortChange,
  onTagChange,
}: FilterBarProps): JSX.Element {
  return (
    <div className={styles.bar}>
      <SortDropdown options={SORT_OPTIONS} selected={sort} onChange={onSortChange} />
      <div className={styles.separator} />
      <div className={styles.chips}>
        <TagChips selected={tag} onChange={onTagChange} />
      </div>
    </div>
  );
}
