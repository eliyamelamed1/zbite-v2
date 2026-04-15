import { useState, useEffect } from 'react';
import { ONE_DAY_HOURS, ONE_WEEK_HOURS } from '../../utils/constants';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getNotifications, markNotificationsRead } from '../../features/social/api/notifications';
import { getAvatarUrl } from '../../utils/getAvatarUrl';
import { timeAgo } from '../../utils/timeAgo';
import { Notification } from '../../types';
import SEO from '../../components/(ui)/seo/SEO/SEO';
import styles from './Activity.module.css';

function getActionText(n: Notification): string {
  switch (n.type) {
    case 'follow': return 'started following you';
    case 'save': return `saved your ${n.recipe?.title || 'recipe'}`;
    case 'comment': return `commented on your ${n.recipe?.title || 'recipe'}`;
    case 'mention': return `mentioned you in a comment`;
    case 'cooking_report': return `cooked your ${n.recipe?.title || 'recipe'}`;
    default: return 'interacted with you';
  }
}

function groupByTime(notifications: Notification[]): { label: string; items: Notification[] }[] {
  const now = Date.now();
  const today: Notification[] = [];
  const thisWeek: Notification[] = [];
  const earlier: Notification[] = [];

  notifications.forEach((n) => {
    const diff = now - new Date(n.createdAt).getTime();
    const hours = diff / (1000 * 60 * 60);
    if (hours < ONE_DAY_HOURS) today.push(n);
    else if (hours < ONE_WEEK_HOURS) thisWeek.push(n);
    else earlier.push(n);
  });

  const groups = [];
  if (today.length) groups.push({ label: 'Today', items: today });
  if (thisWeek.length) groups.push({ label: 'This Week', items: thisWeek });
  if (earlier.length) groups.push({ label: 'Earlier', items: earlier });
  return groups;
}

export default function Activity() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getNotifications()
      .then((res) => {
        setNotifications(res.data.data);
        markNotificationsRead().catch(() => { /* Non-critical */ });
      })
      .catch(() => toast.error('Failed to load notifications'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className={styles.page}><div className={styles.empty}>Loading...</div></div>;

  const groups = groupByTime(notifications);

  return (
    <div className={styles.page}>
      <SEO title="Activity" description="Your recent notifications and updates." noindex />
      <h1 className={styles.title}>Activity</h1>
      {groups.length === 0 && <div className={styles.empty}>No activity yet</div>}
      {groups.map((group) => (
        <div key={group.label} className={styles.group}>
          <div className={styles.groupTitle}>{group.label}</div>
          {group.items.map((n) => (
            <div key={n._id} className={`${styles.item} ${n.recipe ? styles.itemClickable : ''}`} onClick={() => n.recipe && navigate(`/recipe/${n.recipe._id}`)}>
              <img className={styles.avatar} src={getAvatarUrl(n.sender.avatar, n.sender.username)} alt={n.sender.username} />
              <div className={styles.text}><strong>@{n.sender.username}</strong> {getActionText(n)}</div>
              <span className={styles.time}>{timeAgo(n.createdAt)}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
