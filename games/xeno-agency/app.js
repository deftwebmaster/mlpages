const DB_NAME = "xeno-agency";
const DB_VERSION = 1;
const SAVE_STORE = "saves";
const CURRENT_KEY = "current";
const BACKUP_KEY = "xeno-agency-backup";
const LOAD_ERROR_KEY = "xeno-agency-last-load-error";
const SCHEMA_VERSION = 1;
const GAME_VERSION = "0.1.0-static";

const STAT_LABELS = {
  physique: "Physique",
  intellect: "Intellect",
  reflex: "Reflex",
  empathy: "Empathy",
  instinct: "Instinct",
  stability: "Stability"
};

const NAV_ITEMS = [
  ["home", "Agency", "⌂"],
  ["alien", "Alien", "◉"],
  ["world", "World", "◎"],
  ["missions", "Missions", "✦"],
  ["arena", "Arena", "⚔"],
  ["research", "Research", "⌁"],
  ["inventory", "Gear", "▣"],
  ["settings", "Save", "☰"]
];

const NAME_POOL = [
  "Vokka",
  "Nemi",
  "Threx",
  "Oru",
  "Sable",
  "Kivi",
  "Marn",
  "Yotto",
  "Lume",
  "Zeer",
  "Paxa",
  "Ilo"
];

const PORTRAIT_LIBRARY = [
  { id: "xa-01-17", code: "XA-01-17", src: "./assets/portraits/alien-01.png", accent: "#bda4ff" },
  { id: "xa-02-44", code: "XA-02-44", src: "./assets/portraits/alien-02.png", accent: "#74dff4" },
  { id: "xa-03-29", code: "XA-03-29", src: "./assets/portraits/alien-03.png", accent: "#d5c36a" },
  { id: "xa-04-08", code: "XA-04-08", src: "./assets/portraits/alien-04.png", accent: "#ff9b4a" },
  { id: "xa-05-73", code: "XA-05-73", src: "./assets/portraits/alien-05.png", accent: "#a979ff" },
  { id: "xa-06-31", code: "XA-06-31", src: "./assets/portraits/alien-06.png", accent: "#82efff" },
  { id: "xa-07-62", code: "XA-07-62", src: "./assets/portraits/alien-07.png", accent: "#79b7ff" },
  { id: "xa-08-19", code: "XA-08-19", src: "./assets/portraits/alien-08.png", accent: "#9ab6d8" },
  { id: "xa-09-55", code: "XA-09-55", src: "./assets/portraits/alien-09.png", accent: "#83efc6" },
  { id: "xa-10-21", code: "XA-10-21", src: "./assets/portraits/alien-10.png", accent: "#ff73c9" },
  { id: "xa-11-46", code: "XA-11-46", src: "./assets/portraits/alien-11.png", accent: "#ffc85a" },
  { id: "xa-12-90", code: "XA-12-90", src: "./assets/portraits/alien-12.png", accent: "#d8e3ef" }
];

const SPECIES_SYLLABLES = {
  start: ["Va", "Ko", "Tri", "Sel", "Aun", "Mi", "Zho", "Pra", "Eli", "Nor"],
  mid: ["lek", "sha", "mir", "vex", "ona", "quil", "dra", "thi", "rum", "sai"],
  end: ["i", "an", "or", "eth", "uun", "ix", "ari", "os", "el", "um"]
};

const BODY_PLANS = [
  "Humanoid",
  "Quadrupedal",
  "Floating",
  "Insectoid",
  "Amorphous",
  "Avian",
  "Aquatic",
  "Synthetic-organic hybrid"
];

const TEMPERAMENTS = ["Curious", "Guarded", "Playful", "Proud", "Methodical", "Restless", "Gentle", "Defiant"];
const POSITIVE_TRAITS = ["Patient", "Observant", "Brave", "Inventive", "Loyal", "Graceful", "Bright-eyed", "Diplomatic"];
const DIFFICULT_TRAITS = ["Startles easily", "Hoarding impulse", "Proud silence", "Overfocus", "Suspicious", "Dramatic molting"];
const FEARS = ["deep sonar", "locked white rooms", "official uniforms", "mirror glass", "static thunder", "medical lamps"];
const PREFERENCES = ["warm mineral tea", "quiet engine rooms", "pattern puzzles", "market music", "soft blue light", "old paper records"];
const AVERSIONS = ["sharp citrus", "arena crowds", "blank forms", "wet gloves", "sleep sirens", "polished floors"];

const LOCATIONS = [
  {
    id: "office",
    name: "Adoption Office",
    icon: "⌂",
    description: "A half-lit office with unpaid bills, sealed files, and one adoption license still recognized by the registry.",
    unlock: "Open"
  },
  {
    id: "market",
    name: "Neon Market",
    icon: "◍",
    description: "Rotating vendors, rumor brokers, edible star salts, and modifications nobody puts on official receipts.",
    unlock: "Agency level 2"
  },
  {
    id: "research",
    name: "Research District",
    icon: "⌁",
    description: "Academic towers and ethics boards circling the same question: who owns an alien's origin data?",
    unlock: "Records project"
  },
  {
    id: "wreck",
    name: "Wreck Fields",
    icon: "✦",
    description: "A salvage belt where broken ships whisper with emergency beacons that should have died years ago.",
    unlock: "Agency level 3"
  },
  {
    id: "arena",
    name: "Lunar Arena",
    icon: "⚔",
    description: "Exhibition matches, ranked trials, and rivals who smile too hard when your alien enters the ring.",
    unlock: "Open"
  },
  {
    id: "observation",
    name: "Human Observation Zone",
    icon: "◌",
    description: "A restricted cultural study site full of disguises, contraband toys, and very serious misunderstandings.",
    unlock: "Research trace"
  },
  {
    id: "moon",
    name: "Forbidden Moon",
    icon: "☾",
    description: "A quarantined coordinate hidden behind redacted adoption records and the previous director's warning.",
    unlock: "Late campaign"
  }
];

const CAMPAIGN_CHAPTERS = [
  {
    chapter: 1,
    title: "Stabilize the Office",
    objective: "Restore records, earn trust, and complete early field reports.",
    nextAt: "Trace the sealed file and recover 2 origin clues"
  },
  {
    chapter: 2,
    title: "Follow the False Stamp",
    objective: "Build research capacity, unlock restricted districts, and identify who altered the adoption file.",
    nextAt: "5 origin clues, Mutation Stabilizer, and Expedition Hangar"
  },
  {
    chapter: 3,
    title: "Open the Forbidden Coordinate",
    objective: "Reach the Forbidden Moon and decide how much of the alien's origin should remain hidden.",
    nextAt: "Campaign finale content"
  }
];

const CAMPAIGN_MOTIFS = [
  {
    id: "borrowed-sky",
    title: "Borrowed Sky",
    description: "Signals, custody claims, and the question of who gets to name home."
  },
  {
    id: "false-paper",
    title: "False Paper",
    description: "Records, transfer stamps, and the quiet violence of official certainty."
  },
  {
    id: "open-door",
    title: "Open Door",
    description: "Community pressure, sanctuary habits, and the risk of letting witnesses in."
  },
  {
    id: "living-evidence",
    title: "Living Evidence",
    description: "Research temptation, consent rules, and the line between proof and personhood."
  }
];

const ACTIVITIES = [
  {
    id: "balance-drills",
    name: "Balance Drills",
    category: "Training",
    stat: "reflex",
    skill: "Athletics",
    difficulty: 4,
    durationMs: 35_000,
    vitality: 8,
    rewards: { xp: 18, morale: 2 },
    report: "Your alien learns to cross the ceiling rails without knocking paperwork into orbit."
  },
  {
    id: "logic-feeder",
    name: "Logic Feeder",
    category: "Study",
    stat: "intellect",
    skill: "Engineering",
    difficulty: 5,
    durationMs: 55_000,
    vitality: 10,
    rewards: { xp: 24, data: 6 },
    report: "The records terminal accepts a chain of symbols your alien insists were obvious."
  },
  {
    id: "storage-audit",
    name: "Storage Audit",
    category: "Work",
    stat: "intellect",
    skill: "Scavenging",
    difficulty: 4,
    durationMs: 50_000,
    vitality: 6,
    rewards: { xp: 18, salvage: 8, credits: 20, data: 4 },
    report: "The storage shelves cough up mislabeled adapters, edible packing foam, and a box marked do not inventory."
  },
  {
    id: "registry-outreach",
    name: "Registry Outreach",
    category: "Social",
    stat: "empathy",
    skill: "Diplomacy",
    difficulty: 5,
    durationMs: 75_000,
    vitality: 8,
    rewards: { xp: 22, credits: 24, reputation: 4 },
    report: "You convince a minor registry clerk that the agency is operational, ethical, and only moderately on fire."
  },
  {
    id: "market-courier",
    name: "Market Courier",
    category: "Work",
    stat: "empathy",
    skill: "Diplomacy",
    difficulty: 6,
    durationMs: 80_000,
    vitality: 12,
    location: "market",
    rewards: { xp: 28, credits: 38, reputation: 2 },
    report: "Three merchants pay on time, one pays in coupons, and one asks if your alien accepts fan mail."
  },
  {
    id: "quiet-rest",
    name: "Quiet Habitat Rest",
    category: "Rest",
    stat: "stability",
    skill: "Survival",
    difficulty: 2,
    durationMs: 45_000,
    vitality: 0,
    rewards: { vitality: 26, morale: 8, stress: -14, nourishment: 7 },
    report: "The habitat lights dim to a color your alien does not have a word for yet, but likes."
  },
  {
    id: "sealed-records",
    name: "Study Sealed Records",
    category: "Investigation",
    stat: "instinct",
    skill: "Investigation",
    difficulty: 7,
    durationMs: 105_000,
    vitality: 11,
    rewards: { xp: 32, data: 10, clue: 1 },
    report: "A false medical stamp repeats across unrelated files. The mistake is too neat to be accidental."
  },
  {
    id: "casework-triage",
    name: "Casework Triage",
    category: "Work",
    stat: "intellect",
    skill: "Investigation",
    difficulty: 5,
    durationMs: 85_000,
    vitality: 9,
    rewards: { xp: 26, credits: 18, data: 8, reputation: 2 },
    report: "You and your alien sort a stack of neglected adoption cases into urgent, suspicious, and emotionally radioactive."
  },
  {
    id: "wreck-sweep",
    name: "Wreck Field Sweep",
    category: "Exploration",
    stat: "physique",
    skill: "Scavenging",
    difficulty: 8,
    durationMs: 150_000,
    vitality: 16,
    location: "wreck",
    rewards: { xp: 45, salvage: 18, credits: 24 },
    report: "The salvage belt gives up a crate of machine ribs and a beacon that knows your agency name."
  },
  {
    id: "observation-shift",
    name: "Observation Shift",
    category: "Social",
    stat: "empathy",
    skill: "Performance",
    difficulty: 8,
    durationMs: 180_000,
    vitality: 15,
    location: "observation",
    rewards: { xp: 42, reputation: 5, morale: 5 },
    report: "Your alien successfully identifies a vending machine as neither elder nor threat."
  },
  {
    id: "habitat-bonding",
    name: "Habitat Bonding Hour",
    category: "Social",
    stat: "empathy",
    skill: "Diplomacy",
    difficulty: 3,
    durationMs: 60_000,
    vitality: 4,
    rewards: { xp: 16, morale: 10, trust: 5, stress: -8 },
    report: "You sit with your alien without making the hour useful. Somehow that makes it more useful."
  },
  {
    id: "comfort-cooking",
    name: "Comfort Cooking",
    category: "Rest",
    stat: "empathy",
    skill: "Survival",
    difficulty: 4,
    durationMs: 70_000,
    vitality: 3,
    requires: { completedProject: "comfort-kitchen" },
    rewards: { xp: 18, nourishment: 16, morale: 12, trust: 3, stress: -8 },
    report: "The kitchen produces something technically edible and emotionally specific enough that your alien asks for seconds."
  },
  {
    id: "medical-scan",
    name: "Consent-Based Medical Scan",
    category: "Medical",
    stat: "stability",
    skill: "Xenobiology",
    difficulty: 6,
    durationMs: 95_000,
    vitality: 8,
    requires: { facility: "Medical Bay", facilityLevel: 1, trust: 38 },
    rewards: { xp: 24, health: 8, stress: -6, clue: 1 },
    report: "The scan finds an old surgical shadow. The machine asks for a password nobody currently alive should know."
  },
  {
    id: "neon-rumor-run",
    name: "Neon Rumor Run",
    category: "Investigation",
    stat: "instinct",
    skill: "Investigation",
    difficulty: 7,
    durationMs: 130_000,
    vitality: 13,
    location: "market",
    rewards: { xp: 36, data: 8, credits: 22, reputation: 3, faction: { mothChoir: 1 } },
    report: "A vendor remembers a director with tired eyes buying three fake transfer seals."
  },
  {
    id: "moth-choir-mediation",
    name: "Moth Choir Mediation",
    category: "Social",
    stat: "empathy",
    skill: "Diplomacy",
    difficulty: 8,
    durationMs: 160_000,
    vitality: 13,
    location: "market",
    requires: { completedProject: "diplomatic-lounge" },
    rewards: { xp: 42, data: 10, reputation: 6, trust: 3, faction: { mothChoir: 2, glasshouse: -1 } },
    report: "A bureau mediator stops calling your alien evidence and starts calling them by name."
  },
  {
    id: "research-symposium",
    name: "Research Symposium",
    category: "Study",
    stat: "intellect",
    skill: "Xenobiology",
    difficulty: 8,
    durationMs: 170_000,
    vitality: 14,
    location: "research",
    requires: { completedProject: "research-lab" },
    rewards: { xp: 44, data: 18, reputation: 5, clue: 1 },
    report: "Your alien corrects a lecturer by tapping once on the projector glass. Half the room takes notes."
  },
  {
    id: "ethics-practicum",
    name: "Ethics Practicum",
    category: "Study",
    stat: "empathy",
    skill: "Xenobiology",
    difficulty: 7,
    durationMs: 145_000,
    vitality: 10,
    location: "research",
    requires: { completedProject: "research-lab", trust: 45 },
    rewards: {
      xp: 38,
      data: 14,
      reputation: 4,
      trust: 4,
      stress: -4,
      memory: {
        title: "Consent Protocol",
        text: "{alien} helped rewrite the lab rules so every scan starts with a real answer, not a signature."
      }
    },
    report: "The district tries to make consent sound abstract. Your alien makes it impossible."
  },
  {
    id: "hangar-expedition",
    name: "Deep Wreck Expedition",
    category: "Expedition",
    stat: "physique",
    skill: "Navigation",
    difficulty: 10,
    durationMs: 240_000,
    vitality: 22,
    location: "wreck",
    requires: { completedProject: "expedition-hangar" },
    rewards: { xp: 70, salvage: 34, credits: 45, clue: 1 },
    report: "The hangar beacon catches a wreck signal signed by the previous director in the wrong year."
  },
  {
    id: "beacon-diving",
    name: "Beacon Diving",
    category: "Expedition",
    stat: "instinct",
    skill: "Navigation",
    difficulty: 9,
    durationMs: 205_000,
    vitality: 18,
    location: "wreck",
    requires: { completedProject: "field-kit-cache" },
    rewards: { xp: 58, salvage: 24, data: 12, clue: 1 },
    report: "Your alien follows a repeating distress ping into a wreck section that still thinks it has passengers."
  },
  {
    id: "memory-archive-session",
    name: "Memory Archive Session",
    category: "Study",
    stat: "stability",
    skill: "Psionics",
    difficulty: 9,
    durationMs: 210_000,
    vitality: 12,
    requires: { completedProject: "memory-archive" },
    rewards: { xp: 52, trust: 7, clue: 1, stress: 6 },
    report: "The archive returns a memory that is not yours and not entirely your alien's either."
  },
  {
    id: "forbidden-moon-listening",
    name: "Forbidden Moon Listening",
    category: "Expedition",
    stat: "instinct",
    skill: "Survival",
    difficulty: 11,
    durationMs: 300_000,
    vitality: 24,
    location: "moon",
    requires: { chapter: 3 },
    rewards: { xp: 90, data: 24, clue: 2, trust: 6, reputation: 8 },
    report: "Under the quarantine lights, your alien hears the hidden part of the adoption record answer back."
  },
  {
    id: "lunar-surface-vigil",
    name: "Lunar Surface Vigil",
    category: "Rest",
    stat: "stability",
    skill: "Psionics",
    difficulty: 8,
    durationMs: 210_000,
    vitality: 10,
    location: "moon",
    requires: { chapter: 3, trust: 55 },
    rewards: {
      xp: 48,
      data: 8,
      trust: 7,
      morale: 9,
      stress: -12,
      memory: {
        title: "Quiet Moon",
        text: "{alien} sat under the quarantine lights and decided the moon could be a place visited, not a place owned."
      }
    },
    report: "No one interrogates the signal. No one takes notes. The moon is quiet long enough to become real."
  }
];

