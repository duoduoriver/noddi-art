import HeroSection from '@/components/blocks/hero';
import LogoCloudSection from '@/components/blocks/logo-cloud';
import { lazy, Suspense } from 'react';

const HomeProductSections = lazy(
  () => import('@/components/blocks/home-product-sections')
);
const HomeConversionSections = lazy(
  () => import('@/components/blocks/home-conversion-sections')
);

export function HomePage() {
  return (
    <div className="flex flex-col">
      <HeroSection />
      <LogoCloudSection />
      <Suspense fallback={null}>
        <HomeProductSections />
      </Suspense>
      <Suspense fallback={null}>
        <HomeConversionSections />
      </Suspense>
    </div>
  );
}
