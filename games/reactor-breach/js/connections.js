// Builds and queries the conduit/shield/turret connection graph for a stage.
export class ConnectionGraph {
  constructor(components) {
    this.byId = new Map(components.map((c) => [c.id, c]));
    this.linksFrom = new Map(); // componentId -> [targetIds]
    for (const c of components) {
      if (c.connectionIds?.length) {
        this.linksFrom.set(c.id, c.connectionIds.slice());
      }
    }
  }

  get(id) {
    return this.byId.get(id);
  }

  targetsOf(id) {
    return this.linksFrom.get(id) || [];
  }

  // Called when a conduit/switch component is destroyed: disables/affects linked targets.
  onSourceDestroyed(id, effects) {
    const targets = this.targetsOf(id);
    for (const targetId of targets) {
      const target = this.byId.get(targetId);
      if (!target) continue;
      target.disabledByConduit = true;
      effects?.onDisabled?.(target);
    }
  }

  hasCircularDependency() {
    const visiting = new Set();
    const visited = new Set();
    const self = this;
    function dfs(id) {
      if (visited.has(id)) return false;
      if (visiting.has(id)) return true;
      visiting.add(id);
      for (const t of self.targetsOf(id)) {
        if (dfs(t)) return true;
      }
      visiting.delete(id);
      visited.add(id);
      return false;
    }
    for (const id of this.byId.keys()) {
      if (dfs(id)) return true;
    }
    return false;
  }
}