const PROJECTS = [
  {
    id: "records-terminal",
    name: "Restore Records Terminal",
    type: "Facility",
    durationMs: 90_000,
    cost: { credits: 45 },
    rewards: { reputation: 4, data: 16, unlock: "research" },
    description: "Repair the terminal that contains the director's redacted adoption logs."
  },
  {
    id: "habitat-upgrade",
    name: "Soften Alien Habitat",
    type: "Facility",
    durationMs: 120_000,
    cost: { credits: 70, salvage: 8 },
    rewards: { reputation: 4, facility: "Alien Habitat", comfort: 1 },
    description: "Install adaptive bedding, better heat stones, and a privacy curtain no inspector can see through."
  },
  {
    id: "sealed-file",
    name: "Trace the Sealed File",
    type: "Research",
    durationMs: 150_000,
    cost: { data: 20 },
    rewards: { clue: 2, unlock: "observation", reputation: 5 },
    description: "Follow the missing director's checksum trail through three intentionally boring forms."
  },
  {
    id: "casework-board",
    name: "Install Casework Board",
    type: "Agency",
    durationMs: 110_000,
    cost: { credits: 55, data: 8 },
    rewards: { reputation: 6, data: 8, facility: "Casework Board" },
    description: "Turn scattered adoption files into a visible queue of cases the agency can actually help."
  },
  {
    id: "comms-array",
    name: "Patch Communications Array",
    type: "Agency",
    durationMs: 180_000,
    cost: { credits: 95, salvage: 16 },
    rewards: { reputation: 8, facility: "Communications Array", unlock: "market" },
    description: "Let distant agencies call you before rivals define your reputation for you."
  },
  {
    id: "comfort-kitchen",
    name: "Build Comfort Kitchen",
    type: "Facility",
    durationMs: 150_000,
    cost: { credits: 90, salvage: 10 },
    requires: { completedProject: "habitat-upgrade" },
    rewards: { reputation: 5, trust: 4, facility: "Comfort Kitchen" },
    description: "Add species-safe heat stones, mineral stock, and a food printer that stops defaulting to human soup."
  },
  {
    id: "mutation-stabilizer",
    name: "Prototype Mutation Stabilizer",
    type: "Research",
    durationMs: 240_000,
    cost: { data: 45, salvage: 20 },
    rewards: { reputation: 12, facility: "Mutation Stabilizer", trust: 5 },
    description: "Build a humane stabilizer that protects consent as much as biology."
  },
  {
    id: "research-lab",
    name: "Open Research Laboratory",
    type: "Facility",
    durationMs: 190_000,
    cost: { credits: 95, salvage: 10 },
    requires: { completedProject: "records-terminal" },
    rewards: { reputation: 8, data: 12, facility: "Research Laboratory" },
    description: "Turn a storage closet and three illegal adapters into a real laboratory with documented consent rules."
  },
  {
    id: "training-room-ii",
    name: "Refit Training Room",
    type: "Facility",
    durationMs: 150_000,
    cost: { credits: 95, salvage: 12 },
    rewards: { reputation: 5, facility: "Training Room", stat: { reflex: 1 } },
    description: "Install safer rails, adaptive mats, and difficulty settings that do not assume humanoid knees."
  },
  {
    id: "diplomatic-lounge",
    name: "Build Diplomatic Lounge",
    type: "Agency",
    durationMs: 210_000,
    cost: { credits: 150, data: 18 },
    requires: { agencyLevel: 2 },
    rewards: { reputation: 10, facility: "Diplomatic Lounge", unlock: "observation", faction: { mothChoir: 2 } },
    description: "A neutral room where factions can talk without making your alien sit under a registry camera."
  },
  {
    id: "expedition-hangar",
    name: "Lease Expedition Hangar",
    type: "Facility",
    durationMs: 260_000,
    cost: { credits: 190, salvage: 28 },
    requires: { agencyLevel: 3 },
    rewards: { reputation: 12, facility: "Expedition Hangar", unlock: "wreck" },
    description: "Secure a tiny hangar, a questionable shuttle, and enough insurance paperwork to make rivals nervous."
  },
  {
    id: "field-kit-cache",
    name: "Stock Field Kit Cache",
    type: "Facility",
    durationMs: 180_000,
    cost: { credits: 130, salvage: 18 },
    requires: { agencyLevel: 3, completedProject: "expedition-hangar" },
    rewards: { reputation: 8, data: 8, facility: "Field Kit Cache", stat: { instinct: 1 } },
    description: "Prepare consent forms, beacon tags, adaptable harnesses, and field rations before the next wreck opens itself."
  },
  {
    id: "memory-archive",
    name: "Assemble Memory Archive",
    type: "Research",
    durationMs: 270_000,
    cost: { data: 55, salvage: 18 },
    requires: { completedProject: "sealed-file", clues: 3 },
    rewards: { clue: 1, reputation: 9, facility: "Memory Archive", trust: 6 },
    description: "Create a protected archive for recovered memories before factions can turn them into evidence."
  },
  {
    id: "forbidden-coordinate",
    name: "Decrypt Forbidden Coordinate",
    type: "Campaign",
    durationMs: 360_000,
    cost: { data: 80, salvage: 35 },
    requires: { completedProject: "mutation-stabilizer", completedProjectAlso: "expedition-hangar", clues: 5 },
    rewards: { clue: 2, reputation: 15, unlock: "moon", chapter: 3 },
    description: "Combine the sealed file, hangar telemetry, and stabilizer readings into a route the registry tried to erase."
  },
  {
    id: "origin-hearing",
    name: "Convene Origin Hearing",
    type: "Finale",
    durationMs: 420_000,
    cost: { data: 75, salvage: 35 },
    requires: { chapter: 3, completedProject: "forbidden-coordinate", clues: 9 },
    rewards: { reputation: 20, trust: 4, flag: "origin-hearing-ready" },
    description: "Call every faction to the table and decide who, if anyone, gets to define your alien's origin."
  }
];

const SHOP_ITEMS = [
  {
    id: "mineral-tea",
    name: "Warm Mineral Tea",
    type: "Food",
    cost: 18,
    description: "Restores nourishment and morale. Many species pretend not to like it.",
    use: { nourishment: 18, morale: 6 }
  },
  {
    id: "soft-harness",
    name: "Soft Utility Harness",
    type: "Gear",
    slot: "body",
    cost: 74,
    description: "Adds secure pockets without making your alien look inspected.",
    bonus: { physique: 1, stability: 1 }
  },
  {
    id: "lens-prism",
    name: "Lens Prism",
    type: "Gear",
    slot: "focus",
    cost: 92,
    description: "A legal analysis aid that makes hidden seams in documents glow green.",
    bonus: { intellect: 1, instinct: 1 }
  },
  {
    id: "calming-sigil",
    name: "Calming Sigil",
    type: "Gear",
    slot: "charm",
    cost: 64,
    description: "A small charm from the market. It hums when stress spikes.",
    bonus: { stability: 2 }
  },
  {
    id: "starfruit-gel",
    name: "Starfruit Gel",
    type: "Food",
    cost: 26,
    description: "A bright nutrient gel for species that taste minerals before sweetness.",
    use: { nourishment: 24, vitality: 8, morale: 4 }
  },
  {
    id: "field-boots",
    name: "Field Boots",
    type: "Gear",
    slot: "body",
    cost: 118,
    description: "Soft-grip boots that work even when the floor changes its mind about gravity.",
    bonus: { physique: 1, reflex: 1 }
  },
  {
    id: "archive-thread",
    name: "Archive Thread",
    type: "Gear",
    slot: "charm",
    cost: 104,
    description: "A braided memory marker carried by researchers who learned to ask first.",
    bonus: { empathy: 1, stability: 1 }
  }
];

const RIVALS = [
  {
    id: "glasshouse",
    name: "Glasshouse Directorate",
    style: "legal pressure",
    reputation: 12
  },
  {
    id: "red-crest",
    name: "Red Crest Kennels",
    style: "arena spectacle",
    reputation: 8
  },
  {
    id: "moth-choir",
    name: "Moth Choir Bureau",
    style: "soft diplomacy",
    reputation: 10
  }
];

const STORY_EVENTS = [
  {
    id: "visitor-bill",
    title: "Visitor at Closing",
    body: "A courier slides an unpaid invoice under the door. On the back, someone has written: do not scan the alien in public.",
    flag: "warned-about-scans",
    choices: [
      {
        label: "Tell your alien first",
        text: "Trust rises, but the office loses a little time calming the room.",
        effects: { trust: 5, stress: -4, flag: "shared-warning" }
      },
      {
        label: "File it as evidence",
        text: "The agency gains data, but your alien notices the secrecy.",
        effects: { data: 8, trust: -2, flag: "filed-warning" }
      }
    ]
  },
  {
    id: "old-photo",
    title: "A Photo in the Wall",
    body: "Behind a loose panel, you find the previous director standing beside three adoption candidates. One silhouette is scratched away.",
    flag: "found-old-photo",
    choices: [
      {
        label: "Preserve it privately",
        text: "The alien gains a protected memory and a little trust.",
        effects: { trust: 4, clue: 1, flag: "private-photo" }
      },
      {
        label: "Ask the market brokers",
        text: "Rumors move quickly, bringing reputation and unwanted attention.",
        effects: { reputation: 4, faction: { glasshouse: -1, mothChoir: 1 }, flag: "market-photo-rumor" }
      }
    ]
  },
  {
    id: "rival-smile",
    title: "Rival Interest",
    body: "A Glasshouse attorney congratulates you on your license recovery and asks too carefully whether your alien remembers water.",
    flag: "glasshouse-notice",
    choices: [
      {
        label: "Refuse politely",
        text: "The agency looks principled, and Glasshouse marks you as difficult.",
        effects: { reputation: 3, trust: 3, faction: { glasshouse: -2 }, flag: "refused-glasshouse" }
      },
      {
        label: "Trade harmless records",
        text: "You gain operating funds while keeping the sealed records back.",
        effects: { credits: 60, data: -4, trust: -1, faction: { glasshouse: 1 }, flag: "traded-harmless-records" }
      }
    ]
  },
  {
    id: "chapter-two",
    title: "The False Stamp Has a Source",
    body: "The restored records terminal links the repeated stamp to an adoption transfer office that closed before your alien was born.",
    flag: "chapter-two-opened",
    requires: { chapter: 2 },
    choices: [
      {
        label: "Trace the closed office",
        text: "The lead is expensive, but it produces another origin clue.",
        effects: { data: -6, clue: 1, flag: "traced-closed-office" }
      },
      {
        label: "Publicize the inconsistency",
        text: "The agency gains reputation while rivals move to control the story.",
        effects: { reputation: 7, stress: 4, faction: { glasshouse: -1, redCrest: 1 }, flag: "public-false-stamp" }
      }
    ]
  },
  {
    id: "memory-protection",
    title: "Archive Ethics",
    body: "The Memory Archive asks whether recovered memories should be evidence, inheritance, or private pain. Your alien waits for your answer before entering.",
    flag: "archive-ethics",
    requires: { completedProject: "memory-archive" },
    choices: [
      {
        label: "Let the alien decide",
        text: "Trust rises sharply, and the archive marks consent as agency policy.",
        effects: { trust: 9, reputation: 3, flag: "alien-owns-memories" }
      },
      {
        label: "Seal copies for evidence",
        text: "You gain research leverage, but the choice carries emotional weight.",
        effects: { data: 18, stress: 7, trust: -4, flag: "evidence-memory-copies" }
      }
    ]
  },
  {
    id: "casework-backlog",
    title: "The Backlog Breathes",
    body: "The new casework board fills with names faster than anyone expected. One column has only your alien's old transfer code and a question mark.",
    flag: "casework-backlog-opened",
    requires: { completedProject: "casework-board" },
    choices: [
      {
        label: "Prioritize living cases",
        text: "The agency earns public trust by helping the files that can still answer back.",
        effects: { reputation: 5, trust: 3, flag: "living-cases-first" }
      },
      {
        label: "Trace the question mark",
        text: "The mystery deepens, but the agency gains data and another uneasy thread.",
        effects: {
          data: 12,
          stress: 3,
          memory: {
            title: "Question Mark File",
            text: "{alien} watched the casework board until the old transfer code stopped looking like a number and started looking like a door."
          },
          flag: "traced-question-mark"
        }
      }
    ]
  },
  {
    id: "kitchen-night",
    title: "Dinner That Works",
    body: "The comfort kitchen finally produces a meal your alien recognizes as food. The office gets quiet in the good way.",
    flag: "kitchen-night",
    requires: { completedProject: "comfort-kitchen" },
    choices: [
      {
        label: "Make it a private ritual",
        text: "Trust and morale rise around a habit no inspector can turn into policy.",
        effects: { trust: 7, morale: 8, stress: -6, flag: "private-dinner-ritual" }
      },
      {
        label: "Invite the neighborhood",
        text: "The agency becomes harder to dismiss when people have eaten at its table.",
        effects: { reputation: 8, credits: 35, faction: { mothChoir: 1 }, flag: "neighborhood-table" }
      }
    ]
  },
  {
    id: "field-kit-audit",
    title: "The Field Kit Audit",
    body: "Before the next wreck expedition, your alien quietly replaces the agency's emergency tags with ones that include names, not specimen numbers.",
    flag: "field-kit-audit",
    requires: { completedProject: "field-kit-cache" },
    choices: [
      {
        label: "Adopt the change officially",
        text: "The agency records the naming rule as field policy.",
        effects: { reputation: 6, trust: 5, faction: { glasshouse: -1 }, flag: "names-not-numbers" }
      },
      {
        label: "Let it stay unofficial",
        text: "The kits remain flexible, and the agency saves materials for rougher work.",
        effects: { salvage: 18, data: 8, trust: 2, flag: "quiet-field-rule" }
      }
    ]
  },
  {
    id: "moon-signal",
    title: "A Signal From the Forbidden Moon",
    body: "The comms array records a seven-second transmission addressed to your adoption license, not your agency. It says: return the child with the borrowed sky.",
    flag: "moon-signal",
    requires: { chapter: 3 },
    choices: [
      {
        label: "Answer with your agency name",
        text: "You define the agency as the alien's protector before the signal can define you.",
        effects: { trust: 6, reputation: 6, faction: { mothChoir: 1 }, flag: "answered-as-agency" }
      },
      {
        label: "Stay silent and triangulate",
        text: "The signal remains unaware, but the silence unsettles your alien.",
        effects: { clue: 1, data: 14, stress: 6, flag: "silent-triangulation" }
      }
    ]
  },
  {
    id: "origin-hearing-finale",
    title: "The Origin Hearing",
    body: "The hearing chamber fills with rival directors, researchers, clerks, and one quiet alien whose file started all of this. The record asks for a final agency position.",
    flag: "origin-hearing-held",
    requires: { flag: "origin-hearing-ready" },
    choices: [
      {
        label: "Protect the alien's private truth",
        text: "The agency becomes a sanctuary. Some factions leave angry, but your alien does not.",
        effects: {
          trust: 12,
          reputation: 8,
          faction: { glasshouse: -4, mothChoir: 2 },
          flag: "ending-protector-agency",
          ending: {
            id: "protector-agency",
            title: "Protector Agency",
            text: "The agency is known as the office that refused to turn a living origin into property."
          }
        }
      },
      {
        label: "Create an ethical research compact",
        text: "The alien keeps consent rights while the agency becomes a model for careful xenobiology.",
        effects: {
          data: 40,
          reputation: 18,
          trust: 5,
          faction: { mothChoir: 3, glasshouse: 1 },
          flag: "ending-research-compact",
          ending: {
            id: "research-compact",
            title: "Research Compact",
            text: "The agency proves that research can serve the alien first and the galaxy second."
          }
        }
      },
      {
        label: "Claim institutional authority",
        text: "The registry bends. Rivals hesitate. Your alien watches the agency become powerful and difficult to trust.",
        effects: {
          reputation: 30,
          credits: 200,
          trust: -10,
          stress: 8,
          faction: { glasshouse: 3, redCrest: 2, mothChoir: -2 },
          flag: "ending-feared-institution",
          ending: {
            id: "feared-institution",
            title: "Feared Institution",
            text: "The agency survives by becoming too useful, too famous, and too dangerous to close."
          }
        }
      }
    ]
  }
];

let game = null;
let activeView = "home";
let draft = null;
let modal = null;
let toast = "";
let lastRenderAt = 0;

const app = document.querySelector("#app");

const clock = {
  now: () => Date.now(),
  dateKey(timestamp = Date.now()) {
    const date = new Date(timestamp);
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${date.getFullYear()}-${month}-${day}`;
  },
  elapsed(from, to = Date.now()) {
    return Math.max(0, to - from);
  }
};

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function sanitizeName(value, fallback) {
  const clean = String(value || "")
    .replace(/[^\p{L}\p{N}\s.'-]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 22);
  return clean || fallback;
}

function uid(prefix = "id") {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}`;
}

function hashString(text) {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed) {
  let value = seed >>> 0;
  return function random() {
    value += 0x6d2b79f5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function rngFrom(...parts) {
  return mulberry32(hashString(parts.join(":")));
}

function pick(random, values) {
  return values[Math.floor(random() * values.length)];
}

function campaignMotifForSeed(seed = "campaign") {
  const random = rngFrom(seed, "motif");
  return pick(random, CAMPAIGN_MOTIFS);
}

function campaignMotif(state = game) {
  return CAMPAIGN_MOTIFS.find((entry) => entry.id === state.world.campaignState.motif) || campaignMotifForSeed(state.meta.campaignSeed);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function fmtDuration(ms) {
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return rest ? `${minutes}m ${rest}s` : `${minutes}m`;
}

function pct(current, max = 100) {
  return `${clamp((current / max) * 100, 0, 100).toFixed(0)}%`;
}

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(SAVE_STORE)) db.createObjectStore(SAVE_STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function dbGet(key) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SAVE_STORE, "readonly");
    const request = tx.objectStore(SAVE_STORE).get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function dbSet(key, value) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SAVE_STORE, "readwrite");
    tx.objectStore(SAVE_STORE).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function dbDelete(key) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SAVE_STORE, "readwrite");
    tx.objectStore(SAVE_STORE).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function loadSave() {
  const save = await withTimeout(dbGet(CURRENT_KEY), 800).catch(() => null);
  const indexed = tryMigrateSave(save, "IndexedDB save");
  if (indexed) return indexed;
  const backupText = localStorage.getItem(BACKUP_KEY);
  if (!save && !backupText) {
    localStorage.removeItem(LOAD_ERROR_KEY);
    return null;
  }
  const backup = parseStoredSave(backupText, "local backup");
  return tryMigrateSave(backup, "local backup");
}

async function saveGame() {
  if (!game) return;
  game.meta.updatedAt = clock.now();
  localStorage.setItem(BACKUP_KEY, JSON.stringify(game));
  localStorage.removeItem(LOAD_ERROR_KEY);
  await withTimeout(dbSet(CURRENT_KEY, game), 1200).catch(() => {});
}

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Timed out")), ms);
    })
  ]);
}

function recordLoadError(source, error) {
  const message = error?.message || String(error || "Unknown save error");
  localStorage.setItem(LOAD_ERROR_KEY, `${source}: ${message}`);
}

function parseStoredSave(text, source) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (error) {
    recordLoadError(source, new Error("stored save JSON is not readable"));
    return null;
  }
}

function tryMigrateSave(save, source) {
  if (!save) return null;
  try {
    const migrated = migrateSave(save);
    localStorage.removeItem(LOAD_ERROR_KEY);
    return migrated;
  } catch (error) {
    recordLoadError(source, error);
    return null;
  }
}

function validateSaveShape(save) {
  if (!save || typeof save !== "object" || Array.isArray(save)) throw new Error("Save file is not a readable object.");
  if (!save.meta || typeof save.meta !== "object") throw new Error("Save file is missing metadata.");
  if (!save.alien || typeof save.alien !== "object") throw new Error("Save file is missing alien data.");
  if (!save.alien.identity || typeof save.alien.identity !== "object") throw new Error("Save file is missing alien identity.");
  if (!save.agency || typeof save.agency !== "object") throw new Error("Save file is missing agency data.");
  if (!save.meta.saveId) throw new Error("Save file is missing a save ID.");
  if (!save.alien.identity.name) throw new Error("Save file is missing an alien name.");
  if (!save.agency.name) throw new Error("Save file is missing an agency name.");
}

function ensureObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

function ensureNumber(value, fallback, min = -Infinity, max = Infinity) {
  const number = Number(value);
  return clamp(Number.isFinite(number) ? number : fallback, min, max);
}

