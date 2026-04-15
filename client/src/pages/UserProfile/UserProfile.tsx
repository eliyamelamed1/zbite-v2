import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Trophy, Flame, CookingPot, UtensilsCrossed, Bookmark } from 'lucide-react';
import toast from 'react-hot-toast';

import { useAuth } from '../../features/auth';
import { getProfile, updateProfile } from '../../features/profile/api/profile';
import { followUser, unfollowUser, getFollowStatus } from '../../features/social/api/users';
import { getUserRecipes, getSavedRecipes } from '../../features/recipes/api/recipes';
import { getMyStreak, getUserAchievements } from '../../features/gamification';
import { imageUrl, handleImageError } from '../../utils/imageUrl';
import { getAvatarUrl } from '../../utils/getAvatarUrl';
import ImageUpload from '../../components/(ui)/forms/ImageUpload/ImageUpload';
import SEO from '../../components/(ui)/seo/SEO/SEO';
import styles from './UserProfile.module.css';

import type { User, Recipe, CookingStreak, Achievement } from '../../types';

/** Maps achievement type keys to human-readable badge labels. */
const ACHIEVEMENT_LABELS: Record<string, string> = {
  first_cook: 'First Cook',
  week_streak: '7-Day Streak',
  month_streak: '30-Day Streak',
  '5_cuisines': '5 Cuisines',
  '10_recipes': '10 Recipes',
  '50_recipes': '50 Recipes',
};

