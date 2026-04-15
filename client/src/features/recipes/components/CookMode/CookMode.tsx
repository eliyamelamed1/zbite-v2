import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

import { useAuth } from '../../../auth';
import { recordCook } from '../../../gamification';
import { imageUrl } from '../../../../utils/imageUrl';
import { Recipe } from '../../../../types';
import CompletionScreen from './CompletionScreen';
import styles from './CookMode.module.css';

interface CookModeProps {
  recipe: Recipe;
  onExit: () => void;
}

export default function CookMode({ recipe, onExit }: CookModeProps) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isIngredientsOpen, setIsIngredientsOpen] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [currentStreak, setCurrentStreak] = useState<number | null>(null);
  const [newAchievements, setNewAchievements] = useState<string[]>([]);
  const steps = recipe.steps.sort((a, b) => a.order - b.order);
  const step = steps[currentStep];
  const total = steps.length;

  const handleFinishCooking = async () => {
    setIsFinishing(true);
    if (user) {
      try {
        const result = await recordCook(recipe._id);
        setCurrentStreak(result.streak.currentStreak);
        setNewAchievements(result.newAchievements);
      } catch {
        // Graceful degradation — show completion screen without streak data
      }
    }
    setIsFinishing(false);
    setIsCompleted(true);
  };

  const toggleIngredients = () => setIsIngredientsOpen((prev) => !prev);

  // Keep screen awake
  useEffect(() => {
    let wakeLock: unknown = null;
    const requestWake = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await (navigator as { wakeLock: { request: (type: string) => Promise<unknown> } }).wakeLock.request('screen');
        }
      } catch { /* Wake lock not supported */ }
    };
    requestWake();
    return () => { (wakeLock as { release?: () => void })?.release?.(); };
  }, []);

  if (!step && !isCompleted) return null;

  if (isCompleted) {
    return (
      <div className={styles.overlay}>
        <CompletionScreen
          currentStreak={currentStreak}
          newAchievements={newAchievements}
          isGuest={!user}
          onDone={onExit}
        />
      </div>
    );
  }

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

        <button className={styles.ingredientToggle} onClick={toggleIngredients}>
          {isIngredientsOpen ? 'Hide Ingredients' : 'Show Ingredients'}
          {isIngredientsOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        <div className={`${styles.ingredientDrawer} ${isIngredientsOpen ? styles.ingredientDrawerOpen : ''}`}>
          <div className={styles.ingredientDrawerInner}>
            {recipe.ingredients.map((ing, i) => (
              <span key={i} className={styles.ingredientChip}>{ing.amount} {ing.name}</span>
            ))}
          </div>
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
          disabled={isFinishing}
          onClick={() => {
            if (currentStep < total - 1) setCurrentStep(currentStep + 1);
            else handleFinishCooking();
          }}
        >
          {isFinishing ? 'Finishing...' : currentStep < total - 1 ? 'Next Step' : 'Finish Cooking'}
        </button>
      </div>
    </div>
  );
}
