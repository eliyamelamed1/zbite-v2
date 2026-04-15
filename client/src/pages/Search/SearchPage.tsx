import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import { searchRecipes, bulkSaveStatus, saveRecipe, unsaveRecipe } from '../../features/recipes/api/recipes';
import { searchUsers } from '../../features/social/api/users';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';
import ExploreCard from '../../features/recipes/components/ExploreCard/ExploreCard';
import { getAvatarUrl } from '../../utils/getAvatarUrl';
import SkeletonGrid from '../../components/(ui)/feedback/Skeleton/Skeleton';
import { Recipe, User } from '../../types';
import SEO from '../../components/(ui)/seo/SEO/SEO';
import styles from './SearchPage.module.css';

type SearchTab = 'recipes' | 'users';

const MIN_QUERY_LENGTH = 2;

export default function SearchPage(): JSX.Element {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const initialQuery = searchParams.get('q') ?? '';

  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<SearchTab>('recipes');

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [recipePage, setRecipePage] = useState(1);
  const [userPage, setUserPage] = useState(1);
  const [hasMoreRecipes, setHasMoreRecipes] = useState(true);
  const [hasMoreUsers, setHasMoreUsers] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [savedMap, setSavedMap] = useState<Record<string, boolean>>({});

  const fetchResults = useCallback(async (searchQuery: string, page: number, tab: SearchTab) => {
    if (searchQuery.trim().length < MIN_QUERY_LENGTH) return;
    setIsLoading(true);

    try {
      if (tab === 'recipes') {
        const res = await searchRecipes(searchQuery, page);
        const fetched = res.data.data;
        setRecipes((prev) => (page === 1 ? fetched : [...prev, ...fetched]));
        setHasMoreRecipes(page < res.data.pagination.pages);
      } else {
        const res = await searchUsers(searchQuery, page);
        const fetched = res.data.data;
        setUsers((prev) => (page === 1 ? fetched : [...prev, ...fetched]));
        setHasMoreUsers(page < res.data.pagination.pages);
      }
    } catch {
      // Search errors are non-fatal
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchSavedStatus = useCallback(async (recipeList: Recipe[]) => {
    if (!user || recipeList.length === 0) return;
    try {
      const ids = recipeList.map((r) => r._id);
      const res = await bulkSaveStatus(ids);
      setSavedMap((prev) => ({ ...prev, ...res.data.savedMap }));
    } catch {
      // Saved status is non-critical
    }
  }, [user]);

  // Trigger search when query or tab changes
  useEffect(() => {
    setRecipes([]);
    setUsers([]);
    setRecipePage(1);
    setUserPage(1);
    setHasMoreRecipes(true);
    setHasMoreUsers(true);
    fetchResults(query, 1, activeTab);
  }, [query, activeTab, fetchResults]);

  // Fetch saved status when recipes change
  useEffect(() => {
    if (recipes.length > 0) {
      fetchSavedStatus(recipes);
    }
  }, [recipes, fetchSavedStatus]);

  const handleLoadMore = () => {
    if (activeTab === 'recipes') {
      const next = recipePage + 1;
      setRecipePage(next);
      fetchResults(query, next, 'recipes');
    } else {
      const next = userPage + 1;
      setUserPage(next);
      fetchResults(query, next, 'users');
    }
  };

  const hasMore = activeTab === 'recipes' ? hasMoreRecipes : hasMoreUsers;
  const sentinelRef = useInfiniteScroll({ onLoadMore: handleLoadMore, hasMore, isLoading });

  const handleToggleSave = async (recipeId: string) => {
    if (!user) {
      navigate('/login');
      return;
    }
    const isCurrentlySaved = savedMap[recipeId] ?? false;
    setSavedMap((prev) => ({ ...prev, [recipeId]: !isCurrentlySaved }));
    try {
      if (isCurrentlySaved) {
        await unsaveRecipe(recipeId);
      } else {
        await saveRecipe(recipeId);
      }
    } catch {
      setSavedMap((prev) => ({ ...prev, [recipeId]: isCurrentlySaved }));
      toast.error('Failed to update save');
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setSearchParams({ q: query.trim() });
  };

  const currentResults = activeTab === 'recipes' ? recipes : users;

  return (
    <div className={styles.page}>
      <SEO title="Search" description="Search recipes and chefs on zbite." />
      <form className={styles.searchForm} onSubmit={handleSubmit}>
        <input
          className={styles.searchInput}
          type="text"
          placeholder="Search recipes & chefs..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
      </form>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'recipes' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('recipes')}
        >
          Recipes
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'users' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Chefs
        </button>
      </div>

      {isLoading && currentResults.length === 0 && (
        <div className={styles.masonry}>
          <SkeletonGrid />
        </div>
      )}

      {!isLoading && currentResults.length === 0 && query.trim().length >= MIN_QUERY_LENGTH && (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>🔍</div>
          <div>No {activeTab === 'recipes' ? 'recipes' : 'chefs'} found for &ldquo;{query}&rdquo;</div>
          <div className={styles.emptyHint}>Try different keywords or browse recipes on the feed.</div>
        </div>
      )}

      {activeTab === 'recipes' && recipes.length > 0 && (
        <div className={styles.masonry}>
          {recipes.map((recipe) => (
            <ExploreCard key={recipe._id} recipe={recipe} />
          ))}
        </div>
      )}

      {activeTab === 'users' && users.length > 0 && (
        <div className={styles.userGrid}>
          {users.map((u) => (
            <div key={u._id} className={styles.userCard} onClick={() => navigate(`/user/${u._id}`)}>
              <img
                className={styles.userAvatar}
                src={getAvatarUrl(u.avatar, u.username)}
                alt={u.username}
              />
              <div className={styles.userInfo}>
                <span className={styles.userName}>@{u.username}</span>
                {u.bio && <span className={styles.userBio}>{u.bio}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {hasMore && currentResults.length > 0 && (
        <div ref={sentinelRef} className={styles.sentinel}>
          {isLoading && <div className={styles.loadingMore}>Loading more...</div>}
        </div>
      )}
    </div>
  );
}
