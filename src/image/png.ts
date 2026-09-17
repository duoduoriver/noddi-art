import encodeAvif, { init as initAvifEncode } from '@jsquash/avif/encode';
import encodeJpeg, { init as initJpegEncode } from '@jsquash/jpeg/encode';
import { decode as decodeJpeg } from '@jsquash/jpeg';
import { init as initPngDecode } from '@jsquash/png/decode';
import { init as initPngEncode } from '@jsquash/png/encode';
import { decode, encode } from '@jsquash/png';
import { initResize } from '@jsquash/resize';
import resize from '@jsquash/resize';
import encodeWebp, { init as initWebpEncode } from '@jsquash/webp/encode';
import { decode as decodeWebp } from '@jsquash/webp';
import { simd } from 'wasm-feature-detect';
import avifWasm from '@/image/wasm/avif_enc.wasm';
import jpegWasm from '@/image/wasm/mozjpeg_enc.wasm';
import pngWasm from '@/image/wasm/squoosh_png_bg.wasm';
import resizeWasm from '@/image/wasm/squoosh_resize_bg.wasm';
import webpWasm from '@/image/wasm/webp_enc.wasm';
import webpSimdWasm from '@/image/wasm/webp_enc_simd.wasm';

export type PngImage = {
  data: Uint8ClampedArray<ArrayBuffer>;
  width: number;
  height: number;
};

function codecImage(image: PngImage, opaque = false): ImageData {
  const data = new Uint8ClampedArray(image.data);
  if (opaque) {
    for (let offset = 0; offset < data.length; offset += 4) {
      const alpha = data[offset + 3] / 255;
      data[offset] = data[offset] * alpha + 255 * (1 - alpha);
      data[offset + 1] = data[offset + 1] * alpha + 255 * (1 - alpha);
      data[offset + 2] = data[offset + 2] * alpha + 255 * (1 - alpha);
      data[offset + 3] = 255;
    }
  }
  return {
    data,
    width: image.width,
    height: image.height,
    colorSpace: 'srgb',
  };
}

export type RasterFormat = 'png' | 'webp' | 'avif' | 'jpg';

export type RasterOutput = {
  bytes: Uint8Array;
  contentType: string;
  extension: RasterFormat;
};

let codecsReady: Promise<void> | undefined;
let rasterEncodersReady: Promise<void> | undefined;

function initImageCodecs() {
  codecsReady ??= (async () => {
    await initPngDecode(pngWasm);
    await initPngEncode(pngWasm);
    await initResize(resizeWasm);
  })();
  return codecsReady;
}

async function initRasterEncoders() {
  rasterEncodersReady ??= (async () => {
    await initJpegEncode(jpegWasm);
    await initWebpEncode((await simd()) ? webpSimdWasm : webpWasm);
    await initAvifEncode(avifWasm);
  })();
  return rasterEncodersReady;
}

function arrayBuffer(bytes: Uint8Array) {
  return new Uint8Array(bytes).buffer;
}

export async function decodePng(bytes: Uint8Array): Promise<PngImage> {
  await initImageCodecs();
  const image = await decode(arrayBuffer(bytes));
  return {
    data: new Uint8ClampedArray(image.data),
    width: image.width,
    height: image.height,
  };
}

/** Decode the only provider formats we accept and normalize them to PNG. */
export async function normalizeToPng(
  bytes: Uint8Array
): Promise<{ bytes: Uint8Array; image: PngImage }> {
  await initImageCodecs();
  const isPng =
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47;
  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const isWebp =
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50;
  const source = isPng
    ? await decode(arrayBuffer(bytes))
    : isJpeg
      ? await decodeJpeg(arrayBuffer(bytes))
      : isWebp
        ? await decodeWebp(arrayBuffer(bytes))
        : null;
  if (!source) throw new Error('Unsupported image format');
  const image = {
    data: source.data,
    width: source.width,
    height: source.height,
  };
  return { image, bytes: await encodePng(image) };
}

export async function encodePng(image: PngImage) {
  await initImageCodecs();
  return new Uint8Array(await encode(codecImage(image)));
}

export async function encodeRaster(
  image: PngImage,
  format: RasterFormat
): Promise<RasterOutput> {
  if (format === 'png') {
    return {
      bytes: await encodePng(image),
      contentType: 'image/png',
      extension: 'png',
    };
  }
  await initImageCodecs();
  await initRasterEncoders();
  if (format === 'jpg') {
    return {
      bytes: new Uint8Array(
        await encodeJpeg(codecImage(image, true), { quality: 85 })
      ),
      contentType: 'image/jpeg',
      extension: 'jpg',
    };
  }
  if (format === 'webp') {
    return {
      bytes: new Uint8Array(
        await encodeWebp(codecImage(image), { quality: 80 })
      ),
      contentType: 'image/webp',
      extension: 'webp',
    };
  }
  return {
    bytes: new Uint8Array(await encodeAvif(codecImage(image), { quality: 50 })),
    contentType: 'image/avif',
    extension: 'avif',
  };
}

export async function resizePng(
  image: PngImage,
  width: number,
  height: number
): Promise<PngImage> {
  await initImageCodecs();
  const result = await resize(codecImage(image), { width, height });
  return {
    data: new Uint8ClampedArray(result.data),
    width: result.width,
    height: result.height,
  };
}
