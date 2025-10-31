
import type { WeatherData } from '../types';
import { logger } from './logger';

const FORECAST_API_URL = 'https://api.open-meteo.com/v1/forecast';
const GEOCODING_API_URL = 'https://geocoding-api.open-meteo.com/v1/search';

export async function getCoordsForCity(cityName: string): Promise<{ latitude: number; longitude: number; name: string } | null> {
    logger.info('Fetching coordinates for city', {
        component: 'weatherService',
        additionalData: { cityName }
    });

    const params = new URLSearchParams({
        name: cityName,
        count: '1',
        language: 'en',
        format: 'json'
    });

    const response = await fetch(`${GEOCODING_API_URL}?${params.toString()}`);
    if (!response.ok) {
        const error = new Error('Failed to fetch geocoding data');
        logger.error('Geocoding API request failed', error, {
            component: 'weatherService',
            additionalData: {
                cityName,
                status: response.status,
                statusText: response.statusText
            }
        });
        throw error;
    }

    const data = await response.json();
    if (!data.results || data.results.length === 0) {
        logger.warn('City not found in geocoding results', {
            component: 'weatherService',
            additionalData: { cityName, resultsCount: data.results?.length || 0 }
        });
        return null; // City not found
    }

    const city = data.results[0];
    logger.debug('Successfully retrieved city coordinates', {
        component: 'weatherService',
        additionalData: {
            cityName,
            foundCity: city.name,
            latitude: city.latitude,
            longitude: city.longitude
        }
    });

    return {
        latitude: city.latitude,
        longitude: city.longitude,
        name: city.name
    };
}

export async function getWeather(latitude: number, longitude: number): Promise<WeatherData> {
    logger.info('Fetching weather data', {
        component: 'weatherService',
        additionalData: { latitude, longitude }
    });

    const params = new URLSearchParams({
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        current_weather: 'true',
    });

    const response = await fetch(`${FORECAST_API_URL}?${params.toString()}`);
    if (!response.ok) {
        const error = new Error('Failed to fetch weather data');
        logger.error('Weather API request failed', error, {
            component: 'weatherService',
            additionalData: {
                latitude,
                longitude,
                status: response.status,
                statusText: response.statusText
            }
        });
        throw error;
    }

    const data = await response.json();
    if (!data.current_weather) {
        const error = new Error('Invalid weather data received');
        logger.error('Invalid weather data structure', error, {
            component: 'weatherService',
            additionalData: {
                latitude,
                longitude,
                hasCurrentWeather: !!data.current_weather,
                dataKeys: Object.keys(data)
            }
        });
        throw error;
    }

    const weatherData = {
        temperature: data.current_weather.temperature,
        weatherCode: data.current_weather.weathercode,
        isDay: data.current_weather.is_day === 1,
    };

    logger.debug('Successfully retrieved weather data', {
        component: 'weatherService',
        additionalData: {
            latitude,
            longitude,
            temperature: weatherData.temperature,
            weatherCode: weatherData.weatherCode,
            isDay: weatherData.isDay
        }
    });

    return weatherData;
}
