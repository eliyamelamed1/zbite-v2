import mongoose, { Schema } from 'mongoose';
import { IRecipe } from '../shared/types';
import { CATEGORIES } from '../constants/categories';

const recipeSchema = new Schema<IRecipe>(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, required: true, maxlength: 500 },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    category: { type: String, enum: CATEGORIES, default: 'Italian' },
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
    averageRating: { type: Number, default: 0 },
    ratingsCount: { type: Number, default: 0 },
    likesCount: { type: Number, default: 0 },
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
recipeSchema.index({ averageRating: -1, ratingsCount: -1 });
recipeSchema.index({ category: 1, createdAt: -1 });

export default mongoose.model<IRecipe>('Recipe', recipeSchema);
