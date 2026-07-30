import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const SITE_URL = "https://sterlingkane.example";
const sitemapFiles = [];
const disclaimer =
  "Sterling Kane is a fictional law firm created as a brand identity, web design, and front-end development portfolio project by Matt Livingston. It does not provide legal services or legal advice.";

const nav = [
  ["practice", "Practice Areas", "practice-areas.html"],
  ["attorneys", "Attorneys", "attorneys.html"],
  ["approach", "Our Approach", "approach.html"],
  ["insights", "Insights", "insights.html"],
  ["contact", "Contact", "contact.html"],
];

const practices = [
  {
    number: "01",
    name: "Commercial Litigation",
    short: "Contract claims, business torts, ownership disputes, and complex civil matters.",
    path: "practice-areas/commercial-litigation.html",
    headline: "Commercial disputes demand commercial judgment.",
    topics: ["Breach of contract", "Fraud and misrepresentation", "Business torts", "Vendor and supplier disputes", "Complex damages claims", "Declaratory actions", "Pre-suit strategy"],
    issues: "Broken agreements, threatened claims, disputed obligations, and business tort allegations that require early control of facts and exposure."
  },
  {
    number: "02",
    name: "Partnership & Shareholder Disputes",
    short: "Conflicts involving control, fiduciary duties, ownership rights, and business separation.",
    path: "practice-areas/partnership-disputes.html",
    headline: "When business relationships stop functioning.",
    topics: ["Fiduciary duties", "Ownership and voting rights", "Deadlock", "Minority-owner claims", "Buyout disputes", "Misuse of company assets", "Business separation", "Governance conflicts"],
    issues: "Ownership disputes, governance breakdowns, deadlock, buyout pressure, and claims that can destabilize operations."
  },
  {
    number: "03",
    name: "Real Estate & Construction",
    short: "Disputes involving developments, commercial property, contractors, and project obligations.",
    path: "practice-areas/real-estate-construction.html",
    headline: "Protecting the project, the property, and the position.",
    topics: ["Development disputes", "Commercial leases", "Construction contracts", "Payment claims", "Delay disputes", "Defects", "Ownership conflicts", "Property-use disputes"],
    issues: "Project disruption, lease conflict, payment pressure, delay claims, and property disputes where timing changes leverage."
  },
  {
    number: "04",
    name: "Trade Secrets & Competition",
    short: "Claims involving confidential information, employee movement, and unfair competitive conduct.",
    path: "practice-areas/trade-secrets.html",
    headline: "Act before confidential information becomes competitive advantage.",
    topics: ["Trade secrets", "Confidential information", "Employee departures", "Customer solicitation", "Restrictive covenants", "Unfair competition", "Evidence preservation", "Emergency injunctions"],
    issues: "Departures, solicitation, confidential information concerns, and competitive conduct that may require fast evidence preservation."
  },
  {
    number: "05",
    name: "Appeals & Injunctions",
    short: "Emergency court action and appellate strategy when timing and the record control the available options.",
    path: "practice-areas/appeals-injunctions.html",
    headline: "When timing and the record control the options.",
    topics: ["Temporary restraining orders", "Temporary injunctions", "Emergency hearings", "Interlocutory appeals", "Final appeals", "Preservation of error", "Appellate strategy", "Post-judgment matters"],
    issues: "Urgent harm, disputed trial-court rulings, record preservation, and procedural choices with practical business consequences."
  }
];

