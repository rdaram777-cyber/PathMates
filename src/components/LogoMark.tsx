import type { CSSProperties, SVGProps } from "react";

/** Brand navy — the P stroke color in static (non-adaptive) contexts. */
export const BRAND_NAVY = "#071B3A";
/** Brand orange — the arrowhead accent (fixed, never theme-adaptive). */
export const BRAND_ORANGE = "#FF7A3D";

type LogoMarkProps = {
  /** Rendered size in px (the mark is square, viewBox 0 0 64 64). */
  size?: number;
  className?: string;
  style?: CSSProperties;
} & Omit<SVGProps<SVGSVGElement>, "width" | "height" | "viewBox">;

/**
 * PathMates brand mark — a clean, bold, geometric "P".
 *
 * The P is a single solid filled silhouette (thick vertical stem + rounded
 * bowl) with a clear rounded counter (the negative space in the bowl) cut
 * out via the even-odd fill rule. A small orange right-pointing arrowhead
 * sits inside the counter — the subtle "path ahead / moving forward" motif —
 * without obscuring the letter, so the P reads clearly at favicon/navbar and
 * large (OG) sizes.
 *
 * Theme adaptation: the P body uses `currentColor` so it inherits the
 * surrounding text color (navy on light backgrounds, near-white on dark),
 * while the arrowhead stays the fixed brand orange `#FF7A3D`.
 */
export function LogoMark({ size = 24, className, style, ...rest }: LogoMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      style={{ display: "block", flexShrink: 0, ...style }}
      role="img"
      aria-label="PathMates"
      {...rest}
    >
      <path
        d="M 13 57 L 13 7 L 52 7 A 6 6 0 0 1 58 13 L 58 29 A 6 6 0 0 1 52 35 L 26 35 L 26 57 Z
          M 32 14 L 45 14 A 5 5 0 0 1 50 19 L 50 25 A 5 5 0 0 1 45 30 L 32 30 Z"
        fill="currentColor"
        fillRule="evenodd"
      />
      <path
        d="M 38.5 18.5 L 43.5 18.5 L 43.5 15 L 48.5 20 L 43.5 25 L 43.5 21.5 L 38.5 21.5 Z"
        fill={BRAND_ORANGE}
      />
    </svg>
  );
}

type LogoLockupProps = {
  /** Font size of the wordmark text in px (the mark scales to match). */
  size?: number;
  className?: string;
  style?: CSSProperties;
  /** Color of the "Mates" suffix (defaults to the app accent var). */
  accentColor?: string;
};

/**
 * Full PathMates lockup: brand mark + "PathMates" wordmark.
 *
 * "Path" inherits the surrounding color (use `color: var(--text)` on a light
 * background, `var(--text)`/white on dark); "Mates" uses `accentColor`
 * (defaults to the app accent var so it follows the theme like the original
 * navbar logo did).
 */
export function LogoLockup({
  size = 24,
  className,
  style,
  accentColor = "var(--accent)",
}: LogoLockupProps) {
  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: Math.max(6, size * 0.42),
        lineHeight: 1,
        ...style,
      }}
    >
      <LogoMark size={size * 1.08} />
      <span
        style={{
          fontFamily: "'Inter', 'Inter Fallback', Arial, sans-serif",
          fontWeight: 800,
          fontSize: size,
          letterSpacing: "-0.02em",
          whiteSpace: "nowrap",
        }}
      >
        Path<span style={{ color: accentColor }}>Mates</span>
      </span>
    </span>
  );
}
