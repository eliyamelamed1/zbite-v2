import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useDebounce } from '../../hooks/useDebounce';
import { searchUsers } from '../../api/users';
import { getUnreadCount } from '../../api/notifications';
import { imageUrl } from '../../utils/imageUrl';
import { User } from '../../types';
import styles from './DesktopNavbar.module.css';

export default function DesktopNavbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [unread, setUnread] = useState(0);
  const debouncedQuery = useDebounce(query, 300);
  const searchRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (debouncedQuery.trim().length >= 2) {
      searchUsers(debouncedQuery).then((res) => {
        setResults(res.data.data.slice(0, 5));
        setShowDropdown(true);
      });
    } else {
      setResults([]);
      setShowDropdown(false);
    }
  }, [debouncedQuery]);

  useEffect(() => {
    if (user) {
      getUnreadCount().then((res) => setUnread(res.data.count)).catch((err) => console.error(err));
    }
  }, [user, location.pathname]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowDropdown(false);
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleUserClick = (userId: string) => {
    setQuery('');
    setShowDropdown(false);
    navigate(`/user/${userId}`);
  };

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <nav className={styles.navbar}>
      <div className={styles.inner}>
        <Link to={user ? '/feed' : '/'} className={styles.logo}>zbite</Link>

        <div className={styles.searchWrapper} ref={searchRef}>
          <span className={styles.searchIcon}>&#128269;</span>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Search curated recipes..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => results.length > 0 && setShowDropdown(true)}
          />
          {showDropdown && results.length > 0 && (
            <div className={styles.dropdown}>
              {results.map((u) => (
                <div key={u._id} className={styles.dropdownItem} onClick={() => handleUserClick(u._id)}>
                  <img
                    className={styles.dropdownAvatar}
                    src={imageUrl(u.avatar) || `https://ui-avatars.com/api/?name=${u.username}&background=F0E0D0&color=2D1810`}
                    alt={u.username}
                  />
                  <span className={styles.dropdownName}>@{u.username}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.nav}>
          <Link to={user ? '/feed' : '/'} className={`${styles.navLink} ${isActive('/feed') ? styles.navLinkActive : ''}`}>
            Home
          </Link>
          <Link to="/explore" className={`${styles.navLink} ${isActive('/explore') ? styles.navLinkActive : ''}`}>
            Explore
          </Link>

          {user && (
            <>
              <Link to="/recipe/new">
                <button className={styles.createBtn}>+ Create</button>
              </Link>
              <button className={styles.bellBtn} onClick={() => navigate('/activity')}>
                &#128276;
                {unread > 0 && <span className={styles.bellBadge} />}
              </button>
            </>
          )}

          {user ? (
            <div className={styles.avatarMenuWrapper} ref={menuRef}>
              <button className={styles.avatarBtn} onClick={() => setShowMenu(!showMenu)}>
                <img
                  src={imageUrl(user.avatar) || `https://ui-avatars.com/api/?name=${user.username}&background=F0E0D0&color=2D1810`}
                  alt={user.username}
                />
              </button>
              {showMenu && (
                <div className={styles.avatarMenu}>
                  <button className={styles.avatarMenuItem} onClick={() => { setShowMenu(false); navigate(`/user/${user._id}`); }}>Profile</button>
                  <button className={styles.avatarMenuItem} onClick={() => { setShowMenu(false); navigate('/saved'); }}>Saved</button>
                  <button className={styles.avatarMenuItem} onClick={() => { setShowMenu(false); navigate('/leaderboard'); }}>Leaderboard</button>
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
