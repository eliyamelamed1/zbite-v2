import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRecipe, updateRecipe } from '../../features/recipes/api/recipes';
import { useAuth } from '../../features/auth';
import RecipeForm from '../../features/recipes/components/RecipeForm/RecipeForm';
import { Recipe } from '../../types';
import styles from '../Explore/Explore.module.css';

export default function EditRecipe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getRecipe(id)
      .then((res) => {
        if (res.data.recipe.author._id !== user?._id) { navigate('/explore'); return; }
        setRecipe(res.data.recipe);
      })
      .catch(() => navigate('/explore'))
      .finally(() => setLoading(false));
  }, [id, user, navigate]);

  const handleSubmit = async (formData: FormData) => {
    await updateRecipe(id!, formData);
    navigate(`/recipe/${id}`);
  };

  if (loading) return <div className={styles.loading}>Loading...</div>;
  if (!recipe) return null;

  return (
    <div className={styles.page}>
      <h1 className={styles.title} >Edit Recipe</h1>
      <RecipeForm initialData={recipe} onSubmit={handleSubmit} submitLabel="Save Changes" />
    </div>
  );
}
