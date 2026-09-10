import { authClient } from '@/auth/client';
import { SketchFrame } from '@/components/noddi/sketch-frame';
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
    <SketchFrame
      color="#83bd00"
      className="min-h-full overflow-visible bg-white"
    >
      <aside className="relative flex min-h-full flex-col px-6 py-7 text-center">
        <span className="absolute right-3 top-3 z-30 rotate-2">
          <span
            aria-hidden="true"
            className="brush-highlight absolute inset-0 bg-[#ff6fc7]"
          />
          <span className="relative z-10 block px-3 py-0.5 font-hand text-xs font-bold">
            TOP UP
          </span>
        </span>
        <img
          src="/pricing/credit-packs.png"
          alt=""
          className="mx-auto size-24 object-contain"
        />
        <h2 className="mt-4 font-hand text-3xl leading-none">CREDIT PACKS</h2>
        <p className="mt-3 text-sm leading-5 text-[#5f5f5f]">
          Buy once, use your credits whenever inspiration hits.
        </p>

        <div className="mt-5 border-y-2 border-black py-2">
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
                  'flex w-full items-center justify-between gap-3 px-2 py-2 text-left text-sm font-semibold transition-colors',
                  'hover:bg-[#c6ff5b]/35 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9b7bff]',
                  isSelected && 'bg-[#c6ff5b]'
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

        <div className="mt-auto pt-7">
          {hasValidPriceId && isAuthenticated ? (
            <CheckoutButton
              planId={selectedPlan.id}
              priceId={selectedPrice.priceId}
              metadata={metadata}
              className="h-14 w-full text-lg font-bold"
            >
              BUY NOW <IconArrowRight className="ml-2 text-[#c6ff5b]" />
            </CheckoutButton>
          ) : hasValidPriceId ? (
            <Link
              to={Routes.Login}
              className={cn(
                buttonVariants(),
                'brush-button h-14 w-full text-lg font-bold'
              )}
            >
              BUY NOW <IconArrowRight className="ml-2 text-[#c6ff5b]" />
            </Link>
          ) : (
            <Button disabled className="h-14 w-full font-hand text-lg">
              COMING SOON
            </Button>
          )}
        </div>
      </aside>
    </SketchFrame>
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
      <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-4">
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
        {creditPacks.length > 0 ? (
          <CreditPacks plans={creditPacks} metadata={metadata} />
        ) : null}
      </div>
    </section>
  );
}
