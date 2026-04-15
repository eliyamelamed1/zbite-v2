import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MessageCircle, Share2, Bookmark } from 'lucide-react';
import { useAuth } from '../../../../features/auth';
import { saveRecipe, unsaveRecipe } from '../../../../features/recipes/api/recipes';
import styles from './ActionBar.module.css';

interface ActionBarProps {
  recipeId: string;
  saved: boolean;
  commentsCount?: number;
  onSaveChange?: (saved: boolean) => void;
}

export default function ActionBar({ recipeId, saved, onSaveChange }: ActionBarProps) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSave = async () => {
    if (!user) return navigate('/login');
    try {
      if (saved) {
        await unsaveRecipe(recipeId);
        onSaveChange?.(false);
      } else {
        await saveRecipe(recipeId);
        onSaveChange?.(true);
      }
    } catch { toast.error('Failed to save recipe'); }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/recipe/${recipeId}`;
    if (navigator.share) {
      await navigator.share({ url }).catch(() => { /* Share API not supported */ });
    } else {
      await navigator.clipboard.writeText(url);
    }
  };

  return (
    <div className={styles.bar}>
      <button className={styles.btn} onClick={() => navigate(`/recipe/${recipeId}`)}>
        <MessageCircle size={20} />
      </button>
      <button className={styles.btn} onClick={handleShare}>
        <Share2 size={20} />
      </button>
      <span className={styles.spacer} />
      <button
        className={`${styles.btn} ${saved ? styles.saved : ''}`}
        onClick={handleSave}
      >
        <Bookmark size={20} fill={saved ? 'currentColor' : 'none'} />
      </button>
    </div>
  );
}
