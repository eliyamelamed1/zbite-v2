import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Bell, Plus } from 'lucide-react';

import { useAuth } from '../../../../features/auth';
import { useUnifiedSearch } from '../../../../hooks/useUnifiedSearch';
import { useUnreadCount } from '../../../../hooks/useUnreadCount';
import { useClickOutside } from '../../../../hooks/useClickOutside';
import { imageUrl } from '../../../../utils/imageUrl';
import { getAvatarUrl } from '../../../../utils/getAvatarUrl';
import styles from './DesktopNavbar.module.css';

const SEARCH_MIN_LENGTH = 2;

export default function DesktopNavbar(): JSX.Element {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [query, setQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const unread = useUnreadCount();
  const { recipes, users, isLoading } = useUnifiedSearch(query);
  const hasResults = recipes.length > 0 || users.length > 0;

  useClickOutside(searchRef, useCallback(() => setShowDropdown(false), []));
  useClickOutside(menuRef, useCallback(() => setShowMenu(false), []));

  useEffect(() => {
    if (hasResults) setShowDropdown(true);
    if (query.trim().length < SEARCH_MIN_LENGTH) setShowDropdown(false);
  }, [hasResults, query]);

  const handleUserClick = (userId: string) => {
    setQuery('');
    setShowDropdown(false);
    navigate(`/user/${userId}`);
  };

  const handleRecipeClick = (recipeId: string) => {
    setQuery('');
    setShowDropdown(false);
    navigate(`/recipe/${recipeId}`);
  };

  const handleViewAll = () => {
    setShowDropdown(false);
    navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    setQuery('');
  };

  const handleSearchKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && query.trim().length >= SEARCH_MIN_LENGTH) {
      handleViewAll();
    }
  };

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(`${path}/`);

  return (
    <nav className={styles.navbar}>
      <div className={styles.inner}>
        <Link to="/" className={styles.logo}>zbite</Link>

        <div className={styles.navLinks}>
          <Link to="/" className={`${styles.navLink} ${location.pathname === '/' ? styles.navLinkActive : ''}`}>
            Home
          </Link>
          <Link to="/feed" className={`${styles.navLink} ${isActive('/feed') ? styles.navLinkActive : ''}`}>
            Explore
          </Link>
          <Link to="/leaderboard" className={`${styles.navLink} ${isActive('/leaderboard') ? styles.navLinkActive : ''}`}>
            Leaderboard
          </Link>
        </div>

        <div className={styles.searchWrapper} ref={searchRef}>
          <span className={styles.searchIcon}><Search size={14} /></span>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Search recipes & chefs..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => hasResults && setShowDropdown(true)}
            onKeyDown={handleSearchKeyDown}
          />
          {showDropdown && (hasResults || isLoading) && (
            <div className={styles.dropdown}>
              {isLoading && (
                <div className={styles.dropdownLoading}>Searching...</div>
              )}

              {recipes.length > 0 && (
                <div className={styles.dropdownSection}>
                  <div className={styles.sectionTitle}>Recipes</div>
                  {recipes.map((recipe) => (
                    <div
                      key={recipe._id}
                      className={styles.dropdownItem}
                      onClick={() => handleRecipeClick(recipe._id)}
                    >
                      <img
                        className={styles.recipeThumbnail}
                        src={imageUrl(recipe.coverImage) ?? ''}
                        alt={recipe.title}
                      />
                      <div className={styles.recipeInfo}>
                        <span className={styles.recipeTitle}>{recipe.title}</span>
                        <span className={styles.recipeMeta}>{recipe.tags?.[0] ?? ''}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {users.length > 0 && (
                <div className={styles.dropdownSection}>
                  <div className={styles.sectionTitle}>Chefs</div>
                  {users.map((u) => (
                    <div key={u._id} className={styles.dropdownItem} onClick={() => handleUserClick(u._id)}>
                      <img
                        className={styles.dropdownAvatar}
                        src={getAvatarUrl(u.avatar, u.username)}
                        alt={u.username}
                      />
                      <span className={styles.dropdownName}>@{u.username}</span>
                    </div>
                  ))}
                </div>
              )}

              {hasResults && (
                <button className={styles.viewAllBtn} onClick={handleViewAll}>
                  View all results &rarr;
                </button>
              )}
            </div>
          )}
        </div>

        <div className={styles.nav}>
          {user && (
            <>
              <Link to="/recipe/new">
                <button className={styles.createBtn}><Plus size={14} /> Create</button>
              </Link>
              <button className={styles.bellBtn} onClick={() => navigate('/activity')}>
                <Bell size={18} />
                {unread > 0 && <span className={styles.bellBadge} />}
              </button>
            </>
          )}

          {user ? (
            <div className={styles.avatarMenuWrapper} ref={menuRef}>
              <button className={styles.avatarBtn} onClick={() => setShowMenu(!showMenu)}>
                <img
                  src={getAvatarUrl(user.avatar, user.username)}
                  alt={user.username}
                />
              </button>
              {showMenu && (
                <div className={styles.avatarMenu}>
                  <button className={styles.avatarMenuItem} onClick={() => { setShowMenu(false); navigate(`/user/${user._id}`); }}>Profile</button>
                  <button className={styles.avatarMenuItem} onClick={() => { setShowMenu(false); navigate('/shopping-list'); }}>Shopping List</button>
                  <button className={styles.avatarMenuItem} onClick={() => { setShowMenu(false); logout(); navigate('/'); }}>Logout</button>
                </div>
              )}
            </div>
          ) : (
            <div className={styles.authLinks}>
              <Link to="/login"><button className={styles.loginBtn}>Log In</button></Link>
              <Link to="/register"><button className={styles.signupBtn}>Sign Up</button></Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
