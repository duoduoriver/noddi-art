import { m } from '@/locale/paraglide/messages';
import { Link } from '@tanstack/react-router';
import { Logo } from '@/components/shared/logo';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
/**
 * Not found component for TanStack Router
 * https://github.com/TanStack/router/blob/main/examples/react/start-basic-cloudflare/src/components/NotFound.tsx
 */
export function DefaultNotFound() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-[#f7f6fb] px-4 py-12">
      <div className="sunburst-card-strong flex w-full max-w-xl flex-col items-center gap-6 p-8 text-center sm:p-12">
        <Logo className="size-12" />
        <span className="sunburst-eyebrow">404</span>
        <h1 className="text-4xl font-extrabold tracking-[-0.04em]">
          {m.not_found_title()}
        </h1>
        <p className="text-balance text-lg leading-7 text-muted-foreground">
          {m.not_found_description()}
        </p>
        <Link
          to="/"
          className={cn(buttonVariants({ size: 'lg', variant: 'default' }))}
        >
          {m.not_found_back_to_home()}
        </Link>
      </div>
    </div>
  );
}
