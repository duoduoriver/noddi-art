import { BottomLink } from '@/components/auth/bottom-link';
import { Logo } from '@/components/shared/logo';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Link } from '@tanstack/react-router';
import { cn } from '@/lib/utils';

interface AuthCardProps {
  children: React.ReactNode;
  headerLabel: string;
  description?: string;
  bottomButtonLabel: string;
  bottomButtonHref: string;
  className?: string;
  compact?: boolean;
}

export function AuthCard({
  children,
  headerLabel,
  description,
  bottomButtonLabel,
  bottomButtonHref,
  className,
  compact = false,
}: AuthCardProps) {
  return (
    <Card
      className={cn(
        'border-0 bg-transparent pt-0 shadow-none [--card-spacing:--spacing(5)]',
        compact &&
          'gap-0 px-5 py-5 [--card-spacing:--spacing(4)] sm:px-6 sm:py-6',
        className
      )}
      size="default"
    >
      <CardHeader
        className={cn(
          'flex flex-col items-start px-0',
          compact && 'pb-3 pr-10'
        )}
      >
        <Link to="/">
          <Logo className={cn('mb-4 size-10 lg:hidden', compact && 'hidden')} />
        </Link>
        <h2
          className={cn(
            'text-3xl font-extrabold tracking-[-0.04em] text-[#111111]',
            compact && 'text-2xl leading-tight sm:text-[1.75rem]'
          )}
        >
          {headerLabel}
        </h2>
        <CardDescription className="mt-1 text-sm leading-6">
          {description ?? 'Use your Sunburst AI account to continue.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0">{children}</CardContent>
      <CardFooter
        className={cn(
          'border-0 bg-transparent px-0 pb-0 pt-2',
          compact && 'pt-3'
        )}
      >
        <BottomLink label={bottomButtonLabel} href={bottomButtonHref} />
      </CardFooter>
    </Card>
  );
}
