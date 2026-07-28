import { auditSeo } from '../audits/seo.js';
import { auditAccessibility } from '../audits/accessibility.js';
import { auditLinks } from '../audits/links.js';
import { auditAssets } from '../audits/assets.js';
import { auditSecurity } from '../audits/security.js';
import { auditFiles } from '../audits/files.js';
import { auditPlaceholders } from '../audits/placeholders.js';
import { computeScore } from './scoring.js';

export function runAudits(vfs, ctx) {
  const issues = [
    ...auditSeo(vfs, ctx),
    ...auditAccessibility(vfs, ctx),
    ...auditLinks(vfs, ctx),
    ...auditAssets(vfs, ctx),
    ...auditSecurity(vfs, ctx),
    ...auditFiles(vfs, ctx),
    ...auditPlaceholders(vfs, ctx),
  ];
  const score = computeScore(issues);
  return { issues, score };
}