function migrateSave(save) {
  validateSaveShape(save);
  const now = clock.now();
  save.meta = ensureObject(save.meta);
  save.meta.schemaVersion = SCHEMA_VERSION;
  save.meta.gameVersion = GAME_VERSION;
  save.meta.createdAt = ensureNumber(save.meta.createdAt, now, 0);
  save.meta.updatedAt = ensureNumber(save.meta.updatedAt, save.meta.createdAt, 0);
  save.meta.lastProcessedAt = ensureNumber(save.meta.lastProcessedAt, save.meta.updatedAt, 0);
  save.meta.campaignSeed ||= save.meta.saveId;
  save.player = ensureObject(save.player);
  save.player.displayName ||= "Director";
  save.player.settings = { detailedOdds: false, motion: "full", ...ensureObject(save.player.settings) };
  save.player.discoveredTutorials = ensureArray(save.player.discoveredTutorials);
  save.alien = ensureObject(save.alien);
  save.alien.identity = ensureObject(save.alien.identity);
  save.alien.identity.id ||= uid("alien");
  save.alien.identity.pronouns ||= "they";
  save.alien.identity.age ||= "uncertain adult";
  save.alien.appearance ||= {};
  save.alien.appearance = ensureObject(save.alien.appearance);
  if (!save.alien.appearance.portraitSrc) {
    const portrait = PORTRAIT_LIBRARY[Math.abs(hashString(save.alien.identity?.id || save.meta.saveId)) % PORTRAIT_LIBRARY.length];
    save.alien.appearance.portraitId = portrait.id;
    save.alien.appearance.portraitCode = portrait.code;
    save.alien.appearance.portraitSrc = portrait.src;
    save.alien.appearance.accent = portrait.accent;
  }
  save.alien.appearance.bodyPlan ||= "Humanoid";
  save.alien.appearance.surface ||= "unknown surface";
  save.alien.appearance.palette ||= "teal and bone";
  save.alien.appearance.idle ||= "watches the office";
  save.alien.speciesProfile = { ...generateSpecies(rngFrom(save.meta.saveId, "fallback-species")), ...ensureObject(save.alien.speciesProfile) };
  save.alien.personality = {
    temperament: "Curious",
    positiveTraits: ["Patient", "Observant"],
    difficultTrait: "Startles easily",
    hiddenFear: "medical lamps",
    preference: "old paper records",
    aversion: "blank forms",
    ...ensureObject(save.alien.personality)
  };
  save.alien.personality.positiveTraits = ensureArray(save.alien.personality.positiveTraits).slice(0, 3);
  if (!save.alien.personality.positiveTraits.length) save.alien.personality.positiveTraits = ["Patient"];
  save.alien.stats = ensureObject(save.alien.stats);
  Object.keys(STAT_LABELS).forEach((stat) => {
    save.alien.stats[stat] = ensureNumber(save.alien.stats[stat], 5, 1, 12);
  });
  save.alien.needs = ensureObject(save.alien.needs);
  Object.entries({ vitality: 70, nourishment: 65, morale: 60, stress: 20, health: 100, trust: 42 }).forEach(([need, fallback]) => {
    save.alien.needs[need] = ensureNumber(save.alien.needs[need], fallback, 0, 100);
  });
  save.alien.skills = { Athletics: 1, Engineering: 1, Xenobiology: 1, Scavenging: 1, Diplomacy: 1, Stealth: 1, Navigation: 1, Combat: 1, Psionics: 0, Performance: 1, Survival: 1, Investigation: 1, ...ensureObject(save.alien.skills) };
  Object.keys(save.alien.skills).forEach((skill) => {
    save.alien.skills[skill] = ensureNumber(save.alien.skills[skill], 0, 0, 99);
  });
  save.alien.traits = ensureArray(save.alien.traits);
  save.alien.conditions = ensureArray(save.alien.conditions);
  save.alien.equipment = { body: null, focus: null, charm: null, ...ensureObject(save.alien.equipment) };
  save.alien.relationships = { playerTrust: save.alien.needs.trust, glasshouse: 0, redCrest: 0, mothChoir: 0, ...ensureObject(save.alien.relationships) };
  save.alien.relationships.playerTrust = save.alien.needs.trust;
  save.alien.memories = ensureArray(save.alien.memories);
  if (!save.alien.memories.length) addMemory(save, "Adoption Day", `${save.alien.identity.name} arrived at ${save.agency.name}.`);
  save.alien.mutationState = { instability: 8, consentProtocol: "unwritten", anomaly: "unknown marker", ...ensureObject(save.alien.mutationState) };
  save.alien.progression = { level: 1, xp: 0, nextLevelXp: 100, skillPoints: 0, ...ensureObject(save.alien.progression) };
  save.alien.progression.level = ensureNumber(save.alien.progression.level, 1, 1, 99);
  save.alien.progression.xp = ensureNumber(save.alien.progression.xp, 0, 0);
  save.alien.progression.nextLevelXp = ensureNumber(save.alien.progression.nextLevelXp, 100, 1);
  save.alien.progression.skillPoints = ensureNumber(save.alien.progression.skillPoints, 0, 0);
  save.alien.activityState = { favoriteActivity: save.alien.personality.preference, resistedCategory: "Medical", ...ensureObject(save.alien.activityState) };
  save.agency = ensureObject(save.agency);
  save.agency.level = ensureNumber(save.agency.level, 1, 1, 99);
  save.agency.reputation = ensureNumber(save.agency.reputation, 5, 0);
  save.agency.credits = ensureNumber(save.agency.credits, 0, 0);
  save.agency.data = ensureNumber(save.agency.data, 0, 0);
  save.agency.salvage = ensureNumber(save.agency.salvage, 0, 0);
  save.agency.licenseLevel = ensureNumber(save.agency.licenseLevel, save.agency.level, 1, 99);
  save.agency.facilities = {
    "Alien Habitat": { level: 1, comfort: 0 },
    "Training Room": { level: 1 },
    "Medical Bay": { level: 1 },
    "Records Terminal": { level: 0 },
    Storage: { level: 1 },
    "Operations Desk": { level: 1 },
    ...ensureObject(save.agency.facilities)
  };
  Object.values(save.agency.facilities).forEach((facility) => {
    facility.level = ensureNumber(facility.level, 1, 0, 99);
    if ("comfort" in facility) facility.comfort = ensureNumber(facility.comfort, 0, 0, 99);
  });
  save.agency.staff = ensureArray(save.agency.staff);
  save.agency.research = { activeTopics: [], completed: [], clues: 0, ...ensureObject(save.agency.research) };
  save.agency.research.activeTopics = ensureArray(save.agency.research.activeTopics);
  save.agency.research.completed = ensureArray(save.agency.research.completed);
  save.agency.research.clues = ensureNumber(save.agency.research.clues, 0, 0);
  save.agency.contracts = ensureArray(save.agency.contracts);
  save.agency.upgrades = ensureArray(save.agency.upgrades);
  save.agency.legacyArchive ||= [];
  save.agency.legacyArchive = ensureArray(save.agency.legacyArchive);
  save.world = ensureObject(save.world);
  save.world.unlockedLocations = ensureArray(save.world.unlockedLocations);
  if (!save.world.unlockedLocations.length) save.world.unlockedLocations = ["office", "arena"];
  save.world.locationStates = ensureObject(save.world.locationStates);
  save.world.factionStates = {
    glasshouse: { standing: -2, attention: 2 },
    redCrest: { standing: 0, attention: 1 },
    mothChoir: { standing: 1, attention: 0 },
    ...ensureObject(save.world.factionStates)
  };
  save.world.rivalStates = ensureArray(save.world.rivalStates);
  if (!save.world.rivalStates.length) save.world.rivalStates = RIVALS.map((rival) => ({ ...rival, level: 1, wins: 0 }));
  save.world.shopStates = { dateKey: clock.dateKey(now), inventory: [], ...ensureObject(save.world.shopStates) };
  save.world.shopStates.inventory = ensureArray(save.world.shopStates.inventory);
  save.events = { pending: [], completed: [], flags: [], cooldowns: {}, ...ensureObject(save.events) };
  save.events.pending = ensureArray(save.events.pending);
  save.events.completed = ensureArray(save.events.completed);
  save.events.flags = ensureArray(save.events.flags);
  save.events.cooldowns = ensureObject(save.events.cooldowns);
  save.statistics = { lifetimeTotals: {}, campaignTotals: {}, ...ensureObject(save.statistics) };
  save.statistics.lifetimeTotals = { activities: 0, creditsEarned: 0, ...ensureObject(save.statistics.lifetimeTotals) };
  save.statistics.campaignTotals = { activities: 0, projects: 0, ...ensureObject(save.statistics.campaignTotals) };
  save.inventory = { itemStacks: {}, uniqueItems: [], capacity: 18, ...ensureObject(save.inventory) };
  save.inventory.itemStacks = ensureObject(save.inventory.itemStacks);
  save.inventory.uniqueItems = ensureArray(save.inventory.uniqueItems);
  save.inventory.capacity = ensureNumber(save.inventory.capacity, 18, 1, 99);
  save.missions = { available: [], active: [], completed: [], history: [], ...ensureObject(save.missions) };
  save.missions.available = ensureArray(save.missions.available);
  save.missions.active = ensureArray(save.missions.active);
  save.missions.completed = ensureArray(save.missions.completed);
  save.missions.history = ensureArray(save.missions.history);
  save.timers = { alienActivity: null, agencyProject: null, ...ensureObject(save.timers) };
  save.logs = { recentActivity: [], importantHistory: [], ...ensureObject(save.logs) };
  save.logs.recentActivity = ensureArray(save.logs.recentActivity);
  save.logs.importantHistory = ensureArray(save.logs.importantHistory);
  save.world.campaignState ||= { chapter: 1, flags: [], originClues: 0 };
  save.world.campaignState = ensureObject(save.world.campaignState);
  save.world.campaignState.chapter ||= 1;
  save.world.campaignState.chapter = ensureNumber(save.world.campaignState.chapter, 1, 1, 3);
  save.world.campaignState.flags ||= [];
  save.world.campaignState.flags = ensureArray(save.world.campaignState.flags);
  save.world.campaignState.originClues ||= save.agency.research?.clues || 0;
  save.world.campaignState.originClues = ensureNumber(save.world.campaignState.originClues, save.agency.research.clues, 0);
  save.world.campaignState.ending ||= null;
  save.world.campaignState.motif ||= campaignMotifForSeed(save.meta.campaignSeed).id;
  save.world.campaignState.completedAt ||= null;
  save.world.campaignState.legacyArchived ||= false;
  save.world.dailyState = { dateKey: clock.dateKey(now), seed: hashString(`${save.meta.campaignSeed}:${clock.dateKey(now)}`), ...ensureObject(save.world.dailyState) };
  save.achievements = { unlocked: [], progress: {}, ...ensureObject(save.achievements) };
  save.achievements.unlocked = ensureArray(save.achievements.unlocked);
  save.achievements.progress ||= {};
  save.achievements.progress = ensureObject(save.achievements.progress);
  save.achievements.progress.activities ||= 0;
  save.achievements.progress.arenaWins ||= 0;
  save.achievements.progress.projects ||= 0;
  save.achievements.progress.clues ||= 0;
  return save;
}

function generateSpecies(random) {
  const species = `${pick(random, SPECIES_SYLLABLES.start)}${pick(random, SPECIES_SYLLABLES.mid)}${pick(random, SPECIES_SYLLABLES.end)}`;
  return {
    name: species,
    homeEnvironment: pick(random, ["tidal glass reefs", "warm mineral caverns", "orbital gardens", "dark comet rivers", "rust forests"]),
    diet: pick(random, ["mineral infusion", "photosynthetic snacking", "fermented starch", "charged vapor", "soft metals"]),
    sleep: pick(random, ["brief polyphasic naps", "moon-cycle torpor", "silent standing sleep", "thermal basking", "rare dream storms"]),
    social: pick(random, ["small clutch-bonds", "formal apprenticeships", "seasonal choirs", "wandering pairs", "adoptive houses"]),
    communication: pick(random, ["gesture pulses", "tonal clicks", "color shifts", "magnetic taps", "borrowed speech"]),
    advantage: pick(random, ["reads old machine residue", "recovers quickly from falls", "senses concealed doors", "stays calm in vacuum alarms"]),
    weakness: pick(random, ["low tolerance for citrus aerosols", "dislikes mirrored rooms", "startles near medical lamps", "wilts in dry heat"]),
    misconception: pick(random, ["often mistaken for a pet species", "believed to be emotionless by officials", "rumored to steal weather"]),
    uncertainty: pick(random, ["no one agrees how they hatch", "their migration records were deleted", "their oldest songs mention Earth"])
  };
}

function generateCandidate(seed, index) {
  const random = rngFrom(seed, "candidate", index);
  const portraitStart = hashString(`${seed}:portrait`) % PORTRAIT_LIBRARY.length;
  const portrait = PORTRAIT_LIBRARY[(portraitStart + index * 5) % PORTRAIT_LIBRARY.length];
  const statNames = Object.keys(STAT_LABELS);
  const stats = {};
  statNames.forEach((stat) => {
    stats[stat] = 3 + Math.floor(random() * 4);
  });
  const strong = pick(random, statNames);
  stats[strong] = Math.min(8, stats[strong] + 2);
  const temperament = pick(random, TEMPERAMENTS);
  const positive = [pick(random, POSITIVE_TRAITS), pick(random, POSITIVE_TRAITS)].filter((item, pos, arr) => arr.indexOf(item) === pos);
  while (positive.length < 2) positive.push(pick(random, POSITIVE_TRAITS));
  const species = generateSpecies(random);
  return {
    id: `candidate-${index + 1}-${hashString(`${seed}-${index}`).toString(36)}`,
    code: portrait.code,
    registryCode: `UN-${Math.floor(1000 + random() * 8999)}-${String.fromCharCode(65 + index)}`,
    portrait,
    suggestedName: pick(random, NAME_POOL),
    pronouns: pick(random, ["they", "it", "she", "he"]),
    age: pick(random, ["juvenile", "young adult", "uncertain adult", "recently decanted"]),
    bodyPlan: pick(random, BODY_PLANS),
    surface: pick(random, ["pearl shell", "soft vapor", "velvet skin", "mineral plates", "furred moss", "warm ceramic"]),
    palette: pick(random, ["teal and bone", "gold and ink", "coral and smoke", "blue and umber", "jade and silver"]),
    temperament,
    traits: {
      positive,
      difficult: pick(random, DIFFICULT_TRAITS),
      hiddenFear: pick(random, FEARS),
      preference: pick(random, PREFERENCES),
      aversion: pick(random, AVERSIONS)
    },
    aptitude: STAT_LABELS[strong],
    visibleNeed: pick(random, ["low nourishment", "high curiosity", "fragile trust", "restlessness", "medical follow-up"]),
    observation: pick(random, [
      "Watches the exit signs but relaxes when spoken to softly.",
      "Stacks forms by color, then pretends it was an accident.",
      "Hums at broken machines until they answer with error lights.",
      "Refuses the official toy and keeps the shipping tag instead.",
      "Touches the sealed research file every time staff look away."
    ]),
    originRecord: pick(random, [
      "Origin registry damaged during transfer.",
      "Home environment listed as classified by an obsolete court.",
      "Previous caretaker field is blank but signed.",
      "Genetic scan conflicts with its listed species group."
    ]),
    species,
    stats,
    hidden: {
      anomaly: pick(random, ["echo gene", "moon-salt mutation", "synthetic dream tissue", "legacy marker"]),
      originFaction: pick(random, ["Glasshouse Directorate", "Moth Choir Bureau", "Old Director Network", "Unknown Lunar Custody"]),
      mutationPotential: Math.floor(2 + random() * 5),
      loyaltyModifier: Number((random() * 0.4 + 0.8).toFixed(2)),
      rareTraitChance: Number((random() * 0.18 + 0.05).toFixed(2)),
      campaignConnection: pick(random, ["sealed file", "forbidden moon", "human zone", "missing director"]),
      secretMemory: pick(random, ["water behind glass", "a song in a lift", "three red stamps", "a room without corners"])
    }
  };
}

function createNewGame({ agencyName, directorName, alienName, pronouns, candidate, campaignSeed }) {
  const now = clock.now();
  const saveId = uid("save");
  const random = rngFrom(campaignSeed, candidate.id, "new-save");
  const alienId = uid("alien");
  return {
    meta: {
      saveId,
      saveName: agencyName,
      schemaVersion: SCHEMA_VERSION,
      gameVersion: GAME_VERSION,
      createdAt: now,
      updatedAt: now,
      campaignSeed,
      lastProcessedAt: now
    },
    player: {
      displayName: directorName,
      settings: { detailedOdds: false, motion: "full" },
      discoveredTutorials: ["adoption"]
    },
    alien: {
      identity: {
        id: alienId,
        name: alienName,
        pronouns,
        age: candidate.age
      },
      appearance: {
        bodyPlan: candidate.bodyPlan,
        surface: candidate.surface,
        palette: candidate.palette,
        portraitId: candidate.portrait.id,
        portraitCode: candidate.portrait.code,
        portraitSrc: candidate.portrait.src,
        accent: candidate.portrait.accent,
        idle: pick(random, ["tilts toward voices", "counts dust motes", "hums through its hands", "pretends not to listen"])
      },
      speciesProfile: candidate.species,
      personality: {
        temperament: candidate.temperament,
        positiveTraits: candidate.traits.positive,
        difficultTrait: candidate.traits.difficult,
        hiddenFear: candidate.traits.hiddenFear,
        preference: candidate.traits.preference,
        aversion: candidate.traits.aversion
      },
      stats: candidate.stats,
      needs: {
        vitality: 72,
        nourishment: 68,
        morale: 62,
        stress: 18,
        health: 100,
        trust: 42
      },
      skills: {
        Athletics: 1,
        Engineering: 1,
        Xenobiology: 1,
        Scavenging: 1,
        Diplomacy: 1,
        Stealth: 1,
        Navigation: 1,
        Combat: 1,
        Psionics: 0,
        Performance: 1,
        Survival: 1,
        Investigation: 1
      },
      traits: [...candidate.traits.positive, candidate.traits.difficult],
      conditions: [],
      equipment: { body: null, focus: null, charm: null },
      relationships: { playerTrust: 42, glasshouse: 0, redCrest: 0, mothChoir: 0 },
      memories: [
        {
          id: "adoption-day",
          title: "Adoption Day",
          text: `${alienName} chose the office corner with the warmest floor vent and watched the other candidates depart.`,
          at: now
        }
      ],
      mutationState: {
        instability: 8 + candidate.hidden.mutationPotential,
        consentProtocol: "unwritten",
        anomaly: candidate.hidden.anomaly
      },
      progression: {
        level: 1,
        xp: 0,
        nextLevelXp: 100,
        skillPoints: 0
      },
      activityState: { favoriteActivity: candidate.traits.preference, resistedCategory: "Medical" }
    },
    agency: {
      name: agencyName,
      level: 1,
      reputation: 5,
      credits: 120,
      data: 12,
      salvage: 6,
      licenseLevel: 1,
      facilities: {
        "Alien Habitat": { level: 1, comfort: 0 },
        "Training Room": { level: 1 },
        "Medical Bay": { level: 1 },
        "Records Terminal": { level: 0 },
        Storage: { level: 1 },
        "Operations Desk": { level: 1 }
      },
      staff: [],
      research: { activeTopics: [], completed: [], clues: 0 },
      contracts: [],
      upgrades: [],
      legacyArchive: []
    },
    world: {
      unlockedLocations: ["office", "arena"],
      locationStates: {},
      factionStates: {
        glasshouse: { standing: -2, attention: 2 },
        redCrest: { standing: 0, attention: 1 },
        mothChoir: { standing: 1, attention: 0 }
      },
      rivalStates: RIVALS.map((rival) => ({ ...rival, level: 1, wins: 0 })),
      shopStates: { dateKey: clock.dateKey(now), inventory: [] },
      campaignState: { chapter: 1, flags: [], originClues: 0, motif: campaignMotifForSeed(campaignSeed).id },
      dailyState: { dateKey: clock.dateKey(now), seed: hashString(`${campaignSeed}:${clock.dateKey(now)}`) }
    },
    inventory: {
      itemStacks: { "mineral-tea": 1 },
      uniqueItems: [],
      capacity: 18
    },
    missions: {
      available: ["balance-drills", "logic-feeder", "quiet-rest", "sealed-records"],
      active: [],
      completed: [],
      history: []
    },
    events: {
      pending: [STORY_EVENTS[0]],
      completed: [],
      flags: [],
      cooldowns: {}
    },
    achievements: {
      unlocked: [],
      progress: { activities: 0, arenaWins: 0, projects: 0, clues: 0 }
    },
    statistics: {
      lifetimeTotals: { activities: 0, creditsEarned: 0 },
      campaignTotals: { activities: 0, projects: 0 }
    },
    timers: {
      alienActivity: null,
      agencyProject: null
    },
    logs: {
      recentActivity: [
        {
          title: "Keys Transferred",
          text: `${directorName} inherited ${agencyName}, a damaged license, and one warning: do not trust official records.`,
          at: now
        }
      ],
      importantHistory: []
    }
  };
}

