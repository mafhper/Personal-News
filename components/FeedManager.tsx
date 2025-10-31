/**
 * FeedManager.tsx
 *
 * Componente para gerenciamento de feeds RSS no Personal News Dashboard.
 * Permite adicionar, remover e importar feeds via OPML.
 * Integra-se com o gerenciador de categorias para organização de feeds.
 * Suporta notificações nativas para novos artigos.
 *
 * @author Matheus Pereira
 * @version 2.1.0
 */

import React, { useState, useRef, useEffect } from "react";
import type { FeedSource, Article } from "../types";
import { parseOpml } from "../services/rssParser";
import { FeedCategoryManager } from "./FeedCategoryManager";
import { useLogger } from "../services/logger";
import {
  feedValidator,
  getFeedStatusIcon,
  getFeedStatusColor,
  getFeedStatusText,
  type FeedValidationResult,
} from "../services/feedValidator";
import {
  type DiscoveredFeed,
  getFeedTypeIcon,
  getFeedTypeColor,
  getDiscoveryMethodText,
  getConfidenceText,
  getConfidenceColor,
} from "../services/feedDiscoveryService";
import { OPMLExportService } from "../services/opmlExportService";
import {
  feedDuplicateDetector,
  type DuplicateDetectionResult,
} from "../services/feedDuplicateDetector";
import { useNotificationReplacements } from "../hooks/useNotificationReplacements";

interface FeedManagerProps {
  currentFeeds: FeedSource[];
  setFeeds: React.Dispatch<React.SetStateAction<FeedSource[]>>;
  closeModal: () => void;
  articles?: Article[];
}

