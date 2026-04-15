import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/(ui)/layout/Layout/Layout';
import ProtectedRoute from './components/(ui)/layout/ProtectedRoute/ProtectedRoute';

const Home = lazy(() => import('./pages/Home/Home'));
const Choose = lazy(() => import('./pages/Choose/Choose'));
const Results = lazy(() => import('./pages/Results/Results'));
const Login = lazy(() => import('./pages/Login/Login'));
const SignUpWizard = lazy(() => import('./pages/SignUpWizard/SignUpWizard'));
const FeedPage = lazy(() => import('./pages/Feed/FeedPage'));
const RecipeDetail = lazy(() => import('./pages/RecipeDetail/RecipeDetail'));
const RecipeWizard = lazy(() => import('./pages/CreateRecipe/RecipeWizard'));
const EditRecipe = lazy(() => import('./pages/EditRecipe/EditRecipe'));
const UserProfile = lazy(() => import('./pages/UserProfile/UserProfile'));
const Activity = lazy(() => import('./pages/Activity/Activity'));
const Leaderboard = lazy(() => import('./pages/Leaderboard/Leaderboard'));
const ShoppingListPage = lazy(() => import('./pages/ShoppingList/ShoppingList'));
const Followers = lazy(() => import('./pages/Followers/Followers'));
const FollowingPage = lazy(() => import('./pages/Following/Following'));
const SearchPage = lazy(() => import('./pages/Search/SearchPage'));
const SavedRecipes = lazy(() => import('./pages/SavedRecipes/SavedRecipes'));
const NotFound = lazy(() => import('./pages/NotFound/NotFound'));

export default function App() {
  return (
    <Layout>
      <Suspense fallback={<div style={{ textAlign: 'center', padding: '80px', color: 'var(--color-text-secondary)' }}>Loading...</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/choose" element={<Choose />} />
          <Route path="/results" element={<Results />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<SignUpWizard />} />
          <Route path="/feed" element={<FeedPage />} />
          <Route path="/recipe/:id" element={<RecipeDetail />} />
          <Route path="/recipe/new" element={<ProtectedRoute><RecipeWizard /></ProtectedRoute>} />
          <Route path="/recipe/:id/edit" element={<ProtectedRoute><EditRecipe /></ProtectedRoute>} />
          <Route path="/user/:id" element={<UserProfile />} />
          <Route path="/user/:id/followers" element={<Followers />} />
          <Route path="/user/:id/following" element={<FollowingPage />} />
          <Route path="/activity" element={<ProtectedRoute><Activity /></ProtectedRoute>} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/shopping-list" element={<ProtectedRoute><ShoppingListPage /></ProtectedRoute>} />
          <Route path="/explore" element={<Navigate to="/feed" replace />} />
          <Route path="/following" element={<Navigate to="/feed" replace />} />
          <Route path="/saved" element={<ProtectedRoute><SavedRecipes /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      <Toaster position="bottom-right" />
    </Layout>
  );
}
