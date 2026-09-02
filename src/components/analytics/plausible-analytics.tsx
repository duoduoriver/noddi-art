import { ClientScript } from '@/components/shared/client-script';
import { publicEnv } from '@/env/public';

/**
 * Plausible Analytics
 * https://plausible.io
 */
export function PlausibleAnalytics() {
  if (!import.meta.env.PROD) return null;
  const script = publicEnv.VITE_PLAUSIBLE_SCRIPT;
  if (!script) return null;

  const inlineHtml = `
    window.plausible=window.plausible||function(){(plausible.q=plausible.q||[]).push(arguments)},plausible.init=plausible.init||function(i){plausible.o=i||{}};
    plausible.init();
  `;

  return (
    <>
      <ClientScript id="plausible-analytics" src={script} async />
      <ClientScript id="plausible-analytics-init" inlineHtml={inlineHtml} />
    </>
  );
}
