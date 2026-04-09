import { useNavigate } from 'react-router-dom';
import { createRecipe } from '../../features/recipes/api/recipes';
import RecipeForm from '../../features/recipes/components/RecipeForm/RecipeForm';
import styles from '../Explore/Explore.module.css';

export default function CreateRecipe() {
  const navigate = useNavigate();

  const handleSubmit = async (formData: FormData) => {
    const res = await createRecipe(formData);
    navigate(`/recipe/${res.data.recipe._id}`);
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title} >Create a Recipe</h1>
      <RecipeForm onSubmit={handleSubmit} />
    </div>
  );
}
