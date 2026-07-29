import type { FC } from "react";

interface SkeletonProps {
  width?: string;
  height?: string;
  borderRadius?: string;
  className?: string;
}

export const Skeleton: FC<SkeletonProps> = ({
  width = "100%",
  height = "20px",
  borderRadius = "8px",
  className,
}) => (
  <div
    className={className}
    style={{
      width,
      height,
      borderRadius,
      background: "var(--line)",
      animation: "pulse 1.5s ease-in-out infinite",
    }}
  />
);

/** Card skeleton for loading state of experience/profile cards */
export const CardSkeleton: FC = () => (
  <div
    className="card"
    style={{ display: "flex", flexDirection: "column", gap: "12px" }}
  >
    <Skeleton width="40%" height="24px" borderRadius="12px" />
    <Skeleton width="90%" height="16px" />
    <Skeleton width="70%" height="16px" />
    <div
      style={{
        display: "flex",
        gap: "10px",
        alignItems: "center",
        borderTop: "1px solid var(--line)",
        paddingTop: "15px",
        marginTop: "4px",
      }}
    >
      <Skeleton width="38px" height="38px" borderRadius="50%" />
      <Skeleton width="120px" height="16px" />
    </div>
  </div>
);

/** Grid of card skeletons */
export const CardSkeletonGrid: FC<{ count?: number }> = ({ count = 6 }) => (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
      gap: "18px",
    }}
  >
    {Array.from({ length: count }).map((_, i) => (
      <CardSkeleton key={i} />
    ))}
  </div>
);
