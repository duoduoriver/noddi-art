import { strToU8, zipSync } from 'fflate';
import { PLATFORM_BUILDERS } from '@/export/presets';
import { sizedPng, sizedRaster } from '@/export/render';
import { parseExportSpec } from '@/export/spec';
import type { ExportFiles } from '@/export/types';
import { decodePng } from '@/image/png';

function licenseText() {
  return 'Sunburst AI grants a commercial, modifiable, non-exclusive license for this exported icon. Sunburst AI claims no ownership of the export and does not guarantee trademark registration, exclusivity, or non-infringement. You are responsible for your input and final use.\n';
}

async function sha256(bytes: Uint8Array) {
  const source = new Uint8Array(bytes).buffer;
  const digest = await crypto.subtle.digest('SHA-256', source);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

async function fileManifest(files: ExportFiles) {
  return Promise.all(
    Object.entries(files)
      .sort(([first], [second]) => first.localeCompare(second))
      .map(async ([path, bytes]) => ({
        path,
        bytes: bytes.byteLength,
        sha256: await sha256(bytes),
      }))
  );
}

export async function buildExport(
  value: string,
  sourceBytes: Uint8Array,
  manifest: Record<string, unknown>
) {
  const source = await decodePng(sourceBytes);
  if (source.width !== source.height || source.width < 512)
    throw new Error('INVALID_IMAGE');

  const spec = parseExportSpec(value);
  if (spec.kind === 'image') {
    if (spec.size > source.width) throw new Error('HD_MASTER_REQUIRED');
    const output = await sizedRaster(source, spec.size, spec.format);
    return {
      bytes: output.bytes,
      contentType: output.contentType,
      filename: `icon-${spec.size}.${output.extension}`,
    };
  }

  const requiresHd = spec.platforms.some(
    (platform) => platform === 'ios' || platform === 'macos'
  );
  if (requiresHd && source.width < 1024) throw new Error('HD_MASTER_REQUIRED');

  const sourceSize = Math.min(source.width, 1024);
  const files: ExportFiles = {
    [`icon-${sourceSize}.png`]: await sizedPng(source, sourceSize),
    'license.txt': strToU8(licenseText()),
  };
  for (const platform of spec.platforms) {
    Object.assign(files, await PLATFORM_BUILDERS[platform](source));
  }
  files['project.json'] = strToU8(
    JSON.stringify(
      {
        schemaVersion: 2,
        brand: 'Sunburst AI',
        export: spec,
        ...manifest,
        files: await fileManifest(files),
      },
      null,
      2
    )
  );
  return {
    bytes: zipSync(files),
    contentType: 'application/zip',
    filename: `sunburst-ai-${spec.platforms.join('-')}.zip`,
  };
}
