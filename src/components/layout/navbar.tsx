import { useScroll } from '@/hooks/use-scroll';
import { onAuthSessionChanged } from '@/auth/session-events';
import { cn } from '@/lib/utils';
import { Routes } from '@/lib/routes';
import { hasReadableAuthCookie } from '@/lib/auth-cookies';
import { runWhenIdle } from '@/lib/idle';
import { buttonVariants } from '@/components/ui/button';
import Container from '@/components/layout/container';
import { Logo } from '@/components/shared/logo';
import { ModeSwitcher } from '@/components/theme/mode-switcher';
import { LocaleSwitcher } from '@/components/layout/locale-switcher';
import { LoginWrapper } from '@/components/auth/login-wrapper';
import { Link, useLocation } from '@tanstack/react-router';
import { lazy, Suspense, useEffect, useState } from 'react';
import { websiteConfig } from '@/config/website';
import { m } from '@/locale/paraglide/messages';

const NavbarSessionActions = lazy(() =>
  import('@/components/layout/navbar-session-actions').then((module) => ({
    default: module.NavbarSessionActions,
  }))
);

const NavbarDesktopMenu = lazy(() =>
  import('@/components/layout/navbar-desktop-menu').then((module) => ({
    default: module.NavbarDesktopMenu,
  }))
);

const NavbarMobile = lazy(() =>
  import('@/components/layout/navbar-mobile').then((module) => ({
    default: module.NavbarMobile,
  }))
);

type StaticNavbarItem =
  | { href: string; title: string }
  | { menu: true; title: string };

interface NavbarProps {
  scroll?: boolean;
  hasAuthCookie?: boolean;
}

export function Navbar({ scroll = true, hasAuthCookie = false }: NavbarProps) {
  const pathname = useLocation().pathname;
  const scrolled = useScroll(50);
  const [shouldLoadDesktopMenu, setShouldLoadDesktopMenu] = useState(false);
  const showBarBg = scroll && scrolled;

  const requestDesktopMenu = () => setShouldLoadDesktopMenu(true);

  return (
    <header
      className={cn(
        'sticky inset-x-0 top-0 z-40 py-4 transition-all duration-300',
        showBarBg && 'border-b'
      )}
    >
      {showBarBg && (
        <div
          className="absolute inset-0 z-0 bg-muted/50 backdrop-blur-md"
          aria-hidden="true"
        />
      )}
      <div className="relative z-10">
        <Container className="px-4">
          <nav
            aria-label={m.common_main_navigation()}
            className="hidden lg:flex lg:items-center lg:justify-between lg:gap-4"
          >
            <Link
              to="/"
              aria-label="Home"
              className="flex items-center gap-2 shrink-0"
            >
              <Logo />
              <span className="text-xl font-semibold">
                {websiteConfig.metadata?.name}
              </span>
            </Link>

            <div
              className="flex flex-1 justify-center"
              onFocusCapture={requestDesktopMenu}
              onPointerEnter={requestDesktopMenu}
            >
              {shouldLoadDesktopMenu ? (
                <Suspense
                  fallback={
                    <StaticDesktopNavLinks
                      pathname={pathname}
                      onRequestMenu={requestDesktopMenu}
                    />
                  }
                >
                  <NavbarDesktopMenu pathname={pathname} />
                </Suspense>
              ) : (
                <StaticDesktopNavLinks
                  pathname={pathname}
                  onRequestMenu={requestDesktopMenu}
                />
              )}
            </div>

            <div className="flex items-center gap-4 shrink-0">
              <LocaleSwitcher />
              <ModeSwitcher />
              {websiteConfig.auth?.enable && (
                <NavbarAuthActions hasAuthCookie={hasAuthCookie} />
              )}
            </div>
          </nav>

          <DeferredNavbarMobile hasAuthCookie={hasAuthCookie} />
        </Container>
      </div>
    </header>
  );
}

