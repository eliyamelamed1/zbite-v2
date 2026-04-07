import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFollowingFeed, getExploreFeed } from '../../api/recipes';
import { bulkLikeStatus } from '../../api/likes';
import { bulkSaveStatus } from '../../api/recipes';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import FeedCard from '../../components/FeedCard/FeedCard';
import SuggestedUsers from '../../components/SuggestedUsers/SuggestedUsers';
import TrendingRecipes from '../../components/TrendingRecipes/TrendingRecipes';
import { Recipe } from '../../types';
import styles from './FeedPage.module.css';

type FeedTab = 'following' | 'featured' | 'new';

export default function FeedPage() {
  const navigate = useNavigate();
  const isDesktop = useMediaQuery('(min-width: 769px)');
  const [tab, setTab] = useState<FeedTab>('following');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});
  const [savedMap, setSavedMap] = useState<Record<string, boolean>>({});
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);

  const fetchFeed = useCallback(async (pageNum: number, activeTab: FeedTab) => {
    setLoading(true);
    try {
      let res;
      if (activeTab === 'following') {
        res = await getFollowingFeed(pageNum);
      } else if (activeTab === 'featured') {
        res = await getExploreFeed(pageNum, 'trending');
      } else {
        res = await getExploreFeed(pageNum, 'recent');
      }

      const newRecipes = res.data.data;
      const allRecipes = pageNum === 1 ? newRecipes : [...recipes, ...newRecipes];
      setRecipes(allRecipes);
      setHasMore(pageNum < res.data.pagination.pages);

      // Fetch bulk like/save status
      if (newRecipes.length > 0) {
        const ids = newRecipes.map((r: Recipe) => r._id);
        const [likes, saves] = await Promise.all([
          bulkLikeStatus(ids).catch(() => ({ data: { likedMap: {} } })),
          bulkSaveStatus(ids).catch(() => ({ data: { savedMap: {} } })),
        ]);
        setLikedMap((prev) => ({ ...prev, ...likes.data.likedMap }));
        setSavedMap((prev) => ({ ...prev, ...saves.data.savedMap }));
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, [recipes]);

  useEffect(() => {
    setPage(1);
    setRecipes([]);
    setLikedMap({});
    setSavedMap({});
    fetchFeed(1, tab);
  }, [tab]);

  const handleLoadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchFeed(next, tab);
  };

  const handleCardUpdate = (id: string, updates: Partial<{ liked: boolean; likesCount: number; saved: boolean }>) => {
    if (updates.liked !== undefined) setLikedMap((prev) => ({ ...prev, [id]: updates.liked! }));
    if (updates.saved !== undefined) setSavedMap((prev) => ({ ...prev, [id]: updates.saved! }));
    if (updates.likesCount !== undefined) {
      setRecipes((prev) => prev.map((r) => r._id === id ? { ...r, likesCount: updates.likesCount! } : r));
    }
  };

  const renderFeed = () => {
    if (loading && recipes.length === 0) return <div className={styles.loading}>Loading your feed...</div>;

    if (!loading && recipes.length === 0) {
      return (
        <div className={styles.empty}>
          <div className={styles.emptyTitle}>Your feed is empty</div>
          <div className={styles.emptyText}>Follow some chefs to see their recipes here</div>
          <button className={styles.emptyBtn} onClick={() => navigate('/explore')}>Explore Recipes</button>
        </div>
      );
    }

    return (
      <>
        {recipes.map((recipe) => (
          <FeedCard
            key={recipe._id}
            recipe={recipe}
            liked={likedMap[recipe._id] || false}
            saved={savedMap[recipe._id] || false}
            onUpdate={handleCardUpdate}
          />
        ))}
        {hasMore && (
          <div className={styles.footer}>
            <button className={styles.emptyBtn} onClick={handleLoadMore} disabled={loading}>
              {loading ? 'Loading...' : 'Load more'}
            </button>
          </div>
        )}
      </>
    );
  };

  return (
    <div className={styles.page}>
      {/* Mobile tabs */}
      <div className={styles.mobileTabs}>
        <button className={`${styles.mobileTab} ${tab === 'following' ? styles.mobileTabActive : ''}`} onClick={() => setTab('following')}>My Bites</button>
        <button className={`${styles.mobileTab} ${tab === 'featured' ? styles.mobileTabActive : ''}`} onClick={() => setTab('featured')}>Featured</button>
        <button className={`${styles.mobileTab} ${tab === 'new' ? styles.mobileTabActive : ''}`} onClick={() => setTab('new')}>New</button>
      </div>

      {/* Mobile feed */}
      {!isDesktop && renderFeed()}

      {/* Desktop 3-column layout */}
      {isDesktop && (
        <div className={styles.desktopLayout}>
          <div className={styles.sidebar}>
            <div className={styles.sidebarHeading}>Your Feed</div>
            <div className={`${styles.sidebarLink} ${tab === 'following' ? styles.sidebarLinkActive : ''}`} onClick={() => setTab('following')}>Following</div>
            <div className={`${styles.sidebarLink} ${tab === 'featured' ? styles.sidebarLinkActive : ''}`} onClick={() => setTab('featured')}>For You</div>
            <div className={styles.sidebarLink} onClick={() => navigate('/saved')}>Saved Collections</div>
          </div>

          <div className={styles.center}>
            {renderFeed()}
          </div>

          <div className={styles.rightSidebar}>
            <SuggestedUsers />
            <TrendingRecipes />
          </div>
        </div>
      )}
    </div>
  );
}
