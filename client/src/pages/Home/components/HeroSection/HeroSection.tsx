import { useNavigate } from 'react-router-dom';
import { Shuffle } from 'lucide-react';

import styles from './HeroSection.module.css';

const STEPS = [
  { number: '1', label: 'Pick your time' },
  { number: '2', label: 'Choose what to eat' },
  { number: '3', label: 'Start cooking' },
] as const;

/** Hero banner with CTA buttons for the recipe decision engine. */
export default function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className={styles.hero}>
      <div className={styles.content}>
        <h1 className={styles.heading}>What should I cook?</h1>
        <p className={styles.subheading}>Find your next meal in seconds.</p>

        <div className={styles.stepsRow}>
          {STEPS.map((step) => (
            <div key={step.number} className={styles.step}>
              <span className={styles.stepNumber}>{step.number}</span>
              <span className={styles.stepLabel}>{step.label}</span>
            </div>
          ))}
        </div>

        <div className={styles.actions}>
          <button className={styles.primaryBtn} onClick={() => navigate('/choose')}>
            Help Me Choose
          </button>
          <button className={styles.outlineBtn} onClick={() => navigate('/results?mode=pick&category=chicken')}>
            <Shuffle size={16} /> Surprise Me
          </button>
        </div>
      </div>
    </section>
  );
}