function processOffline(state) {
  const now = clock.now();
  const elapsed = clock.elapsed(state.meta.lastProcessedAt, now);
  if (elapsed < 1000) return false;
  const previousDateKey = clock.dateKey(state.meta.lastProcessedAt);
  const currentDateKey = clock.dateKey(now);
  const minutes = elapsed / 60_000;
  const comfort = state.agency.facilities["Alien Habitat"]?.comfort || 0;
  state.alien.needs.vitality = clamp(state.alien.needs.vitality + minutes * (2.1 + comfort * 0.3), 0, 100);
  state.alien.needs.stress = clamp(state.alien.needs.stress - minutes * 0.45, 0, 100);
  state.alien.needs.morale = clamp(state.alien.needs.morale + minutes * 0.2, 0, 100);
  state.alien.needs.nourishment = Math.max(35, state.alien.needs.nourishment - minutes * 0.05);
  const incomeTicks = Math.floor(elapsed / 600_000);
  if (incomeTicks > 0) {
    const credits = incomeTicks * (8 + state.agency.level * 3);
    state.agency.credits += credits;
    state.statistics.lifetimeTotals.creditsEarned += credits;
    addLog(state, "Agency Income", `While you were away, local contracts produced ${credits} credits.`);
  }
  if (previousDateKey !== currentDateKey) simulateDailyRivals(state, currentDateKey);
  state.meta.lastProcessedAt = now;
  return processTimers(state) || elapsed > 60_000;
}

function simulateDailyRivals(state, dateKey) {
  const random = rngFrom(state.meta.campaignSeed, dateKey, "rivals");
  state.world.rivalStates.forEach((rival) => {
    const gain = 1 + Math.floor(random() * (state.agency.level + 2));
    rival.reputation += gain;
    if (rival.reputation >= rival.level * 18) rival.level += 1;
  });
  state.world.dailyState = { dateKey, seed: hashString(`${state.meta.campaignSeed}:${dateKey}`) };
  addLog(state, "Rivals Moved", "Other agencies advanced their own agendas while your office lights were out.");
}

function processTimers(state) {
  let changed = false;
  const now = clock.now();
  ["alienActivity", "agencyProject"].forEach((slot) => {
    const timer = state.timers[slot];
    if (!timer || timer.endsAt > now) return;
    if (slot === "alienActivity") resolveActivity(state, timer);
    if (slot === "agencyProject") resolveProject(state, timer);
    state.timers[slot] = null;
    changed = true;
  });
  if (changed) {
    maybeTriggerStory(state);
    updateAchievements(state);
    state.meta.lastProcessedAt = now;
  }
  return changed;
}

function addLog(state, title, text, important = false) {
  const entry = { title, text, at: clock.now() };
  state.logs.recentActivity.unshift(entry);
  state.logs.recentActivity = state.logs.recentActivity.slice(0, 8);
  if (important) state.logs.importantHistory.unshift(entry);
}

function addMemory(state, title, text) {
  if (state.alien.memories.some((memory) => memory.title === title)) return;
  state.alien.memories.unshift({ id: uid("memory"), title, text, at: clock.now() });
  state.alien.memories = state.alien.memories.slice(0, 12);
}

function getEquipmentBonus(state, stat) {
  return Object.values(state.alien.equipment).reduce((total, itemId) => {
    const item = SHOP_ITEMS.find((entry) => entry.id === itemId);
    return total + (item?.bonus?.[stat] || 0);
  }, 0);
}

function facilityBonusForActivity(state, activity) {
  const facilities = state.agency.facilities || {};
  let bonus = 0;
  if (["Work", "Investigation"].includes(activity.category)) bonus += Math.min(1, facilities["Casework Board"]?.level || 0);
  if (activity.category === "Training") bonus += Math.max(0, (facilities["Training Room"]?.level || 0) - 1);
  if (activity.category === "Rest") bonus += Math.min(1, facilities["Comfort Kitchen"]?.level || 0);
  if (["Study", "Medical"].includes(activity.category) || activity.location === "research") {
    bonus += Math.min(2, facilities["Research Laboratory"]?.level || 0);
  }
  if (activity.category === "Social" || ["market", "observation"].includes(activity.location)) {
    bonus += Math.min(2, facilities["Diplomatic Lounge"]?.level || 0);
  }
  if (activity.category === "Expedition" || ["wreck", "moon"].includes(activity.location)) {
    bonus += Math.min(2, facilities["Expedition Hangar"]?.level || 0);
    bonus += Math.min(1, facilities["Field Kit Cache"]?.level || 0);
  }
  if (activity.id === "memory-archive-session") bonus += Math.min(2, facilities["Memory Archive"]?.level || 0);
  return bonus;
}

function activityContext(activity) {
  return [activity.id, activity.name, activity.category, activity.skill, activity.location, activity.report].filter(Boolean).join(" ").toLowerCase();
}

function activityMatchesPreference(preference = "", activity) {
  const text = activityContext(activity);
  const value = preference.toLowerCase();
  if (value.includes("record")) return text.includes("record") || text.includes("casework") || text.includes("archive");
  if (value.includes("puzzle")) return ["Study", "Investigation"].includes(activity.category) || text.includes("logic");
  if (value.includes("engine")) return ["Engineering", "Navigation"].includes(activity.skill) || text.includes("wreck");
  if (value.includes("market music")) return activity.location === "market" || activity.category === "Social";
  if (value.includes("blue light")) return ["Rest", "Study"].includes(activity.category) || activity.location === "moon";
  if (value.includes("mineral tea")) return ["Rest", "Medical"].includes(activity.category) || text.includes("kitchen");
  return false;
}

function activityTouchesFear(fear = "", activity) {
  const text = activityContext(activity);
  const value = fear.toLowerCase();
  if (value.includes("sonar")) return activity.category === "Expedition" || text.includes("beacon") || text.includes("signal");
  if (value.includes("locked white rooms")) return activity.category === "Medical" || activity.location === "research";
  if (value.includes("official uniforms")) return activity.category === "Social" || text.includes("registry") || text.includes("hearing");
  if (value.includes("mirror glass")) return activity.location === "observation" || activity.category === "Medical";
  if (value.includes("static thunder")) return activity.location === "wreck" || activity.location === "moon" || text.includes("signal");
  if (value.includes("medical lamps")) return activity.category === "Medical" || text.includes("scan");
  return false;
}

function activityTouchesAversion(aversion = "", activity) {
  const text = activityContext(activity);
  const value = aversion.toLowerCase();
  if (value.includes("sharp citrus")) return text.includes("food") || text.includes("kitchen") || text.includes("gel");
  if (value.includes("arena crowds")) return activity.location === "arena" || text.includes("arena");
  if (value.includes("blank forms")) return text.includes("registry") || text.includes("casework") || text.includes("forms");
  if (value.includes("wet gloves")) return activity.category === "Medical";
  if (value.includes("sleep sirens")) return activity.category === "Rest" && activity.location !== "moon";
  if (value.includes("polished floors")) return activity.location === "research" || activity.category === "Social";
  return false;
}

function personalityScoreBonus(state, activity) {
  const traits = state.alien.personality.positiveTraits || [];
  const difficult = state.alien.personality.difficultTrait;
  let bonus = 0;
  if (traits.includes("Patient") && activity.category === "Study") bonus += 1;
  if (traits.includes("Observant") && ["Investigation", "Expedition"].includes(activity.category)) bonus += 1;
  if (traits.includes("Brave") && ["Training", "Expedition"].includes(activity.category)) bonus += 1;
  if (traits.includes("Inventive") && ["Engineering", "Scavenging"].includes(activity.skill)) bonus += 1;
  if (traits.includes("Loyal") && ["Social", "Rest"].includes(activity.category)) bonus += 1;
  if (traits.includes("Graceful") && (["Training", "Performance"].includes(activity.category) || activity.skill === "Athletics")) bonus += 1;
  if (traits.includes("Diplomatic") && activity.category === "Social") bonus += 1;
  if (traits.includes("Bright-eyed") && ["market", "observation", "moon"].includes(activity.location)) bonus += 1;
  if (difficult === "Overfocus" && ["Study", "Investigation"].includes(activity.category)) bonus += 1;
  if (difficult === "Suspicious" && activity.category === "Investigation") bonus += 1;
  if (difficult === "Proud silence" && activity.category === "Social" && state.alien.needs.trust < 55) bonus -= 1;
  if (activityTouchesFear(state.alien.personality.hiddenFear, activity)) bonus -= 1;
  if (activityTouchesAversion(state.alien.personality.aversion, activity)) bonus -= 1;
  return bonus;
}

function personalityScoreLabel(state, activity) {
  const bonus = personalityScoreBonus(state, activity);
  if (!bonus) return "";
  return `Personality ${bonus > 0 ? "+" : ""}${bonus}`;
}

function activityScore(state, activity, random) {
  const stat = state.alien.stats[activity.stat] || 0;
  const skill = state.alien.skills[activity.skill] || 0;
  const equipment = getEquipmentBonus(state, activity.stat);
  const facility = facilityBonusForActivity(state, activity);
  const personality = personalityScoreBonus(state, activity);
  const mood = Math.round((state.alien.needs.morale - state.alien.needs.stress) / 18);
  const variance = Math.floor(random() * 7) - 3;
  return stat + skill + equipment + facility + personality + mood - activity.difficulty + variance;
}

function outcomeFromScore(score) {
  if (score <= -5) return "Critical failure";
  if (score <= -2) return "Failure";
  if (score <= 1) return "Partial success";
  if (score <= 5) return "Success";
  return "Exceptional success";
}

function rewardMultiplier(outcome) {
  return {
    "Critical failure": 0.25,
    Failure: 0.5,
    "Partial success": 0.8,
    Success: 1,
    "Exceptional success": 1.35
  }[outcome];
}

function resolveActivity(state, timer) {
  const activity = ACTIVITIES.find((entry) => entry.id === timer.id);
  if (!activity) return;
  const random = rngFrom(state.meta.saveId, timer.id, timer.startedAt, "resolve");
  const score = activityScore(state, activity, random);
  const outcome = outcomeFromScore(score);
  const mult = rewardMultiplier(outcome);
  const rewards = activity.rewards;
  const xp = Math.round((rewards.xp || 0) * mult);
  state.alien.progression.xp += xp;
  if (rewards.credits) {
    const amount = Math.round(rewards.credits * mult);
    state.agency.credits += amount;
    state.statistics.lifetimeTotals.creditsEarned += amount;
  }
  if (rewards.data) state.agency.data += Math.round(rewards.data * mult);
  if (rewards.salvage) state.agency.salvage += Math.round(rewards.salvage * mult);
  if (rewards.reputation) state.agency.reputation += Math.round(rewards.reputation * mult);
  if (rewards.health) state.alien.needs.health = clamp(state.alien.needs.health + rewards.health * mult, 0, 100);
  if (rewards.trust) {
    state.alien.needs.trust = clamp(state.alien.needs.trust + rewards.trust * mult, 0, 100);
    state.alien.relationships.playerTrust = state.alien.needs.trust;
  }
  if (rewards.faction) applyFactionRewards(state, rewards.faction);
  if (rewards.clue) {
    state.agency.research.clues += rewards.clue;
    state.world.campaignState.originClues += rewards.clue;
    state.achievements.progress.clues += rewards.clue;
  }
  if (rewards.memory) addMemory(state, rewards.memory.title, personalizeText(rewards.memory.text, state));
  const reaction = alienActivityReaction(state, activity);
  state.alien.needs.vitality = clamp(state.alien.needs.vitality + (rewards.vitality || 0), 0, 100);
  state.alien.needs.morale = clamp(state.alien.needs.morale + (rewards.morale || 0) * mult + reaction.morale, 0, 100);
  state.alien.needs.nourishment = clamp(state.alien.needs.nourishment + (rewards.nourishment || 0) - 1, 0, 100);
  state.alien.needs.stress = clamp(state.alien.needs.stress + (rewards.stress || 0) + (outcome.includes("Failure") ? 8 : -2) + reaction.stress, 0, 100);
  state.alien.needs.trust = clamp(state.alien.needs.trust + reaction.trust, 0, 100);
  state.alien.relationships.playerTrust = state.alien.needs.trust;
  state.alien.skills[activity.skill] = (state.alien.skills[activity.skill] || 0) + (outcome === "Exceptional success" ? 2 : 1);
  state.statistics.lifetimeTotals.activities += 1;
  state.statistics.campaignTotals.activities += 1;
  state.achievements.progress.activities += 1;
  state.missions.completed.push(activity.id);
  state.missions.history.unshift({ id: activity.id, outcome, at: clock.now() });
  levelCheck(state);
  updateCampaignChapter(state);
  if (activity.id === "sealed-records" && state.world.campaignState.originClues >= 2) {
    addMemory(state, "The False Stamp", `${state.alien.identity.name} recognized the repeated medical stamp before you did.`);
  }
  if (activity.id === "memory-archive-session" && state.world.campaignState.originClues >= 5) {
    addMemory(state, "Borrowed Memory", `${state.alien.identity.name} remembers a moon corridor from above, as if watching through someone else's eyes.`);
  }
  const twist = outcome === "Exceptional success" ? " The result is cleaner than the official manuals claim possible." : "";
  addLog(state, `${activity.name}: ${outcome}`, `${activity.report} ${reaction.text} ${xp} XP gained.${twist}`, outcome === "Exceptional success");
}

function alienActivityReaction(state, activity) {
  const reaction = { morale: 0, stress: 0, trust: 0, text: "" };
  const stabilizer = state.agency.facilities["Mutation Stabilizer"]?.level || 0;
  const traits = state.alien.personality.positiveTraits || [];
  const difficult = state.alien.personality.difficultTrait;
  const bond = bondStage(state);
  if (activity.category === "Social" || activity.name.toLowerCase().includes("habitat")) {
    reaction.trust += 1;
  }
  if (activity.category === state.alien.activityState.resistedCategory) {
    reaction.stress += stabilizer ? 1 : 4;
    reaction.text += `${state.alien.identity.name} hesitates before agreeing. `;
  }
  if (stabilizer && ["Medical", "Study"].includes(activity.category)) {
    reaction.stress -= 2;
    reaction.text += "The stabilizer keeps the session grounded. ";
  }
  if (activityMatchesPreference(state.alien.personality.preference, activity)) {
    reaction.morale += 3;
    reaction.trust += 1;
    reaction.text += `${state.alien.identity.name}'s preference turns the assignment into something almost familiar. `;
  }
  if (activityTouchesFear(state.alien.personality.hiddenFear, activity)) {
    reaction.stress += ["Trusted", "Devoted"].includes(bond) ? 2 : 5;
    reaction.text += `The work brushes against a known fear: ${state.alien.personality.hiddenFear}. `;
  }
  if (activityTouchesAversion(state.alien.personality.aversion, activity)) {
    reaction.stress += ["Trusted", "Devoted"].includes(bond) ? 1 : 3;
    reaction.morale -= 1;
    reaction.text += `${state.alien.identity.name} keeps going, but the aversion to ${state.alien.personality.aversion} shows. `;
  }
  if (traits.includes("Observant") && ["Investigation", "Expedition"].includes(activity.category)) {
    reaction.morale += 1;
    reaction.text += "An observant pause catches a detail the report almost missed. ";
  }
  if (traits.includes("Brave") && ["Training", "Expedition"].includes(activity.category)) {
    reaction.stress -= 1;
    reaction.text += "Bravery keeps the hard part from becoming the whole story. ";
  }
  if (traits.includes("Inventive") && ["Engineering", "Scavenging"].includes(activity.skill)) {
    reaction.morale += 2;
    reaction.text += "Inventiveness turns the assignment sideways in a useful way. ";
  }
  if (traits.includes("Loyal") && ["Social", "Rest"].includes(activity.category)) {
    reaction.trust += 2;
    reaction.text += "The bond matters more than the assignment brief. ";
  }
  if (traits.includes("Graceful") && (activity.category === "Training" || activity.skill === "Athletics")) {
    reaction.morale += 1;
    reaction.text += "Movement looks less like practice and more like self-expression. ";
  }
  if (traits.includes("Bright-eyed") && ["market", "observation", "moon"].includes(activity.location)) {
    reaction.morale += 2;
    reaction.text += "Curiosity wins a little ground over caution. ";
  }
  if (traits.includes("Diplomatic") && activity.category === "Social") {
    reaction.trust += 1;
    reaction.text += "Diplomacy softens the room before anyone notices. ";
  }
  if (difficult === "Startles easily" && ["Medical", "Expedition"].includes(activity.category)) {
    reaction.stress += 3;
    reaction.text += "A sudden sound makes the first minutes harder. ";
  }
  if (difficult === "Hoarding impulse" && (activity.rewards.salvage || activity.rewards.credits)) {
    reaction.morale += 1;
    reaction.stress += 1;
    reaction.text += "Useful finds are reassuring and a little hard to let go. ";
  }
  if (difficult === "Proud silence" && activity.category === "Social") {
    if (state.alien.needs.trust >= 65) {
      reaction.trust += 1;
      reaction.text += "Proud silence reads as composure this time. ";
    } else {
      reaction.stress += 2;
      reaction.text += "Proud silence makes the room harder to read. ";
    }
  }
  if (difficult === "Overfocus" && ["Study", "Investigation"].includes(activity.category)) {
    reaction.morale += 1;
    reaction.stress += 2;
    reaction.text += "Overfocus sharpens the work, then asks for payment afterward. ";
  }
  if (difficult === "Suspicious") {
    if (activity.category === "Investigation") {
      reaction.morale += 1;
      reaction.text += "Suspicion is not always wrong. ";
    } else if (activity.category === "Social") {
      reaction.stress += 2;
      reaction.text += "Suspicion keeps one eye on the exit. ";
    }
  }
  if (difficult === "Dramatic molting") {
    if (["Medical", "Training"].includes(activity.category)) {
      reaction.stress += 3;
      reaction.text += "Molting discomfort makes the work more vulnerable than expected. ";
    } else if (activity.category === "Rest") {
      reaction.morale += 2;
      reaction.text += "Rest makes the molting drama feel less like a crisis. ";
    }
  }
  if (activity.category === "Rest" && state.alien.needs.stress > 45) {
    reaction.trust += 2;
    reaction.text += "Respecting the need to recover is remembered. ";
  }
  return reaction;
}

