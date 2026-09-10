import { desc } from 'drizzle-orm';
import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { getDb } from '@/db';
import {
  generationAttempts,
  generationJobs,
  payment,
  paymentWebhooks,
} from '@/db/app.schema';
import {
  OPERATIONAL_SETTING_DEFAULTS,
  updateOperationalSetting,
} from '@/generation/settings';
import { adminApiMiddleware } from '@/middlewares/admin-middleware';

const keySchema = z.enum(
  Object.keys(OPERATIONAL_SETTING_DEFAULTS) as [
    keyof typeof OPERATIONAL_SETTING_DEFAULTS,
    ...(keyof typeof OPERATIONAL_SETTING_DEFAULTS)[],
  ]
);

export const getGenerationOperations = createServerFn({ method: 'GET' })
  .middleware([adminApiMiddleware])
  .handler(async () => ({
    jobs: await getDb()
      .select()
      .from(generationJobs)
      .orderBy(desc(generationJobs.createdAt))
      .limit(100),
    attempts: await getDb()
      .select()
      .from(generationAttempts)
      .orderBy(desc(generationAttempts.createdAt))
      .limit(200),
  }));

export const saveOperationalSetting = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      key: keySchema,
      value: z.union([z.boolean(), z.number().int().nonnegative()]),
    })
  )
  .middleware([adminApiMiddleware])
  .handler(({ data, context }) =>
    updateOperationalSetting(data.key, data.value, context.userId)
  );

export const getNoddiOrders = createServerFn({ method: 'GET' })
  .middleware([adminApiMiddleware])
  .handler(async () => ({
    payments: await getDb()
      .select()
      .from(payment)
      .orderBy(desc(payment.createdAt))
      .limit(100),
    webhooks: await getDb()
      .select()
      .from(paymentWebhooks)
      .orderBy(desc(paymentWebhooks.createdAt))
      .limit(100),
  }));
