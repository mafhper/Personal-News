/**
 * NotificationTestWrapper.tsx
 *
 * Test helper component that provides NotificationProvider context for testing
 * components that use the notification system.
 */

import React from "react";
import { render, RenderOptions } from "@testing-library/react";
import { NotificationProvider } from "../../contexts/NotificationContext";

/**
 * Test wrapper component that provides NotificationProvider context
 */
export const NotificationTestWrapper: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  return <NotificationProvider>{children}</NotificationProvider>;
};

/**
 * Custom render function that automatically wraps components with NotificationProvider
 *
 * @param ui - The component to render
 * @param options - Additional render options
 * @returns The render result with notification context provided
 */
export const renderWithNotifications = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) => {
  return render(ui, {
    wrapper: NotificationTestWrapper,
    ...options,
  });
};

/**
 * Custom render function for components that need both notification context
 * and additional custom wrappers
 *
 * @param ui - The component to render
 * @param customWrapper - Additional wrapper component
 * @param options - Additional render options
 * @returns The render result with both notification and custom context provided
 */
export const renderWithNotificationsAndWrapper = (
  ui: React.ReactElement,
  customWrapper: React.ComponentType<{ children: React.ReactNode }>,
  options?: Omit<RenderOptions, "wrapper">
) => {
  const CombinedWrapper: React.FC<{ children: React.ReactNode }> = ({
    children,
  }) => {
    const CustomWrapper = customWrapper;
    return (
      <NotificationProvider>
        <CustomWrapper>{children}</CustomWrapper>
      </NotificationProvider>
    );
  };

  return render(ui, {
    wrapper: CombinedWrapper,
    ...options,
  });
};
