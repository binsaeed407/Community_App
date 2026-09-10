import { createHash } from "node:crypto";

/**
 * Cloudinary, without the Cloudinary SDK.
 *
 * The whole integration is: hash a few parameters with a secret, and let the
 * browser POST the file straight to Cloudinary with that signature attached.
 * That is about thirty lines, all of them visible here, versus a dependency
 * whose behaviour would have to be taken on trust and explained anyway.
 *
 * The file never passes through this app. That matters for two reasons: a
 * serverless function has a small request-body limit that a phone photo will
 * exceed, and proxying megabytes through a function is billed time spent doing
 * nothing but copying bytes.
 *
 * The secret never reaches the browser. The browser receives a signature that
 * is valid for one upload, with the folder and timestamp already fixed, so it
 * cannot be replayed to write anywhere else.
 */

export type CloudinaryConfig = {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
};

/** Where uploads land, so demo files are easy to find and purge later. */
export const UPLOAD_FOLDER = "community-app";

/**
 * Returns the configuration, or null when it is absent.
 *
 * Absent is a supported state, not a crash. Photos are optional in this app, so
 * a deployment without Cloudinary keys should still let people file reports —
 * it should just not offer to attach a picture. Throwing here would take the
 * whole report form down over an optional feature.
 */
export function getCloudinaryConfig(): CloudinaryConfig | null {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) return null;

  return { cloudName, apiKey, apiSecret };
}

export function isCloudinaryConfigured(): boolean {
  return getCloudinaryConfig() !== null;
}

/**
 * Cloudinary's signature: the parameters that will be sent, sorted by key,
 * joined as a query string, with the API secret appended, then SHA-1'd.
 *
 * The sort is not cosmetic — Cloudinary rebuilds the same string on its side
 * and compares, so a different order produces a different hash and a rejected
 * upload.
 */
export function signUploadParams(
  params: Record<string, string | number>,
  apiSecret: string,
): string {
  const toSign = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");

  return createHash("sha1").update(toSign + apiSecret).digest("hex");
}

export type UploadTicket = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
};

/** Everything the browser needs for exactly one upload. */
export function createUploadTicket(config: CloudinaryConfig): UploadTicket {
  // Cloudinary rejects a signature whose timestamp is far from its own clock,
  // which is what stops one being kept and reused indefinitely.
  const timestamp = Math.floor(Date.now() / 1000);

  const signature = signUploadParams(
    { folder: UPLOAD_FOLDER, timestamp },
    config.apiSecret,
  );

  return {
    cloudName: config.cloudName,
    apiKey: config.apiKey,
    timestamp,
    folder: UPLOAD_FOLDER,
    signature,
  };
}
