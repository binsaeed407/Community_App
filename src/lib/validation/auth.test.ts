import { describe, expect, it } from "vitest";
import { compare, hashSync } from "bcryptjs";
import { credentialsSchema, signUpSchema, MIN_PASSWORD_LENGTH } from "./auth";

describe("signUpSchema", () => {
  const valid = {
    email: "someone@example.com",
    displayName: "Someone",
    password: "a-good-password",
  };

  it("accepts a well-formed registration", () => {
    expect(signUpSchema.safeParse(valid).success).toBe(true);
  });

  it("lowercases and trims the email so the same address cannot register twice", () => {
    // Without this, "Someone@Example.com " and "someone@example.com" are two
    // different accounts as far as the unique index is concerned.
    const parsed = signUpSchema.parse({ ...valid, email: "  Someone@Example.COM  " });
    expect(parsed.email).toBe("someone@example.com");
  });

  it("rejects a password shorter than the minimum", () => {
    const result = signUpSchema.safeParse({ ...valid, password: "a".repeat(MIN_PASSWORD_LENGTH - 1) });
    expect(result.success).toBe(false);
  });

  it("rejects a display name that is only whitespace", () => {
    // Trimming happens before the length check, so "   " must not pass as a
    // three-character name and leave a blank byline on a public report.
    expect(signUpSchema.safeParse({ ...valid, displayName: "   " }).success).toBe(false);
  });

  it("rejects an invalid email", () => {
    expect(signUpSchema.safeParse({ ...valid, email: "not-an-email" }).success).toBe(false);
  });
});

describe("credentialsSchema", () => {
  it("accepts any non-empty password, because length rules apply at registration", () => {
    // Enforcing the minimum here would lock out any account created before the
    // rule changed, which is a real way to break your own login page.
    const result = credentialsSchema.safeParse({ email: "a@b.com", password: "x" });
    expect(result.success).toBe(true);
  });

  it("rejects an empty password", () => {
    expect(credentialsSchema.safeParse({ email: "a@b.com", password: "" }).success).toBe(false);
  });
});

describe("password hashing", () => {
  it("stores something that is not the password", () => {
    const hash = hashSync("correct-horse-battery", 4);
    expect(hash).not.toContain("correct-horse-battery");
    expect(hash.startsWith("$2")).toBe(true);
  });

  it("accepts the right password and rejects the wrong one", async () => {
    // Rounds are low here purely so the test suite stays fast; the application
    // uses 10.
    const hash = hashSync("correct-horse-battery", 4);
    await expect(compare("correct-horse-battery", hash)).resolves.toBe(true);
    await expect(compare("Correct-horse-battery", hash)).resolves.toBe(false);
  });

  it("produces a different hash for the same password every time", () => {
    // bcrypt salts each hash, so two users with the same password do not have
    // matching rows — which is what stops one leaked hash unlocking several
    // accounts at once.
    expect(hashSync("same-password", 4)).not.toBe(hashSync("same-password", 4));
  });
});
