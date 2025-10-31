
import React, { useRef } from 'react';

interface BackgroundSelectorProps {
    setBackgroundImage: (imageDataUrl: string | null) => void;
}

export const BackgroundSelector: React.FC<BackgroundSelectorProps> = ({ setBackgroundImage }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setBackgroundImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveBackground = () => {
        setBackgroundImage(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = ''; // Clear the file input
        }
    };

    return (
        <div className="flex items-center space-x-2">
            <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                id="background-upload"
            />
            <label
                htmlFor="background-upload"
                className="cursor-pointer bg-gray-700 text-white px-3 py-1.5 text-sm font-bold rounded-sm hover:bg-gray-600 transition-colors"
            >
                Set Background
            </label>
            <button
                onClick={handleRemoveBackground}
                className="bg-gray-700 text-white px-3 py-1.5 text-sm font-bold rounded-sm hover:bg-gray-600 transition-colors"
            >
                Remove Background
            </button>
        </div>
    );
};
