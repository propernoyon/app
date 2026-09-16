import { notFound } from "next/navigation";
import { PackageSearch } from "lucide-react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardFooter, InteractiveCard } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { Price } from "@/components/ui/price";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { InteractiveDemos } from "./demos";
import { PageSection, Swatch } from "./section";

export const metadata = {
  title: "Mini Mercado — UI styleguide",
};

const BRAND = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;
const NEUTRAL = [0, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;

const BRAND_CLASS: Record<number, string> = {
  50: "bg-brand-50",
  100: "bg-brand-100",
  200: "bg-brand-200",
  300: "bg-brand-300",
  400: "bg-brand-400",
  500: "bg-brand-500",
  600: "bg-brand-600",
  700: "bg-brand-700",
  800: "bg-brand-800",
  900: "bg-brand-900",
  950: "bg-brand-950",
};

const NEUTRAL_CLASS: Record<number, string> = {
  0: "bg-neutral-0",
  50: "bg-neutral-50",
  100: "bg-neutral-100",
  200: "bg-neutral-200",
  300: "bg-neutral-300",
  400: "bg-neutral-400",
  500: "bg-neutral-500",
  600: "bg-neutral-600",
  700: "bg-neutral-700",
  800: "bg-neutral-800",
  900: "bg-neutral-900",
  950: "bg-neutral-950",
};

const SEMANTIC = [
  { name: "success", className: "bg-success" },
  { name: "warning", className: "bg-warning" },
  { name: "danger", className: "bg-danger" },
  { name: "info", className: "bg-info" },
  { name: "accent", className: "bg-accent" },
  { name: "primary", className: "bg-primary" },
  { name: "surface", className: "bg-surface" },
  { name: "background", className: "bg-background" },
  { name: "muted", className: "bg-muted" },
  { name: "border", className: "bg-border" },
];

const BADGES: BadgeVariant[] = [
  "neutral",
  "primary",
  "accent",
  "success",
  "warning",
  "danger",
  "info",
  "outline",
];

const TYPE_SCALE = [
  { className: "text-display", label: "text-display" },
  { className: "text-h1", label: "text-h1" },
  { className: "text-h2", label: "text-h2" },
  { className: "text-h3", label: "text-h3" },
  { className: "text-h4", label: "text-h4" },
  { className: "text-body-lg", label: "text-body-lg" },
  { className: "text-body", label: "text-body" },
  { className: "text-small", label: "text-small" },
  { className: "text-caption", label: "text-caption" },
  { className: "text-micro", label: "text-micro" },
];

/**
 * Dev-only component gallery. Rendering every variant and state in one place is
 * how "standard UI" stays standard as the app grows. Returns 404 in production.
 */
export default function UiStyleguidePage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main className="container-page py-10">
      <header className="mb-8">
        <p className="text-micro text-primary">Development only</p>
        <h1 className="mt-1 text-h1 text-foreground">UI styleguide</h1>
        <p className="mt-2 max-w-2xl text-body text-muted-foreground">
          Every primitive, variant and state in one place. Nothing here uses a raw colour, radius or
          shadow — all values come from <code className="font-mono">styles/tokens.css</code>.
        </p>
      </header>

      <PageSection
        title="Colour — brand"
        hint="Deep cobalt, oklch for perceptual consistency. Chroma is capped per rung to what sRGB can actually hold, so nothing relies on the browser's out-of-gamut remapping."
      >
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-11">
          {BRAND.map((step) => (
            <Swatch key={step} name={`brand-${step}`} className={BRAND_CLASS[step]} />
          ))}
        </div>
      </PageSection>

      <PageSection
        title="Colour — neutral"
        hint="Warm stone; keeps large white surfaces from feeling cold."
      >
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-12">
          {NEUTRAL.map((step) => (
            <Swatch key={step} name={`neutral-${step}`} className={NEUTRAL_CLASS[step]} />
          ))}
        </div>
      </PageSection>

      <PageSection
        title="Colour — semantic"
        hint="Each status also has muted / border / foreground tokens used by Alert and Badge."
      >
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-10">
          {SEMANTIC.map((item) => (
            <Swatch key={item.name} name={item.name} className={item.className} />
          ))}
        </div>
      </PageSection>

      <PageSection
        title="Typography"
        hint="A fixed modular scale with paired line-heights and weights."
      >
        <div className="space-y-4">
          {TYPE_SCALE.map((item) => (
            <div key={item.label} className="flex flex-wrap items-baseline gap-x-6 gap-y-1">
              <span className="w-32 shrink-0 font-mono text-[11px] text-muted-foreground">
                {item.label}
              </span>
              <span className={`${item.className} text-foreground`}>
                Fresh fruit, delivered today
              </span>
            </div>
          ))}
        </div>
      </PageSection>

      <PageSection
        title="Radii & elevation"
        hint="Rounded cards with warm-tinted, low-spread shadows."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-wrap gap-3">
            {(
              [
                ["rounded-xs", "xs"],
                ["rounded-sm", "sm"],
                ["rounded-md", "md"],
                ["rounded-lg", "lg"],
                ["rounded-xl", "xl"],
                ["rounded-2xl", "2xl"],
                ["rounded-card", "card"],
              ] as const
            ).map(([cls, label]) => (
              <div key={label} className="text-center">
                <div className={`size-14 border border-border bg-surface ${cls}`} />
                <p className="mt-1.5 font-mono text-[11px] text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-4">
            {(
              [
                ["shadow-xs", "xs"],
                ["shadow-sm", "sm"],
                ["shadow-card", "card"],
                ["shadow-card-hover", "card-hover"],
                ["shadow-pop", "pop"],
              ] as const
            ).map(([cls, label]) => (
              <div key={label} className="text-center">
                <div className={`size-16 rounded-lg bg-surface ${cls}`} />
                <p className="mt-1.5 font-mono text-[11px] text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </PageSection>

      <PageSection
        title="Buttons"
        hint="One primary action per view. Every size is ≥44px tall, so a 'small' button is still a comfortable touch target."
      >
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            {(["primary", "secondary", "outline", "ghost", "danger"] as const).map((variant) => (
              <Button key={variant} variant={variant}>
                {variant}
              </Button>
            ))}
            <Button variant="link">link</Button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
            <Button disabled>Disabled</Button>
            <Button loading>Loading</Button>
            <Button variant="outline" loading>
              Saving
            </Button>
          </div>

          <div className="max-w-sm">
            <Button fullWidth size="lg">
              Full width
            </Button>
          </div>
        </div>
      </PageSection>

      <PageSection title="Badges" hint="Fixed vocabulary for stock and order statuses.">
        <div className="flex flex-wrap items-center gap-3">
          {BADGES.map((variant) => (
            <Badge key={variant} variant={variant} dot>
              {variant}
            </Badge>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {BADGES.map((variant) => (
            <Badge key={variant} variant={variant} size="md">
              {variant} md
            </Badge>
          ))}
        </div>
      </PageSection>

      <PageSection title="Cards & price">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardBody>
              <p className="text-h4">Static card</p>
              <p className="mt-1 text-small text-muted-foreground">
                Used for summaries and totals.
              </p>
              <Price className="mt-3" value="€2,49" compareAt="€3,20" suffix="/ un" size="lg" />
            </CardBody>
            <CardFooter>
              <p className="text-caption text-muted-foreground">Footer row</p>
            </CardFooter>
          </Card>

          <InteractiveCard>
            <Skeleton shape="media" className="rounded-b-none" />
            <CardBody>
              <p className="text-h4">Interactive card</p>
              <Price className="mt-2" value="€1,19" suffix="/ kg" />
            </CardBody>
          </InteractiveCard>

          <Card>
            <CardBody className="flex items-center gap-3">
              <Spinner className="text-primary" size={20} />
              <p className="text-small text-muted-foreground">Standalone spinner</p>
            </CardBody>
          </Card>
        </div>
      </PageSection>

      <PageSection title="Loading & empty states" hint="Skeletons match the final layout box.">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-3">
            <Skeleton shape="text" className="w-2/3" />
            <Skeleton shape="text" className="w-1/3" />
            <Skeleton className="h-24 w-full" />
          </div>
          <EmptyState
            icon={<PackageSearch className="size-6" />}
            title="Nothing here yet"
            description="Empty states always offer one clear next step."
            action={<Button>Browse the shop</Button>}
          />
        </div>
      </PageSection>

      <PageSection
        title="Theme"
        hint="Light / dark / system. The preference is stored in a cookie and applied before first paint."
      >
        <div className="space-y-4">
          <ThemeToggle
            labels={{
              label: "Theme",
              light: "Light",
              dark: "Dark",
              system: "System",
              switchToLight: "Switch to light mode",
              switchToDark: "Switch to dark mode",
              switchToSystem: "Use the system theme",
            }}
          />
          <p className="text-small text-muted-foreground">
            Compact variant used in the header:
          </p>
          <ThemeToggle
            variant="compact"
            labels={{
              label: "Theme",
              light: "Light",
              dark: "Dark",
              system: "System",
              switchToLight: "Switch to light mode",
              switchToDark: "Switch to dark mode",
              switchToSystem: "Use the system theme",
            }}
          />
        </div>
      </PageSection>

      <PageSection
        title="Dark theme preview"
        hint="The same components inside a `.dark` scope — every value swaps because the semantic layer is runtime-swappable."
      >
        <div className="dark rounded-2xl border border-border bg-background p-5 text-foreground">
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-10">
            {SEMANTIC.map((item) => (
              <Swatch key={item.name} name={item.name} className={item.className} />
            ))}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            {(["primary", "secondary", "outline", "ghost", "danger"] as const).map((variant) => (
              <Button key={variant} variant={variant}>
                {variant}
              </Button>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            {BADGES.map((variant) => (
              <Badge key={variant} variant={variant} dot>
                {variant}
              </Badge>
            ))}
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Card>
              <CardBody>
                <p className="text-h4 text-foreground">Surface</p>
                <p className="mt-1 text-small text-muted-foreground">
                  Card, border, muted and foreground tokens all shift together.
                </p>
                <Price className="mt-3" value="€2,49" suffix="/ un" size="lg" />
              </CardBody>
            </Card>
            <EmptyState
              icon={<PackageSearch className="size-6" />}
              title="Nothing here yet"
              description="Empty states read correctly on dark surfaces too."
            />
          </div>

          <div className="mt-5">
            <Skeleton shape="text" className="w-1/3" />
          </div>
        </div>
      </PageSection>

      <PageSection
        title="Pagination"
        hint="Windowed page list; every target is 44px."
      >
        <Pagination
          currentPage={3}
          totalPages={12}
          basePath="/dev/ui"
          labels={{ previous: "Previous", next: "Next", page: "Pagination" }}
        />
      </PageSection>

      <InteractiveDemos />
    </main>
  );
}
