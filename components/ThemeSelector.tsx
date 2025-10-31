
import React from 'react';

interface ThemeSelectorProps {
    setThemeColor: (color: string) => void;
}

const colors = [
    { name: 'Teal', value: '20 184 166' }, // teal-500
    { name: 'Blue', value: '59 130 246' }, // blue-500
    { name: 'Purple', value: '168 85 247' }, // purple-500
    { name: 'Rose', value: '244 63 94' }, // rose-500
    { name: 'Emerald', value: '16 185 129' }, // emerald-500
    { name: 'Orange', value: '249 115 22' }, // orange-500
];

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ setThemeColor }) => {
    return (
        <div className="flex space-x-2">
            {colors.map(color => (
                <button
                    key={color.name}
                    className="w-6 h-6 rounded-full border-2 border-gray-600 hover:border-white transition-colors"
                    style={{ backgroundColor: `rgb(${color.value})` }}
                    onClick={() => setThemeColor(color.value)}
                    title={color.name}
                ></button>
            ))}
        </div>
    );
};
