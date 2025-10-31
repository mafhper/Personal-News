
import React, { useState } from 'react';
import { Modal } from './Modal';
import { ThemeSelector } from './ThemeSelector';
import { BackgroundSelector } from './BackgroundSelector';
import { ThemeCustomizer } from './ThemeCustomizer';
import { useExtendedTheme } from '../hooks/useExtendedTheme';
import { useArticleLayout } from '../hooks/useArticleLayout';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    setBackgroundImage: (imageDataUrl: string | null) => void;
    timeFormat: '12h' | '24h';
    setTimeFormat: (format: '12h' | '24h') => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
    isOpen,
    onClose,
    setBackgroundImage,
    timeFormat,
    setTimeFormat
}) => {
    const [isThemeCustomizerOpen, setIsThemeCustomizerOpen] = useState(false);
    const { currentTheme, updateThemeSettings, themeSettings } = useExtendedTheme();
    const { settings: layoutSettings, updateSettings: updateLayoutSettings } = useArticleLayout();

    // Legacy theme color setter for backward compatibility
    const setThemeColor = (color: string) => {
        // This is kept for compatibility with the old ThemeSelector
        // The new system handles theme changes through the extended theme hook
        document.documentElement.style.setProperty('--color-accent', color);
    };

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} initialFocus="h2" ariaLabelledBy="settings-modal-title">
                <div className="space-y-8">
                    {/* Header */}
                    <div>
                        <h2 id="settings-modal-title" className="text-2xl font-bold text-white" tabIndex={-1}>
                            Configurações
                        </h2>
                        <p className="text-sm text-gray-400 mt-1">
                            Personalize sua experiência no dashboard
                        </p>
                    </div>

                    {/* Divisor */}
                    <div className="border-t border-gray-700"></div>

                    {/* Seção Theme */}
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-200 mb-4 flex items-center">
                                <svg className="w-5 h-5 mr-2 text-[rgb(var(--color-accent))]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                                </svg>
                                Tema e Aparência
                            </h3>
                        </div>

                        <div className="bg-gray-800/50 rounded-lg p-4 space-y-4">
                            <div>
                                <p className="text-sm text-gray-400 mb-3">
                                    Tema atual: <span className="text-[rgb(var(--color-accent))] font-medium">{currentTheme.name}</span>
                                </p>
                                <button
                                    onClick={() => setIsThemeCustomizerOpen(true)}
                                    className="bg-[rgb(var(--color-accent))] hover:bg-[rgb(var(--color-accent))] hover:opacity-80 text-white font-medium py-2 px-4 rounded-md transition-all duration-200"
                                >
                                    Configurações Avançadas de Tema
                                </button>
                            </div>

                            <div className="pt-4 border-t border-gray-700/50">
                                <h4 className="text-md font-medium mb-3 text-gray-300">Cores Rápidas</h4>
                                <ThemeSelector setThemeColor={setThemeColor} />
                            </div>

                            <div className="pt-4 border-t border-gray-700/50 space-y-3">
                                <label className="flex items-center space-x-3">
                                    <input
                                        type="checkbox"
                                        checked={themeSettings.autoDetectSystemTheme}
                                        onChange={(e) => updateThemeSettings({ autoDetectSystemTheme: e.target.checked })}
                                        className="rounded border-gray-600 bg-gray-700 text-[rgb(var(--color-accent))] focus:ring-[rgb(var(--color-accent))]"
                                    />
                                    <span className="text-sm text-gray-300">Detectar tema do sistema automaticamente</span>
                                </label>

                                <label className="flex items-center space-x-3">
                                    <input
                                        type="checkbox"
                                        checked={themeSettings.themeTransitions}
                                        onChange={(e) => updateThemeSettings({ themeTransitions: e.target.checked })}
                                        className="rounded border-gray-600 bg-gray-700 text-[rgb(var(--color-accent))] focus:ring-[rgb(var(--color-accent))]"
                                    />
                                    <span className="text-sm text-gray-300">Ativar transições suaves de tema</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Divisor */}
                    <div className="border-t border-gray-700"></div>

                    {/* Seção Background */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-200 flex items-center">
                            <svg className="w-5 h-5 mr-2 text-[rgb(var(--color-accent))]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Imagem de Fundo
                        </h3>
                        <div className="bg-gray-800/50 rounded-lg p-4">
                            <BackgroundSelector setBackgroundImage={setBackgroundImage} />
                        </div>
                    </div>

                    {/* Divisor */}
                    <div className="border-t border-gray-700"></div>

                    {/* Seção Layout */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-200 flex items-center">
                            <svg className="w-5 h-5 mr-2 text-[rgb(var(--color-accent))]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                            Layout dos Artigos
                        </h3>

                        <div className="bg-gray-800/50 rounded-lg p-4 space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-3">
                                    Quantidade de Top Stories
                                </label>
                                <p className="text-xs text-gray-400 mb-4">
                                    Escolha quantos artigos mostrar na seção Top Stories.
                                    A página sempre terá 1 artigo em destaque + 5 artigos recentes + o número selecionado.
                                </p>
                                <fieldset>
                                    <legend className="sr-only">Escolha o número de top stories</legend>
                                    <div className="grid grid-cols-5 gap-3">
                                        {[0, 5, 10, 15, 20].map((count) => (
                                            <label key={count} className="flex flex-col items-center p-3 border border-gray-600 rounded-lg hover:border-[rgb(var(--color-accent))] transition-colors cursor-pointer">
                                                <input
                                                    type="radio"
                                                    className="form-radio text-[rgb(var(--color-accent))] focus:ring-[rgb(var(--color-accent))] mb-2"
                                                    name="topStoriesCount"
                                                    value={count}
                                                    checked={layoutSettings.topStoriesCount === count}
                                                    onChange={() => updateLayoutSettings({ topStoriesCount: count as 0 | 5 | 10 | 15 | 20 })}
                                                    aria-describedby="top-stories-description"
                                                />
                                                <span className="text-sm text-gray-300 font-medium">{count}</span>
                                            </label>
                                        ))}
                                    </div>
                                    <div id="top-stories-description" className="sr-only">
                                        Selecione o número de artigos para mostrar na seção Top Stories
                                    </div>
                                </fieldset>
                                <div className="mt-3 p-3 bg-gray-700/50 rounded-md">
                                    <p className="text-xs text-gray-400">
                                        <span className="font-medium">Total de artigos por página:</span> {layoutSettings.articlesPerPage}
                                        <br />
                                        <span className="text-gray-500">(1 destaque + 5 recentes + {layoutSettings.topStoriesCount} top stories)</span>
                                    </p>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-700/50">
                                <label className="flex items-center space-x-3">
                                    <input
                                        type="checkbox"
                                        checked={layoutSettings.showPublicationTime}
                                        onChange={(e) => updateLayoutSettings({ showPublicationTime: e.target.checked })}
                                        className="rounded border-gray-600 bg-gray-700 text-[rgb(var(--color-accent))] focus:ring-[rgb(var(--color-accent))]"
                                    />
                                    <div>
                                        <span className="text-sm text-gray-300">Mostrar horário de publicação com a data</span>
                                        <p className="text-xs text-gray-400 mt-1">
                                            Quando ativado, os artigos mostrarão data e horário de publicação
                                        </p>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Divisor */}
                    <div className="border-t border-gray-700"></div>

                    {/* Seção Time Format */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-200 flex items-center">
                            <svg className="w-5 h-5 mr-2 text-[rgb(var(--color-accent))]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Formato de Hora
                        </h3>

                        <div className="bg-gray-800/50 rounded-lg p-4">
                            <fieldset>
                                <legend className="sr-only">Escolha o formato de hora</legend>
                                <div className="grid grid-cols-2 gap-4">
                                    <label className="flex items-center p-3 border border-gray-600 rounded-lg hover:border-[rgb(var(--color-accent))] transition-colors cursor-pointer">
                                        <input
                                            type="radio"
                                            className="form-radio text-[rgb(var(--color-accent))] focus:ring-[rgb(var(--color-accent))] mr-3"
                                            name="timeFormat"
                                            value="12h"
                                            checked={timeFormat === '12h'}
                                            onChange={() => setTimeFormat('12h')}
                                            aria-describedby="time-format-description"
                                        />
                                        <div>
                                            <span className="text-gray-300 font-medium">12h (AM/PM)</span>
                                            <p className="text-xs text-gray-400">Formato americano</p>
                                        </div>
                                    </label>
                                    <label className="flex items-center p-3 border border-gray-600 rounded-lg hover:border-[rgb(var(--color-accent))] transition-colors cursor-pointer">
                                        <input
                                            type="radio"
                                            className="form-radio text-[rgb(var(--color-accent))] focus:ring-[rgb(var(--color-accent))] mr-3"
                                            name="timeFormat"
                                            value="24h"
                                            checked={timeFormat === '24h'}
                                            onChange={() => setTimeFormat('24h')}
                                            aria-describedby="time-format-description"
                                        />
                                        <div>
                                            <span className="text-gray-300 font-medium">24h</span>
                                            <p className="text-xs text-gray-400">Formato militar</p>
                                        </div>
                                    </label>
                                </div>
                                <div id="time-format-description" className="sr-only">
                                    Selecione seu formato de hora preferido para o relógio
                                </div>
                            </fieldset>
                        </div>
                    </div>

                    {/* Divisor */}
                    <div className="border-t border-gray-700"></div>

                    {/* Footer */}
                    <div className="flex justify-end pt-4">
                        <button
                            onClick={onClose}
                            className="bg-gray-600 hover:bg-gray-500 text-white font-medium px-6 py-2 rounded-md transition-colors"
                        >
                            Fechar
                        </button>
                    </div>
                </div>
            </Modal>

            <ThemeCustomizer
                isOpen={isThemeCustomizerOpen}
                onClose={() => setIsThemeCustomizerOpen(false)}
            />
        </>
    );
};
