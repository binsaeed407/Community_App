/**
 * The shape every form action returns, and the value every form starts with.
 *
 * This lives in a plain module rather than beside the actions that use it,
 * because a file marked "use server" may only export async functions. Exporting
 * a constant from one does not fail the build — it fails at runtime, where the
 * import silently arrives as undefined and the first component to read a field
 * off it throws.
 *
 * That is precisely how it was found: /report returned a 500 with "Cannot read
 * properties of undefined (reading 'categoryId')", while three other forms
 * using the same broken pattern happened to return early before touching the
 * state and looked fine.
 */
export type FormState = {
  /** Validation messages, keyed by input name. */
  fieldErrors: Record<string, string[]>;
  /** A problem that is not about one field. */
  formError: string | null;
  /** Whether the last submission succeeded. */
  ok: boolean;
};

export const emptyFormState: FormState = {
  fieldErrors: {},
  formError: null,
  ok: false,
};
