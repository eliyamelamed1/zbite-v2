import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, ClipboardList } from 'lucide-react';

import StepPills from './components/StepPills/StepPills';
import IngredientInput from './components/IngredientInput/IngredientInput';
import { TIME_OPTIONS, CATEGORY_OPTIONS, PREFERENCE_OPTIONS } from '../../utils/constants';
import SEO from '../../components/(ui)/seo/SEO/SEO';
import styles from './Choose.module.css';

type Mode = 'fork' | 'pick' | 'pantry';

const STEP_TIME = 1;
const STEP_CATEGORY = 2;
const STEP_PREFERENCE = 3;
const TOTAL_PICK_STEPS = 3;

/** Parse a time option value string into minTime/maxTime params. */
function parseTimeValue(value: string): { minTime?: number; maxTime?: number } {
  if (value === '0-15') return { maxTime: 15 };
  if (value === '15-30') return { minTime: 15, maxTime: 30 };
  if (value === '30-60') return { minTime: 30, maxTime: 60 };
  if (value === '60-max') return { minTime: 60 };
  return {};
}

/** Recipe decider — mode fork with "Help Me Decide" and "Use What I Have" paths. */
export default function Choose() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('fork');
  const [step, setStep] = useState(STEP_TIME);
  const [timeValue, setTimeValue] = useState('');
  const [category, setCategory] = useState('');
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [pantryTime, setPantryTime] = useState('');

  const handleTimeSelect = useCallback((value: string | number) => {
    setTimeValue(String(value));
    setStep(STEP_CATEGORY);
  }, []);

  const handleCategorySelect = useCallback((value: string | number) => {
    setCategory(String(value));
    setStep(STEP_PREFERENCE);
  }, []);

  const navigateToPickResults = useCallback((preference?: string) => {
    const params = new URLSearchParams({ mode: 'pick', category });
    const { minTime, maxTime } = parseTimeValue(timeValue);
    if (minTime) params.set('minTime', String(minTime));
    if (maxTime) params.set('maxTime', String(maxTime));
    if (preference) params.set('preference', preference);
    navigate(`/results?${params}`);
  }, [navigate, category, timeValue]);

  const handlePreferenceSelect = useCallback((value: string | number) => {
    navigateToPickResults(String(value));
  }, [navigateToPickResults]);

  const handleSkipPreference = useCallback(() => {
    navigateToPickResults();
  }, [navigateToPickResults]);

  const handlePantrySubmit = useCallback(() => {
    if (ingredients.length === 0) return;
    const params = new URLSearchParams({ mode: 'pantry', ingredients: ingredients.join(',') });
    if (pantryTime) {
      const { maxTime } = parseTimeValue(pantryTime);
      if (maxTime) params.set('maxTime', String(maxTime));
    }
    navigate(`/results?${params}`);
  }, [navigate, ingredients, pantryTime]);

  const handleBack = useCallback(() => {
    if (mode === 'pick' && step > STEP_TIME) {
      setStep(step - 1);
      return;
    }
    setMode('fork');
    setStep(STEP_TIME);
    setTimeValue('');
    setCategory('');
  }, [mode, step]);

  /* ---- Mode Fork ---- */
  if (mode === 'fork') {
    return (
      <div className={styles.page}>
        <div className={styles.stepContent}>
          <h1 className={styles.heading}>What should I cook?</h1>
          <p className={styles.subheading}>Pick a path to find your next meal.</p>
          <div className={styles.forkButtons}>
            <button className={styles.forkPrimary} onClick={() => setMode('pick')}>
              <span className={styles.forkIcon}><Compass size={24} /></span>
              <div className={styles.forkText}>
                <span className={styles.forkLabel}>Help Me Decide</span>
                <span className={styles.forkDesc}>3 quick taps, zero typing</span>
              </div>
            </button>
            <button className={styles.forkOutline} onClick={() => setMode('pantry')}>
              <span className={styles.forkIcon}><ClipboardList size={24} /></span>
              <div className={styles.forkText}>
                <span className={styles.forkLabel}>Use What I Have</span>
                <span className={styles.forkDesc}>Type your ingredients, get matches</span>
              </div>
            </button>
          </div>
          <p className={styles.footnote}>Takes less than 30 seconds</p>
        </div>
      </div>
    );
  }

  /* ---- Path B: Pantry (ingredient input) ---- */
  if (mode === 'pantry') {
    return (
      <div className={styles.page}>
        <div className={styles.stepContent}>
          <h1 className={styles.heading}>What's in your kitchen?</h1>
          <p className={styles.subheading}>Type ingredients and press Enter to add them.</p>
          <IngredientInput ingredients={ingredients} onChange={setIngredients} />
          <div className={styles.pantryTimeSection}>
            <p className={styles.pantryTimeLabel}>Got a time limit?</p>
            <div className={styles.pantryTimeRow}>
              {TIME_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  className={`${styles.miniPill} ${pantryTime === option.value ? styles.miniPillActive : ''}`}
                  onClick={() => setPantryTime(pantryTime === option.value ? '' : option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <button
            className={styles.findBtn}
            onClick={handlePantrySubmit}
            disabled={ingredients.length === 0}
          >
            Find Recipes
          </button>
          <button className={styles.backBtn} onClick={handleBack}>
            Back
          </button>
        </div>
      </div>
    );
  }

  /* ---- Path A: Pick (3-step flow) ---- */
  return (
    <div className={styles.page}>
      <SEO title="Pick Your Mood" description="Choose a category, cuisine, and time to find your perfect recipe." />
      <div className={styles.stepIndicator}>
        {Array.from({ length: TOTAL_PICK_STEPS }, (_, i) => (
          <span key={i}>
            <span className={`${styles.stepCircle} ${step > i ? styles.stepCircleActive : ''}`}>
              {i + 1}
            </span>
            {i < TOTAL_PICK_STEPS - 1 && (
              <span className={`${styles.line} ${step > i + 1 ? styles.lineActive : ''}`} />
            )}
          </span>
        ))}
      </div>

      {step === STEP_TIME && (
        <div className={styles.stepContent}>
          <h1 className={styles.heading}>How much time do you have?</h1>
          <p className={styles.subheading}>Pick one and we'll filter recipes.</p>
          <StepPills options={TIME_OPTIONS} onSelect={handleTimeSelect} />
          <button className={styles.backBtn} onClick={handleBack}>
            Back
          </button>
        </div>
      )}

      {step === STEP_CATEGORY && (
        <div className={styles.stepContent}>
          <h1 className={styles.heading}>What do you want to eat?</h1>
          <p className={styles.subheading}>Pick a category and we'll find the best recipes.</p>
          <StepPills options={CATEGORY_OPTIONS} onSelect={handleCategorySelect} columns={3} />
          <button className={styles.backBtn} onClick={handleBack}>
            Back
          </button>
        </div>
      )}

      {step === STEP_PREFERENCE && (
        <div className={styles.stepContent}>
          <h1 className={styles.heading}>Any preference?</h1>
          <p className={styles.subheading}>Optional — skip if you're open to anything.</p>
          <StepPills options={PREFERENCE_OPTIONS} onSelect={handlePreferenceSelect} />
          <button className={styles.skipBtn} onClick={handleSkipPreference}>
            Skip — Show Me Recipes
          </button>
          <button className={styles.backBtn} onClick={handleBack}>
            Back
          </button>
        </div>
      )}
    </div>
  );
}
