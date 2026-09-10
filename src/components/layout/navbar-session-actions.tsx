import { getCreditSummary } from '@/api/generation';
import { authClient } from '@/auth/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Routes } from '@/lib/routes';
import { IconBolt, IconPlus } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { lazy, Suspense, useEffect } from 'react';

const UserButton = lazy(() =>
  import('@/components/shared/user-button').then((module) => ({
    default: module.UserButton,
  }))
);

const UserButtonMobile = lazy(() =>
  import('@/components/shared/user-button-mobile').then((module) => ({
    default: module.UserButtonMobile,
  }))
);

interface NavbarSessionActionsProps {
  fallback: React.ReactNode;
}

export function NavbarSessionActions({ fallback }: NavbarSessionActionsProps) {
  const { data: session, isPending } = authClient.useSession();
  const user = session?.user;

  if (isPending) return <Skeleton className="size-8 rounded-full" />;

  if (!user) return <>{fallback}</>;

  return (
    <Suspense
      fallback={
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-28 rounded-xl" />
          <Skeleton className="size-9 rounded-full" />
        </div>
      }
    >
      <div className="flex items-center gap-3">
        <NavbarCredits />
        <UserButton user={user} />
      </div>
    </Suspense>
  );
}

function NavbarCredits() {
  const credits = useQuery({
    queryKey: ['noddi-credits'],
    queryFn: () => getCreditSummary(),
  });

  if (credits.isPending) return <Skeleton className="h-9 w-28 rounded-xl" />;
  if (!credits.data) return null;

  const balance = credits.data.planBalance + credits.data.purchasedBalance;

  return (
    <Link
      to={Routes.DashboardCredits}
      aria-label={`${balance} credits available`}
      className="inline-flex h-9 items-center overflow-hidden rounded-xl border-2 border-black bg-white text-sm font-bold shadow-[2px_2px_0_#c6ff5b] transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9b7bff]"
    >
      <span className="inline-flex items-center gap-1.5 px-3">
        <IconBolt className="size-4 fill-[#c6ff5b] text-black" />
        {balance}
      </span>
      <span className="flex h-full w-9 items-center justify-center border-l-2 border-black transition-colors hover:bg-[#c6ff5b]">
        <IconPlus className="size-4" aria-hidden="true" />
      </span>
    </Link>
  );
}

interface MobileNavbarSessionActionsProps {
  onSessionUserChange?: (hasUser: boolean) => void;
}

export function MobileNavbarSessionActions({
  onSessionUserChange,
}: MobileNavbarSessionActionsProps) {
  const { data: session, isPending } = authClient.useSession();
  const user = session?.user;

  useEffect(() => {
    onSessionUserChange?.(!!user);
  }, [onSessionUserChange, user]);

  if (isPending) return <Skeleton className="size-8 rounded-full" />;
  if (!user) return null;

  return (
    <Suspense fallback={<Skeleton className="size-8 rounded-full" />}>
      <UserButtonMobile user={user} />
    </Suspense>
  );
}
