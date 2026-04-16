import mongoose, { Schema } from 'mongoose';

const ACHIEVEMENT_TYPES = [
  'first_cook',
  'week_streak',
  'month_streak',
  '5_cuisines',
  '10_recipes',
  '50_recipes',
  'first_report',
] as const;

interface IAchievement {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  type: string;
  unlockedAt: Date;
}

const achievementSchema = new Schema<IAchievement>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ACHIEVEMENT_TYPES, required: true },
  unlockedAt: { type: Date, default: Date.now },
});

achievementSchema.index({ user: 1, type: 1 }, { unique: true });

export default mongoose.model<IAchievement>('Achievement', achievementSchema);
export type { IAchievement };
export { ACHIEVEMENT_TYPES };
