import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync("app.js", "utf8").replace(/\nboot\(\);\s*$/, "");
const storage = new Map();
const context = {
  console,
  Date,
  Math,
  setTimeout,
  clearTimeout,
  setInterval: () => 0,
  clearInterval: () => {},
  btoa: (value) => Buffer.from(value, "binary").toString("base64"),
  atob: (value) => Buffer.from(value, "base64").toString("binary"),
  Blob: class Blob {},
  URL: { createObjectURL: () => "blob:qa", revokeObjectURL: () => {} },
  Image: class Image {
    decode() {
      return Promise.resolve();
    }
  },
  localStorage: {
    getItem: (key) => storage.get(key) || null,
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: (key) => storage.delete(key)
  },
  document: {
    querySelector: () => null,
    addEventListener: () => {},
    createElement: () => ({ click: () => {}, getContext: () => ({}) })
  },
  window: { addEventListener: () => {} },
  navigator: {}
};

vm.createContext(context);
vm.runInContext(source, context, { filename: "app.js" });

assert.equal(typeof context.migrateSave, "function", "migrateSave should be available");
assert.equal(typeof context.importSaveFromJson, "function", "importSaveFromJson should be available");

const minimalOldSave = {
  meta: { saveId: "old-save", saveName: "Old Agency" },
  alien: { identity: { name: "Oru" } },
  agency: { name: "Old Agency" }
};

const migrated = context.migrateSave(minimalOldSave);
assert.equal(migrated.meta.schemaVersion, 1);
assert.equal(migrated.meta.gameVersion, "0.1.0-static");
assert.ok(migrated.meta.campaignSeed);
assert.ok(migrated.alien.appearance.portraitSrc);
assert.ok(migrated.alien.speciesProfile.name);
assert.ok(migrated.alien.needs.trust >= 0);
assert.ok(migrated.agency.facilities["Alien Habitat"]);
assert.ok(migrated.world.campaignState.motif);
assert.ok(Array.isArray(migrated.events.pending));
assert.ok(Array.isArray(migrated.missions.history));
assert.ok(migrated.timers);

assert.throws(() => context.importSaveFromJson("not json"), /not valid JSON/);
assert.throws(() => context.importSaveFromJson("{}"), /missing metadata/);

console.log("Save migration smoke passed");
