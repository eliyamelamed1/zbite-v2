import mongoose, { Schema } from 'mongoose';
import { IRecipe } from '../shared/types';
import { computeSystemTags } from '../modules/recipe/recipe.utils';

const recipeSchema = new Schema<IRecipe>(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, required: true, maxlength: 500 },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    tags: { type: [String], default: [] },
    systemTags: { type: [String], default: [] },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
    cookingTime: { type: Number, required: true },
    servings: { type: Number, required: true, min: 1 },
    ingredients: [{ name: { type: String, required: true }, amount: { type: String, required: true } }],
    steps: [{
      order: { type: Number, required: true },
      title: { type: String, default: '' },
      instruction: { type: String, required: true },
      image: { type: String, default: '' },
    }],
    nutrition: {
      calories: { type: Number, default: 0 },
      protein: { type: Number, default: 0 },
      carbs: { type: Number, default: 0 },
      fat: { type: Number, default: 0 },
    },
    coverImage: { type: String, required: true },
    status: { type: String, enum: ['draft', 'published'], default: 'published' },
    commentsCount: { type: Number, default: 0 },
    savesCount: { type: Number, default: 0 },
    reportsCount: { type: Number, default: 0 },
    viewsCount: { type: Number, default: 0 },
    recipeScore: { type: Number, default: 0 },
  },
  { timestamps: true }
);

recipeSchema.index({ author: 1 });
recipeSchema.index({ createdAt: -1 });
recipeSchema.index({ recipeScore: -1, createdAt: -1 });
recipeSchema.index({ tags: 1, createdAt: -1 });
recipeSchema.index({ tags: 1, recipeScore: -1 });
recipeSchema.index({ systemTags: 1 });
recipeSchema.index(
  { title: 'text', description: 'text' },
  { weights: { title: 10, description: 1 } },
);

/** Auto-compute system tags before every save. */
recipeSchema.pre('save', function preSaveSystemTags() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Mongoose 'this' in pre-hooks is untyped
  const doc = this as any;
  doc.systemTags = computeSystemTags(doc);
});

/** Recompute system tags when ingredients, cookingTime, nutrition, difficulty, or steps change via update. */
recipeSchema.pre('findOneAndUpdate', async function preUpdateSystemTags() {
  const update = this.getUpdate() as Record<string, unknown> | undefined;
  if (!update) return;

  const fieldsToWatch = ['ingredients', 'cookingTime', 'nutrition', 'difficulty', 'steps'];
  const hasRelevantChange = fieldsToWatch.some((field) => field in update || (`$set` in update && field in (update.$set as Record<string, unknown>)));
  if (!hasRelevantChange) return;

  const docId = this.getQuery()._id;
  if (!docId) return;

  const existing = await mongoose.model('Recipe').findById(docId).lean();
  if (!existing) return;

  const merged = { ...existing, ...update };
  const newSystemTags = computeSystemTags(merged as unknown as Parameters<typeof computeSystemTags>[0]);
  this.set({ systemTags: newSystemTags });
});

export default mongoose.model<IRecipe>('Recipe', recipeSchema);
