import { deleteProject, listProjects, renameProject } from '@/api/generation';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { getLocale } from '@/lib/locale';
import { m } from '@/locale/paraglide/messages';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useState } from 'react';

const projectKey = ['noddi-projects'];

function formatStatus(status: string | null) {
  switch (status) {
    case 'queued':
      return m.noddi_project_status_queued();
    case 'processing':
      return m.noddi_project_status_processing();
    case 'succeeded':
      return m.noddi_project_status_succeeded();
    case 'failed':
      return m.noddi_project_status_failed();
    case 'refunded':
      return m.noddi_project_status_refunded();
    default:
      return m.noddi_project_status_empty();
  }
}

export function ProjectList() {
  const queryClient = useQueryClient();
  const [renaming, setRenaming] = useState<{ id: string; name: string } | null>(
    null
  );
  const [deleting, setDeleting] = useState<string | null>(null);
  const {
    data: projects,
    isPending,
    error,
    refetch,
  } = useQuery({
    queryKey: projectKey,
    queryFn: () => listProjects(),
    refetchInterval: (query) =>
      query.state.data?.some((project) =>
        ['queued', 'processing'].includes(project.latestJobStatus ?? '')
      )
        ? 4_000
        : false,
  });
  const rename = useMutation({
    mutationFn: renameProject,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: projectKey });
      queryClient.invalidateQueries({
        queryKey: ['noddi-project', variables.data.projectId],
      });
    },
  });
  const remove = useMutation({
    mutationFn: deleteProject,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: projectKey });
      queryClient.invalidateQueries({
        queryKey: ['noddi-project', variables.data.projectId],
      });
    },
  });
  const closeRename = () => {
    if (!rename.isPending) setRenaming(null);
  };
  const closeDelete = () => {
    if (!remove.isPending) setDeleting(null);
  };

  if (isPending)
    return (
      <div className="sunburst-card flex min-h-40 items-center justify-center p-6 text-sm font-semibold text-muted-foreground">
        {m.noddi_project_processing()}
      </div>
    );
  if (error)
    return (
      <div role="alert" className="sunburst-card-strong p-6">
        <p>{m.noddi_projects_load_error({ message: error.message })}</p>
        <Button className="mt-3" variant="outline" onClick={() => refetch()}>
          {m.noddi_common_retry()}
        </Button>
      </div>
    );
  if (!projects?.length)
    return (
      <div className="sunburst-soft-band rounded-2xl border-2 border-dashed border-[#b9aaff] p-10 text-center">
        <p className="mb-4 text-muted-foreground">{m.noddi_projects_empty()}</p>
        <Button render={<Link to="/generate" />}>
          {m.noddi_projects_create()}
        </Button>
      </div>
    );

  return (
    <>
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {projects.map((project) => {
          const busy = ['queued', 'processing'].includes(
            project.latestJobStatus ?? ''
          );
          const isDeleting = deleting === project.id && remove.isPending;
          return (
            <article
              key={project.id}
              className="sunburst-card group overflow-hidden transition-transform hover:-translate-y-1 hover:border-black"
            >
              <div className="sunburst-placeholder aspect-[16/9] border-b border-[#ecebf0] bg-[#f8f8fb]">
                {project.thumbnailKey ? (
                  <img
                    className="h-full w-full object-contain p-5 transition-transform group-hover:scale-[1.02]"
                    src={`/api/storage/file?key=${encodeURIComponent(project.thumbnailKey)}`}
                    alt=""
                  />
                ) : null}
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="truncate text-xl font-extrabold tracking-[-0.03em]">
                    {project.name}
                  </h2>
                  <span className="shrink-0 rounded-full bg-[#f1ebff] px-2.5 py-1 text-[10px] font-extrabold text-[#6548d8]">
                    {formatStatus(project.latestJobStatus)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {m.noddi_projects_updated({
                    date: new Intl.DateTimeFormat(getLocale(), {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    }).format(new Date(project.updatedAt)),
                  })}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    render={
                      <Link
                        to="/dashboard/projects/$projectId"
                        params={{ projectId: project.id }}
                      />
                    }
                    variant="outline"
                    className="min-h-10"
                  >
                    {m.noddi_projects_open()}
                  </Button>
                  <Button
                    variant="outline"
                    disabled={busy || isDeleting}
                    onClick={() => {
                      rename.reset();
                      setRenaming({ id: project.id, name: project.name });
                    }}
                  >
                    {m.noddi_projects_rename()}
                  </Button>
                  <Button
                    variant="destructive"
                    disabled={busy || isDeleting}
                    onClick={() => {
                      remove.reset();
                      setDeleting(project.id);
                    }}
                  >
                    {isDeleting
                      ? m.noddi_projects_deleting()
                      : m.noddi_projects_delete()}
                  </Button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
      <AlertDialog
        open={Boolean(renaming)}
        onOpenChange={(open) => !open && closeRename()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {m.noddi_projects_rename_title()}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {m.noddi_projects_rename_description()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <label htmlFor="project-name" className="sr-only">
            {m.noddi_projects_name_label()}
          </label>
          <Input
            id="project-name"
            aria-label={m.noddi_projects_name_label()}
            autoFocus
            maxLength={120}
            value={renaming?.name ?? ''}
            onChange={(event) =>
              setRenaming((current) =>
                current ? { ...current, name: event.target.value } : null
              )
            }
          />
          {rename.error ? (
            <p role="alert" className="text-sm text-destructive">
              {rename.error.message}
            </p>
          ) : null}
          <AlertDialogFooter>
            <Button
              variant="outline"
              disabled={rename.isPending}
              onClick={closeRename}
            >
              {m.noddi_common_cancel()}
            </Button>
            <Button
              disabled={!renaming?.name.trim() || rename.isPending}
              onClick={() =>
                renaming &&
                rename.mutate(
                  { data: { projectId: renaming.id, name: renaming.name } },
                  { onSuccess: () => setRenaming(null) }
                )
              }
            >
              {rename.isPending
                ? m.noddi_projects_saving()
                : m.noddi_common_save()}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && closeDelete()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {m.noddi_projects_delete_title()}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {m.noddi_projects_delete_description()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {remove.error ? (
            <p role="alert" className="text-sm text-destructive">
              {remove.error.message}
            </p>
          ) : null}
          <AlertDialogFooter>
            <Button
              variant="outline"
              disabled={remove.isPending}
              onClick={closeDelete}
            >
              {m.noddi_common_cancel()}
            </Button>
            <Button
              variant="destructive"
              disabled={remove.isPending}
              onClick={() =>
                deleting &&
                remove.mutate(
                  { data: { projectId: deleting } },
                  { onSuccess: () => setDeleting(null) }
                )
              }
            >
              {remove.isPending
                ? m.noddi_projects_deleting()
                : m.noddi_projects_delete()}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
