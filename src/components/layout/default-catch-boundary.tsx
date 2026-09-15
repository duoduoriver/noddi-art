import { m } from '@/locale/paraglide/messages';
import { Link } from '@tanstack/react-router';
import type { ErrorComponentProps } from '@tanstack/react-router';
import { Logo } from '@/components/shared/logo';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
/**
 * Default catch boundary for TanStack Router.
 * Layout and styling aligned with NotFound for consistency.
 */
export function DefaultCatchBoundary({ error }: ErrorComponentProps) {
  const message = error?.message ?? m.catch_boundary_description();
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-[#f7f6fb] px-4 py-12">
      <div className="sunburst-card-purple flex w-full max-w-xl flex-col items-center gap-6 p-8 text-center sm:p-12">
        <Logo className="size-12" />
        <span className="sunburst-eyebrow">Something went wrong</span>
        <h1 className="text-4xl font-extrabold tracking-[-0.04em]">
          {m.catch_boundary_title()}
        </h1>
        <p className="text-balance text-lg leading-7 text-muted-foreground">
          {message}
        </p>
        <Link
          to="/"
          className={cn(buttonVariants({ size: 'lg', variant: 'default' }))}
        >
          {m.catch_boundary_back_to_home()}
        </Link>
      </div>
    </div>
  );
}
