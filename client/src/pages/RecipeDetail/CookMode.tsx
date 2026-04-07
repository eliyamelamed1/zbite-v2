import { useState, useEffect } from 'react';
import { imageUrl } from '../../utils/imageUrl';
import { Recipe } from '../../types';
import styles from './CookMode.module.css';

interface CookModeProps {
  recipe: Recipe;
  onExit: () => void;
}

export default function CookMode({ recipe, onExit }: CookModeProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const steps = recipe.steps.sort((a, b) => a.order - b.order);
  const step = steps[currentStep];
  const total = steps.length;

  // Keep screen awake
  useEffect(() => {
    let wakeLock: any = null;
    const requestWake = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await (navigator as any).wakeLock.request('screen');
        }
      } catch (err) { console.error(err); }
    };
    requestWake();
    return () => { wakeLock?.release(); };
  }, []);

  if (!step) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.topBar}>
        <span className={styles.stepIndicator}>Step {currentStep + 1} of {total}</span>
        <button className={styles.exitBtn} onClick={onExit}>Exit Cook Mode</button>
      </div>
      <div className={styles.progressBar}>
        <div className={styles.progressFill} style={{ width: `${((currentStep + 1) / total) * 100}%` }} />
      </div>

      <div className={styles.content}>
        {step.image && (
          <img className={styles.stepImage} src={imageUrl(step.image)} alt={`Step ${currentStep + 1}`} />
        )}

        {step.title && <div className={styles.stepTitle}>{step.title}</div>}

        <div className={styles.stepText}>{step.instruction}</div>

        <div className={styles.tip}>
          <div className={styles.tipLabel}>Kitchen Tip</div>
          <div className={styles.tipText}>
            Take your time with this step. Good cooking is never rushed.
          </div>
        </div>

        <div className={styles.ingredients}>
          {recipe.ingredients.map((ing, i) => (
            <span key={i} className={styles.ingredientChip}>{ing.amount} {ing.name}</span>
          ))}
        </div>
      </div>

      <div className={styles.bottomBar}>
        {currentStep > 0 && (
          <button className={styles.prevBtn} onClick={() => setCurrentStep(currentStep - 1)}>
            Previous
          </button>
        )}
        <button
          className={styles.nextBtn}
          onClick={() => {
            if (currentStep < total - 1) setCurrentStep(currentStep + 1);
            else onExit();
          }}
        >
          {currentStep < total - 1 ? 'Next Step' : 'Finish Cooking'}
        </button>
      </div>
    </div>
  );
}
