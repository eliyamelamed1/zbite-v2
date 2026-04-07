import { useState, FormEvent } from 'react';
import ImageUpload from '../ImageUpload/ImageUpload';
import { Recipe } from '../../types';
import styles from './RecipeForm.module.css';

interface StepData {
  instruction: string;
  imageFile: File | null;
  existingImage: string;
}

interface Props {
  initialData?: Recipe;
  onSubmit: (formData: FormData) => Promise<void>;
  submitLabel?: string;
}

export default function RecipeForm({ initialData, onSubmit, submitLabel = 'Publish Recipe' }: Props) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>(initialData?.difficulty || 'easy');
  const [cookingTime, setCookingTime] = useState(initialData?.cookingTime?.toString() || '');
  const [servings, setServings] = useState(initialData?.servings?.toString() || '');
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [existingCover] = useState(initialData?.coverImage || '');
  const [ingredients, setIngredients] = useState(
    initialData?.ingredients?.length ? initialData.ingredients.map((i) => ({ ...i })) : [{ amount: '', name: '' }]
  );
  const [steps, setSteps] = useState<StepData[]>(
    initialData?.steps?.length
      ? initialData.steps.map((s) => ({ instruction: s.instruction, imageFile: null, existingImage: s.image || '' }))
      : [{ instruction: '', imageFile: null, existingImage: '' }]
  );
  const [calories, setCalories] = useState(initialData?.nutrition?.calories?.toString() || '');
  const [protein, setProtein] = useState(initialData?.nutrition?.protein?.toString() || '');
  const [carbs, setCarbs] = useState(initialData?.nutrition?.carbs?.toString() || '');
  const [fat, setFat] = useState(initialData?.nutrition?.fat?.toString() || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const updateIngredient = (index: number, field: 'amount' | 'name', value: string) => {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value };
    setIngredients(updated);
  };

  const updateStep = (index: number, field: keyof StepData, value: string | File | null) => {
    const updated = [...steps];
    updated[index] = { ...updated[index], [field]: value };
    setSteps(updated);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!coverImage && !existingCover) { setError('Cover image is required'); return; }

    const validIngredients = ingredients.filter((i) => i.name.trim() && i.amount.trim());
    if (validIngredients.length === 0) { setError('At least one ingredient is required'); return; }

    const validSteps = steps.filter((s) => s.instruction.trim());
    if (validSteps.length === 0) { setError('At least one step is required'); return; }

    setLoading(true);

    const formData = new FormData();
    const data = {
      title, description, difficulty,
      cookingTime: Number(cookingTime),
      servings: Number(servings),
      ingredients: validIngredients,
      steps: validSteps.map((s, i) => ({ order: i + 1, instruction: s.instruction, image: s.existingImage || '' })),
      nutrition: { calories: Number(calories) || 0, protein: Number(protein) || 0, carbs: Number(carbs) || 0, fat: Number(fat) || 0 },
    };

    formData.append('data', JSON.stringify(data));
    if (coverImage) formData.append('coverImage', coverImage);

    const stepImageMap: Record<number, number> = {};
    let fileIndex = 0;
    validSteps.forEach((step, i) => {
      if (step.imageFile) {
        formData.append('stepImages', step.imageFile);
        stepImageMap[i] = fileIndex;
        fileIndex++;
      }
    });
    formData.append('stepImageMap', JSON.stringify(stepImageMap));

    try {
      await onSubmit(formData);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Something went wrong');
      setLoading(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Basic Info</h3>
        <div className={styles.field}>
          <label className={styles.label}>Title</label>
          <input className={styles.input} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} required />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Description</label>
          <textarea className={styles.textarea} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} required />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Difficulty</label>
          <div className={styles.difficultyOptions}>
            {(['easy', 'medium', 'hard'] as const).map((d) => (
              <button key={d} type="button" className={`${styles.difficultyOption} ${difficulty === d ? styles.difficultyActive : ''}`} onClick={() => setDifficulty(d)}>
                {d}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label}>Cooking Time (minutes)</label>
            <input className={styles.input} type="number" min="1" value={cookingTime} onChange={(e) => setCookingTime(e.target.value)} required />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Servings</label>
            <input className={styles.input} type="number" min="1" value={servings} onChange={(e) => setServings(e.target.value)} required />
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Cover Image</h3>
        <ImageUpload value={coverImage} onChange={setCoverImage} existingUrl={existingCover} />
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Ingredients</h3>
        {ingredients.map((ing, i) => (
          <div key={i} className={styles.ingredientRow}>
            <input className={`${styles.input} ${styles.ingredientAmount}`} placeholder="Amount (e.g. 2 cups)" value={ing.amount} onChange={(e) => updateIngredient(i, 'amount', e.target.value)} />
            <input className={`${styles.input} ${styles.ingredientName}`} placeholder="Ingredient name" value={ing.name} onChange={(e) => updateIngredient(i, 'name', e.target.value)} />
            {ingredients.length > 1 && (
              <button type="button" className={styles.removeBtn} onClick={() => setIngredients(ingredients.filter((_, j) => j !== i))}>&times;</button>
            )}
          </div>
        ))}
        <button type="button" className={styles.addBtn} onClick={() => setIngredients([...ingredients, { amount: '', name: '' }])}>+ Add Ingredient</button>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Instructions</h3>
        {steps.map((step, i) => (
          <div key={i} className={styles.stepBlock}>
            <div className={styles.stepHeader}>
              <span className={styles.stepLabel}>Step {i + 1}</span>
              {steps.length > 1 && <button type="button" className={styles.removeBtn} onClick={() => setSteps(steps.filter((_, j) => j !== i))}>&times;</button>}
            </div>
            <textarea className={styles.textarea} placeholder="Describe this step..." value={step.instruction} onChange={(e) => updateStep(i, 'instruction', e.target.value)} />
            <div style={{ marginTop: 8 }}>
              <ImageUpload value={step.imageFile} onChange={(file) => updateStep(i, 'imageFile', file)} existingUrl={step.existingImage} />
            </div>
          </div>
        ))}
        <button type="button" className={styles.addBtn} onClick={() => setSteps([...steps, { instruction: '', imageFile: null, existingImage: '' }])}>+ Add Step</button>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Nutrition Info</h3>
        <div className={styles.row}>
          <div className={styles.field}><label className={styles.label}>Calories</label><input className={styles.input} type="number" min="0" value={calories} onChange={(e) => setCalories(e.target.value)} /></div>
          <div className={styles.field}><label className={styles.label}>Protein (g)</label><input className={styles.input} type="number" min="0" value={protein} onChange={(e) => setProtein(e.target.value)} /></div>
        </div>
        <div className={styles.row}>
          <div className={styles.field}><label className={styles.label}>Carbs (g)</label><input className={styles.input} type="number" min="0" value={carbs} onChange={(e) => setCarbs(e.target.value)} /></div>
          <div className={styles.field}><label className={styles.label}>Fat (g)</label><input className={styles.input} type="number" min="0" value={fat} onChange={(e) => setFat(e.target.value)} /></div>
        </div>
      </div>

      <button className={styles.submitBtn} type="submit" disabled={loading}>{loading ? 'Saving...' : submitLabel}</button>
    </form>
  );
}