export const FeedManager: React.FC<FeedManagerProps> = ({
  currentFeeds,
  setFeeds,
  closeModal,
  articles = [],
}) => {
  const logger = useLogger("FeedManager");
  const [newFeedUrl, setNewFeedUrl] = useState("");
  const [activeTab, setActiveTab] = useState<"feeds" | "categories">(
    "feeds" as "feeds" | "categories"
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [lastArticleCount, setLastArticleCount] = useState(0);

  // Estados para validação de feeds
  const [feedValidations, setFeedValidations] = useState<
    Map<string, FeedValidationResult>
  >(new Map());
  const [isValidating, setIsValidating] = useState(false);
  const [editingFeed, setEditingFeed] = useState<string | null>(null);
  const [editUrl, setEditUrl] = useState("");

  // Estados para seleção múltipla
  const [selectedFeeds, setSelectedFeeds] = useState<Set<string>>(new Set());

  // Hook para notificações integradas
  const { confirm, alertSuccess, alertError, confirmDanger } =
    useNotificationReplacements();
  const [isSelectMode, setIsSelectMode] = useState(false);

  // Estados para busca e filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Estados para descoberta de feeds
  const [discoveryInProgress, setDiscoveryInProgress] = useState<Set<string>>(
    new Set()
  );
  const [discoveryProgress, setDiscoveryProgress] = useState<
    Map<string, { status: string; progress: number }>
  >(new Map());
  const [showDiscoveryModal, setShowDiscoveryModal] = useState(false);
  const [currentDiscoveryResult, setCurrentDiscoveryResult] = useState<{
    originalUrl: string;
    discoveredFeeds: DiscoveredFeed[];
  } | null>(null);

  // Estados para detecção de duplicatas
  const [duplicateWarning, setDuplicateWarning] = useState<{
    show: boolean;
    result: DuplicateDetectionResult;
    newUrl: string;
  } | null>(null);

  // Validar feeds automaticamente quando a lista muda
  useEffect(() => {
    if (currentFeeds.length > 0 && activeTab === "feeds") {
      validateAllFeeds();
    }
  }, [currentFeeds, activeTab]);

  // Detectar novos artigos e enviar notificações
  useEffect(() => {
    if (articles.length > lastArticleCount && lastArticleCount > 0) {
      const newArticles = articles.slice(0, articles.length - lastArticleCount);

      if (newArticles.length > 0) {
        logger.info("New articles detected", {
          additionalData: {
            newArticlesCount: newArticles.length,
            totalArticles: articles.length,
            lastCount: lastArticleCount,
          },
        });
      }
    }

    setLastArticleCount(articles.length);
  }, [articles, lastArticleCount]);

  // Funções de validação de feeds
  const validateAllFeeds = async () => {
    if (isValidating) return;

    setIsValidating(true);
    const urls = currentFeeds.map((feed) => feed.url);

    try {
      const results = await feedValidator.validateFeeds(urls);
      const validationMap = new Map<string, FeedValidationResult>();

      results.forEach((result) => {
        validationMap.set(result.url, result);
      });

      setFeedValidations(validationMap);
      logger.info("Feed validation completed", {
        additionalData: {
          totalFeeds: urls.length,
          validFeeds: results.filter((r) => r.status === "valid").length,
          invalidFeeds: results.filter((r) => r.status !== "valid").length,
        },
      });
    } catch (error) {
      logger.error("Feed validation failed", error as Error);
    } finally {
      setIsValidating(false);
    }
  };

  const validateSingleFeed = async (url: string) => {
    try {
      const result = await feedValidator.validateFeed(url);
      setFeedValidations((prev) => new Map(prev.set(url, result)));
      return result;
    } catch (error) {
      logger.error("Single feed validation failed", error as Error, {
        additionalData: { feedUrl: url },
      });
      return null;
    }
  };

  const handleEditFeed = (oldUrl: string) => {
    setEditingFeed(oldUrl);
    setEditUrl(oldUrl);
  };

  const handleSaveEdit = async (oldUrl: string) => {
    if (editUrl && editUrl !== oldUrl) {
      const validation = await validateSingleFeed(editUrl);

      if (validation && validation.status === "valid") {
        setFeeds((prev) =>
          prev.map((feed) =>
            feed.url === oldUrl ? { ...feed, url: editUrl } : feed
          )
        );
        setEditingFeed(null);
        setEditUrl("");
      } else {
        await alertError(
          "O novo URL não é um feed RSS válido. Por favor, verifique o endereço."
        );
      }
    } else {
      setEditingFeed(null);
      setEditUrl("");
    }
  };

  const handleCancelEdit = () => {
    setEditingFeed(null);
    setEditUrl("");
  };

  // Enhanced duplicate detection using FeedDuplicateDetector
  const checkForDuplicates = async (
    newUrl: string
  ): Promise<DuplicateDetectionResult> => {
    try {
      return await feedDuplicateDetector.detectDuplicate(newUrl, currentFeeds);
    } catch (error) {
      logger.error("Duplicate detection failed", error as Error, {
        additionalData: { newUrl },
      });
      // Fallback to simple URL comparison
      const normalizedNewUrl = feedDuplicateDetector.normalizeUrl(newUrl);
      for (const feed of currentFeeds) {
        const normalizedExistingUrl = feedDuplicateDetector.normalizeUrl(
          feed.url
        );
        if (normalizedExistingUrl === normalizedNewUrl) {
          return {
            isDuplicate: true,
            duplicateOf: feed,
            confidence: 1.0,
            reason: "Identical normalized URLs (fallback detection)",
          };
        }
      }
      return {
        isDuplicate: false,
        confidence: 0,
        reason: "No duplicates detected (fallback detection)",
      };
    }
  };

  // Duplicate resolution handlers
  const handleDuplicateWarningAccept = () => {
    if (!duplicateWarning) return;

    // User chose to add anyway, proceed with adding the feed
    proceedWithFeedAddition(duplicateWarning.newUrl);
    setDuplicateWarning(null);
  };

  const handleDuplicateWarningReject = () => {
    setDuplicateWarning(null);
    // Keep the URL in the input for user to modify if needed
  };

  const handleDuplicateWarningReplace = () => {
    if (!duplicateWarning?.result.duplicateOf) return;

    // Remove the existing duplicate and add the new one
    setFeeds((prev) =>
      prev.filter(
        (feed) => feed.url !== duplicateWarning.result.duplicateOf!.url
      )
    );
    proceedWithFeedAddition(duplicateWarning.newUrl);
    setDuplicateWarning(null);
  };

  const proceedWithFeedAddition = async (url: string) => {
    // Start discovery process
    setDiscoveryInProgress((prev) => new Set(prev.add(url)));
    setDiscoveryProgress(
      (prev) =>
        new Map(
          prev.set(url, { status: "Starting validation...", progress: 0 })
        )
    );

    try {
      const result = await feedValidator.validateFeedWithDiscovery(
        url,
        (status: string, progress: number) => {
          setDiscoveryProgress(
            (prev) => new Map(prev.set(url, { status, progress }))
          );
        }
      );

      if (result.isValid) {
        // Feed validated successfully (either direct or single discovered feed)
        const feedToAdd: FeedSource = {
          url: result.url, // Use the final URL (might be different if discovered)
          customTitle: result.title,
        };

        setFeeds((prev) => [...prev, feedToAdd]);
        setNewFeedUrl("");

        logger.info("Feed added successfully with discovery", {
          additionalData: {
            originalUrl: url,
            finalUrl: result.url,
            method: result.finalMethod,
            totalFeeds: currentFeeds.length + 1,
          },
        });

        // Show success message
        if (result.finalMethod === "discovery") {
          await alertError(
            `Feed discovered and added successfully!\nOriginal URL: ${url}\nFeed URL: ${result.url}`
          );
        }
      } else if (
        result.requiresUserSelection &&
        result.discoveredFeeds &&
        result.discoveredFeeds.length > 0
      ) {
        // Multiple feeds discovered, show selection modal
        setCurrentDiscoveryResult({
          originalUrl: url,
          discoveredFeeds: result.discoveredFeeds,
        });
        setShowDiscoveryModal(true);
        setNewFeedUrl(""); // Clear the input since we'll handle it in the modal
      } else {
        // No feeds found or validation failed
        await alertError(
          result.error || "Failed to validate or discover feeds from this URL"
        );
        logger.warn("Feed discovery failed", {
          additionalData: {
            url,
            error: result.error,
            suggestions: result.suggestions,
          },
        });
      }
    } catch (error: any) {
      await alertError(`Failed to process feed: ${error.message}`);
      logger.error("Feed discovery process failed", error, {
        additionalData: { url },
      });
    } finally {
      setDiscoveryInProgress((prev) => {
        const newSet = new Set(prev);
        newSet.delete(url);
        return newSet;
      });
      setDiscoveryProgress((prev) => {
        const newMap = new Map(prev);
        newMap.delete(url);
        return newMap;
      });
    }
  };

  // Enhanced feed addition with flexible validation and duplicate detection
  const handleAddFeedWithDiscovery = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newFeedUrl.trim()) {
      await alertError("Por favor, insira uma URL válida para o feed.");
      return;
    }

    const url = newFeedUrl.trim();

    // Enhanced duplicate detection
    const duplicateResult = await checkForDuplicates(url);

    if (duplicateResult.isDuplicate) {
      // Show duplicate warning modal instead of simple alert
      setDuplicateWarning({
        show: true,
        result: duplicateResult,
        newUrl: url,
      });

      logger.info("Duplicate feed detected", {
        additionalData: {
          attemptedUrl: url,
          duplicateOf: duplicateResult.duplicateOf?.url,
          confidence: duplicateResult.confidence,
          reason: duplicateResult.reason,
        },
      });
      return;
    }

    // Start discovery process
    setDiscoveryInProgress((prev) => new Set(prev.add(url)));
    setDiscoveryProgress(
      (prev) =>
        new Map(
          prev.set(url, { status: "Starting validation...", progress: 0 })
        )
    );

    try {
      const result = await feedValidator.validateFeedWithDiscovery(
        url,
        (status: string, progress: number) => {
          setDiscoveryProgress(
            (prev) => new Map(prev.set(url, { status, progress }))
          );
        }
      );

      if (result.isValid) {
        // Feed validated successfully (either direct or single discovered feed)
        const feedToAdd: FeedSource = {
          url: result.url, // Use the final URL (might be different if discovered)
          customTitle: result.title,
        };

        setFeeds((prev) => [...prev, feedToAdd]);
        setNewFeedUrl("");

        logger.info("Feed added successfully with discovery", {
          additionalData: {
            originalUrl: url,
            finalUrl: result.url,
            method: result.finalMethod,
            totalFeeds: currentFeeds.length + 1,
          },
        });

        // Show success message
        if (result.finalMethod === "discovery") {
          await alertError(
            `Feed discovered and added successfully!\nOriginal URL: ${url}\nFeed URL: ${result.url}`
          );
        }
      } else if (
        result.requiresUserSelection &&
        result.discoveredFeeds &&
        result.discoveredFeeds.length > 0
      ) {
        // Multiple feeds discovered, show selection modal
        setCurrentDiscoveryResult({
          originalUrl: url,
          discoveredFeeds: result.discoveredFeeds,
        });
        setShowDiscoveryModal(true);
        setNewFeedUrl(""); // Clear the input since we'll handle it in the modal
      } else {
        // Validation failed - offer to add anyway (flexible approach)
        const shouldAddAnyway = await confirm(
          `Validation failed: ${result.error || "Unknown error"}\n\n` +
            `Many feeds work despite validation errors. Would you like to add this feed anyway?\n\n` +
            `URL: ${url}\n\n` +
            `The feed will be added and you can see if it works in the main interface.`
        );

        if (shouldAddAnyway) {
          // Add the feed despite validation failure
          const feedToAdd: FeedSource = {
            url: url,
            customTitle: result.title || undefined,
          };

          setFeeds((prev) => [...prev, feedToAdd]);
          setNewFeedUrl("");

          logger.info("Feed added despite validation failure", {
            additionalData: {
              url,
              error: result.error,
              userChoice: "add_anyway",
              totalFeeds: currentFeeds.length + 1,
            },
          });

          await alertError(
            `Feed added successfully!\n\n` +
              `Note: The feed had validation issues but was added anyway. ` +
              `You can check if it works properly in the main interface.`
          );
        } else {
          logger.info("User chose not to add invalid feed", {
            additionalData: {
              url,
              error: result.error,
              userChoice: "reject",
            },
          });
        }
      }
    } catch (error: any) {
      // Even if discovery completely fails, offer to add the original URL
      const shouldAddAnyway = await confirm(
        `Failed to process feed: ${error.message}\n\n` +
          `Would you like to add this URL anyway? Many feeds work despite processing errors.\n\n` +
          `URL: ${url}\n\n` +
          `The feed will be added and you can see if it works in the main interface.`
      );

      if (shouldAddAnyway) {
        const feedToAdd: FeedSource = {
          url: url,
        };

        setFeeds((prev) => [...prev, feedToAdd]);
        setNewFeedUrl("");

        logger.info("Feed added despite processing failure", {
          additionalData: {
            url,
            error: error.message,
            userChoice: "add_anyway",
            totalFeeds: currentFeeds.length + 1,
          },
        });

        await alertError(
          `Feed added successfully!\n\n` +
            `Note: The feed had processing issues but was added anyway. ` +
            `You can check if it works properly in the main interface.`
        );
      } else {
        logger.error("Feed discovery process failed and user rejected", error, {
          additionalData: { url, userChoice: "reject" },
        });
      }
    } finally {
      setDiscoveryInProgress((prev) => {
        const newSet = new Set(prev);
        newSet.delete(url);
        return newSet;
      });
      setDiscoveryProgress((prev) => {
        const newMap = new Map(prev);
        newMap.delete(url);
        return newMap;
      });
    }
  };

  const handleSelectDiscoveredFeed = async (discoveredFeed: DiscoveredFeed) => {
    if (!currentDiscoveryResult) return;

    try {
      const result = await feedValidator.validateDiscoveredFeed(
        discoveredFeed,
        currentDiscoveryResult.originalUrl
      );

      if (result.isValid) {
        const feedToAdd: FeedSource = {
          url: discoveredFeed.url,
          customTitle: discoveredFeed.title || result.title,
        };

        setFeeds((prev) => [...prev, feedToAdd]);
        setShowDiscoveryModal(false);
        setCurrentDiscoveryResult(null);

        logger.info("Discovered feed selected and added", {
          additionalData: {
            originalUrl: currentDiscoveryResult.originalUrl,
            selectedUrl: discoveredFeed.url,
            discoveryMethod: discoveredFeed.discoveryMethod,
            confidence: discoveredFeed.confidence,
          },
        });

        await alertError(
          `Feed added successfully!\nTitle: ${
            discoveredFeed.title || "Unknown"
          }\nURL: ${discoveredFeed.url}`
        );
      } else {
        await alertError(`Selected feed is not valid: ${result.error}`);
      }
    } catch (error: any) {
      await alertError(`Failed to validate selected feed: ${error.message}`);
      logger.error("Failed to validate selected discovered feed", error);
    }
  };

  const handleCancelDiscovery = () => {
    setShowDiscoveryModal(false);
    setCurrentDiscoveryResult(null);
  };

  // Enhanced validation handler functions
  const handleRetryValidation = async (url: string) => {
    if (isValidating) return;

    try {
      setIsValidating(true);

      // Clear cache first to force fresh validation
      feedValidator.revalidateFeed(url);

      const result = await feedValidator.validateFeed(url);
      setFeedValidations((prev) => new Map(prev.set(url, result)));

      logger.info("Feed retry validation completed", {
        additionalData: {
          feedUrl: url,
          isValid: result.isValid,
          status: result.status,
          attempts: result.validationAttempts.length,
          totalRetries: result.totalRetries,
        },
      });
    } catch (error) {
      logger.error("Feed retry validation failed", error as Error, {
        additionalData: { feedUrl: url },
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleForceDiscovery = async (url: string) => {
    if (discoveryInProgress.has(url)) return;

    setDiscoveryInProgress((prev) => new Set(prev.add(url)));
    setDiscoveryProgress(
      (prev) =>
        new Map(
          prev.set(url, { status: "Starting feed discovery...", progress: 0 })
        )
    );

    try {
      const result = await feedValidator.validateFeedWithDiscovery(
        url,
        (status: string, progress: number) => {
          setDiscoveryProgress(
            (prev) => new Map(prev.set(url, { status, progress }))
          );
        }
      );

      if (result.isValid && !result.requiresUserSelection) {
        // Update the existing feed with discovered information
        setFeeds((prev) =>
          prev.map((feed) =>
            feed.url === url
              ? {
                  ...feed,
                  url: result.url, // Use discovered URL if different
                  customTitle: result.title || feed.customTitle,
                }
              : feed
          )
        );

        // Update validation results
        setFeedValidations((prev) => new Map(prev.set(url, result)));

        logger.info("Force discovery completed successfully", {
          additionalData: {
            originalUrl: url,
            finalUrl: result.url,
            method: result.finalMethod,
            discoveredFeeds: result.discoveredFeeds?.length || 0,
          },
        });

        await alertError(
          `Feed discovery successful!\n${
            result.finalMethod === "discovery"
              ? `Discovered feed: ${result.url}`
              : "Feed validated successfully"
          }`
        );
      } else if (
        result.requiresUserSelection &&
        result.discoveredFeeds &&
        result.discoveredFeeds.length > 0
      ) {
        // Show discovery modal for user selection
        setCurrentDiscoveryResult({
          originalUrl: url,
          discoveredFeeds: result.discoveredFeeds,
        });
        setShowDiscoveryModal(true);
      } else {
        // Discovery failed or no feeds found
        setFeedValidations((prev) => new Map(prev.set(url, result)));
        await alertError(
          result.error ||
            "No RSS feeds found on this website. Please check the URL."
        );
      }
    } catch (error: any) {
      logger.error("Force discovery failed", error, {
        additionalData: { url },
      });
      await alertError(`Feed discovery failed: ${error.message}`);
    } finally {
      setDiscoveryInProgress((prev) => {
        const newSet = new Set(prev);
        newSet.delete(url);
        return newSet;
      });
      setDiscoveryProgress((prev) => {
        const newMap = new Map(prev);
        newMap.delete(url);
        return newMap;
      });
    }
  };

  const handleClearCache = async (url: string) => {
    try {
      // Clear cache for this specific feed
      feedValidator.revalidateFeed(url);

      // Remove from local validation state to show "unchecked" status
      setFeedValidations((prev) => {
        const newMap = new Map(prev);
        newMap.delete(url);
        return newMap;
      });

      logger.info("Feed cache cleared", {
        additionalData: { feedUrl: url },
      });

      // Optionally trigger immediate revalidation
      setTimeout(() => {
        handleRetryValidation(url);
      }, 100);
    } catch (error) {
      logger.error("Failed to clear feed cache", error as Error, {
        additionalData: { feedUrl: url },
      });
    }
  };

  // Simple feed addition without validation (for problematic feeds that still work)
  const handleAddFeedDirectly = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newFeedUrl.trim()) {
      await alertError("Por favor, insira uma URL válida para o feed.");
      return;
    }

    const url = newFeedUrl.trim();

    // Check for duplicates only
    const duplicateResult = await checkForDuplicates(url);

    if (duplicateResult.isDuplicate) {
      const shouldReplace = await confirm(
        `This feed appears to be a duplicate of an existing feed:\n\n` +
          `Existing: ${duplicateResult.duplicateOf?.url}\n` +
          `New: ${url}\n\n` +
          `Would you like to replace the existing feed with this one?`
      );

      if (shouldReplace && duplicateResult.duplicateOf) {
        // Remove the existing duplicate and add the new one
        setFeeds((prev) =>
          prev.filter((feed) => feed.url !== duplicateResult.duplicateOf!.url)
        );
      } else if (!shouldReplace) {
        return; // User chose not to add duplicate
      }
    }

    // Add feed directly without validation
    const feedToAdd: FeedSource = {
      url: url,
    };

    setFeeds((prev) => [...prev, feedToAdd]);
    setNewFeedUrl("");

    logger.info("Feed added directly without validation", {
      additionalData: {
        url,
        totalFeeds: currentFeeds.length + 1,
        method: "direct_add",
      },
    });

    await alertError(
      `Feed added successfully!\n\n` +
        `Note: The feed was added without validation. ` +
        `You can check if it works properly in the main interface.`
    );
  };

  const handleAddFeed = handleAddFeedWithDiscovery;

  const handleRemoveFeed = (urlToRemove: string) => {
    setFeeds((prev) => prev.filter((f) => f.url !== urlToRemove));
  };

  // Funções para seleção múltipla
  const handleToggleSelectMode = () => {
    setIsSelectMode(!isSelectMode);
    setSelectedFeeds(new Set());
  };

  const handleSelectFeed = (url: string) => {
    const newSelected = new Set(selectedFeeds);
    if (newSelected.has(url)) {
      newSelected.delete(url);
    } else {
      newSelected.add(url);
    }
    setSelectedFeeds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedFeeds.size === currentFeeds.length) {
      setSelectedFeeds(new Set());
    } else {
      setSelectedFeeds(new Set(currentFeeds.map((feed) => feed.url)));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedFeeds.size === 0) return;

    const feedCount = selectedFeeds.size;
    const confirmMessage =
      feedCount === currentFeeds.length
        ? `Tem certeza que deseja excluir TODOS os ${feedCount} feeds? Esta ação não pode ser desfeita.`
        : `Tem certeza que deseja excluir os ${feedCount} feeds selecionados? Esta ação não pode ser desfeita.`;

    if (await confirmDanger(confirmMessage)) {
      setFeeds((prev) => prev.filter((feed) => !selectedFeeds.has(feed.url)));
      setSelectedFeeds(new Set());
      setIsSelectMode(false);

      logger.info("Bulk feed deletion completed", {
        additionalData: {
          deletedCount: feedCount,
          remainingCount: currentFeeds.length - feedCount,
        },
      });
    }
  };

  const handleDeleteAll = async () => {
    if (currentFeeds.length === 0) return;

    const confirmMessage = `Tem certeza que deseja excluir TODOS os ${currentFeeds.length} feeds? Esta ação não pode ser desfeita.`;

    if (await confirmDanger(confirmMessage)) {
      setFeeds([]);
      setSelectedFeeds(new Set());
      setIsSelectMode(false);

      logger.info("All feeds deleted", {
        additionalData: {
          deletedCount: currentFeeds.length,
        },
      });
    }
  };

  // Função para filtrar feeds baseado na busca e filtros
  const getFilteredFeeds = () => {
    return currentFeeds.filter((feed) => {
      const validation = feedValidations.get(feed.url);

      // Filtro por termo de busca
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        feed.url.toLowerCase().includes(searchLower) ||
        (validation?.title &&
          validation.title.toLowerCase().includes(searchLower)) ||
        (validation?.description &&
          validation.description.toLowerCase().includes(searchLower)) ||
        (feed.customTitle &&
          feed.customTitle.toLowerCase().includes(searchLower)) ||
        (feed.categoryId &&
          feed.categoryId.toLowerCase().includes(searchLower));

      // Filtro por status
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "valid" && validation?.status === "valid") ||
        (statusFilter === "invalid" &&
          validation?.status &&
          validation.status !== "valid") ||
        (statusFilter === "unchecked" && !validation);

      return matchesSearch && matchesStatus;
    });
  };

  const filteredFeeds = getFilteredFeeds();

  // Função para limpar filtros
  const handleClearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const content = await file.text();
      try {
        const urls = parseOpml(content);
        const newFeeds = urls
          .filter((url) => !currentFeeds.some((f) => f.url === url))
          .map((url) => ({ url }));
        if (newFeeds.length > 0) {
          setFeeds((prev) => [...prev, ...newFeeds]);
        }
        await alertSuccess(
          `${newFeeds.length} new feeds imported successfully!`
        );
      } catch (error) {
        await alertError(
          "Failed to parse OPML file. Please ensure it's a valid XML file."
        );
        logger.error("Failed to parse OPML file", error as Error, {
          additionalData: {
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
          },
        });
      }
    }
  };

  const handleExportOPML = async () => {
    try {
      if (currentFeeds.length === 0) {
        await alertError("No feeds to export. Please add some feeds first.");
        return;
      }

      // Detect duplicates before export using enhanced detection
      const duplicateResult = await feedDuplicateDetector.removeDuplicates(
        currentFeeds,
        {
          action: "keep_first",
        }
      );

      // Generate OPML content (this will automatically remove duplicates)
      const opmlContent = await OPMLExportService.generateOPML(
        currentFeeds,
        [], // No categories for now - will be enhanced when categories are integrated
        {
          title: "Personal News Dashboard Feeds",
          description: "RSS feeds exported from Personal News Dashboard",
          ownerName: "Personal News Dashboard User",
          includeCategories: false, // Will be true when categories are integrated
          includeFeedMetadata: true,
        }
      );

      // Validate OPML before download
      const validation = OPMLExportService.validateOPML(opmlContent);
      if (!validation.isValid) {
        logger.error(
          "Generated OPML is invalid",
          new Error("OPML validation failed"),
          {
            additionalData: {
              errors: validation.errors,
              warnings: validation.warnings,
            },
          }
        );
        await alertError(
          "Failed to generate valid OPML file. Please try again."
        );
        return;
      }

      // Generate filename with timestamp
      const filename = OPMLExportService.generateFilename(
        "personal-news-dashboard-feeds"
      );

      // Download the file
      OPMLExportService.downloadOPML(opmlContent, filename);

      // Log export details including duplicate information
      logger.info("OPML export completed successfully", {
        additionalData: {
          originalFeedCount: currentFeeds.length,
          uniqueFeedCount: duplicateResult.uniqueFeeds.length,
          duplicateCount: duplicateResult.removedDuplicates.length,
          filename: filename,
          hasWarnings: validation.warnings.length > 0,
          warnings: validation.warnings,
          duplicates: duplicateResult.removedDuplicates.map((d) => ({
            original: d.originalFeed.url,
            duplicateOf: d.duplicateOf.url,
            reason: d.reason,
          })),
        },
      });

      // Show success message with duplicate information
      let message = `Successfully exported ${duplicateResult.uniqueFeeds.length} unique feeds to ${filename}`;

      if (duplicateResult.removedDuplicates.length > 0) {
        message += `\n\nNote: ${
          duplicateResult.removedDuplicates.length
        } duplicate feed${
          duplicateResult.removedDuplicates.length > 1 ? "s were" : " was"
        } automatically removed during export.`;

        // Show details about duplicates if there are only a few
        if (duplicateResult.removedDuplicates.length <= 3) {
          const duplicateDetails = duplicateResult.removedDuplicates
            .map(
              (d) =>
                `• ${
                  d.originalFeed.customTitle || d.originalFeed.url
                } (duplicate of ${
                  d.duplicateOf.customTitle || d.duplicateOf.url
                })`
            )
            .join("\n");
          message += `\n\nDuplicates removed:\n${duplicateDetails}`;
        }
      }

      await alertError(message);
    } catch (error) {
      logger.error("OPML export failed", error as Error, {
        additionalData: {
          feedCount: currentFeeds.length,
        },
      });
      await alertError("Failed to export OPML file. Please try again.");
    }
  };

  if (activeTab === "categories") {
    return (
      <FeedCategoryManager
        feeds={currentFeeds}
        setFeeds={setFeeds}
        onClose={closeModal}
      />
    );
  }

  return (
    <div role="dialog" aria-labelledby="feed-manager-title">
      <div className="flex justify-between items-center mb-6">
        <h2 id="feed-manager-title" className="text-2xl font-bold text-white">
          Manage Feeds
        </h2>
        <button
          onClick={closeModal}
          className="text-gray-400 hover:text-white transition-colors"
          aria-label="Close feed manager"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-gray-800 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab("feeds")}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === "feeds"
              ? "bg-[rgb(var(--color-accent))] text-white"
              : "text-gray-300 hover:text-white hover:bg-gray-700"
          }`}
        >
          Feeds
        </button>
        <button
          onClick={() => setActiveTab("categories")}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            (activeTab as string) === "categories"
              ? "bg-[rgb(var(--color-accent))] text-white"
              : "text-gray-300 hover:text-white hover:bg-gray-700"
          }`}
        >
          Categories
        </button>
      </div>

      <section aria-labelledby="add-feed-section">
        <h3 id="add-feed-section" className="sr-only">
          Add New Feed
        </h3>
        <div className="mb-6">
          <form onSubmit={handleAddFeed} className="flex gap-2 mb-2">
            <label htmlFor="feed-url-input" className="sr-only">
              RSS Feed URL
            </label>
            <input
              id="feed-url-input"
              type="url"
              value={newFeedUrl}
              onChange={(e) => setNewFeedUrl(e.target.value)}
              placeholder="https://example.com/rss.xml"
              className="flex-grow bg-gray-700 text-white rounded-md px-4 py-2 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-accent))]"
              required
              aria-label="Enter RSS feed URL"
              aria-describedby="feed-url-help"
            />
            <div id="feed-url-help" className="sr-only">
              Enter a valid RSS feed URL to add to your feed list
            </div>
            <button
              type="submit"
              disabled={discoveryInProgress.size > 0}
              className="bg-[rgb(var(--color-accent))] text-white font-bold px-4 py-2 rounded-md hover:bg-[rgb(var(--color-accent-dark))] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Add RSS feed with validation and discovery"
            >
              {discoveryInProgress.size > 0 ? "Processing..." : "Add"}
            </button>
          </form>

          {/* Alternative direct add button */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleAddFeedDirectly}
              disabled={!newFeedUrl.trim() || discoveryInProgress.size > 0}
              className="text-sm bg-gray-600 text-white px-3 py-1 rounded-md hover:bg-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Add RSS feed directly without validation"
              title="Add feed directly without validation (for feeds that work despite validation errors)"
            >
              Add Anyway
            </button>
          </div>
        </div>

        {/* Enhanced Discovery Progress Indicator */}
        {discoveryInProgress.size > 0 && (
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-md p-4 mb-4">
            <div className="flex items-center space-x-3">
              <svg
                className="animate-spin h-5 w-5 text-blue-400"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <div className="flex-grow">
                <div className="text-sm font-medium text-blue-300">
                  Processing feed discovery...
                </div>
                {Array.from(discoveryProgress.entries()).map(
                  ([url, progress]) => (
                    <div key={url} className="mt-2">
                      <div className="flex items-center justify-between text-xs text-gray-300 mb-1">
                        <span className="truncate max-w-xs">{url}</span>
                        <span>{progress.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progress.progress}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {progress.status}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        )}

        {/* Feed Discovery Results Modal */}
        {showDiscoveryModal && currentDiscoveryResult && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">
                  Multiple Feeds Discovered
                </h3>
                <button
                  onClick={handleCancelDiscovery}
                  className="text-gray-400 hover:text-white transition-colors"
                  aria-label="Close discovery modal"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="mb-4">
                <p className="text-gray-300 text-sm">
                  Found {currentDiscoveryResult.discoveredFeeds.length} RSS
                  feeds on{" "}
                  <span className="font-mono text-blue-300">
                    {currentDiscoveryResult.originalUrl}
                  </span>
                </p>
                <p className="text-gray-400 text-xs mt-1">
                  Select the feed you want to add to your collection:
                </p>
              </div>

              <div className="space-y-3">
                {currentDiscoveryResult.discoveredFeeds.map((feed, index) => (
                  <div
                    key={index}
                    className="bg-gray-700 rounded-md p-4 border border-gray-600 hover:border-gray-500 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-grow">
                        <div className="flex items-center space-x-2 mb-2">
                          <span
                            className={`text-lg ${getFeedTypeColor(feed.type)}`}
                          >
                            {getFeedTypeIcon(feed.type)}
                          </span>
                          <h4 className="font-medium text-white">
                            {feed.title || "Untitled Feed"}
                          </h4>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${getConfidenceColor(
                              feed.confidence
                            )}`}
                          >
                            {getConfidenceText(feed.confidence)}
                          </span>
                        </div>

                        {feed.description && (
                          <p className="text-sm text-gray-300 mb-2 line-clamp-2">
                            {feed.description}
                          </p>
                        )}

                        <div className="flex items-center space-x-4 text-xs text-gray-400">
                          <span className="font-mono bg-gray-800 px-2 py-1 rounded">
                            {feed.url}
                          </span>
                          <span>
                            {getDiscoveryMethodText(feed.discoveryMethod)}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleSelectDiscoveredFeed(feed)}
                        className="ml-4 bg-[rgb(var(--color-accent))] text-white px-4 py-2 rounded-md hover:bg-[rgb(var(--color-accent-dark))] transition-colors text-sm font-medium"
                      >
                        Select
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={handleCancelDiscovery}
                  className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      <section aria-labelledby="current-feeds-section">
        <div className="flex justify-between items-center mb-4">
          <h3
            id="current-feeds-section"
            className="text-lg font-semibold text-white"
          >
            Current Feeds ({currentFeeds.length})
            {isSelectMode && selectedFeeds.size > 0 && (
              <span className="text-sm text-[rgb(var(--color-accent))] ml-2">
                ({selectedFeeds.size} selecionados)
              </span>
            )}
          </h3>
          <div className="flex items-center space-x-2">
            {isValidating && (
              <div className="flex items-center text-blue-400 text-sm">
                <svg
                  className="animate-spin h-4 w-4 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Validando...
              </div>
            )}
            <button
              onClick={validateAllFeeds}
              disabled={isValidating}
              className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded-md transition-colors disabled:opacity-50"
              title="Revalidar todos os feeds"
            >
              🔄 Verificar
            </button>
            {currentFeeds.length > 0 && (
              <button
                onClick={handleToggleSelectMode}
                className={`text-xs px-3 py-1 rounded-md transition-colors ${
                  isSelectMode
                    ? "bg-[rgb(var(--color-accent))] text-white hover:bg-[rgb(var(--color-accent-dark))]"
                    : "bg-gray-700 hover:bg-gray-600 text-white"
                }`}
                title={isSelectMode ? "Cancelar seleção" : "Selecionar feeds"}
              >
                {isSelectMode ? "✕ Cancelar" : "☑️ Selecionar"}
              </button>
            )}
          </div>
        </div>

        {/* Controles de seleção múltipla */}
        {isSelectMode && currentFeeds.length > 0 && (
          <div className="bg-gray-800 p-3 rounded-md mb-4 border border-gray-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleSelectAll}
                  className="text-sm text-[rgb(var(--color-accent))] hover:text-[rgb(var(--color-accent-dark))] transition-colors"
                >
                  {selectedFeeds.size === currentFeeds.length
                    ? "🔲 Desmarcar Todos"
                    : "☑️ Selecionar Todos"}
                </button>
                <span className="text-sm text-gray-400">
                  {selectedFeeds.size} de {currentFeeds.length} selecionados
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {selectedFeeds.size > 0 && (
                  <button
                    onClick={handleDeleteSelected}
                    className="bg-red-600 hover:bg-red-700 text-white text-sm px-3 py-1 rounded-md transition-colors"
                    title={`Excluir ${selectedFeeds.size} feeds selecionados`}
                  >
                    🗑️ Excluir Selecionados ({selectedFeeds.size})
                  </button>
                )}
                <button
                  onClick={handleDeleteAll}
                  className="bg-red-800 hover:bg-red-900 text-white text-sm px-3 py-1 rounded-md transition-colors"
                  title="Excluir todos os feeds"
                >
                  🗑️ Excluir Todos
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Busca e Filtros */}
        {currentFeeds.length > 0 && (
          <div className="bg-gray-800 p-4 rounded-md mb-4 border border-gray-600">
            <div className="flex flex-col space-y-3">
              {/* Linha superior: Busca */}
              <div className="flex items-center space-x-3">
                <div className="flex-grow relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar por URL, título, descrição ou categoria..."
                    className="w-full bg-gray-700 text-white rounded-md px-4 py-2 pl-10 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-accent))] text-sm"
                    aria-label="Buscar feeds"
                  />
                  <svg
                    className="absolute left-3 top-2.5 h-4 w-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>

                {/* Filtro por Status */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-gray-700 text-white rounded-md px-3 py-2 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-accent))] text-sm"
                  aria-label="Filtrar por status"
                >
                  <option value="all">Todos os Status</option>
                  <option value="valid">✅ Válidos</option>
                  <option value="invalid">❌ Com Problemas</option>
                  <option value="unchecked">❓ Não Verificados</option>
                </select>

                {/* Botão Limpar Filtros */}
                {(searchTerm || statusFilter !== "all") && (
                  <button
                    onClick={handleClearFilters}
                    className="bg-gray-600 hover:bg-gray-500 text-white px-3 py-2 rounded-md transition-colors text-sm"
                    title="Limpar filtros"
                  >
                    🗑️ Limpar
                  </button>
                )}
              </div>

              {/* Linha inferior: Informações dos resultados */}
              <div className="flex items-center justify-between text-sm text-gray-400">
                <span>
                  {filteredFeeds.length === currentFeeds.length
                    ? `Mostrando todos os ${currentFeeds.length} feeds`
                    : `Mostrando ${filteredFeeds.length} de ${currentFeeds.length} feeds`}
                </span>

                {(searchTerm || statusFilter !== "all") && (
                  <span className="text-[rgb(var(--color-accent))]">
                    {searchTerm && `Busca: "${searchTerm}"`}
                    {searchTerm && statusFilter !== "all" && " • "}
                    {statusFilter !== "all" &&
                      `Status: ${
                        statusFilter === "valid"
                          ? "Válidos"
                          : statusFilter === "invalid"
                          ? "Com Problemas"
                          : "Não Verificados"
                      }`}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        <div
          className="space-y-3 max-h-80 overflow-y-auto pr-2 mb-6"
          role="list"
          aria-label={`Current RSS feeds (${filteredFeeds.length} of ${currentFeeds.length} feeds)`}
        >
          {filteredFeeds.length > 0 ? (
            filteredFeeds.map((feed, index) => {
              const validation = feedValidations.get(feed.url);
              const isEditing = editingFeed === feed.url;

              return (
                <div
                  key={feed.url}
                  className="bg-gray-800 p-3 rounded-md border-l-4"
                  style={{
                    borderLeftColor:
                      validation?.status === "valid"
                        ? "#10b981"
                        : validation?.status === "invalid"
                        ? "#ef4444"
                        : validation?.status === "timeout"
                        ? "#f59e0b"
                        : validation?.status === "checking"
                        ? "#3b82f6"
                        : "#6b7280",
                  }}
                  role="listitem"
                  aria-label={`Feed ${index + 1}: ${feed.url}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-grow min-w-0">
                      {/* Checkbox para seleção múltipla */}
                      {isSelectMode && (
                        <div className="flex items-center pt-1">
                          <input
                            type="checkbox"
                            checked={selectedFeeds.has(feed.url)}
                            onChange={() => handleSelectFeed(feed.url)}
                            className="w-4 h-4 text-[rgb(var(--color-accent))] bg-gray-700 border-gray-600 rounded focus:ring-[rgb(var(--color-accent))] focus:ring-2"
                            aria-label={`Selecionar feed ${
                              validation?.title || feed.url
                            }`}
                          />
                        </div>
                      )}

                      <div className="flex-grow min-w-0">
                        {/* Status e título */}
                        <div className="flex items-center space-x-2 mb-1">
                          <span
                            className="text-lg"
                            title={
                              validation
                                ? getFeedStatusText(validation.status)
                                : "Não verificado"
                            }
                          >
                            {validation
                              ? getFeedStatusIcon(validation.status)
                              : "❓"}
                          </span>
                          <div className="flex-grow min-w-0">
                            {isEditing ? (
                              <input
                                type="url"
                                value={editUrl}
                                onChange={(e) => setEditUrl(e.target.value)}
                                className="w-full bg-gray-700 text-white text-sm rounded px-2 py-1 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-accent))]"
                                placeholder="https://example.com/rss.xml"
                              />
                            ) : (
                              <div
                                className="text-sm text-gray-300 truncate"
                                title={feed.url}
                              >
                                {validation?.title ||
                                  feed.customTitle ||
                                  feed.url}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* URL e informações adicionais */}
                        {!isEditing && (
                          <>
                            {(validation?.title || feed.customTitle) && (
                              <div
                                className="text-xs text-gray-500 truncate mb-1"
                                title={feed.url}
                              >
                                {feed.url}
                              </div>
                            )}

                            {validation?.description && (
                              <div
                                className="text-xs text-gray-400 truncate mb-1"
                                title={validation.description}
                              >
                                {validation.description}
                              </div>
                            )}

                            {feed.categoryId && (
                              <div className="text-xs text-[rgb(var(--color-accent))] mb-1">
                                Categoria: {feed.categoryId}
                              </div>
                            )}

                            {/* Enhanced Status and Validation Details */}
                            {validation && (
                              <div className="space-y-2">
                                <div className="flex items-center space-x-3 text-xs">
                                  <span
                                    className={`font-medium ${getFeedStatusColor(
                                      validation.status
                                    )}`}
                                  >
                                    {getFeedStatusText(validation.status)}
                                  </span>
                                  {validation.responseTime && (
                                    <span className="text-gray-500">
                                      {validation.responseTime}ms
                                    </span>
                                  )}
                                  {validation.totalRetries > 0 && (
                                    <span className="text-yellow-400">
                                      {validation.totalRetries} retries
                                    </span>
                                  )}
                                  {validation.finalMethod &&
                                    validation.finalMethod !== "direct" && (
                                      <span className="text-blue-400 capitalize">
                                        via {validation.finalMethod}
                                      </span>
                                    )}
                                </div>

                                {/* Error Message with Suggestions */}
                                {validation.error && (
                                  <div className="bg-red-900/20 border border-red-500/30 rounded p-2 text-xs">
                                    <div className="text-red-300 font-medium mb-1">
                                      {validation.error}
                                    </div>
                                    {validation.suggestions &&
                                      validation.suggestions.length > 0 && (
                                        <div className="space-y-1">
                                          <div className="text-red-200 text-xs">
                                            Suggestions:
                                          </div>
                                          <ul className="text-red-200/80 text-xs space-y-0.5 ml-2">
                                            {validation.suggestions
                                              .slice(0, 3)
                                              .map((suggestion, idx) => (
                                                <li
                                                  key={idx}
                                                  className="flex items-start"
                                                >
                                                  <span className="mr-1">
                                                    •
                                                  </span>
                                                  <span>{suggestion}</span>
                                                </li>
                                              ))}
                                          </ul>
                                        </div>
                                      )}
                                  </div>
                                )}

                                {/* Validation Attempt History */}
                                {validation.validationAttempts &&
                                  validation.validationAttempts.length > 1 && (
                                    <details className="text-xs">
                                      <summary className="text-gray-400 cursor-pointer hover:text-gray-300 select-none">
                                        View validation history (
                                        {validation.validationAttempts.length}{" "}
                                        attempts)
                                      </summary>
                                      <div className="mt-2 space-y-1 bg-gray-900/50 rounded p-2 max-h-32 overflow-y-auto">
                                        {validation.validationAttempts.map(
                                          (attempt, idx) => (
                                            <div
                                              key={idx}
                                              className="flex items-center justify-between text-xs"
                                            >
                                              <div className="flex items-center space-x-2">
                                                <span
                                                  className={
                                                    attempt.success
                                                      ? "text-green-400"
                                                      : "text-red-400"
                                                  }
                                                >
                                                  {attempt.success ? "✓" : "✗"}
                                                </span>
                                                <span className="text-gray-300 capitalize">
                                                  {attempt.method}
                                                </span>
                                                {attempt.proxyUsed && (
                                                  <span className="text-blue-300 text-xs">
                                                    ({attempt.proxyUsed})
                                                  </span>
                                                )}
                                              </div>
                                              <div className="flex items-center space-x-2 text-gray-400">
                                                {attempt.responseTime && (
                                                  <span>
                                                    {attempt.responseTime}ms
                                                  </span>
                                                )}
                                                <span>
                                                  {new Date(
                                                    attempt.timestamp
                                                  ).toLocaleTimeString()}
                                                </span>
                                              </div>
                                            </div>
                                          )
                                        )}
                                      </div>
                                    </details>
                                  )}

                                {/* Discovery Information */}
                                {validation.discoveredFeeds &&
                                  validation.discoveredFeeds.length > 0 && (
                                    <div className="bg-blue-900/20 border border-blue-500/30 rounded p-2 text-xs">
                                      <div className="text-blue-300 font-medium mb-1">
                                        Feed discovered from website
                                      </div>
                                      <div className="text-blue-200/80 space-y-0.5">
                                        <div>
                                          Method:{" "}
                                          {
                                            validation.discoveredFeeds[0]
                                              .discoveryMethod
                                          }
                                        </div>
                                        <div>
                                          Confidence:{" "}
                                          {Math.round(
                                            (validation.discoveredFeeds[0]
                                              .confidence || 0) * 100
                                          )}
                                          %
                                        </div>
                                      </div>
                                    </div>
                                  )}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Enhanced Action Buttons */}
                    <div className="flex items-center space-x-1 ml-2">
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => handleSaveEdit(feed.url)}
                            className="text-green-400 hover:text-green-300 p-1 rounded"
                            title="Salvar alterações"
                          >
                            ✓
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="text-gray-400 hover:text-gray-300 p-1 rounded"
                            title="Cancelar edição"
                          >
                            ✕
                          </button>
                        </>
                      ) : (
                        <>
                          {/* Retry/Revalidate Button */}
                          <button
                            onClick={() => handleRetryValidation(feed.url)}
                            disabled={isValidating}
                            className="text-blue-400 hover:text-blue-300 p-1 rounded text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                            title={
                              validation?.status === "valid"
                                ? "Revalidate this feed"
                                : validation?.finalError?.retryable
                                ? "Retry validation with fresh attempt"
                                : "Revalidate this feed"
                            }
                          >
                            {isValidating ? "⏳" : "🔄"}
                          </button>

                          {/* Force Discovery Button (for failed feeds) */}
                          {validation && validation.status !== "valid" && (
                            <button
                              onClick={() => handleForceDiscovery(feed.url)}
                              disabled={discoveryInProgress.has(feed.url)}
                              className="text-purple-400 hover:text-purple-300 p-1 rounded text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Try feed discovery on this URL"
                            >
                              {discoveryInProgress.has(feed.url) ? "⏳" : "🔍"}
                            </button>
                          )}

                          {/* Clear Cache Button */}
                          {validation && (
                            <button
                              onClick={() => handleClearCache(feed.url)}
                              className="text-orange-400 hover:text-orange-300 p-1 rounded text-xs"
                              title="Clear cache and force fresh validation"
                            >
                              🗑️
                            </button>
                          )}

                          <button
                            onClick={() => handleEditFeed(feed.url)}
                            className="text-yellow-400 hover:text-yellow-300 p-1 rounded text-xs"
                            title="Editar URL do feed"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleRemoveFeed(feed.url)}
                            className="text-red-400 hover:text-red-300 p-1 rounded text-xs"
                            title="Remover feed"
                          >
                            🗑️
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : currentFeeds.length === 0 ? (
            <p className="text-gray-400 text-center py-8" role="status">
              Nenhum feed adicionado ainda.
            </p>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-2" role="status">
                Nenhum feed encontrado com os filtros aplicados.
              </p>
              <button
                onClick={handleClearFilters}
                className="text-[rgb(var(--color-accent))] hover:text-[rgb(var(--color-accent-dark))] text-sm transition-colors"
              >
                🗑️ Limpar filtros
              </button>
            </div>
          )}
        </div>
      </section>

      <footer className="flex justify-between items-center mt-6 pt-6 border-t border-gray-700">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-gray-600 text-white font-bold px-4 py-2 rounded-md hover:bg-gray-500 transition-colors"
            aria-label="Import feeds from OPML file"
          >
            📥 Import OPML
          </button>
          <button
            onClick={handleExportOPML}
            disabled={currentFeeds.length === 0}
            className="bg-[rgb(var(--color-accent))] text-white font-bold px-4 py-2 rounded-md hover:bg-[rgb(var(--color-accent-dark))] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Export feeds to OPML file"
            title={
              currentFeeds.length === 0
                ? "No feeds to export"
                : `Export ${currentFeeds.length} feeds to OPML`
            }
          >
            📤 Export OPML
          </button>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileImport}
          accept=".xml,.opml"
          className="hidden"
          aria-label="Select OPML file to import"
        />
        <div className="text-gray-400 text-sm">
          Switch to Categories tab to organize feeds
        </div>
      </footer>

      {/* Feed Discovery Modal */}
      {showDiscoveryModal && currentDiscoveryResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Select RSS Feed</h3>
              <button
                onClick={handleCancelDiscovery}
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Close discovery modal"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="mb-4">
              <p className="text-gray-300 text-sm">
                Found {currentDiscoveryResult.discoveredFeeds.length} RSS feeds
                on{" "}
                <span className="font-mono text-blue-300">
                  {currentDiscoveryResult.originalUrl}
                </span>
              </p>
              <p className="text-gray-400 text-xs mt-1">
                Select the feed you want to add to your collection:
              </p>
            </div>

            <div className="space-y-3">
              {currentDiscoveryResult.discoveredFeeds.map((feed) => (
                <div
                  key={feed.url}
                  className="bg-gray-700 rounded-lg p-4 border border-gray-600 hover:border-gray-500 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <span
                          className="text-lg"
                          title={`${feed.type.toUpperCase()} feed`}
                        >
                          {getFeedTypeIcon(feed.type)}
                        </span>
                        <h4 className="font-medium text-white truncate">
                          {feed.title || "Untitled Feed"}
                        </h4>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${getFeedTypeColor(
                            feed.type
                          )} bg-opacity-20`}
                        >
                          {feed.type.toUpperCase()}
                        </span>
                      </div>

                      <div
                        className="text-sm text-gray-300 mb-2 truncate"
                        title={feed.url}
                      >
                        {feed.url}
                      </div>

                      {feed.description && (
                        <div className="text-xs text-gray-400 mb-2 line-clamp-2">
                          {feed.description}
                        </div>
                      )}

                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>
                          Method: {getDiscoveryMethodText(feed.discoveryMethod)}
                        </span>
                        <span className={getConfidenceColor(feed.confidence)}>
                          Confidence: {getConfidenceText(feed.confidence)} (
                          {Math.round(feed.confidence * 100)}%)
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleSelectDiscoveredFeed(feed)}
                      className="ml-4 bg-[rgb(var(--color-accent))] text-white px-4 py-2 rounded-md hover:bg-[rgb(var(--color-accent-dark))] transition-colors text-sm font-medium"
                    >
                      Select
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-600">
              <button
                onClick={handleCancelDiscovery}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Duplicate Feed Warning Modal */}
      {duplicateWarning?.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-lg w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg
                  className="w-8 h-8 text-yellow-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-white">
                  Duplicate Feed Detected
                </h3>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-gray-300 mb-2">
                This feed appears to be a duplicate of an existing feed:
              </p>

              <div className="bg-gray-700 rounded-md p-3 mb-3">
                <div className="text-sm">
                  <div className="text-gray-400">Existing feed:</div>
                  <div className="text-white font-medium">
                    {duplicateWarning.result.duplicateOf?.customTitle ||
                      duplicateWarning.result.duplicateOf?.url}
                  </div>
                  <div className="text-gray-400 text-xs mt-1">
                    {duplicateWarning.result.duplicateOf?.url}
                  </div>
                </div>
              </div>

              <div className="bg-gray-700 rounded-md p-3 mb-3">
                <div className="text-sm">
                  <div className="text-gray-400">New feed:</div>
                  <div className="text-white font-medium">
                    {duplicateWarning.newUrl}
                  </div>
                </div>
              </div>

              <div className="text-sm text-gray-400">
                <div className="flex items-center justify-between">
                  <span>Detection confidence:</span>
                  <span
                    className={`font-medium ${
                      duplicateWarning.result.confidence > 0.9
                        ? "text-red-400"
                        : duplicateWarning.result.confidence > 0.7
                        ? "text-yellow-400"
                        : "text-green-400"
                    }`}
                  >
                    {Math.round(duplicateWarning.result.confidence * 100)}%
                  </span>
                </div>
                <div className="mt-1 text-xs">
                  Reason: {duplicateWarning.result.reason}
                </div>
              </div>
            </div>

            <div className="flex flex-col space-y-2">
              <button
                onClick={handleDuplicateWarningReject}
                className="w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-500 transition-colors"
              >
                Cancel - Don't Add Feed
              </button>

              <button
                onClick={handleDuplicateWarningReplace}
                className="w-full bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-500 transition-colors"
              >
                Replace Existing Feed
              </button>

              <button
                onClick={handleDuplicateWarningAccept}
                className="w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-500 transition-colors"
              >
                Add Anyway (Keep Both)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
