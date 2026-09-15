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
    <main className="sunburst-shell overflow-hidden">
      <Container className="relative px-5 pb-20 pt-14 lg:px-10 lg:pb-24 lg:pt-20">
        <header className="relative mx-auto mb-12 max-w-3xl text-center">
          <span className="sunburst-eyebrow mx-auto">Simple, fair pricing</span>
          <h1 className="sunburst-heading mt-5">
            Plans for every kind of builder
          </h1>
          <p className="sunburst-copy mx-auto mt-5 max-w-2xl">
            Start free with the full concept workflow, then upgrade when you
            need HD masters, iOS, macOS, or more monthly generation room.
          </p>
        </header>

        <PricingTable
          className="space-y-8"
          currentPlan={currentPlan}
          metadata={userId ? { userId } : undefined}
        />
      </Container>
    </main>
  );
}
