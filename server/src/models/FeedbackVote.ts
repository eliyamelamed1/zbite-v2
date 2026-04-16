import mongoose, { Schema } from 'mongoose';

interface IFeedbackVote {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  feedbackItem: mongoose.Types.ObjectId;
  createdAt: Date;
}

const feedbackVoteSchema = new Schema<IFeedbackVote>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  feedbackItem: { type: Schema.Types.ObjectId, ref: 'FeedbackItem', required: true },
  createdAt: { type: Date, default: Date.now },
});

// One vote per user per feedback item
feedbackVoteSchema.index({ user: 1, feedbackItem: 1 }, { unique: true });
feedbackVoteSchema.index({ feedbackItem: 1 });

export default mongoose.model<IFeedbackVote>('FeedbackVote', feedbackVoteSchema);
export type { IFeedbackVote };