function resolveProject(state, timer) {
  const project = PROJECTS.find((entry) => entry.id === timer.id);
  if (!project) return;
  if (project.rewards.reputation) state.agency.reputation += project.rewards.reputation;
  if (project.rewards.data) state.agency.data += project.rewards.data;
  if (project.rewards.clue) {
    state.agency.research.clues += project.rewards.clue;
    state.world.campaignState.originClues += project.rewards.clue;
    state.achievements.progress.clues += project.rewards.clue;
  }
  if (project.rewards.trust) {
    state.alien.needs.trust = clamp(state.alien.needs.trust + project.rewards.trust, 0, 100);
    state.alien.relationships.playerTrust = state.alien.needs.trust;
  }
  if (project.rewards.stat) {
    Object.entries(project.rewards.stat).forEach(([stat, amount]) => {
      state.alien.stats[stat] = Math.min(12, (state.alien.stats[stat] || 0) + amount);
    });
  }
  if (project.rewards.faction) applyFactionRewards(state, project.rewards.faction);
  if (project.rewards.facility) {
    state.agency.facilities[project.rewards.facility] ||= { level: 0 };
    state.agency.facilities[project.rewards.facility].level += 1;
    if (project.rewards.comfort) state.agency.facilities[project.rewards.facility].comfort = project.rewards.comfort;
  }
  if (project.rewards.unlock) unlockLocation(state, project.rewards.unlock);
  if (project.rewards.chapter) state.world.campaignState.chapter = Math.max(state.world.campaignState.chapter, project.rewards.chapter);
  if (project.rewards.flag && !state.world.campaignState.flags.includes(project.rewards.flag)) state.world.campaignState.flags.push(project.rewards.flag);
  if (!state.agency.research.completed.includes(project.id)) state.agency.research.completed.push(project.id);
  state.statistics.campaignTotals.projects += 1;
  state.achievements.progress.projects += 1;
  updateAgencyLevel(state);
  updateCampaignChapter(state);
  addLog(state, project.name, `${project.description} Project completed.`, true);
}

function updateAgencyLevel(state) {
  const target = state.agency.reputation >= 90 ? 4 : state.agency.reputation >= 42 ? 3 : state.agency.reputation >= 18 ? 2 : 1;
  if (target > state.agency.level) {
    state.agency.level = target;
    state.agency.licenseLevel = target;
    if (target >= 2) unlockLocation(state, "market");
    if (target >= 3) unlockLocation(state, "wreck");
    addLog(state, "License Upgraded", `The registry grudgingly recognizes ${state.agency.name} as a level ${target} agency.`, true);
  }
}

function applyFactionRewards(state, rewards) {
  const factionIds = { mothChoir: "moth-choir", redCrest: "red-crest", glasshouse: "glasshouse" };
  Object.entries(rewards).forEach(([key, amount]) => {
    const factionKey = key === "mothChoir" ? "mothChoir" : key;
    state.world.factionStates[factionKey] ||= { standing: 0, attention: 0 };
    state.world.factionStates[factionKey].standing += amount;
    if (amount < 0) state.world.factionStates[factionKey].attention += Math.abs(amount);
    const rival = state.world.rivalStates.find((entry) => entry.id === (factionIds[key] || key));
    if (rival) rival.reputation += amount;
  });
}

function hasFacility(state, name) {
  return (state.agency.facilities[name]?.level || 0) > 0;
}

function hasFlag(state, flag) {
  return state.world.campaignState.flags.includes(flag) || state.events.flags.includes(flag);
}

function endingFactors(state) {
  const factors = [];
  const bond = bondStage(state);
  factors.push(`${bond} bond`);
  if (state.world.campaignState.originClues >= 14) factors.push("full record");
  else if (state.world.campaignState.originClues >= 9) factors.push("complete hearing file");
  if (hasFacility(state, "Memory Archive") && hasFacility(state, "Mutation Stabilizer")) factors.push("protected consent tech");
  if (hasFacility(state, "Comfort Kitchen") || hasFlag(state, "private-dinner-ritual")) factors.push("daily care rituals");
  if (hasFacility(state, "Field Kit Cache") || hasFlag(state, "names-not-numbers")) factors.push("field dignity policy");
  if ((state.world.factionStates.glasshouse?.standing || 0) <= -5) factors.push("Glasshouse opposed");
  if ((state.world.factionStates.mothChoir?.standing || 0) >= 5) factors.push("Moth Choir witness");
  return factors.slice(0, 6);
}

function resolveEndingVariant(state, ending) {
  const glasshouse = state.world.factionStates.glasshouse?.standing || 0;
  const mothChoir = state.world.factionStates.mothChoir?.standing || 0;
  const redCrest = state.world.factionStates.redCrest?.standing || 0;
  const trust = state.alien.needs.trust;
  const clues = state.world.campaignState.originClues;
  const motif = campaignMotif(state);
  let variant = { id: "standard", title: motif.title, text: `The ${motif.title.toLowerCase()} thread remains part of the agency's permanent file.` };

  if (ending.id === "protector-agency") {
    if (trust >= 82 && (hasFlag(state, "alien-owns-memories") || hasFlag(state, "private-dinner-ritual"))) {
      variant = {
        id: "chosen-family",
        title: "Chosen Family Accord",
        text: "The final record names care, consent, and daily trust as stronger evidence than any origin claim."
      };
    } else if (glasshouse <= -5 || hasFlag(state, "names-not-numbers")) {
      variant = {
        id: "defiant-precedent",
        title: "Defiant Precedent",
        text: "Glasshouse challenges the decision, but the agency's name-not-number policy becomes difficult to reverse."
      };
    } else if (mothChoir >= 4 || hasFlag(state, "neighborhood-table")) {
      variant = {
        id: "sanctuary-network",
        title: "Sanctuary Network",
        text: "The agency becomes one office in a wider chain of witnesses, kitchens, and quiet safe rooms."
      };
    }
  }

  if (ending.id === "research-compact") {
    if (hasFlag(state, "alien-owns-memories") && hasFacility(state, "Memory Archive") && hasFacility(state, "Research Laboratory")) {
      variant = {
        id: "consent-led-science",
        title: "Consent-Led Science",
        text: "Every future study begins with the alien's veto, and the Memory Archive becomes the compact's moral center."
      };
    } else if (clues >= 14 || state.agency.data >= 100) {
      variant = {
        id: "full-record-compact",
        title: "Full Record Compact",
        text: "The agency releases enough verified history that even hostile boards must argue with facts instead of rumors."
      };
    } else if (mothChoir >= 5) {
      variant = {
        id: "choir-witnessed-compact",
        title: "Choir-Witnessed Compact",
        text: "Moth Choir observers make the compact politically durable, if never entirely comfortable."
      };
    }
  }

  if (ending.id === "feared-institution") {
    if (trust >= 60 && hasFlag(state, "names-not-numbers")) {
      variant = {
        id: "hard-shelter",
        title: "Hard Shelter",
        text: "The agency becomes intimidating to outsiders while preserving a private rule: its alien is never reduced to a file."
      };
    } else if (glasshouse >= 3 || state.agency.reputation >= 160) {
      variant = {
        id: "registry-hammer",
        title: "Registry Hammer",
        text: "The registry learns to fear the agency's paperwork, which is useful and not entirely harmless."
      };
    } else if (redCrest >= 3) {
      variant = {
        id: "arena-deterrent",
        title: "Arena Deterrent",
        text: "Rivals step lightly because the agency's public strength has become part legal threat, part spectacle."
      };
    }
  }

  return {
    ...ending,
    variantId: variant.id,
    variantTitle: variant.title,
    text: `${ending.text} ${variant.text}`,
    motif: motif.title,
    factors: endingFactors(state)
  };
}

function applyOutcomeEffects(state, effects = {}) {
  if (effects.credits) {
    state.agency.credits = Math.max(0, state.agency.credits + effects.credits);
    if (effects.credits > 0) state.statistics.lifetimeTotals.creditsEarned += effects.credits;
  }
  if (effects.data) state.agency.data = Math.max(0, state.agency.data + effects.data);
  if (effects.salvage) state.agency.salvage = Math.max(0, state.agency.salvage + effects.salvage);
  if (effects.reputation) state.agency.reputation = Math.max(0, state.agency.reputation + effects.reputation);
  ["trust", "morale", "stress", "health", "vitality", "nourishment"].forEach((need) => {
    if (effects[need]) state.alien.needs[need] = clamp(state.alien.needs[need] + effects[need], 0, 100);
  });
  state.alien.relationships.playerTrust = state.alien.needs.trust;
  if (effects.clue) {
    state.agency.research.clues += effects.clue;
    state.world.campaignState.originClues += effects.clue;
    state.achievements.progress.clues += effects.clue;
  }
  if (effects.faction) applyFactionRewards(state, effects.faction);
  if (effects.unlock) unlockLocation(state, effects.unlock);
  if (effects.chapter) state.world.campaignState.chapter = Math.max(state.world.campaignState.chapter, effects.chapter);
  if (effects.flag && !state.world.campaignState.flags.includes(effects.flag)) state.world.campaignState.flags.push(effects.flag);
  if (effects.memory) addMemory(state, effects.memory.title, personalizeText(effects.memory.text, state));
  if (effects.ending) {
    const ending = resolveEndingVariant(state, effects.ending);
    state.world.campaignState.ending = {
      ...ending,
      at: clock.now(),
      alienName: state.alien.identity.name,
      agencyName: state.agency.name
    };
    state.world.campaignState.completedAt = clock.now();
    addMemory(state, "Origin Hearing", `${state.alien.identity.name}'s origin hearing ended as ${ending.title}: ${ending.variantTitle}. ${ending.text}`);
  }
  updateAgencyLevel(state);
  updateCampaignChapter(state);
}

function updateCampaignChapter(state) {
  const clues = state.world.campaignState.originClues || 0;
  if (state.world.campaignState.chapter < 2 && clues >= 2 && state.agency.research.completed.includes("sealed-file")) {
    state.world.campaignState.chapter = 2;
    addLog(state, "Chapter Advanced", "The false stamp has become a traceable conspiracy.", true);
  }
  const completed = state.agency.research.completed;
  if (
    state.world.campaignState.chapter < 3 &&
    completed.includes("forbidden-coordinate")
  ) {
    state.world.campaignState.chapter = 3;
    addLog(state, "Chapter Advanced", "The Forbidden Moon coordinate is no longer theoretical.", true);
  }
}

function levelCheck(state) {
  while (state.alien.progression.xp >= state.alien.progression.nextLevelXp) {
    state.alien.progression.xp -= state.alien.progression.nextLevelXp;
    state.alien.progression.level += 1;
    state.alien.progression.skillPoints += 1;
    state.alien.progression.nextLevelXp = Math.round(100 * state.alien.progression.level ** 1.5);
    const strongest = Object.entries(state.alien.stats).sort((a, b) => b[1] - a[1])[0][0];
    state.alien.stats[strongest] = Math.min(12, state.alien.stats[strongest] + 1);
    addMemory(state, `Level ${state.alien.progression.level}`, `${state.alien.identity.name} changed after a long day at the agency. ${STAT_LABELS[strongest]} rose.`);
  }
}

function unlockLocation(state, id) {
  if (!state.world.unlockedLocations.includes(id)) {
    state.world.unlockedLocations.push(id);
    const location = LOCATIONS.find((entry) => entry.id === id);
    addLog(state, "Location Unlocked", `${location?.name || id} is now available on the agency map.`, true);
  }
}

function maybeTriggerStory(state) {
  STORY_EVENTS.forEach((event) => {
    if (state.events.completed.includes(event.id) || state.events.pending.some((pending) => pending.id === event.id)) return;
    if (event.id === "old-photo" && state.achievements.progress.activities < 2) return;
    if (event.id === "rival-smile" && state.agency.reputation < 14) return;
    if (event.requires && !requirementsMet(event, state)) return;
    state.events.pending.push(event);
  });
}

function updateAchievements(state) {
  const checks = [
    ["first-field-report", "First Field Report", state.achievements.progress.activities >= 1],
    ["three-projects", "Rebuilt the Front Desk", state.achievements.progress.projects >= 3],
    ["origin-thread", "Origin Thread", state.achievements.progress.clues >= 3],
    ["arena-name", "Arena Name", state.achievements.progress.arenaWins >= 1],
    ["campaign-finale", "Origin Resolved", Boolean(state.world.campaignState.ending)]
  ];
  checks.forEach(([id, title, ok]) => {
    if (ok && !state.achievements.unlocked.some((entry) => entry.id === id)) {
      state.achievements.unlocked.unshift({ id, title, at: clock.now() });
      addLog(state, "Achievement", title);
    }
  });
}

function canAfford(cost = {}) {
  return Object.entries(cost).every(([resource, amount]) => (game.agency[resource] || 0) >= amount);
}

function missingCostText(cost = {}, state = game) {
  return Object.entries(cost)
    .filter(([resource, amount]) => (state.agency[resource] || 0) < amount)
    .map(([resource, amount]) => `Need ${amount - (state.agency[resource] || 0)} ${titleCase(resource)}`);
}

function payCost(cost = {}) {
  Object.entries(cost).forEach(([resource, amount]) => {
    game.agency[resource] -= amount;
  });
}

function requirementsMet(entry, state = game) {
  const req = entry.requires;
  if (!req) return true;
  if (req.location && !state.world.unlockedLocations.includes(req.location)) return false;
  if (req.agencyLevel && state.agency.level < req.agencyLevel) return false;
  if (req.chapter && state.world.campaignState.chapter < req.chapter) return false;
  if (req.flag && !state.world.campaignState.flags.includes(req.flag)) return false;
  if (req.trust && state.alien.needs.trust < req.trust) return false;
  if (req.clues && state.world.campaignState.originClues < req.clues) return false;
  if (req.completedProject && !state.agency.research.completed.includes(req.completedProject)) return false;
  if (req.completedProjectAlso && !state.agency.research.completed.includes(req.completedProjectAlso)) return false;
  if (req.facility) {
    const facility = state.agency.facilities[req.facility];
    if (!facility || facility.level < (req.facilityLevel || 1)) return false;
  }
  return true;
}

function requirementText(entry, state = game) {
  const req = entry.requires;
  const missing = [];
  if (entry.location && !state.world.unlockedLocations.includes(entry.location)) {
    missing.push(`${LOCATIONS.find((location) => location.id === entry.location)?.name || entry.location} unlocked`);
  }
  if (!req) return missing;
  if (req.agencyLevel && state.agency.level < req.agencyLevel) missing.push(`Agency level ${req.agencyLevel}`);
  if (req.chapter && state.world.campaignState.chapter < req.chapter) missing.push(`Campaign chapter ${req.chapter}`);
  if (req.flag && !state.world.campaignState.flags.includes(req.flag)) missing.push(titleCase(req.flag.replaceAll("-", " ")));
  if (req.trust && state.alien.needs.trust < req.trust) missing.push(`Trust ${req.trust}`);
  if (req.clues && state.world.campaignState.originClues < req.clues) missing.push(`${req.clues} origin clues`);
  if (req.completedProject && !state.agency.research.completed.includes(req.completedProject)) missing.push(projectName(req.completedProject));
  if (req.completedProjectAlso && !state.agency.research.completed.includes(req.completedProjectAlso)) missing.push(projectName(req.completedProjectAlso));
  if (req.facility) {
    const facility = state.agency.facilities[req.facility];
    if (!facility || facility.level < (req.facilityLevel || 1)) missing.push(req.facility);
  }
  return missing;
}

function projectName(id) {
  return PROJECTS.find((project) => project.id === id)?.name || id;
}

function getActivityDifficulty(activity) {
  const base =
    game.alien.stats[activity.stat] +
    (game.alien.skills[activity.skill] || 0) +
    getEquipmentBonus(game, activity.stat) +
    facilityBonusForActivity(game, activity) +
    personalityScoreBonus(game, activity) -
    activity.difficulty;
  if (base >= 5) return "Routine";
  if (base >= 2) return "Favorable";
  if (base >= -1) return "Uncertain";
  if (base >= -4) return "Risky";
  return "Severe";
}

function activeTimerHtml(timer) {
  if (!timer) {
    return `<div class="timer"><div class="timer-top"><strong>Idle</strong><span>Ready</span></div><div class="progress"><span style="--value: 0%"></span></div></div>`;
  }
  const now = clock.now();
  const done = clamp((now - timer.startedAt) / timer.durationMs, 0, 1);
  return `
    <div class="timer">
      <div class="timer-top">
        <strong>${escapeHtml(timer.name)}</strong>
        <span>${fmtDuration(timer.endsAt - now)}</span>
      </div>
      <div class="progress"><span style="--value: ${(done * 100).toFixed(0)}%"></span></div>
    </div>
  `;
}

function needBarsHtml() {
  return `
    <div class="bars">
      ${Object.entries(game.alien.needs)
        .map(([key, value]) => `
          <div class="bar-row">
            <span>${escapeHtml(titleCase(key))}</span>
            <div class="bar"><span style="--value: ${pct(key === "stress" ? 100 - value : value)}"></span></div>
            <b>${Math.round(value)}</b>
          </div>
        `)
        .join("")}
    </div>
  `;
}

