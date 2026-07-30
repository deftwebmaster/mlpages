import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const outDir = process.cwd();
const siteUrl = "https://example.com/cornerstone-heating-air/";
const phone = "(972) 555-0148";
const tel = "+19725550148";
const disclosure =
  "Cornerstone Heating & Air is a fictional company created by Matt Livingston as a branding, UX, and web-development portfolio project. It does not provide real HVAC services.";

const navItems = [
  { label: "Services", href: "services/", dropdown: [
    ["AC Repair", "services/ac-repair/"],
    ["Heating Repair", "services/heating-repair/"],
    ["Installation", "services/installation/"],
    ["Maintenance", "services/maintenance/"],
    ["Indoor Air Quality", "services/indoor-air-quality/"],
    ["Commercial HVAC", "services/commercial/"]
  ]},
  { label: "Comfort Plan", href: "comfort-plan/" },
  { label: "Service Area", href: "service-area/" },
  { label: "About", href: "about/" },
  { label: "Reviews", href: "reviews/" },
  { label: "Contact", href: "contact/" }
];

const services = [
  ["AC Repair", "services/ac-repair/", "Cooling repairs for capacitors, coils, airflow, thermostats, drain lines, and no-cool calls."],
  ["Heating Repair", "services/heating-repair/", "Furnace and heat pump service with clear safety guidance and careful diagnostics."],
  ["System Installation", "services/installation/", "Replacement planning, load considerations, comfort goals, and clean installation work."],
  ["Preventive Maintenance", "services/maintenance/", "Seasonal tune-ups that protect efficiency, reliability, and equipment records."],
  ["Indoor Air Quality", "services/indoor-air-quality/", "Product-neutral filtration, humidity, ventilation, duct, and purification recommendations."],
  ["Commercial HVAC", "services/commercial/", "Light-commercial repair, maintenance agreements, rooftop units, and response coordination."]
];

const faqs = [
  ["Do you offer emergency service?", "Yes. Cornerstone provides 24/7 emergency heating and cooling service across our North Texas service area, including evenings, weekends, and holidays."],
  ["How quickly can you arrive?", "Arrival timing depends on location, weather, current workload, and urgency. We do not make exact promises over the phone, but same-day appointments are common — call for current availability."],
  ["Do you repair all brands?", "Our technicians service common residential and light-commercial equipment across major brands. We are an independent service company and are not affiliated with any single manufacturer."],
  ["Should I repair or replace my system?", "Age, repair history, comfort issues, efficiency, warranty status, and installation quality all matter. We walk through the trade-offs with you before you decide, and we never push a replacement you do not need."],
  ["How often should HVAC equipment be serviced?", "Most homes benefit from a cooling tune-up in spring and a heating tune-up in fall. The Comfort Plan bundles both so it is easy to stay on schedule."],
  ["Do you offer financing?", "Yes, approved customers can finance system replacements through our financing partners. Visit the financing page for example terms and monthly-payment ranges."],
  ["What areas do you serve?", "Our primary service area includes Plano, Frisco, Allen, McKinney, Richardson, Carrollton, The Colony, Prosper, and North Dallas."],
  ["Do you work on commercial systems?", "Yes, our light-commercial scope includes offices, retail spaces, restaurants, medical offices, light industrial spaces, and multi-tenant properties."],
  ["What should I do if my system freezes?", "Turn cooling off, keep the fan on if safe to do so, replace a dirty filter if accessible, and schedule service. Do not chip ice from coils."],
  ["Why is my energy bill increasing?", "Dirty filters, airflow problems, duct leakage, thermostat settings, aging equipment, and weather changes can all affect energy use."]
];

const reviews = [
  ["Dana R.", "Plano", "AC Repair", "Cornerstone explained exactly what failed, showed us the damaged part, and had the air running again that afternoon."],
  ["Michael B.", "Frisco", "Installation", "The estimate was clear. They talked through comfort and sizing instead of pushing the biggest system."],
  ["Nora K.", "Allen", "Maintenance", "Our technician was on time, covered his shoes, and left notes we could actually understand."],
  ["Terry M.", "McKinney", "Heating", "They caught an ignition issue before the first cold weekend and did not make it dramatic."],
  ["Priya S.", "Richardson", "AC Repair", "A different company suggested replacement. Cornerstone found a repair that made more sense for the age of our system."],
  ["James L.", "Carrollton", "Commercial", "They coordinated around our clinic schedule and kept the front office updated."],
  ["Camille D.", "The Colony", "Indoor Air", "They were careful not to overpromise. We got better filtration and a more balanced humidity plan."],
  ["Wes H.", "Prosper", "Maintenance", "The Comfort Plan reminders are the kind of boring thing that saves us from forgetting."],
  ["Alyssa P.", "North Dallas", "Installation", "Clean install, patient walkthrough, and no mess left behind."],
  ["Omar V.", "Plano", "Commercial", "They helped us plan rooftop-unit maintenance without acting like we needed a huge industrial contractor."],
  ["Heather G.", "Frisco", "Heating", "The carbon monoxide guidance was direct and responsible. That mattered to us."],
  ["Luis A.", "Allen", "AC Repair", "Not cheap, not pushy, just clear. That is what I wanted during a hot week."]
];

const cities = [
  ["Plano", "Established neighborhoods, newer subdivisions, and mixed commercial corridors make Plano a natural hub for repair, maintenance, and replacement planning."],
  ["Frisco", "Fast-growing homes often need comfort balancing, airflow checks, and installation planning that keeps pace with larger floor plans."],
  ["Allen", "Allen service calls commonly involve seasonal tune-ups, drain-line concerns, and cooling performance checks before peak summer."],
  ["McKinney", "McKinney homes range from historic areas to newer developments, so equipment age and duct design vary widely."],
  ["Richardson", "Richardson homeowners often benefit from practical repair-versus-replace guidance on mature systems."],
  ["Carrollton", "Carrollton service includes residential HVAC and light-commercial support for small offices and retail spaces."],
  ["The Colony", "Lake-area humidity and summer heat make airflow, filtration, and drain-line maintenance important comfort topics."],
  ["Prosper", "Larger homes and newer systems make correct sizing, zoning conversations, and maintenance records especially useful."],
  ["North Dallas", "North Dallas service often includes high-use cooling systems, indoor-air-quality conversations, and older-home duct considerations."]
];

function ensure(file) {
  mkdirSync(dirname(join(outDir, file)), { recursive: true });
}

function write(file, content) {
  ensure(file);
  writeFileSync(join(outDir, file), content);
}

function rootFor(file) {
  const parts = file.split("/").filter(Boolean);
  return parts.length <= 1 ? "" : "../".repeat(parts.length - 1);
}

function href(root, path) {
  return root + path;
}

function pageHref(file) {
  if (file === "index.html") return "";
  return file.replace(/index\.html$/, "");
}

function logo(root, compact = false) {
  return `<a class="brand${compact ? " brand--compact" : ""}" href="${href(root, "index.html")}" aria-label="Cornerstone Heating & Air home">
    <!-- Placeholder logo: replace this text-and-shape mark with a final custom logo asset when available. -->
    <span class="brand-mark" aria-hidden="true"><span></span></span>
    <span class="brand-text"><strong>Cornerstone</strong><small>Heating &amp; Air</small></span>
  </a>`;
}

function header(root) {
  const nav = navItems.map((item) => {
    if (!item.dropdown) return `<li><a href="${href(root, item.href)}">${item.label}</a></li>`;
    const links = item.dropdown.map(([label, path]) => `<a href="${href(root, path)}">${label}</a>`).join("");
    return `<li class="nav-dropdown"><a href="${href(root, item.href)}" aria-haspopup="true">${item.label}</a><div class="dropdown-panel">${links}</div></li>`;
  }).join("");

  const mobileLinks = navItems.map((item) => {
    if (!item.dropdown) return `<a href="${href(root, item.href)}">${item.label}</a>`;
    return `<details><summary>${item.label}</summary>${item.dropdown.map(([label, path]) => `<a href="${href(root, path)}">${label}</a>`).join("")}</details>`;
  }).join("");

  return `<a class="skip-link" href="#main">Skip to content</a>
  <header class="site-header" data-site-header>
    <div class="utility-bar">
      <div class="container utility-inner">
        <span>Serving North Texas</span>
        <span>24/7 Emergency Service</span>
        <a href="tel:${tel}">${phone}</a>
        <span>Mon-Fri 7 AM-8 PM</span>
      </div>
    </div>
    <div class="main-header">
      <div class="container header-inner">
        ${logo(root)}
        <nav class="desktop-nav" aria-label="Primary navigation"><ul>${nav}</ul></nav>
        <div class="header-actions">
          <a class="phone-link" href="tel:${tel}">${phone}</a>
          <a class="button button--primary" href="${href(root, "contact/")}">Schedule Service</a>
        </div>
        <div class="mobile-actions">
          <a class="icon-button call-button" href="tel:${tel}" aria-label="Call Cornerstone">Call</a>
          <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="mobile-menu" data-menu-toggle>Menu</button>
        </div>
      </div>
    </div>
    <div class="mobile-menu" id="mobile-menu" data-mobile-menu hidden>
      <div class="mobile-menu__panel">
        <div class="mobile-menu__top">${logo(root, true)}<button type="button" class="menu-close" data-menu-close>Close</button></div>
        <nav aria-label="Mobile navigation">${mobileLinks}</nav>
        <p class="emergency-note">Emergency heating or cooling issue? Call ${phone}. For smoke, fire, gas odor, or an active carbon monoxide alarm, leave the property and contact emergency services.</p>
        <a class="button button--primary button--wide" href="${href(root, "contact/")}">Schedule Service</a>
      </div>
    </div>
  </header>`;
}

