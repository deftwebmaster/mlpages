import { APP_CONFIG } from "./app-config.js";
import {
  ACTION_VERBS,
  EQUIVALENCE_TERMS,
  GENERIC_PHRASES,
  NONSTANDARD_HEADING_HINTS,
  SAMPLE_JOB,
  SAMPLE_RESUME,
  SECTION_DEFINITIONS,
  SKILL_TERMS,
  STOP_WORDS
} from "./data.js";

const CATEGORY_LABELS = {
  parsing: "Parsing and Readability",
  structure: "Resume Structure",
  job: "Job Alignment",
  impact: "Evidence and Impact",
  hygiene: "Content Hygiene"
};

const state = {
  activeTab: "overview",
  textMode: "cleaned",
  showLineNumbers: true,
  searchQuery: "",
  dismissedRecommendations: new Set(),
  completedRecommendations: new Set(),
  document: null,
  sections: [],
  contact: null,
  findings: [],
  scores: null,
  recommendations: [],
  job: null,
  demoMode: false,
  analysisDate: null
};

const $ = selector => document.querySelector(selector);
const $$ = selector => Array.from(document.querySelectorAll(selector));

document.addEventListener("DOMContentLoaded", init);

function init() {
  $$("[data-app-name]").forEach(node => { node.textContent = APP_CONFIG.name; });
  $("#footerVersion").textContent = `v${APP_CONFIG.version}`;
  bindEvents();
  registerServiceWorker();
  if (new URLSearchParams(window.location.search).get("demo") === "1") {
    loadDemo();
  }
}

function bindEvents() {
  const fileInput = $("#fileInput");
  const dropZone = $("#dropZone");
  $("#browseButton").addEventListener("click", () => fileInput.click());
  $("#demoButton").addEventListener("click", loadDemo);
  $("#uploadAnotherButton").addEventListener("click", () => {
    clearState();
    fileInput.click();
  });
  $("#clearDataButton").addEventListener("click", clearState);
  $("#printButton").addEventListener("click", () => {
    setTab("report");
    requestAnimationFrame(() => window.print());
  });
  $("#reloadApp").addEventListener("click", () => window.location.reload());

  fileInput.addEventListener("change", event => {
    const file = event.target.files?.[0];
    if (file) processFile(file);
    fileInput.value = "";
  });

  ["dragenter", "dragover"].forEach(name => {
    dropZone.addEventListener(name, event => {
      event.preventDefault();
      dropZone.classList.add("dragging");
    });
  });
  ["dragleave", "drop"].forEach(name => {
    dropZone.addEventListener(name, event => {
      event.preventDefault();
      dropZone.classList.remove("dragging");
    });
  });
  dropZone.addEventListener("drop", event => {
    const file = event.dataTransfer.files?.[0];
    if (file) processFile(file);
  });
  dropZone.addEventListener("keydown", event => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      fileInput.click();
    }
  });

  $$(".tab-button").forEach(button => {
    button.addEventListener("click", () => setTab(button.dataset.tab));
  });
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("./sw.js").then(registration => {
    registration.addEventListener("updatefound", () => {
      const worker = registration.installing;
      if (!worker) return;
      worker.addEventListener("statechange", () => {
        if (worker.state === "installed" && navigator.serviceWorker.controller) {
          $("#updateNotice").hidden = false;
        }
      });
    });
  }).catch(() => {});
}

async function processFile(file) {
  clearError();
  const validation = validateFile(file);
  if (!validation.ok) {
    showError(validation.title, validation.message, validation.detail);
    return;
  }

  showProcessing(file, 0);
  try {
    await stepPause();
    showProcessing(file, 1);
    const parsed = await parseFile(file);
    showProcessing(file, 2);
    await stepPause();
    const documentModel = buildDocumentModel(file, parsed);
    showProcessing(file, 3);
    await analyzeDocument(documentModel, false);
    showProcessing(file, 4);
    await stepPause();
    showDashboard();
  } catch (error) {
    const title = error?.userTitle || "Something went wrong while analyzing the file.";
    const message = error?.userMessage || "Your document was not uploaded anywhere. Try exporting it again or uploading a simpler PDF, DOCX, or TXT version.";
    showError(title, message, error?.message || String(error));
  } finally {
    $("#processingPanel").hidden = true;
  }
}

function validateFile(file) {
  const extension = getExtension(file.name);
  if (!APP_CONFIG.acceptedExtensions.includes(extension) || !APP_CONFIG.acceptedMimeTypes.includes(file.type)) {
    return {
      ok: false,
      title: "This file type is not supported.",
      message: "Upload a PDF, DOCX, or TXT resume.",
      detail: `Detected extension: ${extension || "none"}. Detected type: ${file.type || "unknown"}.`
    };
  }
  if (file.size > APP_CONFIG.maxFileSizeBytes) {
    return {
      ok: false,
      title: "This file is larger than the 10 MB limit.",
      message: "Export a smaller resume file or upload the original DOCX/TXT version.",
      detail: `${file.name} is ${formatBytes(file.size)}.`
    };
  }
  return { ok: true };
}

async function parseFile(file) {
  const extension = getExtension(file.name);
  if (extension === "txt") return parseTxt(file);
  if (extension === "docx") return parseDocx(file);
  if (extension === "pdf") return parsePdf(file);
  throw new Error("Unsupported parser route.");
}

async function parseTxt(file) {
  const rawText = await file.text();
  return { rawText, layoutText: rawText, textItems: [], pageCount: 1, extractionWarnings: [] };
}

async function parseDocx(file) {
  if (!window.mammoth?.extractRawText) {
    throw Object.assign(new Error("Mammoth.js did not load."), {
      userTitle: "The DOCX parser could not be loaded.",
      userMessage: "Refresh the page and try again. Your document was not uploaded anywhere."
    });
  }
  const arrayBuffer = await file.arrayBuffer();
  const result = await window.mammoth.extractRawText({ arrayBuffer });
  return {
    rawText: result.value || "",
    layoutText: result.value || "",
    textItems: [],
    pageCount: null,
    extractionWarnings: (result.messages || []).map(item => item.message)
  };
}

async function parsePdf(file) {
  const pdfjs = await import("./vendor/pdf.min.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("./vendor/pdf.worker.min.mjs", import.meta.url).toString();
  const data = await file.arrayBuffer();
  let pdf;
  try {
    pdf = await pdfjs.getDocument({ data }).promise;
  } catch (error) {
    if (/password/i.test(error?.name || error?.message || "")) {
      throw Object.assign(error, {
        userTitle: "This PDF appears to be password protected.",
        userMessage: "Export an unlocked PDF or upload the original DOCX version."
      });
    }
    throw Object.assign(error, {
      userTitle: "This document could not be opened.",
      userMessage: "Try exporting it again or uploading the original DOCX version."
    });
  }

  const textItems = [];
  const pageTexts = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent({ includeMarkedContent: false });
    const items = content.items
      .filter(item => item.str && item.str.trim())
      .map((item, index) => {
        const [a, b, c, d, x, y] = item.transform;
        return {
          text: item.str,
          x,
          y,
          width: item.width || 0,
          height: Math.abs(d || item.height || 0),
          page: pageNumber,
          order: index
        };
      });
    textItems.push(...items);
    pageTexts.push(items.map(item => item.text).join(" "));
  }

  const layoutText = reconstructPdfText(textItems);
  return {
    rawText: pageTexts.join("\n\n--- Page Break ---\n\n"),
    layoutText,
    textItems,
    pageCount: pdf.numPages,
    extractionWarnings: []
  };
}

function reconstructPdfText(items) {
  const byPage = groupBy(items, item => item.page);
  const pages = Object.keys(byPage).sort((a, b) => Number(a) - Number(b)).map(page => {
    const pageItems = byPage[page].slice().sort((a, b) => b.y - a.y || a.x - b.x);
    const lines = [];
    pageItems.forEach(item => {
      const line = lines.find(candidate => Math.abs(candidate.y - item.y) <= Math.max(3, item.height * 0.6));
      if (line) {
        line.items.push(item);
        line.y = (line.y + item.y) / 2;
      } else {
        lines.push({ y: item.y, items: [item] });
      }
    });
    return lines
      .sort((a, b) => b.y - a.y)
      .map(line => line.items.sort((a, b) => a.x - b.x).map(item => item.text).join(" "))
      .join("\n");
  });
  return pages.join("\n\n--- Page Break ---\n\n");
}

function buildDocumentModel(file, parsed) {
  const rawText = parsed.rawText || "";
  const normalizedText = normalizeResumeText(parsed.layoutText || rawText);
  if (!rawText.trim() && !normalizedText.trim()) {
    throw Object.assign(new Error("No extractable text."), {
      userTitle: "We could not find readable text in this document.",
      userMessage: "It may be a scanned PDF or the text may be stored as images. ATS Lens does not perform OCR in this version."
    });
  }
  return {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    fileName: file.name,
    fileType: getExtension(file.name).toUpperCase(),
    fileSize: file.size,
    pageCount: parsed.pageCount,
    uploadedAt: new Date(),
    rawText,
    normalizedText,
    textItems: parsed.textItems || [],
    extractionWarnings: parsed.extractionWarnings || []
  };
}

