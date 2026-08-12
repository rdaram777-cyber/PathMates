/**
 * Site-wide configuration.
 *
 * SITE_URL is the single source of truth for the canonical origin. It feeds
 * the canonical link, og:url, og:image, and twitter:image meta tags.
 * Production is https://site-virid-eight-86.vercel.app; override with the
 * SITE_URL env var once a custom domain is connected (see Business Plan).
 *
 * Note: `public/sitemap.xml` is a static file and is intentionally left
 * as-is (it is regenerated out-of-band when the domain changes).
 */
const envSiteUrl =
  typeof process !== "undefined" && process.env?.SITE_URL
    ? process.env.SITE_URL
    : undefined;

export const SITE_URL: string =
  envSiteUrl ?? "https://site-virid-eight-86.vercel.app";

/** Strip a trailing slash so path joins never produce `//`. */
export function siteUrl(path: string): string {
  return `${SITE_URL.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}
