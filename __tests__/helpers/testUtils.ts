/**
 * testUtils.ts
 *
 * Centralized test utilities and helpers for the application
 */

import { vi } from "vitest";

export {
  NotificationTestWrapper,
  renderWithNotifications,
  renderWithNotificationsAndWrapper,
} from "./NotificationTestWrapper";

/**
 * Common test data and mocks
 */
export const mockFeedSources = [
  { url: "https://example.com/feed.xml", customTitle: "Test Feed" },
  { url: "https://test.com/rss.xml", customTitle: "Another Feed" },
  { url: "https://invalid.com/feed.xml" },
];

/**
 * Mock functions commonly used in tests
 */
export const createMockFunctions = () => ({
  mockSetFeeds: vi.fn(),
  mockCloseModal: vi.fn(),
  mockOnEdit: vi.fn(),
  mockOnRemove: vi.fn(),
  mockOnRetry: vi.fn(),
  mockOnSelect: vi.fn(),
});

/**
 * Wait for async operations in tests
 */
export const waitForAsync = (ms: number = 0) =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Mock notification context value for testing
 */
export const createMockNotificationContext = () => ({
  notifications: [],
  showNotification: vi.fn(),
  removeNotification: vi.fn(),
  clearAllNotifications: vi.fn(),
  showConfirm: vi.fn().mockResolvedValue(true),
  showAlert: vi.fn().mockResolvedValue(undefined),
});
