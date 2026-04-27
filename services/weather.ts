import { useQuery } from "@tanstack/react-query";
import { fetch as nitroFetch } from "react-native-nitro-fetch";
import { weatherClient } from "./client";

interface OpenMeteoCurrentResponse {
  current: {
    time: string;
    temperature_2m: number;
    weather_code: number;
  };
}

interface OpenMeteoGeocodeResult {
  name: string;
  country?: string;
  admin1?: string;
  latitude: number;
  longitude: number;
}

interface OpenMeteoGeocodeResponse {
  results?: OpenMeteoGeocodeResult[];
}

export interface WeatherSummary {
  place: string;
  temperatureC: number;
  weatherCode: number;
  condition: string;
  updatedAt: string;
}

const weatherCodeMap: Record<number, string> = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  56: "Freezing drizzle",
  57: "Dense freezing drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  66: "Freezing rain",
  67: "Heavy freezing rain",
  71: "Slight snow",
  73: "Moderate snow",
  75: "Heavy snow",
  77: "Snow grains",
  80: "Rain showers",
  81: "Moderate rain showers",
  82: "Violent rain showers",
  85: "Snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with hail",
  99: "Severe thunderstorm with hail",
};

const getConditionLabel = (weatherCode: number) => {
  return weatherCodeMap[weatherCode] ?? "Unknown";
};

const geocodeCity = async (city: string): Promise<OpenMeteoGeocodeResult> => {
  const geocodeUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    city,
  )}&count=1&language=en&format=json`;

  const response = await nitroFetch(geocodeUrl);
  if (!response.ok) {
    throw new Error(`Geocoding request failed with status ${response.status}`);
  }

  const data = (await response.json()) as OpenMeteoGeocodeResponse;
  const result = data.results?.[0];

  if (!result) {
    throw new Error("No weather location found for this city");
  }

  return result;
};

export const getWeatherByCity = async (city: string): Promise<WeatherSummary> => {
  const trimmedCity = city.trim();
  if (!trimmedCity) {
    throw new Error("City is required");
  }

  const location = await geocodeCity(trimmedCity);

  const weatherResponse = await weatherClient.get<OpenMeteoCurrentResponse>("/forecast", {
    params: {
      latitude: location.latitude,
      longitude: location.longitude,
      current: "temperature_2m,weather_code",
      timezone: "auto",
    },
  });

  return {
    place: location.admin1 ? `${location.name}, ${location.admin1}` : location.name,
    temperatureC: weatherResponse.data.current.temperature_2m,
    weatherCode: weatherResponse.data.current.weather_code,
    condition: getConditionLabel(weatherResponse.data.current.weather_code),
    updatedAt: weatherResponse.data.current.time,
  };
};

export const useWeatherByCity = (city?: string) => {
  const normalizedCity = city?.trim() ?? "";

  return useQuery({
    queryKey: ["weather", normalizedCity],
    queryFn: () => getWeatherByCity(normalizedCity),
    enabled: normalizedCity.length > 0,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    retry: 1,
  });
};
