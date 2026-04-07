import CategoryChips from '../../../components/CategoryChips/CategoryChips';
import styles from '../RecipeWizard.module.css';

interface BasicsStepProps {
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  cookingTime: string;
  servings: number;
  category: string;
  onTitleChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  onDifficultyChange: (v: 'easy' | 'medium' | 'hard') => void;
  onCookingTimeChange: (v: string) => void;
  onServingsChange: (v: number) => void;
  onCategoryChange: (v: string) => void;
}

export default function BasicsStep(props: BasicsStepProps): JSX.Element {
  const { title, description, difficulty, cookingTime, servings, category } = props;

  return (
    <>
      <h2 className={styles.stepTitle}>The Basics</h2>
      <p className={styles.stepSubtitle}>Tell us about your creation.</p>
      <div className={styles.field}>
        <label className={styles.label}>What did you make?</label>
        <input className={styles.input} placeholder="e.g. Grandma's Sourdough" value={title} onChange={(e) => props.onTitleChange(e.target.value)} />
      </div>
      <div className={styles.field}>
        <label className={styles.label}>Tell us about it...</label>
        <textarea className={styles.textarea} placeholder="Share the story behind this dish" value={description} onChange={(e) => props.onDescriptionChange(e.target.value)} />
      </div>
      <div className={styles.field}>
        <label className={styles.label}>Difficulty</label>
        <div className={styles.difficultyRow}>
          {(['easy', 'medium', 'hard'] as const).map((d) => (
            <button key={d} className={`${styles.difficultyPill} ${difficulty === d ? styles.difficultyPillActive : ''}`} onClick={() => props.onDifficultyChange(d)}>{d}</button>
          ))}
        </div>
      </div>
      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label}>Cooking time</label>
          <input className={styles.input} type="number" placeholder="Min" value={cookingTime} onChange={(e) => props.onCookingTimeChange(e.target.value)} />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Servings</label>
          <div className={styles.stepper}>
            <button className={styles.stepperBtn} onClick={() => props.onServingsChange(Math.max(1, servings - 1))}>-</button>
            <span className={styles.stepperValue}>{servings}</span>
            <button className={styles.stepperBtn} onClick={() => props.onServingsChange(servings + 1)}>+</button>
          </div>
        </div>
      </div>
      <div className={styles.field}>
        <label className={styles.label}>Category</label>
        <CategoryChips selected={category} onChange={props.onCategoryChange} showAll={false} />
      </div>
    </>
  );
}
