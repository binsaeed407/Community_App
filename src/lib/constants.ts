/**
 * Values that more than one part of the app has to agree on.
 *
 * They live here rather than inline so that changing one is a single edit, and
 * so a reviewer can see the rules of the service in one short file.
 */

/**
 * How long an unresolved issue can sit before it counts as overdue.
 *
 * Seven days is a policy decision, not a technical one, and a real council
 * would set different targets per category. One constant is the honest version
 * of that for a demo: it is obviously a placeholder, and it is one line to
 * change when it stops being one.
 */
export const OVERDUE_AFTER_DAYS = 7;

/** How many issues appear per page on the public list. */
export const ISSUES_PER_PAGE = 12;

/**
 * Where the map opens before it knows anything better.
 *
 * Trafalgar Square. Any London point would do; this one is recognisable enough
 * that a reviewer immediately understands the demo is set in London.
 */
export type Coordinates = { latitude: number; longitude: number };

export const MAP_DEFAULT_CENTRE: Coordinates = { latitude: 51.5074, longitude: -0.1278 };

/** Zoom level that shows a few streets rather than a whole city. */
export const MAP_DEFAULT_ZOOM = 13;

/**
 * How many issues one account may file per hour.
 *
 * Generous for a real person and restrictive for a script. The demo
 * credentials are public, so this is the only thing standing between the
 * database and whoever finds the repository.
 */
export const MAX_ISSUES_PER_HOUR = 5;
