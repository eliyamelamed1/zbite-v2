import TagChips from '../../../../components/(ui)/forms/CategoryChips/CategoryChips';
import { CUISINE_TAGS, DISH_TYPE_TAGS, DIETARY_TAGS, MEAL_TYPE_TAGS } from '../../../../types';
import styles from '../../../../pages/CreateRecipe/RecipeWizard.module.css';

const MAX_REGULAR_TAGS = 5;
const MAX_MEAL_TAGS = 2;

const MEAL_TAG_SET = new Set<string>(MEAL_TYPE_TAGS);

const TAG_SECTIONS = [
  { label: 'Cuisine', tags: CUISINE_TAGS },
  { label: 'Dish Type', tags: DISH_TYPE_TAGS },
  { label: 'Dietary & Lifestyle', tags: DIETARY_TAGS },
] as const;

interface BasicsStepProps {
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  cookingTime: string;
  servings: number;
  tags: string[];
  onTitleChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  onDifficultyChange: (v: 'easy' | 'medium' | 'hard') => void;
  onCookingTimeChange: (v: string) => void;
  onServingsChange: (v: number) => void;
  onTagsChange: (v: string[]) => void;
}

export default function BasicsStep(props: BasicsStepProps): JSX.Element {
  const { title, description, difficulty, cookingTime, servings, tags } = props;

  const regularTags = tags.filter((t) => !MEAL_TAG_SET.has(t));
  const mealTags = tags.filter((t) => MEAL_TAG_SET.has(t));

  const handleRegularChange = (updated: string[]): void => {
    props.onTagsChange([...updated, ...mealTags]);
  };

  const handleMealChange = (updated: string[]): void => {
    props.onTagsChange([...regularTags, ...updated]);
  };

  return (
    <>
      <h2 className={styles.stepTitle}>The Basics</h2>
      <p className={styles.stepSubtitle}>Tell us about your creation.</p>
      <div className={styles.field}>
        <label className={styles.label}>What did you make?</label>
        <input className={styles.input} placeholder="e.g. Grandma's Sourdough" value={title} onChange={(e) => props.onTitleChange(e.target.value)} />
      </div>
      <div className={styles.field}>
        <label className={styles.label}>Tell us about it...</label>
        <textarea className={styles.textarea} placeholder="Share the story behind this dish" value={description} onChange={(e) => props.onDescriptionChange(e.target.value)} />
      </div>
      <div className={styles.field}>
        <label className={styles.label}>Difficulty</label>
        <div className={styles.difficultyRow}>
          {(['easy', 'medium', 'hard'] as const).map((d) => (
            <button key={d} className={`${styles.difficultyPill} ${difficulty === d ? styles.difficultyPillActive : ''}`} onClick={() => props.onDifficultyChange(d)}>{d}</button>
          ))}
        </div>
      </div>
      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label}>Cooking time</label>
          <input className={styles.input} type="number" placeholder="Min" value={cookingTime} onChange={(e) => props.onCookingTimeChange(e.target.value)} />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Servings</label>
          <div className={styles.stepper}>
            <button className={styles.stepperBtn} onClick={() => props.onServingsChange(Math.max(1, servings - 1))}>-</button>
            <span className={styles.stepperValue}>{servings}</span>
            <button className={styles.stepperBtn} onClick={() => props.onServingsChange(servings + 1)}>+</button>
          </div>
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Tags (1–5)</label>
        {TAG_SECTIONS.map((section) => (
          <div key={section.label} className={styles.tagSection}>
            <span className={styles.tagSectionLabel}>{section.label}</span>
            <TagChips
              multi
              tags={section.tags}
              selected={regularTags}
              onChange={handleRegularChange}
              maxSelections={MAX_REGULAR_TAGS}
              showAll={false}
            />
          </div>
        ))}
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Best for</label>
        <span className={styles.tagSectionSubtitle}>When would someone usually eat this?</span>
        <TagChips
          multi
          tags={MEAL_TYPE_TAGS}
          selected={mealTags}
          onChange={handleMealChange}
          maxSelections={MAX_MEAL_TAGS}
          showAll={false}
        />
      </div>
    </>
  );
}
