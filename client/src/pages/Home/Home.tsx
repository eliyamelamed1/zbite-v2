import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getExploreFeed } from '../../api/recipes';
import RecipeCard from '../../components/RecipeCard/RecipeCard';
import { Recipe } from '../../types';
import styles from './Home.module.css';

export default function Home() {
  const { user, loading } = useAuth();
  const [trending, setTrending] = useState<Recipe[]>([]);

  useEffect(() => {
    getExploreFeed(1, 'trending')
      .then((res) => setTrending(res.data.data.slice(0, 4)))
      .catch((err) => console.error(err));
  }, []);

  if (loading) return null;
  if (user) return <Navigate to="/explore" replace />;

  return (
    <div>
      <div className={styles.hero}>
        <h1 className={styles.heroTitle}>Share your recipes<br />with the world</h1>
        <p className={styles.heroSubtitle}>Discover, cook, and connect with food lovers</p>
        <div className={styles.heroBtns}>
          <Link to="/register"><button className={styles.heroBtn}>Get Started</button></Link>
          <Link to="/explore"><button className={styles.heroBtnOutline}>Explore Recipes</button></Link>
        </div>
      </div>
      {trending.length > 0 && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Trending Recipes</h2>
          <div className={styles.grid}>{trending.map((recipe) => <RecipeCard key={recipe._id} recipe={recipe} />)}</div>
        </div>
      )}
      <div className={styles.cta}>
        <h2 className={styles.ctaTitle}>Join zbite today</h2>
        <Link to="/register"><button className={styles.ctaBtn}>Sign Up Free</button></Link>
      </div>
    </div>
  );
}