const attorneys = [
  {
    initials: "VS",
    name: "Victoria Sterling",
    role: "Founding Partner",
    focus: "Commercial Litigation - Partnership Disputes - Appeals",
    path: "attorneys/victoria-sterling.html",
    intro: "Victoria Sterling represents business owners, executives, and closely held companies in disputes involving contracts, governance, fiduciary duties, and control.",
    bio: "Victoria helps clients separate the immediate conflict from the broader commercial consequence. Her work centers on early issue identification, disciplined case development, and alignment between legal strategy and the client's business objective.",
    approach: "Her practice emphasizes early issue identification, disciplined case development, and alignment between legal strategy and the client's broader commercial objective.",
    education: ["J.D., The University of Texas School of Law", "B.B.A., Southern Methodist University"],
    admissions: ["State Bar of Texas", "U.S. District Courts for the Northern, Eastern, Southern, and Western Districts of Texas"],
    matters: ["Ownership and governance disputes", "Contract and fiduciary-duty claims", "Commercial appeals and dispositive motions"],
    image: "victoria-sterling.webp",
    relatedInsights: [0, 1, 5]
  },
  {
    initials: "NK",
    name: "Nathaniel Kane",
    role: "Founding Partner",
    focus: "Emergency Relief - Trade Secrets - Real Estate Litigation",
    path: "attorneys/nathaniel-kane.html",
    intro: "Nathaniel Kane focuses on disputes where timing, evidence, and early strategic positioning may determine the range of available outcomes.",
    bio: "Nathaniel works with companies facing urgent threats to property, confidential information, competitive position, or project continuity. He is focused on what must be preserved, what must be communicated, and what can wait.",
    approach: "His client work is built around practical sequencing: clarify the harm, preserve the evidence, and decide whether urgent court action serves the business.",
    education: ["J.D., Baylor Law School", "B.A., Trinity University"],
    admissions: ["State Bar of Texas", "U.S. Court of Appeals for the Fifth Circuit"],
    matters: ["Emergency injunction requests", "Trade-secret and unfair-competition claims", "Commercial real-estate conflicts"],
    image: "nathaniel-kane.webp",
    relatedInsights: [2, 6, 4]
  },
  {
    initials: "MC",
    name: "Maya Chen",
    role: "Partner",
    focus: "Contract Disputes - Business Torts - Complex Discovery",
    path: "attorneys/maya-chen.html",
    intro: "Maya Chen represents businesses in contract, fraud, business tort, and discovery-intensive disputes.",
    bio: "Maya is often involved when a matter turns on records, communications, and the careful reconstruction of what the parties understood. She translates dense factual material into usable strategy.",
    approach: "Her work emphasizes factual command, efficient discovery, and clear communication with clients who need practical choices rather than procedural noise.",
    education: ["J.D., University of Houston Law Center", "B.A., Rice University"],
    admissions: ["State Bar of Texas", "U.S. District Court for the Northern District of Texas"],
    matters: ["Supplier and vendor disputes", "Fraud and misrepresentation claims", "Complex document and witness strategy"],
    image: "maya-chen.webp",
    relatedInsights: [3, 4, 0]
  },
  {
    initials: "DR",
    name: "Daniel Reeves",
    role: "Senior Counsel",
    focus: "Construction Litigation - Commercial Real Estate",
    path: "attorneys/daniel-reeves.html",
    intro: "Daniel Reeves advises owners, developers, and operators in disputes involving real estate, construction obligations, and project disruption.",
    bio: "Daniel's work sits at the intersection of contracts, property, schedules, and commercial pressure. He helps clients understand how a legal position affects the project as a whole.",
    approach: "He focuses on preserving project options, identifying the documents that control the dispute, and clarifying the cost of each procedural path.",
    education: ["J.D., SMU Dedman School of Law", "B.S., Texas A&M University"],
    admissions: ["State Bar of Texas", "U.S. District Court for the Eastern District of Texas"],
    matters: ["Development and lease disputes", "Construction payment and delay claims", "Property-use conflicts"],
    image: "daniel-reeves.webp",
    relatedInsights: [6, 3, 0]
  },
  {
    initials: "AM",
    name: "Ava Mercer",
    role: "Associate",
    focus: "Legal Research - Motion Practice - Appellate Support",
    path: "attorneys/ava-mercer.html",
    intro: "Ava Mercer supports litigation and appellate teams through research, motion practice, and record-focused analysis.",
    bio: "Ava helps develop the written record that serious disputes require. Her work supports dispositive motions, emergency briefing, and appellate issue preservation.",
    approach: "She approaches client work by connecting legal authority to the practical decision the client needs to make next.",
    education: ["J.D., The University of Texas School of Law", "B.A., The University of Oklahoma"],
    admissions: ["State Bar of Texas"],
    matters: ["Emergency and appellate briefing", "Legal research and issue preservation", "Motion practice support"],
    image: "ava-mercer.webp",
    relatedInsights: [5, 4, 0]
  }
];

const insights = [
  ["Commercial Litigation", "Before the Demand Letter", "Five questions businesses should answer before formal escalation.", "May 14, 2026", "5 min read"],
  ["Ownership Disputes", "When a Partner Dispute Becomes a Governance Crisis", "Recognizing when an internal disagreement threatens control of the company.", "April 22, 2026", "6 min read"],
  ["Emergency Relief", "Emergency Relief Is a Strategy, Not a Threat", "What businesses should understand before seeking an injunction.", "March 18, 2026", "4 min read"],
  ["Contracts", "What a Contract Dispute Is Actually Costing the Business", "Looking beyond legal fees to understand operational drag, leverage loss, and commercial distraction.", "February 27, 2026", "6 min read"],
  ["Commercial Litigation", "Preserving Evidence Before Litigation Begins", "How early evidence decisions can affect options before a lawsuit is filed.", "January 30, 2026", "5 min read"],
  ["Appeals", "When Settlement Discussions Reduce Leverage", "Why timing, wording, and audience matter when a business opens resolution talks.", "December 12, 2025", "4 min read"],
  ["Real Estate", "Project Disputes Before the Notice Letter", "Documenting delay, payment, and scope issues before a construction conflict hardens.", "November 19, 2025", "5 min read"]
];

function rel(file) {
  return file.includes("/") ? "../" : "";
}

function href(root, path) {
  return `${root}${path}`;
}

