import mongoose, { Schema } from 'mongoose';
import { INotification } from '../shared/types';

const notificationSchema = new Schema<INotification>({
  recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['follow', 'save', 'comment', 'mention', 'cooking_report'],
    required: true,
  },
  recipe: { type: Schema.Types.ObjectId, ref: 'Recipe' },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, read: 1 });

export default mongoose.model<INotification>('Notification', notificationSchema);