function statGridHtml(stats = game.alien.stats) {
  return `
    <div class="stat-grid">
      ${Object.entries(stats)
        .map(([key, value]) => `<div class="stat"><b>${value}</b><span>${STAT_LABELS[key]}</span></div>`)
        .join("")}
    </div>
  `;
}

function shell(content) {
  return `
    <div class="shell">
      <header class="topbar">
        <div class="brand">
          <img src="./xeno-agency-logo.png" alt="">
          <div>
            <h1>${escapeHtml(game.agency.name)}</h1>
            <p>${escapeHtml(game.alien.identity.name)} · Level ${game.alien.progression.level}</p>
          </div>
        </div>
        <div class="top-stats">
          <span class="pill">¤ ${game.agency.credits}</span>
          <span class="pill">Rep ${game.agency.reputation}</span>
          <span class="pill">Data ${game.agency.data}</span>
          <span class="pill">Scrap ${game.agency.salvage}</span>
        </div>
      </header>
      ${navHtml()}
      <section class="view">${content}</section>
      ${modalHtml()}
      ${toast ? `<div class="toast" role="status">${escapeHtml(toast)}</div>` : ""}
    </div>
  `;
}

function navHtml() {
  return `
    <nav class="nav" aria-label="Game sections">
      ${NAV_ITEMS.map(([id, label, icon]) => `
        <button data-action="nav" data-view="${id}" class="${activeView === id ? "active" : ""}" aria-label="${label}" ${activeView === id ? `aria-current="page"` : ""}>
          <span aria-hidden="true">${icon}</span>${label}
        </button>
      `).join("")}
    </nav>
  `;
}

function modalHtml() {
  if (!modal) return "";
  if (modal.type === "event") {
    const choices = modal.event.choices || [{ label: "Record it", text: "The report is added to the agency history.", effects: {} }];
    return `
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div class="modal-card">
          <p class="eyebrow">Agency Event</p>
          <h2 id="modal-title">${escapeHtml(modal.event.title)}</h2>
          <p>${escapeHtml(modal.event.body)}</p>
          ${eventReactionNote(modal.event) ? `<p class="event-note">${escapeHtml(eventReactionNote(modal.event))}</p>` : ""}
          <div class="choice-list">
            ${choices.map((choice, index) => `
              <button class="choice-button" data-action="resolve-event" data-id="${modal.event.id}" data-choice="${index}" ${index === 0 ? "data-autofocus" : ""}>
                <strong>${escapeHtml(choice.label)}</strong>
                <span>${escapeHtml(choice.text)}</span>
              </button>
            `).join("")}
          </div>
          <div class="button-row" style="margin-top:.75rem">
            <button class="button" data-action="close-modal">Later</button>
          </div>
        </div>
      </div>
    `;
  }
  if (modal.type === "adopt") {
    return `
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div class="modal-card">
          <p class="eyebrow">Permanent adoption</p>
          <h2 id="modal-title">Adopt ${escapeHtml(modal.name)}?</h2>
          <p>Only one alien can be adopted in this campaign. The other candidates will leave the office, and this choice becomes part of the save history.</p>
          <div class="button-row">
            <button class="button primary" data-action="finalize-adoption" data-autofocus>Confirm adoption</button>
            <button class="button" data-action="close-modal">Review candidates</button>
          </div>
        </div>
      </div>
    `;
  }
  if (modal.type === "card") {
    return `
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div class="modal-card">
          <h2 id="modal-title">Profile Card</h2>
          <img src="${modal.src}" alt="Generated alien profile card" style="width:100%;border-radius:8px;border:1px solid var(--line)">
          <div class="button-row">
            <a class="button primary" href="${modal.src}" download="xeno-agency-profile.png" data-autofocus>Download</a>
            <button class="button" data-action="close-modal">Close</button>
          </div>
        </div>
      </div>
    `;
  }
  if (modal.type === "import") {
    return `
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div class="modal-card">
          <h2 id="modal-title">Import Save</h2>
          <p>Paste a Xeno Agency JSON export. The current local save will be replaced after validation.</p>
          <textarea id="importSaveText" class="textarea" placeholder="Paste exported save JSON" aria-label="Xeno Agency save JSON" data-autofocus></textarea>
          <div class="button-row">
            <button class="button primary" data-action="import-save">Import</button>
            <button class="button" data-action="close-modal">Close</button>
          </div>
        </div>
      </div>
    `;
  }
  return "";
}

function recoveryNoticeHtml() {
  const error = localStorage.getItem(LOAD_ERROR_KEY);
  if (!error) return "";
  return `
    <div class="recovery-notice" role="status">
      <strong>Save recovery notice</strong>
      <span>${escapeHtml(error)}</span>
      <button class="button" data-action="clear-recovery-notice">Dismiss</button>
    </div>
  `;
}

function eventReactionNote(event) {
  if (!game) return "";
  const text = `${event.title} ${event.body}`.toLowerCase();
  const activity = {
    id: event.id,
    name: event.title,
    category: text.includes("dinner") || text.includes("kitchen") ? "Rest" : text.includes("hearing") || text.includes("visitor") ? "Social" : text.includes("archive") ? "Study" : "Investigation",
    skill: text.includes("hearing") || text.includes("visitor") ? "Diplomacy" : "Investigation",
    location: text.includes("moon") ? "moon" : text.includes("market") ? "market" : text.includes("archive") || text.includes("research") ? "research" : null,
    report: event.body,
    rewards: {}
  };
  const name = game.alien.identity.name;
  if (activityTouchesFear(game.alien.personality.hiddenFear, activity)) {
    return `${name} may need reassurance: this report touches ${game.alien.personality.hiddenFear}.`;
  }
  if (activityTouchesAversion(game.alien.personality.aversion, activity)) {
    return `${name} will probably tolerate this better if you account for their aversion to ${game.alien.personality.aversion}.`;
  }
  if (activityMatchesPreference(game.alien.personality.preference, activity)) {
    return `${name} leans toward this one because it brushes against ${game.alien.personality.preference}.`;
  }
  if (["Trusted", "Devoted"].includes(bondStage(game))) {
    return `${name} trusts you enough to wait for the choice before reacting.`;
  }
  return "";
}

function renderStart() {
  if (!draft) {
    const campaignSeed = uid("campaign");
    draft = {
      step: "intro",
      campaignSeed,
      candidates: [0, 1, 2].map((index) => generateCandidate(campaignSeed, index)),
      selected: null
    };
  }
  if (draft.step === "adoption") return renderAdoption();
  app.innerHTML = `
    <section class="hero">
      <div class="hero-inner">
        <img class="hero-logo" src="./xeno-agency-logo.png" alt="">
        <p class="eyebrow">Persistent static browser RPG</p>
        <h2>Xeno Agency</h2>
        <p class="hero-copy">You inherit a failing interstellar adoption office, one damaged license, a sealed research file, and three unidentified alien candidates. Raise one alien that remembers what you choose.</p>
        <div class="hero-actions">
          <button class="button primary" data-action="begin-adoption">Begin adoption</button>
          <button class="button" data-action="import-open">Import save</button>
        </div>
        ${recoveryNoticeHtml()}
      </div>
    </section>
    ${modalHtml()}
    ${toast ? `<div class="toast" role="status">${escapeHtml(toast)}</div>` : ""}
  `;
  afterRender();
}

function renderAdoption() {
  const selected = draft.candidates[draft.selected] || draft.candidates[0];
  draft.form ||= {
    agencyName: "Last Light Adoption",
    directorName: "Director",
    alienName: selected.suggestedName,
    pronouns: selected.pronouns
  };
  app.innerHTML = `
    <section class="view">
      <div class="screen-title">
        <p class="eyebrow">Adoption intake</p>
        <h2>The office has three files and one license.</h2>
        <p>The official records are incomplete by design. Choose the alien you want to raise, not the one that looks numerically perfect.</p>
      </div>
      <div class="grid two">
        <div class="panel">
          <div class="candidate-grid">
            ${draft.candidates.map((candidate, index) => candidateCard(candidate, index)).join("")}
          </div>
        </div>
        <div class="panel">
          <div class="panel-header">
            <div>
              <h2>Agency paperwork</h2>
              <p>Names are sanitized and capped so they fit the interface later.</p>
            </div>
          </div>
          <div class="form">
            <div class="field">
              <label for="agencyName">Agency name</label>
              <input class="input" id="agencyName" maxlength="28" value="${escapeHtml(draft.form.agencyName)}">
            </div>
            <div class="field">
              <label for="directorName">Director name</label>
              <input class="input" id="directorName" maxlength="22" value="${escapeHtml(draft.form.directorName)}">
            </div>
            <div class="field">
              <label for="alienName">Alien name</label>
              <input class="input" id="alienName" maxlength="22" value="${escapeHtml(draft.form.alienName)}">
            </div>
            <div class="field">
              <label for="pronouns">UI pronouns</label>
              <select class="select" id="pronouns">
                ${["they", "it", "she", "he"].map((value) => `<option ${draft.form.pronouns === value ? "selected" : ""}>${value}</option>`).join("")}
              </select>
            </div>
            <div class="button-row">
              <button class="button" data-action="random-name">Random name</button>
              <button class="button primary" data-action="adopt-open">Adopt selected alien</button>
            </div>
          </div>
        </div>
      </div>
      ${modalHtml()}
      ${toast ? `<div class="toast" role="status">${escapeHtml(toast)}</div>` : ""}
    </section>
  `;
  afterRender();
}

function candidateCard(candidate, index) {
  const chosen = draft.selected === index || (draft.selected === null && index === 0);
  if (draft.selected === null) draft.selected = 0;
  return `
    <article class="card candidate ${chosen ? "selected" : ""}">
      <div class="candidate-img" style="--accent: ${candidate.portrait.accent}">
        <img src="${candidate.portrait.src}" alt="${escapeHtml(candidate.code)} candidate portrait">
      </div>
      <div>
        <p class="eyebrow">${escapeHtml(candidate.code)} · ${escapeHtml(candidate.registryCode)}</p>
        <h3>${escapeHtml(candidate.bodyPlan)} · ${escapeHtml(candidate.age)}</h3>
        <p>${escapeHtml(candidate.observation)}</p>
        <div class="tag-list">
          ${candidate.traits.positive.map((trait) => `<span class="tag good">${escapeHtml(trait)}</span>`).join("")}
          <span class="tag">${escapeHtml(candidate.aptitude)}</span>
          <span class="tag risk">${escapeHtml(candidate.visibleNeed)}</span>
        </div>
        <div class="meta-list">
          <span>Surface: ${escapeHtml(candidate.surface)}</span>
          <span>Origin: ${escapeHtml(candidate.originRecord)}</span>
        </div>
      </div>
      <button class="button ${chosen ? "primary" : ""}" data-action="select-candidate" data-index="${index}" aria-pressed="${chosen}" aria-label="${chosen ? "Selected candidate" : "Review candidate"} ${escapeHtml(candidate.code)}">${chosen ? "Selected" : "Review file"}</button>
    </article>
  `;
}

function render() {
  lastRenderAt = clock.now();
  if (!game) {
    renderStart();
    return;
  }
  processTimers(game);
  const views = {
    home: renderHome,
    alien: renderAlien,
    world: renderWorld,
    missions: renderMissions,
    arena: renderArena,
    research: renderResearch,
    inventory: renderInventory,
    settings: renderSettings
  };
  app.innerHTML = shell((views[activeView] || renderHome)());
  afterRender();
}

function afterRender() {
  const schedule = typeof requestAnimationFrame === "function" ? requestAnimationFrame : (callback) => setTimeout(callback, 0);
  schedule(() => {
    const target = document.querySelector("[data-autofocus]") || document.querySelector(".modal button, .modal a, .modal textarea");
    if (target && typeof target.focus === "function") target.focus({ preventScroll: true });
  });
}

function renderHome() {
  return `
    <div class="grid two">
      <section class="panel portrait-panel">
        <div class="portrait-stage">
          <img class="portrait-main" src="${game.alien.appearance.portraitSrc}" alt="${escapeHtml(game.alien.identity.name)} portrait">
          <div class="alien-badge">
            <p class="eyebrow">${escapeHtml(game.alien.appearance.portraitCode)} · ${escapeHtml(game.alien.personality.temperament)} ${escapeHtml(game.alien.appearance.bodyPlan)}</p>
            <h2>${escapeHtml(game.alien.identity.name)}</h2>
            <p>${escapeHtml(game.alien.speciesProfile.name)} species · ${escapeHtml(game.alien.appearance.idle)}</p>
          </div>
        </div>
      </section>
      <section class="panel">
        <div class="panel-header">
          <div>
            <h2>Today at the agency</h2>
            <p>${game.events.pending.length ? "A report is waiting on your desk." : "Pick one alien activity and one agency project before you leave."}</p>
          </div>
          ${game.events.pending.length ? `<button class="button primary" data-action="open-event">Open report</button>` : ""}
        </div>
        ${needBarsHtml()}
      </section>
    </div>
    ${campaignPanelHtml()}
    <div class="grid two" style="margin-top:1rem">
      <section class="panel">
        <div class="panel-header"><div><h3>Alien activity slot</h3><p>Training, rest, jobs, and exploration use this slot.</p></div></div>
        ${activeTimerHtml(game.timers.alienActivity)}
      </section>
      <section class="panel">
        <div class="panel-header"><div><h3>Agency project slot</h3><p>Facilities, research, and contracts progress separately.</p></div></div>
        ${activeTimerHtml(game.timers.agencyProject)}
      </section>
    </div>
    <section class="panel" style="margin-top:1rem">
      <div class="panel-header"><div><h3>Recent reports</h3><p>Completed timers, offline progress, and major discoveries land here.</p></div></div>
      <div class="log">${game.logs.recentActivity.map(logHtml).join("")}</div>
    </section>
  `;
}

function bondStage(state = game) {
  const trust = state.alien.needs.trust;
  if (trust >= 82) return "Devoted";
  if (trust >= 66) return "Trusted";
  if (trust >= 48) return "Settled";
  if (trust >= 32) return "Cautious";
  return "Fragile";
}

function careReadiness(state = game) {
  const needs = state.alien.needs;
  const lowNeeds = ["vitality", "nourishment", "morale", "health"].filter((need) => needs[need] < 45);
  if (needs.stress > 68) lowNeeds.push("stress");
  if (!lowNeeds.length) return { label: "Ready", text: "Needs are stable enough for demanding assignments." };
  return {
    label: "Care needed",
    text: `Watch ${lowNeeds.map(titleCase).join(", ")} before high-stakes work.`
  };
}

function bondDossierHtml() {
  const care = careReadiness();
  const ending = game.world.campaignState.ending;
  return `
    <section class="panel dossier-panel">
      <div class="dossier-portrait" style="--accent: ${escapeHtml(game.alien.appearance.accent || "#74f4c7")}">
        <img src="${game.alien.appearance.portraitSrc}" alt="${escapeHtml(game.alien.identity.name)} portrait">
      </div>
      <div>
        <div class="panel-header">
          <div>
            <p class="eyebrow">${escapeHtml(game.alien.appearance.portraitCode)} · Bond Dossier</p>
            <h3>${escapeHtml(bondStage())} bond</h3>
            <p>${escapeHtml(care.text)}</p>
          </div>
          <span class="pill">${escapeHtml(care.label)}</span>
        </div>
        <div class="tag-list">
          <span class="tag good">Trust ${Math.round(game.alien.needs.trust)}</span>
          <span class="tag">Fear: ${escapeHtml(game.alien.personality.hiddenFear)}</span>
          <span class="tag">Favorite: ${escapeHtml(game.alien.personality.preference)}</span>
          <span class="tag">Memory ${game.alien.memories.length}/12</span>
          ${ending ? `<span class="tag good">${escapeHtml(ending.title)}</span>` : ""}
        </div>
      </div>
    </section>
  `;
}

function finaleReadinessItems() {
  const project = PROJECTS.find((entry) => entry.id === "origin-hearing");
  const coordinateDone = game.agency.research.completed.includes("forbidden-coordinate");
  return [
    { label: "Forbidden coordinate", done: coordinateDone, detail: coordinateDone ? "Decrypted" : "Complete the coordinate project" },
    { label: "Origin clues", done: game.world.campaignState.originClues >= 9, detail: `${game.world.campaignState.originClues}/9 found` },
    { label: "Data reserve", done: game.agency.data >= project.cost.data, detail: `${game.agency.data}/${project.cost.data} data` },
    { label: "Salvage reserve", done: game.agency.salvage >= project.cost.salvage, detail: `${game.agency.salvage}/${project.cost.salvage} salvage` }
  ];
}

function finaleReadinessHtml() {
  if (game.world.campaignState.chapter < 3 || game.world.campaignState.ending) return "";
  const items = finaleReadinessItems();
  const ready = items.every((item) => item.done);
  const motif = campaignMotif();
  return `
    <div class="readiness-grid">
      ${items.map((item) => `
        <div class="readiness-item ${item.done ? "done" : ""}">
          <strong>${escapeHtml(item.label)}</strong>
          <span>${escapeHtml(item.detail)}</span>
        </div>
      `).join("")}
    </div>
    <p class="readiness-note"><strong>${escapeHtml(motif.title)}:</strong> ${escapeHtml(motif.description)}</p>
    <p class="readiness-note">${ready ? "The origin hearing can be convened from Agency Projects." : "The hearing is close, but the agency still needs proof and reserves."}</p>
  `;
}

