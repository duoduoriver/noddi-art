import { createServerFn } from '@tanstack/react-start';
import { getRequestHeaders } from '@tanstack/react-start/server';
import { hasAuthCookieString } from '@/lib/auth-cookies';

export const getAuthCookieState = createServerFn({ method: 'GET' }).handler(
  async () => ({
    hasAuthCookie: hasAuthCookieString(getRequestHeaders().get('cookie')),
  })
);
