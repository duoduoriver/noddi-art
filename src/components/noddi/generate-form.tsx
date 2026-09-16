import {
  ensureHdMaster,
  generateVersion,
  getExportStatus,
  getProject,
  listProjects,
  queueExport,
  setProjectReferences,
  startProject,
} from '@/api/generation';
import { uploadUserFile } from '@/api/user-files';
import { authClient } from '@/auth/client';
import { SketchFrame } from '@/components/noddi/sketch-frame';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { HD_MASTER_CREDIT_COST } from '@/generation/types';
import {
  IconArrowDown,
  IconCheck,
  IconCopy,
  IconDownload,
  IconLoader2,
  IconPhoto,
  IconPlus,
  IconWand,
  IconX,
} from '@tabler/icons-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import {
  type CSSProperties,
  type SyntheticEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

type Candidate = 'A' | 'B' | 'C' | 'D';
type RasterFormat = 'png' | 'webp' | 'avif' | 'jpg';
type ExportPlatform = 'android' | 'ios' | 'web' | 'macos';
type ExportMode = 'image' | 'packages';
type ExportIntent =
  | { kind: 'image'; rasterFormat: RasterFormat; size: number }
  | { kind: 'packages'; platforms: ExportPlatform[] };
type PendingHdExport = { jobId: string; intent: ExportIntent };
type ReferenceImage = {
  fileId: string;
  source: string;
  name: string;
};

type StyleOption = {
  id: string;
  label: string;
  prompt: string;
  image: string;
};

const STYLE_OPTIONS: StyleOption[] = [
  {
    id: 'neo-brutalism-bold-flat',
    label: 'Neo Brutalism + Bold Flat',
    prompt: [
      'thick bold shapes, flat color blocking, strong contrast, graphic simplicity,',
      'direct expressive visual language, energetic, assertive, modern, graphic',
    ].join(' '),
    image: '/styles/neo-brutalism-bold-flat.webp',
  },
  {
    id: 'organic-minimal-soft-pastel-gradient',
    label: 'Organic Minimal + Soft Pastel Gradient',
    prompt: [
      'soft flowing forms, light visual weight, smooth curves, airy spacing,',
      'gentle pastel gradients, calm, fresh, friendly, refined',
    ].join(' '),
    image: '/styles/organic-minimal-soft-pastel-gradient.webp',
  },
  {
    id: 'pixel-art-esports-emblem',
    label: 'Pixel Art + Esports Emblem',
    prompt: [
      'chunky pixel details, emblem-like structure, bold outlines, strong symmetry,',
      'playful competitive-game aesthetic, nostalgic, high-energy, iconic, game-ready',
    ].join(' '),
    image: '/styles/pixel-art-esports-emblem.webp',
  },
  {
    id: 'organic-paper-cut',
    label: 'Organic + Paper Cut',
    prompt: [
      'layered paper-cut construction, tactile depth, organic shapes,',
      'crafted illustration style, natural, artistic, peaceful, visually textured',
    ].join(' '),
    image: '/styles/organic-paper-cut.webp',
  },
  {
    id: 'hand-drawn-friendly-illustration',
    label: 'Hand-drawn + Friendly Illustration',
    prompt: [
      'charming imperfect lines, illustrated forms, approachable personality,',
      'soft shading, warm human touch, curious, playful, creative, friendly',
    ].join(' '),
    image: '/styles/hand-drawn-friendly-illustration.webp',
  },
  {
    id: 'skeuomorphic-soft-glossy-3d',
    label: 'Skeuomorphic + Soft Glossy 3D',
    prompt: [
      'realistic yet simplified materials, soft glossy surfaces, dimensional lighting,',
      'polished highlights, rich tactile depth, visually rich, premium, modern,',
      'slightly realistic',
    ].join(' '),
    image: '/styles/skeuomorphic-soft-glossy-3d.webp',
  },
];

const COLOR_OPTIONS = [
  { label: 'Ink black', value: '#111111' },
  { label: 'Electric purple', value: '#9b7bff' },
  { label: 'Acid green', value: '#c6ff5b' },
  { label: 'Pop pink', value: '#ff6fc7' },
];

const FORMAT_OPTIONS: Array<{
  value: RasterFormat;
  label: string;
}> = [
  { value: 'png', label: 'PNG' },
  { value: 'webp', label: 'WebP' },
  { value: 'avif', label: 'AVIF' },
  { value: 'jpg', label: 'JPG' },
];

const PLATFORM_OPTIONS: Array<{
  value: ExportPlatform;
  label: string;
  description: string;
}> = [
  {
    value: 'android',
    label: 'Android',
    description: 'Adaptive + themed + Play Store',
  },
  { value: 'ios', label: 'iOS', description: 'Xcode AppIcon' },
  { value: 'web', label: 'Web', description: 'Favicon + PWA + maskable' },
  { value: 'macos', label: 'macOS', description: 'Xcode + ICNS' },
];

const WORKFLOW_STEPS = [
  ['Describe', 'Your idea'],
  ['Generate', '4 concepts'],
  ['Pick', 'Choose favorite'],
  ['HD Master', 'Upscale when needed'],
  ['Export', 'Download assets'],
] as const;

const PROMPT_PLACEHOLDERS = [
  'A playful weather app icon with a smiling sun and soft clouds.',
  'A focused finance app icon with a rising chart and bold contrast.',
  'A calming meditation app icon with a moon, stars, and pastel tones.',
  'A retro music app icon with a cassette tape and neon colors.',
] as const;

const CHECKERBOARD_STYLE: CSSProperties = {
  backgroundColor: '#ffffff',
  backgroundImage:
    'linear-gradient(45deg, #f1f1ed 25%, transparent 25%), linear-gradient(-45deg, #f1f1ed 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f1f1ed 75%), linear-gradient(-45deg, transparent 75%, #f1f1ed 75%)',
  backgroundPosition: '0 0, 0 12px, 12px -12px, -12px 0px',
  backgroundSize: '24px 24px',
};

