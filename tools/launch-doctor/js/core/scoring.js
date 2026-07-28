// 100-point launch-readiness score. Each category starts at 100 and takes a deduction per
// issue depending on severity; the category's weighted share of its own score contributes to
// the total. `info` issues are surfaced but never deduct points.

export const CATEGORY_WEIGHTS = {
  SEO: 25,
  Accessibility: 20,
  Links: 20,
  Security: 15,
  Assets: 10,
  Files: 5,
  Placeholders: 5,
};

const DEDUCTIONS = { fail: 20, warn: 8, info: 0 };

export function computeScore(issues) {
  const perCategory = {};
  for (const category of Object.keys(CATEGORY_WEIGHTS)) {
    perCategory[category] = { raw: 100, weight: CATEGORY_WEIGHTS[category], fail: 0, warn: 0, info: 0 };
  }

  for (const issue of issues) {
    const bucket = perCategory[issue.category];
    if (!bucket) continue;
    bucket[issue.severity] += 1;
    bucket.raw -= DEDUCTIONS[issue.severity] || 0;
  }

  let total = 0;
  const categories = {};
  for (const [category, bucket] of Object.entries(perCategory)) {
    const raw = Math.max(0, bucket.raw);
    const contribution = (raw / 100) * bucket.weight;
    total += contribution;
    categories[category] = {
      score: Math.round(contribution * 10) / 10,
      weight: bucket.weight,
      fail: bucket.fail,
      warn: bucket.warn,
      info: bucket.info,
    };
  }

  const counts = { fail: 0, warn: 0, info: 0 };
  for (const issue of issues) counts[issue.severity] = (counts[issue.severity] || 0) + 1;

  return {
    total: Math.round(total),
    categories,
    counts,
  };
}
