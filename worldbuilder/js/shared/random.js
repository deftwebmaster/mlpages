export function hashString(value) {
  let h = 2166136261;
  for (let i = 0; i < String(value).length; i += 1) {
    h ^= String(value).charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function slug(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function rngFromSeed(seed) {
  let t = hashString(seed || "sci-fi-worldbuilder");
  return function random() {
    t += 0x6D2B79F5;
    let x = Math.imul(t ^ (t >>> 15), t | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

export function createSeededRandom(seed) {
  const random = rngFromSeed(seed);
  return {
    seed,
    raw: random,
    int: (min, max) => Math.floor(random() * (max - min + 1)) + min,
    float: (min, max, precision = 2) => Number((random() * (max - min) + min).toFixed(precision)),
    pick: items => items[Math.floor(random() * items.length)],
    maybe: chance => random() < chance,
    shuffle: items => [...items].sort(() => random() - 0.5),
    weighted(items) {
      const total = items.reduce((sum, item) => sum + item.weight, 0);
      let roll = random() * total;
      for (const item of items) {
        roll -= item.weight;
        if (roll <= 0) return item.value;
      }
      return items.at(-1).value;
    },
    derive(label) {
      return createSeededRandom(deriveSeed(seed, label));
    }
  };
}

export function deriveSeed(seed, label) {
  return `${seed}-${slug(label)}-${hashString(`${seed}:${label}`).toString(36).slice(0, 5)}`;
}

export function makeSeed(prefix = "") {
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  const seed = Array.from(bytes, b => b.toString(36).padStart(2, "0")).join("").slice(0, 8);
  return prefix ? `${prefix}-${seed}` : seed;
}

export function deterministicCreatedAt(seed) {
  const hash = hashString(seed);
  const month = hash % 12;
  const day = ((hash >>> 4) % 28) + 1;
  const hour = (hash >>> 9) % 24;
  const minute = (hash >>> 14) % 60;
  return new Date(Date.UTC(2326, month, day, hour, minute, 0)).toISOString();
}
