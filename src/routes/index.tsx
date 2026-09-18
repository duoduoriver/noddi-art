import { SunburstHomePage } from '@/components/blocks/sunburst-homepage';
import { websiteConfig } from '@/config/website';
import { HOME_FAQS } from '@/content/home-faqs';
import { seo } from '@/lib/seo';
import { getCanonicalUrl } from '@/lib/urls';
import { getLocale, localeConfig } from '@/lib/locale';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  head: () => {
    const name = websiteConfig.metadata?.name ?? '';
    const title = websiteConfig.metadata?.title ?? '';
    const description = websiteConfig.metadata?.description ?? '';
    const url = getCanonicalUrl('/');
    const inLanguage = localeConfig[getLocale()].hreflang;
    const webSiteJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name,
      description,
      url,
      inLanguage,
    };
    const softwareJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name,
      description,
      url,
      applicationCategory: 'DesignApplication',
      operatingSystem: 'Web',
      featureList: [
        'AI app icon generation',
        'iOS Xcode AppIcon export',
        'Android adaptive and themed icon export',
        'macOS ICNS export',
        'Favicon and PWA asset export',
      ],
    };
    const faqJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: HOME_FAQS.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    };
    const metadata = seo('/', { title, description });
    return {
      ...metadata,
      scripts: [
        {
          type: 'application/ld+json',
          children: JSON.stringify(webSiteJsonLd),
        },
        {
          type: 'application/ld+json',
          children: JSON.stringify(softwareJsonLd),
        },
        {
          type: 'application/ld+json',
          children: JSON.stringify(faqJsonLd),
        },
      ],
    };
  },
  component: SunburstHomePage,
});
