import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth';
import { getRecipe, rateRecipe, getMyRating, deleteRecipe } from '../../features/recipes/api/recipes';
import { getLikeStatus } from '../../features/social/api/likes';
import { getSaveStatus } from '../../features/recipes/api/recipes';
import { getFollowStatus, followUser, unfollowUser } from '../../features/social/api/users';
import { imageUrl } from '../../utils/imageUrl';
import ActionBar from '../../features/recipes/components/ActionBar/ActionBar';
import StarRating from '../../components/(ui)/forms/StarRating/StarRating';
import CommentSection from '../../features/recipes/components/CommentSection/CommentSection';
import NutritionSection from '../../features/recipes/components/NutritionSection/NutritionSection';
import IngredientsSection from '../../features/recipes/components/IngredientsSection/IngredientsSection';
import StepsSection from '../../features/recipes/components/StepsSection/StepsSection';
import CookMode from '../../features/recipes/components/CookMode/CookMode';
import ServingsAdjuster from '../../features/recipes/components/ServingsAdjuster/ServingsAdjuster';
import { scaleIngredients } from '../../features/recipes/utils/scale-ingredients';
import { addRecipeToShoppingList } from '../../features/shopping-list/api/shopping-list';
import { Recipe } from '../../types';
import toast from 'react-hot-toast';
import styles from './RecipeDetail.module.css';

export default function RecipeDetail(): JSX.Element | null {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [myRating, setMyRating] = useState(0);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [cookMode, setCookMode] = useState(false);
  const [targetServings, setTargetServings] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const res = await getRecipe(id);
        setRecipe(res.data.recipe);
        setTargetServings(res.data.recipe.servings);
        if (user) {
          const [ratingRes, likeRes, saveRes] = await Promise.all([
            getMyRating(id).catch(() => ({ data: { rating: 0 } })),
            getLikeStatus(id).catch(() => ({ data: { liked: false } })),
            getSaveStatus(id).catch(() => ({ data: { saved: false } })),
          ]);
          setMyRating(ratingRes.data.rating);
          setLiked(likeRes.data.liked);
          setSaved(saveRes.data.saved);
          if (res.data.recipe.author._id !== user._id) {
            const followRes = await getFollowStatus(res.data.recipe.author._id).catch(() => ({ data: { following: false } }));
            setIsFollowing(followRes.data.following);
          }
        }
      } catch { toast.error('Recipe not found'); navigate('/explore'); }
      finally { setLoading(false); }
    };
    load();
  }, [id, user, navigate]);

  const handleRate = async (stars: number) => {
    if (!user) return navigate('/login');
    const res = await rateRecipe(id!, stars);
    setMyRating(stars);
    setRecipe((prev) => prev ? { ...prev, averageRating: res.data.averageRating, ratingsCount: res.data.ratingsCount } : prev);
  };

  const handleFollow = async () => {
    if (!user || !recipe) return navigate('/login');
    if (isFollowing) { await unfollowUser(recipe.author._id); setIsFollowing(false); }
    else { await followUser(recipe.author._id); setIsFollowing(true); }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this recipe?')) {
      await deleteRecipe(id!);
      navigate('/explore');
    }
  };

  if (loading) return <div className={styles.loading}>Loading recipe...</div>;
  if (!recipe) return null;
  if (cookMode) return <CookMode recipe={recipe} onExit={() => setCookMode(false)} />;

  const isOwner = user && user._id === recipe.author._id;

  return (
    <div className={styles.page}>
      <img className={styles.coverImage} src={imageUrl(recipe.coverImage)} alt={recipe.title} />
      <div className={styles.content}>
        <h1 className={styles.title}>{recipe.title}</h1>
        <div className={styles.badges}>
          <span className={`${styles.badge} ${styles[recipe.difficulty]}`}>{recipe.difficulty}</span>
          <span className={styles.metaChip}>⏱ {recipe.cookingTime} min</span>
          <span className={styles.metaChip}>★ {recipe.averageRating > 0 ? recipe.averageRating : '—'}</span>
        </div>
        <div className={styles.authorRow}>
          <img className={styles.authorAvatar} src={imageUrl(recipe.author.avatar) || `https://ui-avatars.com/api/?name=${recipe.author.username}&background=F0E0D0&color=2D1810`} alt={recipe.author.username} onClick={() => navigate(`/user/${recipe.author._id}`)} />
          <div><div className={styles.authorName} onClick={() => navigate(`/user/${recipe.author._id}`)}>@{recipe.author.username}</div></div>
          {user && !isOwner && <button className={isFollowing ? styles.unfollowBtn : styles.followBtn} onClick={handleFollow}>{isFollowing ? 'Following' : 'Follow'}</button>}
        </div>
        <ActionBar recipeId={recipe._id} liked={liked} likesCount={recipe.likesCount} saved={saved} commentsCount={recipe.commentsCount}
          onLikeChange={(l, c) => { setLiked(l); setRecipe((p) => p ? { ...p, likesCount: c } : p); }}
          onSaveChange={(s) => setSaved(s)} />
        {(myRating > 0 || user) && (
          <div className={styles.rateSection}>
            <span className={styles.rateLabel}>{myRating > 0 ? `How was your ${recipe.title}?` : 'Rate this recipe'}</span>
            <StarRating value={myRating} onChange={handleRate} />
          </div>
        )}
        <NutritionSection nutrition={recipe.nutrition} />
        <ServingsAdjuster servings={targetServings} onChange={setTargetServings} />
        <IngredientsSection
          ingredients={scaleIngredients(recipe.ingredients, recipe.servings, targetServings)}
        />
        {user && (
          <button
            className={styles.shoppingListBtn}
            onClick={async () => {
              try {
                await addRecipeToShoppingList(recipe._id);
                toast.success('Added to shopping list!');
              } catch {
                toast.error('Failed to add to shopping list');
              }
            }}
          >
            🛒 Add to Shopping List
          </button>
        )}
        <StepsSection steps={recipe.steps} />
        <CommentSection recipeId={recipe._id} />
        {isOwner && (
          <div className={styles.ownerActions}>
            <button className={styles.editBtn} onClick={() => navigate(`/recipe/${id}/edit`)}>Edit Recipe</button>
            <button className={styles.deleteBtn} onClick={handleDelete}>Delete Recipe</button>
          </div>
        )}
      </div>
      <div className={styles.cookModeBar}>
        <button className={styles.cookModeBtn} onClick={() => setCookMode(true)}>👨‍🍳 Start Cooking</button>
      </div>
    </div>
  );
}
