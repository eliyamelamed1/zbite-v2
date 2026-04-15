import styles from './Skeleton.module.css';

const SKELETON_CARD_HEIGHTS = [180, 220, 160, 200, 190, 170] as const;
const SKELETON_CARD_COUNT = 6;

/** A single skeleton card that mimics an ExploreCard layout. */
function SkeletonCard({ height }: { height: number }): JSX.Element {
  return (
    <div className={styles.card}>
      <div className={`${styles.bone} ${styles.cardImage}`} style={{ height }} />
      <div className={styles.cardBody}>
        <div className={styles.cardStats}>
          <div className={`${styles.bone} ${styles.cardStatsLeft}`} />
          <div className={`${styles.bone} ${styles.cardStatsRight}`} />
        </div>
        <div className={`${styles.bone} ${styles.cardTitle}`} />
        <div className={styles.cardAuthor}>
          <div className={`${styles.bone} ${styles.cardAvatar}`} />
          <div className={`${styles.bone} ${styles.cardName}`} />
        </div>
        <div className={styles.cardMeta}>
          <div className={`${styles.bone} ${styles.cardMetaItem}`} />
          <div className={`${styles.bone} ${styles.cardMetaItem}`} />
        </div>
      </div>
    </div>
  );
}

/** Grid of skeleton cards for loading state in masonry layouts. */
export default function SkeletonGrid(): JSX.Element {
  return (
    <>
      {Array.from({ length: SKELETON_CARD_COUNT }, (_, index) => (
        <SkeletonCard
          key={index}
          height={SKELETON_CARD_HEIGHTS[index % SKELETON_CARD_HEIGHTS.length]}
        />
      ))}
    </>
  );
}
