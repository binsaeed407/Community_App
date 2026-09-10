import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/guards";
import { SignUpForm } from "./sign-up-form";

export const metadata = {
  title: "Create an account — Community App",
};

export default async function SignUpPage() {
  if (await getSessionUser()) redirect("/");

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-8 px-6 py-16">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create an account</h1>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          You only need one to report a problem or comment on your own reports.
        </p>
      </div>

      <SignUpForm />

      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        Already have one?{" "}
        <Link href="/sign-in" className="font-medium text-neutral-900 underline dark:text-neutral-100">
          Sign in
        </Link>
      </p>
    </main>
  );
}
