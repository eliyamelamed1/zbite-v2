import mongoose, { Schema } from 'mongoose';
import { ILike } from '../shared/types';

const likeSchema = new Schema<ILike>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  recipe: { type: Schema.Types.ObjectId, ref: 'Recipe', required: true },
  createdAt: { type: Date, default: Date.now },
});

likeSchema.index({ user: 1, recipe: 1 }, { unique: true });
likeSchema.index({ recipe: 1 });

export default mongoose.model<ILike>('Like', likeSchema);
