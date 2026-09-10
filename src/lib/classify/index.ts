import { classify, CLASSIFIER_SOURCE, type ClassifyResult } from "./rules";

/**
 * The seam.
 *
 * Everything in the app talks to `suggestCategory`, and nothing talks to the
 * rule table directly. Swapping the hand-written classifier for a model-backed
 * one is then a change to this one file: the form, the server action and the
 * AIAnalysis row all keep working unchanged.
 *
 * The interface is deliberately async even though the current implementation is
 * not. If it were synchronous, every call site would have to change the day it
 * became a network request — and a seam that has to be widened later is not
 * much of a seam.
 */

export type Suggestion = {
  /** Category slug, or null when nothing was confident enough. */
  slug: string | null;
  /** 0 to 1. */
  confidence: number;
  /** Which implementation produced this, e.g. "rules@1". */
  source: string;
  /** The scores behind the decision, stored for debugging a bad suggestion. */
  detail: ClassifyResult["scores"];
};

export async function suggestCategory(
  title: string,
  description: string,
): Promise<Suggestion> {
  const result = classify(title, description);

  return {
    slug: result.slug,
    confidence: result.confidence,
    source: CLASSIFIER_SOURCE,
    detail: result.scores,
  };
}

/**
 * The same thing, but guaranteed not to throw.
 *
 * Category suggestion is a convenience. If it fails for any reason the report
 * must still be submittable — losing someone's written-out report because an
 * optional nicety broke would be an absurd trade.
 */
export async function suggestCategorySafely(
  title: string,
  description: string,
): Promise<Suggestion | null> {
  try {
    return await suggestCategory(title, description);
  } catch (error) {
    console.error("Category suggestion failed", error);
    return null;
  }
}
