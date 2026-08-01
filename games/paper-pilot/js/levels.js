export const LEVELS = [
  {
    id: 'first-fold',
    name: 'First Fold',
    brief: 'Collect two stars and settle onto the picnic blanket.',
    parTime: 18,
    launch: { pos: { x: 140, y: 420 }, angle: -0.32, power: 420 },
    camera: { x: 36, y: 118, zoom: 1 },
    landing: { x: 1160, y: 684, width: 190, angle: 0 },
    stars: [
      { x: 470, y: 314 },
      { x: 884, y: 270 }
    ],
    strokes: [
      { type: 'lift', points: [[100, 480], [210, 408], [356, 386], [506, 326], [660, 300]] },
      { type: 'gust', points: [[620, 340], [760, 315], [910, 286], [1080, 270]] },
      { type: 'lift', points: [[1010, 350], [1160, 400], [1310, 378], [1460, 326]] }
    ]
  },
  {
    id: 'mail-run',
    name: 'Mailbox Run',
    brief: 'Climb through the warm draft, grab three letters, and land past the roofline.',
    parTime: 24,
    launch: { pos: { x: 120, y: 500 }, angle: -0.48, power: 500 },
    camera: { x: 42, y: 86, zoom: 0.92 },
    landing: { x: 1530, y: 674, width: 210, angle: 0 },
    stars: [
      { x: 440, y: 332 },
      { x: 810, y: 226 },
      { x: 1240, y: 308 }
    ],
    strokes: [
      { type: 'lift', points: [[80, 530], [230, 424], [390, 360], [540, 320]] },
      { type: 'lift', points: [[560, 326], [710, 244], [880, 220], [1020, 260]] },
      { type: 'gust', points: [[980, 312], [1160, 314], [1370, 348], [1570, 410]] }
    ]
  },
  {
    id: 'sunset-skip',
    name: 'Sunset Skip',
    brief: 'Use fast gusts to cross the long gap, then bleed speed before landing.',
    parTime: 30,
    launch: { pos: { x: 120, y: 458 }, angle: -0.23, power: 560 },
    camera: { x: 42, y: 110, zoom: 0.84 },
    landing: { x: 1830, y: 686, width: 240, angle: 0 },
    stars: [
      { x: 560, y: 350 },
      { x: 1050, y: 250 },
      { x: 1510, y: 340 },
      { x: 1790, y: 590 }
    ],
    strokes: [
      { type: 'gust', points: [[110, 474], [360, 420], [620, 360], [870, 326]] },
      { type: 'gust', points: [[850, 318], [1080, 284], [1340, 292], [1580, 352]] },
      { type: 'lift', points: [[1510, 430], [1660, 506], [1810, 584], [1950, 640]] }
    ]
  },
  {
    id: 'courtyard-loop',
    name: 'Courtyard Loop',
    brief: 'Thread the courtyard, loop above the fountain, and settle onto the far terrace.',
    parTime: 34,
    launch: { pos: { x: 112, y: 520 }, angle: -0.42, power: 610 },
    camera: { x: 48, y: 78, zoom: 0.78 },
    landing: { x: 2040, y: 676, width: 230, angle: 0 },
    stars: [
      { x: 420, y: 360 },
      { x: 820, y: 210 },
      { x: 1230, y: 260 },
      { x: 1590, y: 480 },
      { x: 1980, y: 556 }
    ],
    strokes: [
      { type: 'lift', points: [[92, 540], [250, 440], [430, 360], [620, 298]] },
      { type: 'gust', points: [[590, 288], [760, 224], [960, 206], [1160, 250]] },
      { type: 'lift', points: [[1110, 312], [1260, 390], [1420, 474], [1600, 512]] },
      { type: 'gust', points: [[1580, 512], [1740, 544], [1920, 594], [2110, 642]] }
    ]
  },
  {
    id: 'paper-crown',
    name: 'Paper Crown',
    brief: 'Ride the high jet stream, collect the crown route, and land without diving.',
    parTime: 38,
    launch: { pos: { x: 126, y: 566 }, angle: -0.56, power: 660 },
    camera: { x: 52, y: 48, zoom: 0.72 },
    landing: { x: 2320, y: 684, width: 250, angle: 0 },
    stars: [
      { x: 460, y: 330 },
      { x: 860, y: 160 },
      { x: 1300, y: 188 },
      { x: 1710, y: 330 },
      { x: 2070, y: 516 }
    ],
    strokes: [
      { type: 'lift', points: [[110, 590], [280, 462], [470, 336], [650, 244]] },
      { type: 'gust', points: [[620, 230], [830, 160], [1080, 148], [1320, 190]] },
      { type: 'gust', points: [[1280, 210], [1500, 256], [1710, 340], [1900, 446]] },
      { type: 'lift', points: [[1840, 484], [2010, 552], [2190, 620], [2390, 670]] }
    ]
  }
];
