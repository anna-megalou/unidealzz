import { onSchedule } from 'firebase-functions/v2/scheduler';
import { logger } from 'firebase-functions/v2';
import { processEmailQueue as runEmailQueue } from '../services/email/emailSender';

export const processEmailQueue = onSchedule('every 1 minutes', async () => {
  const result = await runEmailQueue();
  logger.info('processEmailQueue completed', result);
});
