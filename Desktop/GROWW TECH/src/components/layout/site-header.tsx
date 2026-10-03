"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Menu, X } from "lucide-react";
import { mainNav } from "@/config/site";
import { cn } from "@/lib/cn";
import { EASE } from "@/lib/motion";
import { Brand } from "@/components/brand/brand";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-500 ease-smooth",
        scrolled ? "py-2.5" : "py-4",
      )}
    >
      <div className="container-site">
        <div
          className={cn(
            "flex items-center justify-between gap-6 rounded-full px-4 transition-all duration-500 ease-smooth md:px-5",
            scrolled || open
              ? "glass py-2 shadow-sm"
              : "border border-transparent bg-transparent py-2.5",
          )}
        >
          <a
            href="#top"
            className="rounded-full outline-offset-4"
            aria-label="GROWW TECH — home"
          >
            <Brand />
          </a>

          <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
            {mainNav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-pill px-3.5 py-2 text-sm font-medium text-ink-muted transition-colors duration-300 ease-smooth hover:bg-canvas-soft hover:text-ink"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Button href="#products" size="sm" className="hidden sm:inline-flex">
              Explore work
            </Button>

            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={open ? "Close menu" : "Open menu"}
              className="inline-flex size-10 items-center justify-center rounded-pill border border-line bg-surface text-ink shadow-xs transition-colors duration-300 ease-smooth hover:border-line-strong md:hidden"
            >
              {open ? <X className="size-4.5" /> : <Menu className="size-4.5" />}
            </button>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {open ? (
            <motion.nav
              id="mobile-nav"
              aria-label="Mobile"
              initial={reduceMotion ? false : { opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: EASE.outExpo }}
              className="glass mt-2 overflow-hidden rounded-3xl p-2 shadow-md md:hidden"
            >
              <ul className="flex flex-col">
                {mainNav.map((item) => (
                  <li key={item.href}>
                    <a
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium text-ink transition-colors duration-300 ease-smooth hover:bg-canvas-soft"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.nav>
          ) : null}
        </AnimatePresence>
      </div>
    </header>
  );
}
