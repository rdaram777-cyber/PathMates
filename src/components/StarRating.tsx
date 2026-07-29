import type { FC } from "react";

interface StarRatingProps {
  rating: number;
  count?: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onRate?: (rating: number) => void;
}

const starSizes: Record<"sm" | "md" | "lg", { fontSize: string; gap: string }> = {
  sm: { fontSize: "0.85rem", gap: "1px" },
  md: { fontSize: "1.15rem", gap: "2px" },
  lg: { fontSize: "1.5rem", gap: "3px" },
};

export const StarRating: FC<StarRatingProps> = ({
  rating,
  count,
  size = "md",
  interactive = false,
  onRate,
}) => {
  const { fontSize, gap } = starSizes[size];
  const stars = [];

  for (let i = 1; i <= 5; i++) {
    const filled = i <= Math.round(rating);
    stars.push(
      <span
        key={i}
        onClick={() => {
          if (interactive && onRate) onRate(i);
        }}
        style={{
          fontSize,
          cursor: interactive ? "pointer" : "default",
          color: filled ? "#f5a623" : "#d4d8df",
          transition: interactive ? "transform 0.1s" : undefined,
          userSelect: "none",
        }}
        onMouseEnter={(e) => {
          if (interactive) {
            (e.target as HTMLSpanElement).style.transform = "scale(1.2)";
          }
        }}
        onMouseLeave={(e) => {
          if (interactive) {
            (e.target as HTMLSpanElement).style.transform = "scale(1)";
          }
        }}
      >
        {filled ? "★" : "☆"}
      </span>,
    );
  }

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap }}>
      <span style={{ display: "inline-flex", gap }}>{stars}</span>
      {count !== undefined && (
        <span
          style={{
            fontSize: size === "sm" ? "0.75rem" : "0.85rem",
            color: "var(--muted)",
            marginLeft: "4px",
          }}
        >
          ({count} {count === 1 ? "review" : "reviews"})
        </span>
      )}
      {count === undefined && rating > 0 && (
        <span
          style={{
            fontSize: size === "sm" ? "0.75rem" : "0.85rem",
            fontWeight: 600,
            marginLeft: "4px",
          }}
        >
          {rating.toFixed(1)}
        </span>
      )}
    </span>
  );
};

/** Inline text-only version for cramped spaces: "⭐ 4.7 (12 reviews)" */
export const StarRatingInline: FC<{ rating: number; count?: number }> = ({
  rating,
  count,
}) => {
  return (
    <span style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
      ⭐ {rating > 0 ? rating.toFixed(1) : "—"}
      {count !== undefined && ` (${count})`}
    </span>
  );
};
