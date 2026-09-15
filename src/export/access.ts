export type ExportAccessRequest =
  | {
      kind: 'image';
      rasterFormat: 'png' | 'webp' | 'avif' | 'jpg';
      size: number;
    }
  | {
      kind: 'packages';
      platforms: Array<'android' | 'ios' | 'web' | 'macos'>;
    };

/** Free accounts can ship lightweight/web-friendly outputs without unlocking HD. */
export function isFreeExportAllowed(request: ExportAccessRequest) {
  if (request.kind === 'image') {
    return (
      request.size <= 512 &&
      (request.rasterFormat === 'png' || request.rasterFormat === 'webp')
    );
  }
  return request.platforms.every(
    (platform) => platform === 'android' || platform === 'web'
  );
}