export default function UserProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: me, updateUser } = useAuth();
  const [profile, setProfile] = useState<User | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState('recipes');
  const [showEdit, setShowEdit] = useState(false);
  const [editBio, setEditBio] = useState('');
  const [editAvatar, setEditAvatar] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState<CookingStreak | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  const isOwner = me && me._id === id;

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setActiveTab('recipes');
    const load = async () => {
      try {
        const [profileRes, recipesRes] = await Promise.all([getProfile(id), getUserRecipes(id, 1)]);
        setProfile(profileRes.data.user);
        setRecipes(recipesRes.data.data);
        setEditBio(profileRes.data.user.bio || '');
        if (me && me._id !== id) {
          const f = await getFollowStatus(id).catch(() => ({ data: { following: false } }));
          setIsFollowing(f.data.following);
        }
        getUserAchievements(id)
          .then((achievementData) => setAchievements(achievementData))
          .catch(() => { /* Non-critical — achievements optional */ });
        if (me && me._id === id) {
          getSavedRecipes(1).then((r) => setSavedRecipes(r.data.data)).catch(() => { /* Non-critical */ });
          getMyStreak()
            .then((streakData) => setStreak(streakData))
            .catch(() => { /* Non-critical — streak data optional */ });
        }
      } catch { toast.error('Failed to load profile'); setProfile(null); }
      finally { setLoading(false); }
    };
    load();
  }, [id, me]);

  const handleFollow = async () => {
    if (!id) return;
    if (isFollowing) { await unfollowUser(id); setIsFollowing(false); setProfile((p) => p ? { ...p, followersCount: p.followersCount - 1 } : p); }
    else { await followUser(id); setIsFollowing(true); setProfile((p) => p ? { ...p, followersCount: p.followersCount + 1 } : p); }
  };

  const handleSaveProfile = async () => {
    const formData = new FormData();
    formData.append('bio', editBio);
    if (editAvatar) formData.append('avatar', editAvatar);
    const res = await updateProfile(formData);
    setProfile(res.data.user);
    updateUser(res.data.user);
    setShowEdit(false);
  };

  if (loading) return <div className={styles.loading}>Loading profile...</div>;
  if (!profile) return <div className={styles.loading}>User not found</div>;

  const displayRecipes = activeTab === 'recipes' ? recipes : savedRecipes;

  return (
    <div>
      <SEO
        title={`@${profile.username}`}
        description={profile.bio ?? `Check out ${profile.username}'s recipes on zbite`}
        image={getAvatarUrl(profile.avatar, profile.username)}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Person',
          name: profile.username,
          description: profile.bio ?? '',
          image: getAvatarUrl(profile.avatar, profile.username),
        }}
      />
      <div className={styles.header}>
        <img className={styles.avatar} src={getAvatarUrl(profile.avatar, profile.username)} alt={profile.username} />
        <h1 className={styles.username}>@{profile.username}</h1>
        {profile.bio && <p className={styles.bio}>{profile.bio}</p>}
        <div className={styles.stats}>
          <div className={styles.stat}><span className={styles.statCount}>{profile.recipesCount || recipes.length}</span><span className={styles.statLabel}>Recipes</span></div>
          <div className={`${styles.stat} ${styles.statClickable}`} onClick={() => navigate(`/user/${id}/followers`)}><span className={styles.statCount}>{profile.followersCount}</span><span className={styles.statLabel}>Followers</span></div>
          <div className={`${styles.stat} ${styles.statClickable}`} onClick={() => navigate(`/user/${id}/following`)}><span className={styles.statCount}>{profile.followingCount}</span><span className={styles.statLabel}>Following</span></div>
        </div>
        <div className={styles.scoreStats}>
          <div className={styles.scoreStat}>
            <span className={styles.scoreIcon}><Trophy size={14} /></span>
            <span className={styles.scoreValue}>{profile.chefScore > 0 ? Math.round(profile.chefScore) : '&#8212;'}</span>
            <span className={styles.scoreLabel}>Chef Score</span>
          </div>
        </div>
        {isOwner && streak && (
          <div className={styles.cookingStats}>
            <div className={styles.cookingStat}>
              <span className={styles.cookingStatIcon}><Flame size={14} /></span>
              <span className={styles.cookingStatValue}>{streak.currentStreak}-day streak</span>
            </div>
            <div className={styles.cookingStat}>
              <span className={styles.cookingStatIcon}><CookingPot size={14} /></span>
              <span className={styles.cookingStatValue}>{streak.totalCooked} cooked</span>
            </div>
          </div>
        )}
        {achievements.length > 0 && (
          <div className={styles.badges}>
            {achievements.map((a) => (
              <span key={a._id} className={styles.badge}>
                {ACHIEVEMENT_LABELS[a.type] ?? a.type}
              </span>
            ))}
          </div>
        )}
        <div className={styles.actions}>
          {isOwner ? (
            <button className={styles.editBtn} onClick={() => setShowEdit(true)}>Edit Profile</button>
          ) : (
            <>
              {me && <button className={isFollowing ? styles.unfollowBtn : styles.followBtn} onClick={handleFollow}>{isFollowing ? 'Following' : 'Follow'}</button>}
            </>
          )}
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.tabs}>
          <button className={`${styles.tab} ${activeTab === 'recipes' ? styles.tabActive : ''}`} onClick={() => setActiveTab('recipes')}><UtensilsCrossed size={14} /> Recipes</button>
          {isOwner && <button className={`${styles.tab} ${activeTab === 'saved' ? styles.tabActive : ''}`} onClick={() => setActiveTab('saved')}><Bookmark size={14} /> Saved</button>}
        </div>

        {displayRecipes.length > 0 ? (
          <div className={styles.profileGrid}>
            {displayRecipes.map((r) => (
              <div key={r._id} className={styles.profileGridItem} onClick={() => navigate(`/recipe/${r._id}`)}>
                <img src={imageUrl(r.coverImage)} alt={r.title} onError={handleImageError} loading="lazy" />
                <div className={styles.gridOverlay}>
                  <span className={styles.gridTitle}>{r.title}</span>
                </div>
                <span className={`${styles.gridDifficulty} ${styles[r.difficulty]}`}>
                  {r.difficulty}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.empty}>{activeTab === 'recipes' ? 'No recipes yet' : 'No saved recipes'}</div>
        )}
      </div>

      {showEdit && (
        <div className={styles.editModal} onClick={(e) => e.target === e.currentTarget && setShowEdit(false)}>
          <div className={styles.editCard}>
            <h2 className={styles.editTitle}>Edit Profile</h2>
            <div className={styles.field}><label className={styles.label}>Avatar</label><ImageUpload value={editAvatar} onChange={setEditAvatar} existingUrl={profile.avatar} /></div>
            <div className={styles.field}><label className={styles.label}>Bio</label><textarea className={styles.input} rows={3} maxLength={300} value={editBio} onChange={(e) => setEditBio(e.target.value)} /></div>
            <div className={styles.editActions}><button className={styles.cancelBtn} onClick={() => setShowEdit(false)}>Cancel</button><button className={styles.saveBtn} onClick={handleSaveProfile}>Save</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
