import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth';
import * as authApi from '../../features/auth/api/auth';
import { CATEGORIES } from '../../types';
import styles from './SignUpWizard.module.css';

const CATEGORY_IMAGES: Record<string, string> = {
  Italian: 'https://images.unsplash.com/photo-1498579150354-977475b7ea0b?w=300&q=70',
  Asian: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=300&q=70',
  Vegan: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300&q=70',
  'Quick Meals': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=300&q=70',
  Seafood: 'https://images.unsplash.com/photo-1534080564583-6be75777b70a?w=300&q=70',
  Greek: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=300&q=70',
  Baking: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300&q=70',
  Desserts: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=300&q=70',
  Healthy: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=300&q=70',
};

export default function SignUpWizard() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const totalSteps = 4;

  const toggleInterest = (cat: string) => {
    setInterests((prev) => prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]);
  };

  const handleNext = async () => {
    setError('');
    if (step === 1 && username.trim().length < 3) { setError('Username must be at least 3 characters'); return; }
    if (step === 2 && !email.includes('@')) { setError('Please enter a valid email'); return; }
    if (step === 3 && password.length < 6) { setError('Password must be at least 6 characters'); return; }

    if (step < 4) {
      setStep(step + 1);
      return;
    }

    // Step 4: finish
    if (interests.length < 3) { setError('Please select at least 3 categories'); return; }

    setLoading(true);
    try {
      await register(username.trim(), email.trim(), password);
      await authApi.saveInterests(interests);
      navigate('/feed');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <>
            <h2 className={styles.stepTitle}>What should we call you?</h2>
            <p className={styles.stepSubtitle}>Pick a unique username for your culinary identity.</p>
            <div className={styles.field}>
              <input className={styles.input} placeholder="e.g. chefmario" value={username}
                onChange={(e) => setUsername(e.target.value)} maxLength={30} autoFocus />
            </div>
          </>
        );
      case 2:
        return (
          <>
            <h2 className={styles.stepTitle}>Your email</h2>
            <p className={styles.stepSubtitle}>We'll use this to keep your account safe.</p>
            <div className={styles.field}>
              <input className={styles.input} type="email" placeholder="chef@example.com" value={email}
                onChange={(e) => setEmail(e.target.value)} autoFocus />
            </div>
          </>
        );
      case 3:
        return (
          <>
            <h2 className={styles.stepTitle}>Create a password</h2>
            <p className={styles.stepSubtitle}>At least 6 characters to keep things secure.</p>
            <div className={styles.field}>
              <input className={styles.input} type="password" placeholder="••••••••" value={password}
                onChange={(e) => setPassword(e.target.value)} autoFocus />
            </div>
          </>
        );
      case 4:
        return (
          <>
            <h2 className={styles.stepTitle}>What do you love to eat?</h2>
            <p className={styles.stepSubtitle}>Select at least 3 categories to help us curate your digital cookbook heirloom.</p>
            <p className={styles.minNote}>{interests.length}/3 selected</p>
            <div className={styles.categoryGrid}>
              {CATEGORIES.map((cat) => (
                <div key={cat} className={`${styles.categoryCard} ${interests.includes(cat) ? styles.categoryCardSelected : ''}`}
                  data-testid={`category-${cat}`}
                  onClick={() => toggleInterest(cat)}>
                  <img src={CATEGORY_IMAGES[cat]} alt={cat} />
                  <div className={styles.categoryLabel}>{cat}</div>
                  {interests.includes(cat) && <div className={styles.categoryCheck}>✓</div>}
                </div>
              ))}
            </div>
          </>
        );
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <button className={styles.closeBtn} onClick={() => navigate('/')}>✕</button>
        <span className={styles.logo}>zbite</span>
        <span className={styles.stepLabel}>STEP {step} of {totalSteps}</span>
      </div>

      <div className={styles.content}>
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${(step / totalSteps) * 100}%` }} />
        </div>

        {error && <div className={styles.error}>{error}</div>}
        {renderStep()}
      </div>

      <div className={styles.bottomBar}>
        {step > 1 ? (
          <button className={styles.backBtn} onClick={() => setStep(step - 1)}>← Back</button>
        ) : (
          <span />
        )}
        <button className={styles.nextBtn} onClick={handleNext} disabled={loading}>
          {loading ? 'Creating...' : step === 4 ? 'Finish' : 'Next'}
        </button>
      </div>
    </div>
  );
}
