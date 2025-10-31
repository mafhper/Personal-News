
import React, { useState } from 'react';

interface ThemeSelectorProps {
    setThemeColor: (color: string) => void;
}

const predefinedColors = [
    // Cores vibrantes
    { name: 'Teal', value: '20 184 166', category: 'vibrant' },
    { name: 'Blue', value: '59 130 246', category: 'vibrant' },
    { name: 'Purple', value: '168 85 247', category: 'vibrant' },
    { name: 'Rose', value: '244 63 94', category: 'vibrant' },
    { name: 'Emerald', value: '16 185 129', category: 'vibrant' },
    { name: 'Orange', value: '249 115 22', category: 'vibrant' },
    { name: 'Cyan', value: '6 182 212', category: 'vibrant' },
    { name: 'Pink', value: '236 72 153', category: 'vibrant' },
    { name: 'Indigo', value: '99 102 241', category: 'vibrant' },
    { name: 'Yellow', value: '234 179 8', category: 'vibrant' },
    { name: 'Red', value: '239 68 68', category: 'vibrant' },
    { name: 'Green', value: '34 197 94', category: 'vibrant' },
    
    // Cores suaves
    { name: 'Soft Blue', value: '147 197 253', category: 'soft' },
    { name: 'Soft Purple', value: '196 181 253', category: 'soft' },
    { name: 'Soft Pink', value: '251 207 232', category: 'soft' },
    { name: 'Soft Green', value: '167 243 208', category: 'soft' },
    { name: 'Soft Orange', value: '253 186 116', category: 'soft' },
    { name: 'Soft Teal', value: '153 246 228', category: 'soft' },
    
    // Cores escuras
    { name: 'Dark Blue', value: '30 58 138', category: 'dark' },
    { name: 'Dark Purple', value: '88 28 135', category: 'dark' },
    { name: 'Dark Green', value: '20 83 45', category: 'dark' },
    { name: 'Dark Red', value: '153 27 27', category: 'dark' },
    { name: 'Dark Orange', value: '154 52 18', category: 'dark' },
    { name: 'Dark Teal', value: '19 78 74', category: 'dark' },
];

const hexToRgb = (hex: string): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return '59 130 246'; // fallback to blue
    
    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);
    
    return `${r} ${g} ${b}`;
};