function campaignPanelHtml() {
  const ending = game.world.campaignState.ending;
  if (ending) {
    return `
      <section class="panel ending-panel" style="margin-top:1rem">
        <div class="panel-header">
          <div>
            <p class="eyebrow">Campaign Complete</p>
            <h3>${escapeHtml(ending.title)}</h3>
            ${ending.variantTitle ? `<p class="ending-variant">${escapeHtml(ending.variantTitle)}</p>` : ""}
            <p>${escapeHtml(ending.text)}</p>
            <p>${game.world.campaignState.legacyArchived ? "This alien has been preserved in the legacy archive." : "Archive this alien from the Save screen when you are ready."}</p>
          </div>
          <span class="pill">${game.world.campaignState.originClues} clues</span>
        </div>
        <div class="legacy-strip">
          <span>Bond: ${escapeHtml(bondStage())}</span>
          ${ending.motif ? `<span>${escapeHtml(ending.motif)}</span>` : ""}
          <span>Trust ${Math.round(game.alien.needs.trust)}</span>
          <span>${game.alien.memories.length} memories</span>
          <span>${new Date(ending.at).toLocaleDateString()}</span>
        </div>
        ${ending.factors?.length ? `<div class="tag-list">${ending.factors.map((factor) => `<span class="tag good">${escapeHtml(factor)}</span>`).join("")}</div>` : ""}
      </section>
    `;
  }
  const current = CAMPAIGN_CHAPTERS.find((entry) => entry.chapter === game.world.campaignState.chapter) || CAMPAIGN_CHAPTERS[0];
  const clueTarget = game.world.campaignState.chapter >= 3 ? 9 : game.world.campaignState.chapter === 2 ? 5 : 2;
  const motif = campaignMotif();
  return `
    <section class="panel" style="margin-top:1rem">
      <div class="panel-header">
        <div>
          <p class="eyebrow">Campaign Chapter ${current.chapter}</p>
          <h3>${escapeHtml(current.title)}</h3>
          <p>${escapeHtml(current.objective)}</p>
          <p>Lens: ${escapeHtml(motif.title)}. ${escapeHtml(motif.description)}</p>
          <p>Next: ${escapeHtml(current.nextAt)}</p>
        </div>
        <span class="pill">${game.world.campaignState.originClues}/${clueTarget} clues</span>
      </div>
      <div class="campaign-steps">
        ${CAMPAIGN_CHAPTERS.map((chapter) => `
          <span class="campaign-step ${game.world.campaignState.chapter >= chapter.chapter ? "done" : ""}">
            ${chapter.chapter}. ${escapeHtml(chapter.title)}
          </span>
        `).join("")}
      </div>
      ${finaleReadinessHtml()}
    </section>
  `;
}

function renderAlien() {
  const profile = game.alien.speciesProfile;
  return `
    <div class="screen-title">
      <p class="eyebrow">One alien that matters</p>
      <h2>${escapeHtml(game.alien.identity.name)}</h2>
      <p>${escapeHtml(game.alien.identity.name)} is ${escapeHtml(game.alien.personality.temperament.toLowerCase())}, prefers ${escapeHtml(game.alien.personality.preference)}, and avoids ${escapeHtml(game.alien.personality.aversion)}.</p>
    </div>
    ${bondDossierHtml()}
    <div class="grid two">
      <section class="panel">
        <div class="panel-header"><div><h3>Core stats</h3><p>Equipment and facilities can modify activity outcomes.</p></div></div>
        ${statGridHtml()}
      </section>
      <section class="panel">
        <div class="panel-header"><div><h3>Needs</h3><p>Low needs reduce efficiency, but the game avoids absence punishment.</p></div></div>
        ${needBarsHtml()}
      </section>
    </div>
    <div class="grid two" style="margin-top:1rem">
      <section class="panel">
        <div class="panel-header"><div><h3>Species profile</h3><p>${escapeHtml(profile.name)} · ${escapeHtml(profile.homeEnvironment)}</p></div></div>
        <div class="meta-list">
          <span>Diet: ${escapeHtml(profile.diet)}</span>
          <span>Sleep: ${escapeHtml(profile.sleep)}</span>
          <span>Social structure: ${escapeHtml(profile.social)}</span>
          <span>Communication: ${escapeHtml(profile.communication)}</span>
          <span>Advantage: ${escapeHtml(profile.advantage)}</span>
          <span>Weakness: ${escapeHtml(profile.weakness)}</span>
          <span>Misconception: ${escapeHtml(profile.misconception)}</span>
          <span>Scientific uncertainty: ${escapeHtml(profile.uncertainty)}</span>
        </div>
      </section>
      <section class="panel">
        <div class="panel-header"><div><h3>Memories</h3><p>Major decisions change future dialogue and campaign options.</p></div></div>
        <div class="log">${game.alien.memories.map((memory) => logHtml({ title: memory.title, text: memory.text, at: memory.at })).join("")}</div>
      </section>
    </div>
  `;
}

function renderWorld() {
  return `
    <div class="screen-title">
      <p class="eyebrow">Compact star map</p>
      <h2>A larger world than the office can show.</h2>
      <p>Locations unlock through agency reputation, research projects, and origin clues.</p>
    </div>
    <section class="panel world-map">
      <div class="location-grid">
        ${LOCATIONS.map((location) => locationHtml(location)).join("")}
      </div>
    </section>
    <div class="grid two" style="margin-top:1rem">
      <section class="panel">
        <div class="panel-header"><div><h3>Faction Pressure</h3><p>Story choices and contracts shift who trusts, studies, or pressures the agency.</p></div></div>
        <div class="faction-grid">
          ${factionStateHtml("glasshouse", "Glasshouse Directorate")}
          ${factionStateHtml("redCrest", "Red Crest Kennels")}
          ${factionStateHtml("mothChoir", "Moth Choir Bureau")}
        </div>
      </section>
      <section class="panel">
        <div class="panel-header"><div><h3>Rival Agencies</h3><p>Simulated agencies progress locally; arena results and diplomacy nudge their profile.</p></div></div>
        <div class="log">${game.world.rivalStates.map((rival) => `<div class="report"><strong>${escapeHtml(rival.name)}</strong><p>Level ${rival.level} · Reputation ${rival.reputation} · ${escapeHtml(rival.style)}</p></div>`).join("")}</div>
      </section>
    </div>
  `;
}

function factionStateHtml(id, label) {
  const state = game.world.factionStates[id] || { standing: 0, attention: 0 };
  const sentiment = state.standing > 2 ? "Cooperative" : state.standing < -2 ? "Hostile" : "Wary";
  return `
    <div class="stat">
      <b>${state.standing}</b>
      <span>${escapeHtml(label)}</span>
      <span>${sentiment} · Attention ${state.attention}</span>
    </div>
  `;
}

function locationHtml(location) {
  const unlocked = game.world.unlockedLocations.includes(location.id);
  return `
    <article class="card location-card ${unlocked ? "" : "locked"}">
      <p class="eyebrow">${location.icon} ${unlocked ? "Unlocked" : location.unlock}</p>
      <h3>${escapeHtml(location.name)}</h3>
      <p>${escapeHtml(location.description)}</p>
      ${unlocked ? `<div class="tag-list"><span class="tag good">Available</span></div>` : `<div class="tag-list"><span class="tag risk">Restricted</span></div>`}
    </article>
  `;
}

function renderMissions() {
  const visible = ACTIVITIES.filter((activity) => !activity.location || game.world.unlockedLocations.includes(activity.location) || requirementText(activity).length <= 2);
  const grouped = groupActivitiesByLocation(visible);
  return `
    <div class="screen-title">
      <p class="eyebrow">Assignments</p>
      <h2>Choose the next alien activity.</h2>
      <p>Activities resolve from deterministic seeds so re-rendering never rerolls important outcomes.</p>
    </div>
    ${Object.entries(grouped).map(([location, activities]) => `
      <section class="mission-band">
        <div class="section-header">
          <div>
            <h3>${escapeHtml(location)}</h3>
            <p>${escapeHtml(locationFlavor(location))}</p>
          </div>
        </div>
        <div class="grid">${activities.map(activityHtml).join("")}</div>
      </section>
    `).join("")}
  `;
}

function groupActivitiesByLocation(activities) {
  return activities.reduce((groups, activity) => {
    const location = activity.location ? LOCATIONS.find((entry) => entry.id === activity.location)?.name || activity.location : "Adoption Office";
    groups[location] ||= [];
    groups[location].push(activity);
    return groups;
  }, {});
}

function locationFlavor(location) {
  return {
    "Adoption Office": "Low-risk care, records work, training, and agency survival.",
    "Neon Market": "Money, rumors, soft diplomacy, and questionable receipts.",
    "Research District": "Data, scans, origin clues, and ethical pressure.",
    "Wreck Fields": "Salvage, expeditions, navigation hazards, and old signals.",
    "Human Observation Zone": "Social interpretation, reputation, and cultural trouble.",
    "Forbidden Moon": "Late-campaign origin work under quarantine."
  }[location] || "Unlocked assignments for this location.";
}

function activityHtml(activity) {
  const busy = Boolean(game.timers.alienActivity);
  const enoughVitality = game.alien.needs.vitality >= activity.vitality;
  const missing = requirementText(activity);
  const locked = missing.length > 0 || !requirementsMet(activity);
  const facilityBonus = facilityBonusForActivity(game, activity);
  const personalityLabel = personalityScoreLabel(game, activity);
  return `
    <article class="card activity-card ${locked ? "locked-card" : ""}">
      <div>
        <p class="eyebrow">${escapeHtml(activity.category)} · ${fmtDuration(activity.durationMs)} · ${getActivityDifficulty(activity)}</p>
        <h3>${escapeHtml(activity.name)}</h3>
        <p>${escapeHtml(activity.report)}</p>
        <div class="tag-list">
          <span class="tag">${activity.location ? LOCATIONS.find((location) => location.id === activity.location)?.name || activity.location : "Office"}</span>
          <span class="tag">${STAT_LABELS[activity.stat]}</span>
          <span class="tag">${escapeHtml(activity.skill)}</span>
          <span class="tag">Vitality ${activity.vitality}</span>
          ${facilityBonus ? `<span class="tag good">Facility +${facilityBonus}</span>` : ""}
          ${personalityLabel ? `<span class="tag ${personalityLabel.includes("-") ? "risk" : "good"}">${escapeHtml(personalityLabel)}</span>` : ""}
          ${missing.map((text) => `<span class="tag risk">${escapeHtml(text)}</span>`).join("")}
        </div>
      </div>
      <button class="button primary" data-action="start-activity" data-id="${activity.id}" aria-label="Start ${escapeHtml(activity.name)}" ${busy || !enoughVitality || locked ? "disabled" : ""}>${locked ? "Locked" : "Start"}</button>
    </article>
  `;
}

function renderArena() {
  const code = encodeChallenge(game);
  return `
    <div class="screen-title">
      <p class="eyebrow">Lunar Arena</p>
      <h2>Static rivals, shareable challenge codes.</h2>
      <p>No live PvP or accounts. Challenge codes are deterministic snapshots that another local game can simulate.</p>
    </div>
    <div class="grid two">
      <section class="panel">
        <div class="panel-header"><div><h3>Exhibition match</h3><p>Costs 15 vitality. Failure causes stress, not campaign loss.</p></div></div>
        <div class="log">${game.world.rivalStates.map((rival) => `<div class="report"><strong>${escapeHtml(rival.name)}</strong><p>Level ${rival.level} · ${escapeHtml(rival.style)} · ${rival.wins} wins</p></div>`).join("")}</div>
        <div class="button-row" style="margin-top:1rem">
          <button class="button primary" data-action="arena-battle" ${game.alien.needs.vitality < 15 ? "disabled" : ""}>Enter exhibition</button>
        </div>
      </section>
      <section class="panel">
        <div class="panel-header"><div><h3>Challenge code</h3><p>Copy this static code to let another browser simulate your alien profile.</p></div></div>
        <textarea class="textarea" readonly>${escapeHtml(code)}</textarea>
        <div class="field" style="margin-top:.8rem">
          <label for="challengeInput">Simulate an imported code</label>
          <textarea id="challengeInput" class="textarea" placeholder="Paste challenge code"></textarea>
        </div>
        <button class="button" data-action="simulate-code">Simulate code</button>
      </section>
    </div>
  `;
}

function renderResearch() {
  return `
    <div class="screen-title">
      <p class="eyebrow">Agency projects</p>
      <h2>Rebuild the office while your alien is busy.</h2>
      <p>Projects use the second timer slot and unlock locations, facilities, research clues, and legal permissions.</p>
    </div>
    <div class="grid">
      ${PROJECTS.map(projectHtml).join("")}
    </div>
  `;
}

function projectHtml(project) {
  const done = game.agency.research.completed.includes(project.id);
  const busy = Boolean(game.timers.agencyProject);
  const affordable = canAfford(project.cost);
  const missingRequirements = requirementText(project);
  const missingResources = missingCostText(project.cost);
  const missing = missingRequirements.concat(missingResources);
  const locked = missingRequirements.length > 0 || !requirementsMet(project);
  const buttonText = done ? "Completed" : locked ? "Locked" : affordable ? "Start" : "Need resources";
  return `
    <article class="card activity-card ${locked ? "locked-card" : ""}">
      <div>
        <p class="eyebrow">${escapeHtml(project.type)} · ${fmtDuration(project.durationMs)}</p>
        <h3>${escapeHtml(project.name)}</h3>
        <p>${escapeHtml(project.description)}</p>
        <div class="tag-list">
          ${Object.entries(project.cost).map(([resource, amount]) => `<span class="tag">${escapeHtml(resource)} ${amount}</span>`).join("")}
          ${missing.map((text) => `<span class="tag risk">${escapeHtml(text)}</span>`).join("")}
          ${done ? `<span class="tag good">Completed</span>` : ""}
        </div>
      </div>
      <button class="button primary" data-action="start-project" data-id="${project.id}" aria-label="${escapeHtml(buttonText)} ${escapeHtml(project.name)}" ${done || busy || !affordable || locked ? "disabled" : ""}>${buttonText}</button>
    </article>
  `;
}

function renderInventory() {
  return `
    <div class="screen-title">
      <p class="eyebrow">Inventory and shop</p>
      <h2>Useful gear, comfort food, no monetization.</h2>
      <p>The deployed game is static: no ads, accounts, real-money purchases, or external services.</p>
    </div>
    <div class="grid two">
      <section class="panel">
        <div class="panel-header"><div><h3>Agency storage</h3><p>${inventoryCount()} / ${game.inventory.capacity} slots used.</p></div></div>
        <div class="inventory-grid">${inventoryHtml()}</div>
      </section>
      <section class="panel">
        <div class="panel-header"><div><h3>Neon Market stock</h3><p>Daily stock is seeded by local date and campaign seed.</p></div></div>
        <div class="inventory-grid">${shopHtml()}</div>
      </section>
    </div>
  `;
}

function inventoryCount() {
  return Object.values(game.inventory.itemStacks).reduce((total, amount) => total + amount, 0) + game.inventory.uniqueItems.length;
}

function inventoryHtml() {
  const stackCards = Object.entries(game.inventory.itemStacks)
    .filter(([, amount]) => amount > 0)
    .map(([id, amount]) => {
      const item = SHOP_ITEMS.find((entry) => entry.id === id);
      if (!item) return "";
      const action = item.type === "Food" ? "use-item" : "equip-item";
      const label = item.type === "Food" ? "Use" : "Equip";
      return itemCard(item, `Owned ${amount}`, `<button class="button" data-action="${action}" data-id="${item.id}" aria-label="${label} ${escapeHtml(item.name)}">${label}</button>`);
    });
  const uniqueCards = game.inventory.uniqueItems.map((id) => {
    const item = SHOP_ITEMS.find((entry) => entry.id === id);
    if (!item) return "";
    const equipped = Object.values(game.alien.equipment).includes(id);
    return itemCard(item, equipped ? "Equipped" : "Owned", `<button class="button" data-action="equip-item" data-id="${item.id}" aria-label="${equipped ? "Equipped" : "Equip"} ${escapeHtml(item.name)}">${equipped ? "Equipped" : "Equip"}</button>`);
  });
  return stackCards.concat(uniqueCards).join("") || `<p class="muted">Storage is empty.</p>`;
}

function shopHtml() {
  const items = getDailyShop();
  return items
    .map((item) => itemCard(item, `${item.cost} credits`, `<button class="button primary" data-action="buy-item" data-id="${item.id}" aria-label="Buy ${escapeHtml(item.name)}" ${game.agency.credits < item.cost ? "disabled" : ""}>Buy</button>`))
    .join("");
}

function itemCard(item, label, action) {
  return `
    <article class="card">
      <p class="eyebrow">${escapeHtml(item.type)} · ${escapeHtml(label)}</p>
      <h3>${escapeHtml(item.name)}</h3>
      <p>${escapeHtml(item.description)}</p>
      <div class="tag-list">
        ${item.bonus ? Object.entries(item.bonus).map(([stat, value]) => `<span class="tag good">+${value} ${STAT_LABELS[stat]}</span>`).join("") : ""}
        ${item.use ? Object.entries(item.use).map(([need, value]) => `<span class="tag good">+${value} ${titleCase(need)}</span>`).join("") : ""}
      </div>
      <div style="margin-top:.75rem">${action}</div>
    </article>
  `;
}

function getDailyShop() {
  const dateKey = clock.dateKey();
  if (game.world.shopStates.dateKey !== dateKey || !game.world.shopStates.inventory.length) {
    const random = rngFrom(game.meta.campaignSeed, dateKey, "shop");
    game.world.shopStates = {
      dateKey,
      inventory: [...SHOP_ITEMS].sort(() => random() - 0.5).slice(0, 3).map((item) => item.id)
    };
  }
  return game.world.shopStates.inventory.map((id) => SHOP_ITEMS.find((item) => item.id === id)).filter(Boolean);
}

function renderSettings() {
  return `
    <div class="screen-title">
      <p class="eyebrow">Local persistence</p>
      <h2>Your save belongs to this browser.</h2>
      <p>Progress is stored in IndexedDB with localStorage backup metadata. Export regularly if you move devices.</p>
    </div>
    <div class="grid two">
      <section class="panel">
        <div class="panel-header"><div><h3>Save tools</h3><p>Static export and import, no accounts required.</p></div></div>
        <div class="button-row">
          <button class="button primary" data-action="export-save">Export save</button>
          <button class="button" data-action="import-open">Import save</button>
          <button class="button" data-action="profile-card">Profile card</button>
          ${game.world.campaignState.ending && !game.world.campaignState.legacyArchived ? `<button class="button" data-action="archive-legacy">Archive legacy</button>` : ""}
          <button class="button warn" data-action="delete-save">Delete save</button>
        </div>
      </section>
      <section class="panel">
        <div class="panel-header"><div><h3>Campaign archive</h3><p>Schema ${SCHEMA_VERSION} · ${GAME_VERSION}</p></div></div>
        <div class="meta-list">
          <span>Save ID: ${escapeHtml(game.meta.saveId)}</span>
          <span>Campaign seed: ${escapeHtml(game.meta.campaignSeed)}</span>
          <span>Created: ${new Date(game.meta.createdAt).toLocaleString()}</span>
          <span>Last saved: ${new Date(game.meta.updatedAt).toLocaleString()}</span>
        </div>
        ${recoveryNoticeHtml()}
      </section>
    </div>
    <section class="panel" style="margin-top:1rem">
      <div class="panel-header"><div><h3>Achievements</h3><p>Local-only milestones.</p></div></div>
      <div class="log">
        ${game.achievements.unlocked.map((entry) => logHtml({ title: entry.title, text: "Unlocked locally.", at: entry.at })).join("") || `<div class="report"><strong>No achievements yet</strong><p>Complete a field report, project, origin clue, or arena win.</p></div>`}
      </div>
    </section>
    ${game.agency.legacyArchive.length ? `
      <section class="panel" style="margin-top:1rem">
        <div class="panel-header"><div><h3>Legacy Archive</h3><p>Completed campaigns preserved in this local save.</p></div></div>
        <div class="legacy-grid">
          ${game.agency.legacyArchive.map(legacyArchiveHtml).join("")}
        </div>
      </section>
    ` : ""}
    ${releaseAboutHtml()}
  `;
}

