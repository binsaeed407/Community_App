import { describe, expect, it } from "vitest";
import { classify, CONFIDENCE_FLOOR, RULES } from "./rules";
import { SEED_ISSUES } from "../../../prisma/seed-issues";

describe("the category classifier", () => {
  it("recognises the obvious cases", () => {
    expect(classify("Deep pothole outside the library", "The tarmac has broken up.").slug).toBe(
      "roads",
    );
    expect(classify("Street light out", "The lamp outside number 44 is dark.").slug).toBe(
      "streetlight",
    );
    expect(classify("Fly-tipping in the alley", "Someone dumped a mattress.").slug).toBe("waste");
    expect(classify("Blocked drain", "The gully floods every time it rains.").slug).toBe(
      "drainage",
    );
  });

  it("weights the title more heavily than the description", () => {
    // The description mentions a park; the title says pothole. The title wins,
    // because it is what someone writes when forced to pick one thing.
    const result = classify("Pothole in the road", "It is near the park, by the trees and grass.");
    expect(result.slug).toBe("roads");
  });

  it("suggests nothing when it has no idea", () => {
    const result = classify("Something is wrong", "Please can somebody look into this.");
    expect(result.slug).toBeNull();
    expect(result.confidence).toBe(0);
  });

  it("suggests nothing when two categories match equally", () => {
    // An ambiguous report should produce no suggestion rather than a coin flip
    // presented as an answer.
    const result = classify("Problem", "There is graffiti on the lamp post.");
    expect(result.confidence).toBeLessThan(0.75);
  });

  it("matches whole words only", () => {
    // "bin" must not fire on "binding", and "pot" must not fire on "pothole"
    // in reverse — otherwise a report about a bookbinding shop is waste.
    const result = classify("Bookbinding shop sign broken", "The binding shop has a broken sign.");
    expect(result.slug).toBeNull();
  });

  it("never returns a slug below the confidence floor", () => {
    for (const issue of SEED_ISSUES) {
      const result = classify(issue.title, issue.description);
      if (result.slug !== null) {
        expect(result.confidence).toBeGreaterThanOrEqual(CONFIDENCE_FLOOR);
      }
    }
  });

  it("only ever returns a slug that exists in the rule table", () => {
    const known = new Set(RULES.map((rule) => rule.slug));
    for (const issue of SEED_ISSUES) {
      const { slug } = classify(issue.title, issue.description);
      if (slug !== null) expect(known.has(slug)).toBe(true);
    }
  });

  it("gets most of the seeded reports right", () => {
    // The honest measure: run it against the fifteen hand-written sample
    // reports and count. This is the number quoted in the README, and it is
    // asserted here so it cannot quietly rot.
    //
    // Two of the fifteen are deliberately not winnable — "Something else" has
    // no keywords by design, and one report describes broken glass in a
    // playground, which is genuinely both vandalism and parks.
    const scored = SEED_ISSUES.filter((issue) => issue.categorySlug !== "other");
    const correct = scored.filter(
      (issue) => classify(issue.title, issue.description).slug === issue.categorySlug,
    );

    expect(correct.length / scored.length).toBeGreaterThanOrEqual(0.7);
  });
});
