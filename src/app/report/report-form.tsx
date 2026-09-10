"use client";

import { fieldClass } from "@/components/ui";
import { useActionState, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useFormStatus } from "react-dom";
import { MAP_DEFAULT_CENTRE, type Coordinates } from "@/lib/constants";
import { DESCRIPTION_MAX, TITLE_MAX } from "@/lib/validation/issue";
import { classify } from "@/lib/classify/rules";
import { PhotoUpload } from "@/components/upload/photo-upload";
import { createIssueAction } from "./actions";
import { emptyFormState } from "@/lib/form-state";

export type CategoryOption = { id: string; name: string; icon: string; slug: string };

/**
 * Leaflet reads `window` when the module is imported, so importing it on the
 * server throws before anything renders. ssr:false makes this the one part of
 * the page that is browser-only; everything around it still renders server-side.
 */
const LocationPicker = dynamic(
  () => import("@/components/map/location-picker").then((m) => m.LocationPicker),
  {
    ssr: false,
    loading: () => (
      <div className="h-[320px] w-full animate-pulse rounded-card border border-line bg-surface-sunken" />
    ),
  },
);

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-10 items-center justify-center rounded-control bg-ink px-5 text-sm font-medium text-paper transition-colors hover:bg-ink-soft disabled:opacity-55"
    >
      {pending ? "Sending your report…" : "Send report"}
    </button>
  );
}

function FieldError({ id, messages }: { id: string; messages?: string[] }) {
  if (!messages?.length) return null;
  return (
    <p id={id} className="text-sm text-red-700 dark:text-red-300">
      {messages[0]}
    </p>
  );
}

