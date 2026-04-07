import mongoose, { Schema } from 'mongoose';
import { IComment } from '../shared/types';

const commentSchema = new Schema<IComment>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    recipe: { type: Schema.Types.ObjectId, ref: 'Recipe', required: true },
    text: { type: String, required: true, maxlength: 1000 },
  },
  { timestamps: true }
);

commentSchema.index({ recipe: 1, createdAt: -1 });

export default mongoose.model<IComment>('Comment', commentSchema);
