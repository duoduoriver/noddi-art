import { authClient } from '@/auth/client';
import Container from '@/components/layout/container';
import { PricingTable } from '@/components/pricing/pricing-table';
import { websiteConfig } from '@/config/website';
import { useCurrentPlan } from '@/hooks/use-payment';
import { seo } from '@/lib/seo';
import { m } from '@/locale/paraglide/messages';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/(pages)/pricing')({
  head: () =>
    seo('/pricing', {
      title: `${m.pricing_title()} | ${websiteConfig.metadata?.name}`,
      description: m.pricing_description(),
    }),
  component: PricingPage,
});

function PricingPage() {
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id;
  const { data: planData } = useCurrentPlan(!!userId);
  const currentPlan = planData?.currentPlan ?? null;

  return (
    <main className="overflow-hidden bg-white">
      <Container className="relative px-5 pb-16 pt-2 lg:px-10 lg:pb-20 lg:pt-4">
        <span
          aria-hidden="true"
          className="absolute left-[4%] top-24 -rotate-12 font-hand text-5xl text-[#9b7bff]"
        >
          ✦
        </span>
        <span
          aria-hidden="true"
          className="absolute right-[5%] top-44 rotate-12 font-hand text-5xl text-[#ff6fc7]"
        >
          ♥
        </span>

        <header className="relative mx-auto mb-10 max-w-2xl text-center">
          <h1 className="font-hand text-6xl leading-[0.9] tracking-wide sm:text-7xl">
            <span className="relative inline-block px-3">
              <span
                aria-hidden="true"
                className="brush-highlight absolute -left-2 -right-2 bottom-1 top-5 -z-0 -rotate-1 bg-[#c6ff5b]"
              />
              <span className="relative z-10">PRICING</span>
            </span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-[#343434]">
            Choose a plan that gives your next app icon idea room to grow.
          </p>
        </header>

        <PricingTable
          currentPlan={currentPlan}
          metadata={userId ? { userId } : undefined}
        />
      </Container>
    </main>
  );
}
