import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ConfirmDialog } from "../components/ConfirmDialog";
import type { ConfirmDialogOptions } from "../contexts/NotificationContext";

describe("ConfirmDialog", () => {
  const defaultOptions: ConfirmDialogOptions = {
    title: "Test Title",
    message: "Test message",
    confirmText: "Confirm",
    cancelText: "Cancel",
    type: "info",
  };

  const mockOnClose = vi.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
  });

  it("should render with default props", () => {
    render(
      <ConfirmDialog
        isOpen={true}
        options={defaultOptions}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText("Test Title")).toBeInTheDocument();
    expect(screen.getByText("Test message")).toBeInTheDocument();
    expect(screen.getByText("Confirm")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("should not render when isOpen is false", () => {
    render(
      <ConfirmDialog
        isOpen={false}
        options={defaultOptions}
        onClose={mockOnClose}
      />
    );

    expect(screen.queryByText("Test Title")).not.toBeInTheDocument();
  });

  it("should call onClose with true when confirm button is clicked", async () => {
    render(
      <ConfirmDialog
        isOpen={true}
        options={defaultOptions}
        onClose={mockOnClose}
      />
    );

    fireEvent.click(screen.getByText("Confirm"));

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalledWith(true);
    });
  });

  it("should call onClose with false when cancel button is clicked", async () => {
    render(
      <ConfirmDialog
        isOpen={true}
        options={defaultOptions}
        onClose={mockOnClose}
      />
    );

    fireEvent.click(screen.getByText("Cancel"));

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalledWith(false);
    });
  });

  it("should call onClose with false when close button is clicked", async () => {
    render(
      <ConfirmDialog
        isOpen={true}
        options={defaultOptions}
        onClose={mockOnClose}
      />
    );

    // Find the close button (X icon)
    const closeButton = screen.getByRole("button", { name: "" }); // X button has no text
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalledWith(false);
    });
  });

  it("should render different types correctly", () => {
    const { rerender } = render(
      <ConfirmDialog
        isOpen={true}
        options={{ ...defaultOptions, type: "danger" }}
        onClose={mockOnClose}
      />
    );

    // Check for danger type styling (red color)
    expect(screen.getByText("Test Title")).toBeInTheDocument();

    rerender(
      <ConfirmDialog
        isOpen={true}
        options={{ ...defaultOptions, type: "warning" }}
        onClose={mockOnClose}
      />
    );

    // Check for warning type styling (yellow color)
    expect(screen.getByText("Test Title")).toBeInTheDocument();

    rerender(
      <ConfirmDialog
        isOpen={true}
        options={{ ...defaultOptions, type: "info" }}
        onClose={mockOnClose}
      />
    );

    // Check for info type styling (blue color)
    expect(screen.getByText("Test Title")).toBeInTheDocument();
  });

  it("should use default values when options are minimal", () => {
    const minimalOptions: ConfirmDialogOptions = {
      message: "Minimal message",
    };

    render(
      <ConfirmDialog
        isOpen={true}
        options={minimalOptions}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText("Confirmação")).toBeInTheDocument(); // Default title
    expect(screen.getByText("Minimal message")).toBeInTheDocument();
    expect(screen.getByText("Confirmar")).toBeInTheDocument(); // Default confirm text
    expect(screen.getByText("Cancelar")).toBeInTheDocument(); // Default cancel text
  });

  it("should handle keyboard navigation", async () => {
    render(
      <ConfirmDialog
        isOpen={true}
        options={defaultOptions}
        onClose={mockOnClose}
      />
    );

    // Test Escape key on the dialog itself
    const dialog = screen.getByRole("dialog");
    fireEvent.keyDown(dialog, { key: "Escape" });

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalledWith(false);
    });
  });
});