function releaseAboutHtml() {
  return `
    <section class="panel release-panel" style="margin-top:1rem">
      <div class="panel-header">
        <div>
          <h3>About this build</h3>
          <p>Xeno Agency is a static, local-save browser RPG with no accounts, ads, analytics, or external game servers.</p>
        </div>
        <span class="pill">${escapeHtml(GAME_VERSION)}</span>
      </div>
      <div class="release-grid">
        <div class="report">
          <strong>Release shape</strong>
          <p>Playable offline after first load, installable as a PWA, and ready for static hosting from the repository root.</p>
        </div>
        <div class="report">
          <strong>Credits</strong>
          <p>Game design, writing, implementation, and packaging were developed collaboratively in this local Codex workspace using the provided Xeno Agency visual assets.</p>
        </div>
        <div class="report">
          <strong>Player data</strong>
          <p>Saves stay in this browser through IndexedDB and localStorage backup. Export saves before moving devices or clearing browser storage.</p>
        </div>
      </div>
    </section>
  `;
}

function legacyArchiveHtml(entry) {
  return `
    <article class="legacy-card" style="--accent: ${escapeHtml(entry.accent || "#74f4c7")}">
      ${entry.portraitSrc ? `<img src="${escapeHtml(entry.portraitSrc)}" alt="${escapeHtml(entry.alienName)} archived portrait">` : ""}
      <div>
        <strong>${escapeHtml(entry.alienName)} · ${escapeHtml(entry.endingTitle)}</strong>
        ${entry.variantTitle ? `<em>${escapeHtml(entry.variantTitle)}</em>` : ""}
        <p>${escapeHtml(entry.summary)}</p>
        <div class="tag-list">
          <span class="tag">${escapeHtml(entry.species || "Unknown species")}</span>
          ${entry.motif ? `<span class="tag">${escapeHtml(entry.motif)}</span>` : ""}
          <span class="tag">Level ${entry.level || 1}</span>
          <span class="tag">Trust ${entry.trust || 0}</span>
          ${entry.clues ? `<span class="tag">${entry.clues} clues</span>` : ""}
          ${entry.memories ? `<span class="tag">${entry.memories} memories</span>` : ""}
        </div>
        ${entry.factors?.length ? `<div class="tag-list">${entry.factors.map((factor) => `<span class="tag good">${escapeHtml(factor)}</span>`).join("")}</div>` : ""}
      </div>
    </article>
  `;
}

function logHtml(entry) {
  return `
    <article class="report">
      <strong>${escapeHtml(entry.title)}</strong>
      <p>${escapeHtml(entry.text)}</p>
    </article>
  `;
}

function titleCase(value) {
  return String(value).replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase());
}

function personalizeText(text, state = game) {
  return String(text)
    .replaceAll("{alien}", state.alien.identity.name)
    .replaceAll("{agency}", state.agency.name);
}

function syncAdoptionForm() {
  if (!draft) return;
  const selected = draft.candidates[draft.selected || 0];
  draft.form = {
    agencyName: sanitizeName(document.querySelector("#agencyName")?.value || "Last Light Adoption", "Last Light Adoption"),
    directorName: sanitizeName(document.querySelector("#directorName")?.value || "Director", "Director"),
    alienName: sanitizeName(document.querySelector("#alienName")?.value || selected.suggestedName, selected.suggestedName),
    pronouns: document.querySelector("#pronouns")?.value || selected.pronouns
  };
}

function startActivity(id) {
  const activity = ACTIVITIES.find((entry) => entry.id === id);
  if (!activity || game.timers.alienActivity) return;
  if (activity.location && !game.world.unlockedLocations.includes(activity.location)) {
    showToast("That location is still restricted.");
    return;
  }
  if (!requirementsMet(activity)) {
    showToast(`Locked: ${requirementText(activity).join(", ")}`);
    return;
  }
  if (game.alien.needs.vitality < activity.vitality) {
    showToast("Vitality is too low. Rest is always available.");
    return;
  }
  game.alien.needs.vitality = clamp(game.alien.needs.vitality - activity.vitality, 0, 100);
  const now = clock.now();
  game.timers.alienActivity = { id, name: activity.name, startedAt: now, endsAt: now + activity.durationMs, durationMs: activity.durationMs };
  addLog(game, "Activity Assigned", `${game.alien.identity.name} begins ${activity.name}.`);
  saveGame();
  render();
}

function startProject(id) {
  const project = PROJECTS.find((entry) => entry.id === id);
  if (!project || game.timers.agencyProject) return;
  if (!requirementsMet(project)) {
    showToast(`Locked: ${requirementText(project).join(", ")}`);
    return;
  }
  if (!canAfford(project.cost)) {
    showToast(missingCostText(project.cost).join(", "));
    return;
  }
  payCost(project.cost);
  const now = clock.now();
  game.timers.agencyProject = { id, name: project.name, startedAt: now, endsAt: now + project.durationMs, durationMs: project.durationMs };
  addLog(game, "Project Started", `${project.name} is now underway.`);
  saveGame();
  render();
}

function buyItem(id) {
  const item = SHOP_ITEMS.find((entry) => entry.id === id);
  if (!item || game.agency.credits < item.cost) return;
  if (inventoryCount() >= game.inventory.capacity) {
    showToast("Storage is full.");
    return;
  }
  game.agency.credits -= item.cost;
  if (item.type === "Food") {
    game.inventory.itemStacks[item.id] = (game.inventory.itemStacks[item.id] || 0) + 1;
  } else if (!game.inventory.uniqueItems.includes(item.id)) {
    game.inventory.uniqueItems.push(item.id);
  }
  addLog(game, "Market Purchase", `${item.name} added to storage.`);
  saveGame();
  render();
}

function useItem(id) {
  const item = SHOP_ITEMS.find((entry) => entry.id === id);
  if (!item || !item.use || (game.inventory.itemStacks[id] || 0) <= 0) return;
  game.inventory.itemStacks[id] -= 1;
  Object.entries(item.use).forEach(([need, value]) => {
    game.alien.needs[need] = clamp((game.alien.needs[need] || 0) + value, 0, 100);
  });
  addLog(game, "Item Used", `${game.alien.identity.name} accepts ${item.name}.`);
  saveGame();
  render();
}

function equipItem(id) {
  const item = SHOP_ITEMS.find((entry) => entry.id === id);
  if (!item || !item.slot) return;
  if (!game.inventory.uniqueItems.includes(id)) game.inventory.uniqueItems.push(id);
  game.alien.equipment[item.slot] = id;
  addLog(game, "Gear Equipped", `${game.alien.identity.name} now carries ${item.name}.`);
  saveGame();
  render();
}

function archiveLegacy() {
  const ending = game.world.campaignState.ending;
  if (!ending || game.world.campaignState.legacyArchived) return;
  game.agency.legacyArchive.unshift({
    id: uid("legacy"),
    alienName: game.alien.identity.name,
    species: game.alien.speciesProfile.name,
    endingId: ending.id,
    endingTitle: ending.title,
    variantId: ending.variantId,
    variantTitle: ending.variantTitle,
    summary: ending.text,
    motif: ending.motif || campaignMotif().title,
    factors: ending.factors || endingFactors(game),
    portraitSrc: game.alien.appearance.portraitSrc,
    accent: game.alien.appearance.accent,
    level: game.alien.progression.level,
    trust: Math.round(game.alien.needs.trust),
    clues: game.world.campaignState.originClues,
    memories: game.alien.memories.length,
    bond: bondStage(),
    at: clock.now()
  });
  game.world.campaignState.legacyArchived = true;
  addLog(game, "Legacy Archived", `${game.alien.identity.name} enters the agency legacy as ${ending.title}.`, true);
  saveGame();
  render();
}

function arenaBattle() {
  if (game.alien.needs.vitality < 15) return;
  const random = rngFrom(game.meta.saveId, "arena", game.achievements.progress.arenaWins, clock.dateKey());
  const rival = pick(random, game.world.rivalStates);
  const alienPower =
    game.alien.stats.physique +
    game.alien.stats.reflex +
    game.alien.stats.stability +
    (game.alien.skills.Combat || 0) +
    getEquipmentBonus(game, "physique") +
    Math.floor(random() * 6);
  const rivalPower = 10 + rival.level * 3 + Math.floor(random() * 7);
  game.alien.needs.vitality = clamp(game.alien.needs.vitality - 15, 0, 100);
  if (alienPower >= rivalPower) {
    game.achievements.progress.arenaWins += 1;
    game.agency.reputation += 6;
    game.agency.credits += 55;
    game.alien.progression.xp += 45;
    rival.level += 1;
    addMemory(game, "First Arena Victory", `${game.alien.identity.name} learned the arena crowd can become quiet after a clean win.`);
    addLog(game, "Arena Victory", `${game.alien.identity.name} beats ${rival.name} in an exhibition match.`, true);
  } else {
    rival.wins += 1;
    game.alien.needs.stress = clamp(game.alien.needs.stress + 12, 0, 100);
    game.alien.progression.xp += 16;
    addLog(game, "Arena Loss", `${rival.name} wins the exhibition. ${game.alien.identity.name} still gains experience.`);
  }
  levelCheck(game);
  updateAchievements(game);
  saveGame();
  render();
}

function resolveEvent(id, choiceIndex = 0) {
  const event = game.events.pending.find((entry) => entry.id === id);
  if (!event) return;
  const choice = (event.choices || [])[choiceIndex] || { label: "Record it", text: "The report is added to the agency history.", effects: {} };
  game.events.pending = game.events.pending.filter((entry) => entry.id !== id);
  game.events.completed.push(id);
  game.events.flags.push(event.flag);
  if (!game.world.campaignState.flags.includes(event.flag)) game.world.campaignState.flags.push(event.flag);
  applyOutcomeEffects(game, choice.effects);
  addMemory(game, event.title, `${event.body} Choice: ${choice.label}.`);
  addLog(game, event.title, `${choice.label}. ${choice.text}`, true);
  updateAchievements(game);
  modal = null;
  saveGame();
  render();
}

function encodeChallenge(state) {
  const payload = {
    v: 1,
    name: state.alien.identity.name,
    species: state.alien.speciesProfile.name,
    level: state.alien.progression.level,
    stats: state.alien.stats,
    traits: state.alien.traits.slice(0, 3),
    seed: state.meta.campaignSeed
  };
  return btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
}

function decodeChallenge(code) {
  return JSON.parse(decodeURIComponent(escape(atob(code.trim()))));
}

async function exportSave() {
  const blob = new Blob([JSON.stringify(game, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${game.agency.name.replace(/\W+/g, "-").toLowerCase()}-xeno-save.json`;
  link.click();
  URL.revokeObjectURL(url);
  showToast("Save exported.");
}

function importSaveFromJson(text) {
  if (!text.trim()) throw new Error("Paste a save export before importing.");
  let imported;
  try {
    imported = JSON.parse(text);
  } catch {
    throw new Error("Import failed: that text is not valid JSON.");
  }
  return migrateSave(imported);
}

function openImportModal() {
  modal = { type: "import" };
  render();
}

async function importSaveFromText() {
  const text = document.querySelector("#importSaveText")?.value || "";
  try {
    game = importSaveFromJson(text);
    activeView = "home";
    modal = null;
    await saveGame();
    showToast("Save imported.");
    render();
  } catch (error) {
    showToast(error.message || "That save file could not be imported.");
  }
}

function simulateChallenge() {
  const text = document.querySelector("#challengeInput")?.value || "";
  try {
    const payload = decodeChallenge(text);
    const random = rngFrom(payload.seed, game.meta.saveId, "challenge");
    const local = game.alien.stats.physique + game.alien.stats.reflex + game.alien.stats.stability + Math.floor(random() * 8);
    const remote = payload.stats.physique + payload.stats.reflex + payload.stats.stability + Math.floor(random() * 8);
    addLog(game, "Challenge Simulated", `${game.alien.identity.name} ${local >= remote ? "outmaneuvers" : "is outmaneuvered by"} ${payload.name} of the ${payload.species}.`);
    saveGame();
    render();
  } catch {
    showToast("That challenge code was not readable.");
  }
}

async function createProfileCard() {
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 630;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createLinearGradient(0, 0, 1200, 630);
  gradient.addColorStop(0, "#0b1117");
  gradient.addColorStop(0.55, "#142532");
  gradient.addColorStop(1, "#173022");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1200, 630);
  const img = new Image();
  img.src = game.alien.appearance.portraitSrc || PORTRAIT_LIBRARY[0].src;
  await img.decode().catch(() => {});
  ctx.globalAlpha = 0.32;
  ctx.drawImage(img, 560, 0, 640, 630);
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#74f4c7";
  ctx.font = "700 30px system-ui";
  ctx.fillText("XENO AGENCY PROFILE", 72, 92);
  ctx.fillStyle = "#eef7f3";
  ctx.font = "900 78px system-ui";
  ctx.fillText(game.alien.identity.name, 72, 190);
  ctx.font = "500 34px system-ui";
  ctx.fillText(`${game.alien.speciesProfile.name} · Level ${game.alien.progression.level}`, 76, 240);
  ctx.fillStyle = "#c5d8d9";
  ctx.font = "500 28px system-ui";
  ctx.fillText(`${game.alien.personality.temperament} · ${game.alien.appearance.bodyPlan} · Trust ${Math.round(game.alien.needs.trust)}`, 76, 306);
  ctx.font = "600 24px system-ui";
  ctx.fillText(
    game.world.campaignState.ending
      ? `Ending: ${game.world.campaignState.ending.title} · ${game.world.campaignState.ending.variantTitle || game.world.campaignState.ending.motif || "Legacy"}`
      : `Bond: ${bondStage()} · ${campaignMotif().title} · Clues ${game.world.campaignState.originClues}`,
    76,
    346
  );
  const stats = Object.entries(game.alien.stats);
  stats.forEach(([key, value], index) => {
    const x = 76 + (index % 3) * 150;
    const y = 390 + Math.floor(index / 3) * 88;
    ctx.fillStyle = "rgba(255,255,255,.08)";
    ctx.fillRect(x, y, 124, 58);
    ctx.fillStyle = "#ffc85a";
    ctx.font = "800 30px system-ui";
    ctx.fillText(String(value), x + 14, y + 37);
    ctx.fillStyle = "#eef7f3";
    ctx.font = "500 18px system-ui";
    ctx.fillText(STAT_LABELS[key], x + 54, y + 36);
  });
  modal = { type: "card", src: canvas.toDataURL("image/png") };
  render();
}

function showToast(message) {
  toast = message;
  render();
  setTimeout(() => {
    if (toast === message) {
      toast = "";
      render();
    }
  }, 2400);
}

function focusableModalControls() {
  const dialog = document.querySelector(".modal");
  if (!dialog) return [];
  return [...dialog.querySelectorAll("button:not([disabled]), a[href], textarea, input, select")];
}

document.addEventListener("keydown", (event) => {
  if (!modal) return;
  if (event.key === "Escape") {
    modal = null;
    render();
    return;
  }
  if (event.key !== "Tab") return;
  const controls = focusableModalControls();
  if (!controls.length) return;
  const first = controls[0];
  const last = controls[controls.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});

document.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const action = button.dataset.action;
  if (action === "begin-adoption") {
    draft.step = "adoption";
    render();
  }
  if (action === "select-candidate") {
    syncAdoptionForm();
    draft.selected = Number(button.dataset.index);
    const selected = draft.candidates[draft.selected];
    draft.form.alienName = selected.suggestedName;
    draft.form.pronouns = selected.pronouns;
    render();
  }
  if (action === "random-name") {
    const selected = draft.candidates[draft.selected || 0];
    const name = pick(rngFrom(Date.now(), selected.id), NAME_POOL);
    document.querySelector("#alienName").value = name;
    syncAdoptionForm();
  }
  if (action === "adopt-open") {
    syncAdoptionForm();
    const selected = draft.candidates[draft.selected || 0];
    const alienName = sanitizeName(draft.form.alienName, selected.suggestedName);
    modal = { type: "adopt", name: alienName };
    renderAdoption();
  }
  if (action === "finalize-adoption") {
    const selected = draft.candidates[draft.selected || 0];
    syncAdoptionForm();
    const agencyName = draft.form.agencyName;
    const directorName = draft.form.directorName;
    const alienName = draft.form.alienName || modal.name;
    const pronouns = draft.form.pronouns;
    game = createNewGame({ agencyName, directorName, alienName, pronouns, candidate: selected, campaignSeed: draft.campaignSeed });
    draft = null;
    modal = null;
    activeView = "home";
    await saveGame();
    render();
  }
  if (action === "nav") {
    activeView = button.dataset.view;
    render();
  }
  if (action === "open-event") {
    modal = { type: "event", event: game.events.pending[0] };
    render();
  }
  if (action === "resolve-event") resolveEvent(button.dataset.id, Number(button.dataset.choice || 0));
  if (action === "close-modal") {
    modal = null;
    render();
  }
  if (action === "clear-recovery-notice") {
    localStorage.removeItem(LOAD_ERROR_KEY);
    render();
  }
  if (action === "start-activity") startActivity(button.dataset.id);
  if (action === "start-project") startProject(button.dataset.id);
  if (action === "arena-battle") arenaBattle();
  if (action === "buy-item") buyItem(button.dataset.id);
  if (action === "use-item") useItem(button.dataset.id);
  if (action === "equip-item") equipItem(button.dataset.id);
  if (action === "export-save") exportSave();
  if (action === "import-open") openImportModal();
  if (action === "import-save") importSaveFromText();
  if (action === "simulate-code") simulateChallenge();
  if (action === "profile-card") createProfileCard();
  if (action === "archive-legacy") archiveLegacy();
  if (action === "delete-save") {
    if (confirm("Delete the local Xeno Agency save?")) {
      await dbDelete(CURRENT_KEY);
      localStorage.removeItem(BACKUP_KEY);
      localStorage.removeItem(LOAD_ERROR_KEY);
      game = null;
      activeView = "home";
      draft = null;
      render();
    }
  }
});

window.addEventListener("beforeunload", () => {
  if (game) localStorage.setItem("xeno-agency-backup", JSON.stringify(game));
});

async function boot() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  }
  try {
    game = await loadSave();
    if (game && processOffline(game)) await saveGame();
    const requestedView = new URLSearchParams(location.search).get("view");
    if (game && requestedView && NAV_ITEMS.some(([id]) => id === requestedView)) activeView = requestedView;
  } catch {
    game = null;
  }
  render();
  setInterval(async () => {
    if (!game) return;
    const completed = processTimers(game);
    if (completed) await saveGame();
    if (clock.now() - lastRenderAt > 900) render();
  }, 1000);
}

boot();