async function analyzeDocument(documentModel, demoMode) {
  const sections = detectSections(documentModel.normalizedText);
  const contact = detectContact(documentModel.normalizedText);
  const findings = runDiagnostics(documentModel, sections, contact);
  state.document = documentModel;
  state.sections = sections;
  state.contact = contact;
  state.findings = findings;
  state.job = null;
  state.scores = calculateScores(findings, null);
  state.recommendations = buildRecommendations(findings, null);
  state.demoMode = demoMode;
  state.analysisDate = new Date();
}

function normalizeResumeText(value) {
  return value
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
    .replace(/[•●▪◦]/g, "-")
    .replace(/[–—]/g, "-")
    .replace(/[ \t]{3,}/g, "  ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();
}

function detectSections(text) {
  const lines = text.split("\n");
  const found = [];
  let cursor = 0;
  lines.forEach((line, lineIndex) => {
    const cleaned = cleanHeading(line);
    SECTION_DEFINITIONS.forEach(definition => {
      const matched = definition.headings.find(heading => cleanHeading(heading) === cleaned);
      if (matched && line.trim().length <= 55) {
        found.push({
          id: `${definition.id}-${lineIndex}`,
          canonicalType: definition.id,
          label: definition.label,
          detectedHeading: line.trim(),
          startIndex: cursor,
          endIndex: text.length,
          text: "",
          confidence: matched === cleaned ? "High" : "Medium",
          status: "Detected",
          warning: ""
        });
      }
    });
    cursor += line.length + 1;
  });

  found.sort((a, b) => a.startIndex - b.startIndex);
  found.forEach((section, index) => {
    const next = found[index + 1];
    section.endIndex = next ? next.startIndex : text.length;
    section.text = text.slice(section.startIndex, section.endIndex).trim();
    if (section.text.length < section.detectedHeading.length + 20) {
      section.status = "Unclear Boundaries";
      section.warning = "This heading was detected, but the surrounding section content is short or hard to separate.";
    }
  });

  const output = [];
  SECTION_DEFINITIONS.forEach(definition => {
    const matches = found.filter(item => item.canonicalType === definition.id);
    if (matches.length) {
      output.push(...matches);
    } else if (definition.id === "contact") {
      output.push({
        id: "contact-inferred",
        canonicalType: "contact",
        label: definition.label,
        detectedHeading: "Top resume lines",
        startIndex: 0,
        endIndex: Math.min(text.length, 420),
        text: text.slice(0, 420),
        confidence: "Medium",
        status: "Possibly Detected",
        warning: "Contact details are usually inferred from the top of the resume rather than a formal heading."
      });
    } else {
      output.push({
        id: `${definition.id}-missing`,
        canonicalType: definition.id,
        label: definition.label,
        detectedHeading: "",
        startIndex: -1,
        endIndex: -1,
        text: "",
        confidence: "Low",
        status: definition.required ? "Missing" : "Missing",
        warning: definition.required ? "Strongly recommended section was not detected." : ""
      });
    }
  });
  return output;
}

function detectContact(text) {
  const emails = unique(text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || []);
  const phones = unique(text.match(/(?:\+?1[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}/g) || []);
  const urls = unique(text.match(/\b(?:https?:\/\/)?(?:www\.)?[a-z0-9.-]+\.[a-z]{2,}(?:\/[^\s)]*)?/gi) || []);
  const linkedin = urls.filter(url => /linkedin\.com/i.test(url));
  const github = urls.filter(url => /github\.com/i.test(url));
  const portfolio = urls.filter(url => !/linkedin\.com|github\.com/i.test(url));
  const cityState = text.match(/\b[A-Z][a-z]+(?: [A-Z][a-z]+)?,\s?(?:A[LKZR]|C[AOT]|D[CE]|FL|GA|HI|I[ADLN]|K[SY]|LA|M[ADEHINOST]|N[CDEHJMVY]|O[HKR]|PA|RI|S[CD]|T[NX]|UT|V[AIT]|W[AIVY])\b/);
  const firstLines = text.split("\n").slice(0, 5).map(line => line.trim()).filter(Boolean);
  const nameCandidate = firstLines.find(line => /^[A-Z][A-Za-z'.-]+(?:\s+[A-Z][A-Za-z'.-]+){1,3}$/.test(line)) || firstLines[0] || "";
  return {
    name: nameCandidate,
    emails,
    phones,
    urls,
    cityState: cityState?.[0] || "",
    linkedin,
    github,
    portfolio,
    firstContactIndex: Math.min(
      ...[...emails, ...phones, ...urls].map(item => text.indexOf(item)).filter(index => index >= 0),
      Number.POSITIVE_INFINITY
    )
  };
}

