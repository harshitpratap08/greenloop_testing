type BadgeVariant = "light" | "solid";
type BadgeSize = "sm" | "md";
type BadgeColor =
  "primary" | "success" | "error" | "warning" | "info" | "light" | "dark";

interface BadgeProps {
  variant?: BadgeVariant; // Light or solid variant
  size?: BadgeSize; // Badge size
  color?: BadgeColor; // Badge color
  startIcon?: React.ReactNode; // Icon at the start
  endIcon?: React.ReactNode; // Icon at the end
  children: React.ReactNode; // Badge content
}

const Badge: React.FC<BadgeProps> = ({
  variant = "light",
  color = "primary",
  size = "md",
  startIcon,
  endIcon,
  children,
}) => {
  // GreenLoop statuses use loop green for recovery, amber for holds, and oxide for rejection.
  const baseStyles =
    "inline-flex items-center px-2.5 py-0.5 justify-center gap-1 rounded-sm font-mono font-medium uppercase tracking-[0.06em]";

  // Define size styles
  const sizeStyles = {
    sm: "text-theme-xs", // Smaller padding and font size
    md: "text-sm", // Default padding and font size
  };

  // Define color styles for variants
  const variants = {
    light: {
      primary:
        "bg-ink-100 text-ink-800 dark:bg-white/10 dark:text-white/90",
      success:
        "bg-loop-50 text-loop-700 dark:bg-loop-500/15 dark:text-loop-300",
      error:
        "bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-300",
      warning:
        "bg-signal-50 text-signal-700 dark:bg-signal-500/15 dark:text-signal-300",
      info: "bg-steel-100 text-steel-700 dark:bg-steel-500/15 dark:text-steel-300",
      light: "bg-gray-100 text-gray-700 dark:bg-white/5 dark:text-white/80",
      dark: "bg-ink-800 text-white dark:bg-white/10 dark:text-white",
    },
    solid: {
      primary: "bg-ink-900 text-white dark:bg-white dark:text-ink-900",
      success: "bg-loop-500 text-white dark:text-white",
      error: "bg-error-500 text-white dark:text-white",
      warning: "bg-signal-500 text-white dark:text-white",
      info: "bg-steel-500 text-white dark:text-white",
      light: "bg-gray-400 dark:bg-white/5 text-white dark:text-white/80",
      dark: "bg-ink-700 text-white dark:text-white",
    },
  };

  // Get styles based on size and color variant
  const sizeClass = sizeStyles[size];
  const colorStyles = variants[variant][color];

  return (
    <span className={`${baseStyles} ${sizeClass} ${colorStyles}`}>
      {startIcon && <span className="me-1">{startIcon}</span>}
      {children}
      {endIcon && <span className="ms-1">{endIcon}</span>}
    </span>
  );
};

export default Badge;