function head({ title, description, file, root, extraHead = "" }) {
  const canonical = `${SITE_URL}/${file === "index.html" ? "" : file}`;
  return `
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${title}</title>
    <meta name="description" content="${description}">
    <link rel="canonical" href="${canonical}">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:type" content="website">
    <meta property="og:url" content="${canonical}">
    <meta property="og:image" content="${SITE_URL}/assets/images/sterling-kane-og.jpg">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${description}">
    <meta name="twitter:image" content="${SITE_URL}/assets/images/sterling-kane-og.jpg">
    <link rel="icon" href="${root}favicon.ico">
    <link rel="manifest" href="${root}site.webmanifest">
    <link rel="stylesheet" href="${root}assets/css/styles.css">
    ${extraHead}`;
}

function header(root) {
  const links = nav.map(([key, label, path]) => `<li><a data-nav-key="${key}" href="${href(root, path)}">${label}</a></li>`).join("");
  return `
    <a class="skip-link" href="#main">Skip to main content</a>
    <header class="site-header" data-site-header>
      <div class="container header-inner">
        <a class="brand" href="${href(root, "index.html")}" aria-label="Sterling Kane home">
          <img class="brand-mark" src="${root}assets/images/sterling-kane-monogram.svg" alt="" width="42" height="42">
          <span class="wordmark-text">Sterling Kane <small>Business Litigation & Strategic Counsel</small></span>
        </a>
        <nav class="desktop-nav" aria-label="Primary navigation">
          <ul>${links}</ul>
        </nav>
        <a class="button primary desktop-cta" data-nav-key="contact" href="${href(root, "contact.html")}">Discuss a Matter</a>
        <button class="menu-button" type="button" data-menu-toggle aria-controls="mobile-menu" aria-expanded="false">
          <span aria-hidden="true"></span><span class="sr-only">Open menu</span>
        </button>
      </div>
    </header>
    <div class="mobile-menu" id="mobile-menu" data-mobile-menu aria-hidden="true">
      <div class="mobile-panel" role="dialog" aria-modal="true" aria-label="Mobile navigation">
        <div class="spread">
          <span class="wordmark-text">Sterling Kane <small>Business Litigation & Strategic Counsel</small></span>
          <button class="close-button" type="button" data-menu-close><span aria-hidden="true"></span><span class="sr-only">Close menu</span></button>
        </div>
        <nav aria-label="Mobile navigation"><ul>${links}<li><a href="${href(root, "contact.html")}">Discuss a Matter</a></li></ul></nav>
      </div>
    </div>`;
}

function footer(root) {
  const practiceLinks = practices.slice(0, 5).map((item) => `<li><a href="${href(root, item.path)}">${item.name}</a></li>`).join("");
  const attorneyLinks = attorneys.map((item) => `<li><a href="${href(root, item.path)}">${item.name}</a></li>`).join("");
  return `
    <footer class="site-footer">
      <div class="container">
        <div class="footer-grid">
          <div class="stack">
            <a class="brand" href="${href(root, "index.html")}" aria-label="Sterling Kane home">
              <img class="brand-mark" src="${root}assets/images/sterling-kane-monogram.svg" alt="" width="42" height="42">
              <span class="wordmark-text">Sterling Kane <small>Business Litigation & Strategic Counsel</small></span>
            </a>
            <p>Strategic counsel when business becomes conflict.</p>
            <p class="small">${disclaimer}</p>
          </div>
          <div>
            <p class="label">Practice</p>
            <ul class="footer-links">${practiceLinks}</ul>
          </div>
          <div>
            <p class="label">Attorneys</p>
            <ul class="footer-links">${attorneyLinks}</ul>
          </div>
          <div class="stack">
            <p class="label">Dallas Office</p>
            <p>Sterling Kane<br>2100 Ross Avenue, Suite 3400<br>Dallas, Texas 75201</p>
            <p><a href="tel:2145550214">214-555-0214</a><br><a href="mailto:inquiries@sterlingkane.example">inquiries@sterlingkane.example</a></p>
            <p><a href="${href(root, "contact.html")}">Contact</a> - <a href="${href(root, "disclaimer.html")}">Disclaimer</a> - <a href="${href(root, "privacy.html")}">Privacy</a></p>
          </div>
        </div>
        <div class="footer-bottom">
          <p class="small">Designed and built by Matt Livingston for demonstration purposes.</p>
          <p class="small">&copy; 2026 Sterling Kane. Fictional portfolio project.</p>
        </div>
      </div>
    </footer>
    <button class="scroll-top" type="button" data-scroll-top><span aria-hidden="true">^</span><span class="sr-only">Scroll to top</span></button>
    <script src="${root}assets/js/main.js" defer></script>`;
}

function page({ file, key, title, description, content, extraHead = "" }) {
  const root = rel(file);
  const bodyClass = key === "home" ? "home" : "";
  const html = `<!doctype html>
<html lang="en">
  <head>${head({ title, description, file, root, extraHead })}</head>
  <body class="${bodyClass}" data-page="${key}">
    ${header(root)}
    <main id="main">
      ${content(root)}
    </main>
    ${footer(root)}
  </body>
</html>`;
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html.trim() + "\n");
  if (key !== "not-found") sitemapFiles.push(file);
}

