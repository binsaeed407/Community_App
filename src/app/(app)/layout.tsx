import { getSessionUser } from "@/lib/guards";
import { AppNav } from "@/components/app-nav";

/**
 * The application shell.
 *
 * Everything except the landing page and the sign-in pages renders inside this:
 * a persistent sidebar on large screens, and content that fills the rest of the
 * width instead of sitting in a 1024px column with several hundred pixels of
 * dead margin on each side.
 *
 * The sidebar only appears for signed-in visitors. A logged-out reader gets the
 * top navigation instead, because two thirds of the sidebar would be links they
 * cannot use, and a wall of disabled navigation is worse than none.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();

  if (!user) {
    return <div className="flex w-full flex-1 flex-col">{children}</div>;
  }

  return (
    <div className="flex w-full flex-1">
      {/*
        `sticky` with a top offset equal to the header height, rather than
        `fixed`, so the sidebar participates in the flex row and the content
        never needs a hardcoded left margin to avoid sliding underneath it.
      */}
      <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-60 shrink-0 overflow-y-auto border-r border-line bg-surface px-3 py-6 lg:block">
        <AppNav role={user.role} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
