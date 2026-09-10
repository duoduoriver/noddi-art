import { authClient } from '@/auth/client';
import { SketchFrame } from '@/components/noddi/sketch-frame';
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
import { IconArrowRight, IconCheck } from '@tabler/icons-react';
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

const planPresentation = {
  free: { image: '/pricing/free.png' },
  pro: { image: '/pricing/pro.png' },
  studio: { image: '/pricing/studio.png' },
} as const;

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
  const presentation =
    planPresentation[plan.id as keyof typeof planPresentation] ??
    planPresentation.free;
  const { image } = presentation;

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
    { label: 'Full-resolution exports', included: !plan.isFree },
    { label: 'Commercial projects', included: !plan.isFree },
    { label: 'Priority support', included: plan.id === 'studio' },
  ];

  return (
    <SketchFrame
      color={plan.popular ? '#83bd00' : '#111111'}
      className={cn('min-h-full overflow-visible bg-white', className)}
    >
      <article className="relative flex min-h-full flex-col px-6 py-7 text-center">
        {plan.popular ? (
          <span className="absolute right-3 top-3 z-30 rotate-2">
            <span
              aria-hidden="true"
              className="brush-highlight absolute inset-0 bg-[#c6ff5b]"
            />
            <span className="relative z-10 block px-3 py-0.5 font-hand text-xs font-bold">
              MOST POPULAR
            </span>
          </span>
        ) : null}

        <h3 className="font-hand text-3xl font-bold leading-none">
          {plan.name}
        </h3>
        <span
          aria-hidden="true"
          className="brush-highlight mx-auto block h-2 w-20 bg-[#9b7bff]"
        />
        <p className="mt-3 min-h-10 text-sm leading-5 text-[#5f5f5f]">
          {plan.description}
        </p>

        <div className="mt-5 flex items-end justify-center gap-1">
          <span className="font-hand text-5xl font-bold leading-none">
            {priceLabel}
          </span>
          {!plan.isFree ? (
            <span className="mb-1 text-sm font-semibold">{billingLabel}</span>
          ) : null}
        </div>
        <span
          aria-hidden="true"
          className="brush-highlight mx-auto mt-2 block h-2 w-16 bg-black"
        />

        <img
          src={image}
          alt=""
          className="mx-auto mt-3 size-24 object-contain"
        />

        <ul className="mt-5 space-y-3 text-left text-sm">
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

        <div className="mt-auto pt-7">
          {plan.isFree ? (
            isAuthenticated ? (
              <Button disabled className="h-14 w-full font-hand text-lg">
                CURRENT PLAN
              </Button>
            ) : (
              <Link
                to={Routes.Login}
                className={cn(
                  buttonVariants(),
                  'brush-button h-14 w-full text-lg font-bold'
                )}
              >
                GET STARTED <IconArrowRight className="ml-2 text-[#c6ff5b]" />
              </Link>
            )
          ) : isCurrentPlan ? (
            <Button
              disabled
              className="h-14 w-full border-2 border-black bg-[#c6ff5b] font-hand text-lg text-black opacity-100"
            >
              CURRENT PLAN
            </Button>
          ) : price && hasValidPriceId && isAuthenticated ? (
            <CheckoutButton
              planId={plan.id}
              priceId={price.priceId}
              metadata={metadata}
              className="h-14 w-full text-lg font-bold"
            >
              CHOOSE PLAN <IconArrowRight className="ml-2 text-[#c6ff5b]" />
            </CheckoutButton>
          ) : price && hasValidPriceId ? (
            <Link
              to={Routes.Login}
              className={cn(
                buttonVariants(),
                'brush-button h-14 w-full text-lg font-bold'
              )}
            >
              CHOOSE PLAN <IconArrowRight className="ml-2 text-[#c6ff5b]" />
            </Link>
          ) : (
            <Button disabled className="h-14 w-full font-hand text-lg">
              COMING SOON
            </Button>
          )}
        </div>
      </article>
    </SketchFrame>
  );
}