function subHero(eyebrow, title, copy) {
  return `
    <section class="hero subpage-hero dark">
      <div class="container hero-layout">
        <div class="hero-content">
          <p class="eyebrow">${eyebrow}</p>
          <h1>${title}</h1>
          <p class="lead">${copy}</p>
          <div class="dark-line" aria-hidden="true"></div>
        </div>
        <div class="hero-mark" aria-hidden="true">SK</div>
      </div>
    </section>`;
}

function contactCta(root) {
  return `
    <section class="section dark dark-band">
      <div class="container grid-2">
        <div class="stack-lg">
          <p class="eyebrow">Discuss a matter</p>
          <h2>Some disputes become more expensive while they wait.</h2>
        </div>
        <div class="stack-lg">
          <p class="lead">Tell us what changed, what is at risk, and what decision must be made next.</p>
          <div class="button-row">
            <a class="button primary" href="${href(root, "contact.html")}">Discuss a Matter</a>
          </div>
          <p class="small">Submitting information does not create an attorney-client relationship.</p>
        </div>
      </div>
    </section>`;
}

function legalNotice() {
  return `<div class="notice"><p><strong>Legal information notice.</strong> Content on this fictional portfolio website is general information only, not legal advice, and does not create an attorney-client relationship.</p></div>`;
}

function portrait(root, attorney, loading = "lazy") {
  return `<div class="portrait has-image" data-initials="${attorney.initials}"><img src="${root}assets/images/attorneys/${attorney.image}" alt="Fictional portrait of ${attorney.name}" width="1200" height="1500" loading="${loading}"></div>`;
}

page({
  file: "index.html",
  key: "home",
  title: "Sterling Kane | Business Litigation & Strategic Counsel",
  description: "Sterling Kane is a fictional Dallas business-litigation firm representing companies, founders, executives, and property owners in consequential commercial disputes.",
  extraHead: `<!-- Fictional portfolio LegalService schema. -->
    <script type="application/ld+json">{"@context":"https://schema.org","@type":"LegalService","name":"Sterling Kane","description":"Fictional Dallas business-litigation firm portfolio project.","address":{"@type":"PostalAddress","streetAddress":"2100 Ross Avenue, Suite 3400","addressLocality":"Dallas","addressRegion":"TX","postalCode":"75201"},"telephone":"214-555-0214"}</script>`,
  content: (root) => `
    <section class="hero home-hero dark">
      <div class="container hero-layout">
        <div class="hero-content">
          <p class="eyebrow">Business Litigation & Strategic Counsel</p>
          <h1>See the conflict clearly.</h1>
          <p class="lead">Sterling Kane represents businesses, founders, executives, and property owners in disputes where the financial, operational, and reputational stakes demand disciplined judgment.</p>
          <div class="button-row">
            <a class="button primary" href="${href(root, "contact.html")}">Discuss a Matter</a>
            <a class="button secondary" href="${href(root, "practice-areas.html")}">Explore Our Practice</a>
          </div>
          <p class="hero-detail">Dallas, Texas &middot; Selective representation in complex business disputes</p>
        </div>
        <div class="hero-mark" aria-hidden="true">SK</div>
      </div>
    </section>
    <section class="section paper">
      <div class="container grid-2">
        <div class="stack-lg" data-reveal>
          <p class="eyebrow">Conflict overview</p>
          <h2>Business disputes rarely begin in the courtroom.</h2>
        </div>
        <div class="stack-lg" data-reveal>
          <p class="lead">They begin with a broken agreement, a shifting relationship, an emerging threat, or a decision that can no longer be postponed. Sterling Kane helps clients identify the real point of pressure before the dispute defines the business.</p>
        </div>
      </div>
      <div class="container stage-grid section-tight">
        ${["Clarify|Understand the facts, exposure, leverage, and commercial objective.", "Position|Preserve evidence, protect options, and control the next communication.", "Act|Negotiate, seek emergency relief, or litigate with a defined purpose."].map((item, i) => {
          const [title, text] = item.split("|");
          return `<article class="stage" data-reveal><span class="stage-number">0${i + 1}</span><h3>${title}</h3><p>${text}</p></article>`;
        }).join("")}
      </div>
    </section>
    <section class="section">
      <div class="container section-head">
        <p class="eyebrow">Practice Areas</p>
        <h2>Built for disputes that change business decisions.</h2>
      </div>
      <div class="container practice-grid">
        ${practices.map((p) => `<a class="practice-card" href="${href(root, p.path)}" data-reveal><span class="practice-number">${p.number}</span><h3>${p.name}</h3><p>${p.short}</p><footer>Explore ${p.name}</footer></a>`).join("")}
      </div>
    </section>
    <section class="section dark dark-band">
      <div class="container stack-lg">
        <p class="eyebrow">Strategic statement</p>
        <p class="statement">The objective is not litigation for its own sake. The objective is control.</p>
        <p class="lead">Some disputes should be resolved early. Others require immediate court intervention. Sterling Kane prepares for both without confusing activity for progress.</p>
      </div>
    </section>
    <section class="section paper">
      <div class="container grid-2">
        <div class="stack-lg">
          <p class="eyebrow">Representative Matter Types</p>
          <h2>Illustrative examples of the matters the fictional firm is designed to handle.</h2>
        </div>
        <ul class="matter-list">
          ${["Ownership dispute involving a closely held technology company", "Emergency injunction concerning confidential business information", "Commercial lease dispute affecting a redevelopment project", "Contract dispute between a supplier and regional operator", "Business-separation negotiations between founding partners", "Appeal involving the interpretation of a commercial agreement"].map((item) => `<li>${item}</li>`).join("")}
        </ul>
      </div>
    </section>
    <section class="section">
      <div class="container section-head">
        <p class="eyebrow">Founding Partners</p>
        <h2>Direct involvement from serious dispute counsel.</h2>
      </div>
      <div class="container attorney-grid">
        ${attorneys.slice(0, 2).map((a) => `<article class="attorney-card" data-reveal>${portrait(root, a)}<p class="meta">${a.role}</p><h3>${a.name}</h3><p>${a.focus}</p><p>${a.intro}</p><a class="text-button" href="${href(root, a.path)}">Meet ${a.name}</a></article>`).join("")}
      </div>
      <div class="container section-tight"><a class="button secondary" href="${href(root, "attorneys.html")}">Meet the Firm</a></div>
    </section>
    <section class="section paper">
      <div class="container grid-2">
        <div class="stack-lg"><p class="eyebrow">Approach</p><h2>Strategy before escalation.</h2></div>
        <div class="stack-lg"><p class="lead">Sterling Kane begins with the business problem, not the procedural posture. The firm evaluates what must be protected, what can be resolved, what leverage exists, and what the dispute will cost beyond legal fees.</p><div class="principle-grid">${["Understand the business", "Define the objective", "Preserve optionality", "Prepare for the difficult path"].map((x) => `<div class="principle"><strong>${x}</strong></div>`).join("")}</div><a class="text-button" href="${href(root, "approach.html")}">Read Our Approach</a></div>
      </div>
    </section>
    <section class="section">
      <div class="container section-head">
        <p class="eyebrow">Insights</p>
        <h2>General information for businesses facing conflict.</h2>
        <p class="small">General information only. Not legal advice.</p>
      </div>
      <div class="container insight-grid">
        ${insights.slice(0, 3).map(([cat, title, summary, date, time]) => `<article class="insight-card"><p class="meta">${cat}</p><h3>${title}</h3><p>${summary}</p><ul class="article-meta"><li>${date}</li><li>${time}</li></ul></article>`).join("")}
      </div>
      <div class="container section-tight"><a class="button secondary" href="${href(root, "insights.html")}">View All Insights</a></div>
    </section>
    ${contactCta(root)}
  `
});

