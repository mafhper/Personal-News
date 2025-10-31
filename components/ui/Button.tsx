import React from "react";
import { Loader2 } from "lucide-react";

interface ButtonProps {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: (e?: React.MouseEvent) => void;
  type?: "button" | "submit" | "reset";
  className?: string;
}

const variantClasses = {
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
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  icon,
  iconPosition = "left",
  loading = false,
  disabled = false,
  children,
  onClick,
  type = "button",
  className = "",
}) => {
  const baseClasses =
    "inline-flex items-center justify-center rounded-lg border font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const variantClass = variantClasses[variant];
  const sizeClass = sizeClasses[size];

  const combinedClasses =
    `${baseClasses} ${variantClass} ${sizeClass} ${className}`.trim();

  const renderIcon = () => {
    if (loading) {
      return <Loader2 className="w-4 h-4 animate-spin" />;
    }
    return icon;
  };

  const iconElement = renderIcon();
  const hasIcon = iconElement || loading;
  const iconSpacing = size === "sm" ? "gap-1.5" : "gap-2";

  return (
    <button
      type={type}
      className={`${combinedClasses} ${hasIcon ? iconSpacing : ""}`}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {hasIcon && iconPosition === "left" && iconElement}
      {children}
      {hasIcon && iconPosition === "right" && iconElement}
    </button>
  );
};
