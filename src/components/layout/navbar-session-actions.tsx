import { authClient } from '@/auth/client';
import { Skeleton } from '@/components/ui/skeleton';
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
    <Suspense fallback={<Skeleton className="size-8 rounded-full" />}>
      <UserButton user={user} />
    </Suspense>
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
