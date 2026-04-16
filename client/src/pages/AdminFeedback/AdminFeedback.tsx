import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

import api from '../../api/axios';
import { useAuth } from '../../features/auth';
import SEO from '../../components/(ui)/seo/SEO/SEO';
import styles from './AdminFeedback.module.css';

const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'new', label: 'New' },
  { value: 'planned', label: 'Planned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'not_planned', label: 'Not Planned' },
] as const;

const STATUS_VALUES = ['new', 'planned', 'in_progress', 'shipped', 'not_planned'] as const;

const STATUS_STYLE_MAP: Record<string, string> = {
  new: styles.statusNew,
  planned: styles.statusPlanned,
  in_progress: styles.statusInProgress,
  shipped: styles.statusShipped,
  not_planned: styles.statusNotPlanned,
};

const STATUS_LABEL_MAP: Record<string, string> = {
  new: 'New',
  planned: 'Planned',
  in_progress: 'In Progress',
  shipped: 'Shipped',
  not_planned: 'Not Planned',
};

interface FeedbackUser {
  _id: string;
  username: string;
  avatar: string;
}

interface FeedbackItem {
  _id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  isPublic: boolean;
  adminResponse?: string;
  user?: FeedbackUser;
  guestEmail?: string;
  createdAt: string;
}

export default function AdminFeedback() {
  const { user } = useAuth();
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [activeFilter, setActiveFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [responseInputs, setResponseInputs] = useState<Record<string, string>>({});
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());

  const fetchItems = useCallback(async (status: string) => {
    setIsLoading(true);
    try {
      const params = status ? { status } : {};
      const { data } = await api.get('/feedback/all', { params });
      setItems(data.data);
    } catch {
      toast.error('Failed to load feedback');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchItems(activeFilter); }, [activeFilter, fetchItems]);

  const updateItem = async (id: string, updates: Record<string, unknown>) => {
    setUpdatingIds((prev) => new Set(prev).add(id));
    try {
      const { data } = await api.patch(`/feedback/${id}`, updates);
      setItems((prev) => prev.map((item) => (item._id === id ? { ...item, ...data } : item)));
      toast.success('Updated');
    } catch {
      toast.error('Update failed');
    } finally {
      setUpdatingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleStatusChange = (id: string, status: string) => {
    updateItem(id, { status });
  };

  const handleTogglePublic = (id: string, isPublic: boolean) => {
    updateItem(id, { isPublic: !isPublic });
  };

  const handleSubmitResponse = (id: string) => {
    const text = responseInputs[id]?.trim();
    if (!text) return;
    updateItem(id, { adminResponse: text });
    setResponseInputs((prev) => ({ ...prev, [id]: '' }));
  };

  if (!user?.isAdmin) {
    return (
      <div className={styles.denied}>
        <div className={styles.deniedTitle}>Admin access required</div>
        <p>You don't have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <SEO title="Admin — Feedback" description="Manage user feedback submissions." />
      <h1 className={styles.title}>Manage Feedback</h1>

      <div className={styles.filters}>
        {STATUS_OPTIONS.map((tab) => (
          <button
            key={tab.value}
            className={`${styles.tab} ${activeFilter === tab.value ? styles.tabActive : ''}`}
            onClick={() => setActiveFilter(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading && <div className={styles.emptyState}>Loading...</div>}

      {!isLoading && items.length === 0 && (
        <div className={styles.emptyState}>No feedback items found.</div>
      )}

      {items.map((item) => (
        <div key={item._id} className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitle}>{item.title}</div>
            <span className={`${styles.statusBadge} ${STATUS_STYLE_MAP[item.status] ?? ''}`}>
              {STATUS_LABEL_MAP[item.status] ?? item.status}
            </span>
          </div>

          <div className={styles.cardMeta}>
            <span>{item.category}</span>
            {item.user && <span className={styles.cardAuthor}>by {item.user.username}</span>}
            {item.guestEmail && <span className={styles.cardAuthor}>{item.guestEmail}</span>}
            <span>{new Date(item.createdAt).toLocaleDateString()}</span>
          </div>

          <div className={styles.cardDescription}>{item.description}</div>

          <div className={styles.controls}>
            <select
              className={styles.select}
              value={item.status}
              onChange={(e) => handleStatusChange(item._id, e.target.value)}
              disabled={updatingIds.has(item._id)}
            >
              {STATUS_VALUES.map((s) => (
                <option key={s} value={s}>{STATUS_LABEL_MAP[s]}</option>
              ))}
            </select>

            <button
              className={`${styles.toggleBtn} ${item.isPublic ? styles.toggleBtnActive : ''}`}
              onClick={() => handleTogglePublic(item._id, item.isPublic)}
              disabled={updatingIds.has(item._id)}
            >
              {item.isPublic ? 'Public' : 'Hidden'}
            </button>
          </div>

          {item.adminResponse && (
            <div className={styles.adminResponse}>{item.adminResponse}</div>
          )}

          <div className={styles.responseForm}>
            <input
              className={styles.responseInput}
              placeholder="Add admin response..."
              value={responseInputs[item._id] ?? ''}
              onChange={(e) => setResponseInputs((prev) => ({ ...prev, [item._id]: e.target.value }))}
            />
            <button
              className={styles.responseBtn}
              onClick={() => handleSubmitResponse(item._id)}
              disabled={updatingIds.has(item._id) || !responseInputs[item._id]?.trim()}
            >
              Reply
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
