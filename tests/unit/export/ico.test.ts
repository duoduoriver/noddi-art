import { describe, expect, test } from 'vitest';
import { encodeIco } from '@/export/ico';

describe('encodeIco', () => {
  test('writes a PNG-backed ICO directory with valid offsets', () => {
    const first = new Uint8Array([1, 2, 3]);
    const second = new Uint8Array([4, 5, 6, 7]);
    const output = encodeIco([
      { size: 16, png: first },
      { size: 32, png: second },
    ]);
    const view = new DataView(output.buffer);

    expect(view.getUint16(0, true)).toBe(0);
    expect(view.getUint16(2, true)).toBe(1);
    expect(view.getUint16(4, true)).toBe(2);
    expect(output[6]).toBe(16);
    expect(output[22]).toBe(32);
    expect(view.getUint32(14, true)).toBe(first.byteLength);
    expect(view.getUint32(18, true)).toBe(38);
    expect(view.getUint32(30, true)).toBe(second.byteLength);
    expect(view.getUint32(34, true)).toBe(41);
    expect([...output.slice(38, 41)]).toEqual([...first]);
    expect([...output.slice(41)]).toEqual([...second]);
  });
});