page({
  file: "practice-areas.html",
  key: "practice",
  title: "Business Litigation Practice Areas | Sterling Kane",
  description: "Explore the fictional Sterling Kane practice areas for consequential business disputes involving ownership, contracts, property, competition, appeals, and injunctions.",
  content: (root) => `
    ${subHero("Practice Areas", "Counsel for consequential business disputes.", "Sterling Kane handles disputes that affect ownership, operations, property, competitive position, and executive decision-making.")}
    <section class="section">
      <div class="container">
        ${practices.slice(0, 5).map((p) => `<article class="practice-row"><span class="practice-number">${p.number}</span><div><h2>${p.name}</h2><p>${p.short}</p><ul class="chip-list">${p.topics.slice(0, 5).map((t) => `<li>${t}</li>`).join("")}</ul></div><div class="stack"><p>${p.issues}</p><a class="text-button" href="${href(root, p.path)}">Explore ${p.name}</a></div></article>`).join("")}
      </div>
    </section>`
});

for (const p of practices.slice(0, 5)) {
  page({
    file: p.path,
    key: "practice",
    title: `${p.name} | Sterling Kane`,
    description: `${p.name} information page for the fictional Sterling Kane business-litigation portfolio website.`,
    content: (root) => `
      ${subHero("Practice Area", p.headline, p.short)}
      <section class="section">
        <div class="container grid-2">
          <div class="stack-lg"><p class="eyebrow">${p.name}</p><h2>Clarify the pressure before choosing the posture.</h2><p class="lead">${p.issues}</p></div>
          <div class="profile-panel stack-lg"><h3>Situations the firm handles</h3><ul class="profile-list">${p.topics.map((t) => `<li>${t}</li>`).join("")}</ul></div>
        </div>
      </section>
      <section class="section paper">
        <div class="container grid-2">
          <div class="stack-lg"><p class="eyebrow">Strategic considerations</p><h2>The first question is what the business needs protected.</h2></div>
          <div class="stack-lg"><p>Sterling Kane evaluates the facts, documents, commercial relationships, available remedies, cost of delay, and practical decision points before recommending a path. The goal is to understand leverage without mistaking motion for progress.</p>${legalNotice()}</div>
        </div>
      </section>
      <section class="section">
        <div class="container section-head"><p class="eyebrow">Related Practices</p><h2>Connected pressure points.</h2></div>
        <div class="container practice-grid">${practices.slice(0, 5).filter((x) => x.name !== p.name).slice(0, 3).map((x) => `<a class="practice-card" href="${href(root, x.path)}"><span class="practice-number">${x.number}</span><h3>${x.name}</h3><p>${x.short}</p><footer>Explore ${x.name}</footer></a>`).join("")}</div>
      </section>
      <section class="section paper">
        <div class="container section-head"><p class="eyebrow">Relevant fictional insights</p><h2>General information only.</h2></div>
        <div class="container insight-grid">${insights.slice(0, 3).map(([cat, title, summary, date, time]) => `<article class="insight-card"><p class="meta">${cat}</p><h3>${title}</h3><p>${summary}</p><ul class="article-meta"><li>${date}</li><li>${time}</li></ul></article>`).join("")}</div>
      </section>
      ${contactCta(root)}
    `
  });
}

