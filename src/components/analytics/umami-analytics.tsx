import { ClientScript } from '@/components/shared/client-script';
import { publicEnv } from '@/env/public';

/**
 * Umami Analytics
 * https://umami.is
 */
export function UmamiAnalytics() {
  if (!import.meta.env.PROD) return null;
  const websiteId = publicEnv.VITE_UMAMI_WEBSITE_ID;
  const script = publicEnv.VITE_UMAMI_SCRIPT;
  if (!websiteId || !script) return null;

  return <ClientScript src={script} async dataAttributes={{ websiteId }} />;
}
