import mongoose, { Schema } from 'mongoose';

interface ICollection {
  _id: mongoose.Types.ObjectId;
  name: string;
  description: string;
  owner: mongoose.Types.ObjectId;
  recipes: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const collectionSchema = new Schema<ICollection>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, default: '', maxlength: 300 },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    recipes: [{ type: Schema.Types.ObjectId, ref: 'Recipe' }],
  },
  { timestamps: true },
);

collectionSchema.index({ owner: 1, createdAt: -1 });

export default mongoose.model<ICollection>('Collection', collectionSchema);
export type { ICollection };
