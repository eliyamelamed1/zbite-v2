import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import DesktopNavbar from '../DesktopNavbar/DesktopNavbar';
import MobileTopBar from '../MobileTopBar/MobileTopBar';
import BottomTabBar from '../BottomTabBar/BottomTabBar';
import styles from './Layout.module.css';

// Pages where we hide ALL navigation (splash, onboarding)
const HIDE_NAV_ROUTES = ['/onboarding'];
// Pages where we hide bottom tab bar only (landing for guests)
const HIDE_BOTTOM_ROUTES = ['/login', '/register', '/onboarding'];

export default function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { user } = useAuth();

  const hideAllNav = HIDE_NAV_ROUTES.includes(location.pathname);
  const hideBottom = HIDE_BOTTOM_ROUTES.includes(location.pathname);
  // Landing page: show nav on desktop, hide bottom bar on mobile
  const isLanding = location.pathname === '/' && !user;

  if (hideAllNav) {
    return <div className={styles.main}>{children}</div>;
  }

  return (
    <div className={styles.main}>
      <DesktopNavbar />
      <MobileTopBar />
      {children}
      {user && !hideBottom && !isLanding && <BottomTabBar />}
    </div>
  );
}
