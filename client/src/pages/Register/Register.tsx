import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth';
import styles from '../Login/Login.module.css';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await register(username, email, password);
      navigate('/explore');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <form className={styles.card} onSubmit={handleSubmit}>
        <h1 className={styles.title}>Join zbite</h1>
        <p className={styles.subtitle}>Create your account</p>
        {error && <div className={styles.error}>{error}</div>}
        <div className={styles.field}><label className={styles.label}>Username</label><input className={styles.input} type="text" value={username} onChange={(e) => setUsername(e.target.value)} minLength={3} maxLength={30} required /></div>
        <div className={styles.field}><label className={styles.label}>Email</label><input className={styles.input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
        <div className={styles.field}><label className={styles.label}>Password</label><input className={styles.input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required /></div>
        <div className={styles.field}><label className={styles.label}>Confirm Password</label><input className={styles.input} type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required /></div>
        <button className={styles.submitBtn} type="submit" disabled={loading}>{loading ? 'Creating account...' : 'Sign Up'}</button>
        <p className={styles.footer}>Already have an account? <Link to="/login">Log in</Link></p>
      </form>
    </div>
  );
}
