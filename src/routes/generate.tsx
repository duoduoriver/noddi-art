import { GenerateForm } from '@/components/noddi/generate-form';
import { seo } from '@/lib/seo';
import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

const exportPlatform = z.enum(['android', 'ios', 'web', 'macos']);
const exportMode = z.enum(['image', 'packages']);

export const Route = createFileRoute('/generate')({
  validateSearch: z.object({
    project: z.string().uuid().optional(),
    platform: exportPlatform.optional(),
    exportMode: exportMode.optional(),
  }),
  head: () =>
    seo('/generate', {
      title: 'AI App Icon Generator for iOS, Android & Web | Sunburst AI',
      description:
        'Generate AI app icons, refine variations, and export Xcode AppIcon, Android adaptive icons, macOS ICNS, favicon, and PWA assets.',
    }),
  component: GeneratePage,
});

function GeneratePage() {
  const {
    project,
    platform,
    exportMode: initialExportMode,
  } = Route.useSearch();
  return (
    <GenerateForm
      projectId={project}
      initialExportPlatform={platform}
      initialExportMode={
        initialExportMode ?? (platform ? 'packages' : undefined)
      }
    />
  );
}
