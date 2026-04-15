import styles from './ResultSkeleton.module.css';

const SKELETON_COUNT = 3;

/** Shimmer placeholder mimicking ResultCards while recommendations load. */
export default function ResultSkeleton() {
  return (
    <div className={styles.grid}>
      {Array.from({ length: SKELETON_COUNT }, (_, i) => (
        <div key={i} className={styles.card}>
          <div className={styles.cardImage} />
          <div className={styles.cardBody}>
            <div className={styles.cardTitle} />
            <div className={styles.cardMeta}>
              <div className={styles.cardMetaItem} />
              <div className={styles.cardMetaItem} />
            </div>
            <div className={styles.cardAuthor}>
              <div className={styles.cardAvatar} />
              <div className={styles.cardName} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
