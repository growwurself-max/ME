import { ArrowRight, PlayCircle } from "lucide-react";
import { siteConfig } from "@/config/site";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, GlassCard } from "@/components/ui/card";
import { Container, Section } from "@/components/ui/container";
import { GlowOrb, GridBackdrop } from "@/components/ui/decor";
import { SectionHeading } from "@/components/ui/section-heading";

function Placeholder({
  id,
  eyebrow,
  title,
  description,
}: {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <Section id={id} tone="canvas" spacing="md" className="border-t border-line">
      <Container>
        <Reveal>
          <SectionHeading eyebrow={eyebrow} title={title} description={description} />
        </Reveal>

        <RevealGroup className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {["One", "Two", "Three"].map((slot) => (
            <RevealItem key={slot}>
              <Card className="flex min-h-44 flex-col justify-between gap-6 border-dashed p-6">
                <div className="flex items-center justify-between">
                  <Badge>{`Slot ${slot}`}</Badge>
                  <span className="font-mono text-2xs tracking-widest text-ink-faint uppercase">
                    Empty
                  </span>
                </div>
                <p className="text-sm text-ink-subtle">
                  Reserved for real content. Nothing is published here yet.
                </p>
              </Card>
            </RevealItem>
          ))}
        </RevealGroup>
      </Container>
    </Section>
  );
}

export default function Home() {
  return (
    <>
      <Section id="top" spacing="lg" className="overflow-hidden pt-36 pb-24 md:pt-44">
        <GridBackdrop />
        <GlowOrb className="-top-24 right-[-10%] size-[34rem]" />
        <GlowOrb tone="neutral" className="top-1/3 left-[-14%] size-[26rem]" />

        <Container>
          <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="flex flex-col items-start gap-7">
              <Reveal variant="scale">
                <Badge tone="brand">
                  <span className="relative flex size-1.5">
                    <span className="absolute inline-flex size-full animate-pulse-ring rounded-full bg-brand-500" />
                    <span className="relative inline-flex size-1.5 rounded-full bg-brand-500" />
                  </span>
                  {siteConfig.tagline}
                </Badge>
              </Reveal>

              <Reveal>
                <h1 className="max-w-2xl text-5xl text-balance text-ink sm:text-6xl lg:text-7xl">
                  We build{" "}
                  <span className="text-gradient">products that ship</span>{" "}
                  in public.
                </h1>
              </Reveal>

              <Reveal delay={0.08}>
                <p className="max-w-xl text-lg text-pretty text-ink-muted">
                  {siteConfig.description}
                </p>
              </Reveal>

              <Reveal delay={0.16}>
                <div className="flex flex-wrap items-center gap-3">
                  <Button href="#platforms" size="lg">
                    Explore the work
                    <ArrowRight className="size-4 transition-transform duration-300 ease-smooth group-hover:translate-x-0.5" />
                  </Button>
                  <Button href="#videos" variant="secondary" size="lg">
                    <PlayCircle className="size-4" />
                    Watch videos
                  </Button>
                </div>
              </Reveal>
            </div>

            <Reveal variant="scale" delay={0.1}>
              <GlassCard className="p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <Badge tone="glass">Showcase slot</Badge>
                  <span className="font-mono text-2xs tracking-widest text-ink-faint uppercase">
                    Awaiting content
                  </span>
                </div>

                <div className="mt-8 space-y-3">
                  <div className="h-3 w-2/3 rounded-pill bg-canvas-deep" />
                  <div className="h-3 w-full rounded-pill bg-canvas-deep/70" />
                  <div className="h-3 w-5/6 rounded-pill bg-canvas-deep/70" />
                </div>

                <div className="mt-8 grid grid-cols-3 gap-3">
                  {["SaaS", "Web", "Video"].map((label) => (
                    <div
                      key={label}
                      className="rounded-xl border border-line bg-surface/70 px-3 py-4 text-center text-2xs font-medium tracking-wide text-ink-subtle uppercase"
                    >
                      {label}
                    </div>
                  ))}
                </div>
              </GlassCard>
            </Reveal>
          </div>
        </Container>
      </Section>

      <Placeholder
        id="platforms"
        eyebrow="Platforms"
        title="SaaS platforms and websites"
        description="Production products built, shipped and maintained by the studio."
      />
      <Placeholder
        id="experiments"
        eyebrow="Experiments"
        title="Experiments and demos"
        description="Small, sharp ideas we test in public before they become products."
      />
      <Placeholder
        id="videos"
        eyebrow="Videos"
        title="Studio videos"
        description="Walkthroughs, build logs and product explainers."
      />
      <Placeholder
        id="studio"
        eyebrow="Studio"
        title="About GROWW TECH"
        description="How the studio works, what we specialise in and how to reach us."
      />
    </>
  );
}
