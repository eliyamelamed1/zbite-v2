import { Link } from 'react-router-dom';

import ExploreCard from '../../../../features/recipes/components/ExploreCard/ExploreCard';
import { Recipe } from '../../../../types';
import styles from './LeaderboardRow.module.css';

interface LeaderboardRowProps {
  title: string;
  recipes: Recipe[];
  seeAllLink?: string;
}

/** Horizontal row of ExploreCards with a title and optional "See all" link. */
export default function LeaderboardRow({ title, recipes, seeAllLink }: LeaderboardRowProps) {
  if (recipes.length === 0) return null;

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        {seeAllLink && (
          <Link to={seeAllLink} className={styles.seeAll}>
            See all
          </Link>
        )}
      </div>
      <div className={styles.row}>
        {recipes.map((recipe) => (
          <div key={recipe._id} className={styles.cardWrapper}>
            <ExploreCard recipe={recipe} variant="minimal" />
          </div>
        ))}
      </div>
    </section>
  );
}
