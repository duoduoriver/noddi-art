import { paraglideMiddleware } from '@/locale/paraglide/server';

export function localeMiddleware(
  request: Request,
  resolve: (request: Request) => Response | Promise<Response>
) {
  return paraglideMiddleware(request, () => resolve(request));
}
