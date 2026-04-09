import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';

import { getFollowingFeed, getExploreFeed, getSavedRecipes, bulkSaveStatus, saveRecipe, unsaveRecipe } from '../../features/recipes/api/recipes';
import { bulkLikeStatus } from '../../features/social/api/likes';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useDebounce } from '../../hooks/useDebounce';
import { imageUrl } from '../../utils/imageUrl';
import FeedCard from '../../features/recipes/components/FeedCard/FeedCard';
import ExploreCard from '../../features/recipes/components/ExploreCard/ExploreCard';
import CategoryChips from '../../components/(ui)/forms/CategoryChips/CategoryChips';
import SuggestedUsers from '../../features/social/components/SuggestedUsers/SuggestedUsers';
import TrendingRecipes from '../../features/social/components/TrendingRecipes/TrendingRecipes';
import { Recipe } from '../../types';
import styles from './FeedPage.module.css';

type MainTab = 'feed' | 'explore' | 'saved';
type SortOption = 'trending' | 'recent' | 'topRated' | 'quick';

const SORT_OPTIONS: ReadonlyArray<{ key: SortOption; label: string }> = [
  { key: 'trending', label: 'Trending' },
  { key: 'recent', label: 'Recent' },
  { key: 'topRated', label: 'Top Rated' },
  { key: 'quick', label: 'Quick (<30min)' },
];

