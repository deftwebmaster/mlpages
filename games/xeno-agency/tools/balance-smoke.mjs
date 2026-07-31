import assert from "node:assert/strict";

const state = {
  credits: 120,
  data: 12,
  salvage: 6,
  reputation: 5,
  trust: 42,
  clues: 0,
  chapter: 1,
  level: 1,
  completed: new Set(),
  facilities: new Set()
};

const projects = {
  "records-terminal": {
    cost: { credits: 45 },
    requires: {},
    rewards: { reputation: 4, data: 16, unlock: "research" }
  },
  "sealed-file": {
    cost: { data: 20 },
    requires: { completed: ["records-terminal"] },
    rewards: { clues: 2, reputation: 5, chapter: 2, unlock: "observation" }
  },
  "research-lab": {
    cost: { credits: 95, salvage: 10 },
    requires: { completed: ["records-terminal"] },
    rewards: { reputation: 8, data: 12, facility: "Research Laboratory" }
  },
  "mutation-stabilizer": {
    cost: { data: 45, salvage: 20 },
    requires: {},
    rewards: { reputation: 12, trust: 5, facility: "Mutation Stabilizer" }
  },
  "expedition-hangar": {
    cost: { credits: 190, salvage: 28 },
    requires: { level: 3 },
    rewards: { reputation: 12, facility: "Expedition Hangar", unlock: "wreck" }
  },
  "memory-archive": {
    cost: { data: 55, salvage: 18 },
    requires: { completed: ["sealed-file"], clues: 3 },
    rewards: { clues: 1, reputation: 9, trust: 6, facility: "Memory Archive" }
  },
  "forbidden-coordinate": {
    cost: { data: 80, salvage: 35 },
    requires: { completed: ["mutation-stabilizer", "expedition-hangar"], clues: 5 },
    rewards: { clues: 2, reputation: 15, chapter: 3, unlock: "moon" }
  },
  "origin-hearing": {
    cost: { data: 75, salvage: 35 },
    requires: { completed: ["forbidden-coordinate"], clues: 9, chapter: 3 },
    rewards: { reputation: 20, trust: 4, flag: "origin-hearing-ready" }
  }
};

const activities = {
  "storage-audit": { credits: 20, data: 4, salvage: 8, reputation: 0, clues: 0 },
  "registry-outreach": { credits: 24, data: 0, salvage: 0, reputation: 4, clues: 0 },
  "research-symposium": { credits: 0, data: 18, salvage: 0, reputation: 5, clues: 1 },
  "deep-wreck-expedition": { credits: 45, data: 0, salvage: 34, reputation: 0, clues: 1 },
  "forbidden-moon-listening": { credits: 0, data: 24, salvage: 0, reputation: 8, clues: 2 }
};

const milestones = [];

function updateLevel() {
  const previous = state.level;
  state.level = state.reputation >= 90 ? 4 : state.reputation >= 42 ? 3 : state.reputation >= 18 ? 2 : 1;
  if (state.level > previous) milestones.push(`agency level ${state.level}`);
}

function addRewards(rewards = {}) {
  state.credits += rewards.credits || 0;
  state.data += rewards.data || 0;
  state.salvage += rewards.salvage || 0;
  state.reputation += rewards.reputation || 0;
  state.trust += rewards.trust || 0;
  state.clues += rewards.clues || 0;
  if (rewards.chapter) state.chapter = Math.max(state.chapter, rewards.chapter);
  if (rewards.facility) state.facilities.add(rewards.facility);
  updateLevel();
}

function canPay(cost = {}) {
  return Object.entries(cost).every(([resource, amount]) => state[resource] >= amount);
}

function missingCost(cost = {}) {
  return Object.entries(cost)
    .filter(([resource, amount]) => state[resource] < amount)
    .map(([resource, amount]) => `${resource} ${amount - state[resource]}`)
    .join(", ");
}

function requirementsMet(requirements = {}) {
  assert.ok((requirements.completed || []).every((id) => state.completed.has(id)), `missing completed project for ${requirements.completed}`);
  assert.ok(!requirements.clues || state.clues >= requirements.clues, `need ${requirements.clues} clues, have ${state.clues}`);
  assert.ok(!requirements.level || state.level >= requirements.level, `need agency level ${requirements.level}, have ${state.level}`);
  assert.ok(!requirements.chapter || state.chapter >= requirements.chapter, `need chapter ${requirements.chapter}, have ${state.chapter}`);
}

function runProject(id) {
  const project = projects[id];
  assert.ok(project, `unknown project ${id}`);
  requirementsMet(project.requires);
  assert.ok(canPay(project.cost), `${id} missing ${missingCost(project.cost)}`);
  Object.entries(project.cost).forEach(([resource, amount]) => {
    state[resource] -= amount;
  });
  state.completed.add(id);
  addRewards(project.rewards);
  milestones.push(id);
}

function runActivity(id, times = 1) {
  const activity = activities[id];
  assert.ok(activity, `unknown activity ${id}`);
  for (let count = 0; count < times; count += 1) addRewards(activity);
  milestones.push(`${id} x${times}`);
}

runProject("records-terminal");
runActivity("storage-audit", 2);
runProject("sealed-file");
runActivity("registry-outreach", 2);
runProject("research-lab");
runActivity("storage-audit", 5);
runActivity("research-symposium", 3);
runProject("mutation-stabilizer");
runProject("memory-archive");
runActivity("registry-outreach", 3);
runActivity("storage-audit", 3);
runProject("expedition-hangar");
runActivity("deep-wreck-expedition", 3);
runActivity("research-symposium", 4);
runProject("forbidden-coordinate");
runActivity("forbidden-moon-listening", 1);
runActivity("research-symposium", 3);
runProject("origin-hearing");

assert.ok(state.completed.has("origin-hearing"), "origin hearing should be reachable");
assert.ok(state.clues >= 9, `expected at least 9 clues, have ${state.clues}`);
assert.ok(state.chapter >= 3, `expected chapter 3, have ${state.chapter}`);
assert.ok(state.trust >= 50, `expected stable trust, have ${state.trust}`);

console.log("Balance smoke passed");
console.log(milestones.join(" -> "));
console.log(
  `Final: credits ${state.credits}, data ${state.data}, salvage ${state.salvage}, reputation ${state.reputation}, clues ${state.clues}, trust ${state.trust}`
);
