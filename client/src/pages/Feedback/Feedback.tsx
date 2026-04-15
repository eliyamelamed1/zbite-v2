import { useState, useEffect } from 'react';

import api from '../../api/axios';
import { useAuth } from '../../features/auth';
import SEO from '../../components/(ui)/seo/SEO/SEO';
import styles from './Feedback.module.css';

const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'planned', label: 'Planned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'shipped', label: 'Shipped' },
] as const;

const CATEGORY_OPTIONS = [
  { value: 'feature', label: 'New Feature' },
  { value: 'improvement', label: 'Improvement' },
  { value: 'bug', label: 'Bug Report' },
  { value: 'other', label: 'Other' },
] as const;

interface FeedbackItem {
  _id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  adminResponse: string;
  createdAt: string;
}

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

export default function Feedback() {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('feature');
  const [guestEmail, setGuestEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [activeTab, setActiveTab] = useState('');
  const [publicItems, setPublicItems] = useState<FeedbackItem[]>([]);
  const [isLoadingBoard, setIsLoadingBoard] = useState(true);

  const fetchPublic = async (status: string) => {
    setIsLoadingBoard(true);
    try {
      const params = status ? { status } : {};
      const { data } = await api.get('/feedback/public', { params });
      setPublicItems(data.data);
    } catch {
      // Non-critical — board can fail gracefully
    } finally {
      setIsLoadingBoard(false);
    }
  };

  useEffect(() => { fetchPublic(activeTab); }, [activeTab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setIsSubmitting(true);
    try {
      const payload: Record<string, string> = { title, description, category };
      if (!user && guestEmail) {
        payload.guestEmail = guestEmail;
      }
      await api.post('/feedback', payload);
      setIsSubmitted(true);
      setTitle('');
      setDescription('');
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message || 'Failed to submit feedback';
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <SEO title="Feedback" description="Help shape zbite — share your suggestions and see what we're building." />
      <div className={styles.header}>
        <h1 className={styles.title}>Help shape zbite</h1>
        <p className={styles.subtitle}>
          We read every suggestion. We can&apos;t build everything, but we&apos;ll be clear about what we&apos;re doing.
        </p>
      </div>

      {isSubmitted ? (
        <div className={styles.success}>Thanks for your feedback! We&apos;ll review it soon.</div>
      ) : (
        <form className={styles.form} onSubmit={handleSubmit}>
          {submitError && <div className={styles.error}>{submitError}</div>}
          <div className={styles.field}>
            <label className={styles.label}>Title</label>
            <input className={styles.input} placeholder="Short summary of your idea" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} required />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Description</label>
            <textarea className={styles.textarea} placeholder="Tell us more..." value={description} onChange={(e) => setDescription(e.target.value)} maxLength={1000} required />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Category</label>
            <select className={styles.select} value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          {!user && (
            <div className={styles.field}>
              <label className={styles.label}>Your email (optional)</label>
              <input className={styles.input} type="email" placeholder="so we can follow up" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} />
            </div>
          )}
          <button className={styles.submitBtn} type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </form>
      )}

      <h2 className={styles.boardTitle}>What we&apos;re working on</h2>
      <div className={styles.tabs}>
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            className={`${styles.tab} ${activeTab === tab.value ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoadingBoard && <div className={styles.emptyState}>Loading...</div>}

      {!isLoadingBoard && publicItems.length === 0 && (
        <div className={styles.emptyState}>No items yet. Be the first to suggest something!</div>
      )}

      {publicItems.map((item) => (
        <div key={item._id} className={styles.card}>
          <div className={styles.cardTitle}>{item.title}</div>
          <div className={styles.cardMeta}>
            <span className={`${styles.statusBadge} ${STATUS_STYLE_MAP[item.status] ?? ''}`}>
              {STATUS_LABEL_MAP[item.status] ?? item.status}
            </span>
            <span>{CATEGORY_OPTIONS.find((c) => c.value === item.category)?.label ?? item.category}</span>
          </div>
          {item.adminResponse && (
            <div className={styles.adminResponse}>{item.adminResponse}</div>
          )}
        </div>
      ))}
    </div>
  );
}
