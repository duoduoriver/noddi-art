import { serverEnv } from '@/env/server';
import { encodePng, normalizeToPng, resizePng } from '@/image/png';

const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 30_000;
const IMAGE_REQUEST_TIMEOUT_MS = 5 * 60_000;
const E2E_IMAGE_MODEL = 'e2e-fake-image';

export type ImageChannelName = 'primary' | 'fallback';
export type ImageQuality = 'low' | 'medium' | 'high';

export type ImageChannel = {
  name: ImageChannelName;
  baseUrl: string;
  apiKey: string;
  model: string;
};

export type ImageCallResult = {
  bytes: Uint8Array;
  mimeType: 'image/png';
};

export class ImageProviderError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly retryable = false
  ) {
    super(message);
    this.name = 'ImageProviderError';
  }
}

function isLocalE2EMode() {
  return import.meta.env.DEV === true && import.meta.env.MODE === 'e2e';
}

function isE2EFakeChannel(channel: ImageChannel) {
  return isLocalE2EMode() && channel.model === E2E_IMAGE_MODEL;
}

async function fakeConceptSheet(): Promise<ImageCallResult> {
  const colors = [
    [155, 123, 255],
    [198, 255, 91],
    [255, 111, 199],
    [111, 193, 255],
  ] as const;
  const data = new Uint8ClampedArray(1024 * 1024 * 4);

  for (let y = 0; y < 1024; y += 1) {
    for (let x = 0; x < 1024; x += 1) {
      const quadrant = (y >= 512 ? 2 : 0) + (x >= 512 ? 1 : 0);
      const [red, green, blue] = colors[quadrant];
      const offset = (y * 1024 + x) * 4;
      const insetX = x % 512;
      const insetY = y % 512;
      const insideMark =
        insetX >= 160 && insetX < 352 && insetY >= 160 && insetY < 352;
      data[offset] = insideMark ? 17 : red;
      data[offset + 1] = insideMark ? 17 : green;
      data[offset + 2] = insideMark ? 17 : blue;
      data[offset + 3] = 255;
    }
  }

  return {
    bytes: await encodePng({ data, width: 1024, height: 1024 }),
    mimeType: 'image/png',
  };
}

function normalizeBaseUrl(value: string) {
  const url = new URL(value);
  const pathname = url.pathname.replace(/\/+$/, '');
  url.pathname = pathname.endsWith('/v1') ? pathname : `${pathname}/v1`;
  return url.toString().replace(/\/$/, '');
}

function configuredChannel(
  name: ImageChannelName,
  baseUrl?: string,
  apiKey?: string,
  model?: string
): ImageChannel | null {
  const values = [baseUrl, apiKey, model];
  if (values.every(Boolean)) {
    return {
      name,
      baseUrl: normalizeBaseUrl(baseUrl!),
      apiKey: apiKey!,
      model: model!,
    };
  }
  if (values.some(Boolean)) {
    throw new Error(
      `IMAGE_${name.toUpperCase()} channel is partially configured`
    );
  }
  return null;
}

export function getImageChannels(): {
  primary: ImageChannel;
  fallback: ImageChannel | null;
} {
  if (isLocalE2EMode()) {
    return {
      primary: {
        name: 'primary',
        baseUrl: 'https://e2e-image.invalid/v1',
        apiKey: 'e2e-only',
        model: E2E_IMAGE_MODEL,
      },
      fallback: null,
    };
  }

  const primary = configuredChannel(
    'primary',
    serverEnv.IMAGE_PRIMARY_BASE_URL,
    serverEnv.IMAGE_PRIMARY_API_KEY,
    serverEnv.IMAGE_PRIMARY_MODEL
  );
  if (!primary) throw new Error('IMAGE_PRIMARY channel is not configured');
  return {
    primary,
    fallback: configuredChannel(
      'fallback',
      serverEnv.IMAGE_FALLBACK_BASE_URL,
      serverEnv.IMAGE_FALLBACK_API_KEY,
      serverEnv.IMAGE_FALLBACK_MODEL
    ),
  };
}

function decodeBase64(value: string) {
  const binary = atob(value);
  if (binary.length > MAX_IMAGE_BYTES)
    throw new ImageProviderError('Image is too large');
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1)
    bytes[index] = binary.charCodeAt(index);
  return bytes;
}

