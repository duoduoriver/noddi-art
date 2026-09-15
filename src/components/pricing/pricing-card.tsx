import { authClient } from '@/auth/client';
import { Button, buttonVariants } from '@/components/ui/button';
import { formatPrice } from '@/lib/formatter';
import { Routes } from '@/lib/routes';
import { cn } from '@/lib/utils';
import type {
  PaymentType,
  PlanInterval,
  Price,
  PricePlan,
} from '@/payment/types';
import { PlanIntervals, PaymentTypes } from '@/payment/types';
import { IconArrowRight, IconCheck, IconSparkles } from '@tabler/icons-react';
import { Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { CheckoutButton } from './create-checkout-button';

function getPriceForPlan(
  plan: PricePlan,
  interval?: PlanInterval,
  paymentType?: PaymentType
): Price | undefined {
  if (plan.isFree) return undefined;

  return plan.prices.find((price) => {
    if (paymentType === PaymentTypes.ONE_TIME)
      return price.type === PaymentTypes.ONE_TIME;

    return (
      price.type === PaymentTypes.SUBSCRIPTION && price.interval === interval
    );
  });
}

interface PricingCardProps {
  plan: PricePlan;
  interval?: PlanInterval;
  paymentType?: PaymentType;
  metadata?: Record<string, string>;
  className?: string;
  isCurrentPlan?: boolean;
}

export function PricingCard({
  plan,
  interval,
  paymentType,
  metadata,
  className,
  isCurrentPlan = false,
}: PricingCardProps) {
  const price = getPriceForPlan(plan, interval, paymentType);
  const { data: session } = authClient.useSession();
  const [mounted, setMounted] = useState(false);
  const isAuthenticated = mounted && !!session?.user;
  useEffect(() => {
    setMounted(true);
  }, []);

  const priceLabel = plan.isFree
    ? '$0'
    : price && price.amount > 0
      ? formatPrice(price.amount, price.currency)
      : '—';
  const billingLabel =
    paymentType === PaymentTypes.ONE_TIME
      ? 'one-time'
      : interval === PlanIntervals.YEAR
        ? '/ year'
        : '/ month';
  const hasValidPriceId = !!price?.priceId.trim();
  const cardFeatures = [
    { label: plan.features?.[0] ?? 'Monthly credits', included: true },
    { label: 'AI icon concepts', included: true },
    { label: 'PNG / WebP + Android / Web export', included: true },
    { label: '1024px HD + iOS / macOS export', included: !plan.isFree },
    { label: 'Priority support', included: plan.id === 'studio' },
  ];

  return (
    <article
      className={cn(
        'relative flex min-h-full flex-col rounded-2xl border bg-white px-6 py-7 text-left shadow-[0_12px_34px_rgba(17,17,17,0.06)]',
        plan.popular
          ? 'border-2 border-[#7a5cff] shadow-[4px_4px_0_#c6ff5b]'
          : 'border-[#d8d7dd]',
        className
      )}
    >
      {plan.popular ? (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#7a5cff] px-4 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-white">
          Most popular
        </span>
      ) : null}

      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xl font-extrabold tracking-[-0.02em]">
          {plan.name}
        </h3>
        <span className="flex size-10 items-center justify-center rounded-xl border border-[#d8d7dd] bg-[#fbfbf8]">
          <IconSparkles className="size-5 text-[#7a5cff]" />
        </span>
      </div>
      <p className="mt-3 min-h-10 text-sm leading-5 text-[#666]">
        {plan.description}
      </p>

      <div className="mt-6 flex items-end gap-1">
        <span className="text-5xl font-extrabold leading-none tracking-[-0.05em]">
          {priceLabel}
        </span>
        {!plan.isFree ? (
          <span className="mb-1 text-sm font-semibold">{billingLabel}</span>
        ) : null}
      </div>
      <ul className="mt-7 space-y-3 text-sm">
        {cardFeatures.map((feature) => (
          <li key={feature.label} className="flex items-start gap-2">
            {feature.included ? (
              <IconCheck className="mt-0.5 size-4 shrink-0 rounded-full bg-[#c6ff5b] p-0.5 text-black" />
            ) : (
              <span
                aria-hidden="true"
                className="w-4 shrink-0 text-center text-[#777]"
              >
                —
              </span>
            )}
            <span className={feature.included ? undefined : 'text-[#777]'}>
              {feature.label}
            </span>
          </li>
        ))}
        {plan.limits?.map((limit) => (
          <li key={limit} className="flex items-start gap-2 text-[#5f5f5f]">
            <span
              aria-hidden="true"
              className="mt-1.5 h-px w-4 shrink-0 bg-current"
            />
            <span>{limit}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-8">
        {plan.isFree ? (
          isAuthenticated ? (
            <Button disabled className="h-12 w-full text-base">
              CURRENT PLAN
            </Button>
          ) : (
            <Link
              to={Routes.Login}
              className={cn(buttonVariants(), 'h-12 w-full text-base')}
            >
              GET STARTED <IconArrowRight className="ml-2 text-[#c6ff5b]" />
            </Link>
          )
        ) : isCurrentPlan ? (
          <Button
            disabled
            className="h-12 w-full border-2 border-black bg-[#c6ff5b] text-base text-black opacity-100"
          >
            CURRENT PLAN
          </Button>
        ) : price && hasValidPriceId && isAuthenticated ? (
          <CheckoutButton
            planId={plan.id}
            priceId={price.priceId}
            metadata={metadata}
            className="h-12 w-full text-base"
          >
            CHOOSE PLAN <IconArrowRight className="ml-2 text-[#c6ff5b]" />
          </CheckoutButton>
        ) : price && hasValidPriceId ? (
          <Link
            to={Routes.Login}
            className={cn(buttonVariants(), 'h-12 w-full text-base')}
          >
            CHOOSE PLAN <IconArrowRight className="ml-2 text-[#c6ff5b]" />
          </Link>
        ) : (
          <Button disabled className="h-12 w-full text-base">
            COMING SOON
          </Button>
        )}
      </div>
    </article>
  );
}
