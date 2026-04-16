import mongoose, { Schema } from 'mongoose';

interface ICookingReport {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  recipe: mongoose.Types.ObjectId;
  image: string;
  notes: string;
  createdAt: Date;
}

const cookingReportSchema = new Schema<ICookingReport>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  recipe: { type: Schema.Types.ObjectId, ref: 'Recipe', required: true },
  image: { type: String, default: '' },
  notes: { type: String, default: '', maxlength: 500 },
  createdAt: { type: Date, default: Date.now },
});

cookingReportSchema.index({ recipe: 1, createdAt: -1 });
cookingReportSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model<ICookingReport>('CookingReport', cookingReportSchema);
export type { ICookingReport };
