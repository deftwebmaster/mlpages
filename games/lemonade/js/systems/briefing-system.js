import { createRng } from '../utils/random.js';
import { rollWeather, rollForecast } from '../simulation/weather-model.js';
import { rollLocalActivity } from '../simulation/event-model.js';
import { getUpgradeEffects } from './upgrade-system.js';

/** Generates (once per day, deterministically) the actual weather, the
 * player-facing forecast, and any local activity flavor for the current day. */
export function ensureDayBriefing(state) {
  if (state.today && state.today.day === state.calendar.day) return state.today;

  const rng = createRng((state.meta.rngSeed + state.calendar.day * 7919) >>> 0);
  const actualWeather = rollWeather(rng, state.calendar.season);
  const effects = getUpgradeEffects(state);
  const forecastAccuracy = Math.min(0.97, 0.72 + effects.forecastAccuracy);
  const forecast = rollForecast(rng, actualWeather, state.calendar.season, forecastAccuracy);
  const localActivity = rollLocalActivity(rng);

  state.today = { day: state.calendar.day, actualWeather, forecast, localActivity };
  return state.today;
}
