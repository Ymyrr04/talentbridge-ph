import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Briefcase, UserRound } from "lucide-react";
import { Brand } from "@/components/Brand";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TalentHub — Hire Filipino Remote Talent" }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
      { name: "description", content: "TalentHub connects employers worldwide with skilled Filipino remote professionals." },
      { property: "og:title", content: "TalentHub — Hire Filipino Remote Talent" },
      { property: "og:description", content: "Connecting employers worldwide with skilled Filipino remote professionals." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="flex min-h-screen flex-col bg-surface-gradient">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <Brand />
        <Button asChild variant="ghost" size="sm">
          <Link to="/login">Log in</Link>
        </Button>
      </header>
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <span className="rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
          The marketplace for Filipino remote professionals
        </span>
        <h1 className="mt-6 font-display text-4xl font-bold leading-[1.1] tracking-tight sm:text-6xl">
          Great work, <span className="text-primary">from the Philippines</span> to the world.
        </h1>
        <p className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
          TalentHub connects employers with skilled, vetted Filipino talent ready to work remotely.
        </p>
        <div className="mt-10 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Button asChild size="lg" className="h-12 px-6">
            <Link to="/signup/applicant">
              <UserRound className="h-4 w-4" /> Sign up as an Applicant <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-12 px-6">
            <Link to="/signup/client">
              <Briefcase className="h-4 w-4" /> Sign up as a Client
            </Link>
          </Button>
        </div>
      </main>
      <footer className="py-6 text-center text-xs text-muted-foreground">© {new Date().getFullYear()} TalentHub</footer>
    </div>
  );
}
