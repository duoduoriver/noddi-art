import { createFileRoute, Outlet } from '@tanstack/react-router';
import BackButtonSmall from '@/components/shared/back-button-small';
import { Logo } from '@/components/shared/logo';
import { websiteConfig } from '@/config/website';

export const Route = createFileRoute('/auth')({
  component: AuthLayout,
});

function AuthLayout() {
  return (
    <div className="min-h-svh bg-[#f7f6fb] p-4 sm:p-6 lg:p-8">
      <BackButtonSmall className="absolute left-6 top-6 z-20 rounded-xl border-2 border-black bg-white" />
      <div className="mx-auto grid min-h-[calc(100svh-2rem)] max-w-6xl overflow-hidden rounded-3xl border-2 border-[#111111] bg-white shadow-[6px_6px_0_#c6ff5b] sm:min-h-[calc(100svh-3rem)] lg:grid-cols-[0.92fr_1.08fr]">
        <aside className="sunburst-soft-band relative hidden overflow-hidden border-r-2 border-[#111111] p-10 lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Logo className="size-10" />
              <span className="text-xl font-extrabold tracking-[-0.03em]">
                {websiteConfig.metadata?.name}
              </span>
            </div>
            <span className="sunburst-eyebrow mt-10">Built for developers</span>
            <h1 className="mt-5 max-w-md text-5xl font-extrabold leading-[0.98] tracking-[-0.05em]">
              From app idea to ship-ready icon assets.
            </h1>
            <p className="mt-5 max-w-md text-base leading-7 text-[#666]">
              Generate four concepts, choose a direction, and export the formats
              your project needs without a design-tool learning curve.
            </p>
          </div>
          <img
            src="/placeholders/auth/auth-side-visual.webp"
            alt="Sunburst AI workflow from app brief to icon concepts and export assets"
            width={1024}
            height={1024}
            decoding="async"
            className="mt-12 w-full rounded-2xl border border-[#d8d7dd] bg-white shadow-sm"
          />
        </aside>
        <div className="flex items-center justify-center p-6 sm:p-10 lg:p-14">
          <div className="flex w-full max-w-md flex-col gap-6">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
