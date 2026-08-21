import { writeFileSync } from "node:fs";

/**
 * Minimal ICO writer (multi-size).
 *
 * Builds a classic .ico container from a list of PNG buffers. Per the ICO
 * spec (and as supported by all modern browsers/crawlers), each directory
 * entry may embed a PNG-compressed image payload. We embed the PNG bytes
 * directly, so every size in the file is a crisp raster of the source mark
 * (no lossy BMP downsampling). Sizes of 16/32/48 give broad browser + Windows
 * shell + crawler coverage.
 *
 * ICO layout:
 *   ICONDIR        (6 bytes)  : reserved(0), type(1=icon), count
 *   ICONDIRENTRY[] (16*count) : w, h, colors, reserved, planes, bpp, size, off
 *   image payloads            : the PNG bytes
 *
 * width/height of 0 in an entry means 256; concrete small sizes store the
 * actual value (max 255), so 16/32/48 are stored literally.
 */
export function writeIco(sizes, outPath) {
  const entries = sizes.map(({ width, height, data }) => ({ width, height, data }));
  const count = entries.length;
  const dirSize = count * 16;
  const dir = Buffer.alloc(dirSize);
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: 1 = icon
  header.writeUInt16LE(count, 4);

  let offset = 6 + dirSize;
  entries.forEach(({ width, height, data }, i) => {
    const e = i * 16;
    dir[e] = width & 0xff; // byte width (0 would mean 256; small sizes stored literal)
    dir[e + 1] = height & 0xff;
    dir[e + 2] = 0; // color count
    dir[e + 3] = 0; // reserved
    dir.writeUInt16LE(1, e + 4); // color planes
    dir.writeUInt16LE(32, e + 6); // bits per pixel
    dir.writeUInt32LE(data.length, e + 8); // bytesInRes
    dir.writeUInt32LE(offset, e + 12); // image offset
    offset += data.length;
  });

  const buf = Buffer.concat([header, dir, ...entries.map((e) => e.data)]);
  writeFileSync(outPath, buf);
}
