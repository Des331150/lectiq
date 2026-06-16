import Link from "next/link";

export function BillingToggle({ interval }: { interval: "monthly" | "yearly" }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      <Link
        href="/billing"
        className={`text-sm px-3 py-1.5 rounded-md transition-colors ${
          interval === "monthly"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        Monthly
      </Link>
      <Link
        href="/billing?interval=yearly"
        className={`text-sm px-3 py-1.5 rounded-md transition-colors ${
          interval === "yearly"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        Annual
      </Link>
    </div>
  );
}
