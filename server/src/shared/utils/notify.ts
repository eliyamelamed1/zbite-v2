import Notification from '../../models/Notification';

interface NotifyParams {
  recipient: string;
  sender: string;
  type: 'like' | 'follow' | 'save' | 'rate' | 'comment' | 'mention' | 'cooking_report';
  recipe?: string;
}

/** Creates a notification. Skips if sender and recipient are the same user. */
export async function createNotification({ recipient, sender, type, recipe }: NotifyParams): Promise<void> {
  if (recipient === sender) return;

  await Notification.create({
    recipient,
    sender,
    type,
    ...(recipe && { recipe }),
  });
}
