export const siteConfig = {
  name: "GROWW TECH",
  shortName: "GROWW",
  tagline: "A product-building studio",
  description:
    "GROWW TECH is a product-building studio crafting SaaS platforms, websites, experiments, demos and videos.",
  url: "https://groww.tech",
  locale: "en_IN",
} as const;

export type NavItem = {
  label: string;
  href: string;
};

export const mainNav: readonly NavItem[] = [
  { label: "Platforms", href: "#platforms" },
  { label: "Experiments", href: "#experiments" },
  { label: "Videos", href: "#videos" },
  { label: "Studio", href: "#studio" },
];
