import { z } from "zod";

/**
 * What a valid report looks like. Imported by the form and by the server
 * action, so there is exactly one definition rather than two that drift.
 */

export const TITLE_MIN = 10;
export const TITLE_MAX = 120;
export const DESCRIPTION_MIN = 20;
export const DESCRIPTION_MAX = 2000;

/**
 * Roughly the bounding box of Greater London.
 *
 * This is a demo for one city, and rejecting a report from the middle of the
 * Atlantic is better than silently storing a pin nobody will ever visit. A real
 * deployment would check against the authority's actual boundary; the point of
 * having the check at all is that coordinates arrive from a client and a client
 * can send anything.
 */
export const BOUNDS = {
  minLatitude: 51.28,
  maxLatitude: 51.7,
  minLongitude: -0.52,
  maxLongitude: 0.34,
} as const;

/**
 * A photo URL.
 *
 * `z.url()` alone is not enough: it accepts `javascript:alert(1)`, which is a
 * perfectly valid URL and an absolutely unacceptable thing to store and later
 * render into an attribute. A test caught this.
 *
 * The only URLs this app should ever store are the ones Cloudinary just handed
 * back, so the check is narrowed to exactly that: https, on Cloudinary's
 * delivery host. Anything else is either a mistake or an attempt.
 */
const CLOUDINARY_DELIVERY_HOST = "res.cloudinary.com";

const photoUrl = z.string().refine(
  (value) => {
    try {
      const url = new URL(value);
      return url.protocol === "https:" && url.hostname === CLOUDINARY_DELIVERY_HOST;
    } catch {
      return false;
    }
  },
  { message: "That photo could not be verified." },
);

export const issueSchema = z.object({
  title: z
    .string()
    .trim()
    .min(TITLE_MIN, `Give the problem a title of at least ${TITLE_MIN} characters`)
    .max(TITLE_MAX, `Keep the title under ${TITLE_MAX} characters`),

  description: z
    .string()
    .trim()
    .min(
      DESCRIPTION_MIN,
      `Describe the problem in at least ${DESCRIPTION_MIN} characters so it can be acted on`,
    )
    .max(DESCRIPTION_MAX, `Keep the description under ${DESCRIPTION_MAX} characters`),

  categoryId: z.string().min(1, "Choose a category"),

  addressLabel: z
    .string()
    .trim()
    .min(3, "Say roughly where it is")
    .max(120, "Keep the location under 120 characters"),

  latitude: z.coerce
    .number()
    .min(BOUNDS.minLatitude, "That location is outside the area this service covers")
    .max(BOUNDS.maxLatitude, "That location is outside the area this service covers"),

  longitude: z.coerce
    .number()
    .min(BOUNDS.minLongitude, "That location is outside the area this service covers")
    .max(BOUNDS.maxLongitude, "That location is outside the area this service covers"),

  /**
   * Cloudinary results, posted back by the upload widget as JSON.
   *
   * Optional: a report without a photo is still worth having, and requiring one
   * would exclude anyone reporting from a desktop or after the fact.
   */
  photos: z
    .array(
      z.object({
        url: photoUrl,
        publicId: z.string().min(1),
      }),
    )
    .max(3, "Three photos is the maximum")
    .default([]),
});

export type IssueInput = z.infer<typeof issueSchema>;