function errorMessage(error: unknown) {
  const code =
    typeof error === 'string'
      ? error
      : error instanceof Error
        ? error.message
        : '';
  const messages: Record<string, string> = {
    BUDGET_EXHAUSTED:
      'Generation is temporarily unavailable. Please try again later.',
    DAILY_LIMIT_REACHED: 'You have reached today’s generation limit.',
    INSUFFICIENT_CREDITS: 'You do not have enough credits for this action.',
    PAID_ACCESS_REQUIRED: 'Upgrade your plan to continue generating.',
    EXPORT_FROZEN: 'Upgrade your plan to export this icon.',
    HD_MASTER_REQUIRED:
      'This export needs a 1024 × 1024 HD master. Generate it and try again.',
    PROVIDER_UNAVAILABLE:
      'The image provider rejected this request. Please try again later.',
    INVALID_IMAGE:
      'The image provider returned an invalid image. Please try again.',
    PROJECT_NOT_FOUND: 'This project is no longer available.',
  };
  return messages[code] ?? 'Something went wrong. Please try again.';
}

function sectionTitle(number: string, title: string) {
  return (
    <h2 className="flex items-center gap-2.5 text-sm font-extrabold uppercase tracking-[0.08em]">
      <span className="flex size-7 items-center justify-center rounded-full bg-[#7a5cff] text-xs font-extrabold text-white">
        {number}
      </span>
      {title}
    </h2>
  );
}

function ImageArtwork({ src, alt }: { src?: string; alt: string }) {
  if (!src) return null;
  return <img src={src} alt={alt} className="h-full w-full object-contain" />;
}

