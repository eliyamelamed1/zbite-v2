import { useState, FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth';
import styles from './Landing.module.css';

export default function Landing() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (loading) return null;
  if (user) return <Navigate to="/feed" replace />;

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/feed');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Mobile splash */}
      <div className={styles.mobileSplash}>
        <div className={styles.mobileLogo}>zbite</div>
        <div className={styles.mobileTagline}>Cook. Share. Inspire.</div>
        <Link to="/register" className={styles.mobileLinkWrap}>
          <button className={`${styles.mobileBtn} ${styles.mobileBtnPrimary}`}>Get Started</button>
        </Link>
        <Link to="/explore" className={styles.mobileLinkWrap}>
          <button className={`${styles.mobileBtn} ${styles.mobileBtnGhost}`}>Explore Recipes</button>
        </Link>
        <div className={styles.mobileLink}>
          <Link to="/login">I have an account</Link>
        </div>
      </div>

      {/* Desktop split layout */}
      <div className={styles.desktopLanding}>
        <div className={styles.leftPanel}>
          <div className={styles.photoCollage}>
            <img
              className={`${styles.collageImg} ${styles.collageImg1}`}
              src="https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=400&q=80"
              alt="Food"
            />
            <img
              className={`${styles.collageImg} ${styles.collageImg2}`}
              src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200&q=80"
              alt="Food"
            />
            <img
              className={`${styles.collageImg} ${styles.collageImg3}`}
              src="https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=400&q=80"
              alt="Food"
            />
          </div>
          <Link to="/explore" className={styles.exploreLink}>
            ⊙ Explore Recipes
          </Link>
        </div>

        <div className={styles.rightPanel}>
          <h1 className={styles.desktopTitle}>Cook. Share.<br />Inspire.</h1>
          <p className={styles.desktopSubtitle}>
            The world's most beautiful digital heirloom for recipe creators and food lovers.
          </p>

          <form className={styles.form} onSubmit={handleLogin}>
            {error && <div className={styles.error}>{error}</div>}
            <div className={styles.field}>
              <label className={styles.label}>Email address</label>
              <input
                className={styles.input}
                type="email"
                placeholder="chef@heirloom.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Password</label>
              <input
                className={styles.input}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button className={styles.submitBtn} type="submit" disabled={submitting}>
              {submitting ? 'Signing in...' : 'Get Started'}
            </button>
            <div className={styles.formFooter}>
              Already have an account? <Link to="/login">Log in</Link>
            </div>
          </form>

          <div className={styles.socialIcons}>
            <span className={styles.socialIcon}>🍴</span>
            <span className={styles.socialIcon}>📖</span>
          </div>
        </div>
      </div>
    </>
  );
}
