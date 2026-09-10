/**
 * A tint per category, for the icon tile on an issue card.
 *
 * These are a second colour system running alongside the six status colours,
 * which sounds like a recipe for confusion and is not, because **shape** keeps
 * them apart: a status is always a pill with a dot and a text label, a category
 * is always a rounded square with an emoji in it. Nothing is ever a coloured
 * square in one place and a coloured pill in another.
 *
 * That separation is what lets categories reuse hue freely. They are a
 * taxonomy, not a state — knowing at a glance that a list is mostly roads and
 * waste is useful, and it does not compete with knowing what happened to any
 * one of them.
 *
 * Keyed by `Category.slug`, with a neutral fallback so a category added in the
 * database later shows up looking deliberate rather than broken.
 */
export const CATEGORY_TINT: Record<string, string> = {
  roads: "bg-slate-100 text-slate-700 dark:bg-slate-900/60 dark:text-slate-300",
  streetlight: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
  waste: "bg-lime-100 text-lime-800 dark:bg-lime-950/60 dark:text-lime-300",
  pavement: "bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300",
  drainage: "bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300",
  graffiti: "bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-950/60 dark:text-fuchsia-300",
  parks: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300",
  other: "bg-surface-sunken text-ink-soft",
};

export function categoryTint(slug: string): string {
  return CATEGORY_TINT[slug] ?? CATEGORY_TINT.other;
}
