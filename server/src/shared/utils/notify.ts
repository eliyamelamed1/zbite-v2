import Notification from '../../models/Notification';
import { sendToUser } from './sse-connections';

interface NotifyParams {
  recipient: string;
  sender: string;
  type: 'follow' | 'save' | 'comment' | 'mention' | 'cooking_report';
  recipe?: string;
}

/** High-value notification types that deserve a real-time toast on the client. */
const TOAST_WORTHY_TYPES = new Set(['follow', 'comment', 'cooking_report']);

/** Creates a notification and pushes it via SSE if the recipient is connected. */
export async function createNotification({ recipient, sender, type, recipe }: NotifyParams): Promise<void> {
  if (recipient === sender) return;

  const notification = await Notification.create({
    recipient,
    sender,
    type,
    ...(recipe && { recipe }),
  });

  // Push via SSE — non-blocking, never fails the caller
  const isToastWorthy = TOAST_WORTHY_TYPES.has(type);
  sendToUser(recipient, 'notification', {
    id: notification._id,
    type,
    isToastWorthy,
  });
}
