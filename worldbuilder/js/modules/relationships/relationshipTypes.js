export const RELATIONSHIP_TYPES = [
  type("located-in", "spatial", "Located in", "contains", "directed", ["settlement", "district", "document", "historicalEvent"], ["star-system", "settlement", "organization"]),
  type("contains", "spatial", "Contains", "located-in", "directed"),
  type("connected-by-route", "spatial", "Connected by route", "connected-by-route", "undirected"),
  type("operates-in", "institutional", "Operates in", "hosts-operations-for", "directed", ["organization", "faction"], ["settlement", "star-system"]),
  type("employed-by", "institutional", "Employed by", "employs", "directed", ["character"], ["organization", "faction"]),
  type("works-for", "institutional", "Works for", "employs", "directed", ["character"], ["organization"]),
  type("leads", "institutional", "Leads", "led-by", "directed", ["character"], ["organization", "faction"]),
  type("governs", "institutional", "Governs", "governed-by", "directed", ["organization", "faction"], ["settlement", "star-system"]),
  type("member-of", "factional", "Member of", "has-member", "directed", ["character", "organization"], ["faction", "organization"]),
  type("sympathizes-with", "factional", "Sympathizes with", "has-sympathizer", "directed", ["character", "organization"], ["faction"]),
  type("allied-with", "political", "Allied with", "allied-with", "reciprocal"),
  type("coalition-partner", "political", "Coalition partner", "coalition-partner", "reciprocal"),
  type("opposes", "political", "Opposes", "opposed-by", "directed"),
  type("rival-of", "political", "Rival of", "rival-of", "reciprocal"),
  type("influences", "political", "Influences", "influenced-by", "directed"),
  type("funded-by", "political", "Funded by", "funds", "directed"),
  type("infiltrates", "informational", "Infiltrates", "infiltrated-by", "directed"),
  type("participant-in", "conflict", "Participant in", "has-participant", "directed", ["character", "organization", "settlement", "faction"], ["conflict"]),
  type("affected-by", "conflict", "Affected by", "affects", "directed", ["character", "organization", "settlement", "faction"], ["conflict", "historicalEvent"]),
  type("caused", "conflict", "Caused", "caused-by", "directed"),
  type("mediated", "conflict", "Mediated", "mediated-by", "directed"),
  type("authored", "documentary", "Authored", "authored-by", "directed", ["character", "organization", "faction"], ["document"]),
  type("received", "documentary", "Received", "received-by", "directed", ["character", "organization"], ["document"]),
  type("mentioned-in", "documentary", "Mentioned in", "mentions", "directed", ["character", "organization", "settlement", "faction", "conflict", "historicalEvent"], ["document"]),
  type("implicated-by", "documentary", "Implicated by", "implicates", "directed", ["character", "organization", "faction"], ["document"]),
  type("revealed-by", "documentary", "Revealed by", "reveals", "directed"),
  type("created-by", "historical", "Created by", "created", "directed", ["organization", "settlement", "faction", "relationship"], ["historicalEvent"]),
  type("transformed-by", "historical", "Transformed by", "transformed", "directed", ["organization", "settlement", "faction", "relationship"], ["historicalEvent"]),
  type("commemorates", "historical", "Commemorates", "commemorated-by", "directed"),
  type("supplies", "economic", "Supplies", "supplied-by", "directed", ["organization", "settlement"], ["organization", "settlement"]),
  type("depends-on", "economic", "Depends on", "depended-on-by", "directed"),
  type("trades-with", "economic", "Trades with", "trades-with", "reciprocal"),
  type("knows-about", "informational", "Knows about", "known-by", "directed"),
  type("conceals-from", "informational", "Conceals from", "hidden-from", "directed"),
  type("surveils", "informational", "Surveils", "surveilled-by", "directed"),
  type("investigates", "informational", "Investigates", "investigated-by", "directed")
];

export const RELATIONSHIP_TYPE_MAP = Object.fromEntries(RELATIONSHIP_TYPES.map(item => [item.id, item]));

export function relationshipTypeFor(id) {
  return RELATIONSHIP_TYPE_MAP[id] || type(id || "related-to", "custom", title(id || "Related to"), "", "contextual");
}

function type(id, family, label, inverseType, directionality, allowedSourceTypes = [], allowedTargetTypes = []) {
  return {
    id,
    family,
    label,
    inverseType,
    directionality,
    allowedSourceTypes,
    allowedTargetTypes,
    supportsStrength: true,
    supportsSentiment: ["institutional", "personal", "political", "factional"].includes(family),
    supportsChronology: true,
    supportsVisibility: true,
    supportsEvidence: true,
    validationRules: []
  };
}

function title(value) {
  return String(value).replace(/-/g, " ").replace(/\b\w/g, char => char.toUpperCase());
}
