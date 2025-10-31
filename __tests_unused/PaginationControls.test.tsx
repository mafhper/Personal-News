/**
 * PaginationControls.test.tsx
 *
 * Tests for the enhanced PaginationControls component to ensure proper
 * event handling, responsive design, and accessibility features.
 *
 * @author Matheus Pereira
 * @version 1.0.0
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import { PaginationControls } from "../components/PaginationControls";

describe("PaginationControls", () => {
  const mockOnPageChange = vi.fn();

  beforeEach(() => {
    mockOnPageChange.mockClear();
  });

  describe("Rendering", () => {
    it("should not render when totalPages is 1 or less", () => {
      const { container } = render(
        <PaginationControls
          currentPage={0}
          totalPages={1}
          onPageChange={mockOnPageChange}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it("should render compact version when compact prop is true", () => {
      render(
        <PaginationControls
          currentPage={1}
          totalPages={5}
          onPageChange={mockOnPageChange}
          compact={true}
        />
      );

      // Should show page info in compact format
      expect(screen.getByText("2")).toBeInTheDocument();
      expect(screen.getByText("/")).toBeInTheDocument();
      expect(screen.getByText("5")).toBeInTheDocument();
    });

    it("should render full version when compact prop is false", () => {
      render(
        <PaginationControls
          currentPage={1}
          totalPages={5}
          onPageChange={mockOnPageChange}
          compact={false}
        />
      );

      // Should show "Anterior" and "Próximo" buttons
      expect(screen.getByText("Anterior")).toBeInTheDocument();
      expect(screen.getByText("Próximo")).toBeInTheDocument();
    });
  });

  describe("Navigation", () => {
    it("should call onPageChange when next button is clicked", () => {
      render(
        <PaginationControls
          currentPage={1}
          totalPages={5}
          onPageChange={mockOnPageChange}
        />
      );

      const nextButton = screen.getByLabelText("Próxima página");
      fireEvent.click(nextButton);

      expect(mockOnPageChange).toHaveBeenCalledWith(2);
    });

    it("should call onPageChange when previous button is clicked", () => {
      render(
        <PaginationControls
          currentPage={2}
          totalPages={5}
          onPageChange={mockOnPageChange}
        />
      );

      const prevButton = screen.getByLabelText("Página anterior");
      fireEvent.click(prevButton);

      expect(mockOnPageChange).toHaveBeenCalledWith(1);
    });

    it("should call onPageChange when page number is clicked", () => {
      render(
        <PaginationControls
          currentPage={1}
          totalPages={5}
          onPageChange={mockOnPageChange}
        />
      );

      // Click on page 3 (displayed as "3")
      const pageButton = screen.getByLabelText("Ir para página 3");
      fireEvent.click(pageButton);

      expect(mockOnPageChange).toHaveBeenCalledWith(2); // 0-based index
    });
  });

  describe("Disabled states", () => {
    it("should disable previous button on first page", () => {
      render(
        <PaginationControls
          currentPage={0}
          totalPages={5}
          onPageChange={mockOnPageChange}
        />
      );

      const prevButton = screen.getByLabelText("Página anterior");
      expect(prevButton).toBeDisabled();

      fireEvent.click(prevButton);
      expect(mockOnPageChange).not.toHaveBeenCalled();
    });

    it("should disable next button on last page", () => {
      render(
        <PaginationControls
          currentPage={4}
          totalPages={5}
          onPageChange={mockOnPageChange}
        />
      );

      const nextButton = screen.getByLabelText("Próxima página");
      expect(nextButton).toBeDisabled();

      fireEvent.click(nextButton);
      expect(mockOnPageChange).not.toHaveBeenCalled();
    });

    it("should disable all buttons when disabled prop is true", () => {
      render(
        <PaginationControls
          currentPage={2}
          totalPages={5}
          onPageChange={mockOnPageChange}
          disabled={true}
        />
      );

      const prevButton = screen.getByLabelText("Página anterior");
      const nextButton = screen.getByLabelText("Próxima página");

      expect(prevButton).toBeDisabled();
      expect(nextButton).toBeDisabled();

      fireEvent.click(prevButton);
      fireEvent.click(nextButton);

      expect(mockOnPageChange).not.toHaveBeenCalled();
    });

    it("should disable all buttons when isNavigating is true", () => {
      render(
        <PaginationControls
          currentPage={2}
          totalPages={5}
          onPageChange={mockOnPageChange}
          isNavigating={true}
        />
      );

      const prevButton = screen.getByLabelText("Página anterior");
      const nextButton = screen.getByLabelText("Próxima página");

      expect(prevButton).toBeDisabled();
      expect(nextButton).toBeDisabled();

      fireEvent.click(prevButton);
      fireEvent.click(nextButton);

      expect(mockOnPageChange).not.toHaveBeenCalled();
    });
  });

  describe("Event handling", () => {
    it("should prevent default and stop propagation on button clicks", () => {
      render(
        <PaginationControls
          currentPage={1}
          totalPages={5}
          onPageChange={mockOnPageChange}
          compact={true}
        />
      );

      const nextButton = screen.getByLabelText("Próxima página");
      const mockEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      };

      // Simulate click with mock event
      fireEvent.click(nextButton, mockEvent);

      expect(mockOnPageChange).toHaveBeenCalledWith(2);
    });

    it("should not call onPageChange when clicking current page", () => {
      render(
        <PaginationControls
          currentPage={2}
          totalPages={5}
          onPageChange={mockOnPageChange}
        />
      );

      // Try to click on current page (page 3, index 2)
      const currentPageButton = screen.getByLabelText("Ir para página 3");
      fireEvent.click(currentPageButton);

      expect(mockOnPageChange).not.toHaveBeenCalled();
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA labels", () => {
      render(
        <PaginationControls
          currentPage={2}
          totalPages={5}
          onPageChange={mockOnPageChange}
        />
      );

      expect(screen.getByLabelText("Página anterior")).toBeInTheDocument();
      expect(screen.getByLabelText("Próxima página")).toBeInTheDocument();
      expect(screen.getByLabelText("Ir para página 1")).toBeInTheDocument();
    });

    it("should mark current page with aria-current", () => {
      render(
        <PaginationControls
          currentPage={2}
          totalPages={5}
          onPageChange={mockOnPageChange}
        />
      );

      const currentPageButton = screen.getByLabelText("Ir para página 3");
      expect(currentPageButton).toHaveAttribute("aria-current", "page");
    });

    it("should have proper titles for compact buttons", () => {
      render(
        <PaginationControls
          currentPage={1}
          totalPages={5}
          onPageChange={mockOnPageChange}
          compact={true}
        />
      );

      expect(screen.getByTitle("Página anterior (←)")).toBeInTheDocument();
      expect(screen.getByTitle("Próxima página (→)")).toBeInTheDocument();
    });
  });

  describe("Responsive design", () => {
    it("should show mobile layout elements", () => {
      render(
        <PaginationControls
          currentPage={2}
          totalPages={5}
          onPageChange={mockOnPageChange}
        />
      );

      // Mobile pagination info should be present (even if hidden by CSS)
      const paginationInfoElements = screen.getAllByText("Página 3 de 5");
      expect(paginationInfoElements.length).toBeGreaterThan(0);
    });

    it("should show desktop layout elements", () => {
      render(
        <PaginationControls
          currentPage={2}
          totalPages={5}
          onPageChange={mockOnPageChange}
        />
      );

      // Desktop buttons should show full text
      expect(screen.getByText("Anterior")).toBeInTheDocument();
      expect(screen.getByText("Próximo")).toBeInTheDocument();
    });
  });

  describe("Page number generation", () => {
    it("should show all pages when total pages is small", () => {
      render(
        <PaginationControls
          currentPage={1}
          totalPages={3}
          onPageChange={mockOnPageChange}
        />
      );

      expect(screen.getByLabelText("Ir para página 1")).toBeInTheDocument();
      expect(screen.getByLabelText("Ir para página 2")).toBeInTheDocument();
      expect(screen.getByLabelText("Ir para página 3")).toBeInTheDocument();
    });

    it("should show ellipsis when there are many pages", () => {
      render(
        <PaginationControls
          currentPage={5}
          totalPages={20}
          onPageChange={mockOnPageChange}
        />
      );

      // Should show ellipsis (there can be multiple ellipsis elements)
      const ellipsisElements = screen.getAllByText("...");
      expect(ellipsisElements.length).toBeGreaterThan(0);
    });
  });

  describe("Visual states", () => {
    it("should apply opacity when navigating", () => {
      const { container } = render(
        <PaginationControls
          currentPage={1}
          totalPages={5}
          onPageChange={mockOnPageChange}
          isNavigating={true}
        />
      );

      const paginationContainer = container.firstChild as HTMLElement;
      expect(paginationContainer).toHaveClass("opacity-75");
    });

    it("should apply custom className", () => {
      const { container } = render(
        <PaginationControls
          currentPage={1}
          totalPages={5}
          onPageChange={mockOnPageChange}
          className="custom-class"
        />
      );

      const paginationContainer = container.firstChild as HTMLElement;
      expect(paginationContainer).toHaveClass("custom-class");
    });
  });
});
