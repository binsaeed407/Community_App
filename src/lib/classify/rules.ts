/**
 * A category classifier, written by hand.
 *
 * There is no language model here and no API key. The task is "guess which of
 * eight buckets a short piece of English belongs in", the vocabulary is small
 * and domain-specific, and weighted keyword matching does it well enough to be
 * useful. It costs nothing, needs no network, runs in under a millisecond, and
 * every decision it makes can be explained by pointing at a line in this file.
 *
 * That last property is the real argument for it. A wrong suggestion here can
 * be traced to a specific word and fixed; a wrong suggestion from a model can
 * only be prompted at and hoped about.
 *
 * The scoring, in full:
 *   - each matched term adds its weight
 *   - a match in the title counts double, because the title is what someone
 *     writes when forced to say the single most important thing
 *   - the winning score is divided by the total scored, giving a confidence
 *     between 0 and 1 that reflects how *unambiguous* the match was rather than
 *     how many words happened to hit
 */

export type Rule = {
  /** Matches the Category.slug in the database. */
  slug: string;
  /** term -> weight. Weight is how strongly the term implies the category. */
  terms: Record<string, number>;
};

/**
 * Terms are matched on word boundaries, so "pot" does not match "pothole" and
 * "bin" does not match "binding".
 *
 * Weights are deliberately coarse: 3 for a term that essentially names the
 * category, 2 for a strong signal, 1 for a hint that only matters in the
 * absence of anything better.
 */
export const RULES: Rule[] = [
  {
    slug: "roads",
    terms: {
      pothole: 3, potholes: 3, tarmac: 3, resurfacing: 3, carriageway: 3,
      road: 2, highway: 2, asphalt: 2, crater: 2, "road surface": 3,
      crumbling: 1, subsidence: 2, cracked: 1, junction: 1, kerb: 1,
    },
  },
  {
    slug: "streetlight",
    terms: {
      streetlight: 3, streetlights: 3, "street light": 3, "street lamp": 3,
      lamppost: 3, "lamp post": 3, lamp: 2, lighting: 2, bulb: 2,
      flickering: 2, unlit: 3, dark: 1, "not working": 1, column: 1,
    },
  },
  {
    slug: "waste",
    terms: {
      "fly-tipping": 3, "fly tipping": 3, flytipping: 3, rubbish: 3, litter: 3,
      bin: 2, bins: 2, waste: 2, dumped: 3, mattress: 2, "bin bags": 3,
      refuse: 2, collection: 1, overflowing: 2, "black bags": 2, sofa: 2,
    },
  },
  {
    slug: "pavement",
    terms: {
      pavement: 3, footpath: 3, footway: 3, "paving slab": 3, slab: 2, slabs: 2,
      "trip hazard": 3, kerb: 2, "dropped kerb": 2, wheelchair: 1, pushchair: 1,
      uneven: 2, tripped: 2,
    },
  },
  {
    slug: "drainage",
    terms: {
      drain: 3, drains: 3, gully: 3, "storm drain": 3, sewer: 3, flooding: 3,
      flooded: 3, "standing water": 3, puddle: 2, blocked: 2, water: 1,
      overflowing: 1, manhole: 2,
    },
  },
  {
    slug: "graffiti",
    terms: {
      graffiti: 3, tagging: 3, tagged: 2, spray: 2, "spray paint": 3,
      vandalism: 3, vandalised: 3, defaced: 2, smashed: 1, "broken glass": 1,
      shutters: 1,
    },
  },
  {
    slug: "parks",
    terms: {
      park: 3, playground: 3, "green space": 3, common: 2, tree: 3, trees: 3,
      branch: 3, hedge: 2, grass: 2, bench: 2, "play area": 3, swing: 2,
      overgrown: 2, bark: 1,
    },
  },
];

/** Below this, nothing is suggested. A bad guess is worse than no guess. */
export const CONFIDENCE_FLOOR = 0.35;

/** Version marker, stored on every AIAnalysis row so accuracy stays comparable. */
export const CLASSIFIER_SOURCE = "rules@1";

export type Scored = { slug: string; score: number };

export type ClassifyResult = {
  slug: string | null;
  confidence: number;
  scores: Scored[];
};

/**
 * Counts whole-word occurrences of `term` in `text`.
 *
 * Escapes the term before building the pattern. The terms are ours today, but
 * a rule table is exactly the sort of thing that later gets loaded from a
 * database, and a "(" in a term would otherwise throw at runtime.
 */
function countMatches(text: string, term: string): number {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`\\b${escaped}\\b`, "g");
  return (text.match(pattern) ?? []).length;
}

export function classify(title: string, description: string): ClassifyResult {
  const lowerTitle = title.toLowerCase();
  const lowerDescription = description.toLowerCase();

  const scores: Scored[] = RULES.map((rule) => {
    let score = 0;

    for (const [term, weight] of Object.entries(rule.terms)) {
      // The title counts double: it is what someone writes when forced to say
      // the single most important thing about the problem.
      score += countMatches(lowerTitle, term) * weight * 2;
      score += countMatches(lowerDescription, term) * weight;
    }

    return { slug: rule.slug, score };
  }).sort((a, b) => b.score - a.score);

  const total = scores.reduce((sum, s) => sum + s.score, 0);
  const best = scores[0];

  if (!best || best.score === 0 || total === 0) {
    return { slug: null, confidence: 0, scores };
  }

  // Confidence is the winner's share of all the evidence, so a description that
  // matches two categories equally scores 0.5 and is rightly not trusted, while
  // one that only matches roads scores 1.
  const confidence = best.score / total;

  return {
    slug: confidence >= CONFIDENCE_FLOOR ? best.slug : null,
    confidence,
    scores,
  };
}
