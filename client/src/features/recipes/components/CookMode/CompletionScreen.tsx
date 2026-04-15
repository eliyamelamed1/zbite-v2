import { CheckCircle, Flame, Award } from 'lucide-react';

import styles from './CookMode.module.css';

interface CompletionScreenProps {
  currentStreak: number | null;
  newAchievements: string[];
  isGuest: boolean;
  onDone: () => void;
}

const MIN_STREAK_FOR_BADGE = 2;

/** Celebration screen shown after finishing a recipe in Cook Mode. */
export default function CompletionScreen({ currentStreak, newAchievements, isGuest, onDone }: CompletionScreenProps) {
  return (
    <div className={styles.completionScreen}>
      <CheckCircle size={64} className={styles.completionIcon} />
      <h2 className={styles.completionTitle}>Nice. You cooked today.</h2>

      {!isGuest && currentStreak !== null && currentStreak >= MIN_STREAK_FOR_BADGE && (
        <div className={styles.streakBadge}>
          <Flame size={20} />
          <span>Day {currentStreak}</span>
        </div>
      )}

      {newAchievements.length > 0 && (
        <div className={styles.achievementBadge}>
          <Award size={18} />
          <span>New: {newAchievements.join(', ')}</span>
        </div>
      )}

      <div className={styles.completionActions}>
        <button className={styles.doneBtn} onClick={onDone}>Done</button>
      </div>
    </div>
  );
}
