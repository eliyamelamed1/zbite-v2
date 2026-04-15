import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check, X } from 'lucide-react';

import { useAuth } from '../../features/auth';
import GoogleLoginButton from '../../features/auth/components/GoogleLoginButton/GoogleLoginButton';
import * as authApi from '../../features/auth/api/auth';
import { CUISINE_TAGS, DISH_TYPE_TAGS, DIETARY_TAGS, MEAL_TYPE_TAGS } from '../../types';
import SEO from '../../components/(ui)/seo/SEO/SEO';
import styles from './SignUpWizard.module.css';

const TAG_SECTIONS = [
  { label: 'Cuisine', tags: CUISINE_TAGS },
  { label: 'Dish Type', tags: DISH_TYPE_TAGS },
  { label: 'Dietary & Lifestyle', tags: DIETARY_TAGS },
  { label: 'Meal Type', tags: MEAL_TYPE_TAGS },
] as const;

const MIN_USERNAME_LENGTH = 3;
const MIN_PASSWORD_LENGTH = 6;
const MIN_INTERESTS = 3;
const MANUAL_TOTAL_STEPS = 4;

export default function SignUpWizard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, register, loginWithGoogle } = useAuth();

  const isOAuthFlow = searchParams.get('oauth') === 'true' && user !== null;
  const totalSteps = isOAuthFlow ? 1 : MANUAL_TOTAL_STEPS;
  const initialStep = isOAuthFlow ? MANUAL_TOTAL_STEPS : 1;

  const [step, setStep] = useState(initialStep);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleInterest = (cat: string) => {
    setInterests((prev) => prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]);
  };

  const handleGoogleSuccess = async (credential: string) => {
    setError('');
    setLoading(true);
    try {
      const { isNewUser } = await loginWithGoogle(credential);
      navigate(isNewUser ? '/register?oauth=true' : '/feed');
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message || 'Google sign-in failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Google sign-in was cancelled or failed');
  };

  const handleNext = async () => {
    setError('');
    if (step === 1 && username.trim().length < MIN_USERNAME_LENGTH) { setError('Username must be at least 3 characters'); return; }
    if (step === 2 && !email.includes('@')) { setError('Please enter a valid email'); return; }
    if (step === MIN_PASSWORD_LENGTH && password.length < MIN_PASSWORD_LENGTH) { setError('Password must be at least 6 characters'); return; }

    if (step < MANUAL_TOTAL_STEPS) {
      setStep(step + 1);
      return;
    }

    // Interests step (step 4): finish
    if (interests.length < MIN_INTERESTS) { setError('Please select at least 3 categories'); return; }

    setLoading(true);
    try {
      if (!isOAuthFlow) {
        await register(username.trim(), email.trim(), password);
      }
      await authApi.saveInterests(interests);
      navigate('/feed');
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message || 'Registration failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const renderInterestsStep = () => (
    <>
      <h2 className={styles.stepTitle}>What do you love to eat?</h2>
      <p className={styles.stepSubtitle}>Select at least 3 tags to help us curate your digital cookbook heirloom.</p>
      <p className={styles.minNote}>{interests.length}/3 selected</p>
      <div className={styles.tagSections}>
        {TAG_SECTIONS.map((section) => (
          <div key={section.label} className={styles.tagSection}>
            <h3 className={styles.tagSectionTitle}>{section.label}</h3>
            <div className={styles.tagGrid}>
              {section.tags.map((tag) => (
                <button
                  key={tag}
                  className={`${styles.tagChip} ${interests.includes(tag) ? styles.tagChipSelected : ''}`}
                  data-testid={`tag-${tag}`}
                  onClick={() => toggleInterest(tag)}
                >
                  {tag}
                  {interests.includes(tag) && <span className={styles.tagCheck}><Check size={14} /></span>}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );

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
            <div className={styles.divider}>or</div>
            <div className={styles.googleBtnWrapper}>
              <GoogleLoginButton onSuccess={handleGoogleSuccess} onError={handleGoogleError} />
            </div>
          </>
        );
      case 2:
        return (
          <>
            <h2 className={styles.stepTitle}>Your email</h2>
            <p className={styles.stepSubtitle}>We&apos;ll use this to keep your account safe.</p>
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
      case MANUAL_TOTAL_STEPS:
        return renderInterestsStep();
    }
  };

  const currentDisplayStep = isOAuthFlow ? 1 : step;
  const stepLabel = isOAuthFlow ? 'Pick your interests' : `STEP ${currentDisplayStep} of ${totalSteps}`;

  return (
    <div className={styles.page}>
      <SEO title="Set Up Your Profile" description="Pick your cooking interests to get personalized recipes." />
      <div className={styles.topBar}>
        <button className={styles.closeBtn} onClick={() => navigate('/')}><X size={18} /></button>
        <span className={styles.logo}>zbite</span>
        <span className={styles.stepLabel}>{stepLabel}</span>
      </div>

      <div className={styles.content}>
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${(currentDisplayStep / totalSteps) * 100}%` }} />
        </div>

        {error && <div className={styles.error}>{error}</div>}
        {renderStep()}
      </div>

      <div className={styles.bottomBar}>
        {step > 1 && !isOAuthFlow ? (
          <button className={styles.backBtn} onClick={() => setStep(step - 1)}>&larr; Back</button>
        ) : (
          <span />
        )}
        <button className={styles.nextBtn} onClick={handleNext} disabled={loading}>
          {loading ? 'Creating...' : step === MANUAL_TOTAL_STEPS ? 'Finish' : 'Next'}
        </button>
      </div>
    </div>
  );
}
