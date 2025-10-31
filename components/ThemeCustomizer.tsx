import React, { useState, useCallback } from "react";
import type { ThemePreset, ExtendedTheme } from "../types";
import { useExtendedTheme } from "../hooks/useExtendedTheme";
import { exportTheme, importTheme, hexToRgb } from "../services/themeUtils";
import { useNotificationReplacements } from "../hooks/useNotificationReplacements";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Tabs } from "./ui/Tabs";
import { Badge } from "./ui/Badge";
import { IconButton } from "./ui/IconButton";
import { ActionIcons, StatusIcons } from "./icons";

interface ThemeCustomizerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ThemeCustomizer: React.FC<ThemeCustomizerProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    currentTheme,
    defaultPresets,
    customThemes,
    setCurrentTheme,
    removeCustomTheme,
  } = useExtendedTheme();

  // Hook para notificações integradas
  const { alertSuccess, alertError } = useNotificationReplacements();

  const [activeTab, setActiveTab] = useState<
    "presets" | "editor" | "import-export"
  >("presets");
  const [importText, setImportText] = useState("");
  const [exportText, setExportText] = useState("");
  const [editingTheme, setEditingTheme] = useState<ExtendedTheme | null>(null);

  const handlePresetSelect = useCallback(
    (preset: ThemePreset) => {
      setCurrentTheme(preset.theme);
    },
    [setCurrentTheme]
  );

  const handleEditTheme = useCallback((theme: ExtendedTheme) => {
    setEditingTheme({ ...theme });
    setActiveTab("editor");
  }, []);

  const handleColorChange = useCallback(
    (colorKey: string, hexValue: string) => {
      if (!editingTheme) return;

      try {
        const rgbValue = hexToRgb(hexValue);
        setEditingTheme((prev) =>
          prev
            ? {
                ...prev,
                colors: {
                  ...prev.colors,
                  [colorKey]: rgbValue,
                },
              }
            : null
        );
      } catch (error) {
        console.warn("Invalid hex color:", hexValue);
      }
    },
    [editingTheme]
  );

  const handleSaveEditedTheme = useCallback(() => {
    if (!editingTheme) return;

    const customTheme: ExtendedTheme = {
      ...editingTheme,
      id: `custom-${Date.now()}`,
      name: `${editingTheme.name} (Edited)`,
    };

    setCurrentTheme(customTheme);
    setEditingTheme(null);
    setActiveTab("presets");
  }, [editingTheme, setCurrentTheme]);

  const handleApplyLivePreview = useCallback(() => {
    if (!editingTheme) return;
    setCurrentTheme(editingTheme);
  }, [editingTheme, setCurrentTheme]);

  const rgbToHex = useCallback((rgb: string): string => {
    const [r, g, b] = rgb.split(" ").map(Number);
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }, []);

  const handleExport = useCallback(() => {
    setExportText(exportTheme(currentTheme));
  }, [currentTheme]);

  const handleImport = useCallback(async () => {
    const imported = importTheme(importText);
    if (imported) {
      setCurrentTheme(imported);
      setImportText("");
      await alertSuccess("Theme imported successfully!");
    } else {
      await alertError("Failed to import theme. Please check the format.");
    }
  }, [importText, setCurrentTheme, alertSuccess, alertError]);

  if (!isOpen) return null;

  const tabs = [
    { id: "presets", label: "Theme Presets", icon: <StatusIcons.Theme /> },
    { id: "editor", label: "Color Editor", icon: <ActionIcons.Edit /> },
    {
      id: "import-export",
      label: "Import/Export",
      icon: <ActionIcons.Export />,
    },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card
        className="max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        elevation="lg"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[rgb(var(--color-border))]">
          <div className="flex items-center space-x-3">
            <StatusIcons.Theme />
            <h2 className="text-xl font-bold text-white">Theme Customizer</h2>
            <Badge variant="secondary">
              {defaultPresets.length + customThemes.length} themes
            </Badge>
          </div>
          <IconButton
            onClick={onClose}
            variant="ghost"
            size="sm"
            icon={<ActionIcons.Close />}
            aria-label="Close theme customizer"
          />
        </div>

        {/* Tabs */}
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={(tabId) => setActiveTab(tabId as any)}
          className="border-b border-[rgb(var(--color-border))]"
        />

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "presets" && (
            <div className="space-y-8">
              {/* Dark Themes Section */}
              <div>
                <div className="flex items-center mb-6">
                  <div className="w-8 h-8 rounded-full bg-gray-900 border-2 border-gray-600 mr-3 flex items-center justify-center">
                    🌙
                  </div>
                  <h3 className="text-xl font-semibold text-white">
                    Dark Themes
                  </h3>
                  <Badge variant="secondary" className="ml-3">
                    {defaultPresets.filter((p) => p.category === "dark").length}{" "}
                    themes
                  </Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {defaultPresets
                    .filter((preset) => preset.category === "dark")
                    .map((preset) => (
                      <Card
                        key={preset.id}
                        className={`cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
                          currentTheme.id === preset.id
                            ? "ring-2 ring-blue-500 bg-blue-500/10"
                            : "hover:border-[rgb(var(--color-border))]"
                        }`}
                        onClick={() => handlePresetSelect(preset)}
                        elevation={currentTheme.id === preset.id ? "lg" : "sm"}
                      >
                        {/* Color Preview */}
                        <div className="mb-4">
                          <div className="flex space-x-2 mb-3">
                            {[
                              {
                                color: preset.theme.colors.primary,
                                label: "Primary",
                              },
                              {
                                color: preset.theme.colors.accent,
                                label: "Accent",
                              },
                              {
                                color: preset.theme.colors.background,
                                label: "Background",
                              },
                              {
                                color: preset.theme.colors.surface,
                                label: "Surface",
                              },
                            ].map((colorInfo, index) => (
                              <div
                                key={index}
                                className="w-10 h-10 rounded-lg border border-[rgb(var(--color-border))] shadow-sm"
                                style={{
                                  backgroundColor: `rgb(${colorInfo.color})`,
                                }}
                                title={colorInfo.label}
                              />
                            ))}
                          </div>
                          <div className="flex space-x-2">
                            {[
                              {
                                color: preset.theme.colors.text,
                                label: "Text",
                              },
                              {
                                color: preset.theme.colors.textSecondary,
                                label: "Secondary Text",
                              },
                            ].map((colorInfo, index) => (
                              <div
                                key={index}
                                className="w-6 h-6 rounded border border-[rgb(var(--color-border))]"
                                style={{
                                  backgroundColor: `rgb(${colorInfo.color})`,
                                }}
                                title={colorInfo.label}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Theme Info */}
                        <div className="mb-4">
                          <h4 className="font-semibold text-white text-lg mb-2">
                            {preset.name}
                          </h4>
                          <p className="text-sm text-[rgb(var(--color-text))] leading-relaxed">
                            {preset.description}
                          </p>
                        </div>

                        {/* Status and Actions */}
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary">
                            🌙 {preset.category}
                          </Badge>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              icon={<ActionIcons.Edit />}
                              onClick={(e) => {
                                e?.stopPropagation();
                                handleEditTheme(preset.theme);
                              }}
                            >
                              Edit
                            </Button>
                            {currentTheme.id === preset.id && (
                              <Badge variant="primary">
                                <StatusIcons.Valid className="w-3 h-3 mr-1" />
                                Active
                              </Badge>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                </div>
              </div>

              {/* Light Themes Section */}
              <div>
                <div className="flex items-center mb-6">
                  <div className="w-8 h-8 rounded-full bg-white border-2 border-gray-300 mr-3 flex items-center justify-center">
                    ☀️
                  </div>
                  <h3 className="text-xl font-semibold text-white">
                    Light Themes
                  </h3>
                  <Badge variant="secondary" className="ml-3">
                    {
                      defaultPresets.filter((p) => p.category === "light")
                        .length
                    }{" "}
                    themes
                  </Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {defaultPresets
                    .filter((preset) => preset.category === "light")
                    .map((preset) => (
                      <Card
                        key={preset.id}
                        className={`cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
                          currentTheme.id === preset.id
                            ? "ring-2 ring-blue-500 bg-blue-500/10"
                            : "hover:border-[rgb(var(--color-border))]"
                        }`}
                        onClick={() => handlePresetSelect(preset)}
                        elevation={currentTheme.id === preset.id ? "lg" : "sm"}
                      >
                        {/* Color Preview */}
                        <div className="mb-4">
                          <div className="flex space-x-2 mb-3">
                            {[
                              {
                                color: preset.theme.colors.primary,
                                label: "Primary",
                              },
                              {
                                color: preset.theme.colors.accent,
                                label: "Accent",
                              },
                              {
                                color: preset.theme.colors.background,
                                label: "Background",
                              },
                              {
                                color: preset.theme.colors.surface,
                                label: "Surface",
                              },
                            ].map((colorInfo, index) => (
                              <div
                                key={index}
                                className="w-10 h-10 rounded-lg border border-[rgb(var(--color-border))] shadow-sm"
                                style={{
                                  backgroundColor: `rgb(${colorInfo.color})`,
                                }}
                                title={colorInfo.label}
                              />
                            ))}
                          </div>
                          <div className="flex space-x-2">
                            {[
                              {
                                color: preset.theme.colors.text,
                                label: "Text",
                              },
                              {
                                color: preset.theme.colors.textSecondary,
                                label: "Secondary Text",
                              },
                            ].map((colorInfo, index) => (
                              <div
                                key={index}
                                className="w-6 h-6 rounded border border-[rgb(var(--color-border))]"
                                style={{
                                  backgroundColor: `rgb(${colorInfo.color})`,
                                }}
                                title={colorInfo.label}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Theme Info */}
                        <div className="mb-4">
                          <h4 className="font-semibold text-white text-lg mb-2">
                            {preset.name}
                          </h4>
                          <p className="text-sm text-[rgb(var(--color-text))] leading-relaxed">
                            {preset.description}
                          </p>
                        </div>

                        {/* Status and Actions */}
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary">
                            ☀️ {preset.category}
                          </Badge>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              icon={<ActionIcons.Edit />}
                              onClick={(e) => {
                                e?.stopPropagation();
                                handleEditTheme(preset.theme);
                              }}
                            >
                              Edit
                            </Button>
                            {currentTheme.id === preset.id && (
                              <Badge variant="primary">
                                <StatusIcons.Valid className="w-3 h-3 mr-1" />
                                Active
                              </Badge>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                </div>
              </div>

              {/* Custom Themes Section */}
              {customThemes.length > 0 && (
                <div>
                  <div className="flex items-center mb-6">
                    <div className="w-8 h-8 rounded-full bg-purple-600 border-2 border-purple-400 mr-3 flex items-center justify-center">
                      🎨
                    </div>
                    <h3 className="text-xl font-semibold text-white">
                      Custom Themes
                    </h3>
                    <Badge variant="secondary" className="ml-3">
                      {customThemes.length} themes
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {customThemes.map((theme) => (
                      <Card
                        key={theme.id}
                        className={`cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
                          currentTheme.id === theme.id
                            ? "ring-2 ring-blue-500 bg-blue-500/10"
                            : "hover:border-[rgb(var(--color-border))]"
                        }`}
                        onClick={() => setCurrentTheme(theme)}
                        elevation={currentTheme.id === theme.id ? "lg" : "sm"}
                      >
                        {/* Color Preview */}
                        <div className="mb-4">
                          <div className="flex space-x-2 mb-3">
                            {[
                              { color: theme.colors.primary, label: "Primary" },
                              { color: theme.colors.accent, label: "Accent" },
                              {
                                color: theme.colors.background,
                                label: "Background",
                              },
                              { color: theme.colors.surface, label: "Surface" },
                            ].map((colorInfo, index) => (
                              <div
                                key={index}
                                className="w-10 h-10 rounded-lg border border-[rgb(var(--color-border))] shadow-sm"
                                style={{
                                  backgroundColor: `rgb(${colorInfo.color})`,
                                }}
                                title={colorInfo.label}
                              />
                            ))}
                          </div>
                          <div className="flex space-x-2">
                            {[
                              { color: theme.colors.text, label: "Text" },
                              {
                                color: theme.colors.textSecondary,
                                label: "Secondary Text",
                              },
                            ].map((colorInfo, index) => (
                              <div
                                key={index}
                                className="w-6 h-6 rounded border border-[rgb(var(--color-border))]"
                                style={{
                                  backgroundColor: `rgb(${colorInfo.color})`,
                                }}
                                title={colorInfo.label}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Theme Info */}
                        <div className="mb-4">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-white text-lg">
                              {theme.name}
                            </h4>
                            <IconButton
                              onClick={(e) => {
                                e?.stopPropagation();
                                removeCustomTheme(theme.id);
                              }}
                              variant="ghost"
                              size="sm"
                              icon={<ActionIcons.Delete />}
                              className="text-red-400 hover:text-red-300"
                              title="Delete theme"
                            />
                          </div>
                        </div>

                        {/* Status */}
                        <div className="flex items-center justify-between">
                          <Badge
                            variant="secondary"
                            className="bg-purple-600/20 text-purple-300 border-purple-500"
                          >
                            🎨 custom
                          </Badge>
                          {currentTheme.id === theme.id && (
                            <Badge variant="primary">
                              <StatusIcons.Valid className="w-3 h-3 mr-1" />
                              Active
                            </Badge>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "editor" && (
            <div className="space-y-6">
              {!editingTheme ? (
                <div className="text-center py-12">
                  <div className="mb-8">
                    <ActionIcons.Edit className="w-16 h-16 mx-auto text-[rgb(var(--color-textSecondary))] mb-4" />
                    <h3 className="text-2xl font-semibold text-white mb-3">
                      Select a Theme to Edit
                    </h3>
                    <p className="text-[rgb(var(--color-textSecondary))] max-w-md mx-auto">
                      Choose a theme below to start customizing colors and
                      create your own personalized version
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                    {defaultPresets.map((preset) => (
                      <Card
                        key={preset.id}
                        className="cursor-pointer hover:border-blue-500 transition-all duration-200 hover:scale-[1.02]"
                        onClick={() => handleEditTheme(preset.theme)}
                      >
                        <div className="flex space-x-2 mb-4 justify-center">
                          {[
                            preset.theme.colors.primary,
                            preset.theme.colors.accent,
                            preset.theme.colors.background,
                          ].map((color, index) => (
                            <div
                              key={index}
                              className="w-8 h-8 rounded-lg border border-[rgb(var(--color-border))] shadow-sm"
                              style={{ backgroundColor: `rgb(${color})` }}
                            />
                          ))}
                        </div>
                        <h4 className="text-white font-semibold text-lg mb-1">
                          {preset.name}
                        </h4>
                        <Badge variant="secondary" className="text-xs">
                          {preset.category}
                        </Badge>
                      </Card>
                    ))}
                    {customThemes.map((theme) => (
                      <Card
                        key={theme.id}
                        className="cursor-pointer hover:border-blue-500 transition-all duration-200 hover:scale-[1.02]"
                        onClick={() => handleEditTheme(theme)}
                      >
                        <div className="flex space-x-2 mb-4 justify-center">
                          {[
                            theme.colors.primary,
                            theme.colors.accent,
                            theme.colors.background,
                          ].map((color, index) => (
                            <div
                              key={index}
                              className="w-8 h-8 rounded-lg border border-[rgb(var(--color-border))] shadow-sm"
                              style={{ backgroundColor: `rgb(${color})` }}
                            />
                          ))}
                        </div>
                        <h4 className="text-white font-semibold text-lg mb-1">
                          {theme.name}
                        </h4>
                        <Badge
                          variant="secondary"
                          className="text-xs bg-purple-600/20 text-purple-300 border-purple-500"
                        >
                          custom
                        </Badge>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Header */}
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                      <h3 className="text-2xl font-semibold text-white mb-2 flex items-center">
                        <ActionIcons.Edit className="w-6 h-6 mr-3" />
                        Editing: {editingTheme.name}
                      </h3>
                      <p className="text-[rgb(var(--color-textSecondary))]">
                        Adjust colors individually to create your personalized
                        version
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <Button
                        onClick={handleApplyLivePreview}
                        variant="secondary"
                        icon={<StatusIcons.Preview />}
                      >
                        Live Preview
                      </Button>
                      <Button
                        onClick={handleSaveEditedTheme}
                        variant="primary"
                        icon={<ActionIcons.Save />}
                      >
                        Save as New
                      </Button>
                      <Button
                        onClick={() => {
                          setEditingTheme(null);
                          setActiveTab("presets");
                        }}
                        variant="ghost"
                        icon={<ActionIcons.Close />}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>

                  {/* Color Editor Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Primary Colors */}
                    <Card className="p-6">
                      <h4 className="text-lg font-semibold text-white mb-6 flex items-center">
                        <StatusIcons.Theme className="w-5 h-5 mr-2" />
                        Primary Colors
                      </h4>
                      <div className="space-y-6">
                        {/* Primary Color */}
                        <div>
                          <label className="block text-sm font-medium text-[rgb(var(--color-text))] mb-3">
                            Primary Color
                          </label>
                          <div className="flex items-center space-x-3">
                            <input
                              type="color"
                              value={rgbToHex(editingTheme.colors.primary)}
                              onChange={(e) =>
                                handleColorChange("primary", e.target.value)
                              }
                              className="w-12 h-12 rounded-lg border border-[rgb(var(--color-border))] cursor-pointer shadow-sm"
                            />
                            <Input
                              type="text"
                              value={rgbToHex(editingTheme.colors.primary)}
                              onChange={(e) =>
                                handleColorChange("primary", e.target.value)
                              }
                              placeholder="#1976D2"
                              className="flex-1"
                            />
                          </div>
                          <p className="text-xs text-[rgb(var(--color-textSecondary))] mt-2">
                            RGB: {editingTheme.colors.primary}
                          </p>
                        </div>

                        {/* Accent Color */}
                        <div>
                          <label className="block text-sm font-medium text-[rgb(var(--color-text))] mb-3">
                            Accent Color
                          </label>
                          <div className="flex items-center space-x-3">
                            <input
                              type="color"
                              value={rgbToHex(editingTheme.colors.accent)}
                              onChange={(e) =>
                                handleColorChange("accent", e.target.value)
                              }
                              className="w-12 h-12 rounded-lg border border-[rgb(var(--color-border))] cursor-pointer shadow-sm"
                            />
                            <Input
                              type="text"
                              value={rgbToHex(editingTheme.colors.accent)}
                              onChange={(e) =>
                                handleColorChange("accent", e.target.value)
                              }
                              placeholder="#F4511E"
                              className="flex-1"
                            />
                          </div>
                          <p className="text-xs text-[rgb(var(--color-textSecondary))] mt-2">
                            RGB: {editingTheme.colors.accent}
                          </p>
                        </div>

                        {/* Secondary Color */}
                        <div>
                          <label className="block text-sm font-medium text-[rgb(var(--color-text))] mb-3">
                            Secondary Color
                          </label>
                          <div className="flex items-center space-x-3">
                            <input
                              type="color"
                              value={rgbToHex(editingTheme.colors.secondary)}
                              onChange={(e) =>
                                handleColorChange("secondary", e.target.value)
                              }
                              className="w-12 h-12 rounded-lg border border-[rgb(var(--color-border))] cursor-pointer shadow-sm"
                            />
                            <Input
                              type="text"
                              value={rgbToHex(editingTheme.colors.secondary)}
                              onChange={(e) =>
                                handleColorChange("secondary", e.target.value)
                              }
                              placeholder="#F5F5F5"
                              className="flex-1"
                            />
                          </div>
                          <p className="text-xs text-[rgb(var(--color-textSecondary))] mt-2">
                            RGB: {editingTheme.colors.secondary}
                          </p>
                        </div>
                      </div>
                    </Card>

                    {/* Background Colors */}
                    <Card className="p-6">
                      <h4 className="text-lg font-semibold text-white mb-6 flex items-center">
                        <StatusIcons.Theme className="w-5 h-5 mr-2" />
                        Background Colors
                      </h4>
                      <div className="space-y-6">
                        {/* Background Color */}
                        <div>
                          <label className="block text-sm font-medium text-[rgb(var(--color-text))] mb-3">
                            Background Color
                          </label>
                          <div className="flex items-center space-x-3">
                            <input
                              type="color"
                              value={rgbToHex(editingTheme.colors.background)}
                              onChange={(e) =>
                                handleColorChange("background", e.target.value)
                              }
                              className="w-12 h-12 rounded-lg border border-[rgb(var(--color-border))] cursor-pointer shadow-sm"
                            />
                            <Input
                              type="text"
                              value={rgbToHex(editingTheme.colors.background)}
                              onChange={(e) =>
                                handleColorChange("background", e.target.value)
                              }
                              placeholder="#121212"
                              className="flex-1"
                            />
                          </div>
                          <p className="text-xs text-[rgb(var(--color-textSecondary))] mt-2">
                            RGB: {editingTheme.colors.background}
                          </p>
                        </div>

                        {/* Surface Color */}
                        <div>
                          <label className="block text-sm font-medium text-[rgb(var(--color-text))] mb-3">
                            Surface Color
                          </label>
                          <div className="flex items-center space-x-3">
                            <input
                              type="color"
                              value={rgbToHex(editingTheme.colors.surface)}
                              onChange={(e) =>
                                handleColorChange("surface", e.target.value)
                              }
                              className="w-12 h-12 rounded-lg border border-[rgb(var(--color-border))] cursor-pointer shadow-sm"
                            />
                            <Input
                              type="text"
                              value={rgbToHex(editingTheme.colors.surface)}
                              onChange={(e) =>
                                handleColorChange("surface", e.target.value)
                              }
                              placeholder="#1E1E1E"
                              className="flex-1"
                            />
                          </div>
                          <p className="text-xs text-[rgb(var(--color-textSecondary))] mt-2">
                            RGB: {editingTheme.colors.surface}
                          </p>
                        </div>

                        {/* Text Color */}
                        <div>
                          <label className="block text-sm font-medium text-[rgb(var(--color-text))] mb-3">
                            Text Color
                          </label>
                          <div className="flex items-center space-x-3">
                            <input
                              type="color"
                              value={rgbToHex(editingTheme.colors.text)}
                              onChange={(e) =>
                                handleColorChange("text", e.target.value)
                              }
                              className="w-12 h-12 rounded-lg border border-[rgb(var(--color-border))] cursor-pointer shadow-sm"
                            />
                            <Input
                              type="text"
                              value={rgbToHex(editingTheme.colors.text)}
                              onChange={(e) =>
                                handleColorChange("text", e.target.value)
                              }
                              placeholder="#FFFFFF"
                              className="flex-1"
                            />
                          </div>
                          <p className="text-xs text-[rgb(var(--color-textSecondary))] mt-2">
                            RGB: {editingTheme.colors.text}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </div>

                  {/* Preview Section */}
                  <Card className="p-6">
                    <h4 className="text-lg font-semibold text-white mb-6 flex items-center">
                      <StatusIcons.Preview className="w-5 h-5 mr-2" />
                      Color Preview
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {Object.entries(editingTheme.colors).map(
                        ([colorName, colorValue]) => (
                          <div key={colorName} className="text-center">
                            <div
                              className="w-full h-16 rounded-lg border-2 border-[rgb(var(--color-border))] mb-2"
                              style={{ backgroundColor: `rgb(${colorValue})` }}
                            />
                            <p className="text-xs text-[rgb(var(--color-text))] font-medium capitalize">
                              {colorName.replace(/([A-Z])/g, " $1").trim()}
                            </p>
                            <p className="text-xs text-[rgb(var(--color-textSecondary))] font-mono">
                              {rgbToHex(colorValue)}
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  </Card>
                </div>
              )}
            </div>
          )}

          {activeTab === "import-export" && (
            <div className="space-y-8">
              {/* Export Section */}
              <Card className="p-6">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <ActionIcons.Export className="w-5 h-5 mr-2" />
                  Export Theme
                </h3>
                <p className="text-[rgb(var(--color-textSecondary))] mb-6">
                  Export your current theme to share with others or backup your
                  customizations.
                </p>
                <div className="space-y-4">
                  <Button
                    onClick={handleExport}
                    variant="primary"
                    icon={<ActionIcons.Export />}
                  >
                    Export Current Theme
                  </Button>
                  {exportText && (
                    <div>
                      <label className="block text-sm font-medium text-[rgb(var(--color-text))] mb-3">
                        Theme JSON (click to select all)
                      </label>
                      <textarea
                        value={exportText}
                        readOnly
                        rows={12}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        onClick={(e) => e.currentTarget.select()}
                      />
                    </div>
                  )}
                </div>
              </Card>

              {/* Import Section */}
              <Card className="p-6">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <ActionIcons.Import className="w-5 h-5 mr-2" />
                  Import Theme
                </h3>
                <p className="text-[rgb(var(--color-textSecondary))] mb-6">
                  Import a theme from JSON data. This will apply the theme
                  immediately.
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[rgb(var(--color-text))] mb-3">
                      Paste Theme JSON
                    </label>
                    <textarea
                      value={importText}
                      onChange={(e) => setImportText(e.target.value)}
                      placeholder="Paste theme JSON here..."
                      rows={10}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>
                  <Button
                    onClick={handleImport}
                    disabled={!importText.trim()}
                    variant="primary"
                    icon={<ActionIcons.Import />}
                  >
                    Import Theme
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
