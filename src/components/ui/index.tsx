import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

/**
 * The handful of primitives every page is built from.
 *
 * Hand-written rather than pulled from a component library. There are six of
 * them, none is more than a few lines, and the project's rule is that a
 * dependency has to beat writing the code ourselves — which a `<Button>` does
 * not. It also means every class in the app is one I can account for.
 */

/** Joins class names, dropping anything falsy. */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/* ---------------------------------------------------------------- layout -- */

/**
 * The page body for an app screen.
 *
 * Fills the width it is given rather than pinning everything to a narrow
 * centred column. The old Container capped every page at 1024px, which on a
 * 1920px monitor left roughly 450px of dead margin on each side and made the
 * whole app look like it was floating in the middle of the screen.
 *
 * "wide" is the default and takes the full available width up to a generous
 * ceiling; "prose" stays narrow because a wall of text 1600px across is
 * genuinely harder to read — line length is a legibility constraint, not a
 * stylistic one.
 */
export function Shell({
  children,
  size = "wide",
  className,
}: {
  children: ReactNode;
  size?: "wide" | "prose" | "narrow";
  className?: string;
}) {
  const width =
    size === "narrow" ? "max-w-2xl" : size === "prose" ? "max-w-3xl" : "max-w-7xl";

  return (
    <main className={cx("w-full flex-1 px-5 py-8 sm:px-8", className)}>
      <div className={cx("mx-auto w-full", width)}>{children}</div>
    </main>
  );
}

/** A centred column, for the marketing pages that still want one. */
export function Container({
  children,
  size = "wide",
  className,
}: {
  children: ReactNode;
  size?: "wide" | "narrow" | "prose";
  className?: string;
}) {
  const width =
    size === "narrow" ? "max-w-2xl" : size === "prose" ? "max-w-3xl" : "max-w-7xl";

  return (
    <div className={cx("mx-auto w-full px-5 sm:px-8", width, className)}>{children}</div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4 border-b border-line pb-6">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-faint">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-1.5 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm text-ink-soft">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

/* ---------------------------------------------------------------- surface -- */

export function Card({
  children,
  className,
  tone = "default",
}: {
  children: ReactNode;
  className?: string;
  tone?: "default" | "sunken" | "alert";
}) {
  const tones = {
    default: "border-line bg-surface shadow-card",
    sunken: "border-line bg-surface-sunken",
    alert: "border-red-300 bg-red-50 dark:border-red-900/60 dark:bg-red-950/40",
  };

  return (
    <div className={cx("rounded-card border", tones[tone], className)}>{children}</div>
  );
}

/* ---------------------------------------------------------------- buttons -- */

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-control text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-55";

const buttonSizes = {
  sm: "h-8 px-3",
  md: "h-10 px-4",
};

const buttonVariants = {
  primary: "bg-brand text-on-brand hover:bg-brand-hover",
  secondary: "border border-line-strong bg-surface text-ink hover:bg-surface-sunken",
  ghost: "text-ink-soft hover:bg-surface-sunken hover:text-ink",
  danger:
    "border border-red-300 bg-red-50 text-red-900 hover:bg-red-100 dark:border-red-900 dark:bg-red-950 dark:text-red-100",
};

type ButtonLook = {
  variant?: keyof typeof buttonVariants;
  size?: keyof typeof buttonSizes;
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<"button"> & ButtonLook) {
  return (
    <button
      {...props}
      className={cx(buttonBase, buttonSizes[size], buttonVariants[variant], className)}
    />
  );
}

/** The same look, for navigation rather than an action. */
export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<typeof Link> & ButtonLook) {
  return (
    <Link
      {...props}
      className={cx(buttonBase, buttonSizes[size], buttonVariants[variant], className)}
    />
  );
}

/* ------------------------------------------------------------------ forms -- */

export const fieldClass =
  "w-full rounded-control border border-line-strong bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-faint transition-colors focus-visible:border-brand";

export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string[];
  children: ReactNode;
}) {
  const hintId = `${htmlFor}-hint`;
  const errorId = `${htmlFor}-error`;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {/* The hint is hidden once there is an error, so a screen reader is not
          read a suggestion and a complaint about the same field at once. */}
      {error?.length ? (
        <p id={errorId} className="text-sm text-red-700 dark:text-red-300">
          {error[0]}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-xs text-ink-faint">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/* ----------------------------------------------------------------- states -- */

export function EmptyState({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-card border border-dashed border-line-strong px-6 py-14 text-center">
      <p className="font-medium">{title}</p>
      {children ? <div className="mt-1.5 text-sm text-ink-soft">{children}</div> : null}
    </div>
  );
}

/** A number with a label. Used for the dashboard counts. */
export function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-2xl font-semibold tabular-nums tracking-tight">{value}</span>
      <span className="text-xs uppercase tracking-[0.08em] text-ink-faint">{label}</span>
    </div>
  );
}