export function ReportForm({
  categories,
  uploadsEnabled,
}: {
  categories: CategoryOption[];
  uploadsEnabled: boolean;
}) {
  const titleRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const [state, formAction] = useActionState(createIssueAction, emptyFormState);
  const { fieldErrors } = state;

  // The pin starts at the default centre rather than at 0,0 — a form that opens
  // pointing at the Atlantic looks broken even though the user is about to
  // change it anyway.
  const [position, setPosition] = useState<Coordinates>(MAP_DEFAULT_CENTRE);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState("");
  const [touchedCategory, setTouchedCategory] = useState(false);
  const [suggestion, setSuggestion] = useState<CategoryOption | null>(null);

  /**
   * Runs the classifier in the browser as the description is written.
   *
   * It is the same pure function the server runs, so there is no network call
   * and no waiting — and no way for the two to disagree. The server re-runs it
   * on submit rather than trusting whatever the browser posts.
   */
  function updateSuggestion(title: string, description: string) {
    const result = classify(title, description);
    const match = result.slug ? (categories.find((c) => c.slug === result.slug) ?? null) : null;
    setSuggestion(match);

    // Pre-fill only while the person has not chosen for themselves. Changing a
    // selection someone has already made would be the app overruling them,
    // which is exactly what an editable suggestion must never do.
    if (match && !touchedCategory) setCategoryId(match.id);
  }

  // The pin wears the chosen category icon, so the map reflects the rest of
  // the form rather than sitting beside it.
  const pinEmoji = useMemo(
    () => categories.find((c) => c.id === categoryId)?.icon ?? "📍",
    [categories, categoryId],
  );

  function useMyLocation() {
    if (!navigator.geolocation) {
      setLocationError("This browser cannot share your location. Type where it is instead.");
      return;
    }

    setLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (result) => {
        setPosition({
          latitude: result.coords.latitude,
          longitude: result.coords.longitude,
        });
        setLocating(false);
      },
      () => {
        // Refusing to share location is a legitimate choice, not an error to
        // scold someone about — the form still works without it.
        setLocationError("Could not get your location. You can still describe where it is.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }

  return (
    <form action={formAction} className="mt-8 flex flex-col gap-6" noValidate>
      {state.formError ? (
        <p
          role="alert"
          className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100"
        >
          {state.formError}
        </p>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="categoryId" className="text-sm font-medium">
          What kind of problem is it?
        </label>
        <select
          id="categoryId"
          name="categoryId"
          required
          value={categoryId}
          onChange={(event) => {
            setCategoryId(event.target.value);
            setTouchedCategory(true);
          }}
          aria-describedby={fieldErrors.categoryId ? "categoryId-error" : undefined}
          aria-invalid={Boolean(fieldErrors.categoryId)}
          className={fieldClass}
        >
          <option value="" disabled>
            Choose a category
          </option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.icon} {category.name}
            </option>
          ))}
        </select>
        {suggestion && categoryId === suggestion.id ? (
          <p className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center rounded-full border border-blue-300 bg-blue-50 px-2 py-0.5 font-medium text-blue-900 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-100">
              Suggested
            </span>
            <span className="text-ink-faint">
              Picked from what you wrote. Change it if it is wrong.
            </span>
          </p>
        ) : null}
        <FieldError id="categoryId-error" messages={fieldErrors.categoryId} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="title" className="text-sm font-medium">
          Title
        </label>
        <input
          id="title"
          ref={titleRef}
          name="title"
          type="text"
          required
          maxLength={TITLE_MAX}
          placeholder="Deep pothole outside the library"
          onChange={(event) =>
            updateSuggestion(event.target.value, descriptionRef.current?.value ?? "")
          }
          aria-describedby={fieldErrors.title ? "title-error" : "title-hint"}
          aria-invalid={Boolean(fieldErrors.title)}
          className={fieldClass}
        />
        <p id="title-hint" className="text-xs text-ink-faint">
          One line. What would you say to someone on the phone?
        </p>
        <FieldError id="title-error" messages={fieldErrors.title} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="description" className="text-sm font-medium">
          What is wrong?
        </label>
        <textarea
          id="description"
          name="description"
          required
          rows={5}
          maxLength={DESCRIPTION_MAX}
          ref={descriptionRef}
          placeholder="How big is it, how long has it been there, and is anyone at risk?"
          onChange={(event) =>
            updateSuggestion(titleRef.current?.value ?? "", event.target.value)
          }
          aria-describedby={fieldErrors.description ? "description-error" : "description-hint"}
          aria-invalid={Boolean(fieldErrors.description)}
          className={fieldClass}
        />
        <p id="description-hint" className="text-xs text-ink-faint">
          Detail helps whoever picks this up decide how urgent it is.
        </p>
        <FieldError id="description-error" messages={fieldErrors.description} />
      </div>

      <fieldset className="flex flex-col gap-3 rounded-card border border-line bg-surface p-4">
        <legend className="px-1 text-sm font-medium">Where is it?</legend>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="addressLabel" className="text-sm">
            Nearest street or landmark
          </label>
          <input
            id="addressLabel"
            name="addressLabel"
            type="text"
            required
            placeholder="Camberwell Road, near the library"
            aria-describedby={
              fieldErrors.addressLabel ? "addressLabel-error" : "addressLabel-hint"
            }
            aria-invalid={Boolean(fieldErrors.addressLabel)}
            className={fieldClass}
          />
          <p id="addressLabel-hint" className="text-xs text-ink-faint">
            Please do not enter a full home address — this is shown publicly.
          </p>
          <FieldError id="addressLabel-error" messages={fieldErrors.addressLabel} />
        </div>

        <LocationPicker position={position} onPick={setPosition} emoji={pinEmoji} />

        <p className="text-xs text-ink-faint">
          Click the map or drag the pin to place it exactly. If you would rather not, the street
          name above is enough.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={useMyLocation}
            disabled={locating}
            className="inline-flex h-9 items-center justify-center rounded-control border border-line-strong bg-surface px-3 text-sm font-medium transition-colors hover:bg-surface-sunken disabled:opacity-55"
          >
            {locating ? "Finding you…" : "Use my current location"}
          </button>
          <p className="font-mono text-xs text-ink-faint">
            {position.latitude.toFixed(5)}, {position.longitude.toFixed(5)}
          </p>
        </div>

        {locationError ? (
          <p className="text-xs text-amber-700 dark:text-amber-300">{locationError}</p>
        ) : null}

        {/* The coordinates the server actually reads. Hidden because they are
            set by the button and the map, not typed. They are still validated
            server-side against the service area — a hidden input is a client
            input like any other. */}
        <input type="hidden" name="latitude" value={position.latitude} />
        <input type="hidden" name="longitude" value={position.longitude} />

        <FieldError id="latitude-error" messages={fieldErrors.latitude} />
        <FieldError id="longitude-error" messages={fieldErrors.longitude} />
      </fieldset>

      <fieldset className="flex flex-col gap-3 rounded-card border border-line bg-surface p-4">
        <legend className="px-1 text-sm font-medium">Photos</legend>
        <p className="text-xs text-ink-faint">
          A photo makes a report far harder to dismiss. Please avoid including faces or number
          plates — this is published publicly.
        </p>
        <PhotoUpload disabled={!uploadsEnabled} />
        <FieldError id="photos-error" messages={fieldErrors.photos} />
      </fieldset>

      <div>
        <SubmitButton />
      </div>
    </form>
  );
}
