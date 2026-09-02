import { ClientScript } from '@/components/shared/client-script';
import { websiteConfig } from '@/config/website';
import { publicEnv } from '@/env/public';

/**
 * Affonso (PromosKit) affiliate script
 * https://affonso.io
 */
export function AffonsoScript() {
  if (
    !websiteConfig.affiliates?.enable ||
    websiteConfig.affiliates.provider !== 'affonso'
  ) {
    return null;
  }
  const affiliateId = publicEnv.VITE_AFFILIATE_AFFONSO_ID;
  if (!affiliateId) return null;

  return (
    <ClientScript
      src="https://affonso.io/js/pixel.min.js"
      async
      dataAttributes={{ affonso: affiliateId, cookie_duration: '30' }}
    />
  );
}
