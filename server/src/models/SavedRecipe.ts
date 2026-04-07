import mongoose, { Schema } from 'mongoose';
import { ISavedRecipe } from '../shared/types';

const savedRecipeSchema = new Schema<ISavedRecipe>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  recipe: { type: Schema.Types.ObjectId, ref: 'Recipe', required: true },
  savedAt: { type: Date, default: Date.now },
});

savedRecipeSchema.index({ user: 1, recipe: 1 }, { unique: true });
savedRecipeSchema.index({ user: 1, savedAt: -1 });

export default mongoose.model<ISavedRecipe>('SavedRecipe', savedRecipeSchema);
