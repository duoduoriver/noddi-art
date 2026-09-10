import { createStart } from '@tanstack/react-start';

/**
 * TanStack Start instance
 * https://github.com/backpine/tanstack-start-on-cloudflare/blob/main/src/start.tsx
 */
export const startInstance = createStart(() => {
  return {
    defaultSsr: true,
  };
});
