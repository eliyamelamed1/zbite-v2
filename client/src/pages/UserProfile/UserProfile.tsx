import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getProfile, updateProfile, followUser, unfollowUser, getFollowStatus } from '../../api/users';
import { getUserRecipes, getSavedRecipes } from '../../api/recipes';
import { imageUrl } from '../../utils/imageUrl';
import ImageUpload from '../../components/ImageUpload/ImageUpload';
import { User, Recipe } from '../../types';
import styles from './UserProfile.module.css';

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
        if (me && me._id === id) {
          getSavedRecipes(1).then((r) => setSavedRecipes(r.data.data)).catch((err) => console.error(err));
        }
      } catch (err) { console.error(err); setProfile(null); }
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
      <div className={styles.header}>
        <img className={styles.avatar} src={imageUrl(profile.avatar) || `https://ui-avatars.com/api/?name=${profile.username}&size=90&background=F0E0D0&color=2D1810`} alt={profile.username} />
        <h1 className={styles.username}>@{profile.username}</h1>
        {profile.bio && <p className={styles.bio}>{profile.bio}</p>}
        <div className={styles.stats}>
          <div className={styles.stat}><span className={styles.statCount}>{profile.recipesCount || recipes.length}</span><span className={styles.statLabel}>Recipes</span></div>
          <div className={styles.stat}><span className={styles.statCount}>{profile.followersCount}</span><span className={styles.statLabel}>Followers</span></div>
          <div className={styles.stat}><span className={styles.statCount}>{profile.followingCount}</span><span className={styles.statLabel}>Following</span></div>
        </div>
        <div className={styles.actions}>
          {isOwner ? (
            <button className={styles.editBtn} onClick={() => setShowEdit(true)}>Edit Profile</button>
          ) : (
            <>
              {me && <button className={isFollowing ? styles.unfollowBtn : styles.followBtn} onClick={handleFollow}>{isFollowing ? 'Following' : 'Follow'}</button>}
              <button className={styles.messageBtn}>Message</button>
            </>
          )}
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.tabs}>
          <button className={`${styles.tab} ${activeTab === 'recipes' ? styles.tabActive : ''}`} onClick={() => setActiveTab('recipes')}>🍽 Recipes</button>
          {isOwner && <button className={`${styles.tab} ${activeTab === 'saved' ? styles.tabActive : ''}`} onClick={() => setActiveTab('saved')}>🔖 Saved</button>}
        </div>

        {displayRecipes.length > 0 ? (
          <div className={styles.profileGrid}>
            {displayRecipes.map((r) => (
              <div key={r._id} className={styles.profileGridItem} onClick={() => navigate(`/recipe/${r._id}`)}>
                <img src={imageUrl(r.coverImage)} alt={r.title} />
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
