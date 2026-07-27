import { SAVE_VERSION } from '../utils/constants.js';

// Each migration takes the raw saved object at version N and returns it
// upgraded to version N+1. Add new entries here whenever default-state.js
// shape changes in a way older saves won't already have.
const migrations = {
  // Example for future use:
  // 1: (data) => ({ ...data, newField: 'default' }),
};

export function migrate(savedData) {
  if (!savedData || typeof savedData !== 'object') {
    throw new Error('Save data is missing or corrupted.');
  }
  let data = savedData;
  let version = typeof data.version === 'number' ? data.version : 0;

  while (version < SAVE_VERSION) {
    const step = migrations[version];
    if (!step) {
      // No migration path defined; assume compatible enough to tag forward.
      data = { ...data, version: version + 1 };
    } else {
      data = step(data);
    }
    version += 1;
  }

  data.version = SAVE_VERSION;
  return data;
}
