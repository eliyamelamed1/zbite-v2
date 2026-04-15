import SEO from '../../components/(ui)/seo/SEO/SEO';

const WEBSITE_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'zbite',
  url: '/',
  description: 'Pick your mood, get a recipe, start cooking. A mood-based recipe decider with social cooking community.',
  potentialAction: {
    '@type': 'SearchAction',
    target: '/search?q={search_term_string}',
    'query-input': 'required name=search_term_string',
  },
};
import HeroSection from './components/HeroSection/HeroSection';
import LeaderboardRow from './components/LeaderboardRow/LeaderboardRow';
import SkeletonRow from './components/SkeletonRow/SkeletonRow';
import { useHomeData } from './hooks/useHomeData';
import styles from './Home.module.css';

const SKELETON_ROW_COUNT = 3;

/** Home page -- personalized recipe rows for logged-in users, generic rows for guests. */
export default function Home() {
  const { data, isLoading } = useHomeData();

  return (
    <>
      <SEO jsonLd={WEBSITE_JSON_LD} />
      <HeroSection />
    <div className={styles.page}>

      {isLoading && Array.from({ length: SKELETON_ROW_COUNT }, (_, i) => (
        <SkeletonRow key={i} />
      ))}

      {data.recentlyViewed.length > 0 && (
        <LeaderboardRow title="Recently Viewed" recipes={data.recentlyViewed} />
      )}

      {data.cookedBefore.length > 0 && (
        <LeaderboardRow title="Cooked Before" recipes={data.cookedBefore} />
      )}

      {data.goTo.length > 0 && (
        <LeaderboardRow title="Make It Again" recipes={data.goTo} seeAllLink="/saved" />
      )}

      {data.interestRows.map((row) => (
        <LeaderboardRow
          key={row.interest}
          title={`${row.interest} for You`}
          recipes={row.recipes}
          seeAllLink={`/feed?tag=${row.interest}`}
        />
      ))}

      {data.quickTonight.length > 0 && (
        <LeaderboardRow title="Ready in 30" recipes={data.quickTonight} seeAllLink="/feed?sort=quick" />
      )}

      <LeaderboardRow title="What Others Are Cooking" recipes={data.trending} seeAllLink="/feed?sort=trending" />

      {data.newThisWeek.length > 0 && (
        <LeaderboardRow title="Just Added" recipes={data.newThisWeek} seeAllLink="/feed?sort=recent" />
      )}
    </div>
    </>
  );
}
