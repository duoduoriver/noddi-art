import { eq, inArray } from 'drizzle-orm';
import { getDb } from '@/db';
import { systemSettings } from '@/db/app.schema';

export const OPERATIONAL_SETTING_DEFAULTS = {
  generationEnabled: false,
  gridCost: 2,
  finalMediumCost: 10,
  finalHighCost: 40,
  revisionCost: 12,
  dailyLimit: 0,
  monthlyBudgetMicros: 0,
  primaryGenerationLowMicros: 0,
  primaryEditMediumMicros: 0,
  primaryEditHighMicros: 0,
  fallbackGenerationLowMicros: 0,
  fallbackEditMediumMicros: 0,
  fallbackEditHighMicros: 0,
} as const;

export type OperationalSettings = {
  -readonly [K in keyof typeof OPERATIONAL_SETTING_DEFAULTS]: K extends 'generationEnabled'
    ? boolean
    : number;
};

function getE2EOperationalSettings(): OperationalSettings | null {
  if (!(import.meta.env.DEV === true && import.meta.env.MODE === 'e2e')) {
    return null;
  }

  return {
    generationEnabled: true,
    gridCost: 2,
    finalMediumCost: 10,
    finalHighCost: 40,
    revisionCost: 12,
    dailyLimit: 100,
    monthlyBudgetMicros: 10_000_000,
    primaryGenerationLowMicros: 1,
    primaryEditMediumMicros: 1,
    primaryEditHighMicros: 1,
    fallbackGenerationLowMicros: 1,
    fallbackEditMediumMicros: 1,
    fallbackEditHighMicros: 1,
  };
}

const settingKeys = Object.keys(OPERATIONAL_SETTING_DEFAULTS) as Array<
  keyof OperationalSettings
>;

export async function getOperationalSettings(): Promise<OperationalSettings> {
  const e2eSettings = getE2EOperationalSettings();
  if (e2eSettings) return e2eSettings;

  const rows = await getDb()
    .select()
    .from(systemSettings)
    .where(inArray(systemSettings.key, settingKeys));
  const values = new Map(rows.map((row) => [row.key, row.value]));
  const settings = { ...OPERATIONAL_SETTING_DEFAULTS } as OperationalSettings;
  for (const key of settingKeys) {
    const value = values.get(key);
    if (value === undefined) continue;
    if (key === 'generationEnabled') {
      settings[key] = value === 'true';
    } else {
      const parsed = Number(value);
      if (Number.isInteger(parsed) && parsed >= 0) settings[key] = parsed;
    }
  }
  return settings;
}

export async function updateOperationalSetting(
  key: keyof OperationalSettings,
  value: number | boolean,
  adminUserId: string
) {
  const now = new Date();
  await getDb()
    .insert(systemSettings)
    .values({
      key,
      value: String(value),
      updatedAt: now,
      updatedBy: adminUserId,
    })
    .onConflictDoUpdate({
      target: systemSettings.key,
      set: { value: String(value), updatedAt: now, updatedBy: adminUserId },
    });
}

export async function isGenerationEnabled() {
  return (await getOperationalSettings()).generationEnabled;
}

export async function getSetting(key: keyof OperationalSettings) {
  const [row] = await getDb()
    .select()
    .from(systemSettings)
    .where(eq(systemSettings.key, key))
    .limit(1);
  return row?.value;
}
