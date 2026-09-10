import { NextResponse } from "next/server";
import { createUploadTicket, getCloudinaryConfig } from "@/lib/cloudinary";
import { getSessionUser } from "@/lib/guards";
import { checkIssueRateLimit } from "@/lib/rate-limit";

/**
 * Hands out a one-shot signature for a direct browser upload.
 *
 * Signed in only. An open signing endpoint is an open invitation to use someone
 * else's Cloudinary quota as free image hosting, and the free tier is exactly
 * the kind of thing that gets found and drained.
 *
 * It also refuses when the caller is already over the report rate limit. Without
 * that, someone could upload without limit as long as they never submitted the
 * form — the limit would be guarding the cheap operation and not the expensive
 * one.
 */
export async function POST() {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "You need to be signed in to upload." }, { status: 401 });
  }

  const config = getCloudinaryConfig();

  if (!config) {
    // A deployment without Cloudinary keys is a supported state: reports work,
    // photos are simply not offered. 503 says "not available here", which is
    // true, rather than 500 which would claim something is broken.
    return NextResponse.json(
      { error: "Photo upload is not configured on this deployment." },
      { status: 503 },
    );
  }

  const limit = await checkIssueRateLimit(user.id);

  if (!limit.allowed) {
    return NextResponse.json(
      { error: `Too many reports recently. Try again in ${limit.retryAfterMinutes} minutes.` },
      { status: 429 },
    );
  }

  return NextResponse.json(createUploadTicket(config));
}
