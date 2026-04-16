import mongoose, { Schema } from 'mongoose';

interface IUserActivity {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  action: 'view' | 'save' | 'cook';
  recipe: mongoose.Types.ObjectId;
  createdAt: Date;
}

const ACTIVITY_TTL_SECONDS = 90 * 24 * 60 * 60; // 90 days

const userActivitySchema = new Schema<IUserActivity>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, enum: ['view', 'save', 'cook'], required: true },
  recipe: { type: Schema.Types.ObjectId, ref: 'Recipe', required: true },
  createdAt: { type: Date, default: Date.now },
});

// Personalization queries: "recent views/cooks by user"
userActivitySchema.index({ user: 1, action: 1, createdAt: -1 });

// Dedup check: "did this user already view this recipe recently?"
userActivitySchema.index({ user: 1, action: 1, recipe: 1, createdAt: -1 });

// Auto-expire after 90 days — keeps the collection lean
userActivitySchema.index({ createdAt: 1 }, { expireAfterSeconds: ACTIVITY_TTL_SECONDS });

export default mongoose.model<IUserActivity>('UserActivity', userActivitySchema);
export type { IUserActivity };
