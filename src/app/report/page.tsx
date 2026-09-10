import { listCategories } from "@/lib/issues";
import { requireUser } from "@/lib/guards";
import { isCloudinaryConfigured } from "@/lib/cloudinary";
import { ReportForm } from "./report-form";

export const metadata = {
  title: "Report a problem",
};

/**
 * The report form.
 *
 * Guarded twice on purpose: middleware keeps logged-out visitors off the page,
 * and requireUser() here means the page cannot render without a session even if
 * the matcher is ever changed by accident.
 */
export default async function ReportPage() {
  await requireUser();
  const categories = await listCategories();

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <h1 className="text-3xl font-bold tracking-tight">Report a problem</h1>
      <p className="mt-2 text-neutral-600 dark:text-neutral-400">
        This becomes a public record. Anyone can read it, and you will be able to see exactly what
        happens to it.
      </p>

      <ReportForm categories={categories} uploadsEnabled={isCloudinaryConfigured()} />
    </main>
  );
}
