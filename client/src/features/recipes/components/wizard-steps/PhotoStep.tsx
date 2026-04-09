import ImageUpload from '../../../../components/(ui)/forms/ImageUpload/ImageUpload';
import styles from '../../../../pages/CreateRecipe/RecipeWizard.module.css';

interface PhotoStepProps {
  coverImage: File | null;
  onCoverChange: (file: File | null) => void;
}

export default function PhotoStep({ coverImage, onCoverChange }: PhotoStepProps): JSX.Element {
  return (
    <>
      <h2 className={styles.stepTitle}>Start with a photo</h2>
      <p className={styles.stepSubtitle}>Every great heirloom begins with a glimpse. Capture your creation or find it in your archives.</p>
      <ImageUpload value={coverImage} onChange={onCoverChange} />
    </>
  );
}
