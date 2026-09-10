import { listCategories } from "@/lib/issues";
import { requireUser } from "@/lib/guards";
import { isCloudinaryConfigured } from "@/lib/cloudinary";
import { ReportForm } from "./report-form";
import { Shell, PageHeader } from "@/components/ui";

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
    <Shell size="narrow">
      <PageHeader
        eyebrow="New report"
        title="Report a problem"
        description="This becomes a public record. Anyone can read it, and you will be able to see exactly what happens to it."
      />

      <ReportForm categories={categories} uploadsEnabled={isCloudinaryConfigured()} />
    </Shell>
  );
}
