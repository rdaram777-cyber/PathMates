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
 * PathMates brand mark — the "path/arrow" P.
 *
 * The P stroke is drawn as a single continuous rounded path (stem + bowl)
 * like a route; its open end is closed by the orange arrowhead pointing
 * up-right toward the destination.
 *
 * Theme adaptation: the P stroke uses `currentColor` so it inherits the
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
        d="M 20 54 L 20 20 C 20 10, 44 8, 44 24 C 44 37, 38 45, 29 44"
        fill="none"
        stroke="currentColor"
        strokeWidth={7.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M 40 33 L 23 43 L 30.2 43.2 L 34 47 Z" fill={BRAND_ORANGE} />
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
