import { useNavigate } from 'react-router-dom';
import { createRecipe } from '../../api/recipes';
import RecipeForm from '../../components/RecipeForm/RecipeForm';
import styles from '../Explore/Explore.module.css';

export default function CreateRecipe() {
  const navigate = useNavigate();

  const handleSubmit = async (formData: FormData) => {
    const res = await createRecipe(formData);
    navigate(`/recipe/${res.data.recipe._id}`);
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title} style={{ marginBottom: 32 }}>Create a Recipe</h1>
      <RecipeForm onSubmit={handleSubmit} />
    </div>
  );
}
