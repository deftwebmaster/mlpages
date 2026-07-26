export const CONFIG = Object.freeze({
  rows: 7,
  columns: 7,
  nodeTypes: [
    { id: "cyan", label: "Cyan circle", shape: "circle" },
    { id: "violet", label: "Violet diamond", shape: "diamond" },
    { id: "lime", label: "Lime triangle", shape: "triangle" },
    { id: "orange", label: "Orange hexagon", shape: "hexagon" },
    { id: "magenta", label: "Magenta cross", shape: "cross" }
  ],
  states: {
    menu: "MENU",
    starting: "STARTING",
    playerTurn: "PLAYER_TURN",
    swapping: "SWAPPING",
    resolving: "RESOLVING",
    reshuffling: "RESHUFFLING",
    paused: "PAUSED",
    gameOver: "GAME_OVER"
  },
  heat: {
    starting: 15,
    validMove: 7,
    match4Cooling: 2,
    match5Cooling: 5,
    firstCascadeCooling: 2,
    additionalCascadeCooling: 3,
    specialCooling: 2,
    largeChainCooling: 3
  },
  scoring: {
    match3: 100,
    match4: 200,
    match5: 350,
    additionalNode: 150,
    specialActivation: 100,
    lineClear: 250,
    cascadeBase: 1,
    cascadeIncrement: 0.5
  },
  timings: {
    swap: 180,
    invalid: 330,
    matchCharge: 120,
    discharge: 240,
    gravity: 240,
    cascadePause: 110,
    deadlock: 860,
    gameOver: 500
  },
  storagePrefix: "circuitBreaker_"
});