function StaticDesktopNavLinks({
  onRequestMenu,
  pathname,
}: {
  onRequestMenu: () => void;
  pathname: string;
}) {
  const items = getStaticNavbarItems();

  return (
    <ul className="flex flex-1 list-none items-center justify-center gap-0">
      {items.map((item) => (
        <li key={item.title}>
          {'href' in item ? (
            <Link
              to={item.href}
              className={cn(
                staticNavLinkClass,
                isStaticLinkActive(item.href, pathname) &&
                  'font-semibold text-primary'
              )}
            >
              {item.title}
            </Link>
          ) : (
            <button
              type="button"
              className={cn(staticNavLinkClass, 'bg-transparent')}
              aria-expanded={false}
              aria-haspopup="menu"
              onClick={onRequestMenu}
            >
              {item.title}
              <span aria-hidden="true" className="ml-1 text-xs">
                ↓
              </span>
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}

function DeferredNavbarMobile({ hasAuthCookie }: { hasAuthCookie: boolean }) {
  const [shouldLoadMobile, setShouldLoadMobile] = useState(false);
  const [openOnLoad, setOpenOnLoad] = useState(false);

  const openMobileMenu = () => {
    setOpenOnLoad(true);
    setShouldLoadMobile(true);
  };

  if (!shouldLoadMobile) {
    return <MobileNavbarFallback onOpen={openMobileMenu} />;
  }

  return (
    <Suspense
      fallback={
        <MobileNavbarFallback loading={openOnLoad} onOpen={openMobileMenu} />
      }
    >
      <NavbarMobile
        className="lg:hidden"
        hasAuthCookie={hasAuthCookie}
        initialOpen={openOnLoad}
      />
    </Suspense>
  );
}

function MobileNavbarFallback({
  loading = false,
  onOpen,
}: {
  loading?: boolean;
  onOpen: () => void;
}) {
  return (
    <div className="flex items-center justify-between lg:hidden">
      <Link to="/" className="flex items-center gap-2">
        <Logo />
        <span className="text-xl font-semibold">
          {websiteConfig.metadata?.name}
        </span>
      </Link>

      <button
        type="button"
        className="flex size-8 items-center justify-center rounded-md border border-border bg-background text-foreground transition-colors hover:bg-muted"
        aria-busy={loading || undefined}
        aria-expanded={false}
        aria-label="Open menu"
        onClick={onOpen}
      >
        <span className="flex flex-col gap-1" aria-hidden="true">
          <span className="h-0.5 w-4 rounded-full bg-current" />
          <span className="h-0.5 w-4 rounded-full bg-current" />
          <span className="h-0.5 w-4 rounded-full bg-current" />
        </span>
      </button>
    </div>
  );
}

function getStaticNavbarItems(): StaticNavbarItem[] {
  const links: StaticNavbarItem[] = [
    { title: m.nav_features(), href: Routes.Features },
  ];

  if (websiteConfig.payment?.enable) {
    links.push({ title: m.nav_pricing(), href: Routes.Pricing });
  }

  if (websiteConfig.blog?.enable) {
    links.push({ title: m.nav_blog(), href: Routes.Blog });
  }

  links.push({ menu: true, title: m.nav_ai_title() });
  links.push({ menu: true, title: m.nav_pages() });

  return links;
}

function isStaticLinkActive(href: string, pathname: string) {
  if (href.includes('#')) return false;

  const path = href.split('#')[0] ?? '/';
  const normalizedHref = path === '/' ? '/' : path.replace(/\/$/, '') || '/';
  const normalizedPath =
    pathname === '/' ? '/' : pathname.replace(/\/$/, '') || '/';

  return normalizedPath === normalizedHref;
}

const staticNavLinkClass =
  'inline-flex h-9 w-max items-center justify-center rounded-lg px-2.5 py-1.5 text-sm font-medium outline-none transition-all hover:bg-muted focus:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-1';

function AnonymousNavbarActions() {
  return (
    <>
      <LoginWrapper mode="modal" asChild>
        <button
          type="button"
          className={cn(
            buttonVariants({
              variant: 'outline',
              size: 'sm',
            }),
            'cursor-pointer'
          )}
        >
          {m.auth_common_login()}
        </button>
      </LoginWrapper>
      <Link to={Routes.Register} className={buttonVariants({ size: 'sm' })}>
        {m.auth_common_signup()}
      </Link>
    </>
  );
}

function NavbarSessionPlaceholder() {
  return (
    <span className="block size-8 rounded-full bg-muted" aria-hidden="true" />
  );
}

function NavbarAuthActions({ hasAuthCookie }: { hasAuthCookie: boolean }) {
  const [shouldCheckSession, setShouldCheckSession] = useState(false);
  const [hasSessionHint, setHasSessionHint] = useState(hasAuthCookie);
  const anonymousFallback = <AnonymousNavbarActions />;
  const loadingFallback = <NavbarSessionPlaceholder />;
  const fallback =
    hasSessionHint || shouldCheckSession ? loadingFallback : anonymousFallback;

  useEffect(() => {
    setHasSessionHint(hasAuthCookie);
  }, [hasAuthCookie]);

  useEffect(
    () =>
      onAuthSessionChanged(({ authenticated }) => {
        setHasSessionHint(authenticated);
        setShouldCheckSession(authenticated);
      }),
    []
  );

  useEffect(() => {
    if (!hasAuthCookie && !hasReadableAuthCookie()) {
      setHasSessionHint(false);
      setShouldCheckSession(false);
      return;
    }

    setHasSessionHint(true);

    return runWhenIdle(() => setShouldCheckSession(true));
  }, [hasAuthCookie]);

  if (!shouldCheckSession) return fallback;

  return (
    <Suspense fallback={fallback}>
      <NavbarSessionActions fallback={anonymousFallback} />
    </Suspense>
  );
}
