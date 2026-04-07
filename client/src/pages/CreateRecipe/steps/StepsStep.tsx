import ImageUpload from '../../../components/ImageUpload/ImageUpload';
import styles from '../RecipeWizard.module.css';

interface StepData { title: string; instruction: string; imageFile: File | null; }

interface StepsStepProps {
  steps: StepData[];
  onStepsChange: (steps: StepData[]) => void;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  onCaloriesChange: (v: string) => void;
  onProteinChange: (v: string) => void;
  onCarbsChange: (v: string) => void;
  onFatChange: (v: string) => void;
}

export default function StepsStep(props: StepsStepProps): JSX.Element {
  const { steps, onStepsChange, calories, protein, carbs, fat } = props;

  const updateStep = (index: number, field: keyof StepData, value: string | File | null) => {
    const updated = [...steps];
    updated[index] = { ...updated[index], [field]: value };
    onStepsChange(updated);
  };

  return (
    <>
      <h2 className={styles.stepTitle}>Recipe Steps</h2>
      <p className={styles.stepSubtitle}>Describe the preparation process clearly.</p>
      {steps.map((s, i) => (
        <div key={i} className={styles.stepBlock}>
          <div className={styles.stepHeader}>
            <div className={styles.stepHeaderLeft}>
              <span className={styles.stepNum}>{i + 1}</span>
              <input className={`${styles.input} ${styles.stepTitleInput}`} placeholder="Step title" value={s.title} onChange={(e) => updateStep(i, 'title', e.target.value)} />
            </div>
            {steps.length > 1 && <button className={styles.removeBtn} onClick={() => onStepsChange(steps.filter((_, j) => j !== i))}>x</button>}
          </div>
          <textarea className={styles.textarea} placeholder="Describe the cooking process..." value={s.instruction} onChange={(e) => updateStep(i, 'instruction', e.target.value)} />
          <div className={styles.stepImageUpload}>
            <ImageUpload value={s.imageFile} onChange={(file) => updateStep(i, 'imageFile', file)} />
          </div>
        </div>
      ))}
      <button className={styles.addBtn} onClick={() => onStepsChange([...steps, { title: '', instruction: '', imageFile: null }])}>+ Add Step</button>

      <div className={styles.nutritionSection}>
        <h3 className={styles.nutritionHeading}>Nutrition (optional)</h3>
        <div className={styles.row}>
          <div className={styles.field}><input className={styles.input} type="number" placeholder="Calories" value={calories} onChange={(e) => props.onCaloriesChange(e.target.value)} /></div>
          <div className={styles.field}><input className={styles.input} type="number" placeholder="Protein (g)" value={protein} onChange={(e) => props.onProteinChange(e.target.value)} /></div>
        </div>
        <div className={styles.row}>
          <div className={styles.field}><input className={styles.input} type="number" placeholder="Carbs (g)" value={carbs} onChange={(e) => props.onCarbsChange(e.target.value)} /></div>
          <div className={styles.field}><input className={styles.input} type="number" placeholder="Fat (g)" value={fat} onChange={(e) => props.onFatChange(e.target.value)} /></div>
        </div>
      </div>
    </>
  );
}
