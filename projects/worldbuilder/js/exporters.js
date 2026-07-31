export function slug(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(value);
}

export function download(filename, type, content) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportJson(org) {
  download(`${slug(org.identity.name)}.json`, "application/json", JSON.stringify(org, null, 2));
}

export function exportMarkdown(org) {
  const md = [
    `# ${org.identity.name}`,
    "",
    `Registry number: ${org.identity.registryNumber}`,
    `Seed: ${org.seed}`,
    "",
    org.summary,
    "",
    "## Profile",
    `- Industry: ${org.profile.industry}`,
    `- Headquarters: ${org.headquarters.settlement}, ${org.headquarters.world}`,
    `- Employees: ${formatNumber(org.profile.employeeCount)}`,
    `- Reputation: ${org.profile.reputation}`,
    `- Risk: ${org.profile.riskRating}`,
    `- Transparency: ${org.profile.transparency}/100`,
    "",
    "## History",
    ...org.history.map(item => `- ${item.year}: ${item.title}. ${item.description}`),
    "",
    "## Products",
    ...org.products.map(item => `- ${item.model}: ${item.description}`),
    "",
    "## Incidents",
    ...org.incidents.map(item => `- ${item.id} (${item.severity}): ${item.summary}`),
    "",
    "## Documents",
    ...org.documents.map(doc => `- ${doc.title} [${doc.classification}]`)
  ].join("\n");
  download(`${slug(org.identity.name)}.md`, "text/markdown", md);
}

export function exportSvg(org, variant = "horizontal") {
  const svg = org.branding[variant] || org.branding.horizontal;
  download(`${slug(org.identity.name)}-${variant}.svg`, "image/svg+xml", svg);
}

export function exportLibrary(store) {
  download("icr-saved-organizations.json", "application/json", JSON.stringify(store, null, 2));
}

export function exportVisualPng(org, kind = "summary") {
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 675;
  const ctx = canvas.getContext("2d");
  paintBase(ctx, org, canvas, kind);
  if (kind === "badge") paintBadge(ctx, org);
  else if (kind === "poster") paintPoster(ctx, org);
  else if (kind === "incident") paintIncident(ctx, org);
  else paintProfile(ctx, org);
  canvas.toBlob(blob => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${slug(org.identity.name)}-${kind}.png`;
    link.click();
    URL.revokeObjectURL(url);
  });
}

function paintBase(ctx, org, canvas, kind) {
  ctx.fillStyle = "#101316";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(255,255,255,.035)";
  for (let x = 0; x < canvas.width; x += 42) ctx.fillRect(x, 0, 1, canvas.height);
  for (let y = 0; y < canvas.height; y += 42) ctx.fillRect(0, y, canvas.width, 1);
  ctx.strokeStyle = org.branding.primaryColor;
  ctx.lineWidth = 6;
  ctx.strokeRect(42, 42, 1116, 591);
  ctx.fillStyle = org.branding.primaryColor;
  ctx.fillRect(82, 82, 128, 128);
  ctx.fillStyle = "#101316";
  ctx.font = "bold 44px Arial";
  ctx.textAlign = "center";
  ctx.fillText(org.identity.acronym, 146, 160);
  ctx.textAlign = "left";
  ctx.font = "20px monospace";
  ctx.fillStyle = org.branding.accentColor;
  ctx.fillText(`${kind.toUpperCase()} EXPORT / ${org.identity.registryNumber}`, 82, 258);
}

function paintProfile(ctx, org) {
  ctx.fillStyle = "#f2eee6";
  ctx.font = "bold 54px Arial";
  wrapCanvas(ctx, org.identity.name, 250, 128, 820, 62);
  ctx.font = "28px Arial";
  ctx.fillStyle = "#a7adb0";
  wrapCanvas(ctx, org.summary, 82, 340, 1020, 40);
  ctx.font = "24px monospace";
  ctx.fillStyle = "#f2eee6";
  ctx.fillText(`Risk ${org.profile.riskRating} / Transparency ${org.profile.transparency} / Seed ${org.seed}`, 82, 575);
}

function paintBadge(ctx, org) {
  ctx.fillStyle = "#f2eee6";
  ctx.font = "bold 50px Arial";
  ctx.fillText("TEMPORARY ACCESS CREDENTIAL", 250, 132);
  ctx.font = "34px Arial";
  ctx.fillText(org.identity.name, 82, 330);
  ctx.font = "26px monospace";
  ctx.fillStyle = "#a7adb0";
  ctx.fillText(`CLEARANCE: ${org.profile.riskRating.toUpperCase()} / DEPARTMENT: REGISTRY REVIEW`, 82, 390);
  ctx.fillText(`EMPLOYEE: VISITING ANALYST / EXPIRES: 2326-12-31`, 82, 435);
  ctx.fillStyle = org.branding.accentColor;
  for (let i = 0; i < 34; i += 1) ctx.fillRect(82 + i * 18, 520, i % 3 === 0 ? 9 : 4, 70);
}

function paintPoster(ctx, org) {
  ctx.fillStyle = "#f2eee6";
  ctx.font = "bold 64px Arial";
  wrapCanvas(ctx, org.documents.find(doc => doc.type === "Recruitment poster")?.headline || "YOUR FUTURE HAS GRAVITY", 82, 350, 900, 70);
  ctx.font = "30px Arial";
  ctx.fillStyle = "#a7adb0";
  wrapCanvas(ctx, `Join ${org.identity.name}. ${org.culture.benefit} included for qualified personnel.`, 82, 505, 980, 42);
  ctx.fillStyle = org.branding.accentColor;
  ctx.fillRect(900, 82, 160, 430);
}

function paintIncident(ctx, org) {
  const incident = org.incidents[0];
  ctx.fillStyle = "#d86a5d";
  ctx.font = "bold 58px Arial";
  ctx.fillText("INCIDENT REPORT", 250, 132);
  ctx.font = "28px monospace";
  ctx.fillStyle = "#f2eee6";
  ctx.fillText(`${incident.id} / ${incident.severity} / ${incident.classification}`, 82, 330);
  ctx.font = "30px Arial";
  ctx.fillStyle = "#a7adb0";
  wrapCanvas(ctx, incident.summary, 82, 390, 980, 42);
  ctx.fillStyle = "#111";
  ctx.fillRect(82, 555, 390, 36);
}

function wrapCanvas(ctx, text, x, y, maxWidth, lineHeight) {
  const words = String(text).split(" ");
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, y);
      line = word;
      y += lineHeight;
    } else {
      line = test;
    }
  }
  ctx.fillText(line, x, y);
}
