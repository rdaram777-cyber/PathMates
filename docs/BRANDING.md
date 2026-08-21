# PathMates Brand Assets

Official brand identity and the assets that carry it. Ratified direction:
a clean, bold, **geometric "P" mark** — a solid navy P (thick stem + rounded
bowl) with a small orange right-pointing arrowhead nested inside its counter
(the letter's negative space). The arrowhead is the subtle "path ahead /
moving forward" motif: it reads instantly as a P at both favicon and OG
sizes, with the path motif woven in without obscuring the letter.

## Colors

| Token | Hex |
| --- | --- |
| Navy (P stroke, dark surfaces) | `#071B3A` |
| Orange (arrowhead, accent) | `#FF7A3D` |

The app accent var (`--accent`) remains the existing orange; the mark's
arrowhead is always the fixed `#FF7A3D`.

## The mark

- `public/logo.svg` — standalone mark (navy P + orange arrowhead).
- `public/logo-lockup.svg` — mark + "PathMates" wordmark (navy/orange).
- `src/components/LogoMark.tsx` — `LogoMark` (P stroke uses `currentColor`
  so it adapts to light/dark nav; arrowhead stays `#FF7A3D`) and
  `LogoLockup` (mark + two-tone wordmark) React components used across the app.
- `public/favicon.svg` — navy rounded square, white P + orange arrow
  (readable on light and dark browser chrome).

## Generated PNGs

Regenerate with `bun run generate:brand` (script: `scripts/generate-brand-assets.mjs`,
requires the `sharp` devDependency and the Inter fonts committed in
`scripts/brand-assets/fonts/` — the script registers them with fontconfig for
SVG text rendering). Commit the regenerated PNGs.

| Asset | Size | Use |
| --- | --- | --- |
| `favicon-32.png` | 32×32 | PNG favicon fallback |
| `apple-touch-icon.png` | 180×180 | iOS home screen |
| `icon-192.png` / `icon-512.png` | 192 / 512 | PWA manifest icons |
| `og.png` (+ `og.svg` source) | 1200×630 | Social share card |
| `logo-email.png` (+ `logo-email.svg` source) | 400×120 | Email header lockup |

## Email branding

The app sends no emails today. When transactional email is wired up
(planned via Resend from hello@pathmates.in), **use `public/logo-email.png`
at the top of email templates** (or `public/logo-email.svg` if the provider
accepts SVG). It is a compact mark+wordmark lockup on a transparent
background, designed for light email surfaces. `logo-email.svg` is the
editable source.

## Touchpoints

- Navbar logo (link to `/`): `LogoMark` + two-tone "Path/Mates" text.
- Auth pages (login / signup / forgot-password): centered `LogoLockup`.
- Loading states (auth + `LoadingPage`): pulsing `LogoMark` (`.logo-pulse`).
- Footer: small `LogoMark` next to the copyright.
- `head()`: favicon.svg + favicon-32.png + apple-touch-icon + manifest links;
  `og:image`/`twitter:image` continue to point at `/og.png` (file replaced).
