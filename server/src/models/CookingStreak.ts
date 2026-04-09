import mongoose, { Schema } from 'mongoose';

interface ICookingStreak {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  currentStreak: number;
  longestStreak: number;
  lastCookDate: Date | null;
  totalCooked: number;
}

const cookingStreakSchema = new Schema<ICookingStreak>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  currentStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  lastCookDate: { type: Date, default: null },
  totalCooked: { type: Number, default: 0 },
});

export default mongoose.model<ICookingStreak>('CookingStreak', cookingStreakSchema);
export type { ICookingStreak };
