import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  variant?:
    | "default"
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "error"
    | "info"
    | "gray"
    | "blue"
    | "green"
    | "red"
    | "yellow";
  size?: "sm" | "md" | "lg";
  className?: string;
}

const variantClasses = {
  default:
    "bg-[rgb(var(--color-surface))] text-[rgb(var(--color-textSecondary))] border-[rgb(var(--color-border))]",
  primary:
    "bg-[rgb(var(--color-primary))]/20 text-[rgb(var(--color-primary))] border-[rgb(var(--color-primary))]/30",
  secondary:
    "bg-[rgb(var(--color-surface))] text-[rgb(var(--color-textSecondary))] border-[rgb(var(--color-border))]",
  success:
    "bg-[rgb(var(--color-success))]/20 text-[rgb(var(--color-success))] border-[rgb(var(--color-success))]/30",
  warning:
    "bg-[rgb(var(--color-warning))]/20 text-[rgb(var(--color-warning))] border-[rgb(var(--color-warning))]/30",
  error:
    "bg-[rgb(var(--color-error))]/20 text-[rgb(var(--color-error))] border-[rgb(var(--color-error))]/30",
  info: "bg-[rgb(var(--color-primary))]/20 text-[rgb(var(--color-primary))] border-[rgb(var(--color-primary))]/30",
  gray: "bg-[rgb(var(--color-surface))] text-[rgb(var(--color-textSecondary))] border-[rgb(var(--color-border))]",
  blue: "bg-[rgb(var(--color-primary))]/20 text-[rgb(var(--color-primary))] border-[rgb(var(--color-primary))]/30",
  green:
    "bg-[rgb(var(--color-success))]/20 text-[rgb(var(--color-success))] border-[rgb(var(--color-success))]/30",
  red: "bg-[rgb(var(--color-error))]/20 text-[rgb(var(--color-error))] border-[rgb(var(--color-error))]/30",
  yellow:
    "bg-[rgb(var(--color-warning))]/20 text-[rgb(var(--color-warning))] border-[rgb(var(--color-warning))]/30",
};

const sizeClasses = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-sm",
  lg: "px-3 py-1.5 text-base",
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "default",
  size = "md",
  className = "",
}) => {
  const baseClasses =
    "inline-flex items-center rounded-full border font-medium";
  const variantClass = variantClasses[variant];
  const sizeClass = sizeClasses[size];

  const combinedClasses =
    `${baseClasses} ${variantClass} ${sizeClass} ${className}`.trim();

  return <span className={combinedClasses}>{children}</span>;
};