function runDiagnostics(documentModel, sections, contact) {
  const findings = [];
  const text = documentModel.normalizedText;
  const raw = documentModel.rawText;
  const words = getWords(text);
  const lines = text.split("\n").map(line => line.trim()).filter(Boolean);
  const bullets = getBullets(text);
  const experience = sections.find(section => section.canonicalType === "experience" && section.status !== "Missing");
  const skills = sections.find(section => section.canonicalType === "skills" && section.status !== "Missing");
  const education = sections.find(section => section.canonicalType === "education" && section.status !== "Missing");
  const summary = sections.find(section => section.canonicalType === "summary" && section.status !== "Missing");
  const metrics = text.match(/\b(?:\d+%|\$[\d,.]+|\d+[xX]|\d+\+|\d{2,}\s?(?:users|customers|orders|reports|hours|days|weeks|months|people|facilities|locations|records|units))\b/g) || [];

  const add = findingFactory(findings);
  if (text.length < 45) add("PARSE_NO_TEXT", "No extractable text", "Critical", "parsing", 15, "The extracted text is empty or nearly empty.", "Export a text-based PDF or upload the original DOCX/TXT file.", sample(text));
  else if (text.length < 800) add("PARSE_LOW_TEXT", "Very low extracted character count", "Moderate", "parsing", 6, "The resume has less extractable text than expected for a complete resume.", "Confirm the ATS View includes all major content.", `${text.length} extracted characters.`);
  if (documentModel.fileType === "PDF" && documentModel.pageCount && text.length < documentModel.pageCount * 250) add("PARSE_IMAGE_ONLY", "Possible image-only PDF", "Critical", "parsing", 12, "The PDF has pages but very little selectable text.", "Use a text-based PDF or upload the original DOCX. ATS Lens does not perform OCR.", `${documentModel.pageCount} page(s), ${text.length} characters.`);
  if (hasMultiColumnRisk(documentModel.textItems)) add("PARSE_MULTI_COLUMN", "Possible two-column reading-order issue", "Moderate", "parsing", 6, "Text appears to alternate between separate horizontal regions.", "Check the ATS View for interleaved sections and consider a simpler single-column layout.", "PDF text coordinates show multiple left-edge clusters.");
  if (documentModel.textItems.filter(item => item.text.trim().length === 1).length > documentModel.textItems.length * 0.22) add("PARSE_FRAGMENTS", "Excessive single-character fragments", "Moderate", "parsing", 5, "Many PDF text items were extracted as isolated characters.", "Export from the original document using selectable text.", "More than 22% of PDF items are one-character fragments.");
  if ((raw.match(/�/g) || []).length > 2) add("PARSE_REPLACEMENT_CHAR", "Suspicious replacement characters", "Moderate", "parsing", 4, "The extracted text contains replacement characters, which can signal encoding problems.", "Replace decorative symbols or re-export the file.", "Found replacement characters in extracted text.");
  if (/\S[ \t]{8,}\S/.test(raw)) add("PARSE_EXCESS_WS", "Excessive whitespace", "Minor", "parsing", 2, "Large whitespace gaps can indicate tables, columns, or text boxes.", "Use simple spacing and ordinary paragraphs where possible.", "Wide gaps were found in the raw extraction.");
  if (Number.isFinite(contact.firstContactIndex) && contact.firstContactIndex > Math.max(450, text.length * 0.18)) add("PARSE_CONTACT_LATE", "Contact details read late", "Moderate", "parsing", 5, "Contact information appears unusually far into the extracted reading order.", "Move contact details into the main document body near the top.", `First contact detail starts around character ${contact.firstContactIndex}.`);
  if (/\b(?:https?:\/\/|www\.)[^\s]*\.\s*\n\s*[a-z0-9/.-]+/i.test(raw)) add("PARSE_BROKEN_URL", "URL broken across lines", "Minor", "parsing", 2, "A URL may be split across line breaks.", "Keep important URLs on one line.", "A domain-like pattern is split by a line break.");
  if ((text.match(/[★✓◆◇■□►]/g) || []).length > 6) add("PARSE_DECORATIVE_SYMBOLS", "Excessive decorative symbols", "Minor", "parsing", 2, "Decorative symbols can extract unpredictably.", "Use standard hyphen bullets and plain section dividers.", "Multiple decorative symbols were found.");
  if (/\t/.test(raw) || lines.filter(line => /\S\s{5,}\S\s{5,}\S/.test(line)).length > 4) add("PARSE_TABLE_RISK", "Possible table-based layout", "Moderate", "parsing", 5, "Aligned spacing or tabs suggest content may be arranged in tables.", "Confirm the reading order and consider a simpler layout for critical content.", "Several lines contain tabular spacing.");
  if (lines.length > 35 && lines.filter(line => line.length < 18).length > lines.length * 0.45) add("PARSE_TEXTBOX_RISK", "Possible text-box extraction disorder", "Minor", "parsing", 3, "Many short fragments can happen when text boxes are extracted out of visual order.", "Review the ATS View for broken phrases.", "High ratio of very short extracted lines.");

  if (!experience) add("STRUCT_NO_EXPERIENCE", "Missing experience section", "Critical", "structure", 10, "No standard experience section heading was detected.", "Use a clear heading such as Professional Experience or Work Experience.", "Experience heading not found.");
  if (!skills) add("STRUCT_NO_SKILLS", "Missing skills section", "Moderate", "structure", 6, "No skills section heading was detected.", "Add a clear Skills or Technical Skills section when relevant.", "Skills heading not found.");
  if (!education) add("STRUCT_NO_EDU", "Missing education or qualification section", "Moderate", "structure", 5, "No education or qualification section was detected.", "Add Education, Certifications, or equivalent qualification context.", "Education heading not found.");
  if (!contact.emails.length && !contact.phones.length) add("STRUCT_NO_CONTACT", "Missing contact details", "Critical", "structure", 10, "No email or phone number was detected.", "Add current contact information as selectable text near the top.", "No email or phone pattern found.");
  else {
    if (!contact.emails.length) add("CONTACT_NO_EMAIL", "No email found", "Moderate", "structure", 4, "An email address was not detected.", "Add a professional email address as selectable text.", "Email pattern not found.");
    if (!contact.phones.length) add("CONTACT_NO_PHONE", "No phone number found", "Minor", "structure", 2, "A phone number was not detected.", "Add a complete phone number if you want employers to call you.", "Phone pattern not found.");
  }
  if (contact.emails.length > 1) add("CONTACT_MULTI_EMAIL", "Multiple emails detected", "Minor", "structure", 2, "Multiple email addresses can confuse parsers.", "Keep one preferred email address.", contact.emails.join(", "));
  if (contact.phones.length > 1) add("CONTACT_MULTI_PHONE", "Multiple phone numbers detected", "Minor", "structure", 2, "Multiple phone numbers can create conflicting contact records.", "Keep one preferred phone number.", contact.phones.join(", "));
  if (lines.some(line => NONSTANDARD_HEADING_HINTS.includes(cleanHeading(line)))) add("STRUCT_NONSTANDARD_HEADING", "Nonstandard section heading", "Minor", "structure", 2, "A creative heading may not map to common resume sections.", "Use standard headings for major sections.", "Detected a nonstandard heading.");
  if (sections.some(section => section.status === "Unclear Boundaries")) add("STRUCT_UNCLEAR_BOUNDARIES", "Unclear section boundaries", "Minor", "structure", 3, "At least one detected heading has little separable content.", "Add whitespace and clear headings between sections.", "A detected section has unclear boundaries.");
  if (experience && !/\b(?:19|20)\d{2}\b|present|current/i.test(experience.text)) add("STRUCT_NO_DATES_IN_EXP", "Experience entries without dates", "Moderate", "structure", 5, "The experience section does not appear to include dates.", "Include employment dates for each role.", "No year or present/current phrase found in experience.");
  if (hasInconsistentDates(text)) add("STRUCT_INCONSISTENT_DATES", "Inconsistent date formats", "Minor", "structure", 2, "Several different date styles appear in the resume.", "Use a consistent date style such as Jan 2022 - Present.", "Mixed date styles detected.");
  if (words.length > 1800) add("STRUCT_TOO_LONG", "Resume may be unusually long", "Minor", "structure", 3, "The extracted resume is very long by word count.", "Trim older or less relevant details before cutting useful evidence.", `${words.length} words.`);
  if (words.length < 250) add("STRUCT_TOO_SHORT", "Resume may be unusually short", "Moderate", "structure", 5, "The extracted resume may not contain enough career context.", "Confirm extraction worked and add relevant experience, skills, and qualifications.", `${words.length} words.`);
  if (summary && getWords(summary.text).length > 150) add("STRUCT_LONG_SUMMARY", "Professional summary is long", "Minor", "structure", 2, "Long summaries can bury the most important evidence.", "Keep the summary focused and move details into experience bullets.", `${getWords(summary.text).length} summary words.`);
  if (skills && mostlyVagueSkills(skills.text)) add("STRUCT_VAGUE_SKILLS", "Skills section contains mostly vague traits", "Minor", "structure", 3, "A skills section works best when it includes concrete tools, methods, and domains.", "Replace generic traits with truthful, specific skills.", sample(skills.text));
  if (hasDuplicateSections(sections)) add("STRUCT_DUP_SECTIONS", "Multiple sections appear duplicated", "Minor", "structure", 2, "Duplicate headings can make section boundaries harder to determine.", "Merge repeated sections or give them distinct headings.", "Repeated section heading detected.");

  if (metrics.length < Math.max(2, bullets.length * 0.12)) add("IMPACT_FEW_METRICS", "Few measurable results", "Moderate", "impact", 6, "Few bullets include numbers, scale, money, time, or percentage results.", "Add numbers only where you can support them truthfully.", `${metrics.length} measurable result(s) detected.`);
  if ((text.match(/responsible for/gi) || []).length >= 2) add("IMPACT_RESPONSIBLE_FOR", "Repeated responsibility phrasing", "Minor", "impact", 3, "Repeated 'responsible for' phrasing can read like duties instead of outcomes.", "Lead bullets with concrete actions and outcomes where accurate.", "Multiple 'responsible for' phrases found.");
  if (/\b(I|me|my|mine)\b/.test(text)) add("IMPACT_FIRST_PERSON", "First-person pronouns", "Minor", "impact", 2, "First-person pronouns are uncommon in resumes.", "Use concise resume-style phrasing without I, me, or my.", "First-person pronoun detected.");
  if (bullets.some(bullet => getWords(bullet).length > 38)) add("IMPACT_LONG_BULLETS", "Very long bullet points", "Minor", "impact", 2, "Long bullets are harder for people and parsers to scan.", "Split long bullets or tighten them around action, scope, and result.", "At least one bullet exceeds 38 words.");
  if (bullets.filter(bullet => getWords(bullet).length <= 4).length >= 2) add("IMPACT_SHORT_BULLETS", "Extremely short bullet points", "Minor", "impact", 2, "Very short bullets may lack context or impact.", "Add scope or outcome when the detail is relevant and true.", "Multiple bullets have four words or fewer.");
  if (experience && experience.text.split("\n").some(line => getWords(line).length > 70)) add("IMPACT_DENSE_PARAGRAPHS", "Dense paragraphs inside experience", "Moderate", "impact", 4, "Long dense lines in experience can hide accomplishments.", "Convert dense experience paragraphs into clear bullets.", "A long experience line exceeds 70 words.");
  if (hasRepeatedOpenings(bullets)) add("IMPACT_REPEATED_OPENINGS", "Repeated bullet openings", "Minor", "impact", 2, "Several bullets start with the same word.", "Vary action verbs where the underlying work differs.", "Repeated bullet opening detected.");
  if (hasRepetitiveVerbs(bullets)) add("IMPACT_REPETITIVE_VERBS", "Repetitive verbs", "Minor", "impact", 2, "The same action verb is used repeatedly.", "Use precise verbs that reflect the actual work.", "Repeated resume verb detected.");

  if (/lorem ipsum|insert|todo|tbd|your name|company name/i.test(text)) add("HYGIENE_PLACEHOLDER", "Obvious placeholder text", "Moderate", "hygiene", 5, "Placeholder text appears in the resume.", "Remove placeholders before submitting.", "Placeholder-like phrase found.");
  if (/\b(\w+)\s+\1\b/i.test(text)) add("HYGIENE_REPEATED_WORDS", "Repeated words", "Minor", "hygiene", 2, "A repeated word pattern was detected.", "Proofread the surrounding sentence.", "Repeated adjacent word found.");
  if (hasDuplicateBullets(bullets)) add("HYGIENE_DUP_BULLETS", "Duplicate bullet points", "Minor", "hygiene", 3, "Duplicate bullets can look careless and dilute evidence.", "Remove or consolidate duplicate bullets.", "Duplicate bullet text detected.");
  if (hasKeywordStuffing(words)) add("HYGIENE_KEYWORD_STUFFING", "Excessive keyword repetition", "Minor", "hygiene", 3, "One or more nontrivial terms repeat unusually often.", "Use keywords naturally and support them with evidence.", "High repetition detected.");
  if (/[()]/.test(documentModel.fileName) || /final|copy|version|\d{6,}/i.test(documentModel.fileName)) add("HYGIENE_FILE_NAME", "Unprofessional file name", "Minor", "hygiene", 1, "The file name may look informal or versioned.", "Use a clean file name such as Firstname-Lastname-Resume.pdf.", documentModel.fileName);
  if (/[^\x09\x0A\x0D\x20-\x7E]/.test(text.replace(/[•●▪◦–—]/g, ""))) add("HYGIENE_UNSUPPORTED_CHARS", "Unsupported characters", "Minor", "hygiene", 2, "Some characters may render inconsistently across systems.", "Use common punctuation and standard bullets.", "Non-ASCII characters detected.");
  if (hasMixedBullets(text)) add("HYGIENE_MIXED_BULLETS", "Mixed bullet styles", "Minor", "hygiene", 2, "Several bullet marker styles are mixed.", "Use one simple bullet style consistently.", "Mixed bullet characters detected.");
  if (hasInconsistentHeadingCaps(lines)) add("HYGIENE_HEADING_CAPS", "Inconsistent capitalization in headings", "Minor", "hygiene", 1, "Heading capitalization appears inconsistent.", "Choose one heading style and apply it consistently.", "Mixed all-caps and title-case headings detected.");
  if (hasInconsistentBulletPunctuation(bullets)) add("HYGIENE_BULLET_PUNCT", "Inconsistent punctuation across bullets", "Minor", "hygiene", 1, "Some bullets end with punctuation and others do not.", "Use consistent punctuation across similar bullets.", "Mixed bullet punctuation detected.");
  if ((text.match(/\b(?:was|were|is|are|been|being)\s+\w+ed\b/gi) || []).length > 5) add("HYGIENE_PASSIVE", "Passive phrasing appears often", "Minor", "hygiene", 2, "Frequent passive phrasing can make accomplishments feel less direct.", "Use active phrasing when it remains accurate.", "Several passive-voice-like patterns found.");
  if (hasJargonDensity(words)) add("HYGIENE_JARGON", "Unusually high jargon density", "Minor", "hygiene", 2, "The resume may lean heavily on acronyms or specialized terms without context.", "Keep technical terms, but add context or outcomes where helpful.", "High acronym density detected.");
  if (text.split(/[.!?]\s+/).some(sentence => getWords(sentence).length > 45)) add("HYGIENE_LONG_SENTENCE", "Very long sentences", "Minor", "hygiene", 2, "Long sentences can be difficult to scan.", "Split long sentences into tighter statements.", "A sentence exceeds 45 words.");

  return findings;
}

