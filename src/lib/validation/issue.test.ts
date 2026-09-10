import { describe, expect, it } from "vitest";
import { issueSchema, BOUNDS, TITLE_MIN, DESCRIPTION_MIN } from "./issue";

const valid = {
  title: "Deep pothole outside the library",
  description:
    "About half a metre across, on the northbound side where cyclists pull in. It has been getting worse.",
  categoryId: "cat_123",
  addressLabel: "Camberwell Road, near the library",
  latitude: 51.474,
  longitude: -0.093,
  photos: [],
};

describe("issueSchema", () => {
  it("accepts a well-formed report", () => {
    expect(issueSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects a title that is too short to act on", () => {
    const result = issueSchema.safeParse({ ...valid, title: "a".repeat(TITLE_MIN - 1) });
    expect(result.success).toBe(false);
  });

  it("rejects a description that is too short to act on", () => {
    const result = issueSchema.safeParse({
      ...valid,
      description: "a".repeat(DESCRIPTION_MIN - 1),
    });
    expect(result.success).toBe(false);
  });

  it("rejects coordinates outside the service area", () => {
    // 0,0 is in the Atlantic, and it is what a form submits when a hidden
    // coordinate field was never populated. Storing it would put a pin in the
    // ocean on the public map.
    expect(issueSchema.safeParse({ ...valid, latitude: 0, longitude: 0 }).success).toBe(false);

    // Manchester: a real place, plausible input, and still not this service.
    expect(issueSchema.safeParse({ ...valid, latitude: 53.48, longitude: -2.24 }).success).toBe(
      false,
    );
  });

  it("accepts coordinates at the edge of the service area", () => {
    // Inclusive bounds: someone reporting a problem on the boundary is inside
    // it, not outside.
    const edge = issueSchema.safeParse({
      ...valid,
      latitude: BOUNDS.maxLatitude,
      longitude: BOUNDS.maxLongitude,
    });
    expect(edge.success).toBe(true);
  });

  it("coerces coordinates arriving as strings from a form post", () => {
    // FormData values are always strings. Without coercion every real
    // submission would fail validation while the tests passed.
    const parsed = issueSchema.parse({ ...valid, latitude: "51.474", longitude: "-0.093" });
    expect(parsed.latitude).toBeCloseTo(51.474);
  });

  it("trims a title padded with whitespace rather than counting the padding", () => {
    const parsed = issueSchema.parse({ ...valid, title: `   ${valid.title}   ` });
    expect(parsed.title).toBe(valid.title);
  });

  it("rejects more photos than the limit", () => {
    const photo = { url: "https://res.cloudinary.com/demo/image/upload/a.jpg", publicId: "a" };
    const result = issueSchema.safeParse({ ...valid, photos: [photo, photo, photo, photo] });
    expect(result.success).toBe(false);
  });

  it("rejects photo urls that are not https Cloudinary deliveries", () => {
    const reject = (url: string) =>
      expect(issueSchema.safeParse({ ...valid, photos: [{ url, publicId: "a" }] }).success).toBe(
        false,
      );

    // A valid URL, and an unacceptable thing to store and later render into
    // an attribute. z.url() on its own accepts this.
    reject("javascript:alert(1)");
    // Someone else's host, pointed at from our database.
    reject("https://example.com/a.jpg");
    // Right host, downgraded scheme.
    reject("http://res.cloudinary.com/demo/image/upload/a.jpg");
    reject("not-a-url-at-all");

    expect(
      issueSchema.safeParse({
        ...valid,
        photos: [{ url: "https://res.cloudinary.com/demo/image/upload/v1/a.jpg", publicId: "a" }],
      }).success,
    ).toBe(true);
  });
});
