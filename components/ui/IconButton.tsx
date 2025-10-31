import React from "react";
import { Loader2 } from "lucide-react";

interface IconButtonProps {
  children?: React.ReactNode;
  icon?: React.ReactNode;
  variant?: "default" | "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
  onClick?: (e?: React.MouseEvent) => void;
  type?: "button" | "submit" | "reset";
  className?: string;
  title?: string;
  "aria-label"?: string;
}

const variantClasses = {
  default:
    "bg-[rgb(var(--color-surface))] hover:bg-[rgb(var(--color-surface))]/80 text-[rgb(var(--color-text))] border-[rgb(var(--color-border))]",
  primary:
    "bg-[rgb(var(--color-primary))] hover:bg-[rgb(var(--color-primary))]/90 text-white border-transparent",
  secondary:
    "bg-[rgb(var(--color-surface))] hover:bg-[rgb(var(--color-surface))]/80 text-[rgb(var(--color-text))] border-[rgb(var(--color-border))]",
  danger:
    "bg-[rgb(var(--color-error))] hover:bg-[rgb(var(--color-error))]/90 text-white border-transparent",
  ghost:
    "bg-transparent hover:bg-[rgb(var(--color-surface))]/50 text-[rgb(var(--color-text))] border-transparent",
};

const sizeClasses = {
  sm: "h-8 w-8 p-1.5",
  md: "h-10 w-10 p-2",
  lg: "h-12 w-12 p-2.5",
};

export const IconButton: React.FC<IconButtonProps> = ({
  children,
  icon,
  variant = "default",
  size = "md",
  loading = false,
  disabled = false,
  onClick,
  type = "button",
  className = "",
  title,
  "aria-label": ariaLabel,
}) => {
  const baseClasses =
    "inline-flex items-center justify-center rounded-lg border font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const variantClass = variantClasses[variant];
  const sizeClass = sizeClasses[size];

  const combinedClasses =
    `${baseClasses} ${variantClass} ${sizeClass} ${className}`.trim();

  const content = loading ? (
    <Loader2 className="w-4 h-4 animate-spin" />
  ) : (
    icon || children
  );

  return (
    <button
      type={type}
      className={combinedClasses}
      onClick={onClick}
      disabled={disabled || loading}
      title={title}
      aria-label={ariaLabel || title}
    >
      {content}
    </button>
  );
};
