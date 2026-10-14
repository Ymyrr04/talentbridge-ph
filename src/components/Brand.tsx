import { Link } from "@tanstack/react-router";

export function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold tracking-tight text-foreground">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-sm text-primary-foreground">T</span>
      TalentHub
    </Link>
  );
}