page({
  file: "attorneys.html",
  key: "attorneys",
  title: "Attorneys | Sterling Kane",
  description: "Meet the fictional Sterling Kane attorney roster for a boutique Dallas business-litigation portfolio website.",
  content: (root) => `
    ${subHero("Attorneys", "A focused team for difficult disputes.", "Sterling Kane is intentionally small. Matters are led by experienced attorneys who remain directly involved in strategy, preparation, and client communication.")}
    <section class="section">
      <div class="container attorney-grid">
        ${attorneys.map((a) => `<article class="attorney-card" data-reveal>${portrait(root, a)}<p class="meta">${a.role}</p><h2>${a.name}</h2><p><strong>${a.focus}</strong></p><p>${a.bio}</p><a class="text-button" href="${href(root, a.path)}">Meet ${a.name}</a></article>`).join("")}
      </div>
      <div class="container section-tight">${legalNotice().replace("Legal information notice.", "Fictional profile notice.")}</div>
    </section>`
});

for (const a of attorneys) {
  page({
    file: a.path,
    key: "attorneys",
    title: `${a.name} | Sterling Kane`,
    description: `${a.name}, ${a.role} at the fictional Sterling Kane law-firm portfolio website.`,
    content: (root) => `
      ${subHero(a.role, a.name, a.intro)}
      <section class="section">
        <div class="container profile-hero-grid">
          ${portrait(root, a, "eager")}
          <div class="stack-lg"><p class="eyebrow">Practice Focus</p><h2>${a.focus}</h2><p class="lead">${a.bio}</p><div class="notice"><p>This is a fictional attorney profile created for a portfolio demonstration.</p></div></div>
        </div>
      </section>
      <section class="section paper">
        <div class="container grid-2">
          <div class="profile-panel stack"><h3>Representative matter types</h3><ul class="profile-list">${a.matters.map((m) => `<li>${m}</li>`).join("")}</ul></div>
          <div class="profile-panel stack"><h3>Approach to client work</h3><p>${a.approach}</p></div>
        </div>
      </section>
      <section class="section">
        <div class="container credential-grid">
          <div class="profile-panel"><h3>Education</h3><ul class="profile-list">${a.education.map((m) => `<li>${m}</li>`).join("")}</ul></div>
          <div class="profile-panel"><h3>Admissions</h3><ul class="profile-list">${a.admissions.map((m) => `<li>${m}</li>`).join("")}</ul></div>
        </div>
      </section>
      <section class="section paper">
        <div class="container section-head"><p class="eyebrow">Related insights</p><h2>Concept content.</h2></div>
        <div class="container insight-grid">${(a.relatedInsights || [0, 1, 2]).map((i) => insights[i]).map(([cat, title, summary, date, time]) => `<article class="insight-card"><p class="meta">${cat}</p><h3>${title}</h3><p>${summary}</p><ul class="article-meta"><li>${date}</li><li>${time}</li></ul></article>`).join("")}</div>
      </section>
      ${contactCta(root)}
    `
  });
}

