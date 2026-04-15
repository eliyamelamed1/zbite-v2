import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../../features/auth';
import GoogleLoginButton from '../../features/auth/components/GoogleLoginButton/GoogleLoginButton';
import SEO from '../../components/(ui)/seo/SEO/SEO';
import styles from './Login.module.css';

export default function Login() {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/feed');
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message || 'Login failed';
      setError(message);
    } finally {
      setLoading(false);
    }
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

  return (
    <div className={styles.page}>
      <SEO title="Log In" description="Log in to your zbite account." />
      <form className={styles.card} onSubmit={handleSubmit}>
        <h1 className={styles.title}>Welcome back</h1>
        <p className={styles.subtitle}>Log in to your account</p>
        {error && <div className={styles.error}>{error}</div>}
        <div className={styles.field}>
          <label className={styles.label}>Email</label>
          <input className={styles.input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Password</label>
          <input className={styles.input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button className={styles.submitBtn} type="submit" disabled={loading}>{loading ? 'Logging in...' : 'Log In'}</button>
        <div className={styles.divider}>or</div>
        <div className={styles.googleBtnWrapper}>
          <GoogleLoginButton onSuccess={handleGoogleSuccess} onError={handleGoogleError} />
        </div>
        <p className={styles.footer}>Don&apos;t have an account? <Link to="/register">Sign up</Link></p>
      </form>
    </div>
  );
}
