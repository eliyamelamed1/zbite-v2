import mongoose, { Schema } from 'mongoose';
import { IRating } from '../shared/types';

const ratingSchema = new Schema<IRating>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    recipe: { type: Schema.Types.ObjectId, ref: 'Recipe', required: true },
    stars: { type: Number, required: true, min: 1, max: 5 },
  },
  { timestamps: true }
);

ratingSchema.index({ user: 1, recipe: 1 }, { unique: true });
ratingSchema.index({ recipe: 1 });

export default mongoose.model<IRating>('Rating', ratingSchema);