export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ setThemeColor }) => {
    const [showCustomPicker, setShowCustomPicker] = useState(false);
    const [customColor, setCustomColor] = useState('#3b82f6');
    const [activeCategory, setActiveCategory] = useState<'vibrant' | 'soft' | 'dark' | 'all'>('all');

    const filteredColors = activeCategory === 'all' 
        ? predefinedColors 
        : predefinedColors.filter(color => color.category === activeCategory);

    const handleCustomColorChange = (hex: string) => {
        setCustomColor(hex);
        const rgbValue = hexToRgb(hex);
        setThemeColor(rgbValue);
    };

    return (
        <div className="space-y-4">
            {/* Filtros de categoria */}
            <div className="flex flex-wrap gap-2 mb-1">
                {[
                    { key: 'all', label: 'Todas', icon: '🎨', count: predefinedColors.length },
                    { key: 'vibrant', label: 'Vibrantes', icon: '✨', count: predefinedColors.filter(c => c.category === 'vibrant').length },
                    { key: 'soft', label: 'Suaves', icon: '🌸', count: predefinedColors.filter(c => c.category === 'soft').length },
                    { key: 'dark', label: 'Escuras', icon: '🌙', count: predefinedColors.filter(c => c.category === 'dark').length }
                ].map(category => (
                    <button
                        key={category.key}
                        onClick={() => setActiveCategory(category.key as any)}
                        className={`px-3 py-1.5 text-xs rounded-full transition-all duration-200 flex items-center space-x-1 ${
                            activeCategory === category.key
                                ? 'bg-[rgb(var(--color-accent))]/20 text-[rgb(var(--color-accent))] border border-[rgb(var(--color-accent))]/30 shadow-sm'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600 hover:border-gray-500'
                        }`}
                    >
                        <span>{category.icon}</span>
                        <span>{category.label}</span>
                        <span className="text-xs opacity-70">({category.count})</span>
                    </button>
                ))}
            </div>

            {/* Cores predefinidas */}
            <div className="grid grid-cols-6 gap-3 p-3 bg-gray-800/30 rounded-lg border border-gray-700/50">
                {filteredColors.map(color => (
                    <div key={color.name} className="relative group">
                        <button
                            className="w-10 h-10 rounded-xl border-2 border-gray-600 hover:border-white hover:scale-110 transition-all duration-200 shadow-lg hover:shadow-xl relative overflow-hidden"
                            style={{ backgroundColor: `rgb(${color.value})` }}
                            onClick={() => setThemeColor(color.value)}
                            title={color.name}
                        >
                            {/* Efeito de brilho */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                        </button>
                        {/* Tooltip melhorado */}
                        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                            {color.name}
                        </div>
                    </div>
                ))}
            </div>

            {/* Seletor de cor personalizada */}
            <div className="border-t border-gray-600 pt-4">
                <button
                    onClick={() => setShowCustomPicker(!showCustomPicker)}
                    className="flex items-center space-x-2 text-sm text-gray-300 hover:text-white transition-colors"
                >
                    <span>🎯</span>
                    <span>Cor personalizada</span>
                    <span className={`transform transition-transform ${showCustomPicker ? 'rotate-180' : ''}`}>
                        ▼
                    </span>
                </button>
                
                {showCustomPicker && (
                    <div className="mt-3 p-4 bg-gray-800 rounded-lg border border-gray-600">
                        <div className="flex items-center space-x-3">
                            <input
                                type="color"
                                value={customColor}
                                onChange={(e) => handleCustomColorChange(e.target.value)}
                                className="w-12 h-12 rounded-lg border border-gray-600 cursor-pointer bg-transparent"
                                title="Selecionar cor personalizada"
                            />
                            <div className="flex-1">
                                <input
                                    type="text"
                                    value={customColor}
                                    onChange={(e) => handleCustomColorChange(e.target.value)}
                                    placeholder="#3b82f6"
                                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <p className="text-xs text-gray-400 mt-1">
                                    RGB: {hexToRgb(customColor)}
                                </p>
                            </div>
                        </div>
                        
                        {/* Cores populares */}
                        <div className="mt-4">
                            <p className="text-xs text-gray-400 mb-3 flex items-center">
                                <span className="mr-2">🔥</span>
                                Cores populares:
                            </p>
                            <div className="grid grid-cols-8 gap-2">
                                {[
                                    { hex: '#ff6b6b', name: 'Coral' },
                                    { hex: '#4ecdc4', name: 'Turquesa' },
                                    { hex: '#45b7d1', name: 'Azul Céu' },
                                    { hex: '#96ceb4', name: 'Menta' },
                                    { hex: '#feca57', name: 'Dourado' },
                                    { hex: '#ff9ff3', name: 'Rosa Neon' },
                                    { hex: '#54a0ff', name: 'Azul Elétrico' },
                                    { hex: '#5f27cd', name: 'Roxo Real' }
                                ].map(color => (
                                    <button
                                        key={color.hex}
                                        className="w-8 h-8 rounded-lg border border-gray-600 hover:scale-110 hover:border-white transition-all duration-200 shadow-sm"
                                        style={{ backgroundColor: color.hex }}
                                        onClick={() => handleCustomColorChange(color.hex)}
                                        title={color.name}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Dica de uso */}
            <div className="text-xs text-gray-500 flex items-center space-x-1">
                <span>💡</span>
                <span>Dica: Use as cores rápidas para mudanças instantâneas ou o seletor personalizado para cores específicas</span>
            </div>
        </div>
    );
};
