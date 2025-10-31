import React from "react";

interface CardProps {
  children: React.ReactNode;
  elevation?: "none" | "sm" | "md" | "lg";
  padding?: "none" | "sm" | "md" | "lg";
  className?: string;
  onClick?: () => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: () => void;
  onDrop?: (e: React.DragEvent) => void;
}

const elevationClasses = {
  none: "",
  sm: "shadow-sm",
  md: "shadow-md",
  lg: "shadow-lg",
};

const paddingClasses = {
  none: "",
  sm: "p-3",
  md: "p-6",
  lg: "p-8",
};

export const Card: React.FC<CardProps> = ({
  children,
  elevation = "sm",
  padding = "md",
  className = "",
  onClick,
  onDragOver,
  onDragLeave,
  onDrop,
}) => {
  const baseClasses =
    "bg-[rgb(var(--color-surface))] rounded-xl border border-[rgb(var(--color-border))] transition-all duration-200";
  const elevationClass = elevationClasses[elevation];
  const paddingClass = paddingClasses[padding];
  const hoverClass = onClick
    ? "hover:shadow-md hover:border-[rgb(var(--color-primary))] cursor-pointer"
    : "";

  const combinedClasses =
    `${baseClasses} ${elevationClass} ${paddingClass} ${hoverClass} ${className}`.trim();

  return (
    <div
      className={combinedClasses}
      onClick={onClick}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {children}
    </div>
  );
};
