import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AlertDialog } from "../components/AlertDialog";
import type { NotificationOptions } from "../contexts/NotificationContext";

describe("AlertDialog", () => {
  const defaultOptions: NotificationOptions = {
    type: "info",
  };

  const mockOnClose = vi.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
  });

  it("should render with message and default options", () => {
    render(
      <AlertDialog
        isOpen={true}
        message="Test alert message"
        options={defaultOptions}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText("Informação")).toBeInTheDocument(); // Default title for info
    expect(screen.getByText("Test alert message")).toBeInTheDocument();
    expect(screen.getByText("OK")).toBeInTheDocument();
  });

  it("should not render when isOpen is false", () => {
    render(
      <AlertDialog
        isOpen={false}
        message="Test message"
        options={defaultOptions}
        onClose={mockOnClose}
      />
    );

    expect(screen.queryByText("Test message")).not.toBeInTheDocument();
  });

  it("should call onClose when OK button is clicked", async () => {
    render(
      <AlertDialog
        isOpen={true}
        message="Test message"
        options={defaultOptions}
        onClose={mockOnClose}
      />
    );

    fireEvent.click(screen.getByText("OK"));

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it("should call onClose when close button is clicked", async () => {
    render(
      <AlertDialog
        isOpen={true}
        message="Test message"
        options={defaultOptions}
        onClose={mockOnClose}
      />
    );

    // Find the close button (X icon)
    const closeButton = screen.getByRole("button", { name: "" }); // X button has no text
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it("should render different types with correct titles and icons", () => {
    const { rerender } = render(
      <AlertDialog
        isOpen={true}
        message="Success message"
        options={{ type: "success" }}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText("Sucesso")).toBeInTheDocument();

    rerender(
      <AlertDialog
        isOpen={true}
        message="Error message"
        options={{ type: "error" }}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText("Erro")).toBeInTheDocument();

    rerender(
      <AlertDialog
        isOpen={true}
        message="Warning message"
        options={{ type: "warning" }}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText("Aviso")).toBeInTheDocument();

    rerender(
      <AlertDialog
        isOpen={true}
        message="Info message"
        options={{ type: "info" }}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText("Informação")).toBeInTheDocument();
  });

  it("should handle undefined type option", () => {
    render(
      <AlertDialog
        isOpen={true}
        message="Test message"
        options={{}}
        onClose={mockOnClose}
      />
    );

    // Should default to info type
    expect(screen.getByText("Informação")).toBeInTheDocument();
  });

  it("should handle keyboard navigation", async () => {
    render(
      <AlertDialog
        isOpen={true}
        message="Test message"
        options={defaultOptions}
        onClose={mockOnClose}
      />
    );

    // Test Escape key
    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it("should be accessible", () => {
    render(
      <AlertDialog
        isOpen={true}
        message="Accessible message"
        options={defaultOptions}
        onClose={mockOnClose}
      />
    );

    // Check for proper ARIA attributes
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();

    // Check for proper button roles
    const okButton = screen.getByRole("button", { name: "OK" });
    expect(okButton).toBeInTheDocument();
  });
});
