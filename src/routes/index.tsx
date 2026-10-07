import { ArrowRightIcon } from "@heroicons/react/24/outline";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ThemeToggle } from "#/components/theme-toggle";

export const Route = createFileRoute("/")({ component: Home });

const destinations = [
  {
    to: "/lector",
    title: "Lector",
    description: "Pegá un texto y leelo página por página.",
  },
  {
    to: "/editor",
    title: "Editor",
    description: "Escribí sin distracciones.",
  },
] as const;

function Home() {
  return (
    <main className="bg-surface text-ink relative flex min-h-dvh flex-col">
      <div className="absolute top-[max(0.75rem,env(safe-area-inset-top))] right-[max(0.75rem,env(safe-area-inset-right))] z-30">
        <ThemeToggle />
      </div>

      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-4 py-12 sm:px-8 sm:py-16">
        <h1 className="animate-fade-rise font-display text-3xl leading-none font-semibold tracking-tight sm:text-4xl md:text-5xl">
          ¿Qué querés hacer?
        </h1>

        <nav className="animate-fade-rise-delay mt-8 flex flex-col gap-4 sm:mt-10">
          {destinations.map(({ to, title, description }) => (
            <Link
              key={to}
              to={to}
              className="group border-border bg-panel hover:border-foxglove/60 flex items-center justify-between gap-4 rounded-sm border px-5 py-5 transition sm:px-6"
            >
              <div>
                <p className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
                  {title}
                </p>
                <p className="font-reading text-ink-muted mt-1 text-base">
                  {description}
                </p>
              </div>
              <ArrowRightIcon className="text-foxglove size-6 shrink-0 transition group-hover:translate-x-1" />
            </Link>
          ))}
        </nav>
      </div>
    </main>
  );
}