function footer(root) {
  const col = (title, links) => `<div><h2>${title}</h2>${links.map(([label, path]) => `<a href="${href(root, path)}">${label}</a>`).join("")}</div>`;
  return `<footer class="site-footer">
    <div class="container footer-grid">
      <div class="footer-brand">${logo(root)}<p>Built on Reliability. Comfort You Can Count On.</p><p class="fictional">${disclosure}</p></div>
      ${col("Company", [["About", "about/"], ["Reviews", "reviews/"], ["Careers", "careers/"], ["Financing", "financing/"], ["Contact", "contact/"]])}
      ${col("Services", [["AC Repair", "services/ac-repair/"], ["Heating Repair", "services/heating-repair/"], ["Installation", "services/installation/"], ["Maintenance", "services/maintenance/"], ["Indoor Air Quality", "services/indoor-air-quality/"], ["Commercial HVAC", "services/commercial/"]])}
      ${col("Service Area", [["Plano", "service-area/#plano"], ["Frisco", "service-area/#frisco"], ["Allen", "service-area/#allen"], ["McKinney", "service-area/#mckinney"], ["Richardson", "service-area/#richardson"], ["North Dallas", "service-area/#north-dallas"]])}
      <div><h2>Contact</h2><p>Cornerstone Heating &amp; Air<br>4820 Foundation Drive<br>Plano, TX 75024</p><p><a href="tel:${tel}">${phone}</a><br><a href="mailto:service@cornerstoneair.example">service@cornerstoneair.example</a></p><p>Monday-Friday: 7:00 AM-8:00 PM<br>Saturday: 8:00 AM-6:00 PM<br>Sunday: Emergency service only</p></div>
    </div>
    <div class="container footer-bottom">
      <span>&copy; 2026 Cornerstone Heating &amp; Air. Fictional portfolio project.</span>
      <span><a href="${href(root, "privacy/")}">Privacy</a><a href="${href(root, "terms/")}">Terms</a><a href="${href(root, "accessibility/")}">Accessibility</a><a href="${href(root, "sitemap.xml")}">Sitemap</a></span>
    </div>
  </footer>
  <div class="mobile-sticky-bar" aria-label="Quick actions"><a href="tel:${tel}">Call</a><a href="${href(root, "contact/")}">Schedule</a></div>`;
}

function hero({ eyebrow, title, copy, image = false, actions = true }) {
  return `<section class="page-hero${image ? " page-hero--image" : ""}">
    <div class="container hero-grid">
      <div class="hero-copy reveal">
        <p class="eyebrow">${eyebrow}</p>
        <h1>${title}</h1>
        <p class="lead">${copy}</p>
        ${actions ? `<div class="button-row"><a class="button button--primary" href="contact/">Schedule Service</a><a class="button button--secondary" href="tel:${tel}">Call Cornerstone</a></div>` : ""}
      </div>
      ${image ? `<figure class="hero-image reveal"><img src="assets/images/hero-technician.jpg" width="1680" height="945" alt="HVAC technician inspecting residential outdoor equipment"><figcaption>Same-Day Appointments<br><span>Available across Plano, Frisco, and Allen</span></figcaption></figure>` : `<div class="service-visual reveal" aria-hidden="true"><span></span><span></span><span></span></div>`}
    </div>
  </section>`;
}

function serviceCards(root) {
  return `<div class="card-grid service-card-grid">${services.map(([name, path, desc], index) => `<article class="service-card reveal">
    <div class="card-icon" aria-hidden="true">${String(index + 1).padStart(2, "0")}</div>
    <h3>${name}</h3><p>${desc}</p><a class="text-link" href="${href(root, path)}">Learn more</a>
  </article>`).join("")}</div>`;
}

function faqBlock(items = faqs.slice(0, 6)) {
  return `<div class="faq-list" data-accordion>${items.map(([q, a], i) => `<div class="faq-item">
    <h3><button type="button" aria-expanded="${i === 0 ? "true" : "false"}" aria-controls="faq-${slug(q)}">${q}</button></h3>
    <div id="faq-${slug(q)}" class="faq-panel"${i === 0 ? "" : " hidden"}><p>${a}</p></div>
  </div>`).join("")}</div>`;
}

