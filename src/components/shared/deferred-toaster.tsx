import { runWhenIdle } from '@/lib/idle';
import { lazy, Suspense, useEffect, useState } from 'react';
import type { ToasterProps } from 'sonner';

const Toaster = lazy(() =>
  import('@/components/shared/toaster').then((module) => ({
    default: module.Toaster,
  }))
);

export function DeferredToaster(props: ToasterProps) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (enabled) return;

    const enable = () => setEnabled(true);
    const cancelIdle = runWhenIdle(enable, 2000);
    const options = { once: true, passive: true, capture: true };

    window.addEventListener('pointerdown', enable, options);
    window.addEventListener('keydown', enable, { once: true, capture: true });
    window.addEventListener('touchstart', enable, options);

    return () => {
      cancelIdle();
      window.removeEventListener('pointerdown', enable, options);
      window.removeEventListener('keydown', enable, { capture: true });
      window.removeEventListener('touchstart', enable, options);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <Suspense fallback={null}>
      <Toaster {...props} />
    </Suspense>
  );
}
