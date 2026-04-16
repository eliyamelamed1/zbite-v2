import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, ShoppingCart, ChefHat } from 'lucide-react';
import { useAuth } from '../../features/auth';
import { getRecipe, getRelatedRecipes, deleteRecipe } from '../../features/recipes/api/recipes';
import { getSaveStatus } from '../../features/recipes/api/recipes';
import { getFollowStatus, followUser, unfollowUser } from '../../features/social/api/users';
import { imageUrl, handleImageError } from '../../utils/imageUrl';
import { getAvatarUrl } from '../../utils/getAvatarUrl';
import ActionBar from '../../features/recipes/components/ActionBar/ActionBar';
import CommentSection from '../../features/recipes/components/CommentSection/CommentSection';
import NutritionSection from '../../features/recipes/components/NutritionSection/NutritionSection';
import IngredientsSection from '../../features/recipes/components/IngredientsSection/IngredientsSection';
import StepsSection from '../../features/recipes/components/StepsSection/StepsSection';
import CookMode from '../../features/recipes/components/CookMode/CookMode';
import ServingsAdjuster from '../../features/recipes/components/ServingsAdjuster/ServingsAdjuster';
import { scaleIngredients } from '../../features/recipes/utils/scale-ingredients';
import { addRecipeToShoppingList } from '../../features/shopping-list/api/shopping-list';
import { recordCook } from '../../features/gamification';
import { Recipe } from '../../types';
import SEO from '../../components/(ui)/seo/SEO/SEO';
import { buildRecipeJsonLd, buildBreadcrumbJsonLd } from './RecipeDetail.utils';
import toast from 'react-hot-toast';
import styles from './RecipeDetail.module.css';

export default function RecipeDetail(): JSX.Element | null {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [saved, setSaved] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [cookMode, setCookMode] = useState(false);
  const [targetServings, setTargetServings] = useState(0);
  const [relatedRecipes, setRelatedRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const res = await getRecipe(id);
        setRecipe(res.data.recipe);
        setTargetServings(res.data.recipe.servings);
        getRelatedRecipes(id).then((r) => setRelatedRecipes(r.data.data)).catch(() => { /* Non-critical */ });
        if (user) {
          const saveRes = await getSaveStatus(id).catch(() => ({ data: { saved: false } }));
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
      <SEO title={recipe.title} description={recipe.description} image={imageUrl(recipe.coverImage)} type="article" jsonLd={[buildRecipeJsonLd(recipe), buildBreadcrumbJsonLd(recipe)]} />
      <img className={styles.coverImage} src={imageUrl(recipe.coverImage)} alt={recipe.title} onError={handleImageError} />
      <div className={styles.content}>
        <button className={styles.backBtn} onClick={() => navigate(-1)} aria-label="Go back"><ArrowLeft size={18} /></button>
        <h1 className={styles.title}>{recipe.title}</h1>
        <div className={styles.badges}>
          <span className={`${styles.badge} ${styles[recipe.difficulty]}`}>{recipe.difficulty}</span>
          <span className={styles.metaChip}><Clock size={14} /> {recipe.cookingTime} min</span>
        </div>
        {recipe.tags.length > 0 && (
          <div className={styles.tagsRow}>
            {recipe.tags.map((tag) => (
              <span key={tag} className={styles.tagChip}>{tag}</span>
            ))}
          </div>
        )}
        <div className={styles.authorRow}>
          <img className={styles.authorAvatar} src={getAvatarUrl(recipe.author.avatar, recipe.author.username)} alt={recipe.author.username} onClick={() => navigate(`/user/${recipe.author._id}`)} />
          <div><div className={styles.authorName} onClick={() => navigate(`/user/${recipe.author._id}`)}>@{recipe.author.username}</div></div>
          {user && !isOwner && <button className={isFollowing ? styles.unfollowBtn : styles.followBtn} onClick={handleFollow}>{isFollowing ? 'Following' : 'Follow'}</button>}
        </div>
        <ActionBar recipeId={recipe._id} saved={saved} commentsCount={recipe.commentsCount}
          onSaveChange={(s) => setSaved(s)} />
        {recipe.description && (
          <p className={styles.description}>{recipe.description}</p>
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
            <ShoppingCart size={16} /> Add to Shopping List
          </button>
        )}
        <StepsSection steps={recipe.steps} />
        {user && (
          <button
            className={styles.shoppingListBtn}
            onClick={async () => {
              try {
                await recordCook(recipe._id);
                toast.success('Nice! Cooking streak updated');
              } catch {
                toast.error('Could not record cook');
              }
            }}
          >
            I Cooked This
          </button>
        )}
        <CommentSection recipeId={recipe._id} />
        {isOwner && (
          <div className={styles.ownerActions}>
            <button className={styles.editBtn} onClick={() => navigate(`/recipe/${id}/edit`)}>Edit Recipe</button>
            <button className={styles.deleteBtn} onClick={handleDelete}>Delete Recipe</button>
          </div>
        )}
      </div>
      {relatedRecipes.length > 0 && (
        <div className={styles.relatedSection}>
          <h2 className={styles.relatedTitle}>You Might Also Like</h2>
          <div className={styles.relatedScroll}>
            {relatedRecipes.map((r) => (
              <div key={r._id} className={styles.relatedCard} onClick={() => navigate(`/recipe/${r._id}`)}>
                <img src={imageUrl(r.coverImage)} alt={r.title} onError={handleImageError} loading="lazy" />
                <div className={styles.relatedCardBody}>
                  <span className={styles.relatedCardTitle}>{r.title}</span>
                  <span className={styles.relatedCardMeta}><Clock size={12} /> {r.cookingTime} min</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className={styles.cookModeBar}>
        <button className={styles.cookModeBtn} onClick={() => setCookMode(true)}><ChefHat size={18} /> Start Cooking</button>
      </div>
    </div>
  );
}
