export type NoddiPlanCode = 'free' | 'pro' | 'studio';
export type NoddiPackCode = 'launch' | 'maker' | 'studio-pack';

export const CREDIT_COSTS = {
  grid: 2,
  finalMedium: 10,
  finalHigh: 40,
  revision: 12,
} as const;

export const PLAN_CATALOG = {
  free: { code: 'free', cents: 0, allowance: 2 },
  pro: { code: 'pro', cents: 900, allowance: 100 },
  studio: { code: 'studio', cents: 2900, allowance: 400 },
} as const satisfies Record<
  NoddiPlanCode,
  { code: NoddiPlanCode; cents: number; allowance: number }
>;

export const PACK_CATALOG = {
  launch: { code: 'launch', cents: 900, credits: 100 },
  maker: { code: 'maker', cents: 1900, credits: 300 },
  'studio-pack': { code: 'studio-pack', cents: 3900, credits: 800 },
} as const satisfies Record<
  NoddiPackCode,
  { code: NoddiPackCode; cents: number; credits: number }
>;

export type ProductCatalogEntry =
  | (typeof PLAN_CATALOG)[NoddiPlanCode]
  | (typeof PACK_CATALOG)[NoddiPackCode];

export function isPaidPlan(
  code: string
): code is Exclude<NoddiPlanCode, 'free'> {
  return code === 'pro' || code === 'studio';
}