export default function FeedPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isDesktop = useMediaQuery('(min-width: 769px)');

  // Tab state — read from URL param for deep linking
  const initialTab = (searchParams.get('tab') as MainTab) || 'feed';
  const [tab, setTab] = useState<MainTab>(initialTab);

  // Feed tab state
  const [feedRecipes, setFeedRecipes] = useState<Recipe[]>([]);
  const [feedPage, setFeedPage] = useState(1);
  const [feedHasMore, setFeedHasMore] = useState(true);
  const [feedLoading, setFeedLoading] = useState(false);
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});
  const [feedSavedMap, setFeedSavedMap] = useState<Record<string, boolean>>({});

  // Explore tab state
  const [exploreRecipes, setExploreRecipes] = useState<Recipe[]>([]);
  const [explorePage, setExplorePage] = useState(1);
  const [exploreHasMore, setExploreHasMore] = useState(true);
  const [exploreLoading, setExploreLoading] = useState(false);
  const [sort, setSort] = useState<SortOption>('trending');
  const [category, setCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [exploreSavedMap, setExploreSavedMap] = useState<Record<string, boolean>>({});

  // Saved tab state
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);
  const [savedCategory, setSavedCategory] = useState('All');
  const [savedLoading, setSavedLoading] = useState(false);

  // ---------- Tab switching ----------

  const handleTabChange = (newTab: MainTab) => {
    setTab(newTab);
    setSearchParams(newTab === 'feed' ? {} : { tab: newTab });
  };

  // ---------- Feed tab fetching ----------

  const fetchFeed = useCallback(async (pageNum: number) => {
    setFeedLoading(true);
    try {
      const res = await getFollowingFeed(pageNum);
      const fetched = res.data.data;
      setFeedRecipes((prev) => (pageNum === 1 ? fetched : [...prev, ...fetched]));
      setFeedHasMore(pageNum < res.data.pagination.pages);

      if (fetched.length > 0) {
        const ids = fetched.map((r: Recipe) => r._id);
        const [likes, saves] = await Promise.all([
          bulkLikeStatus(ids).catch(() => ({ data: { likedMap: {} } })),
          bulkSaveStatus(ids).catch(() => ({ data: { savedMap: {} } })),
        ]);
        setLikedMap((prev) => ({ ...prev, ...likes.data.likedMap }));
        setFeedSavedMap((prev) => ({ ...prev, ...saves.data.savedMap }));
      }
    } catch {
      toast.error('Failed to load feed');
    } finally {
      setFeedLoading(false);
    }
  }, []);

  // ---------- Explore tab fetching ----------

  const fetchExplore = useCallback(async (pageNum: number) => {
    setExploreLoading(true);
    try {
      const res = await getExploreFeed(pageNum, sort, category !== 'All' ? category : undefined);
      const fetched = res.data.data;
      setExploreRecipes((prev) => (pageNum === 1 ? fetched : [...prev, ...fetched]));
      setExploreHasMore(pageNum < res.data.pagination.pages);

      if (fetched.length > 0) {
        const ids = fetched.map((r: Recipe) => r._id);
        const saves = await bulkSaveStatus(ids).catch(() => ({ data: { savedMap: {} } }));
        setExploreSavedMap((prev) => ({ ...prev, ...saves.data.savedMap }));
      }
    } catch {
      toast.error('Failed to load recipes');
    } finally {
      setExploreLoading(false);
    }
  }, [sort, category]);

  // ---------- Saved tab fetching ----------

  const fetchSaved = useCallback(async () => {
    setSavedLoading(true);
    try {
      const res = await getSavedRecipes(1, savedCategory !== 'All' ? savedCategory : undefined);
      setSavedRecipes(res.data.data);
    } catch {
      toast.error('Failed to load saved recipes');
    } finally {
      setSavedLoading(false);
    }
  }, [savedCategory]);

  // ---------- Effects ----------

  useEffect(() => {
    if (tab === 'feed' && feedRecipes.length === 0) {
      setFeedPage(1);
      fetchFeed(1);
    }
  }, [tab, fetchFeed, feedRecipes.length]);

  useEffect(() => {
    if (tab === 'explore') {
      setExplorePage(1);
      setExploreRecipes([]);
      fetchExplore(1);
    }
  }, [tab, sort, category, fetchExplore]);

  useEffect(() => {
    if (tab === 'saved') {
      fetchSaved();
    }
  }, [tab, savedCategory, fetchSaved]);

  // ---------- Handlers ----------

  const handleFeedLoadMore = () => {
    const next = feedPage + 1;
    setFeedPage(next);
    fetchFeed(next);
  };

  const handleExploreLoadMore = () => {
    const next = explorePage + 1;
    setExplorePage(next);
    fetchExplore(next);
  };

  const handleFeedCardUpdate = (id: string, updates: Partial<{ liked: boolean; likesCount: number; saved: boolean }>) => {
    if (updates.liked !== undefined) setLikedMap((prev) => ({ ...prev, [id]: updates.liked! }));
    if (updates.saved !== undefined) setFeedSavedMap((prev) => ({ ...prev, [id]: updates.saved! }));
    if (updates.likesCount !== undefined) {
      setFeedRecipes((prev) => prev.map((r) => (r._id === id ? { ...r, likesCount: updates.likesCount! } : r)));
    }
  };

  const handleExploreToggleSave = async (recipeId: string) => {
    const isCurrentlySaved = exploreSavedMap[recipeId] ?? false;
    setExploreSavedMap((prev) => ({ ...prev, [recipeId]: !isCurrentlySaved }));
    try {
      if (isCurrentlySaved) {
        await unsaveRecipe(recipeId);
      } else {
        await saveRecipe(recipeId);
      }
    } catch {
      setExploreSavedMap((prev) => ({ ...prev, [recipeId]: isCurrentlySaved }));
      toast.error('Failed to update save');
    }
  };

  // Filter explore recipes by search query (client-side)
  const filteredExploreRecipes = debouncedSearch.trim()
    ? exploreRecipes.filter((r) => r.title.toLowerCase().includes(debouncedSearch.toLowerCase()))
    : exploreRecipes;

  // ---------- Tab content renderers ----------

  const renderFeedTab = () => {
    if (feedLoading && feedRecipes.length === 0) {
      return <div className={styles.loading}>Loading your feed...</div>;
    }
    if (!feedLoading && feedRecipes.length === 0) {
      return (
        <div className={styles.empty}>
          <div className={styles.emptyTitle}>Your feed is empty</div>
          <div className={styles.emptyText}>Follow some chefs to see their recipes here</div>
          <button className={styles.primaryBtn} onClick={() => handleTabChange('explore')}>Explore Recipes</button>
        </div>
      );
    }
    return (
      <div className={styles.feedList}>
        {feedRecipes.map((recipe) => (
          <FeedCard
            key={recipe._id}
            recipe={recipe}
            liked={likedMap[recipe._id] || false}
            saved={feedSavedMap[recipe._id] || false}
            onUpdate={handleFeedCardUpdate}
          />
        ))}
        {feedHasMore && (
          <div className={styles.loadMoreWrap}>
            <button className={styles.primaryBtn} onClick={handleFeedLoadMore} disabled={feedLoading}>
              {feedLoading ? 'Loading...' : 'Load more'}
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderExploreTab = () => (
    <>
      {/* Search input */}
      <div className={styles.searchBar}>
        <input
          className={styles.searchInput}
          type="text"
          placeholder="Search recipes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Sort pills */}
      <div className={styles.sortPills}>
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            className={`${styles.pill} ${sort === opt.key ? styles.pillActive : ''}`}
            onClick={() => setSort(opt.key)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Category chips */}
      <div className={styles.chipsWrap}>
        <CategoryChips selected={category} onChange={setCategory} />
      </div>

      {exploreLoading && exploreRecipes.length === 0 && (
        <div className={styles.loading}>Loading recipes...</div>
      )}

      {!exploreLoading && filteredExploreRecipes.length === 0 && (
        <div className={styles.empty}>
          <div className={styles.emptyText}>No recipes found. Try a different filter!</div>
        </div>
      )}

      <div className={styles.masonry}>
        {filteredExploreRecipes.map((recipe) => (
          <ExploreCard
            key={recipe._id}
            recipe={recipe}
            isSaved={exploreSavedMap[recipe._id] ?? false}
            onToggleSave={handleExploreToggleSave}
          />
        ))}
      </div>

      {exploreHasMore && filteredExploreRecipes.length > 0 && !debouncedSearch.trim() && (
        <div className={styles.loadMoreWrap}>
          <button className={styles.outlineBtn} onClick={handleExploreLoadMore} disabled={exploreLoading}>
            {exploreLoading ? 'Loading...' : 'Load more'}
          </button>
        </div>
      )}
    </>
  );

  const renderSavedTab = () => (
    <>
      <div className={styles.chipsWrap}>
        <CategoryChips selected={savedCategory} onChange={setSavedCategory} />
      </div>

      {savedLoading ? (
        <div className={styles.loading}>Loading saved recipes...</div>
      ) : (
        <div className={styles.savedGrid}>
          {savedRecipes.map((r) => (
            <div key={r._id} className={styles.savedCard} onClick={() => navigate(`/recipe/${r._id}`)}>
              <div className={styles.savedImageWrap}>
                <img className={styles.savedImage} src={imageUrl(r.coverImage)} alt={r.title} />
                <span className={styles.savedBookmark}>🔖</span>
                <span className={`${styles.savedBadge} ${styles[r.difficulty]}`}>{r.difficulty}</span>
              </div>
              <div className={styles.savedBody}>
                <div className={styles.savedTitle}>{r.title}</div>
                <div className={styles.savedAuthor}>By {r.author?.username}</div>
                <div className={styles.savedMeta}>
                  <span className={styles.savedStars}>★ {r.averageRating > 0 ? r.averageRating : '—'}</span>
                  <span>⏱ {r.cookingTime} min</span>
                </div>
              </div>
            </div>
          ))}
          <div className={styles.savedEmptyCard} onClick={() => handleTabChange('explore')}>
            <span className={styles.savedEmptyIcon}>+</span>
            <span className={styles.savedEmptyText}>Save more recipes</span>
          </div>
        </div>
      )}
    </>
  );

  // ---------- Render ----------

  const tabContent = tab === 'feed' ? renderFeedTab() : tab === 'explore' ? renderExploreTab() : renderSavedTab();

  return (
    <div className={styles.page}>
      {/* Horizontal tabs — shared between mobile and desktop */}
      <div className={styles.tabs}>
        <button className={`${styles.tab} ${tab === 'feed' ? styles.tabActive : ''}`} onClick={() => handleTabChange('feed')}>Feed</button>
        <button className={`${styles.tab} ${tab === 'explore' ? styles.tabActive : ''}`} onClick={() => handleTabChange('explore')}>Explore</button>
        <button className={`${styles.tab} ${tab === 'saved' ? styles.tabActive : ''}`} onClick={() => handleTabChange('saved')}>Saved</button>
      </div>

      {/* Desktop: 2-column (content + right sidebar) */}
      {isDesktop ? (
        <div className={styles.desktopLayout}>
          <div className={styles.mainContent}>
            {tabContent}
          </div>
          <div className={styles.rightSidebar}>
            <SuggestedUsers />
            <TrendingRecipes />
          </div>
        </div>
      ) : (
        <div className={styles.mobileContent}>
          {tabContent}
        </div>
      )}
    </div>
  );
}
