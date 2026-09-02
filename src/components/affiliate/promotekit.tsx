import { ClientScript } from '@/components/shared/client-script';
import { websiteConfig } from '@/config/website';
import { publicEnv } from '@/env/public';

/**
 * PromoteKit affiliate script
 * https://www.promotekit.com
 */
export function PromotekitScript() {
  if (
    !websiteConfig.affiliates?.enable ||
    websiteConfig.affiliates.provider !== 'promotekit'
  ) {
    return null;
  }
  const promotekitKey = publicEnv.VITE_AFFILIATE_PROMOTEKIT_ID;
  if (!promotekitKey) return null;

  return (
    <ClientScript
      src="https://cdn.promotekit.com/promotekit.js"
      async
      dataAttributes={{ promotekit: promotekitKey }}
    />
  );
}
