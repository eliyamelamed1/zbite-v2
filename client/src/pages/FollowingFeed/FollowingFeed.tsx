import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getFollowingFeed } from '../../api/recipes';
import Feed from '../../components/Feed/Feed';
import styles from '../Explore/Explore.module.css';

export default function FollowingFeed() {
  const fetchFn = useCallback((page: number) => getFollowingFeed(page), []);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Your Feed</h1>
      </div>
      <Feed
        fetchFn={fetchFn}
        emptyTitle="Your feed is empty"
        emptyText={
          <>Follow some chefs to see their recipes here. <Link to="/explore" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Explore Recipes</Link></>
        }
      />
    </div>
  );
}
