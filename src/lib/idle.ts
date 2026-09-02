export function runWhenIdle(callback: () => void, timeout = 1500): () => void {
  if (typeof window === 'undefined') return () => {};

  const idleWindow = window as unknown as {
    requestIdleCallback?: (
      callback: IdleRequestCallback,
      options?: IdleRequestOptions
    ) => number;
    cancelIdleCallback?: (handle: number) => void;
  };

  if (idleWindow.requestIdleCallback) {
    const handle = idleWindow.requestIdleCallback(callback, { timeout });
    return () => idleWindow.cancelIdleCallback?.(handle);
  }

  const handle = globalThis.setTimeout(callback, timeout);
  return () => globalThis.clearTimeout(handle);
}
