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
    adBreak: "AD_BREAK",
    paused: "PAUSED",
    gameOver: "GAME_OVER"
  },
  ads: {
    movesBetweenBreaks: 4,
    firstBreakAfterMoves: 3,
    sponsors: [
      {
        name: "VoltSnax",
        copy: "The only energy bar optimized for people who say synergy near circuit boards.",
        disclaimer: "No brand paid for this. Frankly, no brand was asked."
      },
      {
        name: "CloudFuse Premium",
        copy: "Move your entire electrical grid to the cloud and hope the cloud understands electricity.",
        disclaimer: "Now with 12% more dashboard."
      },
      {
        name: "SurgeCoin",
        copy: "A currency backed by vibes, thermal paste, and one very confident whitepaper.",
        disclaimer: "This is not financial advice because it is barely advice."
      },
      {
        name: "NodeMinder Plus",
        copy: "For only zero dollars, we will remind you that matching three things is technically productivity.",
        disclaimer: "Enterprise plan includes a second reminder."
      }
    ]
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
