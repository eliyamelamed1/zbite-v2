import styles from './SkeletonRow.module.css';

const CARD_COUNT = 4;

/** Shimmer placeholder mimicking a LeaderboardRow while data loads. */
export default function SkeletonRow() {
  return (
    <section className={styles.section}>
      <div className={styles.titleBone} />
      <div className={styles.row}>
        {Array.from({ length: CARD_COUNT }, (_, i) => (
          <div key={i} className={styles.card}>
            <div className={styles.cardImage} />
            <div className={styles.cardBody}>
              <div className={styles.cardTitle} />
              <div className={styles.cardMeta}>
                <div className={styles.cardMetaItem} />
                <div className={styles.cardMetaItem} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
