import { mainNav, siteConfig } from "@/config/site";
import { Brand } from "@/components/brand/brand";
import { Container } from "@/components/ui/container";
import { SoftDivider } from "@/components/ui/decor";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-line bg-surface">
      <Container className="py-14">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="flex max-w-sm flex-col gap-4">
            <Brand />
            <p className="text-sm text-pretty text-ink-muted">{siteConfig.description}</p>
          </div>

          <nav aria-label="Footer" className="flex flex-col gap-3">
            <span className="font-mono text-2xs tracking-widest text-ink-faint uppercase">
              Sections
            </span>
            <ul className="grid grid-cols-2 gap-x-10 gap-y-2">
              {mainNav.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="text-sm text-ink-muted transition-colors duration-300 ease-smooth hover:text-brand-700"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <SoftDivider className="my-10" />

        <div className="flex flex-col gap-2 text-xs text-ink-subtle sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; {year} {siteConfig.name}. All rights reserved.
          </p>
          <p className="font-mono tracking-wide">Built as a product studio.</p>
        </div>
      </Container>
    </footer>
  );
}