export function GenerateForm({
  projectId,
  initialExportPlatform,
  initialExportMode,
}: {
  projectId?: string;
  initialExportPlatform?: ExportPlatform;
  initialExportMode?: ExportMode;
}) {
  const { data: session } = authClient.useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const hydratedProjectId = useRef<string | null>(null);
  const creditJobSignature = useRef<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [styleId, setStyleId] = useState('neo-brutalism-bold-flat');
  const [color, setColor] = useState('#9b7bff');
  const [backgroundMode, setBackgroundMode] = useState<'transparent' | 'solid'>(
    'transparent'
  );
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(
    null
  );
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate>('A');
  const [references, setReferences] = useState<ReferenceImage[]>([]);
  const [exportMode, setExportMode] = useState<ExportMode>(
    initialExportMode ?? (initialExportPlatform ? 'packages' : 'image')
  );
  const [format, setFormat] = useState<RasterFormat>('png');
  const [exportSize, setExportSize] = useState(512);
  const [platforms, setPlatforms] = useState<ExportPlatform[]>([
    initialExportPlatform ?? 'ios',
  ]);
  const [pendingAction, setPendingAction] = useState<
    'generate' | 'export' | 'copy' | 'reference' | 'upload-reference' | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [observedJobId, setObservedJobId] = useState<string | null>(null);
  const [exportId, setExportId] = useState<string | null>(null);
  const [pendingHdExport, setPendingHdExport] =
    useState<PendingHdExport | null>(null);

  const projectQuery = useQuery({
    queryKey: ['noddi-project', projectId],
    enabled: Boolean(projectId),
    queryFn: async () => {
      if (!projectId) throw new Error('Project is required');
      return getProject({ data: { projectId } });
    },
    refetchInterval: (query) =>
      query.state.data?.jobs.some((job) =>
        ['queued', 'processing'].includes(job.status)
      )
        ? 2_000
        : false,
  });

  const projectHistoryQuery = useQuery({
    queryKey: ['noddi-projects'],
    queryFn: () => listProjects(),
    enabled: Boolean(session?.user),
    staleTime: 30_000,
  });

  const exportQuery = useQuery({
    queryKey: ['noddi-export', exportId],
    enabled: Boolean(exportId),
    queryFn: async () => {
      if (!exportId) throw new Error('Export is required');
      return getExportStatus({ data: { exportId } });
    },
    refetchInterval: (query) =>
      ['queued', 'processing'].includes(query.state.data?.status ?? '')
        ? 1_500
        : false,
  });

  const projectData = projectQuery.data;

  useEffect(() => {
    // Worker debit/refund happens after queueing; refresh navbar credits on job changes.
    const jobs = projectData?.jobs ?? [];
    const signature = jobs
      .map(
        (job) =>
          `${job.id}:${job.status}:${job.planDebited}:${job.purchasedDebited}`
      )
      .join('|');
    if (creditJobSignature.current === null) {
      creditJobSignature.current = signature;
      return;
    }
    if (creditJobSignature.current === signature) return;
    creditJobSignature.current = signature;
    void queryClient.invalidateQueries({ queryKey: ['noddi-credits'] });
    void queryClient.invalidateQueries({ queryKey: ['noddi-ledger'] });
  }, [projectData?.jobs, queryClient]);

  const generationVersions = useMemo(
    () =>
      (projectData?.versions ?? [])
        .filter((version) => version.type === 'concept_sheet')
        .sort((first, second) => second.versionNumber - first.versionNumber),
    [projectData?.versions]
  );
  const selectedVersion =
    generationVersions.find((version) => version.id === selectedVersionId) ??
    generationVersions[0];
  const candidates = useMemo(
    () =>
      (projectData?.assets ?? [])
        .filter(
          ({ asset }) =>
            asset.versionId === selectedVersion?.id &&
            asset.status === 'active' &&
            asset.role.startsWith('candidate_')
        )
        .map(({ asset, file }) => ({
          candidate: asset.role.slice(-1) as Candidate,
          assetId: asset.id,
          fileId: file.id,
          source: `/api/storage/file?key=${encodeURIComponent(file.r2Key)}`,
          versionId: asset.versionId,
        }))
        .sort((first, second) =>
          first.candidate.localeCompare(second.candidate)
        ),
    [selectedVersion?.id, projectData?.assets]
  );
  const selectedAsset = candidates.find(
    ({ candidate }) => candidate === selectedCandidate
  );
  const previewSource = selectedAsset?.source;
  const previewAlt = selectedAsset
    ? `Generated variation ${selectedCandidate}`
    : 'App icon preview placeholder';
  const selectedVersionIndex = selectedVersion
    ? generationVersions.findIndex(
        (version) => version.id === selectedVersion.id
      )
    : -1;
  const selectedVersionLabel =
    selectedVersionIndex >= 0
      ? `V${generationVersions.length - selectedVersionIndex}`
      : null;
  const selectedIsReference = selectedAsset
    ? references.some((reference) => reference.fileId === selectedAsset.fileId)
    : false;
  const hdMasterJobs = useMemo(
    () =>
      selectedAsset
        ? (projectData?.jobs ?? []).filter(
            (job) =>
              job.operation === 'hd_master' &&
              job.inputVersionId === selectedAsset.versionId &&
              job.candidate === selectedCandidate
          )
        : [],
    [projectData?.jobs, selectedAsset, selectedCandidate]
  );
  const hdMasterJobIds = useMemo(
    () =>
      new Set(
        hdMasterJobs
          .filter((job) => job.status === 'succeeded')
          .map((job) => job.id)
      ),
    [hdMasterJobs]
  );
  const hdMasterAsset = (projectData?.assets ?? []).find(
    ({ asset }) =>
      asset.role === 'hd_master' &&
      asset.status === 'active' &&
      asset.jobId !== null &&
      hdMasterJobIds.has(asset.jobId)
  );
  const hdMasterPendingJob = hdMasterJobs.find((job) =>
    ['queued', 'processing'].includes(job.status)
  );
  const requiresHdExport =
    (exportMode === 'image' && exportSize > 512) ||
    (exportMode === 'packages' &&
      platforms.some((platform) => platform === 'ios' || platform === 'macos'));
  const hdMasterReady = Boolean(hdMasterAsset);
  const exportBusy =
    pendingAction === 'export' ||
    exportQuery.isFetching ||
    ['queued', 'processing'].includes(exportQuery.data?.status ?? '');
  const isGenerating = projectData?.jobs.some(
    (job) =>
      job.operation === 'grid' && ['queued', 'processing'].includes(job.status)
  );
  const generationInProgress =
    pendingAction === 'generate' ||
    isGenerating === true ||
    (observedJobId !== null && projectQuery.isPending);
  const observedJob = projectData?.jobs.find((job) => job.id === observedJobId);
  const jobFailure =
    observedJob && ['failed', 'refunded'].includes(observedJob.status)
      ? errorMessage(observedJob.failureCode ?? '')
      : null;
  const exportFailure =
    exportQuery.data?.status === 'failed'
      ? errorMessage(exportQuery.data.failureCode ?? '')
      : null;
  const pendingHdJob = pendingHdExport
    ? projectData?.jobs.find((job) => job.id === pendingHdExport.jobId)
    : undefined;
  const hdMasterFailure =
    pendingHdJob && ['failed', 'refunded'].includes(pendingHdJob.status)
      ? errorMessage(pendingHdJob.failureCode ?? '')
      : null;
  const displayedError =
    error ??
    jobFailure ??
    hdMasterFailure ??
    exportFailure ??
    (projectQuery.error ? 'Could not load the generation status.' : null);
  const workflowStep =
    exportQuery.data?.status === 'succeeded'
      ? 5
      : hdMasterReady
        ? 4
        : selectedAsset
          ? 3
          : generationVersions.length
            ? 2
            : 1;

  useEffect(() => {
    if (!generationVersions.length) return;
    if (
      !selectedVersionId ||
      !generationVersions.some((version) => version.id === selectedVersionId)
    ) {
      setSelectedVersionId(generationVersions[0].id);
      setSelectedCandidate('A');
    }
  }, [generationVersions, selectedVersionId]);

  useEffect(() => {
    if (!candidates.length) return;
    if (!candidates.some(({ candidate }) => candidate === selectedCandidate)) {
      setSelectedCandidate(candidates[0].candidate);
    }
  }, [candidates, selectedCandidate]);

  useEffect(() => {
    if (observedJob?.status !== 'succeeded' || !observedJob.outputVersionId)
      return;
    setSelectedVersionId(observedJob.outputVersionId);
    setSelectedCandidate('A');
  }, [observedJob?.outputVersionId, observedJob?.status]);

  useEffect(() => {
    if (prompt) return;
    const interval = window.setInterval(() => {
      setPlaceholderIndex((index) => (index + 1) % PROMPT_PLACEHOLDERS.length);
    }, 3_500);
    return () => window.clearInterval(interval);
  }, [prompt]);

  useEffect(() => {
    if (!projectData || hydratedProjectId.current === projectData.project.id)
      return;
    try {
      const stored = JSON.parse(projectData.project.brief) as {
        productDescription?: string;
        style?: string;
        primaryColor?: string;
        background?: string;
      };
      let storedPrompt = stored.productDescription?.trim() ?? '';
      const legacyMarker = '\nStyle: ';
      const legacyIndex = storedPrompt.lastIndexOf(legacyMarker);
      if (legacyIndex >= 0) {
        const legacySettings = storedPrompt.slice(legacyIndex + 1);
        storedPrompt = storedPrompt.slice(0, legacyIndex).trim();
        const styleLabel = legacySettings.match(/^Style: ([^.]+)\./m)?.[1];
        const colorLabel = legacySettings.match(
          /^Accent color: ([^.]+)\./m
        )?.[1];
        const background = legacySettings.match(/^Background: ([^.]+)\./m)?.[1];
        const style = STYLE_OPTIONS.find(
          (option) => option.label.toLowerCase() === styleLabel?.toLowerCase()
        );
        const presetColor = COLOR_OPTIONS.find(
          (option) => option.label.toLowerCase() === colorLabel?.toLowerCase()
        );
        if (style) setStyleId(style.id);
        if (presetColor) setColor(presetColor.value);
        if (background === 'transparent') {
          setBackgroundMode('transparent');
        } else {
          const solidColor = background?.match(/solid\s+(#[0-9a-f]{6})/i)?.[1];
          if (solidColor) {
            setBackgroundMode('solid');
            setBackgroundColor(solidColor);
          }
        }
      } else {
        const style = STYLE_OPTIONS.find(
          (option) =>
            option.id === stored.style ||
            option.label === stored.style ||
            option.prompt === stored.style
        );
        if (style) setStyleId(style.id);
        if (stored.primaryColor?.startsWith('#')) setColor(stored.primaryColor);
        if (stored.background === 'transparent') {
          setBackgroundMode('transparent');
        } else {
          const solidColor = stored.background?.match(
            /solid\s+(#[0-9a-f]{6})/i
          )?.[1];
          if (solidColor) {
            setBackgroundMode('solid');
            setBackgroundColor(solidColor);
          }
        }
      }
      if (storedPrompt) setPrompt(storedPrompt);
    } catch {
      // Keep the local defaults for legacy or malformed project settings.
    }
    hydratedProjectId.current = projectData.project.id;
  }, [projectData]);

  useEffect(() => {
    if (!projectData) return;
    setReferences(
      projectData.referenceFiles.map((file) => ({
        fileId: file.id,
        source: `/api/storage/file?key=${encodeURIComponent(file.r2Key)}`,
        name: file.originalName,
      }))
    );
  }, [projectData]);

  useEffect(() => {
    setExportId(null);
  }, [selectedAsset?.assetId]);

  useEffect(() => {
    if (!pendingHdExport || !projectData || !projectId) return;
    const job = projectData.jobs.find(
      (item) => item.id === pendingHdExport.jobId
    );
    if (!job) return;
    if (['failed', 'refunded'].includes(job.status)) {
      setError(errorMessage(job.failureCode ?? ''));
      setPendingHdExport(null);
      setPendingAction(null);
      return;
    }
    if (job.status !== 'succeeded') return;
    const master = projectData.assets.find(
      ({ asset }) =>
        asset.jobId === job.id &&
        asset.role === 'hd_master' &&
        asset.status === 'active'
    );
    if (!master) return;
    const intent = pendingHdExport.intent;
    setPendingHdExport(null);
    void (async () => {
      try {
        const result = await queueExport({
          data:
            intent.kind === 'image'
              ? {
                  kind: 'image',
                  projectId,
                  sourceAssetId: master.asset.id,
                  rasterFormat: intent.rasterFormat,
                  size: intent.size,
                }
              : {
                  kind: 'packages',
                  projectId,
                  sourceAssetId: master.asset.id,
                  platforms: intent.platforms,
                },
        });
        setExportId(result.id);
        await projectQuery.refetch();
      } catch (caught) {
        setError(errorMessage(caught));
      } finally {
        setPendingAction(null);
      }
    })();
  }, [pendingHdExport, projectData, projectId]);

  function invalidateExport() {
    setExportId(null);
  }

  function togglePlatform(platform: ExportPlatform) {
    invalidateExport();
    setPlatforms((current) =>
      current.includes(platform)
        ? current.filter((item) => item !== platform)
        : [...current, platform]
    );
  }

  function generationSettings() {
    const style =
      STYLE_OPTIONS.find((option) => option.id === styleId) ?? STYLE_OPTIONS[0];
    return {
      prompt: prompt.trim(),
      style: style.prompt,
      primaryColor: color,
      background:
        backgroundMode === 'transparent'
          ? 'transparent'
          : `solid ${backgroundColor}`,
      referenceFileIds: references.map((reference) => reference.fileId),
    };
  }

  async function submit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session?.user) return;
    setError(null);
    setObservedJobId(null);
    setPendingAction('generate');
    try {
      const settings = generationSettings();
      if (projectId) {
        const job = await generateVersion({
          data: {
            projectId,
            ...settings,
            requestId: crypto.randomUUID(),
          },
        });
        setObservedJobId(job.id);
        await projectQuery.refetch();
      } else {
        const result = await startProject({
          data: {
            ...settings,
            requestId: crypto.randomUUID(),
          },
        });
        setObservedJobId(result.job.id);
        await navigate({
          to: '/generate',
          search: { project: result.projectId },
          replace: true,
        });
      }
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setPendingAction(null);
    }
  }

  async function persistReferences(next: ReferenceImage[]) {
    setReferences(next);
    if (!projectId) return;
    await setProjectReferences({
      data: {
        projectId,
        referenceFileIds: next.map((reference) => reference.fileId),
      },
    });
    await projectQuery.refetch();
  }

  async function toggleSelectedReference() {
    if (!selectedAsset || generationInProgress) return;
    setError(null);
    setPendingAction('reference');
    try {
      if (selectedIsReference) {
        await persistReferences(
          references.filter(
            (reference) => reference.fileId !== selectedAsset.fileId
          )
        );
      } else {
        if (references.length >= 4) {
          setError('You can use up to 4 reference images.');
          return;
        }
        await persistReferences([
          ...references,
          {
            fileId: selectedAsset.fileId,
            source: selectedAsset.source,
            name: `${selectedVersionLabel ?? 'Version'} · ${selectedCandidate}`,
          },
        ]);
      }
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setPendingAction(null);
    }
  }

  async function removeReference(fileId: string) {
    if (generationInProgress) return;
    setError(null);
    setPendingAction('reference');
    try {
      await persistReferences(
        references.filter((reference) => reference.fileId !== fileId)
      );
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setPendingAction(null);
    }
  }

  async function uploadReferences(files: FileList | null) {
    if (!files?.length || generationInProgress) return;
    const room = 4 - references.length;
    if (room <= 0) {
      setError('You can use up to 4 reference images.');
      return;
    }
    const selected = Array.from(files).slice(0, room);
    const invalid = selected.find(
      (file) => !['image/png', 'image/jpeg', 'image/webp'].includes(file.type)
    );
    if (invalid) {
      setError('Reference images must be PNG, JPEG, or WebP.');
      return;
    }
    setError(null);
    setPendingAction('upload-reference');
    try {
      const uploaded: ReferenceImage[] = [];
      for (const file of selected) {
        const form = new FormData();
        form.append('file', file);
        form.append('folder', 'noddi-references');
        form.append('isPublic', 'false');
        form.append('description', 'noddi generation reference');
        const result = await uploadUserFile({ data: form });
        if (!result.metadata) throw new Error('INVALID_IMAGE');
        uploaded.push({
          fileId: result.metadata.id,
          source: `/api/storage/file?key=${encodeURIComponent(result.metadata.r2Key)}`,
          name: result.metadata.originalName,
        });
      }
      await persistReferences([...references, ...uploaded]);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setPendingAction(null);
    }
  }

  async function createExport() {
    if (!projectId || !selectedAsset) return;
    const intent: ExportIntent =
      exportMode === 'image'
        ? { kind: 'image', rasterFormat: format, size: exportSize }
        : { kind: 'packages', platforms: [...platforms] };
    setError(null);
    setPendingAction('export');
    let waitingForHdMaster = false;
    try {
      let sourceAssetId = selectedAsset.assetId;
      if (requiresHdExport) {
        if (hdMasterAsset) {
          sourceAssetId = hdMasterAsset.asset.id;
        } else {
          const prepared = await ensureHdMaster({
            data: { projectId, sourceAssetId: selectedAsset.assetId },
          });
          if (prepared.status === 'ready') {
            sourceAssetId = prepared.masterAssetId;
          } else {
            waitingForHdMaster = true;
            setPendingHdExport({ jobId: prepared.jobId, intent });
            await projectQuery.refetch();
            return;
          }
        }
      }
      const result = await queueExport({
        data:
          intent.kind === 'image'
            ? {
                kind: 'image',
                projectId,
                sourceAssetId,
                rasterFormat: intent.rasterFormat,
                size: intent.size,
              }
            : {
                kind: 'packages',
                projectId,
                sourceAssetId,
                platforms: intent.platforms,
              },
      });
      setExportId(result.id);
      await projectQuery.refetch();
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      if (!waitingForHdMaster) setPendingAction(null);
    }
  }

  async function copyPreview() {
    if (
      !previewSource ||
      !navigator.clipboard?.write ||
      !window.ClipboardItem
    ) {
      setError('Clipboard images are not supported by this browser.');
      return;
    }
    setError(null);
    setPendingAction('copy');
    try {
      const response = await fetch(previewSource);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob }),
      ]);
    } catch {
      setError('Could not copy the image. Please download it instead.');
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="mx-auto w-full max-w-[1600px] px-4 pb-8 pt-5 lg:px-6"
    >
      <div className="mb-3 overflow-x-auto rounded-xl border border-[#dedde3] bg-white px-3 py-2.5 shadow-[0_6px_18px_rgba(17,17,17,0.035)]">
        <div className="mx-auto flex min-w-[560px] max-w-3xl items-start justify-between">
          {WORKFLOW_STEPS.map(([label, hint], index) => {
            const step = index + 1;
            const active = workflowStep >= step;
            return (
              <div
                key={label}
                className="flex min-w-0 flex-1 items-start last:flex-none"
              >
                <div className="min-w-[72px] text-center">
                  <span
                    className={cn(
                      'mx-auto flex size-6 items-center justify-center rounded-full border-2 text-[10px] font-extrabold transition-colors',
                      active
                        ? 'border-[#7a5cff] bg-[#7a5cff] text-white'
                        : 'border-[#d8d7dd] bg-[#f6f5f2] text-[#777]'
                    )}
                  >
                    {step}
                  </span>
                  <p className="mt-1 text-[11px] font-extrabold leading-4">
                    {label}
                  </p>
                  <p className="text-[9px] leading-3.5 text-[#777]">{hint}</p>
                </div>
                {step < WORKFLOW_STEPS.length ? (
                  <span
                    aria-hidden="true"
                    className={cn(
                      'mt-3 h-px flex-1',
                      workflowStep > step ? 'bg-[#7a5cff]' : 'bg-[#dedde3]'
                    )}
                  />
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)_320px]">
        <section className="rounded-2xl border border-[#dedde3] bg-[#fbfbf8] p-4 shadow-[0_10px_28px_rgba(17,17,17,0.05)] sm:p-5">
          <div className="space-y-4">
            {sectionTitle('1', 'SETTINGS')}
            <div className="space-y-2">
              <div className="flex items-baseline justify-between gap-3">
                <label htmlFor="prompt" className="text-sm font-bold">
                  Prompt
                </label>
                <span className="text-xs text-muted-foreground">
                  {prompt.length}/1500
                </span>
              </div>
              <div className="relative">
                <Textarea
                  id="prompt"
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  required
                  minLength={4}
                  maxLength={1_500}
                  className="min-h-24 resize-y rounded-xl border-[#c9c7cf] bg-white text-sm leading-5 focus-visible:border-[#7a5cff] focus-visible:ring-[#7a5cff]/20"
                  placeholder=""
                />
                {!prompt ? (
                  <span
                    key={placeholderIndex}
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3 top-3.5 right-3 text-sm leading-5 text-muted-foreground animate-in fade-in-0 slide-in-from-bottom-1 duration-300 motion-reduce:animate-none"
                  >
                    {PROMPT_PLACEHOLDERS[placeholderIndex]}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-bold">Reference images</p>
                <span className="text-xs text-muted-foreground">
                  {references.length}/4
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {references.map((reference) => (
                  <div
                    key={reference.fileId}
                    className="group relative aspect-square overflow-hidden rounded-xl border border-[#d8d7dd] bg-white"
                  >
                    <img
                      src={reference.source}
                      alt={reference.name}
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      aria-label={`Remove ${reference.name} from references`}
                      title="Remove reference"
                      onClick={() => void removeReference(reference.fileId)}
                      disabled={generationInProgress || pendingAction !== null}
                      className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full border border-black bg-white/95 opacity-90 shadow-sm hover:bg-[#f7f6f2] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <IconX className="size-3.5" />
                    </button>
                  </div>
                ))}
                {references.length < 4 ? (
                  <label
                    className={cn(
                      'flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-[#bdbbc5] bg-white text-center text-[10px] font-semibold hover:border-black',
                      (!session?.user ||
                        generationInProgress ||
                        pendingAction !== null) &&
                        'pointer-events-none opacity-50'
                    )}
                  >
                    {pendingAction === 'upload-reference' ? (
                      <IconLoader2 className="size-5 animate-spin" />
                    ) : (
                      <IconPlus className="size-5" />
                    )}
                    Add
                    <input
                      type="file"
                      multiple
                      accept="image/png,image/jpeg,image/webp"
                      disabled={
                        !session?.user ||
                        generationInProgress ||
                        pendingAction !== null
                      }
                      onChange={(event) => {
                        void uploadReferences(event.currentTarget.files);
                        event.currentTarget.value = '';
                      }}
                      className="sr-only"
                    />
                  </label>
                ) : null}
              </div>
              <p className="text-[10px] leading-3.5 text-muted-foreground">
                Upload or add a variation from Preview. References guide the
                next version.
              </p>
            </div>

            <fieldset className="space-y-2">
              <legend className="text-sm font-bold">Style</legend>
              <div className="flex flex-wrap gap-2">
                {STYLE_OPTIONS.map((option) => {
                  const selected = option.id === styleId;
                  return (
                    <SketchFrame
                      key={option.id}
                      color={selected ? '#7a5cff' : '#111111'}
                      className={cn(
                        'style-option-frame size-10 rounded-md transition-colors',
                        selected
                          ? 'bg-[#f1ebff]'
                          : 'bg-white hover:bg-[#f7f6f2] [&_.sketch-frame-border]:hidden'
                      )}
                    >
                      <button
                        type="button"
                        aria-label={option.label}
                        aria-pressed={selected}
                        title={option.label}
                        onClick={() => setStyleId(option.id)}
                        className="group relative flex size-full items-center justify-center"
                      >
                        <img
                          src={option.image}
                          alt=""
                          aria-hidden="true"
                          className="size-10 rounded-md bg-[#f7f6f2] object-cover"
                        />
                        <span className="pointer-events-none absolute bottom-[calc(100%+0.25rem)] left-1/2 z-30 w-max max-w-44 -translate-x-1/2 rounded-md bg-black px-2 py-1 text-center text-[10px] font-medium leading-3 text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                          {option.label}
                        </span>
                      </button>
                    </SketchFrame>
                  );
                })}
              </div>
            </fieldset>

            <fieldset className="space-y-2">
              <legend className="text-sm font-bold">Colors</legend>
              <div className="flex flex-wrap items-center gap-2">
                {COLOR_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    aria-label={option.label}
                    aria-pressed={color === option.value}
                    title={option.label}
                    onClick={() => setColor(option.value)}
                    className={cn(
                      'size-7 rounded-full border-2 border-white outline outline-1 transition-transform hover:scale-110',
                      color === option.value
                        ? 'outline-[#9b7bff]'
                        : 'outline-[#d8d6d0]'
                    )}
                    style={{ backgroundColor: option.value }}
                  >
                    {color === option.value ? (
                      <IconCheck
                        className={cn(
                          'mx-auto size-4',
                          option.value === '#111111'
                            ? 'text-white'
                            : 'text-black'
                        )}
                        aria-hidden="true"
                      />
                    ) : null}
                  </button>
                ))}
                <label className="flex items-center gap-2 text-xs font-semibold">
                  <span className="sr-only">Custom accent color</span>
                  <input
                    type="color"
                    value={color}
                    onChange={(event) => setColor(event.target.value)}
                    className="size-7 cursor-pointer rounded-full border border-[#d8d6d0] bg-white p-0.5"
                  />
                  {color.toUpperCase()}
                </label>
              </div>
            </fieldset>

            <fieldset className="space-y-2">
              <legend className="text-sm font-bold">Background</legend>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  aria-pressed={backgroundMode === 'transparent'}
                  onClick={() => setBackgroundMode('transparent')}
                  className={cn(
                    'flex min-h-9 items-center justify-center rounded-xl border px-2 text-xs font-semibold',
                    backgroundMode === 'transparent'
                      ? 'border-2 border-[#9b7bff]'
                      : 'border-[#d8d6d0] hover:border-black'
                  )}
                >
                  Transparent
                </button>
                <label
                  className={cn(
                    'flex min-h-9 cursor-pointer items-center justify-center gap-2 rounded-xl border px-2 text-xs font-semibold',
                    backgroundMode === 'solid'
                      ? 'border-2 border-[#9b7bff]'
                      : 'border-[#d8d6d0] hover:border-black'
                  )}
                >
                  <span className="sr-only">Background color</span>
                  <input
                    type="color"
                    value={backgroundColor}
                    onFocus={() => setBackgroundMode('solid')}
                    onChange={(event) => {
                      setBackgroundColor(event.target.value);
                      setBackgroundMode('solid');
                    }}
                    className="size-5 cursor-pointer bg-transparent p-0"
                  />
                  Solid
                </label>
              </div>
            </fieldset>

            {session?.user ? (
              generationInProgress ? (
                <Button
                  type="button"
                  disabled
                  aria-live="polite"
                  className="min-h-12 w-full text-sm font-bold"
                >
                  <IconLoader2 className="size-5 animate-spin" />
                  Generating…
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={pendingAction !== null || !prompt.trim()}
                  className="min-h-12 w-full text-sm font-bold"
                >
                  <IconWand className="size-5" />
                  Generate <span className="text-[#6548d8]">⚡ −2</span>
                </Button>
              )
            ) : (
              <Button
                render={<Link to="/auth/login" />}
                className="min-h-12 w-full text-sm font-bold"
              >
                Sign in to generate <IconArrowDown className="-rotate-90" />
              </Button>
            )}
          </div>
        </section>

        <section className="min-w-0 rounded-2xl border border-[#dedde3] bg-white p-4 shadow-[0_10px_28px_rgba(17,17,17,0.05)] sm:p-5">
          <div className="flex min-h-full flex-col">
            <div className="flex flex-wrap items-center justify-between gap-2">
              {sectionTitle('2', 'PREVIEW')}
              {selectedVersionLabel && selectedAsset ? (
                <span className="rounded-full border border-[#d8d6d0] px-3 py-1 text-xs font-bold">
                  {selectedVersionLabel} · {selectedCandidate}
                </span>
              ) : null}
            </div>

            {generationVersions.length ? (
              <div className="mt-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    Versions
                  </h3>
                  <span className="text-[11px] text-muted-foreground">
                    Each Generate creates a new version
                  </span>
                </div>
                <div className="mt-1.5 flex gap-1.5 overflow-x-auto pb-0.5">
                  {generationVersions.map((version, index) => {
                    const label = `V${generationVersions.length - index}`;
                    const selected = version.id === selectedVersion?.id;
                    return (
                      <button
                        key={version.id}
                        type="button"
                        aria-pressed={selected}
                        disabled={exportBusy}
                        onClick={() => {
                          setSelectedVersionId(version.id);
                          setSelectedCandidate('A');
                        }}
                        className={cn(
                          'min-h-8 shrink-0 rounded-md border px-2.5 text-xs font-bold transition-colors',
                          selected
                            ? 'border-2 border-[#9b7bff] bg-[#9b7bff]/5'
                            : 'border-[#d8d6d0] bg-white hover:border-black'
                        )}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            <div
              className="relative mx-auto mt-4 aspect-square w-full max-w-[430px] overflow-hidden rounded-2xl border border-[#c9c7cf] bg-[#fbfbf8]"
              style={
                backgroundMode === 'transparent'
                  ? CHECKERBOARD_STYLE
                  : { backgroundColor }
              }
            >
              <ImageArtwork src={previewSource} alt={previewAlt} />
              {generationInProgress && !selectedAsset ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/75 text-center backdrop-blur-[1px]">
                  <IconLoader2 className="size-9 animate-spin text-[#9b7bff]" />
                  <p className="mt-3 text-xl font-extrabold tracking-[-0.03em]">
                    Creating your concepts…
                  </p>
                  <p className="mt-1 px-6 text-sm text-muted-foreground">
                    Your preview will appear here as soon as it is ready.
                  </p>
                </div>
              ) : null}
              {!generationInProgress && !selectedAsset ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center text-muted-foreground">
                  <IconPhoto className="size-10" />
                  <p className="mt-3 text-sm font-semibold">
                    Generate a version to see your variations here.
                  </p>
                </div>
              ) : null}
            </div>

            <div className="mt-2 flex flex-wrap justify-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                onClick={toggleSelectedReference}
                disabled={
                  !selectedAsset ||
                  generationInProgress ||
                  pendingAction !== null ||
                  (!selectedIsReference && references.length >= 4)
                }
                className="min-h-9 border-black bg-white text-xs font-semibold"
              >
                {pendingAction === 'reference' ? (
                  <IconLoader2 className="size-4 animate-spin" />
                ) : selectedIsReference ? (
                  <IconX className="size-4" />
                ) : (
                  <IconPlus className="size-4" />
                )}
                {selectedIsReference
                  ? 'Remove from references'
                  : 'Add to references'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={copyPreview}
                disabled={!previewSource || pendingAction !== null}
                className="min-h-9 border-black bg-white text-xs font-semibold"
              >
                {pendingAction === 'copy' ? (
                  <IconLoader2 className="size-4 animate-spin" />
                ) : (
                  <IconCopy className="size-4" />
                )}
                Copy
              </Button>
            </div>

            {displayedError ? (
              <p
                role="alert"
                className="mt-2 rounded-md border border-red-300 bg-red-50 px-3 py-1.5 text-xs text-red-700"
              >
                {displayedError}
              </p>
            ) : null}

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg font-extrabold tracking-[-0.02em]">
                Your concepts
              </h3>
              {selectedVersionLabel ? (
                <span className="text-xs font-semibold text-muted-foreground">
                  {selectedVersionLabel}
                </span>
              ) : null}
            </div>

            <div className="mt-2 overflow-x-auto pb-1">
              <div className="mx-auto grid min-w-[500px] max-w-[620px] grid-cols-4 gap-2">
                {candidates.length
                  ? candidates.map((candidate) => (
                      <button
                        key={`${candidate.versionId}-${candidate.candidate}`}
                        type="button"
                        aria-pressed={selectedCandidate === candidate.candidate}
                        disabled={exportBusy}
                        onClick={() =>
                          setSelectedCandidate(candidate.candidate)
                        }
                        className={cn(
                          'relative aspect-square overflow-hidden rounded-xl border bg-white p-1 transition-all hover:border-black',
                          selectedCandidate === candidate.candidate
                            ? 'border-2 border-[#7a5cff] shadow-[2px_2px_0_#c6ff5b]'
                            : 'border-[#d8d7dd] shadow-[0_5px_14px_rgba(17,17,17,0.04)]'
                        )}
                      >
                        <img
                          src={candidate.source}
                          alt={`Variation ${candidate.candidate}`}
                          className="h-full w-full object-cover"
                        />
                        <span className="absolute bottom-1 left-1 rounded bg-white/90 px-1.5 py-0.5 text-[10px] font-bold">
                          {candidate.candidate}
                        </span>
                      </button>
                    ))
                  : Array.from({ length: 4 }, (_, index) => (
                      <div
                        // Empty slots reserve the layout without implying a generated result.
                        key={index}
                        aria-hidden="true"
                        className="sunburst-placeholder aspect-square rounded-xl border border-dashed border-[#c9c7cf]"
                        style={
                          backgroundMode === 'transparent'
                            ? CHECKERBOARD_STYLE
                            : { backgroundColor }
                        }
                      />
                    ))}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-[#dedde3] bg-white p-4 shadow-[0_10px_28px_rgba(17,17,17,0.05)] sm:p-5 xl:row-span-1">
          <div className="space-y-6">
            {sectionTitle('3', 'EXPORT')}

            <div className="flex min-h-14 items-center gap-3 rounded-xl border border-[#d8d7dd] bg-[#fbfbf8] p-2.5">
              {selectedAsset ? (
                <img
                  src={selectedAsset.source}
                  alt=""
                  className="size-10 shrink-0 rounded border border-[#d8d6d0] object-cover"
                />
              ) : (
                <div className="flex size-10 shrink-0 items-center justify-center rounded border border-dashed border-[#bdbbb4]">
                  <IconPhoto className="size-4 text-muted-foreground" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                  Selected artwork
                </p>
                <p className="truncate text-sm font-bold">
                  {selectedAsset && selectedVersionLabel
                    ? `${selectedVersionLabel} · Variation ${selectedCandidate}`
                    : 'No artwork selected'}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-[#d8d7dd] bg-white px-3 py-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold">HD master</p>
                  <p className="text-[11px] text-muted-foreground">
                    {selectedAsset
                      ? hdMasterReady
                        ? '1024 × 1024 production master ready'
                        : hdMasterPendingJob
                          ? 'Generating 1024 × 1024 master…'
                          : 'Not generated yet'
                      : 'Select a variation first'}
                  </p>
                </div>
                {selectedAsset ? (
                  <span className="shrink-0 rounded-full border border-[#d8d6d0] px-2 py-1 text-[10px] font-bold">
                    {hdMasterReady
                      ? 'READY'
                      : `⚡${HD_MASTER_CREDIT_COST} FIRST TIME`}
                  </span>
                ) : null}
              </div>
              <p className="mt-2 text-[10px] leading-4 text-muted-foreground">
                One HD master unlocks 1024px image export plus iOS and macOS for
                this variation. It is generated only once.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  ['image', 'Image file'],
                  ['packages', 'Developer package'],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={exportMode === value}
                  disabled={exportBusy}
                  onClick={() => {
                    invalidateExport();
                    setExportMode(value);
                  }}
                  className={cn(
                    'min-h-12 rounded-xl border px-2 text-xs font-bold',
                    exportMode === value
                      ? 'border-2 border-[#9b7bff] bg-[#9b7bff]/5'
                      : 'border-[#d8d6d0] hover:border-black'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            {exportMode === 'image' ? (
              <>
                <fieldset className="space-y-2">
                  <legend className="text-sm font-bold">Size</legend>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[128, 256, 512, 1024].map((size) => (
                      <button
                        key={size}
                        type="button"
                        aria-pressed={exportSize === size}
                        disabled={exportBusy}
                        onClick={() => {
                          invalidateExport();
                          setExportSize(size);
                        }}
                        className={cn(
                          'min-h-9 rounded-xl border text-xs font-semibold',
                          exportSize === size
                            ? 'border-2 border-[#9b7bff]'
                            : 'border-[#d8d6d0] hover:border-black'
                        )}
                      >
                        {size}
                        {size > 512 && !hdMasterReady ? (
                          <span className="ml-1 text-[10px]">
                            ⚡{HD_MASTER_CREDIT_COST}
                          </span>
                        ) : null}
                      </button>
                    ))}
                  </div>
                  <label className="flex min-h-11 items-center gap-3 rounded-xl border border-[#d8d7dd] bg-white px-3 text-sm font-semibold focus-within:border-[#7a5cff]">
                    <span className="text-xs text-muted-foreground">
                      Custom
                    </span>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={16}
                      max={1024}
                      value={exportSize}
                      disabled={exportBusy}
                      onChange={(event) => {
                        const size = Number(event.target.value);
                        if (
                          Number.isInteger(size) &&
                          size >= 16 &&
                          size <= 1024
                        ) {
                          invalidateExport();
                          setExportSize(size);
                        }
                      }}
                      className="min-w-0 flex-1 bg-transparent text-base outline-none"
                    />
                    <span className="text-xs text-muted-foreground">px</span>
                  </label>
                  {exportSize > 512 ? (
                    <p className="text-[10px] leading-4 text-muted-foreground">
                      {hdMasterReady
                        ? 'HD master ready — no additional credit charge.'
                        : `Sizes above 512px require the shared HD master · ⚡${HD_MASTER_CREDIT_COST} first time only.`}
                    </p>
                  ) : null}
                </fieldset>

                <fieldset className="space-y-2">
                  <legend className="text-sm font-bold">Format</legend>
                  <div className="grid grid-cols-2 gap-2">
                    {FORMAT_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        aria-pressed={format === option.value}
                        disabled={exportBusy}
                        onClick={() => {
                          invalidateExport();
                          setFormat(option.value);
                        }}
                        className={cn(
                          'flex min-h-12 items-center justify-center rounded-xl border p-2 text-center text-xs font-semibold',
                          format === option.value
                            ? 'border-2 border-[#9b7bff] bg-[#9b7bff]/5'
                            : 'border-[#d8d6d0] hover:border-black'
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </fieldset>
              </>
            ) : (
              <fieldset className="space-y-2">
                <legend className="text-sm font-bold">Platforms</legend>
                <div className="space-y-2">
                  {PLATFORM_OPTIONS.map((option) => (
                    <label
                      key={option.value}
                      className={cn(
                        'flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-3 hover:border-black',
                        platforms.includes(option.value)
                          ? 'border-2 border-[#9b7bff] bg-[#9b7bff]/5'
                          : 'border-[#d8d6d0]'
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={platforms.includes(option.value)}
                        disabled={exportBusy}
                        onChange={() => togglePlatform(option.value)}
                        className="size-4 accent-[#9b7bff]"
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-bold">
                          {option.label}
                        </span>
                        <span className="block text-[11px] text-muted-foreground">
                          {option.description}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
                <p className="text-[11px] leading-4 text-muted-foreground">
                  Package formats are chosen automatically for each platform.
                  {platforms.some(
                    (platform) => platform === 'ios' || platform === 'macos'
                  )
                    ? hdMasterReady
                      ? ' HD master ready — iOS/macOS add no extra credit charge.'
                      : ` iOS and macOS share one HD master · ⚡${HD_MASTER_CREDIT_COST} first time only.`
                    : ''}
                </p>
              </fieldset>
            )}

            {exportQuery.data?.status === 'succeeded' && exportId ? (
              <a
                href={`/api/exports/${exportId}`}
                className="inline-flex min-h-12 w-full items-center justify-center gap-1.5 rounded-xl border-2 border-black bg-[#c6ff5b] px-4 text-sm font-extrabold text-black shadow-[2px_2px_0_#111] transition-all hover:-translate-y-0.5 hover:bg-[#b6f13e]"
              >
                Download <IconDownload className="size-4" />
              </a>
            ) : (
              <Button
                type="button"
                onClick={createExport}
                disabled={
                  !selectedAsset ||
                  (exportMode === 'packages' && !platforms.length) ||
                  pendingAction !== null ||
                  exportQuery.isFetching
                }
                className="min-h-12 w-full font-bold"
              >
                {pendingAction === 'export' || exportQuery.isFetching ? (
                  <IconLoader2 className="animate-spin" />
                ) : (
                  <IconDownload />
                )}
                {pendingHdExport
                  ? 'Generating HD master…'
                  : exportQuery.data?.status === 'queued' ||
                      exportQuery.data?.status === 'processing'
                    ? 'Preparing export…'
                    : requiresHdExport && !hdMasterReady
                      ? `${exportMode === 'image' ? 'Prepare image' : 'Prepare package'} · ⚡${HD_MASTER_CREDIT_COST}`
                      : exportMode === 'image'
                        ? 'Prepare image'
                        : 'Prepare package'}
              </Button>
            )}

            <div className="border-t border-[#ecebf0] pt-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-extrabold">Project history</h3>
                <Link
                  to="/dashboard/projects"
                  className="text-[11px] font-bold text-[#6548d8] hover:underline"
                >
                  See all
                </Link>
              </div>
              <div className="mt-3 space-y-2">
                {(projectHistoryQuery.data ?? []).slice(0, 5).map((project) => (
                  <Link
                    key={project.id}
                    to="/generate"
                    search={{ project: project.id }}
                    className={cn(
                      'flex items-center gap-3 rounded-xl border border-[#dedde3] bg-[#fbfbf8] p-2.5 transition-all hover:border-black hover:bg-white',
                      project.id === projectId &&
                        'border-[#7a5cff] bg-[#f1ebff]'
                    )}
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#dedde3] bg-white">
                      {project.thumbnailKey ? (
                        <img
                          src={`/api/storage/file?key=${encodeURIComponent(project.thumbnailKey)}`}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <IconPhoto className="size-4 text-[#8a8892]" />
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-extrabold">
                        {project.name}
                      </span>
                      <span className="mt-0.5 block text-[10px] text-[#777]">
                        {project.latestJobStatus ?? 'Project'}
                      </span>
                    </span>
                  </Link>
                ))}
                {!projectHistoryQuery.isPending &&
                !(projectHistoryQuery.data ?? []).length ? (
                  <div className="sunburst-placeholder rounded-xl border border-dashed border-[#c9c7cf] px-3 py-4 text-center text-[11px] text-[#777]">
                    Your generated projects will appear here.
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </section>
      </div>
    </form>
  );
}
