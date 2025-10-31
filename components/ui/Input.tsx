import React, { forwardRef } from "react";
import { AlertCircle, CheckCircle } from "lucide-react";

interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  error?: string;
  success?: string;
  helperText?: string;
  size?: "sm" | "md" | "lg";
  variant?: "outlined" | "filled";
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

const sizeClasses = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-4 text-base",
};

const variantClasses = {
  outlined:
    "bg-[rgb(var(--color-surface))] border-[rgb(var(--color-border))] text-[rgb(var(--color-text))]",
  filled:
    "bg-[rgb(var(--color-background))] border-[rgb(var(--color-border))] text-[rgb(var(--color-text))]",
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      success,
      helperText,
      size = "md",
      variant = "outlined",
      startIcon,
      endIcon,
      className = "",
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = !!error;
    const hasSuccess = !!success;

    const baseClasses =
      "w-full rounded-lg border transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))] focus:border-[rgb(var(--color-primary))] disabled:opacity-50 disabled:cursor-not-allowed placeholder-[rgb(var(--color-textSecondary))]";
    const sizeClass = sizeClasses[size];
    const variantClass = variantClasses[variant];

    let statusClasses = "";
    if (hasError) {
      statusClasses = "border-red-500 focus:ring-red-500 focus:border-red-500";
    } else if (hasSuccess) {
      statusClasses =
        "border-green-500 focus:ring-green-500 focus:border-green-500";
    }

    const inputClasses =
      `${baseClasses} ${sizeClass} ${variantClass} ${statusClasses} ${className}`.trim();

    const renderStatusIcon = () => {
      if (hasError) {
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      }
      if (hasSuccess) {
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      }
      return endIcon;
    };

    const statusIcon = renderStatusIcon();
    const hasStartIcon = !!startIcon;
    const hasEndIcon = !!statusIcon;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-[rgb(var(--color-text))] mb-1"
          >
            {label}
          </label>
        )}

        <div className="relative">
          {hasStartIcon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[rgb(var(--color-textSecondary))]">
              {startIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            className={`${inputClasses} ${hasStartIcon ? "pl-10" : ""} ${
              hasEndIcon ? "pr-10" : ""
            }`}
            aria-invalid={hasError}
            aria-describedby={
              error
                ? `${inputId}-error`
                : success
                ? `${inputId}-success`
                : helperText
                ? `${inputId}-helper`
                : undefined
            }
            {...props}
          />

          {hasEndIcon && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {statusIcon}
            </div>
          )}
        </div>

        {error && (
          <p id={`${inputId}-error`} className="mt-1 text-sm text-red-600">
            {error}
          </p>
        )}

        {success && !error && (
          <p id={`${inputId}-success`} className="mt-1 text-sm text-green-600">
            {success}
          </p>
        )}

        {helperText && !error && !success && (
          <p
            id={`${inputId}-helper`}
            className="mt-1 text-sm text-[rgb(var(--color-textSecondary))]"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);
