import type { ReactNode } from "react";

interface ButtonProps {
  children: ReactNode; // Button text or content
  size?: "sm" | "md"; // Button size
  variant?: "primary" | "outline"; // Button variant
  startIcon?: ReactNode; // Icon before the text
  endIcon?: ReactNode; // Icon after the text
  onClick?: () => void; // Click handler
  disabled?: boolean; // Disabled state
  className?: string; // Disabled state
}

const Button: React.FC<ButtonProps> = ({
  children,
  size = "md",
  variant = "primary",
  startIcon,
  endIcon,
  onClick,
  className = "",
  disabled = false,
}) => {
  // Size Classes
  const sizeClasses = {
    sm: "px-4 py-3 text-sm",
    md: "px-5 py-3.5 text-sm",
  };

  // Variant Classes — GreenLoop: charcoal primary, steel outline, squared
  const variantClasses = {
    primary:
      "bg-ink-900 text-white shadow-theme-xs hover:bg-ink-800 disabled:bg-ink-300 dark:bg-white dark:text-ink-900 dark:hover:bg-gray-200 dark:disabled:bg-ink-700 dark:disabled:text-ink-400",
    outline:
      "bg-white text-ink-800 ring-1 ring-inset ring-steel-300 hover:bg-steel-50 dark:bg-gray-dark dark:text-gray-200 dark:ring-steel-700 dark:hover:bg-white/5 dark:hover:text-white",
  };

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-md font-medium transition ${className} ${
        sizeClasses[size]
      } ${variantClasses[variant]} ${
        disabled ? "cursor-not-allowed opacity-50" : ""
      }`}
      onClick={onClick}
      disabled={disabled}
    >
      {startIcon && <span className="flex items-center">{startIcon}</span>}
      {children}
      {endIcon && <span className="flex items-center">{endIcon}</span>}
    </button>
  );
};

export default Button;
