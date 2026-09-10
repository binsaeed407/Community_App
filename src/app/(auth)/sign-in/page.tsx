import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/guards";
import { SignInForm } from "./sign-in-form";

export const metadata = {
  title: "Sign in",
};

export default async function SignInPage() {
  // Someone already signed in has no business on this page.
  if (await getSessionUser()) redirect("/");

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-8 px-5 py-16">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Sign in</h1>
        <p className="mt-2 text-sm text-ink-soft">
          You need an account to report a problem. Browsing reports does not require one.
        </p>
      </div>

      <SignInForm />

      {/*
        The demo credentials are on the page rather than only in the README,
        because the person most likely to open this app has been sent a link and
        will not read a repository first.
      */}
      <div className="rounded-card border border-line bg-surface-sunken p-4 text-sm">
        <p className="font-medium">Try it without signing up</p>
        <dl className="mt-2 space-y-1 text-ink-soft">
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

      <p className="text-sm text-ink-soft">
        No account?{" "}
        <Link href="/sign-up" className="font-medium text-accent underline underline-offset-4">
          Create one
        </Link>
      </p>
    </div>
  );
}
