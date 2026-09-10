import { z } from "zod";

/**
 * One definition of what valid input looks like, imported by both the form and
 * the server. Validating in two places with two schemas is how the client and
 * the server quietly drift apart.
 */

/** The minimum a password must be. Long enough to matter, short enough that the
 *  published demo password still works. */
export const MIN_PASSWORD_LENGTH = 8;

export const credentialsSchema = z.object({
  email: z.email("Enter a valid email address").trim().toLowerCase(),
  password: z.string().min(1, "Enter your password"),
});

export const signUpSchema = z.object({
  email: z.email("Enter a valid email address").trim().toLowerCase(),
  displayName: z
    .string()
    .trim()
    .min(2, "Your display name needs at least 2 characters")
    .max(50, "Your display name can be at most 50 characters"),
  password: z
    .string()
    .min(MIN_PASSWORD_LENGTH, `Your password needs at least ${MIN_PASSWORD_LENGTH} characters`)
    .max(200, "That password is too long"),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type CredentialsInput = z.infer<typeof credentialsSchema>;
