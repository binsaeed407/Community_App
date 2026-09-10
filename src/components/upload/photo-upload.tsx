"use client";

import { useRef, useState } from "react";

export type UploadedPhoto = { url: string; publicId: string };

const MAX_PHOTOS = 3;
const MAX_BYTES = 10 * 1024 * 1024;

/**
 * Uploads photos straight from the browser to Cloudinary.
 *
 * The flow: ask this app for a signature, POST the file to Cloudinary with it,
 * keep the URL that comes back. The file never touches our server, which avoids
 * both the serverless request-size limit and paying for a function to sit there
 * copying bytes.
 *
 * The results are kept in a hidden field as JSON, so the whole thing still
 * submits as one ordinary form post — no separate save step, and no half-created
 * issue if the user closes the tab mid-upload.
 */
export function PhotoUpload({ disabled }: { disabled?: boolean }) {
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    if (photos.length >= MAX_PHOTOS) {
      setError(`You can attach up to ${MAX_PHOTOS} photos.`);
      return;
    }

    // Checked here so an over-size file fails instantly and locally, rather
    // than after a slow upload on a phone connection. The real limit is
    // Cloudinary's; this is only about not wasting the user's data.
    if (file.size > MAX_BYTES) {
      setError("That photo is larger than 10MB. Try a smaller one.");
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const ticketResponse = await fetch("/api/uploads/sign", { method: "POST" });

      if (!ticketResponse.ok) {
        const body = await ticketResponse.json().catch(() => ({}));
        throw new Error(body.error ?? "Could not start the upload.");
      }

      const ticket = await ticketResponse.json();

      const body = new FormData();
      body.append("file", file);
      body.append("api_key", ticket.apiKey);
      body.append("timestamp", String(ticket.timestamp));
      body.append("folder", ticket.folder);
      body.append("signature", ticket.signature);

      const uploadResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${ticket.cloudName}/image/upload`,
        { method: "POST", body },
      );

      if (!uploadResponse.ok) throw new Error("Cloudinary rejected the upload.");

      const result = await uploadResponse.json();

      setPhotos((current) => [...current, { url: result.secure_url, publicId: result.public_id }]);
    } catch (cause) {
      // A failed photo must not cost someone the report they have just written
      // out, so this reports and moves on rather than resetting the form.
      setError(cause instanceof Error ? cause.message : "That upload failed. Try again.");
    } finally {
      setBusy(false);
      // Clear the input so choosing the same file twice still fires a change.
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  if (disabled) {
    return (
      <p className="text-xs text-neutral-500">
        Photo upload is not configured on this deployment, so reports are text-only for now.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <label className="cursor-pointer rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium transition hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800">
          {busy ? "Uploading…" : "Add a photo"}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={busy || photos.length >= MAX_PHOTOS}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void upload(file);
            }}
          />
        </label>
        <span className="text-xs text-neutral-500">
          {photos.length} of {MAX_PHOTOS} · optional
        </span>
      </div>

      {error ? (
        <p role="alert" className="text-xs text-amber-700 dark:text-amber-300">
          {error}
        </p>
      ) : null}

      {photos.length > 0 ? (
        <ul className="flex flex-wrap gap-3">
          {photos.map((photo) => (
            <li key={photo.publicId} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.url}
                alt="Photo you attached to this report"
                className="h-20 w-20 rounded-md object-cover"
              />
              <button
                type="button"
                onClick={() =>
                  setPhotos((current) => current.filter((p) => p.publicId !== photo.publicId))
                }
                className="absolute -right-2 -top-2 rounded-full border border-neutral-300 bg-white px-1.5 text-xs shadow-sm dark:border-neutral-600 dark:bg-neutral-900"
                aria-label="Remove this photo"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {/* What the server action actually reads. Validated there against the
          same Zod schema as everything else — a URL arriving from the browser
          is not trusted just because this component put it there. */}
      <input type="hidden" name="photos" value={JSON.stringify(photos)} />
    </div>
  );
}
