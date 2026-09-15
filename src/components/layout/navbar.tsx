import { useScroll } from '@/hooks/use-scroll';
import { onAuthSessionChanged } from '@/auth/session-events';
import { cn } from '@/lib/utils';
import { Routes } from '@/lib/routes';
import { hasReadableAuthCookie } from '@/lib/auth-cookies';
import { runWhenIdle } from '@/lib/idle';
import { buttonVariants } from '@/components/ui/button';
import Container from '@/components/layout/container';
import { Logo } from '@/components/shared/logo';
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
  const showBarBg = scroll && scrolled;

  const requestDesktopMenu = () => undefined;

  return (
    <header
      className={cn(
        'sticky inset-x-0 top-0 z-40 border-b border-transparent bg-white/95 py-3 transition-all duration-300 backdrop-blur-xl',
        showBarBg && 'border-[#e5e4e8] shadow-[0_8px_24px_rgba(17,17,17,0.05)]'
      )}
    >
      {showBarBg && (
        <div
          className="absolute inset-0 z-0 bg-white/92 backdrop-blur-xl"
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
              className="flex items-center gap-2.5 shrink-0"
            >
              <Logo />
              <span className="text-lg font-extrabold tracking-[-0.02em]">
                {websiteConfig.metadata?.name}
              </span>
            </Link>

            <div
              className="flex flex-1 justify-center"
              onFocusCapture={requestDesktopMenu}
              onPointerEnter={requestDesktopMenu}
            >
              <StaticDesktopNavLinks
                pathname={pathname}
                onRequestMenu={requestDesktopMenu}
              />
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
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
                  'bg-[#f1ebff] text-[#6548d8]'
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
        <span className="text-lg font-extrabold tracking-[-0.02em]">
          {websiteConfig.metadata?.name}
        </span>
      </Link>

      <button
        type="button"
        className="flex size-10 items-center justify-center rounded-xl border-2 border-black bg-white text-foreground transition-colors hover:bg-[#f6f5f2]"
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
    { title: m.noddi_nav_generate(), href: Routes.Generate },
    { title: m.nav_pricing(), href: Routes.Pricing },
    { title: 'Tools', href: Routes.Tools },
    { title: 'Guides', href: Routes.Guides },
    { title: 'Gallery', href: Routes.Gallery },
  ];
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
  'inline-flex h-9 w-max items-center justify-center rounded-full px-3.5 py-1.5 text-sm font-semibold text-[#44444c] outline-none transition-all hover:bg-[#f6f5f2] hover:text-black focus:bg-[#f6f5f2] focus-visible:ring-3 focus-visible:ring-ring/25 focus-visible:outline-1';

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
            'h-9 cursor-pointer rounded-full border-2 border-black bg-white px-5 shadow-none hover:bg-[#f7f7f4]'
          )}
        >
          {m.auth_common_login()}
        </button>
      </LoginWrapper>
      <Link
        to={Routes.Register}
        className={cn(
          buttonVariants({ size: 'sm' }),
          'h-9 rounded-full border border-[#9fdc24] bg-[#c6ff5b] px-5 text-black shadow-none hover:bg-[#b9f44b]'
        )}
      >
        Start Free
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
