import React, { useState, useEffect, useCallback } from "react";
import { getWeather, getCoordsForCity } from "../services/weatherService";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useLogger } from "../services/logger";
import type { WeatherData } from "../types";

const WeatherIcon: React.FC<{ code: number; isDay: boolean }> = ({
  code,
  isDay,
}) => {
  let icon;
  switch (code) {
    case 0:
      icon = isDay ? "☀️" : "🌙";
      break;
    case 1:
    case 2:
    case 3:
      icon = isDay ? "⛅️" : "☁️";
      break;
    case 45:
    case 48:
      icon = "🌫️";
      break;
    case 51:
    case 53:
    case 55:
      icon = "🌦️";
      break;
    case 61:
    case 63:
    case 65:
      icon = "🌧️";
      break;
    case 66:
    case 67:
      icon = "🌨️";
      break;
    case 71:
    case 73:
    case 75:
      icon = "❄️";
      break;
    case 80:
    case 81:
    case 82:
      icon = "🌧️";
      break;
    case 85:
    case 86:
      icon = "❄️";
      break;
    case 95:
    case 96:
    case 99:
      icon = "⛈️";
      break;
    default:
      icon = "🌍";
      break;
  }
  return <span className="text-lg">{icon}</span>;
};

export const HeaderWeatherWidget: React.FC = () => {
  const logger = useLogger("HeaderWeatherWidget");
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [city, setCity] = useLocalStorage<string>("weather-city", "Lisbon");
  const [isEditing, setIsEditing] = useState(false);
  const [inputCity, setInputCity] = useState(city);

  const fetchWeatherForCity = useCallback(
    async (cityName: string) => {
      setError(null);
      try {
        const coords = await getCoordsForCity(cityName);
        if (!coords) {
          setError(`City "${cityName}" not found.`);
          return;
        }
        const weatherData = await getWeather(coords.latitude, coords.longitude);
        setWeather(weatherData);
        setCity(coords.name);
      } catch (e) {
        setError("Could not fetch weather data.");
        logger.error("Failed to fetch weather data", e as Error, {
          additionalData: { cityName },
        });
      }
    },
    [setCity]
  );

  useEffect(() => {
    if (city) {
      fetchWeatherForCity(city);
    }
  }, [city, fetchWeatherForCity]);

  const handleSave = () => {
    setCity(inputCity);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setInputCity(city);
    }
  };

  if (isEditing) {
    return (
      <div className="bg-gray-800/70 backdrop-blur-sm rounded-lg px-3 py-2 border border-gray-700/50 min-w-[120px] lg:min-w-[140px] h-[40px] flex items-center">
        <input
          type="text"
          value={inputCity}
          onChange={(e) => setInputCity(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          className="bg-transparent text-white text-sm w-full focus:outline-none placeholder-gray-400"
          placeholder="City name"
          autoFocus
        />
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg px-3 py-2 border border-gray-700/30 min-w-[120px] lg:min-w-[140px] h-[40px] flex items-center justify-center">
        <span className="text-sm text-gray-400">
          {error ? "Error" : "Loading..."}
        </span>
      </div>
    );
  }

  return (
    <button
      onClick={() => {
        setInputCity(city);
        setIsEditing(true);
      }}
      className="bg-gray-800/50 backdrop-blur-sm rounded-lg px-3 py-2 flex items-center space-x-2 border border-gray-700/30 hover:bg-gray-800/70 hover:border-gray-600/50 transition-all duration-200 group min-w-[120px] lg:min-w-[140px] h-[40px]"
      aria-label={`Weather in ${city}: ${Math.round(
        weather.temperature
      )}°C. Click to change city.`}
    >
      <div className="flex items-center space-x-2 flex-1 min-w-0">
        <div className="text-base flex-shrink-0">
          <WeatherIcon code={weather.weatherCode} isDay={weather.isDay} />
        </div>
        <div className="flex flex-col items-start min-w-0 justify-center">
          <div className="text-sm font-semibold text-white truncate leading-tight">
            {Math.round(weather.temperature)}°C
          </div>
          <div className="text-xs text-gray-400 truncate lg:block hidden leading-tight">
            {city}
          </div>
        </div>
      </div>
    </button>
  );
};