function findingFactory(findings) {
  return (ruleId, title, severity, category, deduction, description, recommendation, evidence) => {
    findings.push({
      id: `${ruleId}-${findings.length + 1}`,
      ruleId,
      title,
      description,
      severity,
      category,
      deduction,
      evidence,
      recommendation,
      suppresses: [],
      relatedFindings: []
    });
  };
}

function calculateScores(findings, jobAnalysis) {
  const weights = { ...APP_CONFIG.scoreWeights };
  const categories = Object.keys(weights).map(id => {
    const maxPoints = weights[id];
    if (id === "job" && !jobAnalysis) {
      return {
        id,
        label: CATEGORY_LABELS[id],
        maxPoints,
        earnedPoints: 0,
        deductions: [],
        status: "Not yet analyzed",
        summary: "Paste a job description to evaluate alignment."
      };
    }
    const categoryFindings = findings.filter(finding => finding.category === id);
    const deductionTotal = Math.min(maxPoints, categoryFindings.reduce((sum, finding) => sum + finding.deduction, 0));
    let earnedPoints = Math.max(0, maxPoints - deductionTotal);
    let summary = categoryFindings.length ? `${categoryFindings.length} finding(s) affect this category.` : "No major issues detected in this category.";
    if (id === "job" && jobAnalysis) {
      earnedPoints = Math.round(jobAnalysis.score / 100 * maxPoints);
      summary = `${jobAnalysis.matchedImportant} important term(s) matched and ${jobAnalysis.missingImportant} important term(s) missing.`;
    }
    return {
      id,
      label: CATEGORY_LABELS[id],
      maxPoints,
      earnedPoints,
      deductions: categoryFindings.map(finding => ({
        ruleId: finding.ruleId,
        title: finding.title,
        points: finding.deduction,
        explanation: finding.description
      })),
      status: "Analyzed",
      summary
    };
  });

  const active = categories.filter(category => category.status !== "Not yet analyzed");
  const earned = active.reduce((sum, category) => sum + category.earnedPoints, 0);
  const possible = active.reduce((sum, category) => sum + category.maxPoints, 0);
  const overall = possible ? Math.round(earned / possible * 100) : 0;
  return { overall, rating: ratingForScore(overall), categories, activePossible: possible };
}

function buildRecommendations(findings, jobAnalysis) {
  const priorityOrder = { "Fix First": 0, "High Value": 1, "Worth Improving": 2, "Optional Polish": 3 };
  const recommendations = findings.map(finding => ({
    id: `rec-${finding.ruleId}`,
    priority: priorityForFinding(finding),
    title: finding.title,
    explanation: finding.description,
    action: finding.recommendation,
    evidence: finding.evidence,
    relatedRuleIds: [finding.ruleId],
    category: finding.category,
    estimatedImpact: `${finding.deduction} point${finding.deduction === 1 ? "" : "s"} in ${CATEGORY_LABELS[finding.category]}`
  }));

  if (jobAnalysis) {
    jobAnalysis.missing.slice(0, 6).forEach(term => {
      recommendations.push({
        id: `rec-job-${slug(term.jobKeyword.displayTerm)}`,
        priority: term.jobKeyword.importance === "High" ? "Fix First" : "High Value",
        title: `Address ${term.jobKeyword.displayTerm} if it is truthful`,
        explanation: "This important job-description term does not appear in the extracted resume.",
        action: "Add it only if it accurately reflects your experience, tools, credentials, or accomplishments.",
        evidence: term.jobKeyword.sourceContext,
        relatedRuleIds: ["JOB_MISSING_TERM"],
        category: "job",
        estimatedImpact: "Job Alignment"
      });
    });
  }

  return recommendations
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
    .slice(0, 18);
}

function priorityForFinding(finding) {
  if (finding.severity === "Critical") return "Fix First";
  if (["PARSE_MULTI_COLUMN", "PARSE_CONTACT_LATE", "STRUCT_NO_EXPERIENCE", "STRUCT_NO_SKILLS", "IMPACT_FEW_METRICS"].includes(finding.ruleId)) return "High Value";
  if (finding.severity === "Moderate") return "High Value";
  if (finding.severity === "Minor") return "Worth Improving";
  return "Optional Polish";
}

function analyzeJobDescription(text) {
  const keywords = extractJobKeywords(text);
  const resumeNorm = normalizeForCompare(state.document.normalizedText);
  const matches = keywords.map(keyword => matchKeyword(keyword, resumeNorm));
  const matched = matches.filter(match => match.matchType !== "Missing");
  const missing = matches.filter(match => match.matchType === "Missing");
  const important = matches.filter(match => match.jobKeyword.importance !== "Low");
  const importantMatched = important.filter(match => match.matchType !== "Missing");
  const score = important.length ? Math.round(importantMatched.reduce((sum, match) => sum + match.confidence, 0) / important.length * 100) : 0;
  const title = detectJobTitle(text);
  const titleAlignment = compareTitleAlignment(title, state.document.normalizedText);
  return {
    rawText: text,
    title,
    characterCount: text.length,
    keywords,
    matches,
    matched,
    missing,
    possible: matches.filter(match => match.matchType === "Possible Match" || match.matchType === "Related Variant"),
    score,
    matchedImportant: importantMatched.length,
    missingImportant: important.length - importantMatched.length,
    titleAlignment,
    required: detectRequirements(text, "required"),
    preferred: detectRequirements(text, "preferred")
  };
}

