import { useRef, useState } from 'react';
import { CheckCircle, Flame, Award, Camera } from 'lucide-react';
import toast from 'react-hot-toast';

import api from '../../../../api/axios';
import styles from './CookMode.module.css';

interface CompletionScreenProps {
  recipeId: string;
  currentStreak: number | null;
  newAchievements: string[];
  isGuest: boolean;
  onDone: () => void;
}

const MIN_STREAK_FOR_BADGE = 2;

/** Celebration screen shown after finishing a recipe in Cook Mode. */
export default function CompletionScreen({ recipeId, currentStreak, newAchievements, isGuest, onDone }: CompletionScreenProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleSharePhoto = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      await api.post(`/cooking-reports/${recipeId}/reports`, formData);
      toast.success('Photo shared!');
    } catch {
      toast.error('Could not upload photo');
    }
    setIsUploading(false);
  };

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
        {!isGuest && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelected}
              hidden
            />
            <button
              className={styles.sharePhotoBtn}
              onClick={handleSharePhoto}
              disabled={isUploading}
            >
              <Camera size={18} />
              {isUploading ? 'Uploading...' : 'Share a Photo'}
            </button>
          </>
        )}
        <button className={styles.doneBtn} onClick={onDone}>Done</button>
      </div>
    </div>
  );
}
