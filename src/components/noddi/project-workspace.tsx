import { getProject } from '@/api/generation';
import { Button } from '@/components/ui/button';
import { m } from '@/locale/paraglide/messages';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';

export function ProjectWorkspace({ projectId }: { projectId: string }) {
  const { data, isPending, error } = useQuery({
    queryKey: ['noddi-project', projectId],
    queryFn: () => getProject({ data: { projectId } }),
    refetchInterval: (query) =>
      query.state.data?.jobs.some((job) =>
        ['queued', 'processing'].includes(job.status)
      )
        ? 2_000
        : false,
  });

  if (isPending)
    return (
      <div className="sunburst-card flex min-h-40 items-center justify-center p-6 text-sm text-muted-foreground">
        {m.noddi_project_processing()}
      </div>
    );
  if (error || !data)
    return (
      <div role="alert" className="sunburst-card-strong p-6">
        {error?.message ?? m.noddi_projects_empty()}
      </div>
    );

  const versions = data.versions
    .filter((version) => version.type === 'concept_sheet')
    .sort((first, second) => second.versionNumber - first.versionNumber);
  const candidateAssets = data.assets.filter(
    ({ asset }) =>
      asset.role.startsWith('candidate_') && asset.status === 'active'
  );
  const legacyFinalAssets = data.assets.filter(
    ({ asset }) =>
      ['final', 'revision'].includes(asset.role) && asset.status === 'active'
  );

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="sunburst-eyebrow">Project timeline</span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-[-0.04em]">
            Generation versions
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Browse previous versions here, or continue generating and exporting
            from the workspace.
          </p>
        </div>
        <Button
          render={<Link to="/generate" search={{ project: projectId }} />}
        >
          Continue in generator
        </Button>
      </div>

      {versions.length ? (
        <div className="space-y-8">
          {versions.map((version, index) => {
            const label = `V${versions.length - index}`;
            const assets = candidateAssets
              .filter(({ asset }) => asset.versionId === version.id)
              .sort((first, second) =>
                first.asset.role.localeCompare(second.asset.role)
              );
            return (
              <section key={version.id} className="sunburst-card p-5 sm:p-6">
                <div className="mb-3 flex items-baseline justify-between gap-3">
                  <h3 className="text-xl font-extrabold">{label}</h3>
                  <span className="text-xs text-muted-foreground">
                    {version.createdAt.toLocaleString()}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                  {assets.map(({ asset, file }) => (
                    <figure
                      key={asset.id}
                      className="overflow-hidden rounded-2xl border border-[#dedde3] bg-white p-2 shadow-[0_8px_20px_rgba(17,17,17,0.05)]"
                    >
                      <img
                        className="aspect-square w-full rounded-xl object-cover"
                        src={`/api/storage/file?key=${encodeURIComponent(file.r2Key)}`}
                        alt={`${label} variation ${asset.role.slice(-1)}`}
                      />
                      <figcaption className="mt-2 px-1 text-sm font-extrabold">
                        Variation {asset.role.slice(-1)}
                      </figcaption>
                    </figure>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="sunburst-soft-band rounded-2xl border border-dashed border-[#b9aaff] p-8 text-center text-muted-foreground">
          {m.noddi_project_no_versions()}
        </div>
      )}

      {legacyFinalAssets.length ? (
        <section className="sunburst-card p-5 sm:p-6">
          <h2 className="mb-2 text-xl font-extrabold">Previous final assets</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            These were created with the earlier workflow and remain available.
          </p>
          <div className="grid max-w-xl grid-cols-2 gap-4">
            {legacyFinalAssets.map(({ asset, file }) => (
              <figure
                key={asset.id}
                className="overflow-hidden rounded-2xl border border-[#dedde3] bg-white p-2"
              >
                <img
                  className="aspect-square w-full rounded-xl object-cover"
                  src={`/api/storage/file?key=${encodeURIComponent(file.r2Key)}`}
                  alt="Previous generated app icon"
                />
                <figcaption className="mt-2 text-sm">{asset.role}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