function extractJobKeywords(text) {
  const normalized = normalizeForCompare(stripBoilerplate(text));
  const candidates = new Map();
  const add = (term, type, base = 1, context = "") => {
    const normalizedTerm = normalizeForCompare(term);
    if (!normalizedTerm || STOP_WORDS.has(normalizedTerm) || normalizedTerm.length < 3) return;
    const current = candidates.get(normalizedTerm) || {
      normalizedTerm,
      displayTerm: titleCase(term),
      type,
      importance: "Low",
      frequency: 0,
      score: 0,
      sourceContext: context || contextForTerm(text, term),
      requiredStatus: /required|must|min(?:imum)?/i.test(context || contextForTerm(text, term)) ? "Required" : "Preferred or Contextual"
    };
    current.frequency += countOccurrences(normalized, normalizedTerm);
    current.score += base + (current.requiredStatus === "Required" ? 2 : 0) + (normalizedTerm.includes(" ") ? 1 : 0);
    candidates.set(normalizedTerm, current);
  };

  SKILL_TERMS.forEach(term => {
    if (normalized.includes(normalizeForCompare(term))) add(term, "Tool or Skill", 3);
  });

  const words = normalized.split(/\s+/).filter(word => word && !STOP_WORDS.has(word));
  for (let size = 3; size >= 2; size -= 1) {
    for (let i = 0; i <= words.length - size; i += 1) {
      const phrase = words.slice(i, i + size).join(" ");
      if (phrase.length > 9 && !/\b(?:equal opportunity|apply online|job description|paid time)\b/.test(phrase)) {
        const frequency = countOccurrences(normalized, phrase);
        if (frequency >= 2) add(phrase, "Repeated Phrase", frequency);
      }
    }
  }

  const years = text.match(/\b\d+\+?\s*(?:years|yrs)\b[^.\n]*/gi) || [];
  years.forEach(item => add(item, "Experience Requirement", 4, item));
  const certs = text.match(/\b(?:pmp|cpa|cfa|shrm|lean six sigma|six sigma|aws certified|comptia|security\+)\b/gi) || [];
  certs.forEach(item => add(item, "Certification", 5, contextForTerm(text, item)));

  return Array.from(candidates.values())
    .map(item => ({
      ...item,
      frequency: Math.max(1, item.frequency),
      importance: item.score >= 7 ? "High" : item.score >= 4 ? "Medium" : "Low"
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 28);
}

function matchKeyword(keyword, resumeNorm) {
  const term = keyword.normalizedTerm;
  const variants = [term, ...(EQUIVALENCE_TERMS[term] || []), ...Object.entries(EQUIVALENCE_TERMS).filter(([, values]) => values.includes(term)).map(([key]) => key)];
  const matchedVariant = variants.find(variant => resumeNorm.includes(normalizeForCompare(variant)));
  if (matchedVariant) {
    const exact = matchedVariant === term;
    return {
      jobKeyword: keyword,
      resumeTerm: matchedVariant,
      matchType: exact ? "Exact Match" : "Related Variant",
      confidence: exact ? 1 : 0.78,
      resumeOccurrences: countOccurrences(resumeNorm, normalizeForCompare(matchedVariant)),
      resumeSections: sectionsContaining(matchedVariant)
    };
  }
  const partial = term.split(" ").filter(part => part.length > 3).filter(part => resumeNorm.includes(part));
  if (partial.length >= Math.max(1, Math.ceil(term.split(" ").length / 2))) {
    return {
      jobKeyword: keyword,
      resumeTerm: partial.join(", "),
      matchType: "Possible Match",
      confidence: 0.48,
      resumeOccurrences: partial.length,
      resumeSections: sectionsContaining(partial[0])
    };
  }
  return {
    jobKeyword: keyword,
    resumeTerm: "",
    matchType: "Missing",
    confidence: 0,
    resumeOccurrences: 0,
    resumeSections: []
  };
}

function showDashboard() {
  document.body.classList.add("dashboard-active");
  $("#landingView").hidden = true;
  $("#dashboardView").hidden = false;
  $("#demoBadge").hidden = !state.demoMode;
  $("#currentFileName").textContent = `${state.document.fileName} - ${state.document.fileType}, ${formatBytes(state.document.fileSize)}`;
  renderAll();
  setTab("overview");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderAll() {
  renderOverview();
  renderAtsView();
  renderStructure();
  renderJobMatch();
  renderRecommendations();
  renderReport();
}

function renderOverview() {
  const counts = countBy(state.findings, finding => finding.severity.toLowerCase());
  $("#overviewPanel").innerHTML = `
    <div class="summary-grid">
      <section class="card score-hero" aria-labelledby="scoreTitle">
        <div class="score-ring ${scoreClass(state.scores.overall)}">
          <strong>${state.scores.overall}</strong>
        </div>
        <div>
          <h2 id="scoreTitle">${state.scores.rating}</h2>
          <p class="muted">${scoreSummary()}</p>
        </div>
        <div class="trust-row" aria-label="Finding counts">
          <span>${counts.critical || 0} critical</span>
          <span>${counts.moderate || 0} moderate</span>
          <span>${counts.minor || 0} minor</span>
        </div>
      </section>
      <section class="score-grid" aria-label="Score breakdown">
        ${state.scores.categories.map(renderCategoryCard).join("")}
      </section>
    </div>
    <details class="card score-details">
      <summary>How this score was calculated</summary>
      <div class="finding-list">
        ${state.scores.categories.map(category => `
          <article class="finding">
            <h3>${escapeHtml(category.label)}</h3>
            <p>${category.status === "Not yet analyzed" ? "Not yet analyzed." : `${category.earnedPoints} of ${category.maxPoints} points earned.`}</p>
            ${category.deductions.length ? category.deductions.map(deduction => `<p><strong>-${deduction.points}</strong> ${escapeHtml(deduction.title)}: ${escapeHtml(deduction.explanation)}</p>`).join("") : "<p>No deductions in this category.</p>"}
          </article>
        `).join("")}
      </div>
      <p class="muted">${escapeHtml(APP_CONFIG.disclaimer)}</p>
    </details>
    <section class="card">
      <div class="section-heading">
        <p class="eyebrow">Top actions</p>
        <h2>Recommended next steps</h2>
      </div>
      <div class="recommendation-grid">
        ${state.recommendations.slice(0, 3).map(renderRecommendation).join("") || "<p class=\"muted\">No priority recommendations right now.</p>"}
      </div>
    </section>
    <section class="card">
      <div class="section-heading">
        <p class="eyebrow">Major diagnostics</p>
        <h2>Findings affecting the score</h2>
      </div>
      <div class="finding-list">
        ${state.findings.slice(0, 10).map(renderFinding).join("") || "<p class=\"muted\">No findings detected.</p>"}
      </div>
    </section>
  `;
}

function renderCategoryCard(category) {
  const percent = category.status === "Not yet analyzed" ? 0 : Math.round(category.earnedPoints / category.maxPoints * 100);
  return `
    <article class="card category-card">
      <div class="finding-meta">
        <span class="badge">${category.status}</span>
        <span class="badge">${category.status === "Not yet analyzed" ? "Not scored" : `${category.earnedPoints}/${category.maxPoints}`}</span>
      </div>
      <h3>${escapeHtml(category.label)}</h3>
      <meter class="score-meter ${scoreClass(percent)}" min="0" max="100" value="${percent}" aria-label="${escapeHtml(category.label)} ${percent}%"></meter>
      <p class="muted">${escapeHtml(category.summary)}</p>
    </article>
  `;
}

function renderAtsView() {
  const text = state.textMode === "raw" ? state.document.rawText : state.document.normalizedText;
  const lines = text.split("\n");
  const headings = new Set(state.sections.filter(section => section.status !== "Missing").map(section => cleanHeading(section.detectedHeading)));
  $("#atsPanel").innerHTML = `
    <section class="card">
      <div class="text-tools">
        <div>
          <p class="eyebrow">ATS View</p>
          <h2>Estimated reading order</h2>
          <p class="muted">Potential parsing risks are highlighted as warnings, not definitive failures.</p>
        </div>
        <div class="copy-row">
          <button class="secondary-button" type="button" data-action="copy-text">Copy Text</button>
          <button class="secondary-button" type="button" data-action="toggle-lines">${state.showLineNumbers ? "Hide" : "Show"} Line Numbers</button>
        </div>
      </div>
      <div class="text-toolbar">
        <div class="mode-row" role="group" aria-label="Text extraction mode">
          <button class="chip-button ${state.textMode === "raw" ? "active" : ""}" type="button" data-mode="raw">Raw Extraction</button>
          <button class="chip-button ${state.textMode === "cleaned" ? "active" : ""}" type="button" data-mode="cleaned">Cleaned Extraction</button>
        </div>
        <label>
          <span class="sr-only">Search extracted text</span>
          <input id="textSearch" type="search" value="${escapeAttr(state.searchQuery)}" placeholder="Search extracted text">
        </label>
      </div>
      <div class="text-viewer ${state.showLineNumbers ? "" : "hide-line-numbers"}" role="region" aria-label="Extracted resume text" tabindex="0">
        ${lines.map((line, index) => renderTextLine(line, index, headings)).join("")}
      </div>
    </section>
  `;
  $("#atsPanel").querySelector("[data-action='copy-text']").addEventListener("click", () => copyText(text));
  $("#atsPanel").querySelector("[data-action='toggle-lines']").addEventListener("click", () => {
    state.showLineNumbers = !state.showLineNumbers;
    renderAtsView();
  });
  $$("#atsPanel [data-mode]").forEach(button => {
    button.addEventListener("click", () => {
      state.textMode = button.dataset.mode;
      renderAtsView();
    });
  });
  $("#textSearch").addEventListener("input", event => {
    state.searchQuery = event.target.value;
    renderAtsView();
  });
}

function renderTextLine(line, index, headings) {
  const clean = cleanHeading(line);
  const suspicious = /�|[★✓◆◇■□►]/.test(line);
  const orderRisk = index > 10 && /@|\(?\d{3}\)?|linkedin|github/i.test(line);
  const classes = ["line", headings.has(clean) ? "heading" : "", suspicious ? "suspicious" : "", orderRisk ? "order-risk" : ""].filter(Boolean).join(" ");
  return `<div class="${classes}"><span class="line-number">${index + 1}</span><span class="line-text">${highlight(line, state.searchQuery)}</span></div>`;
}

function renderStructure() {
  const contactRows = [
    ["Name", state.contact.name],
    ["Email", state.contact.emails.join(", ")],
    ["Phone", state.contact.phones.join(", ")],
    ["City and state", state.contact.cityState],
    ["LinkedIn", state.contact.linkedin.join(", ")],
    ["Portfolio", state.contact.portfolio.join(", ")],
    ["GitHub", state.contact.github.join(", ")]
  ];
  $("#structurePanel").innerHTML = `
    <div class="structure-grid">
      <section class="card">
        <div class="section-heading">
          <p class="eyebrow">Section detection</p>
          <h2>Resume structure</h2>
        </div>
        <div class="section-list">
          ${state.sections.map(section => `
            <article class="section-item">
              <div class="finding-meta">
                <span class="status-pill ${statusClass(section.status)}">${escapeHtml(section.status)}</span>
                <span class="badge">${escapeHtml(section.confidence)} confidence</span>
              </div>
              <h3>${escapeHtml(section.label)}</h3>
              <p>${section.detectedHeading ? `Detected heading: <strong>${escapeHtml(section.detectedHeading)}</strong>` : "No standard heading detected."}</p>
              <p class="muted">${section.startIndex >= 0 ? `Approximate text range: ${section.startIndex}-${section.endIndex}` : "No text range available."}</p>
              ${section.warning ? `<p>${escapeHtml(section.warning)}</p>` : ""}
            </article>
          `).join("")}
        </div>
      </section>
      <aside class="card">
        <div class="section-heading">
          <p class="eyebrow">Contact detection</p>
          <h2>Detected details</h2>
        </div>
        <div class="contact-grid">
          ${contactRows.map(([label, value]) => `
            <article class="contact-item">
              <span class="badge">${escapeHtml(label)}</span>
              <p>${value ? escapeHtml(value) : "<span class=\"muted\">Not found</span>"}</p>
            </article>
          `).join("")}
        </div>
      </aside>
    </div>
  `;
}

function renderJobMatch() {
  const jobText = state.job?.rawText || "";
  $("#jobPanel").innerHTML = `
    <div class="job-grid">
      <section class="card job-input">
        <div class="section-heading">
          <p class="eyebrow">Job-description alignment</p>
          <h2>Compare with a job</h2>
          <p class="muted">The pasted job description is analyzed locally in this browser session.</p>
        </div>
        <textarea id="jobDescription" placeholder="Paste the job description here...">${escapeHtml(jobText)}</textarea>
        <div class="text-tools">
          <span class="muted" id="jobCharCount">${jobText.length} characters</span>
          <div class="copy-row">
            <button class="secondary-button" type="button" data-action="sample-job">Sample Job</button>
            <button class="secondary-button" type="button" data-action="clear-job">Clear</button>
            <button class="primary-button" type="button" data-action="compare-job">Compare With Job</button>
          </div>
        </div>
        <p class="muted">Short descriptions can be analyzed, but 300+ characters usually produces better keyword signals.</p>
      </section>
      <aside class="card">
        <div class="section-heading">
          <p class="eyebrow">Match summary</p>
          <h2>${state.job ? `${state.job.score}/100 alignment` : "Not yet analyzed"}</h2>
        </div>
        ${state.job ? renderJobSummary() : "<p class=\"muted\">Paste a job description and run the comparison to update the Job Alignment category and overall score.</p>"}
      </aside>
    </div>
    ${state.job ? `
      <section class="card">
        <div class="section-heading">
          <p class="eyebrow">Matched terms</p>
          <h2>What appears in the extracted resume</h2>
        </div>
        <div class="keyword-cloud">${state.job.matched.slice(0, 18).map(match => `<span class="keyword-chip matched">${escapeHtml(match.jobKeyword.displayTerm)} - ${escapeHtml(match.matchType)}</span>`).join("")}</div>
      </section>
      <section class="card">
        <div class="section-heading">
          <p class="eyebrow">Missing terms</p>
          <h2>Terms to consider only if truthful</h2>
        </div>
        <div class="term-list">${state.job.missing.slice(0, 12).map(renderMissingTerm).join("") || "<p class=\"muted\">No important missing terms detected.</p>"}</div>
      </section>
      <section class="card">
        <div class="section-heading">
          <p class="eyebrow">Possible matches</p>
          <h2>Concepts that may be expressed differently</h2>
        </div>
        <div class="term-list">${state.job.possible.slice(0, 8).map(renderPossibleTerm).join("") || "<p class=\"muted\">No possible conceptual matches detected.</p>"}</div>
      </section>
    ` : ""}
  `;
  const textarea = $("#jobDescription");
  textarea.addEventListener("input", event => {
    $("#jobCharCount").textContent = `${event.target.value.length} characters`;
  });
  $("#jobPanel [data-action='sample-job']").addEventListener("click", () => {
    textarea.value = SAMPLE_JOB;
    $("#jobCharCount").textContent = `${SAMPLE_JOB.length} characters`;
  });
  $("#jobPanel [data-action='clear-job']").addEventListener("click", () => {
    state.job = null;
    state.scores = calculateScores(state.findings, null);
    state.recommendations = buildRecommendations(state.findings, null);
    renderAll();
    setTab("job");
  });
  $("#jobPanel [data-action='compare-job']").addEventListener("click", () => {
    const text = textarea.value.trim();
    if (text.length < 30) {
      alert("Paste more of the job description before comparing.");
      return;
    }
    state.job = analyzeJobDescription(text);
    state.scores = calculateScores(state.findings, state.job);
    state.recommendations = buildRecommendations(state.findings, state.job);
    renderAll();
    setTab("job");
  });
}

function renderJobSummary() {
  return `
    <div class="finding-list">
      <article class="finding">
        <span class="badge">Target title</span>
        <h3>${escapeHtml(state.job.title || "Unable to determine")}</h3>
        <p>Title alignment: <strong>${escapeHtml(state.job.titleAlignment)}</strong></p>
      </article>
      <article class="finding">
        <span class="badge">Important terms</span>
        <p>${state.job.matchedImportant} matched, ${state.job.missingImportant} missing.</p>
      </article>
      <article class="finding">
        <span class="badge">Required qualifications</span>
        <p>${state.job.required.length ? escapeHtml(state.job.required.slice(0, 3).join(" | ")) : "Unable to determine."}</p>
      </article>
      <article class="finding">
        <span class="badge">Preferred qualifications</span>
        <p>${state.job.preferred.length ? escapeHtml(state.job.preferred.slice(0, 3).join(" | ")) : "Unable to determine."}</p>
      </article>
    </div>
  `;
}

function renderMissingTerm(match) {
  return `
    <article class="term-item">
      <div class="term-meta">
        <span class="keyword-chip missing">${escapeHtml(match.jobKeyword.importance)} importance</span>
        <span class="badge">${escapeHtml(match.jobKeyword.type)}</span>
      </div>
      <h3>${escapeHtml(match.jobKeyword.displayTerm)}</h3>
      <p class="muted">${escapeHtml(match.jobKeyword.sourceContext || "Context not available.")}</p>
      <p>This term does not appear in the extracted resume. Add it only if it truthfully reflects your experience.</p>
    </article>
  `;
}

function renderPossibleTerm(match) {
  return `
    <article class="term-item">
      <div class="term-meta">
        <span class="keyword-chip possible">${escapeHtml(match.matchType)}</span>
        <span class="badge">${escapeHtml(match.resumeTerm)}</span>
      </div>
      <h3>${escapeHtml(match.jobKeyword.displayTerm)}</h3>
      <p class="muted">Resume sections: ${escapeHtml(match.resumeSections.join(", ") || "Unable to determine")}</p>
    </article>
  `;
}

function renderRecommendations() {
  $("#recommendationsPanel").innerHTML = `
    <section class="card">
      <div class="section-heading">
        <p class="eyebrow">Prioritized recommendations</p>
        <h2>What to improve first</h2>
      </div>
      <div class="filter-row">
        <label>Category
          <select id="recommendationFilter">
            <option value="all">All</option>
            ${Object.entries(CATEGORY_LABELS).map(([id, label]) => `<option value="${id}">${label}</option>`).join("")}
          </select>
        </label>
      </div>
      <div class="recommendation-list" id="recommendationList">${state.recommendations.map(renderRecommendation).join("") || "<p class=\"muted\">No recommendations to show.</p>"}</div>
    </section>
  `;
  $("#recommendationFilter").addEventListener("change", event => {
    const value = event.target.value;
    $("#recommendationList").innerHTML = state.recommendations
      .filter(item => value === "all" || item.category === value)
      .map(renderRecommendation)
      .join("") || "<p class=\"muted\">No recommendations match this filter.</p>";
    bindRecommendationButtons();
  });
  bindRecommendationButtons();
}

function bindRecommendationButtons() {
  $$("#recommendationsPanel [data-rec-action], #overviewPanel [data-rec-action]").forEach(button => {
    button.addEventListener("click", () => {
      const targetSet = button.dataset.recAction === "complete" ? state.completedRecommendations : state.dismissedRecommendations;
      targetSet.add(button.dataset.recId);
      renderRecommendations();
      renderOverview();
    });
  });
}

function renderRecommendation(item) {
  const done = state.completedRecommendations.has(item.id);
  const dismissed = state.dismissedRecommendations.has(item.id);
  return `
    <article class="recommendation" data-category="${item.category}">
      <div class="finding-meta">
        <span class="badge">${escapeHtml(item.priority)}</span>
        <span class="badge">${escapeHtml(CATEGORY_LABELS[item.category])}</span>
        ${done ? "<span class=\"status-pill detected\">Completed this session</span>" : ""}
        ${dismissed ? "<span class=\"status-pill possible\">Dismissed this session</span>" : ""}
      </div>
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.explanation)}</p>
      <p><strong>Action:</strong> ${escapeHtml(item.action)}</p>
      <p class="muted">Evidence: ${escapeHtml(item.evidence || "No specific evidence captured.")}</p>
      <div class="copy-row no-print">
        <button class="secondary-button" type="button" data-rec-action="complete" data-rec-id="${escapeAttr(item.id)}">Mark Complete</button>
        <button class="secondary-button" type="button" data-rec-action="dismiss" data-rec-id="${escapeAttr(item.id)}">Dismiss</button>
      </div>
    </article>
  `;
}

function renderReport() {
  $("#reportPanel").innerHTML = `
    <article class="report-sheet">
      <div class="section-heading">
        <p class="eyebrow">ATS Lens Report</p>
        <h1>${escapeHtml(state.document.fileName)}</h1>
        <p class="muted">Analyzed ${state.analysisDate.toLocaleString()} on this device.</p>
      </div>
      <div class="copy-row no-print">
        <button class="secondary-button" type="button" data-copy="summary">Copy Summary</button>
        <button class="secondary-button" type="button" data-copy="recommendations">Copy Recommendations</button>
        <button class="secondary-button" type="button" data-copy="text">Copy Extracted Text</button>
      </div>
      <section class="report-grid">
        <div class="card">
          <h2>${state.scores.overall}/100 - ${escapeHtml(state.scores.rating)}</h2>
          <p>${escapeHtml(scoreSummary())}</p>
        </div>
        <div class="card">
          <h2>Category scores</h2>
          ${state.scores.categories.map(category => `<p>${escapeHtml(category.label)}: ${category.status === "Not yet analyzed" ? "Not yet analyzed" : `${category.earnedPoints}/${category.maxPoints}`}</p>`).join("")}
        </div>
      </section>
      <section class="card">
        <h2>Top recommendations</h2>
        ${state.recommendations.slice(0, 5).map(item => `<p><strong>${escapeHtml(item.priority)}:</strong> ${escapeHtml(item.title)} - ${escapeHtml(item.action)}</p>`).join("") || "<p>No recommendations.</p>"}
      </section>
      <section class="card">
        <h2>Major diagnostics</h2>
        ${state.findings.slice(0, 12).map(finding => `<p><strong>${escapeHtml(finding.severity)}:</strong> ${escapeHtml(finding.title)}. ${escapeHtml(finding.recommendation)}</p>`).join("") || "<p>No findings detected.</p>"}
      </section>
      <section class="card">
        <h2>Detected sections</h2>
        ${state.sections.map(section => `<p>${escapeHtml(section.label)}: ${escapeHtml(section.status)}${section.detectedHeading ? ` (${escapeHtml(section.detectedHeading)})` : ""}</p>`).join("")}
      </section>
      ${state.job ? `<section class="card"><h2>Job-match summary</h2><p>${state.job.score}/100 alignment. ${state.job.matchedImportant} important terms matched and ${state.job.missingImportant} important terms missing.</p><p>High-priority missing terms: ${escapeHtml(state.job.missing.filter(match => match.jobKeyword.importance === "High").slice(0, 8).map(match => match.jobKeyword.displayTerm).join(", ") || "None detected.")}</p></section>` : ""}
      <section class="card">
        <h2>Privacy and ATS disclaimer</h2>
        <p>Your resume and job description were processed locally in your browser and are not stored by default.</p>
        <p>${escapeHtml(APP_CONFIG.disclaimer)}</p>
      </section>
    </article>
  `;
  $$("#reportPanel [data-copy]").forEach(button => {
    button.addEventListener("click", () => {
      if (button.dataset.copy === "summary") copyText(`${state.document.fileName}\nATS-readiness score: ${state.scores.overall}/100 (${state.scores.rating})\n${scoreSummary()}`);
      if (button.dataset.copy === "recommendations") copyText(state.recommendations.map(item => `${item.priority}: ${item.title}\n${item.action}`).join("\n\n"));
      if (button.dataset.copy === "text") copyText(state.document.normalizedText);
    });
  });
}

function renderFinding(finding) {
  return `
    <article class="finding">
      <div class="finding-meta">
        <span class="severity ${finding.severity.toLowerCase()}">${escapeHtml(finding.severity)}</span>
        <span class="badge">${escapeHtml(CATEGORY_LABELS[finding.category])}</span>
        <span class="badge">-${finding.deduction}</span>
      </div>
      <h3>${escapeHtml(finding.title)}</h3>
      <p>${escapeHtml(finding.description)}</p>
      <p><strong>Recommended action:</strong> ${escapeHtml(finding.recommendation)}</p>
      <p class="muted">Evidence: ${escapeHtml(finding.evidence || "No specific evidence captured.")}</p>
    </article>
  `;
}

function loadDemo() {
  const parsed = {
    rawText: SAMPLE_RESUME,
    layoutText: SAMPLE_RESUME,
    textItems: [
      { text: "Operations Analyst", x: 42, y: 700, page: 1 },
      { text: "Skills", x: 340, y: 700, page: 1 },
      { text: "Responsible for weekly reports", x: 42, y: 672, page: 1 },
      { text: "Excel SQL Tableau", x: 340, y: 672, page: 1 }
    ],
    pageCount: 1,
    extractionWarnings: ["Demo resume intentionally includes mild layout disorder."]
  };
  const demoFile = {
    name: "Jordan-Rivers-Demo-Resume.pdf",
    type: "application/pdf",
    size: new Blob([SAMPLE_RESUME]).size
  };
  const doc = buildDocumentModel(demoFile, parsed);
  analyzeDocument(doc, true).then(() => {
    state.job = analyzeJobDescription(SAMPLE_JOB);
    state.scores = calculateScores(state.findings, state.job);
    state.recommendations = buildRecommendations(state.findings, state.job);
    showDashboard();
  });
}

function setTab(tab) {
  state.activeTab = tab;
  $$(".tab-button").forEach(button => button.classList.toggle("active", button.dataset.tab === tab));
  $$(".tab-panel").forEach(panel => panel.classList.toggle("active", panel.id === `${tab}Panel`));
}

function clearState() {
  state.activeTab = "overview";
  state.textMode = "cleaned";
  state.showLineNumbers = true;
  state.searchQuery = "";
  state.dismissedRecommendations.clear();
  state.completedRecommendations.clear();
  state.document = null;
  state.sections = [];
  state.contact = null;
  state.findings = [];
  state.scores = null;
  state.recommendations = [];
  state.job = null;
  state.demoMode = false;
  state.analysisDate = null;
  $("#dashboardView").hidden = true;
  $("#landingView").hidden = false;
  document.body.classList.remove("dashboard-active");
  $("#demoBadge").hidden = true;
  clearError();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showProcessing(file, activeIndex) {
  const labels = ["Reading document", "Reconstructing text", "Detecting sections", "Running diagnostics", "Building report"];
  $("#processingPanel").hidden = false;
  $("#fileMeta").textContent = `${file.name} - ${getExtension(file.name).toUpperCase()}, ${formatBytes(file.size)}`;
  $("#progressSteps").innerHTML = labels.map((label, index) => `<li class="${index < activeIndex ? "done" : index === activeIndex ? "active" : ""}">${label}</li>`).join("");
}

function showError(title, message, detail) {
  const panel = $("#errorPanel");
  panel.hidden = false;
  panel.innerHTML = `
    <h3>${escapeHtml(title)}</h3>
    <p>${escapeHtml(message)}</p>
    <details>
      <summary>Technical details</summary>
      <p>${escapeHtml(detail || "No additional details available.")}</p>
    </details>
  `;
}

function clearError() {
  $("#errorPanel").hidden = true;
  $("#errorPanel").innerHTML = "";
}

function stepPause() {
  return new Promise(resolve => setTimeout(resolve, 120));
}

function getExtension(name) {
  return (name.split(".").pop() || "").toLowerCase();
}

function formatBytes(bytes) {
  if (!bytes) return "0 KB";
  const units = ["B", "KB", "MB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(unit ? 1 : 0)} ${units[unit]}`;
}

function cleanHeading(value) {
  return value.toLowerCase().replace(/[^a-z0-9& ]/g, "").replace(/\s+/g, " ").trim();
}

function getWords(text) {
  return (text.toLowerCase().match(/[a-z0-9+#.]+/g) || []).filter(Boolean);
}

function getBullets(text) {
  return text.split("\n").map(line => line.trim()).filter(line => /^[-*]\s+/.test(line)).map(line => line.replace(/^[-*]\s+/, ""));
}

function unique(items) {
  return Array.from(new Set(items.map(item => item.trim()).filter(Boolean)));
}

function sample(text) {
  return text.replace(/\s+/g, " ").trim().slice(0, 180);
}

function groupBy(items, keyFn) {
  return items.reduce((groups, item) => {
    const key = keyFn(item);
    groups[key] ||= [];
    groups[key].push(item);
    return groups;
  }, {});
}

function countBy(items, keyFn) {
  return items.reduce((counts, item) => {
    const key = keyFn(item);
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

function countOccurrences(haystack, needle) {
  if (!needle) return 0;
  return (haystack.match(new RegExp(escapeRegex(needle), "g")) || []).length;
}

function hasMultiColumnRisk(items) {
  if (!items || items.length < 20) return false;
  const xs = items.map(item => Math.round(item.x / 60) * 60);
  const clusters = countBy(xs, x => x);
  const strongClusters = Object.values(clusters).filter(count => count >= items.length * 0.12).length;
  const alternations = items.slice(1).filter((item, index) => Math.abs(item.x - items[index].x) > 220 && Math.abs(item.y - items[index].y) < 22).length;
  return strongClusters >= 2 && alternations > 4;
}

function hasInconsistentDates(text) {
  const formats = [
    /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}\b/i,
    /\b\d{1,2}\/\d{4}\b/,
    /\b\d{4}\s*-\s*(?:\d{4}|present|current)\b/i
  ];
  return formats.filter(regex => regex.test(text)).length >= 2;
}

function mostlyVagueSkills(text) {
  const words = getWords(text);
  const genericCount = GENERIC_PHRASES.filter(phrase => text.toLowerCase().includes(phrase)).length;
  const concreteCount = SKILL_TERMS.filter(term => text.toLowerCase().includes(term)).length;
  return genericCount >= 2 && concreteCount < 4 && words.length > 8;
}

function hasDuplicateSections(sections) {
  const detected = sections.filter(section => section.status !== "Missing").map(section => section.canonicalType);
  return new Set(detected).size !== detected.length;
}

function hasRepeatedOpenings(bullets) {
  const openings = bullets.map(bullet => getWords(bullet)[0]).filter(Boolean);
  const counts = countBy(openings, word => word);
  return Object.values(counts).some(count => count >= 3);
}

function hasRepetitiveVerbs(bullets) {
  const openings = bullets.map(bullet => getWords(bullet)[0]).filter(word => ACTION_VERBS.includes(word));
  const counts = countBy(openings, word => word);
  return Object.values(counts).some(count => count >= 3);
}

function hasDuplicateBullets(bullets) {
  const normalized = bullets.map(bullet => normalizeForCompare(bullet)).filter(Boolean);
  return new Set(normalized).size !== normalized.length;
}

function hasKeywordStuffing(words) {
  const meaningful = words.filter(word => word.length > 4 && !STOP_WORDS.has(word));
  const counts = countBy(meaningful, word => word);
  return Object.entries(counts).some(([, count]) => count >= 12 && count / Math.max(meaningful.length, 1) > 0.05);
}

function hasMixedBullets(text) {
  return [/^-\s/m, /^\*\s/m, /^•\s/m, /^▪\s/m].filter(regex => regex.test(text)).length >= 2;
}

function hasInconsistentHeadingCaps(lines) {
  const headingish = lines.filter(line => line.length < 45 && /^[A-Za-z &]+$/.test(line));
  const allCaps = headingish.filter(line => line === line.toUpperCase()).length;
  const titleCase = headingish.filter(line => /^[A-Z][a-z]+/.test(line)).length;
  return allCaps >= 2 && titleCase >= 2;
}

function hasInconsistentBulletPunctuation(bullets) {
  if (bullets.length < 4) return false;
  const punctuated = bullets.filter(bullet => /[.;:]$/.test(bullet.trim())).length;
  return punctuated > 0 && punctuated < bullets.length;
}

function hasJargonDensity(words) {
  const acronyms = words.filter(word => /^[a-z]{2,5}$/.test(word) && word === word.toUpperCase()).length;
  return acronyms > 12 && acronyms / Math.max(words.length, 1) > 0.08;
}

function ratingForScore(score) {
  if (score >= 90) return "Excellent";
  if (score >= 80) return "Strong";
  if (score >= 70) return "Generally Compatible";
  if (score >= 60) return "Needs Improvement";
  if (score >= 40) return "High Parsing Risk";
  return "Major Compatibility Problems";
}

function scoreSummary() {
  const critical = state.findings.filter(finding => finding.severity === "Critical").length;
  if (critical) return "Address the critical parsing or structure issues first, then refine content evidence and job alignment.";
  if (!state.job) return "This pre-job score excludes Job Alignment and is normalized around active categories.";
  return "The score combines parsing compatibility, structure, job alignment, evidence, and content hygiene.";
}

function scoreColor(score) {
  if (score >= 80) return "var(--green)";
  if (score >= 60) return "var(--amber)";
  return "var(--red)";
}

function scoreClass(score) {
  if (score >= 80) return "good";
  if (score >= 60) return "mid";
  return "low";
}

function statusClass(status) {
  return status.toLowerCase().split(" ")[0];
}

function normalizeForCompare(text) {
  return text.toLowerCase().replace(/[^\w+#.]+/g, " ").replace(/\s+/g, " ").trim();
}

function stripBoilerplate(text) {
  return text.replace(/equal opportunity[\s\S]*$/i, "").replace(/benefits include[\s\S]*$/i, "");
}

function titleCase(text) {
  return text.split(/\s+/).map(word => word ? word[0].toUpperCase() + word.slice(1).toLowerCase() : "").join(" ");
}

function contextForTerm(text, term) {
  const index = text.toLowerCase().indexOf(term.toLowerCase());
  if (index < 0) return "";
  return text.slice(Math.max(0, index - 80), Math.min(text.length, index + term.length + 100)).replace(/\s+/g, " ").trim();
}

function detectJobTitle(text) {
  const lines = text.split("\n").map(line => line.trim()).filter(Boolean);
  const explicit = lines.find(line => /job title|position/i.test(line));
  if (explicit) return explicit.replace(/job title|position|:/gi, "").trim();
  return lines.find(line => line.length <= 70 && /analyst|manager|engineer|designer|specialist|coordinator|director|developer|associate/i.test(line)) || "";
}

function compareTitleAlignment(title, resumeText) {
  if (!title) return "Unable to Determine";
  const titleWords = getWords(title).filter(word => word.length > 3 && !STOP_WORDS.has(word));
  if (!titleWords.length) return "Unable to Determine";
  const resumeNorm = normalizeForCompare(resumeText.slice(0, 1300));
  const hits = titleWords.filter(word => resumeNorm.includes(word)).length;
  const ratio = hits / titleWords.length;
  if (ratio >= 0.7) return "Strong";
  if (ratio >= 0.4) return "Moderate";
  return "Weak";
}

function detectRequirements(text, type) {
  const regex = type === "required" ? /required qualifications?:?([\s\S]*?)(?:preferred qualifications?:|responsibilities|$)/i : /preferred qualifications?:?([\s\S]*?)(?:responsibilities|$)/i;
  const block = text.match(regex)?.[1] || "";
  return block.split(/\n|-/).map(line => line.trim()).filter(line => line.length > 12).slice(0, 8);
}

function sectionsContaining(term) {
  const normalizedTerm = normalizeForCompare(term);
  return state.sections
    .filter(section => section.status !== "Missing" && normalizeForCompare(section.text).includes(normalizedTerm))
    .map(section => section.label);
}

function slug(value) {
  return normalizeForCompare(value).replace(/\s+/g, "-");
}

function highlight(text, query) {
  const safe = escapeHtml(text);
  if (!query.trim()) return safe;
  return safe.replace(new RegExp(`(${escapeRegex(escapeHtml(query.trim()))})`, "ig"), "<mark>$1</mark>");
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, "&#096;");
}

function copyText(text) {
  navigator.clipboard.writeText(text).catch(() => {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.top = "-1000px";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  });
}
