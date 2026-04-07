import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import Landing from './pages/Landing/Landing';
import Login from './pages/Login/Login';
import SignUpWizard from './pages/SignUpWizard/SignUpWizard';
import Explore from './pages/Explore/Explore';
import FeedPage from './pages/Feed/FeedPage';
import RecipeDetail from './pages/RecipeDetail/RecipeDetail';
import RecipeWizard from './pages/CreateRecipe/RecipeWizard';
import EditRecipe from './pages/EditRecipe/EditRecipe';
import UserProfile from './pages/UserProfile/UserProfile';
import Activity from './pages/Activity/Activity';
import SavedRecipes from './pages/SavedRecipes/SavedRecipes';
import Leaderboard from './pages/Leaderboard/Leaderboard';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<SignUpWizard />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/feed" element={<ProtectedRoute><FeedPage /></ProtectedRoute>} />
        <Route path="/following" element={<ProtectedRoute><FeedPage /></ProtectedRoute>} />
        <Route path="/recipe/:id" element={<RecipeDetail />} />
        <Route path="/recipe/new" element={<ProtectedRoute><RecipeWizard /></ProtectedRoute>} />
        <Route path="/recipe/:id/edit" element={<ProtectedRoute><EditRecipe /></ProtectedRoute>} />
        <Route path="/user/:id" element={<UserProfile />} />
        <Route path="/activity" element={<ProtectedRoute><Activity /></ProtectedRoute>} />
        <Route path="/saved" element={<ProtectedRoute><SavedRecipes /></ProtectedRoute>} />
        <Route path="/leaderboard" element={<Leaderboard />} />
      </Routes>
      <Toaster position="bottom-right" />
    </Layout>
  );
}
