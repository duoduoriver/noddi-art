import { authClient } from '@/auth/client';
import { PricingCard } from '@/components/pricing/pricing-card';
import { Button, buttonVariants } from '@/components/ui/button';
import { formatPrice } from '@/lib/formatter';
import { getPricePlans } from '@/lib/price-plan';
import { Routes } from '@/lib/routes';
import { cn } from '@/lib/utils';
import type { Price, PricePlan } from '@/payment/types';
import { PaymentTypes, PlanIntervals } from '@/payment/types';
import { IconArrowRight, IconSparkles } from '@tabler/icons-react';
import { Link } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import { CheckoutButton } from './create-checkout-button';

interface PricingTableProps {
  metadata?: Record<string, string>;
  currentPlan?: PricePlan | null;
  className?: string;
}

function getOneTimePrice(plan: PricePlan): Price | undefined {
  return plan.prices.find(
    (price) => !price.disabled && price.type === PaymentTypes.ONE_TIME
  );
}

function CreditPacks({
  plans,
  metadata,
}: {
  plans: PricePlan[];
  metadata?: Record<string, string>;
}) {
  const { data: session } = authClient.useSession();
  const [mounted, setMounted] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState(plans[0]?.id ?? '');
  const selectedPlan = useMemo(
    () => plans.find((plan) => plan.id === selectedPlanId) ?? plans[0],
    [plans, selectedPlanId]
  );
  const selectedPrice = selectedPlan
    ? getOneTimePrice(selectedPlan)
    : undefined;
  const isAuthenticated = mounted && !!session?.user;
  const hasValidPriceId = !!selectedPrice?.priceId.trim();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!selectedPlan || !selectedPrice) return null;

  return (
    <aside className="sunburst-soft-band relative grid gap-7 rounded-2xl border-2 border-[#111111] p-6 shadow-[4px_4px_0_#9b7bff] md:grid-cols-[0.75fr_1.25fr] md:items-center md:p-8">
      <div>
        <span className="sunburst-eyebrow">
          <IconSparkles className="mr-1 size-3.5" /> Top up anytime
        </span>
        <h2 className="mt-4 text-3xl font-extrabold tracking-[-0.035em]">
          Credit packs
        </h2>
        <p className="mt-3 max-w-md text-sm leading-6 text-[#666]">
          Buy once, use your credits whenever inspiration hits.
        </p>
      </div>

      <div>
        <div className="grid gap-2 rounded-xl border border-[#d8d7dd] bg-white p-2 sm:grid-cols-3">
          {plans.map((plan) => {
            const price = getOneTimePrice(plan);
            const isSelected = plan.id === selectedPlan.id;
            if (!price) return null;

            return (
              <button
                key={plan.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => setSelectedPlanId(plan.id)}
                className={cn(
                  'flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-3 text-left text-sm font-semibold transition-colors',
                  'border-transparent hover:border-[#111] hover:bg-[#f6f5f2] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9b7bff]',
                  isSelected && 'border-[#111] bg-[#c6ff5b]'
                )}
              >
                <span className="flex items-center gap-2">
                  <IconSparkles className="size-4 text-[#9b7bff]" />
                  {plan.features?.[0] ?? plan.name}
                </span>
                <span>{formatPrice(price.amount, price.currency)}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-4">
          {hasValidPriceId && isAuthenticated ? (
            <CheckoutButton
              planId={selectedPlan.id}
              priceId={selectedPrice.priceId}
              metadata={metadata}
              className="h-12 w-full text-base"
            >
              BUY NOW <IconArrowRight className="ml-2 text-[#c6ff5b]" />
            </CheckoutButton>
          ) : hasValidPriceId ? (
            <Link
              to={Routes.Login}
              className={cn(buttonVariants(), 'h-12 w-full text-base')}
            >
              BUY NOW <IconArrowRight className="ml-2 text-[#c6ff5b]" />
            </Link>
          ) : (
            <Button disabled className="h-12 w-full text-base">
              COMING SOON
            </Button>
          )}
        </div>
      </div>
    </aside>
  );
}

export function PricingTable({
  metadata,
  currentPlan,
  className,
}: PricingTableProps) {
  const plans = Object.values(getPricePlans()).filter((plan) => !plan.disabled);
  const subscriptionPlans = plans.filter(
    (plan) =>
      plan.isFree ||
      plan.prices.some(
        (price) =>
          !price.disabled &&
          price.type === PaymentTypes.SUBSCRIPTION &&
          price.interval === PlanIntervals.MONTH
      )
  );
  const creditPacks = plans.filter(
    (plan) =>
      !plan.isFree &&
      plan.prices.some(
        (price) => !price.disabled && price.type === PaymentTypes.ONE_TIME
      )
  );
  const currentPlanId = currentPlan?.id ?? null;

  return (
    <section aria-labelledby="plans-heading" className={cn(className)}>
      <h2 id="plans-heading" className="sr-only">
        Pricing plans
      </h2>
      <div className="grid gap-6 md:grid-cols-3">
        {subscriptionPlans.map((plan) => (
          <PricingCard
            key={plan.id}
            plan={plan}
            interval={PlanIntervals.MONTH}
            paymentType={PaymentTypes.SUBSCRIPTION}
            metadata={metadata}
            isCurrentPlan={currentPlanId === plan.id}
          />
        ))}
      </div>
      {creditPacks.length > 0 ? (
        <CreditPacks plans={creditPacks} metadata={metadata} />
      ) : null}
    </section>
  );
}
