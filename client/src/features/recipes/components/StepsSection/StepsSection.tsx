import { imageUrl } from '../../../../utils/imageUrl';
import { Recipe } from '../../../../types';
import styles from '../../../../pages/RecipeDetail/RecipeDetail.module.css';

interface StepsSectionProps {
  steps: Recipe['steps'];
}

export default function StepsSection({ steps }: StepsSectionProps): JSX.Element {
  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>Preparation</h2>
      {[...steps].sort((a, b) => a.order - b.order).map((step) => (
        <div key={step.order} className={styles.step}>
          <div className={styles.stepNumber}>{step.order}</div>
          <div className={styles.stepContent}>
            <div className={styles.stepText}>{step.instruction}</div>
            {step.image && <img className={styles.stepImage} src={imageUrl(step.image)} alt={`Step ${step.order}`} />}
          </div>
        </div>
      ))}
    </div>
  );
}
