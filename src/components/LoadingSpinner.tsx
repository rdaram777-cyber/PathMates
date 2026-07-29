import type { FC } from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizes: Record<string, { width: string; height: string; borderWidth: string }> = {
  sm: { width: "20px", height: "20px", borderWidth: "2px" },
  md: { width: "36px", height: "36px", borderWidth: "3px" },
  lg: { width: "48px", height: "48px", borderWidth: "4px" },
};

export const LoadingSpinner: FC<LoadingSpinnerProps> = ({ size = "md", className }) => {
  const s = sizes[size];
  return (
    <div
      className={className}
      style={{
        display: "inline-block",
        width: s.width,
        height: s.height,
        border: `${s.borderWidth} solid var(--line)`,
        borderTopColor: "var(--accent)",
        borderRadius: "50%",
        animation: "spin 0.7s linear infinite",
      }}
    />
  );
};

/** Full-page centered spinner */
export const LoadingPage: FC<{ message?: string }> = ({ message }) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "60vh",
      gap: "16px",
    }}
  >
    <LoadingSpinner size="lg" />
    {message && (
      <p style={{ color: "var(--muted)", fontSize: "0.95rem" }}>{message}</p>
    )}
  </div>
);
