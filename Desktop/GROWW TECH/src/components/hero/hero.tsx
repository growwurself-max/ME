import { ArrowRight, PlayCircle } from "lucide-react";
import { Brand } from "@/components/brand/brand";
import { Reveal } from "@/components/motion/reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Container, Section } from "@/components/ui/container";
import { GlowOrb, GridBackdrop } from "@/components/ui/decor";
import { HeroVisual } from "./hero-visual";

export function Hero() {
  return (
    <Section id="top" spacing="lg" className="overflow-hidden pt-32 pb-20 sm:pt-36 md:pt-40 md:pb-24">
      <GridBackdrop />
      <GlowOrb className="-top-32 right-[-14%] size-[36rem] opacity-80" />
      <GlowOrb tone="neutral" className="top-1/4 left-[-18%] size-[28rem]" />
      <GlowOrb className="right-[18%] -bottom-40 size-[26rem] opacity-50 [animation-delay:-6s]" />

      <Container>
        <div className="grid items-center gap-16 lg:grid-cols-[1.02fr_0.98fr] lg:gap-10">
          <div className="flex flex-col items-start gap-7">
            <Reveal variant="scale">
              <Brand className="gap-3" markClassName="size-10 rounded-xl" />
            </Reveal>

            <Reveal>
              <Badge tone="brand">
                <span className="relative flex size-1.5">
                  <span className="absolute inline-flex size-full animate-pulse-ring rounded-full bg-brand-500" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-brand-500" />
                </span>
                Product building studio
              </Badge>
            </Reveal>

            <Reveal delay={0.06}>
              <h1 className="max-w-2xl text-[2.75rem] leading-[1.02] text-balance text-ink sm:text-6xl lg:text-[4.25rem]">
                Digital Products.
                <br />
                <span className="text-gradient">Built to Grow.</span>
              </h1>
            </Reveal>

            <Reveal delay={0.12}>
              <p className="max-w-lg text-lg text-pretty text-ink-muted">
                GROWW TECH builds SaaS platforms, web applications and digital
                experiences — designed, engineered and shipped to keep growing.
              </p>
            </Reveal>

            <Reveal delay={0.18}>
              <div className="flex flex-wrap items-center gap-3">
                <Button href="#products" size="lg">
                  Explore Products
                  <ArrowRight className="size-4 transition-transform duration-300 ease-smooth group-hover:translate-x-0.5" />
                </Button>
                <Button href="#videos" variant="secondary" size="lg">
                  <PlayCircle className="size-4" />
                  Watch Our Work
                </Button>
              </div>
            </Reveal>
          </div>

          <div className="relative">
            <HeroVisual />
          </div>
        </div>
      </Container>
    </Section>
  );
}