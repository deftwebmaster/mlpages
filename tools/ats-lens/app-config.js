export const APP_CONFIG = {
  name: "ATS Lens",
  tagline: "See what resume software can actually read.",
  version: "1.0.0",
  authorLabel: "Matt Livingston",
  portfolioUrl: "https://mattlivingston.com",
  maxFileSizeBytes: 10 * 1024 * 1024,
  acceptedExtensions: ["pdf", "docx", "txt"],
  acceptedMimeTypes: [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    ""
  ],
  scoreWeights: {
    parsing: 30,
    structure: 20,
    job: 25,
    impact: 15,
    hygiene: 10
  },
  disclaimer:
    "ATS platforms vary. ATS Lens evaluates common parsing compatibility, resume-structure, and job-description alignment principles. It does not reproduce a proprietary ATS ranking system."
};