function slug(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function processSteps() {
  return `<div class="step-grid">${["Schedule", "Diagnose", "Review Options", "Complete the Work"].map((step, i) => `<article class="step-card"><span>${i + 1}</span><h3>${step}</h3><p>${[
    "Choose a time and tell us what you are noticing.",
    "A technician checks the equipment before making recommendations.",
    "You get clear options, priorities, and example cost factors.",
    "Approved work is completed carefully and documented."
  ][i]}</p></article>`).join("")}</div>`;
}

function disclaimerBlock(extra = "") {
  return `<aside class="disclaimer-block"><strong>Fictional portfolio disclosure.</strong> ${disclosure}${extra ? " " + extra : ""}</aside>`;
}

function finalCta(root, title = "Let's Get Your Home Comfortable Again.") {
  return `<section class="section final-cta"><div class="container cta-band"><div><p class="eyebrow">Ready when you are</p><h2>${title}</h2><p>Appointments available Monday through Saturday. Emergency service available 24/7.</p></div><div class="button-row"><a class="button button--primary" href="${href(root, "contact/")}">Schedule Service</a><a class="button button--secondary-light" href="tel:${tel}">Call ${phone}</a></div></div></section>`;
}

function home(root) {
  return [
    hero({ eyebrow: "North Texas Heating & Air", title: "Heating and Cooling Done Right.", copy: "Trusted HVAC repair, installation, and maintenance for homeowners across North Texas.", image: true }),
    `<section class="trust-strip"><div class="container trust-grid">${["Serving North Texas Since 2004", "Licensed and Insured", "No-Pressure Recommendations", "Workmanship Warranty"].map((t) => `<div><span aria-hidden="true"></span>${t}</div>`).join("")}</div></section>`,
    `<section class="section"><div class="container section-heading"><p class="eyebrow">Core services</p><h2>Practical help for the systems your home depends on.</h2><p>Repair, replacement, maintenance, and indoor comfort support without noisy sales pressure.</p></div><div class="container">${serviceCards(root)}</div></section>`,
    `<section class="section emergency-banner"><div class="container emergency-grid"><div><p class="eyebrow">24/7 Emergency Service</p><h2>System Down? We're Ready.</h2><p>Cornerstone provides emergency heating and cooling service across North Texas, including evenings and weekends.</p></div><div class="button-row"><a class="button button--accent" href="tel:${tel}">Call for Emergency Service</a><a class="button button--secondary-light" href="services/ac-repair/#emergency">See What Counts as an Emergency</a></div></div></section>`,
    `<section class="section split-section"><div class="container two-col"><div class="image-panel image-panel--tools reveal"><span>Careful diagnostics</span></div><div class="content-stack reveal"><p class="eyebrow">Why Cornerstone</p><h2>Good Service Starts With a Straight Answer.</h2><p>Cornerstone is built around long-term customer relationships. We explain the problem, the options, and the cost before work begins.</p><ul class="check-list"><li>Diagnose before recommending</li><li>Explain your options clearly</li><li>Protect your home while we work</li><li>Stand behind the finished repair</li></ul></div></div></section>`,
    `<section class="section sandstone"><div class="container two-col two-col--wide"><div class="content-stack"><p class="eyebrow">Interactive symptom guide</p><h2>Can It Wait?</h2><p>This quick tool helps homeowners understand when common HVAC symptoms may need urgent attention. It is not a substitute for a technician's diagnosis.</p>${disclaimerBlock("Use safety judgment first.")}</div><div class="tool-card" data-symptom-guide><label for="symptom-choice">What are you noticing?</label><select id="symptom-choice"><option value="">Choose a symptom</option><option value="no-power">System will not turn on</option><option value="warm-air">Warm air from vents</option><option value="burning-smell">Burning smell</option><option value="water">Water around the indoor unit</option><option value="frozen">Frozen outdoor or indoor coil</option><option value="noise">Unusual noise</option><option value="blank-thermostat">Thermostat is blank</option><option value="weak-airflow">Weak airflow</option><option value="co-alarm">Carbon monoxide alarm</option></select><div class="result-panel" data-symptom-result aria-live="polite"><p>Select a symptom to see suggested urgency.</p></div><a class="button button--primary button--wide" href="contact/">Schedule Service</a></div></div></section>`,
    `<section class="section"><div class="container two-col"><div class="plan-card reveal"><p class="eyebrow">Cornerstone Comfort Plan</p><h2>Maintenance that feels less like a chore.</h2><ul class="check-list"><li>Two seasonal tune-ups</li><li>Priority scheduling</li><li>Reduced diagnostic fee</li><li>Repair discount</li><li>Maintenance reminders</li><li>Equipment history record</li></ul><a class="button button--primary" href="comfort-plan/">Explore the Comfort Plan</a></div><div class="cost-guide compact-tool" data-cost-guide><h3>Repair Cost Guide</h3><p>Ballpark ranges to help you plan — not a quote.</p><select data-cost-service><option>AC repair</option><option>Heating repair</option><option>Maintenance</option><option>Commercial service</option></select><select data-cost-age><option value="newer">0-5 years</option><option value="mid">6-12 years</option><option value="older">13+ years</option></select><select data-cost-symptom><option value="minor">Weak airflow</option><option value="moderate">System will not turn on</option><option value="major">Compressor or major component concern</option></select><select data-cost-warranty><option value="in">Warranty may apply</option><option value="out">Out of warranty</option></select><select data-cost-property><option>Residential</option><option>Commercial</option></select><div class="result-panel" data-cost-result aria-live="polite"></div></div></div></section>`,
    `<section class="section sandstone"><div class="container section-heading"><p class="eyebrow">Customer reviews</p><h2>Clear communication is the pattern.</h2></div><div class="container review-grid">${reviews.slice(0, 3).map(reviewCard).join("")}</div><div class="container"><p class="fine-print">Testimonials are fictional portfolio content.</p></div></section>`,
    `<section class="section"><div class="container two-col"><div><p class="eyebrow">Service area</p><h2>North Texas neighborhoods, handled locally.</h2><p>Plano, Frisco, Allen, McKinney, Richardson, Carrollton, The Colony, Prosper, and North Dallas.</p><a class="button button--secondary" href="service-area/">View Service Area</a></div><div class="zip-tool tool-card" data-zip-checker><label for="zip-input">Check your ZIP code</label><div class="inline-form"><input id="zip-input" inputmode="numeric" pattern="[0-9]*" maxlength="5" placeholder="75024"><button class="button button--primary" type="button" data-zip-submit>Check</button></div><div class="result-panel" data-zip-result aria-live="polite"><p>Enter a North Texas ZIP code.</p></div></div></div></section>`,
    finalCta(root)
  ].join("");
}

function reviewCard([name, city, category, quote]) {
  return `<article class="review-card" data-review-category="${category}"><p>"${quote}"</p><footer><strong>${name}</strong><span>${city} | ${category}</span></footer></article>`;
}

function servicePage(root, data) {
  return [
    hero({ eyebrow: data.eyebrow, title: data.title, copy: data.copy, actions: false }),
    `<section class="section"><div class="container two-col"><div class="content-stack">${data.intro}</div><div class="info-card"><h2>What Cornerstone checks</h2><ul class="check-list">${data.checks.map((x) => `<li>${x}</li>`).join("")}</ul></div></div></section>`,
    `<section class="section sandstone"><div class="container section-heading"><p class="eyebrow">${data.midEyebrow}</p><h2>${data.midTitle}</h2><p>${data.midCopy}</p></div><div class="container card-grid">${data.cards.map(([h, p]) => `<article class="content-card"><h3>${h}</h3><p>${p}</p></article>`).join("")}</div></section>`,
    data.extra || "",
    `<section class="section"><div class="container two-col"><div><p class="eyebrow">Frequently asked</p><h2>Answers before you schedule.</h2></div>${faqBlock(data.faq || faqs.slice(0, 5))}</div></section>`,
    finalCta(root, data.cta || "Get a clear HVAC recommendation.")
  ].join("");
}

const pages = [
  { file: "index.html", title: "Cornerstone Heating & Air | HVAC Service in North Texas", desc: "24/7 emergency heating and cooling repair, installation, and maintenance for homeowners across Plano, Frisco, Allen, and the North Texas metro.", body: (root) => home(root) },
  { file: "services/index.html", title: "HVAC Services | Cornerstone Heating & Air", desc: "Explore Cornerstone's HVAC repair, installation, maintenance, indoor air quality, and light-commercial services across North Texas.", body: (root) => [
    hero({ eyebrow: "HVAC services", title: "Clear service for every season.", copy: "Repair, replacement, maintenance, and comfort planning with practical recommendations.", actions: false }),
    `<section class="section"><div class="container">${serviceCards(root)}</div></section>`,
    `<section class="section sandstone"><div class="container two-col"><div><p class="eyebrow">Repair or replace</p><h2>The right answer depends on the home.</h2><p>Cornerstone looks at system age, repair frequency, warranty status, energy use, comfort concerns, and installation quality before recommending a path.</p></div><div class="info-card"><h2>Service process</h2>${processSteps()}</div></div></section>`,
    `<section class="section"><div class="container two-col"><div class="plan-card"><h2>Maintenance can change the pattern.</h2><p>The Cornerstone Comfort Plan keeps tune-ups, reminders, and equipment history from falling through the cracks.</p><a class="button button--primary" href="${href(root, "comfort-plan/")}">Join the Comfort Plan</a></div>${faqBlock()}</div></section>`,
    finalCta(root)
  ].join("") },
  { file: "services/ac-repair/index.html", title: "AC Repair in North Texas | Cornerstone Heating & Air", desc: "AC repair in Plano, Frisco, Allen, and across North Texas. Same-day diagnostics, honest recommendations, and 24/7 emergency cooling service.", body: (root) => servicePage(root, {
    eyebrow: "AC repair", title: "Cooling repairs without the runaround.", copy: "When the house is getting warmer, you need a calm diagnosis and a clear next step.",
    intro: `<h2>Common air-conditioning problems</h2><p>North Texas cooling calls often involve failed capacitors, refrigerant leaks, clogged drain lines, frozen evaporator coils, blower motor failures, thermostat issues, compressor problems, and dirty condenser coils.</p><p id="emergency"><strong>Emergency guidance:</strong> no cooling during extreme heat, water near electrical components, burning smells, or sparking equipment should be handled quickly.</p>`,
    checks: ["Thermostat operation", "Electrical components", "Airflow and filter condition", "Drain line and safety switch", "Indoor and outdoor coil condition", "Refrigerant-related indicators", "Blower and outdoor fan operation"],
    midEyebrow: "Repair examples", midTitle: "We explain what failed before discussing cost.", midCopy: "Repair cost depends on the failed component, system accessibility, equipment age, and warranty status. Cornerstone provides options before work begins.",
    cards: [["No-cool call", "A technician verifies power, controls, capacitor condition, compressor response, and airflow."], ["Frozen coil", "Ice is a symptom. Airflow, filters, coils, refrigerant indicators, and run conditions all need review."], ["Drain concern", "Clogged drains and float switches can shut systems down to reduce water damage risk."]],
    faq: faqs.slice(0, 6)
  }) },
  { file: "services/heating-repair/index.html", title: "Heating Repair | Cornerstone Heating & Air", desc: "Furnace and heat pump repair across North Texas, with clear safety guidance for gas odors, carbon monoxide alarms, and no-heat emergencies.", body: (root) => servicePage(root, {
    eyebrow: "Heating repair", title: "Steady help when the heat will not keep up.", copy: "Furnace and heat pump diagnostics focused on safety, comfort, and straight answers.",
    intro: `<h2>Heating issues we evaluate</h2><p>Heating calls may involve ignition problems, airflow restrictions, thermostat issues, unusual smells or noises, heat pump defrost concerns, and emergency heat questions.</p><div class="alert-block"><strong>Safety warning:</strong> If a carbon monoxide alarm activates, leave the home and contact emergency services before calling an HVAC contractor.</div>`,
    checks: ["Ignition and burner sequence where applicable", "Heat pump operation", "Airflow and filter condition", "Thermostat settings", "Electrical controls", "Venting and visible safety concerns", "Unusual odors or noise sources"],
    midEyebrow: "Safety first", midTitle: "Not every heat problem is just a comfort problem.", midCopy: "Gas odor, smoke, flame rollout, or carbon monoxide alarms require emergency action. We keep that distinction clear from the first phone call.",
    cards: [["Furnace repair", "Ignition, flame sensing, airflow, and limit issues are approached with safety first."], ["Heat pump repair", "Reversing valves, defrost operation, outdoor fan operation, and backup heat are reviewed carefully."], ["Thermostat issues", "Blank displays, bad settings, wiring concerns, and control failures can mimic larger equipment problems."]]
  }) },
  { file: "services/installation/index.html", title: "HVAC Installation | Cornerstone Heating & Air", desc: "HVAC system replacement and installation across North Texas, sized correctly and matched to your comfort goals and budget.", body: (root) => servicePage(root, {
    eyebrow: "System installation", title: "Replacement planning built around the home.", copy: "The right system is sized correctly, installed carefully, and matched to real comfort goals.",
    intro: `<h2>When replacement may be worth discussing</h2><p>Frequent repairs, uneven comfort, rising energy use, major component failure, refrigerant limitations, and poor installation history can all start a replacement conversation. None of them automatically mean the most expensive option is best.</p><p>Correct sizing and installation quality matter more than buying the highest tier.</p>`,
    checks: ["Load and sizing considerations", "Duct condition and airflow", "Electrical and drainage requirements", "Equipment access", "Comfort and humidity goals", "Warranty details", "Financing fit"],
    midEyebrow: "System comparison", midTitle: "Three tiers, one practical conversation.", midCopy: "Every tier is installed to the same standard. Your technician recommends the level of efficiency and comfort control that fits your home and budget.",
    cards: [["Essential", "Reliable comfort and straightforward operation for homeowners who want practical replacement."], ["Preferred", "Improved efficiency, quieter operation, and enhanced comfort control."], ["Signature", "Variable-speed performance, advanced humidity control, and premium efficiency when the home supports it."]],
    extra: `<section class="section"><div class="container two-col"><div><h2>Installation process</h2>${processSteps()}</div><div class="info-card"><h2>Financing available</h2><p>See example terms and monthly-payment ranges for system replacement before your estimate.</p><a class="button button--primary" href="${href(root, "financing/")}">See Financing Options</a></div></div></section>`
  }) },
  { file: "services/maintenance/index.html", title: "HVAC Maintenance | Cornerstone Heating & Air", desc: "Seasonal AC and furnace tune-ups across North Texas that protect efficiency, catch small issues early, and keep a clear equipment history.", body: (root) => servicePage(root, {
    eyebrow: "Preventive maintenance", title: "Seasonal tune-ups that keep records straight.", copy: "Maintenance helps catch small issues, protect efficiency, and keep equipment history visible.",
    intro: `<h2>What homeowners can safely do</h2><ul class="check-list"><li>Replace filters</li><li>Clear debris around the outdoor unit</li><li>Check thermostat batteries</li><li>Keep vents unobstructed</li><li>Visually inspect drain lines</li></ul><p>Do not open electrical panels, handle refrigerant, bypass safety switches, or perform risky repairs.</p>`,
    checks: ["Spring cooling tune-up items", "Fall heating tune-up items", "Electrical and control observations", "Drain and condensate review", "Airflow checks", "Visible wear and maintenance notes", "Equipment service history"],
    midEyebrow: "Comfort Plan", midTitle: "A maintenance rhythm you do not have to remember alone.", midCopy: "The Cornerstone Comfort Plan includes two seasonal tune-ups, reminders, priority scheduling, and service records.",
    cards: [["Spring cooling", "Outdoor coil condition, drain performance, cooling operation, airflow, and control checks."], ["Fall heating", "Heating sequence, safety observations, airflow, thermostat operation, and performance notes."], ["Homeowner basics", "Filters, vents, thermostat batteries, and outdoor clearance are practical owner tasks."]],
    extra: `<section class="section"><div class="container plan-card"><h2>Cornerstone Comfort Plan</h2><p>Two annual visits, priority scheduling, reduced diagnostic fee, and repair discount.</p><a class="button button--primary" href="${href(root, "comfort-plan/")}">Explore the Comfort Plan</a></div></section>`
  }) },
  { file: "services/indoor-air-quality/index.html", title: "Indoor Air Quality | Cornerstone Heating & Air", desc: "Filtration, humidity control, ventilation, and duct solutions to make North Texas homes feel cleaner and more comfortable year-round.", body: (root) => servicePage(root, {
    eyebrow: "Indoor air quality", title: "Comfort is more than temperature.", copy: "Filtration, humidity, ventilation, duct leakage, and airflow can all affect how a home feels.",
    intro: `<h2>Product-neutral recommendations</h2><p>Indoor air-quality improvements may help reduce certain airborne particles and improve overall comfort. We avoid medical claims and do not suggest any HVAC product cures allergies, asthma, illness, mold exposure, or respiratory conditions.</p>`,
    checks: ["Filter type and fit", "Humidity patterns", "Ventilation needs", "Visible duct leakage concerns", "Airflow and room balance", "Purification options", "Maintenance requirements"],
    midEyebrow: "IAQ topics", midTitle: "Useful improvements start with the concern.", midCopy: "The recommendation changes when the concern is dust, humidity, stale rooms, odors, or uneven airflow.",
    cards: [["Filtration", "Better filter fit and appropriate media can reduce particles without starving airflow."], ["Humidity control", "Too much or too little humidity can affect comfort and equipment behavior."], ["Ventilation and ducts", "Fresh-air strategy and duct leakage both shape indoor comfort."]]
  }) },
  { file: "services/commercial/index.html", title: "Commercial HVAC | Cornerstone Heating & Air", desc: "Light-commercial HVAC service for offices, restaurants, retail, and medical spaces across North Texas, including rooftop units and maintenance agreements.", body: (root) => servicePage(root, {
    eyebrow: "Commercial HVAC", title: "Light-commercial support with clear coordination.", copy: "Service for offices, small retail spaces, restaurants, medical offices, light industrial spaces, and multi-tenant properties.",
    intro: `<h2>Built for smaller commercial properties</h2><p>Cornerstone is positioned as a light-commercial contractor, not a massive industrial firm. The focus is repair, maintenance agreements, rooftop units, split systems, replacement planning, tenant comfort issues, and after-hours scheduling.</p>`,
    checks: ["Rooftop unit operation", "Split-system performance", "Tenant comfort complaints", "Filter and maintenance status", "Access and scheduling constraints", "Replacement planning", "Response coordination"],
    midEyebrow: "Commercial needs", midTitle: "Reliable service without overcomplicating the job.", midCopy: "Clear communication matters when owners, managers, tenants, and staff all need to know what happens next.",
    cards: [["Maintenance agreements", "Planned visits help reduce avoidable downtime and document equipment condition."], ["After-hours scheduling", "Service windows can be coordinated around customer and tenant needs."], ["Replacement planning", "Budgeting ahead reduces emergency replacement pressure."]]
  }) },
  { file: "comfort-plan/index.html", title: "Cornerstone Comfort Plan | HVAC Maintenance Membership", desc: "Join the Cornerstone Comfort Plan for two seasonal tune-ups, priority scheduling, repair discounts, and maintenance reminders.", body: (root) => [
    hero({ eyebrow: "Maintenance membership", title: "Cornerstone Comfort Plan", copy: "Two seasonal tune-ups, priority scheduling, reminders, and a clearer equipment history.", actions: false }),
    `<section class="section"><div class="container two-col"><div class="price-card"><p class="eyebrow">Membership pricing</p><h2>$19 per month</h2><p>or $219 annually. Cancel anytime — no long-term contract.</p><a class="button button--primary" href="${href(root, "contact/?service=comfort-plan")}">Enroll in the Comfort Plan</a></div><div><h2>Included benefits</h2><ul class="check-list"><li>Two annual tune-ups</li><li>Priority scheduling</li><li>10% repair discount</li><li>Reduced diagnostic fee</li><li>Maintenance reminders</li><li>Equipment service record</li><li>No overtime surcharge for qualifying repairs</li><li>Transferable membership within the service area</li></ul></div></div></section>`,
    `<section class="section sandstone"><div class="container card-grid"><article class="content-card"><h3>Included</h3><p>Seasonal tune-ups, reminders, service history, priority scheduling, and qualifying member discounts.</p></article><article class="content-card"><h3>Exclusions</h3><p>Parts, major repairs, code upgrades, inaccessible equipment, hazardous conditions, and work outside the service area are not included.</p></article><article class="content-card"><h3>Best fit</h3><p>Homeowners who want consistent maintenance without remembering every seasonal detail.</p></article></div></section>`,
    `<section class="section"><div class="container two-col"><div><h2>Comfort Plan FAQs</h2><p>Membership should make maintenance simpler, not mysterious.</p></div>${faqBlock(faqs.slice(0, 6))}</div></section>`,
    finalCta(root, "Keep maintenance on the calendar.")
  ].join("") },
  { file: "about/index.html", title: "About Cornerstone Heating & Air", desc: "Meet the team behind Cornerstone Heating & Air and learn how our North Texas HVAC company approaches every repair and installation.", body: (root) => [
    hero({ eyebrow: "About Cornerstone", title: "Built on Reliability.", copy: "A North Texas HVAC company built around clear recommendations, careful work, and long-term trust.", actions: false }),
    `<section class="section"><div class="container two-col"><div><h2>Our story</h2><p>Cornerstone Heating & Air was founded in 2004 by a field technician who believed homeowners deserved clearer explanations and more honest repair recommendations.</p><p>Two decades later, that same standard still shapes every appointment we run.</p>${disclaimerBlock()}</div><div class="info-card"><h2>Service philosophy</h2><ul class="check-list"><li>Do the diagnosis first</li><li>Explain the options</li><li>Respect the home</li><li>Finish the work correctly</li><li>Stay accountable</li></ul></div></div></section>`,
    `<section class="section sandstone"><div class="container section-heading"><p class="eyebrow">Leadership</p><h2>People behind the standard.</h2></div><div class="container card-grid team-grid">${[["Marcus Reed", "Founder and General Manager"], ["Elena Torres", "Service Operations Manager"], ["Daniel Cho", "Installation Manager"]].map(([n, r]) => `<article class="team-card"><div class="portrait" aria-hidden="true">${n.split(" ").map((x) => x[0]).join("")}</div><h3>${n}</h3><p>${r}</p></article>`).join("")}</div></section>`,
    `<section class="section"><div class="container two-col"><div><h2>Community and standards</h2><p>Cornerstone supports neighborhood events, technician training, clean jobsite standards, and responsible safety communication.</p></div><div class="badge-grid"><span>Clear Estimates</span><span>Home Protection</span><span>Training Culture</span><span>Accountable Follow-Up</span></div></div></section>`,
    finalCta(root)
  ].join("") },
  { file: "reviews/index.html", title: "Reviews | Cornerstone Heating & Air", desc: "Read what North Texas homeowners say about Cornerstone Heating & Air's AC repair, heating repair, installation, and maintenance service.", body: (root) => [
    hero({ eyebrow: "Reviews", title: "Real feedback from North Texas homeowners.", copy: "See what customers are saying about their service, from routine tune-ups to same-day emergency repairs.", actions: false }),
    `<section class="section"><div class="container"><div class="filter-row" data-review-filters><button class="active" type="button" data-filter="All">All</button>${["AC Repair", "Heating", "Installation", "Maintenance", "Commercial"].map((cat) => `<button type="button" data-filter="${cat}">${cat}</button>`).join("")}</div><div class="review-grid" data-review-list>${reviews.map(reviewCard).join("")}</div><div class="empty-state" data-review-empty hidden>No reviews match that filter yet.</div>${disclaimerBlock("These testimonials are fictional and were created to demonstrate website design and content presentation.")}</div></section>`
  ].join("") },
  { file: "service-area/index.html", title: "Service Area | Cornerstone Heating & Air", desc: "Cornerstone Heating & Air serves Plano, Frisco, Allen, McKinney, Richardson, Carrollton, The Colony, Prosper, and North Dallas.", body: (root) => [
    hero({ eyebrow: "Service area", title: "Focused on North Texas.", copy: "Plano, Frisco, Allen, McKinney, Richardson, Carrollton, The Colony, Prosper, and North Dallas.", actions: false }),
    `<section class="section"><div class="container two-col"><div class="map-panel" aria-hidden="true">${cities.map(([city]) => `<span>${city}</span>`).join("")}</div><div class="zip-tool tool-card" data-zip-checker><h2>Not sure whether we serve your neighborhood?</h2><label for="area-zip">Check your ZIP code</label><div class="inline-form"><input id="area-zip" inputmode="numeric" pattern="[0-9]*" maxlength="5" placeholder="75024"><button class="button button--primary" type="button" data-zip-submit>Check</button></div><div class="result-panel" data-zip-result aria-live="polite"><p>Enter a ZIP code to check availability in your neighborhood.</p></div></div></div></section>`,
    `<section class="section sandstone"><div class="container city-grid">${cities.map(([city, copy]) => `<article class="city-card" id="${slug(city)}"><h2>${city}</h2><p>${copy}</p><p><strong>Available services:</strong> AC repair, heating repair, installation, maintenance, indoor air quality, and light-commercial HVAC.</p><a class="text-link" href="${href(root, "contact/")}">Schedule in ${city}</a></article>`).join("")}</div></section>`,
    finalCta(root, "Find help close to home.")
  ].join("") },
  { file: "financing/index.html", title: "Financing | Cornerstone Heating & Air", desc: "Flexible financing options for HVAC system replacement across North Texas, with example terms and monthly payment ranges.", body: (root) => [
    hero({ eyebrow: "Financing", title: "Make the right system the affordable one.", copy: "Flexible plans make it easier to say yes to the system your home actually needs, not just the one you can pay for outright.", actions: false }),
    `<section class="section"><div class="container two-col"><div><h2>System replacement financing</h2><p>Approved customers can spread the cost of a new system over time with a monthly payment that fits their budget. This page shows example terms for illustration; it is not a lender application, and nothing here initiates a real credit check or loan.</p><ul class="check-list"><li>Promotional financing examples</li><li>Monthly-payment explanation</li><li>Simple application-process overview</li><li>Clear terms before you commit</li></ul><button class="button button--primary" type="button" data-modal-open="financing-modal">See Example Application</button></div><div class="content-card"><h2>Sample conversation</h2><p>Monthly cost depends on system scope, approved terms, interest rate, fees, and down payment. Cornerstone reviews financing options after a replacement estimate, not before a diagnosis.</p></div></div></section>`,
    `<section class="section sandstone"><div class="container two-col"><div><h2>Financing FAQs</h2></div>${faqBlock([faqs[5], ["Is this a real credit application?", "No. This page illustrates example terms only — no information is collected, sent, or stored, and it is not a real credit application."], ["Do you name a lender?", "No specific lender is named here. Financing terms vary by applicant, approved credit, and promotional offers available at the time."]])}</div></section>`,
    `<div class="modal" id="financing-modal" role="dialog" aria-modal="true" aria-labelledby="financing-title" hidden><div class="modal-card"><button class="modal-close" type="button" data-modal-close>Close</button><h2 id="financing-title">Example financing walkthrough</h2><p>This is an example only — no application data is collected, sent, or stored, and it does not represent a real lender.</p></div></div>`
  ].join("") },
  { file: "careers/index.html", title: "Careers | Cornerstone Heating & Air", desc: "Join the Cornerstone Heating & Air team. Explore open HVAC technician and customer care roles across North Texas.", body: (root) => [
    hero({ eyebrow: "Careers", title: "Join a team that stands behind its work.", copy: "Explore open roles, our culture, and what it's like to build a career at Cornerstone.", actions: false }),
    `<section class="section"><div class="container section-heading"><h2>Open roles</h2><p>We hire for skill and character in equal measure — technical talent matters, but so does how you treat the homes you work in.</p></div><div class="container card-grid">${["HVAC Service Technician", "Installation Technician", "Customer Care Coordinator", "Maintenance Technician"].map((role) => `<article class="content-card"><h3>${role}</h3><p>Clear communication, clean work habits, and steady follow-through matter as much as technical skill.</p></article>`).join("")}</div></section>`,
    `<section class="section sandstone"><div class="container two-col"><div><h2>Culture and benefits</h2><ul class="check-list"><li>Training-focused leadership</li><li>Respectful scheduling</li><li>Organized vehicles and tools</li><li>Health, time-off, and retirement examples</li><li>Clear advancement paths</li></ul><h2>Hiring process</h2><p>Apply, phone screen, technical conversation, ride-along or skills discussion, and final review.</p></div>${careerForm()}</div></section>`
  ].join("") },
  { file: "contact/index.html", title: "Schedule Service | Cornerstone Heating & Air", desc: "Schedule AC repair, heating repair, installation, or maintenance service with Cornerstone Heating & Air. Same-day appointments available.", body: (root) => [
    hero({ eyebrow: "Contact", title: "Tell us what is happening.", copy: "Tell us what's going on and we'll get a technician scheduled.", actions: false }),
    `<section class="section"><div class="container two-col two-col--wide"><div><div class="alert-block"><strong>Emergency note:</strong> For smoke, fire, gas odor, or an active carbon monoxide alarm, leave the property and contact emergency services.</div><h2>Service request</h2><p>Fill out the form below and our team will follow up to confirm your appointment time.</p>${disclaimerBlock()}</div>${serviceForm()}</div></section>`
  ].join("") },
  { file: "privacy/index.html", title: "Privacy Policy | Cornerstone Heating & Air", desc: "Privacy policy for Cornerstone Heating & Air.", body: () => legalPage("Privacy Policy", "This fictional portfolio site does not send or store service requests, career applications, ZIP checks, symptom guide inputs, or cost-guide selections. A real implementation would document analytics, form handling, retention, and security practices.") },
  { file: "terms/index.html", title: "Terms | Cornerstone Heating & Air", desc: "Terms of use for the Cornerstone Heating & Air website.", body: () => legalPage("Terms", "This website is a portfolio demonstration. The company, address, reviews, pricing examples, team members, and service claims are fictional and do not represent an operating HVAC business.") },
  { file: "accessibility/index.html", title: "Accessibility | Cornerstone Heating & Air", desc: "Accessibility statement for Cornerstone Heating & Air, covering keyboard navigation, focus states, and assistive-technology support.", body: () => legalPage("Accessibility", "This project is designed with semantic headings, keyboard-accessible navigation, visible focus states, labeled forms, accessible accordions, reduced-motion support, and high-contrast color combinations.") },
  { file: "404.html", title: "This Page Needs a Tune-Up | Cornerstone Heating & Air", desc: "Page not found on the Cornerstone Heating & Air website.", body: (root) => `<section class="page-hero"><div class="container narrow"><p class="eyebrow">404</p><h1>This Page Needs a Tune-Up.</h1><p class="lead">The page you were looking for may have moved, expired, or never existed.</p><div class="button-row"><a class="button button--primary" href="${href(root, "index.html")}">Return Home</a><a class="button button--secondary" href="${href(root, "services/")}">View Services</a></div></div></section>` }
];

function legalPage(title, copy) {
  return `<section class="page-hero"><div class="container narrow"><p class="eyebrow">Fictional project</p><h1>${title}</h1><p class="lead">${copy}</p>${disclaimerBlock()}</div></section>`;
}

function serviceForm() {
  return `<form class="form-card" data-form="service" novalidate>
    <div class="form-success" hidden tabindex="-1"><h2>Thanks — we've got your request.</h2><p>A team member will follow up shortly to confirm your appointment. (Portfolio note: this form does not send or store any information.)</p></div>
    <div class="form-grid">
      ${input("firstName", "First name", "text", true)}${input("lastName", "Last name", "text", true)}
      ${input("phone", "Phone", "tel", true)}${input("email", "Email", "email", true)}
      ${input("address", "Service address", "text", true, "full")}${input("city", "City", "text", true)}${input("zip", "ZIP code", "text", true)}
      ${select("service", "Service needed", ["AC repair", "heating repair", "maintenance", "replacement estimate", "indoor air quality", "commercial service", "Comfort Plan", "other"], true)}
      ${select("urgency", "Urgency", ["emergency", "today if available", "within 2-3 days", "flexible"], true)}
      ${input("date", "Preferred appointment date", "date", true)}${select("window", "Preferred appointment window", ["morning", "afternoon", "evening", "first available"], true)}
      ${select("role", "Homeowner or property manager", ["homeowner", "property manager"], true)}${select("system", "System type", ["central AC", "furnace", "heat pump", "ductless", "commercial rooftop", "not sure"], true)}
      <div class="field full"><label for="description">Short description</label><textarea id="description" name="description" required rows="5"></textarea><span class="field-error"></span></div>
      <label class="checkbox full"><input type="checkbox" name="consent" required> I understand this is a fictional portfolio form and no real HVAC service will be scheduled.</label>
    </div>
    <button class="button button--primary" type="submit">Submit Service Request</button>
  </form>`;
}

function careerForm() {
  return `<form class="form-card" data-form="career" novalidate>
    <div class="form-success" hidden tabindex="-1"><h2>Thanks for applying.</h2><p>Our hiring team will be in touch soon. (Portfolio note: this form does not send or store any information.)</p></div>
    <h2>Demo application</h2>
    <div class="form-grid">${input("careerName", "Full name", "text", true)}${input("careerEmail", "Email", "email", true)}${select("careerRole", "Role", ["HVAC Service Technician", "Installation Technician", "Customer Care Coordinator", "Maintenance Technician"], true)}${input("careerPhone", "Phone", "tel", true)}<div class="field full"><label for="careerMessage">Experience summary</label><textarea id="careerMessage" name="careerMessage" rows="5" required></textarea><span class="field-error"></span></div><label class="checkbox full"><input type="checkbox" name="careerConsent" required> I understand this is a fictional portfolio form.</label></div>
    <button class="button button--primary" type="submit">Submit Demo Application</button>
  </form>`;
}

function input(name, label, type, required, cls = "") {
  return `<div class="field ${cls}"><label for="${name}">${label}</label><input id="${name}" name="${name}" type="${type}" ${required ? "required" : ""}><span class="field-error"></span></div>`;
}

function select(name, label, options, required) {
  return `<div class="field"><label for="${name}">${label}</label><select id="${name}" name="${name}" ${required ? "required" : ""}><option value="">Select</option>${options.map((o) => `<option value="${slug(o)}">${o}</option>`).join("")}</select><span class="field-error"></span></div>`;
}

function render(page) {
  const root = rootFor(page.file);
  const canonical = siteUrl + pageHref(page.file);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${page.title}</title>
  <meta name="description" content="${page.desc}">
  <meta name="robots" content="noindex, nofollow">
  <link rel="canonical" href="${canonical}">
  <meta property="og:title" content="${page.title}">
  <meta property="og:description" content="${page.desc}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${canonical}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${page.title}">
  <meta name="twitter:description" content="${page.desc}">
  <link rel="stylesheet" href="${href(root, "assets/css/styles.css")}">
</head>
<body>
${header(root)}
<main id="main">
${page.body(root)}
</main>
${footer(root)}
<noscript><div class="noscript">Interactive tools need JavaScript, but all service and contact information remains available on this page.</div></noscript>
<script type="module" src="${href(root, "assets/js/main.js")}"></script>
</body>
</html>`;
}

for (const page of pages) write(page.file, render(page));

write("robots.txt", `User-agent: *
Disallow: /

Sitemap: ${siteUrl}sitemap.xml
`);

write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.filter((p) => p.file !== "404.html").map((p) => `  <url><loc>${siteUrl}${pageHref(p.file)}</loc></url>`).join("\n")}
</urlset>
`);

write("README.md", `# Cornerstone Heating & Air

Cornerstone Heating & Air is a polished fictional HVAC company website created as a branding, UX, and front-end development portfolio project for Matt Livingston.

## Fictional-company disclosure

${disclosure} All testimonials, pricing examples, staff, addresses, certifications, service claims, and reviews are fictional.

## Features

- Mobile-first responsive website
- GitHub Pages-compatible directory structure
- Homepage conversion flow with hero, service cards, trust strip, reviews, service-area checker, and final CTA
- Dedicated service pages for AC repair, heating repair, installation, maintenance, indoor air quality, and commercial HVAC
- Comfort Plan, About, Reviews, Service Area, Financing, Careers, Contact, Privacy, Terms, Accessibility, and 404 pages
- Accessible mobile navigation, FAQ accordions, modal dialog, local form validation, ZIP checker, symptom guide, cost guide, and review filters
- Clear fictional disclosure across metadata, footer, forms, reviews, financing, and README

## Technology stack

- Semantic HTML
- Modern CSS with custom properties
- Vanilla JavaScript modules
- No runtime server, database, authentication, external APIs, or paid services

## Directory structure

\`\`\`text
/
├── index.html
├── services/
├── comfort-plan/
├── about/
├── service-area/
├── financing/
├── reviews/
├── careers/
├── contact/
├── privacy/
├── terms/
├── accessibility/
├── 404.html
├── assets/
│   ├── css/
│   ├── js/
│   ├── images/
│   ├── icons/
│   └── fonts/
└── scripts/
\`\`\`

## Local development

Open \`index.html\` directly in a browser, or run a simple static server from the project root:

\`\`\`bash
python3 -m http.server 8000
\`\`\`

Then visit \`http://localhost:8000/\`.

## GitHub Pages deployment

1. Push this folder to a GitHub repository.
2. In repository settings, enable GitHub Pages.
3. Choose the branch and root folder that contain \`index.html\`.
4. Keep links relative so subdirectory pages work under a project URL.

## Image replacement

The current hero asset lives at \`assets/images/hero-technician.jpg\`. Replace it with optimized WebP or AVIF production photography when available. Keep width, height, alt text, and responsive CSS updated.

## Form integration notes

Forms validate locally and intentionally do not send or store data. Integration points are marked in page copy. A production version could connect Formspree, Netlify Forms, a CRM endpoint, or a custom backend.

## Accessibility notes

The project includes semantic heading order, keyboard-accessible navigation, visible focus states, skip link, labeled form fields, accessible accordions, reduced-motion support, and high-contrast text combinations.

## Performance notes

The site avoids large dependencies, autoplay media, external APIs, and animation libraries. Optimize final imagery with responsive sizes and modern formats before production launch.

## Customization guide

- Update colors, spacing, radius, shadows, and typography in \`assets/css/styles.css\`.
- Update shared page content in \`scripts/generate-site.mjs\`, then run \`node scripts/generate-site.mjs\`.
- Replace the placeholder logo markup in generated headers and footers with a final asset when available.
- Update fictional content carefully if adapting the project for another portfolio case study.

## License

Portfolio demonstration content. Confirm usage rights for any replacement photography, icons, fonts, or production assets before publishing.
`);

write("assets/js/main.js", `import { initNavigation } from "./navigation.js";
import { initAccordions } from "./accordion.js";
import { initModals } from "./modal.js";
import { initForms } from "./forms.js";
import { initSymptomGuide } from "./symptom-guide.js";
import { initZipChecker } from "./zip-checker.js";
import { initCostGuide } from "./cost-guide.js";
import { initReviewFilters } from "./review-filter.js";
import { initAnimations } from "./animations.js";

initNavigation();
initAccordions();
initModals();
initForms();
initSymptomGuide();
initZipChecker();
initCostGuide();
initReviewFilters();
initAnimations();
`);

write("assets/js/navigation.js", `export function initNavigation() {
  const toggle = document.querySelector("[data-menu-toggle]");
  const menu = document.querySelector("[data-mobile-menu]");
  const close = document.querySelector("[data-menu-close]");
  if (!toggle || !menu) return;

  const setOpen = (open) => {
    toggle.setAttribute("aria-expanded", String(open));
    menu.hidden = !open;
    document.body.classList.toggle("menu-open", open);
    if (open) {
      const first = menu.querySelector("a, button, summary");
      if (first) first.focus();
    } else {
      toggle.focus();
    }
  };

  toggle.addEventListener("click", () => setOpen(toggle.getAttribute("aria-expanded") !== "true"));
  if (close) close.addEventListener("click", () => setOpen(false));
  menu.addEventListener("click", (event) => {
    if (event.target === menu) setOpen(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") setOpen(false);
  });
}
`);

write("assets/js/accordion.js", `export function initAccordions() {
  document.querySelectorAll("[data-accordion]").forEach((group) => {
    group.addEventListener("click", (event) => {
      const button = event.target.closest("button[aria-controls]");
      if (!button) return;
      const panel = document.getElementById(button.getAttribute("aria-controls"));
      if (!panel) return;
      const expanded = button.getAttribute("aria-expanded") === "true";
      button.setAttribute("aria-expanded", String(!expanded));
      panel.hidden = expanded;
    });
  });
}
`);

write("assets/js/modal.js", `export function initModals() {
  let lastFocus = null;
  const openModal = (modal) => {
    lastFocus = document.activeElement;
    modal.hidden = false;
    document.body.classList.add("modal-open");
    const close = modal.querySelector("[data-modal-close]");
    if (close) close.focus();
  };
  const closeModal = (modal) => {
    modal.hidden = true;
    document.body.classList.remove("modal-open");
    if (lastFocus) lastFocus.focus();
  };

  document.addEventListener("click", (event) => {
    const openButton = event.target.closest("[data-modal-open]");
    if (openButton) {
      const modal = document.getElementById(openButton.dataset.modalOpen);
      if (modal) openModal(modal);
    }
    if (event.target.matches("[data-modal-close]") || event.target.classList.contains("modal")) {
      const modal = event.target.closest(".modal");
      if (modal) closeModal(modal);
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    document.querySelectorAll(".modal:not([hidden])").forEach(closeModal);
  });
}
`);

write("assets/js/forms.js", `export function initForms() {
  const params = new URLSearchParams(window.location.search);
  const requestedService = params.get("service");
  if (requestedService) {
    const service = document.querySelector('select[name="service"]');
    if (service) service.value = requestedService;
  }

  document.querySelectorAll("form[data-form]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      let valid = true;
      form.querySelectorAll(".field-error").forEach((error) => error.textContent = "");
      form.querySelectorAll("[required]").forEach((field) => {
        const wrapper = field.closest(".field") || field.closest(".checkbox");
        const error = wrapper ? wrapper.querySelector(".field-error") : null;
        const emptyCheckbox = field.type === "checkbox" && !field.checked;
        const emptyValue = field.type !== "checkbox" && !String(field.value || "").trim();
        const badEmail = field.type === "email" && field.value && !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(field.value);
        if (emptyCheckbox || emptyValue || badEmail) {
          valid = false;
          field.setAttribute("aria-invalid", "true");
          if (error) error.textContent = badEmail ? "Enter a valid email address." : "This field is required.";
        } else {
          field.removeAttribute("aria-invalid");
        }
      });
      const date = form.querySelector('input[type="date"]');
      if (date && date.value) {
        const selected = new Date(date.value + "T00:00:00");
        const day = selected.getDay();
        if (day === 0) {
          valid = false;
          date.setAttribute("aria-invalid", "true");
          const error = date.closest(".field").querySelector(".field-error");
          if (error) error.textContent = "Sunday appointments are emergency-only. Choose another date or call.";
        }
      }
      if (!valid) {
        const firstBad = form.querySelector("[aria-invalid='true']");
        if (firstBad) firstBad.focus();
        return;
      }
      const success = form.querySelector(".form-success");
      if (success) {
        success.hidden = false;
        success.focus();
      }
      form.reset();
    });
  });
}
`);

write("assets/js/symptom-guide.js", `const states = {
  "burning-smell": ["Emergency", "Turn the system off and call for immediate help. If you see smoke or sparking equipment, leave the property and contact emergency services."],
  "co-alarm": ["Emergency", "Leave the home if a carbon monoxide alarm is active. Contact emergency services before calling an HVAC contractor."],
  "no-power": ["Same-Day Service", "A system that will not turn on during extreme weather should be checked soon, especially for vulnerable occupants."],
  "warm-air": ["Same-Day Service", "Warm air during cooling season can point to airflow, control, refrigerant, or outdoor-unit problems."],
  "water": ["Same-Day Service", "Water near indoor equipment can create damage risk, especially near electrical components."],
  "frozen": ["Same-Day Service", "A frozen coil is a symptom. Turn cooling off and schedule service so airflow and system conditions can be checked."],
  "blank-thermostat": ["Same-Day Service", "A blank thermostat may be a simple battery issue or a system safety shutoff. Check batteries if safe, then schedule service."],
  "noise": ["Schedule Soon", "Unusual noises should be checked before they become larger repairs. Turn the system off if the sound is severe."],
  "weak-airflow": ["Schedule Soon", "Weak airflow can come from filters, ducts, blower issues, or equipment condition. Start with a filter check if accessible."]
};

export function initSymptomGuide() {
  document.querySelectorAll("[data-symptom-guide]").forEach((guide) => {
    const select = guide.querySelector("select");
    const result = guide.querySelector("[data-symptom-result]");
    if (!select || !result) return;
    select.addEventListener("change", () => {
      const state = states[select.value];
      if (!state) {
        result.innerHTML = "<p>Select a symptom to see suggested urgency.</p>";
        result.dataset.state = "";
        return;
      }
      result.dataset.state = state[0].toLowerCase().replace(/\\s+/g, "-");
      result.innerHTML = "<h3>" + state[0] + "</h3><p>" + state[1] + "</p><p class='fine-print'>This is not a diagnosis. Use safety judgment first.</p>";
    });
  });
}
`);

write("assets/js/zip-checker.js", `const primary = new Set(["75024", "75025", "75093", "75034", "75035", "75013", "75070", "75071", "75080", "75081", "75082", "75010", "75056", "75078", "75248", "75252"]);
const nearby = new Set(["75023", "75074", "75075", "75036", "75068", "75069", "75287", "75006"]);

export function initZipChecker() {
  document.querySelectorAll("[data-zip-checker]").forEach((checker) => {
    const input = checker.querySelector("input");
    const button = checker.querySelector("[data-zip-submit]");
    const result = checker.querySelector("[data-zip-result]");
    if (!input || !button || !result) return;
    const run = () => {
      const value = input.value.trim();
      if (!/^\\d{5}$/.test(value)) {
        result.dataset.state = "error";
        result.innerHTML = "<p>Enter a five-digit ZIP code.</p>";
      } else if (primary.has(value)) {
        result.dataset.state = "good";
        result.innerHTML = "<p>You're in our primary service area.</p>";
      } else if (nearby.has(value)) {
        result.dataset.state = "near";
        result.innerHTML = "<p>You're near our service area. Call to confirm availability.</p>";
      } else {
        result.dataset.state = "outside";
        result.innerHTML = "<p>This ZIP code is currently outside our listed service area.</p>";
      }
    };
    button.addEventListener("click", run);
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") run();
    });
  });
}
`);

write("assets/js/cost-guide.js", `const ranges = {
  minor: ["Minor service", "$150-$450", "Often tied to maintenance, airflow, simple controls, or accessible minor parts."],
  moderate: ["Moderate repair", "$400-$1,200", "May involve deeper electrical, airflow, drain, motor, or operational checks."],
  major: ["Major component repair", "$1,000-$3,500+", "Major components, age, access, warranty status, and system type can change the conversation."]
};

export function initCostGuide() {
  document.querySelectorAll("[data-cost-guide]").forEach((guide) => {
    const selects = guide.querySelectorAll("select");
    const result = guide.querySelector("[data-cost-result]");
    if (!selects.length || !result) return;
    const update = () => {
      const symptom = guide.querySelector("[data-cost-symptom]");
      const data = ranges[symptom ? symptom.value : "minor"] || ranges.minor;
      const warranty = guide.querySelector("[data-cost-warranty]");
      const warrantyText = warranty && warranty.value === "in" ? "Warranty status may reduce out-of-pocket cost." : "Out-of-warranty repairs depend on parts, access, and diagnosis.";
      result.innerHTML = "<h3>" + data[0] + "</h3><p><strong>Estimated range:</strong> " + data[1] + "</p><p>" + data[2] + " " + warrantyText + "</p><p class='fine-print'>These are general estimates for planning purposes only. They are not quotes and do not imply a diagnosis.</p>";
    };
    selects.forEach((select) => select.addEventListener("change", update));
    update();
  });
}
`);

write("assets/js/review-filter.js", `export function initReviewFilters() {
  document.querySelectorAll("[data-review-filters]").forEach((filters) => {
    const list = document.querySelector("[data-review-list]");
    const empty = document.querySelector("[data-review-empty]");
    if (!list) return;
    filters.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-filter]");
      if (!button) return;
      filters.querySelectorAll("button").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      const value = button.dataset.filter;
      let shown = 0;
      list.querySelectorAll("[data-review-category]").forEach((card) => {
        const match = value === "All" || card.dataset.reviewCategory === value;
        card.hidden = !match;
        if (match) shown += 1;
      });
      if (empty) empty.hidden = shown !== 0;
    });
  });
}
`);

write("assets/js/animations.js", `export function initAnimations() {
  const items = document.querySelectorAll(".reveal");
  if (!items.length || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    items.forEach((item) => item.classList.add("is-visible"));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  items.forEach((item) => observer.observe(item));
}
`);

write("assets/css/styles.css", `:root {
  --color-navy: #10263a;
  --color-slate: #2e536d;
  --color-warm: #f7f6f2;
  --color-sand: #d7c8af;
  --color-copper: #c76b38;
  --color-cool: #6aa7c7;
  --color-ink: #142330;
  --color-muted: #566676;
  --color-line: #d9d3c7;
  --font-heading: Manrope, Sora, "Segoe UI", system-ui, sans-serif;
  --font-body: Inter, "Source Sans 3", "Segoe UI", system-ui, sans-serif;
  --space-1: 8px;
  --space-2: 16px;
  --space-3: 24px;
  --space-4: 32px;
  --space-5: 40px;
  --space-6: 48px;
  --space-8: 64px;
  --radius-sm: 6px;
  --radius-md: 12px;
  --radius-lg: 20px;
  --shadow-soft: 0 14px 40px rgba(16, 38, 58, 0.12);
  --transition: 180ms ease;
}

* { box-sizing: border-box; }
html { color-scheme: light; scroll-behavior: smooth; }
body {
  margin: 0;
  color: var(--color-ink);
  background: var(--color-warm);
  font-family: var(--font-body);
  font-size: 17px;
  line-height: 1.6;
}
body.menu-open, body.modal-open { overflow: hidden; }
img { display: block; max-width: 100%; height: auto; }
a { color: inherit; text-decoration-color: rgba(199, 107, 56, 0.55); text-underline-offset: 0.18em; }
a:hover { color: var(--color-copper); }
button, input, select, textarea { font: inherit; }
button { cursor: pointer; }
:focus-visible { outline: 3px solid var(--color-cool); outline-offset: 3px; }
.container { width: min(100% - 32px, 1240px); margin-inline: auto; }
.narrow { width: min(100% - 32px, 780px); }
.skip-link { position: fixed; left: 16px; top: 16px; z-index: 20; padding: 10px 14px; background: var(--color-copper); color: #fff; transform: translateY(-140%); }
.skip-link:focus { transform: translateY(0); }
h1, h2, h3 { font-family: var(--font-heading); line-height: 1.1; margin: 0 0 16px; color: var(--color-navy); letter-spacing: 0; }
h1 { font-size: 2.6rem; max-width: 780px; }
h2 { font-size: 2rem; }
h3 { font-size: 1.25rem; }
p { margin: 0 0 16px; }
.lead { font-size: 1.1rem; color: var(--color-muted); max-width: 640px; }
.eyebrow { margin: 0 0 12px; color: var(--color-copper); font-weight: 800; font-size: 0.82rem; letter-spacing: 0.08em; text-transform: uppercase; }
.fine-print { color: var(--color-muted); font-size: 0.92rem; }
.button-row { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }
.button {
  display: inline-flex;
  min-height: 46px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  padding: 12px 18px;
  font-weight: 800;
  text-decoration: none;
  transition: background var(--transition), color var(--transition), border var(--transition), transform var(--transition);
}
.button:hover { transform: translateY(-1px); }
.button--primary { background: var(--color-navy); color: #fff; }
.button--primary:hover { background: var(--color-copper); color: #fff; }
.button--secondary { border-color: var(--color-slate); color: var(--color-navy); background: rgba(255,255,255,0.25); }
.button--secondary-light { border-color: rgba(255,255,255,0.5); color: #fff; }
.button--accent { background: var(--color-copper); color: #fff; }
.button--wide { width: 100%; }
.site-header { position: sticky; top: 0; z-index: 10; background: var(--color-navy); color: #fff; box-shadow: 0 1px 0 rgba(255,255,255,0.08); }
.utility-bar { background: #0a1b2a; font-size: 0.88rem; }
.utility-inner { min-height: 36px; display: flex; gap: 22px; align-items: center; justify-content: flex-end; color: rgba(255,255,255,0.82); }
.utility-inner span:first-child { margin-right: auto; }
.main-header { background: var(--color-navy); }
.header-inner { min-height: 76px; display: flex; align-items: center; gap: 24px; }
.brand { display: inline-flex; align-items: center; gap: 12px; text-decoration: none; color: inherit; min-width: max-content; }
.brand-mark { width: 42px; height: 42px; border: 2px solid var(--color-sand); display: grid; place-items: center; transform: rotate(0deg); border-radius: 8px; position: relative; }
.brand-mark::before { content: ""; position: absolute; inset: 8px auto auto 8px; width: 16px; height: 16px; border-left: 3px solid var(--color-copper); border-top: 3px solid var(--color-copper); }
.brand-mark span { width: 15px; height: 15px; background: var(--color-sand); border-radius: 3px; }
.brand-text strong, .brand-text small { display: block; line-height: 1.05; }
.brand-text strong { font-family: var(--font-heading); font-size: 1.2rem; }
.brand-text small { font-size: 0.75rem; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(255,255,255,0.72); }
.desktop-nav { flex: 1; }
.desktop-nav ul { display: flex; gap: 18px; align-items: center; justify-content: center; margin: 0; padding: 0; list-style: none; }
.desktop-nav a { text-decoration: none; color: rgba(255,255,255,0.88); font-weight: 700; font-size: 0.95rem; }
.nav-dropdown { position: relative; }
.dropdown-panel { position: absolute; top: calc(100% + 18px); left: -18px; min-width: 230px; background: #fff; color: var(--color-ink); padding: 10px; border: 1px solid var(--color-line); border-radius: var(--radius-md); box-shadow: var(--shadow-soft); opacity: 0; visibility: hidden; transform: translateY(-6px); transition: var(--transition); }
.nav-dropdown:hover .dropdown-panel, .nav-dropdown:focus-within .dropdown-panel { opacity: 1; visibility: visible; transform: translateY(0); }
.dropdown-panel a { display: block; padding: 10px 12px; color: var(--color-ink); border-radius: var(--radius-sm); }
.dropdown-panel a:hover { background: var(--color-warm); }
.header-actions { display: flex; gap: 14px; align-items: center; }
.phone-link { font-weight: 800; text-decoration: none; }
.mobile-actions { display: none; margin-left: auto; gap: 8px; }
.icon-button, .menu-toggle, .menu-close { min-height: 44px; border: 1px solid rgba(255,255,255,0.4); color: #fff; background: transparent; border-radius: var(--radius-sm); padding: 9px 12px; text-decoration: none; font-weight: 800; }
.mobile-menu { position: fixed; inset: 0; background: rgba(8, 20, 31, 0.55); z-index: 30; }
.mobile-menu__panel { margin-left: auto; width: min(92vw, 420px); height: 100%; padding: 20px; background: var(--color-navy); color: #fff; overflow-y: auto; box-shadow: var(--shadow-soft); }
.mobile-menu__top { display: flex; justify-content: space-between; align-items: center; gap: 16px; margin-bottom: 26px; }
.mobile-menu nav { display: grid; gap: 8px; }
.mobile-menu nav a, .mobile-menu summary { display: block; padding: 13px 0; color: #fff; text-decoration: none; font-weight: 800; border-bottom: 1px solid rgba(255,255,255,0.14); }
.mobile-menu details a { padding-left: 18px; color: rgba(255,255,255,0.82); }
.emergency-note { padding: 16px; border-left: 4px solid var(--color-copper); background: rgba(255,255,255,0.08); border-radius: var(--radius-sm); }
.page-hero { padding: 80px 0; background: linear-gradient(180deg, rgba(215,200,175,0.48), rgba(247,246,242,0)); }
.hero-grid { display: grid; grid-template-columns: minmax(0, 0.9fr) minmax(340px, 1.1fr); gap: clamp(28px, 5vw, 64px); align-items: center; }
.hero-copy { position: relative; z-index: 1; }
.hero-copy .button-row { margin-top: 28px; }
.hero-image { position: relative; margin: 0; border-radius: var(--radius-lg); overflow: hidden; box-shadow: var(--shadow-soft); background: var(--color-sand); }
.hero-image img { aspect-ratio: 16 / 10; object-fit: cover; }
.hero-image figcaption { position: absolute; right: 18px; bottom: 18px; background: rgba(16,38,58,0.92); color: #fff; padding: 16px 18px; border-radius: var(--radius-md); font-weight: 800; box-shadow: var(--shadow-soft); }
.hero-image figcaption span { display: block; color: rgba(255,255,255,0.76); font-weight: 600; font-size: 0.9rem; }
.service-visual, .image-panel, .map-panel { min-height: 360px; border-radius: var(--radius-lg); background: var(--color-slate); box-shadow: var(--shadow-soft); position: relative; overflow: hidden; }
.service-visual::before, .image-panel::before { content: ""; position: absolute; inset: 42px; border: 1px solid rgba(255,255,255,0.22); border-radius: var(--radius-md); }
.service-visual span:nth-child(1) { position: absolute; left: 18%; top: 22%; width: 46%; height: 38%; border: 14px solid var(--color-sand); border-radius: 50%; }
.service-visual span:nth-child(2) { position: absolute; right: 16%; bottom: 22%; width: 130px; height: 130px; background: var(--color-copper); border-radius: var(--radius-md); }
.service-visual span:nth-child(3) { position: absolute; left: 14%; bottom: 18%; width: 55%; height: 12px; background: var(--color-cool); border-radius: 20px; }
.trust-strip { background: #fffaf0; border-block: 1px solid var(--color-line); }
.trust-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; }
.trust-grid div { min-height: 82px; display: flex; align-items: center; gap: 10px; font-weight: 800; color: var(--color-navy); }
.trust-grid span { width: 12px; height: 12px; border-radius: 3px; background: var(--color-copper); }
.section { padding: clamp(64px, 9vw, 112px) 0; }
.sandstone { background: rgba(215,200,175,0.38); }
.section-heading { max-width: 760px; margin-bottom: 34px; }
.card-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
.service-card, .content-card, .review-card, .team-card, .city-card, .info-card, .tool-card, .form-card, .plan-card, .price-card {
  background: rgba(255,255,255,0.68);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  padding: clamp(20px, 3vw, 30px);
  box-shadow: 0 1px 0 rgba(16,38,58,0.04);
}
.service-card { transition: transform var(--transition), box-shadow var(--transition); }
.service-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-soft); }
.card-icon { width: 46px; height: 46px; display: grid; place-items: center; background: var(--color-navy); color: #fff; border-radius: var(--radius-sm); font-weight: 900; margin-bottom: 18px; }
.text-link { font-weight: 900; color: var(--color-navy); }
.emergency-banner { background: var(--color-navy); color: #fff; }
.emergency-banner h2, .emergency-banner .eyebrow { color: #fff; }
.emergency-grid { display: flex; align-items: center; justify-content: space-between; gap: 28px; }
.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: clamp(28px, 5vw, 64px); align-items: start; }
.two-col--wide { grid-template-columns: minmax(280px, 0.82fr) minmax(0, 1.18fr); }
.content-stack > * + * { margin-top: 18px; }
.image-panel--tools { background: linear-gradient(135deg, var(--color-slate), var(--color-navy)); display: grid; place-items: end start; padding: 28px; color: #fff; font-weight: 900; }
.image-panel--tools::after { content: ""; position: absolute; right: 42px; top: 54px; width: 150px; height: 210px; border-radius: 80px 80px 12px 12px; background: rgba(215,200,175,0.42); box-shadow: -76px 72px 0 rgba(106,167,199,0.28), -150px 20px 0 rgba(199,107,56,0.55); }
.check-list { padding: 0; margin: 0; list-style: none; display: grid; gap: 10px; }
.check-list li { position: relative; padding-left: 28px; }
.check-list li::before { content: ""; position: absolute; left: 0; top: 0.58em; width: 12px; height: 12px; border-radius: 3px; background: var(--color-copper); }
.tool-card label, .field label { display: block; font-weight: 900; color: var(--color-navy); margin-bottom: 7px; }
input, select, textarea { width: 100%; min-height: 46px; border: 1px solid #b8afa3; border-radius: var(--radius-sm); background: #fff; color: var(--color-ink); padding: 10px 12px; }
textarea { resize: vertical; }
.result-panel { margin-top: 16px; padding: 16px; border: 1px solid var(--color-line); border-radius: var(--radius-sm); background: #fff; }
.result-panel[data-state="emergency"], .alert-block { border-left: 5px solid var(--color-copper); background: #fff4ec; padding: 16px; border-radius: var(--radius-sm); }
.result-panel[data-state="good"] { border-left: 5px solid #43815f; }
.result-panel[data-state="near"] { border-left: 5px solid var(--color-copper); }
.result-panel[data-state="outside"], .result-panel[data-state="error"] { border-left: 5px solid #8b4b39; }
.compact-tool { display: grid; gap: 12px; }
.review-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
.review-card p { font-size: 1.05rem; }
.review-card footer { display: grid; gap: 2px; margin-top: 20px; }
.review-card span { color: var(--color-muted); font-size: 0.92rem; }
.map-panel { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; align-content: center; padding: 26px; background: var(--color-navy); }
.map-panel span, .badge-grid span { display: grid; place-items: center; min-height: 58px; padding: 10px; border: 1px solid rgba(255,255,255,0.24); border-radius: var(--radius-sm); color: #fff; font-weight: 900; text-align: center; }
.inline-form { display: grid; grid-template-columns: 1fr auto; gap: 10px; align-items: end; }
.step-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
.step-card span { width: 34px; height: 34px; display: grid; place-items: center; background: var(--color-copper); color: #fff; border-radius: var(--radius-sm); font-weight: 900; margin-bottom: 10px; }
.disclaimer-block { padding: 16px; border: 1px solid var(--color-line); border-radius: var(--radius-sm); background: #fffaf0; color: var(--color-ink); }
.final-cta { background: var(--color-navy); color: #fff; }
.cta-band { display: flex; justify-content: space-between; align-items: center; gap: 28px; }
.cta-band h2, .cta-band .eyebrow { color: #fff; }
.faq-list { display: grid; gap: 10px; }
.faq-item { border: 1px solid var(--color-line); border-radius: var(--radius-sm); background: rgba(255,255,255,0.72); overflow: hidden; }
.faq-item h3 { margin: 0; }
.faq-item button { width: 100%; min-height: 54px; border: 0; background: transparent; color: var(--color-navy); text-align: left; padding: 16px 48px 16px 18px; font-weight: 900; position: relative; }
.faq-item button::after { content: "+"; position: absolute; right: 18px; top: 50%; transform: translateY(-50%); }
.faq-item button[aria-expanded="true"]::after { content: "-"; }
.faq-panel { padding: 0 18px 18px; }
.price-card { background: var(--color-navy); color: #fff; }
.price-card h2, .price-card .eyebrow { color: #fff; }
.team-grid { grid-template-columns: repeat(3, 1fr); }
.portrait { width: 72px; height: 72px; display: grid; place-items: center; background: var(--color-slate); color: #fff; border-radius: var(--radius-md); font-weight: 900; margin-bottom: 18px; }
.badge-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
.badge-grid span { color: var(--color-navy); border-color: var(--color-line); background: rgba(255,255,255,0.7); }
.filter-row { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 24px; }
.filter-row button { min-height: 44px; border: 1px solid var(--color-line); background: #fff; border-radius: var(--radius-sm); padding: 10px 14px; font-weight: 900; }
.filter-row button.active { background: var(--color-navy); color: #fff; }
.empty-state { padding: 24px; border: 1px dashed var(--color-line); border-radius: var(--radius-md); text-align: center; }
.city-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
.form-card { background: #fff; }
.form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 20px; }
.field.full, .checkbox.full { grid-column: 1 / -1; }
.field-error { display: block; min-height: 20px; color: #8b3626; font-size: 0.9rem; margin-top: 4px; }
[aria-invalid="true"] { border-color: #8b3626; }
.checkbox { display: flex; gap: 10px; align-items: flex-start; font-weight: 700; }
.checkbox input { width: 20px; min-height: 20px; margin-top: 4px; }
.form-success { margin-bottom: 18px; padding: 18px; background: #edf7f1; border-left: 5px solid #43815f; border-radius: var(--radius-sm); }
.modal { position: fixed; inset: 0; z-index: 40; display: grid; place-items: center; padding: 20px; background: rgba(8,20,31,0.62); }
.modal-card { width: min(100%, 560px); background: var(--color-warm); border-radius: var(--radius-md); padding: 28px; box-shadow: var(--shadow-soft); }
.modal-close { float: right; min-height: 44px; border: 1px solid var(--color-line); border-radius: var(--radius-sm); background: #fff; font-weight: 900; }
.site-footer { background: #0a1b2a; color: rgba(255,255,255,0.82); padding: 64px 0 92px; }
.footer-grid { display: grid; grid-template-columns: 1.45fr repeat(4, 1fr); gap: 30px; }
.site-footer h2 { color: #fff; font-size: 1rem; }
.site-footer a { display: block; color: rgba(255,255,255,0.82); text-decoration: none; margin-bottom: 8px; }
.footer-brand .brand { margin-bottom: 18px; }
.fictional { border-left: 4px solid var(--color-copper); padding-left: 14px; }
.footer-bottom { display: flex; justify-content: space-between; gap: 20px; padding-top: 28px; margin-top: 34px; border-top: 1px solid rgba(255,255,255,0.15); font-size: 0.92rem; }
.footer-bottom span:last-child { display: flex; gap: 16px; flex-wrap: wrap; }
.mobile-sticky-bar { display: none; position: fixed; left: 0; right: 0; bottom: 0; z-index: 9; grid-template-columns: 1fr 1fr; background: var(--color-navy); box-shadow: 0 -8px 28px rgba(16,38,58,0.18); }
.mobile-sticky-bar a { min-height: 54px; display: grid; place-items: center; color: #fff; text-decoration: none; font-weight: 900; }
.mobile-sticky-bar a + a { background: var(--color-copper); }
.noscript { position: fixed; left: 16px; right: 16px; bottom: 70px; z-index: 50; padding: 12px; background: #fff; border: 1px solid var(--color-line); border-radius: var(--radius-sm); box-shadow: var(--shadow-soft); }
.reveal { opacity: 0; transform: translateY(14px); transition: opacity 500ms ease, transform 500ms ease; }
.reveal.is-visible { opacity: 1; transform: translateY(0); }
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { scroll-behavior: auto !important; transition-duration: 0.01ms !important; animation-duration: 0.01ms !important; }
}
@media (max-width: 1080px) {
  .desktop-nav, .header-actions, .utility-bar { display: none; }
  .mobile-actions { display: flex; }
  .header-inner { min-height: 68px; }
  .hero-grid, .two-col, .two-col--wide { grid-template-columns: 1fr; }
  .hero-image { order: -1; }
  .footer-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (min-width: 760px) {
  h1 { font-size: 3.6rem; }
  h2 { font-size: 2.5rem; }
  h3 { font-size: 1.4rem; }
  .lead { font-size: 1.18rem; }
}
@media (min-width: 1080px) {
  h1 { font-size: 4.35rem; }
  h2 { font-size: 3rem; }
  h3 { font-size: 1.55rem; }
  .lead { font-size: 1.25rem; }
}
@media (max-width: 760px) {
  body { font-size: 16px; padding-bottom: 54px; }
  .container { width: min(100% - 24px, 1240px); }
  .page-hero { padding: 48px 0 64px; }
  .hero-image figcaption { position: static; border-radius: 0; }
  .trust-grid, .card-grid, .review-grid, .team-grid, .city-grid, .footer-grid { grid-template-columns: 1fr; }
  .trust-grid div { min-height: 56px; }
  .emergency-grid, .cta-band, .footer-bottom { display: grid; }
  .form-grid, .step-grid, .badge-grid, .map-panel { grid-template-columns: 1fr; }
  .inline-form { grid-template-columns: 1fr; }
  .mobile-sticky-bar { display: grid; }
  .brand-text strong { font-size: 1rem; }
  .brand-mark { width: 38px; height: 38px; }
}
`);
