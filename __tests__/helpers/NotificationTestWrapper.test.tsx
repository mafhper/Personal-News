/**
 * NotificationTestWrapper.test.tsx
 *
 * Tests for the notification test wrapper helper
 */

import React from "react";
import { screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { renderWithNotifications } from "./NotificationTestWrapper";
import { useNotification } from "../../contexts/NotificationContext";

// Test component that uses notification context
const TestComponent: React.FC = () => {
  const { showNotification } = useNotification();

  return (
    <div>
      <button onClick={() => showNotification("Test message")}>
        Show Notification
      </button>
      <span>Test Component</span>
    </div>
  );
};

describe("NotificationTestWrapper", () => {
  it("should provide notification context to wrapped components", () => {
    renderWithNotifications(<TestComponent />);

    // Component should render without throwing context error
    expect(screen.getByText("Test Component")).toBeInTheDocument();
    expect(screen.getByText("Show Notification")).toBeInTheDocument();
  });

  it("should allow components to use notification functions", () => {
    renderWithNotifications(<TestComponent />);

    const button = screen.getByText("Show Notification");

    // Should not throw error when clicking (using notification context)
    expect(() => {
      button.click();
    }).not.toThrow();
  });
});
