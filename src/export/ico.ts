export type IcoImage = { size: number; png: Uint8Array };

/** Encode PNG-backed icon entries in the ICO container format. */
export function encodeIco(images: IcoImage[]) {
  if (!images.length) throw new Error('ICO_REQUIRES_IMAGE');
  const directorySize = 6 + images.length * 16;
  const totalSize =
    directorySize +
    images.reduce((total, image) => total + image.png.byteLength, 0);
  const bytes = new Uint8Array(totalSize);
  const view = new DataView(bytes.buffer);

  view.setUint16(0, 0, true);
  view.setUint16(2, 1, true);
  view.setUint16(4, images.length, true);

  let imageOffset = directorySize;
  images.forEach((image, index) => {
    const entryOffset = 6 + index * 16;
    const dimension = image.size >= 256 ? 0 : image.size;
    bytes[entryOffset] = dimension;
    bytes[entryOffset + 1] = dimension;
    bytes[entryOffset + 2] = 0;
    bytes[entryOffset + 3] = 0;
    view.setUint16(entryOffset + 4, 1, true);
    view.setUint16(entryOffset + 6, 32, true);
    view.setUint32(entryOffset + 8, image.png.byteLength, true);
    view.setUint32(entryOffset + 12, imageOffset, true);
    bytes.set(image.png, imageOffset);
    imageOffset += image.png.byteLength;
  });

  return bytes;
}