async function readImageUrl(urlValue: string) {
  const url = new URL(urlValue);
  if (url.protocol !== 'https:')
    throw new ImageProviderError('Image URL must use HTTPS');
  const response = await fetch(url, {
    redirect: 'error',
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!response.ok)
    throw new ImageProviderError(
      `Image download failed (${response.status})`,
      response.status,
      response.status >= 500 ||
        response.status === 408 ||
        response.status === 429
    );
  const contentLength = Number(response.headers.get('content-length') ?? 0);
  if (contentLength > MAX_IMAGE_BYTES)
    throw new ImageProviderError('Image is too large');
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.byteLength > MAX_IMAGE_BYTES)
    throw new ImageProviderError('Image is too large');
  return bytes;
}

async function assert1024Png(bytes: Uint8Array): Promise<ImageCallResult> {
  try {
    const normalized = await normalizeToPng(bytes);
    if (normalized.image.width === 1024 && normalized.image.height === 1024) {
      return { bytes: normalized.bytes, mimeType: 'image/png' };
    }
    const image = await resizePng(normalized.image, 1024, 1024);
    return { bytes: await encodePng(image), mimeType: 'image/png' };
  } catch {
    // A malformed compatibility response qualifies for fallback.
    throw new ImageProviderError(
      'Provider returned an invalid image',
      undefined,
      true
    );
  }
}

function classifyResponse(response: Response, body: string) {
  const retryable =
    [401, 403, 408, 429].includes(response.status) || response.status >= 500;
  throw new ImageProviderError(
    body.slice(0, 500) || `Provider returned ${response.status}`,
    response.status,
    retryable
  );
}

async function postJson(
  channel: ImageChannel,
  path: string,
  payload: unknown,
  idempotencyKey: string
) {
  const response = await fetch(`${channel.baseUrl}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${channel.apiKey}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(IMAGE_REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) await classifyResponse(response, await response.text());
  return response.json() as Promise<Record<string, unknown>>;
}

export async function generateImage(
  channel: ImageChannel,
  prompt: string,
  quality: ImageQuality,
  idempotencyKey: string
): Promise<ImageCallResult> {
  if (isE2EFakeChannel(channel)) return fakeConceptSheet();

  let body: Record<string, unknown>;
  try {
    body = await postJson(
      channel,
      '/images/generations',
      { model: channel.model, prompt, size: '1024x1024', quality, n: 1 },
      idempotencyKey
    );
  } catch (error) {
    if (error instanceof DOMException && error.name === 'TimeoutError') {
      throw new ImageProviderError('Provider timeout', undefined, true);
    }
    throw error;
  }
  const first = Array.isArray(body.data)
    ? (body.data[0] as Record<string, unknown> | undefined)
    : undefined;
  if (!first)
    throw new ImageProviderError('Provider response is empty', undefined, true);
  const bytes =
    typeof first.b64_json === 'string'
      ? decodeBase64(first.b64_json)
      : typeof first.url === 'string'
        ? await readImageUrl(first.url)
        : (() => {
            throw new ImageProviderError(
              'Provider response has no image',
              undefined,
              true
            );
          })();
  return await assert1024Png(bytes);
}

export async function editImage(
  channel: ImageChannel,
  prompt: string,
  reference: Uint8Array | Uint8Array[],
  idempotencyKey: string
): Promise<ImageCallResult> {
  const form = new FormData();
  if (isE2EFakeChannel(channel)) {
    const references = Array.isArray(reference) ? reference : [reference];
    const first = references[0];
    if (!first) throw new ImageProviderError('Fake provider needs a reference');
    return assert1024Png(first);
  }
  form.set('model', channel.model);
  form.set('prompt', prompt);
  form.set('size', '1024x1024');
  form.set('quality', 'medium');
  form.set('n', '1');
  const references = Array.isArray(reference) ? reference : [reference];
  references.forEach((bytes, index) => {
    const field = references.length === 1 ? 'image' : 'image[]';
    form.append(
      field,
      new Blob([new Uint8Array(bytes).buffer], { type: 'image/png' }),
      `reference-${index + 1}.png`
    );
  });
  const response = await fetch(`${channel.baseUrl}/images/edits`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${channel.apiKey}`,
      'Idempotency-Key': idempotencyKey,
    },
    body: form,
    signal: AbortSignal.timeout(IMAGE_REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) await classifyResponse(response, await response.text());
  const body = (await response.json()) as Record<string, unknown>;
  const first = Array.isArray(body.data)
    ? (body.data[0] as Record<string, unknown> | undefined)
    : undefined;
  if (!first)
    throw new ImageProviderError('Provider response is empty', undefined, true);
  const bytes =
    typeof first.b64_json === 'string'
      ? decodeBase64(first.b64_json)
      : typeof first.url === 'string'
        ? await readImageUrl(first.url)
        : (() => {
            throw new ImageProviderError(
              'Provider response has no image',
              undefined,
              true
            );
          })();
  return await assert1024Png(bytes);
}
