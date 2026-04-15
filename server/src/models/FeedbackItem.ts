import mongoose, { Schema } from 'mongoose';

interface IFeedbackItem {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId | null;
  guestEmail: string;
  title: string;
  description: string;
  category: 'feature' | 'improvement' | 'bug' | 'other';
  status: 'new' | 'planned' | 'in_progress' | 'shipped' | 'not_planned';
  isPublic: boolean;
  adminResponse: string;
  createdAt: Date;
  updatedAt: Date;
}

const TITLE_MAX_LENGTH = 120;
const DESCRIPTION_MAX_LENGTH = 1000;

const feedbackItemSchema = new Schema<IFeedbackItem>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    guestEmail: { type: String, default: '' },
    title: { type: String, required: true, maxlength: TITLE_MAX_LENGTH },
    description: { type: String, required: true, maxlength: DESCRIPTION_MAX_LENGTH },
    category: { type: String, enum: ['feature', 'improvement', 'bug', 'other'], required: true },
    status: { type: String, enum: ['new', 'planned', 'in_progress', 'shipped', 'not_planned'], default: 'new' },
    isPublic: { type: Boolean, default: false },
    adminResponse: { type: String, default: '' },
  },
  { timestamps: true },
);

feedbackItemSchema.index({ status: 1, isPublic: 1, createdAt: -1 });
feedbackItemSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model<IFeedbackItem>('FeedbackItem', feedbackItemSchema);
export type { IFeedbackItem };
