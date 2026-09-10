import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/guards";
import { SignUpForm } from "./sign-up-form";

export const metadata = {
  title: "Create an account",
};

export default async function SignUpPage() {
  if (await getSessionUser()) redirect("/");

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-8 px-5 py-16">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create an account</h1>
        <p className="mt-2 text-sm text-ink-soft">
          You only need one to report a problem or comment on your own reports.
        </p>
      </div>

      <SignUpForm />

      <p className="text-sm text-ink-soft">
        Already have one?{" "}
        <Link href="/sign-in" className="font-medium text-accent underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </div>
  );
}