page({
  file: "approach.html",
  key: "approach",
  title: "Our Approach | Sterling Kane",
  description: "Sterling Kane's fictional litigation approach centers on diagnosis, preservation, positioning, resolution, and focused litigation.",
  content: (root) => `
    ${subHero("Our Approach", "A dispute is a business event before it is a legal file.", "Sterling Kane evaluates litigation through the effect it may have on ownership, operations, leverage, reputation, cost, and future decision-making.")}
    <section class="section">
      <div class="container stage-grid">
        ${["Diagnose|Identify the legal issue, commercial pressure, missing facts, and immediate exposure.", "Preserve|Protect evidence, relationships, contractual rights, and strategic options.", "Position|Shape the record, communications, leverage, and procedural posture.", "Resolve|Pursue a negotiated outcome when it serves the business objective.", "Litigate|Proceed with focus when court intervention becomes necessary."].map((item, i) => { const [t, d] = item.split("|"); return `<article class="stage"><span class="stage-number">${String(i + 1).padStart(2, "0")}</span><h3>${t}</h3><p>${d}</p></article>`; }).join("")}
      </div>
    </section>
    <section class="section paper">
      <div class="container grid-2">
        <div class="stack-lg"><p class="eyebrow">Working standards</p><h2>Clear decisions at defined points.</h2></div>
        <div class="stack-lg" data-accordion>
          ${["Communication standards|Clients should understand what changed, what it means, and what decision comes next.", "Early case assessment|The firm identifies key documents, stakeholders, exposure, leverage, and available remedies early.", "Budget awareness|Cost is part of strategy. Litigation steps are evaluated against the business objective.", "Decision points|Each phase should clarify whether to negotiate, preserve, escalate, or narrow the dispute.", "Collaboration|Sterling Kane coordinates with in-house counsel, financial advisers, and technical experts when the matter requires specialized judgment."].map((item, i) => { const [t, d] = item.split("|"); return `<details ${i === 0 ? "open" : ""}><summary>${t}</summary><p>${d}</p></details>`; }).join("")}
        </div>
      </div>
    </section>
    ${contactCta(root)}
  `
});

page({
  file: "insights.html",
  key: "insights",
  title: "Insights | Sterling Kane",
  description: "Fictional Sterling Kane article library with general information for businesses facing conflict.",
  content: (root) => `
    ${subHero("Insights", "Insights for businesses facing conflict.", "Concept articles for a fictional law-firm portfolio project. General information only. Not legal advice.")}
    <section class="section">
      <div class="container">
        <div class="filter-row" data-insight-filters aria-label="Insight filters">
          ${["all", "Commercial Litigation", "Ownership Disputes", "Contracts", "Emergency Relief", "Real Estate", "Appeals"].map((cat, i) => `<button type="button" data-filter="${cat}" aria-pressed="${i === 0 ? "true" : "false"}">${cat === "all" ? "All" : cat}</button>`).join("")}
        </div>
      </div>
      <div class="container insight-grid">
        ${insights.map(([cat, title, summary, date, time]) => `<article class="insight-card" data-insight-card data-category="${cat}"><p class="meta">${cat}</p><h2>${title}</h2><p>${summary}</p><ul class="article-meta"><li>${date}</li><li>${time}</li></ul><p class="small">General information only. Not legal advice.</p><button class="button secondary" type="button" data-summary-trigger data-title="${title}" data-category-label="${cat}" data-summary="${summary} This concept summary is included to demonstrate an accessible static article interaction without publishing legal advice.">Read concept summary</button></article>`).join("")}
      </div>
    </section>
    <dialog data-insight-dialog aria-labelledby="insight-dialog-title">
      <div class="dialog-panel">
        <p class="meta" data-dialog-category></p>
        <h2 id="insight-dialog-title" data-dialog-title></h2>
        <p data-dialog-body></p>
        <p class="small">This is fictional portfolio content and not legal advice.</p>
        <button class="button primary" type="button" data-dialog-close>Close Summary</button>
      </div>
    </dialog>
  `
});

page({
  file: "contact.html",
  key: "contact",
  title: "Contact | Sterling Kane",
  description: "Static demonstration contact page for Sterling Kane, a fictional Dallas business-litigation portfolio website.",
  content: (root) => `
    ${subHero("Contact", "Start with what changed.", "Describe the dispute, what is at risk, and whether any deadline, hearing, transaction, or threatened action requires immediate attention.")}
    <section class="section">
      <div class="container contact-layout">
        <form class="form-panel stack-lg" data-contact-form novalidate>
          <div class="notice"><p>Do not send confidential or time-sensitive information through this form. Submission does not create an attorney-client relationship, and Sterling Kane cannot represent you unless a written engagement agreement has been completed.</p></div>
          <div class="form-grid">
            <div class="field"><label for="name">Full name</label><input id="name" name="name" autocomplete="name" required></div>
            <div class="field"><label for="company">Company</label><input id="company" name="company" autocomplete="organization"></div>
            <div class="field"><label for="email">Email</label><input id="email" name="email" type="email" autocomplete="email" required></div>
            <div class="field"><label for="phone">Phone</label><input id="phone" name="phone" type="tel" autocomplete="tel"></div>
            <div class="field"><label for="role">Role</label><input id="role" name="role"></div>
            <div class="field"><label for="matter">General matter type</label><select id="matter" name="matter" required><option value="">Select one</option><option>Contract dispute</option><option>Partnership or shareholder dispute</option><option>Real estate or construction</option><option>Trade secrets or unfair competition</option><option>Injunction or emergency matter</option><option>Appeal</option><option>Other</option></select></div>
            <div class="field"><label for="conflict">Opposing party or conflict-check name</label><input id="conflict" name="conflict" required></div>
            <div class="field"><label for="urgency">Urgency</label><select id="urgency" name="urgency" required><option value="">Select one</option><option>General inquiry</option><option>Action needed within 30 days</option><option>Action needed within 7 days</option><option>Immediate deadline or threatened action</option></select></div>
            <div class="field field-full"><label for="message">Message</label><textarea id="message" name="message" required></textarea></div>
            <label class="checkbox"><input type="checkbox" required><span>I understand this is a fictional portfolio demonstration and that no attorney-client relationship is created.</span></label>
            <div class="button-row"><button class="button primary" type="submit">Submit Demonstration Form</button></div>
          </div>
          <p class="form-response" data-form-response tabindex="-1" hidden></p>
        </form>
        <aside class="office-panel stack-lg">
          <div><p class="eyebrow">Office</p><h2>Sterling Kane</h2></div>
          <p>2100 Ross Avenue, Suite 3400<br>Dallas, Texas 75201</p>
          <p><a href="tel:2145550214">214-555-0214</a><br><a href="mailto:inquiries@sterlingkane.example">inquiries@sterlingkane.example</a></p>
          <p class="small">Office details are fictional and provided for portfolio demonstration purposes.</p>
          <div class="map-panel" role="img" aria-label="Abstract Dallas street-grid graphic"></div>
        </aside>
      </div>
    </section>`
});

