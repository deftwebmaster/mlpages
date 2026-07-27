import { pickWeighted, randRange, chance } from '../utils/random.js';
import { clamp } from '../utils/math.js';

export const WEATHER_TYPES = {
  sunny: { label: 'Sunny', icon: '☀️', trafficMultiplier: 1.15, iceMultiplier: 1.1 },
  'partly-cloudy': { label: 'Partly Cloudy', icon: '⛅', trafficMultiplier: 1.03, iceMultiplier: 1.0 },
  overcast: { label: 'Overcast', icon: '☁️', trafficMultiplier: 0.88, iceMultiplier: 0.9 },
  'light-rain': { label: 'Light Rain', icon: '🌦️', trafficMultiplier: 0.75, iceMultiplier: 0.8 },
  'heavy-rain': { label: 'Heavy Rain', icon: '🌧️', trafficMultiplier: 0.45, iceMultiplier: 0.6 },
  windy: { label: 'Windy', icon: '💨', trafficMultiplier: 0.85, iceMultiplier: 0.95 },
  humid: { label: 'Humid', icon: '💦', trafficMultiplier: 1.1, iceMultiplier: 1.25 },
  'heat-wave': { label: 'Heat Wave', icon: '🔥', trafficMultiplier: 1.3, iceMultiplier: 1.45, middayDip: true },
  'cold-front': { label: 'Cold Front', icon: '🥶', trafficMultiplier: 0.5, iceMultiplier: 0.5 },
  'storm-risk': { label: 'Storm Risk', icon: '⛈️', trafficMultiplier: 0.65, iceMultiplier: 0.75 },
};

const SEASON_WEATHER_WEIGHTS = {
  spring: [
    ['sunny', 0.25], ['partly-cloudy', 0.25], ['overcast', 0.15], ['light-rain', 0.2],
    ['heavy-rain', 0.05], ['windy', 0.1],
  ],
  summer: [
    ['sunny', 0.35], ['partly-cloudy', 0.2], ['humid', 0.15], ['heat-wave', 0.15],
    ['light-rain', 0.08], ['storm-risk', 0.07],
  ],
  fall: [
    ['sunny', 0.2], ['partly-cloudy', 0.25], ['overcast', 0.2], ['windy', 0.15],
    ['light-rain', 0.15], ['cold-front', 0.05],
  ],
  winter: [
    ['overcast', 0.25], ['cold-front', 0.3], ['sunny', 0.15], ['partly-cloudy', 0.15],
    ['light-rain', 0.1], ['windy', 0.05],
  ],
};

const SEASON_TEMP_RANGE = {
  spring: [52, 75],
  summer: [72, 98],
  fall: [45, 68],
  winter: [25, 48],
};

export function rollWeather(rng, season) {
  const weights = SEASON_WEATHER_WEIGHTS[season] || SEASON_WEATHER_WEIGHTS.summer;
  const type = pickWeighted(rng, weights.map(([value, weight]) => ({ value, weight })));
  let [lo, hi] = SEASON_TEMP_RANGE[season] || SEASON_TEMP_RANGE.summer;
  if (type === 'heat-wave') { lo += 10; hi += 8; }
  if (type === 'cold-front') { lo -= 12; hi -= 10; }
  const temperature = Math.round(randRange(rng, lo, hi));
  return { type, temperature };
}

/** Forecasts can be wrong; accuracy in [0,1] where 1 = always correct. */
export function rollForecast(rng, actualWeather, season, accuracy = 0.72) {
  if (chance(rng, accuracy)) {
    return { ...actualWeather, confidence: 'reliable' };
  }
  const weights = SEASON_WEATHER_WEIGHTS[season] || SEASON_WEATHER_WEIGHTS.summer;
  const alt = pickWeighted(rng, weights.map(([value, weight]) => ({ value, weight })));
  const tempDrift = randRange(rng, -8, 8);
  return { type: alt, temperature: Math.round(actualWeather.temperature + tempDrift), confidence: 'uncertain' };
}

/** Temperature demand curve: lemonade demand peaks in the 80s-90s, dips in extreme heat/cold. */
export function temperatureDemandFactor(temperature) {
  if (temperature < 45) return 0.35;
  if (temperature < 60) return 0.6 + ((temperature - 45) / 15) * 0.2;
  if (temperature < 80) return 0.8 + ((temperature - 60) / 20) * 0.35;
  if (temperature <= 95) return 1.15;
  // Extreme heat: fewer people outside overall, but thirst is very high.
  return clamp(1.15 - (temperature - 95) * 0.015, 0.75, 1.15);
}

/** Some weather (heat waves) suppress midday outdoor traffic even while raising overall thirst. */
export function hourlyWeatherFactor(weatherType, hour) {
  const weather = WEATHER_TYPES[weatherType] || WEATHER_TYPES.sunny;
  if (weather.middayDip && hour >= 12 && hour <= 15) {
    return 0.72;
  }
  return 1;
}

export function weatherTrafficMultiplier(weatherType) {
  return (WEATHER_TYPES[weatherType] || WEATHER_TYPES.sunny).trafficMultiplier;
}

export function iceConsumptionMultiplier(weatherType, temperature) {
  const weather = WEATHER_TYPES[weatherType] || WEATHER_TYPES.sunny;
  const tempFactor = clamp(0.7 + (temperature - 60) * 0.01, 0.6, 1.6);
  return weather.iceMultiplier * tempFactor;
}
