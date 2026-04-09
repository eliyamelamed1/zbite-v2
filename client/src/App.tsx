import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/(ui)/layout/Layout/Layout';
import ProtectedRoute from './components/(ui)/layout/ProtectedRoute/ProtectedRoute';
import Landing from './pages/Landing/Landing';
import Login from './pages/Login/Login';
import SignUpWizard from './pages/SignUpWizard/SignUpWizard';
import FeedPage from './pages/Feed/FeedPage';
import RecipeDetail from './pages/RecipeDetail/RecipeDetail';
import RecipeWizard from './pages/CreateRecipe/RecipeWizard';
import EditRecipe from './pages/EditRecipe/EditRecipe';
import UserProfile from './pages/UserProfile/UserProfile';
import Activity from './pages/Activity/Activity';
import Leaderboard from './pages/Leaderboard/Leaderboard';
import ShoppingListPage from './pages/ShoppingList/ShoppingList';
import Followers from './pages/Followers/Followers';
import FollowingPage from './pages/Following/Following';
import NotFound from './pages/NotFound/NotFound';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<SignUpWizard />} />
        <Route path="/feed" element={<ProtectedRoute><FeedPage /></ProtectedRoute>} />
        <Route path="/following" element={<ProtectedRoute><FeedPage /></ProtectedRoute>} />
        <Route path="/recipe/:id" element={<RecipeDetail />} />
        <Route path="/recipe/new" element={<ProtectedRoute><RecipeWizard /></ProtectedRoute>} />
        <Route path="/recipe/:id/edit" element={<ProtectedRoute><EditRecipe /></ProtectedRoute>} />
        <Route path="/user/:id" element={<UserProfile />} />
        <Route path="/user/:id/followers" element={<Followers />} />
        <Route path="/user/:id/following" element={<FollowingPage />} />
        <Route path="/activity" element={<ProtectedRoute><Activity /></ProtectedRoute>} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/shopping-list" element={<ProtectedRoute><ShoppingListPage /></ProtectedRoute>} />
        {/* Redirects for removed pages — now tabs inside /feed */}
        <Route path="/explore" element={<Navigate to="/feed?tab=explore" replace />} />
        <Route path="/saved" element={<Navigate to="/feed?tab=saved" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster position="bottom-right" />
    </Layout>
  );
}