page({
  file: "disclaimer.html",
  key: "disclaimer",
  title: "Legal Disclaimer | Sterling Kane",
  description: "Fictional project, no legal services, no attorney-client relationship, and no legal advice disclaimer for Sterling Kane.",
  content: () => `
    ${subHero("Disclaimer", "Clear boundaries for a fictional project.", "This website is a portfolio demonstration and should not be understood as a real law firm or source of legal advice.")}
    <section class="section"><div class="container prose">
      <h2>Fictional portfolio status</h2><p>${disclaimer}</p>
      <h2>No legal services</h2><p>Sterling Kane does not provide legal services, accept clients, evaluate matters, or advise anyone about legal rights or obligations.</p>
      <h2>No attorney-client relationship</h2><p>Viewing this site, using the contact form, or reading any content does not create an attorney-client relationship.</p>
      <h2>No legal advice</h2><p>All content is general, fictional, and created to demonstrate brand identity, information architecture, and front-end development.</p>
      <h2>No guarantee of results</h2><p>The site does not guarantee, predict, or describe legal outcomes. It includes no verdicts, settlements, rankings, testimonials, or client claims.</p>
      <h2>Fictional attorneys and office information</h2><p>Attorney profiles, office details, practice descriptions, and article summaries are fictional and provided for demonstration purposes.</p>
      <h2>No confidential submissions</h2><p>Do not submit confidential or time-sensitive information. The demonstration contact form is prevented from transmitting or storing data.</p>
      <h2>External links and jurisdiction</h2><p>Any external references are informational only. Nothing on this site should be treated as guidance for any jurisdiction.</p>
    </div></section>`
});

page({
  file: "privacy.html",
  key: "privacy",
  title: "Privacy | Sterling Kane",
  description: "Privacy notes for the static Sterling Kane fictional portfolio website.",
  content: () => `
    ${subHero("Privacy", "A static demonstration with no intentional data collection.", "This page explains how the fictional Sterling Kane site is designed for portfolio presentation rather than real intake.")}
    <section class="section"><div class="container prose">
      <h2>Static project</h2><p>This static demonstration does not intentionally collect, transmit, or store personal information.</p>
      <h2>Contact form</h2><p>The form is a front-end demonstration only. It validates required fields locally and displays a demonstration response. No message is transmitted or stored.</p>
      <h2>Analytics and cookies</h2><p>No analytics are installed by default, and the site does not set tracking cookies.</p>
      <h2>Hosting requests</h2><p>If deployed to GitHub Pages or a similar static host, that provider may process basic technical request data under its own policies.</p>
      <h2>Fonts and assets</h2><p>The site uses local system font stacks and local assets, avoiding remote font-provider requests by default.</p>
    </div></section>`
});

page({
  file: "404.html",
  key: "not-found",
  title: "Page Not Found | Sterling Kane",
  description: "A branded 404 page for the fictional Sterling Kane portfolio website.",
  content: (root) => `
    <section class="hero subpage-hero dark">
      <div class="container hero-layout">
        <div class="hero-content">
          <p class="eyebrow">404</p>
          <h1>This argument leads nowhere.</h1>
          <p class="lead">The page may have moved, changed, or never existed.</p>
          <div class="button-row">
            <a class="button primary" href="${href(root, "index.html")}">Return Home</a>
            <a class="button secondary" href="${href(root, "practice-areas.html")}">View Practice Areas</a>
          </div>
        </div>
        <div class="hero-mark" aria-hidden="true">SK</div>
      </div>
    </section>`
});

const sitemapUrls = sitemapFiles
  .map((file) => `${SITE_URL}/${file === "index.html" ? "" : file}`)
  .sort()
  .map((url) => `  <url><loc>${url}</loc></url>`)
  .join("\n");
writeFileSync("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapUrls}\n</urlset>\n`);

writeFileSync("robots.txt", `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);
