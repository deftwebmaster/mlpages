export const SECTION_DEFINITIONS = [
  { id: "contact", label: "Name and Contact Information", required: true, headings: ["contact", "contact information", "personal information"] },
  { id: "summary", label: "Professional Summary", required: false, headings: ["professional summary", "summary", "profile", "career profile", "executive summary"] },
  { id: "objective", label: "Objective", required: false, headings: ["objective", "career objective"] },
  { id: "skills", label: "Skills", required: true, headings: ["skills", "technical skills", "core competencies", "areas of expertise", "tools", "technologies", "competencies"] },
  { id: "experience", label: "Professional Experience", required: true, headings: ["professional experience", "work experience", "experience", "employment history", "career history", "relevant experience"] },
  { id: "projects", label: "Projects", required: false, headings: ["projects", "selected projects", "project experience", "portfolio projects"] },
  { id: "education", label: "Education", required: true, headings: ["education", "academic background", "education and training", "qualifications"] },
  { id: "certifications", label: "Certifications", required: false, headings: ["certifications", "certificates", "licenses", "licensure", "credentials"] },
  { id: "awards", label: "Awards", required: false, headings: ["awards", "honors", "achievements"] },
  { id: "publications", label: "Publications", required: false, headings: ["publications", "speaking", "presentations"] },
  { id: "volunteer", label: "Volunteer Experience", required: false, headings: ["volunteer experience", "volunteering", "community involvement"] },
  { id: "associations", label: "Professional Associations", required: false, headings: ["professional associations", "memberships", "affiliations"] }
];

export const NONSTANDARD_HEADING_HINTS = ["career story", "what i do", "things i know", "toolbox", "wins", "selected work"];

export const EQUIVALENCE_TERMS = {
  javascript: ["js"],
  typescript: ["ts"],
  "search engine optimization": ["seo"],
  "customer relationship management": ["crm"],
  "amazon web services": ["aws"],
  "google cloud platform": ["gcp"],
  "user experience": ["ux"],
  "user interface": ["ui"],
  "microsoft excel": ["excel"],
  "structured query language": ["sql"],
  "key performance indicator": ["kpi", "kpis"],
  "continuous improvement": ["process improvement"],
  "supply chain": ["logistics"],
  "project management": ["program management"],
  "quality assurance": ["qa"],
  "machine learning": ["ml"],
  "artificial intelligence": ["ai"]
};

export const SKILL_TERMS = [
  "accessibility", "account management", "agile", "airtable", "analytics", "api", "aws", "azure", "budgeting", "c#", "canva",
  "change management", "cloud", "compliance", "content strategy", "crm", "css", "customer success", "data analysis",
  "data visualization", "excel", "figma", "forecasting", "github", "google analytics", "google cloud platform", "html",
  "inventory reconciliation", "javascript", "jira", "kubernetes", "leadership", "looker", "machine learning", "microsoft office",
  "monday.com", "node.js", "operations", "power bi", "process improvement", "product management", "project management",
  "python", "quality assurance", "react", "reporting", "risk management", "salesforce", "scrum", "seo", "sql", "tableau",
  "typescript", "user experience", "vendor management", "warehouse management", "workday", "zendesk"
];

export const GENERIC_PHRASES = [
  "hardworking", "motivated", "team player", "detail oriented", "results driven", "self starter", "fast paced",
  "excellent communication", "go getter", "dynamic professional"
];

export const ACTION_VERBS = [
  "achieved", "analyzed", "built", "coached", "created", "delivered", "designed", "developed", "directed", "drove",
  "improved", "increased", "launched", "led", "managed", "optimized", "reduced", "resolved", "shipped", "streamlined"
];

export const STOP_WORDS = new Set([
  "a", "about", "an", "and", "are", "as", "at", "be", "benefits", "by", "can", "company", "equal", "for", "from",
  "have", "in", "including", "is", "it", "job", "join", "may", "of", "on", "or", "our", "role", "team", "that",
  "the", "this", "to", "we", "with", "you", "your"
]);

export const SAMPLE_RESUME = `Jordan Rivers
Austin, TX | jordan.rivers@example.com | 512-555-0198 | linkedin.com/in/jordanrivers

Career Story
Operations analyst with experience in inventory, reporting, and process work. Responsible for dashboards, warehouse data, and helping teams solve problems.

Things I Know
Excel, SQL, Tableau, inventory reconciliation, warehouse management, project coordination, communication, team player

Professional Experience
Operations Analyst | Northstar Supply Co. | 2021 - Present
- Responsible for weekly inventory reports and exception tracking across three facilities.
- Helped with cycle count review and resolved stock-count discrepancies.
- Created Tableau dashboard for operations leaders.
- Coordinated with warehouse supervisors to improve receiving process.

Inventory Coordinator | Parkline Goods | 2018 - 2021
- Managed item setup and vendor updates.
- Responsible for daily reconciliation tasks.
- Helped train new associates.

Selected Work
Built a spreadsheet tracker for inbound shipment delays.
Supported barcode cleanup project using Excel and SQL.

Education
B.S. Business Administration, Texas State University
`;

export const SAMPLE_JOB = `Senior Operations Data Analyst

We are looking for a Senior Operations Data Analyst to improve warehouse reporting, inventory reconciliation, and process performance across a growing supply chain network.

Required qualifications:
- 4+ years of operations analytics or supply chain analytics experience
- Advanced SQL and Microsoft Excel skills
- Experience building dashboards in Tableau or Power BI
- Strong inventory reconciliation and root-cause analysis experience
- Ability to communicate findings to operations leaders

Preferred qualifications:
- Python experience
- Warehouse management system experience
- Lean or continuous improvement background
- Experience measuring cycle-count accuracy, throughput, and labor productivity

Responsibilities include developing KPI dashboards, identifying process improvement opportunities, partnering with warehouse teams, and presenting recommendations to senior leaders.`;
