import { useNavigate } from 'react-router-dom';
import { Clock, UtensilsCrossed } from 'lucide-react';
import { imageUrl, handleImageError } from '../../../../utils/imageUrl';
import { getAvatarUrl } from '../../../../utils/getAvatarUrl';
import { timeAgo } from '../../../../utils/timeAgo';
import ActionBar from '../ActionBar/ActionBar';
import { Recipe } from '../../../../types';
import styles from './FeedCard.module.css';

interface FeedCardProps {
  recipe: Recipe;
  saved: boolean;
  onUpdate?: (id: string, updates: Partial<{ saved: boolean }>) => void;
}

export default function FeedCard({ recipe, saved, onUpdate }: FeedCardProps) {
  const navigate = useNavigate();

  return (
    <div className={styles.card}>
      <div className={styles.authorRow}>
        <img
          className={styles.avatar}
          src={getAvatarUrl(recipe.author.avatar, recipe.author.username)}
          alt={recipe.author.username}
          onClick={() => navigate(`/user/${recipe.author._id}`)}
        />
        <div className={styles.authorInfo}>
          <div className={styles.authorName} onClick={() => navigate(`/user/${recipe.author._id}`)}>
            @{recipe.author.username}
          </div>
          <div className={styles.timeAgo}>{timeAgo(recipe.createdAt)}</div>
        </div>
      </div>

      <div className={styles.imageWrapper} onClick={() => navigate(`/recipe/${recipe._id}`)}>
        <img className={styles.image} src={imageUrl(recipe.coverImage)} alt={recipe.title} onError={handleImageError} loading="lazy" />
      </div>

      <div className={styles.body}>
        <ActionBar
          recipeId={recipe._id}
          saved={saved}
          commentsCount={recipe.commentsCount}
          onSaveChange={(newSaved) => onUpdate?.(recipe._id, { saved: newSaved })}
        />
        <div className={styles.title} onClick={() => navigate(`/recipe/${recipe._id}`)}>
          {recipe.title}
        </div>
        <div className={styles.description}>{recipe.description}</div>
        <div className={styles.chips}>
          <span className={styles.chip}><Clock size={12} /> {recipe.cookingTime} min</span>
          <span className={styles.chip}><UtensilsCrossed size={12} /> {recipe.servings} servings</span>
          {recipe.tags?.slice(0, 2).map((tag) => (
            <span key={tag} className={styles.chip}>{tag}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
