#!/usr/bin/env node
/**
 * PathMates brand asset generator.
 *
 * Rasterizes the brand SVGs in /public into the PNG assets the deployed app
 * needs (favicon, home-screen icons, apple-touch-icon, OG image, email logo)
 * so no runtime rasterization is required.
 *
 * Requires: sharp (devDependency), and the Inter fonts checked in at
 * scripts/brand-assets/fonts/ (registered with fontconfig so librsvg can
 * render the <text> in og.svg / logo-email.svg with the brand typeface).
 *
 * Usage: bun run generate:brand  (or: node scripts/generate-brand-assets.mjs)
 * Re-run any time the SVGs change; commit the regenerated PNGs.
 */
import { execSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const publicDir = join(root, "public");
const fontDir = join(__dirname, "brand-assets", "fonts");

/** Make the brand fonts visible to fontconfig (librsvg/pango). */
function registerFonts() {
  const fontsHome = join(homedir(), ".local", "share", "fonts");
  mkdirSync(fontsHome, { recursive: true });
  for (const f of ["Inter-Regular.ttf", "Inter-Bold.ttf", "Inter-ExtraBold.ttf"]) {
    const src = join(fontDir, f);
    if (existsSync(src)) copyFileSync(src, join(fontsHome, f));
  }
  try {
    execSync("fc-cache -f >/dev/null 2>&1", { shell: "/bin/bash" });
  } catch {
    // fc-cache missing — fonts are copied but may not be picked up; SVGs
    // still render with a sans fallback.
  }
}

async function rasterize(input, output, { width, height }) {
  const out = join(publicDir, output);
  await sharp(join(publicDir, input))
    .resize(width, height)
    .png()
    .toFile(out);
  const meta = await sharp(out).metadata();
  console.log(`  ${output} (${meta.width}x${meta.height})`);
}

async function main() {
  registerFonts();
  console.log("Rasterizing brand assets…");

  // App icon / favicon family — navy rounded square, white P, orange arrow.
  await rasterize("favicon.svg", "favicon-32.png", { width: 32, height: 32 });
  await rasterize("favicon.svg", "apple-touch-icon.png", { width: 180, height: 180 });
  await rasterize("favicon.svg", "icon-192.png", { width: 192, height: 192 });
  await rasterize("favicon.svg", "icon-512.png", { width: 512, height: 512 });

  // OG / social share image (exact 1200x630).
  await rasterize("og.svg", "og.png", { width: 1200, height: 630 });

  // Email header lockup (400x120).
  await rasterize("logo-email.svg", "logo-email.png", { width: 400, height: 120 });

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
