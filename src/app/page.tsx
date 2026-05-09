import Link from "next/link";
import { RetroButton } from "@/components/ui/RetroButton";
import { RetroCard } from "@/components/ui/RetroCard";
import { AnimatedTitle } from "./AnimatedTitle";

const features = [
  {
    title: "250+ CHALLENGES",
    description: "Ready to play, no prep needed",
    glow: "purple" as const,
  },
  {
    title: "REAL-TIME BATTLES",
    description: "Live VS screens, tournaments, leaderboards",
    glow: "blue" as const,
  },
  {
    title: "RETRO VIBES",
    description: "16-bit pixel art style with 8-bit sound effects",
    glow: "pink" as const,
  },
];

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-page via-[#0d0d24] to-page pointer-events-none" />

      {/* Floating pixel decorations */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute top-[10%] left-[8%] w-2 h-2 bg-retro-purple-light opacity-60 animate-float" />
        <div
          className="absolute top-[25%] right-[12%] w-3 h-3 bg-retro-blue opacity-40 animate-float"
          style={{ animationDelay: "0.8s" }}
        />
        <div
          className="absolute top-[50%] left-[5%] w-2 h-2 bg-retro-pink opacity-50 animate-float"
          style={{ animationDelay: "1.6s" }}
        />
        <div
          className="absolute top-[65%] right-[7%] w-2 h-2 bg-retro-green opacity-40 animate-float"
          style={{ animationDelay: "2.2s" }}
        />
        <div
          className="absolute top-[80%] left-[15%] w-3 h-3 bg-retro-gold opacity-30 animate-float"
          style={{ animationDelay: "1.2s" }}
        />
        <div
          className="absolute top-[15%] right-[25%] w-1.5 h-1.5 bg-retro-purple opacity-50 animate-float"
          style={{ animationDelay: "0.4s" }}
        />
        <div
          className="absolute top-[40%] left-[20%] w-1.5 h-1.5 bg-retro-gold opacity-40 animate-float"
          style={{ animationDelay: "2.8s" }}
        />
        <div
          className="absolute top-[70%] right-[20%] w-2 h-2 bg-retro-blue opacity-30 animate-float"
          style={{ animationDelay: "1.8s" }}
        />
      </div>

      {/* Main content */}
      <main className="relative z-10 flex flex-col items-center px-4 sm:px-6">
        {/* Hero Section */}
        <section className="flex flex-col items-center justify-center min-h-[70vh] gap-8 pt-16 pb-8">
          <AnimatedTitle />

          <p className="font-body text-retro-muted text-center text-sm sm:text-base max-w-md leading-relaxed">
            Real-time competitive challenges with 16-bit style
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md sm:max-w-none sm:w-auto mt-4">
            <Link href="/host" className="w-full sm:w-auto">
              <RetroButton variant="primary" size="lg" fullWidth className="sm:w-auto sm:min-w-[200px]">
                HOST A GAME
              </RetroButton>
            </Link>
            <Link href="/join" className="w-full sm:w-auto">
              <RetroButton variant="secondary" size="lg" fullWidth className="sm:w-auto sm:min-w-[200px]">
                JOIN A GAME
              </RetroButton>
            </Link>
          </div>
        </section>

        {/* Feature Highlights */}
        <section className="w-full max-w-4xl pb-20">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {features.map((feature) => (
              <RetroCard
                key={feature.title}
                glow={feature.glow}
                padding="lg"
                hoverable
                className="text-center"
              >
                <h3 className="font-retro text-[10px] sm:text-xs text-retro-text mb-3 leading-relaxed">
                  {feature.title}
                </h3>
                <p className="font-body text-retro-muted text-sm leading-relaxed">
                  {feature.description}
                </p>
              </RetroCard>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="w-full text-center pb-8">
          <p className="font-retro text-[8px] text-retro-muted/60 tracking-wider">
            Made with pixels and passion
          </p>
        </footer>
      </main>
    </div>
  );
}
