import styles from '../../../../pages/CreateRecipe/RecipeWizard.module.css';

interface IngredientData { amount: string; name: string; }

interface IngredientsStepProps {
  ingredients: IngredientData[];
  onIngredientsChange: (ingredients: IngredientData[]) => void;
}

export default function IngredientsStep({ ingredients, onIngredientsChange }: IngredientsStepProps): JSX.Element {
  const updateIngredient = (index: number, field: 'amount' | 'name', value: string) => {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value };
    onIngredientsChange(updated);
  };

  return (
    <>
      <h2 className={styles.stepTitle}>Ingredients</h2>
      <p className={styles.stepSubtitle}>Specify the heart of your recipe.</p>
      {ingredients.map((ing, i) => (
        <div key={i} className={styles.ingredientRow}>
          <input className={styles.input} placeholder="Amount" value={ing.amount} onChange={(e) => updateIngredient(i, 'amount', e.target.value)} />
          <input className={styles.input} placeholder="Ingredient" value={ing.name} onChange={(e) => updateIngredient(i, 'name', e.target.value)} />
          {ingredients.length > 1 && <button className={styles.removeBtn} onClick={() => onIngredientsChange(ingredients.filter((_, j) => j !== i))}>x</button>}
        </div>
      ))}
      <button className={styles.addBtn} onClick={() => onIngredientsChange([...ingredients, { amount: '', name: '' }])}>+ Add Ingredient</button>
      <div className={styles.tipBox}>
        <div className={styles.tipLabel}>Chef's Secret</div>
        <div className={styles.tipText}>Specify exact quantities for best results. Your future self will thank you.</div>
      </div>
    </>
  );
}
