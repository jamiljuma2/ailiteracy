import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";

import appCss from "../styles.css?url";

function runtimeEnvScript() {
  const publicEnv = {
    VITE_SUPABASE_URL:
      process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.SB_URL || "",
    VITE_SUPABASE_PUBLISHABLE_KEY:
      process.env.SUPABASE_PUBLISHABLE_KEY ||
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
      process.env.SB_PUBLISHABLE_KEY ||
      "",
  };

  return {
    __html: `window.__APP_ENV__ = ${JSON.stringify(publicEnv)};`,
  };
}

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-gradient-brand">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "AI for Beginners — Practical Skills for Students & Professionals | Kenya" },
      {
        name: "description",
        content:
          "Master practical AI skills in 4 weeks. Live cohort taught in English & Swahili. Pay KES 3,000 with M-Pesa. For students, freelancers & professionals in Kenya.",
      },
      { name: "author", content: "AI Skills Africa" },
      {
        property: "og:title",
        content: "AI for Beginners — Practical Skills for Students & Professionals | Kenya",
      },
      {
        property: "og:description",
        content:
          "Master practical AI skills in 4 weeks. Live cohort taught in English & Swahili. Pay KES 3,000 with M-Pesa. For students, freelancers & professionals in Kenya.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        name: "twitter:title",
        content: "AI for Beginners — Practical Skills for Students & Professionals | Kenya",
      },
      {
        name: "twitter:description",
        content:
          "Master practical AI skills in 4 weeks. Live cohort taught in English & Swahili. Pay KES 3,000 with M-Pesa. For students, freelancers & professionals in Kenya.",
      },
      {
        property: "og:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/d58ef9e3-5aa7-43de-8f9c-01807aa5c3ce/id-preview-e82a73b3--808aab34-0008-4466-b435-be4efcf7fdc7.lovable.app-1777327617283.png",
      },
      {
        name: "twitter:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/d58ef9e3-5aa7-43de-8f9c-01807aa5c3ce/id-preview-e82a73b3--808aab34-0008-4466-b435-be4efcf7fdc7.lovable.app-1777327617283.png",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
        <script dangerouslySetInnerHTML={runtimeEnvScript()} />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return <Outlet />;
}
