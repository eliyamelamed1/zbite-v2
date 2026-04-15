import { useNavigate } from 'react-router-dom';

import SEO from '../../components/(ui)/seo/SEO/SEO';
import styles from './NotFound.module.css';

/** 404 Not Found page — shown for invalid routes. */
export default function NotFound() {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/feed');
  };

  return (
    <div className={styles.container}>
      <SEO title="Page Not Found" description="This page doesn't exist." noindex />
      <div className={styles.content}>
        <span className={styles.emoji}>🍳</span>
        <h1 className={styles.title}>404</h1>
        <p className={styles.subtitle}>This recipe doesn't exist</p>
        <p className={styles.description}>
          The page you're looking for might have been moved or doesn't exist.
        </p>
        <button className={styles.homeButton} onClick={handleGoHome}>
          Back to Feed
        </button>
      </div>
    </div>
  );
}
