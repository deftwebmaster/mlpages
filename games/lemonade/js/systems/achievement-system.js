import { ACHIEVEMENTS } from '../data/achievements.js';
import { notify } from './notification-system.js';

export function checkAchievements(state) {
  const newlyEarned = [];
  for (const achievement of ACHIEVEMENTS) {
    if (state.achievements.earned.includes(achievement.id)) continue;
    if (achievement.check(state.stats)) {
      state.achievements.earned.push(achievement.id);
      newlyEarned.push(achievement);
      notify(`Achievement unlocked: ${achievement.name}`, 'achievement');
    }
  }
  return newlyEarned;
}

export function getAchievementProgress(state) {
  return ACHIEVEMENTS.map((a) => ({
    ...a,
    earned: state.achievements.earned.includes(a.id),
  }));
}
