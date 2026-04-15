import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { createRecipe } from '../../features/recipes/api/recipes';
import { CONFETTI_CONFIG } from '../../utils/constants';
import { Recipe } from '../../types';
import PhotoStep from '../../features/recipes/components/wizard-steps/PhotoStep';
import BasicsStep from '../../features/recipes/components/wizard-steps/BasicsStep';
import IngredientsStep from '../../features/recipes/components/wizard-steps/IngredientsStep';
import StepsStep from '../../features/recipes/components/wizard-steps/StepsStep';
import SuccessStep from '../../features/recipes/components/wizard-steps/SuccessStep';
import styles from './RecipeWizard.module.css';

interface StepData { title: string; instruction: string; imageFile: File | null; }
interface IngredientData { amount: string; name: string; }

const TOTAL_STEPS = 5;

export default function RecipeWizard(): JSX.Element | null {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [cookingTime, setCookingTime] = useState('');
  const [servings, setServings] = useState(4);
  const [tags, setTags] = useState<string[]>(['Italian']);
  const [ingredients, setIngredients] = useState<IngredientData[]>([{ amount: '', name: '' }]);
  const [recipeSteps, setRecipeSteps] = useState<StepData[]>([{ title: 'The Foundation', instruction: '', imageFile: null }]);
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [publishedRecipe, setPublishedRecipe] = useState<Recipe | null>(null);

  const handlePublish = async () => {
    setError('');
    setLoading(true);
    const formData = new FormData();
    const data = {
      title, description, difficulty, tags,
      cookingTime: Number(cookingTime), servings,
      ingredients: ingredients.filter((i) => i.name.trim() && i.amount.trim()),
      steps: recipeSteps.filter((s) => s.instruction.trim()).map((s, i) => ({ order: i + 1, title: s.title, instruction: s.instruction, image: '' })),
      nutrition: { calories: Number(calories) || 0, protein: Number(protein) || 0, carbs: Number(carbs) || 0, fat: Number(fat) || 0 },
    };
    formData.append('data', JSON.stringify(data));
    if (coverImage) formData.append('coverImage', coverImage);
    const stepImageMap: Record<number, number> = {};
    let fileIdx = 0;
    recipeSteps.filter((s) => s.instruction.trim()).forEach((s, i) => {
      if (s.imageFile) { formData.append('stepImages', s.imageFile); stepImageMap[i] = fileIdx; fileIdx++; }
    });
    formData.append('stepImageMap', JSON.stringify(stepImageMap));
    try {
      const res = await createRecipe(formData);
      setPublishedRecipe(res.data.recipe);
      setStep(5);
      confetti(CONFETTI_CONFIG);
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || 'Failed to publish';
      setError(message);
    } finally { setLoading(false); }
  };

  const handleNext = () => {
    setError('');
    if (step === 1 && !coverImage) { setError('Please add a cover photo'); return; }
    if (step === 2 && !title.trim()) { setError('Title is required'); return; }
    if (step === 3 && !ingredients.some((i) => i.name.trim())) { setError('Add at least one ingredient'); return; }
    if (step === 4) { handlePublish(); return; }
    setStep(step + 1);
  };

  if (step === 5 && publishedRecipe) return <SuccessStep recipe={publishedRecipe} />;

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <button className={styles.closeBtn} onClick={() => navigate(-1)}><X size={18} /></button>
        <span className={styles.logo}>zbite</span>
        <span className={styles.stepLabel}>STEP {step} OF {TOTAL_STEPS - 1}</span>
      </div>
      <div className={styles.content}>
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${(step / (TOTAL_STEPS - 1)) * 100}%` }} />
        </div>
        {error && <div className={styles.error}>{error}</div>}
        {step === 1 && <PhotoStep coverImage={coverImage} onCoverChange={setCoverImage} />}
        {step === 2 && <BasicsStep title={title} description={description} difficulty={difficulty} cookingTime={cookingTime} servings={servings} tags={tags} onTitleChange={setTitle} onDescriptionChange={setDescription} onDifficultyChange={setDifficulty} onCookingTimeChange={setCookingTime} onServingsChange={setServings} onTagsChange={setTags} />}
        {step === 3 && <IngredientsStep ingredients={ingredients} onIngredientsChange={setIngredients} />}
        {step === 4 && <StepsStep steps={recipeSteps} onStepsChange={setRecipeSteps} calories={calories} protein={protein} carbs={carbs} fat={fat} onCaloriesChange={setCalories} onProteinChange={setProtein} onCarbsChange={setCarbs} onFatChange={setFat} />}
      </div>
      {step < 5 && (
        <div className={styles.bottomBar}>
          {step > 1 ? <button className={styles.backBtn} onClick={() => setStep(step - 1)}>← Back</button> : <span />}
          <button className={styles.nextBtn} onClick={handleNext} disabled={loading}>
            {loading ? 'Publishing...' : step === 4 ? 'Next Step' : 'Next'}
          </button>
        </div>
      )}
    </div>
  );
}
