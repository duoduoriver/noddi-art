const AUTH_SESSION_CHANGED_EVENT = 'duoduohe:auth-session-changed';

type AuthSessionChangedDetail = {
  authenticated: boolean;
};

export function emitAuthSessionChanged(detail: AuthSessionChangedDetail) {
  if (typeof window === 'undefined') return;

  window.dispatchEvent(
    new CustomEvent<AuthSessionChangedDetail>(AUTH_SESSION_CHANGED_EVENT, {
      detail,
    })
  );
}

export function onAuthSessionChanged(
  listener: (detail: AuthSessionChangedDetail) => void
) {
  if (typeof window === 'undefined') return () => {};

  const handler = (event: Event) => {
    listener((event as CustomEvent<AuthSessionChangedDetail>).detail);
  };

  window.addEventListener(AUTH_SESSION_CHANGED_EVENT, handler);
  return () => window.removeEventListener(AUTH_SESSION_CHANGED_EVENT, handler);
}
