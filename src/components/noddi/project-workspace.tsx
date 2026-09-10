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

  if (isPending) return <p>{m.noddi_project_processing()}</p>;
  if (error || !data)
    return <p role="alert">{error?.message ?? m.noddi_projects_empty()}</p>;

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
          <h2 className="font-hand text-3xl">Generation versions</h2>
          <p className="mt-1 text-sm text-muted-foreground">
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
              <section key={version.id}>
                <div className="mb-3 flex items-baseline justify-between gap-3">
                  <h3 className="font-hand text-2xl">{label}</h3>
                  <span className="text-xs text-muted-foreground">
                    {version.createdAt.toLocaleString()}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                  {assets.map(({ asset, file }) => (
                    <figure
                      key={asset.id}
                      className="border-2 border-black bg-white p-2"
                    >
                      <img
                        className="aspect-square w-full object-cover"
                        src={`/api/storage/file?key=${encodeURIComponent(file.r2Key)}`}
                        alt={`${label} variation ${asset.role.slice(-1)}`}
                      />
                      <figcaption className="mt-2 font-hand">
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
        <p className="text-muted-foreground">{m.noddi_project_no_versions()}</p>
      )}

      {legacyFinalAssets.length ? (
        <section>
          <h2 className="mb-2 font-hand text-2xl">Previous final assets</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            These were created with the earlier workflow and remain available.
          </p>
          <div className="grid max-w-xl grid-cols-2 gap-4">
            {legacyFinalAssets.map(({ asset, file }) => (
              <figure
                key={asset.id}
                className="border-2 border-black bg-white p-2"
              >
                <img
                  className="aspect-square w-full object-cover"
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
