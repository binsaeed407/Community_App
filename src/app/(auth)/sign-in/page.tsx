import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/guards";
import { SignInForm } from "./sign-in-form";

export const metadata = {
  title: "Sign in — Community App",
};

export default async function SignInPage() {
  // Someone already signed in has no business on this page.
  if (await getSessionUser()) redirect("/");

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-8 px-6 py-16">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Sign in</h1>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          You need an account to report a problem. Browsing reports does not require one.
        </p>
      </div>

      <SignInForm />

      {/*
        The demo credentials are on the page rather than only in the README,
        because the person most likely to open this app has been sent a link and
        will not read a repository first.
      */}
      <div className="rounded-md border border-neutral-200 bg-neutral-50 p-4 text-sm dark:border-neutral-800 dark:bg-neutral-900">
        <p className="font-medium">Try it without signing up</p>
        <dl className="mt-2 space-y-1 text-neutral-600 dark:text-neutral-400">
          <div className="flex justify-between gap-4">
            <dt>Citizen</dt>
            <dd className="font-mono text-xs">demo-citizen@example.com</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>Administrator</dt>
            <dd className="font-mono text-xs">demo-admin@example.com</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>Password for both</dt>
            <dd className="font-mono text-xs">demo1234</dd>
          </div>
        </dl>
      </div>

      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        No account?{" "}
        <Link href="/sign-up" className="font-medium text-neutral-900 underline dark:text-neutral-100">
          Create one
        </Link>
      </p>
    </main>
  );
}
