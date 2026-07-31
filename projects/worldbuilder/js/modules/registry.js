/**
 * Lazy module registry.
 *
 * Loading all twelve modules up front costs well over a megabyte of JavaScript
 * before the home page — which only renders a dozen static cards — can paint.
 * Each module folder is imported on demand instead, and its exports are merged
 * into the shared `M` namespace.
 *
 * Call sites use `M.generateSettlement(...)` and stay synchronous; the route
 * dispatcher is responsible for awaiting the right modules first.
 */

/** Merged exports of every module loaded so far. */
export const M = {};

const LOADERS = {
  systems: () => [import("./systems/generate.js"), import("./systems/render.js")],
  settlements: () => [import("./settlements/generate.js"), import("./settlements/render.js")],
  characters: () => [import("./characters/generate.js"), import("./characters/render.js")],
  conflicts: () => [import("./conflicts/generate.js"), import("./conflicts/render.js")],
  documents: () => [import("./documents/generate.js"), import("./documents/render.js")],
  timeline: () => [import("./timeline/generate.js"), import("./timeline/render.js")],
  factions: () => [import("./factions/generate.js"), import("./factions/render.js")],
  relationships: () => [import("./relationships/generate.js"), import("./relationships/render.js")],
  premises: () => [import("./premises/generate.js"), import("./premises/render.js")],
  atlas: () => [import("./atlas/generate.js"), import("./atlas/render.js")],
  technology: () => [import("./technology/generate.js"), import("./technology/render.js")]
};

/**
 * Modules a route needs beyond its own. Kept explicit rather than inferred so a
 * missing edge shows up here rather than as a runtime `undefined is not a
 * function` deep inside a render.
 */
const EXTRA_DEPENDENCIES = {
  home: ["atlas"],
  premises: ["relationships"],
  organizations: [],
  library: []
};

const pending = new Map();
const loaded = new Set();

function loadOne(id) {
  if (!LOADERS[id]) return Promise.resolve();
  if (!pending.has(id)) {
    pending.set(id, Promise.all(LOADERS[id]()).then(namespaces => {
      for (const namespace of namespaces) Object.assign(M, namespace);
      loaded.add(id);
    }));
  }
  return pending.get(id);
}

/** Resolve a module id (and its declared dependencies) into loaded exports. */
export function loadModule(id) {
  const ids = [id, ...(EXTRA_DEPENDENCIES[id] || [])];
  return Promise.all(ids.map(loadOne));
}

/** Load everything. Used by the QA harness and the public scripting API. */
export function loadAllModules() {
  return Promise.all(Object.keys(LOADERS).map(loadOne));
}

/** True once `id` has finished loading, so callers can skip an await. */
export function isModuleLoaded(id) {
  return [id, ...(EXTRA_DEPENDENCIES[id] || [])].every(each => !LOADERS[each] || loaded.has(each));
}
