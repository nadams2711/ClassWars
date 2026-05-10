"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { RetroButton } from "@/components/ui/RetroButton";
import { RetroCard } from "@/components/ui/RetroCard";
import { RetroInput } from "@/components/ui/RetroInput";
import { EventWizard } from "@/components/host/EventWizard";
import { ChallengeLibrary } from "@/components/host/ChallengeLibrary";
import { cn } from "@/lib/utils";
import type { ChallengeTemplate } from "@/types/challenge";

type Audience = "classroom" | "office" | "universal";
type Mode = "quick_play" | "pack_play" | "tournament";
type LocationType = "anywhere" | "classroom" | "park" | "restaurant" | "home" | "beach" | "office";

interface PackInfo {
  id: string;
  name: string;
  description: string;
  icon: string;
  challengeCount: number;
  color: string;
}

const AUDIENCE_OPTIONS: { value: Audience; label: string; icon: string }[] = [
  { value: "classroom", label: "Classroom", icon: "\u{1F3EB}" },
  { value: "office", label: "Office", icon: "\u{1F3E2}" },
  { value: "universal", label: "Universal", icon: "\u{1F30D}" },
];

const MODE_OPTIONS: { value: Mode; label: string; description: string; icon: string }[] = [
  {
    value: "quick_play",
    label: "Quick Play",
    description: "Pick individual challenges",
    icon: "\u26A1",
  },
  {
    value: "pack_play",
    label: "Pack Play",
    description: "Use a pre-built pack",
    icon: "\u{1F4E6}",
  },
  {
    value: "tournament",
    label: "Tournament",
    description: "Bracket elimination",
    icon: "\u{1F3C6}",
  },
];

const GLOW_COLORS: Record<string, "pink" | "blue" | "gold" | "green" | "purple"> = {
  "retro-pink": "pink",
  "retro-blue": "blue",
  "retro-gold": "gold",
  "retro-green": "green",
  "retro-purple": "purple",
};

const ICON_EMOJI: Record<string, string> = {
  laugh: "\u{1F923}",
  "volume-x": "\u{1F910}",
  "party-popper": "\u{1F389}",
  briefcase: "\u{1F4BC}",
  zap: "\u26A1",
  rocket: "\u{1F680}",
};

function packIcon(icon: string | null | undefined): string {
  if (!icon) return "\u{1F3AE}";
  return ICON_EMOJI[icon] || icon;
}

const LOCATION_OPTIONS: { value: LocationType; label: string; icon: string }[] = [
  { value: "anywhere", label: "Anywhere", icon: "\u{1F30D}" },
  { value: "classroom", label: "Classroom", icon: "\u{1F3EB}" },
  { value: "park", label: "Park", icon: "\u{1F333}" },
  { value: "restaurant", label: "Restaurant", icon: "\u{1F37D}" },
  { value: "home", label: "Home", icon: "\u{1F3E0}" },
  { value: "beach", label: "Beach", icon: "\u{1F3D6}" },
  { value: "office", label: "Office", icon: "\u{1F3E2}" },
];

const BRACKET_SIZES = [8, 16, 32];

export default function CreateEventPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1: Basics
  const [eventName, setEventName] = useState("");
  const [audience, setAudience] = useState<Audience>("universal");
  const [mode, setMode] = useState<Mode>("quick_play");
  const [teamMode, setTeamMode] = useState(false);
  const [teamCount, setTeamCount] = useState(2);
  const [location, setLocation] = useState<LocationType>("anywhere");

  // Step 2: Challenges
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null);
  const [selectedChallengeIds, setSelectedChallengeIds] = useState<string[]>([]);
  const [bracketSize, setBracketSize] = useState(16);
  const [challenges, setChallenges] = useState<ChallengeTemplate[]>([]);
  const [packs, setPacks] = useState<PackInfo[]>([]);
  const [loadingChallenges, setLoadingChallenges] = useState(false);
  const [loadingPacks, setLoadingPacks] = useState(false);

  // Step 3: Launch
  const [maxParticipants, setMaxParticipants] = useState(50);

  // Fetch challenges when entering step 2 in quick_play or tournament mode
  useEffect(() => {
    if (step === 2 && (mode === "quick_play" || mode === "tournament")) {
      setLoadingChallenges(true);
      fetch("/api/challenges")
        .then((res) => res.json())
        .then((data) => setChallenges(data))
        .catch(() => setChallenges([]))
        .finally(() => setLoadingChallenges(false));
    }
    if (step === 2 && mode === "pack_play" && packs.length === 0) {
      setLoadingPacks(true);
      fetch("/api/packs")
        .then((res) => res.json())
        .then((data) => setPacks(data))
        .catch(() => setPacks([]))
        .finally(() => setLoadingPacks(false));
    }
  }, [step, mode]);

  const handleToggleChallenge = (id: string) => {
    setSelectedChallengeIds((prev) =>
      prev.includes(id) ? prev.filter((cId) => cId !== id) : [...prev, id]
    );
  };

  const canAdvanceStep1 = eventName.trim().length > 0;
  const canAdvanceStep2 =
    mode === "pack_play"
      ? selectedPackId !== null
      : selectedChallengeIds.length > 0;
  const canAdvanceStep3 = maxParticipants >= 2;

  const canAdvance =
    step === 1
      ? canAdvanceStep1
      : step === 2
        ? canAdvanceStep2
        : canAdvanceStep3;

  const handleNext = async () => {
    if (step < 3) {
      setStep(step + 1);
      return;
    }

    // Step 3: Launch the game
    setIsSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        name: eventName.trim(),
        mode,
        audience,
        teamMode,
        teamCount: teamMode ? teamCount : undefined,
        maxParticipants,
        settings: { location },
      };

      if (mode === "pack_play" && selectedPackId) {
        body.packId = selectedPackId;
      } else {
        body.challengeIds = selectedChallengeIds;
      }

      if (mode === "tournament") {
        body.bracketSize = bracketSize;
      }

      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        throw new Error("Failed to create event");
      }

      const event = await res.json();
      router.push(`/host/control/${event.id}`);
    } catch {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  // Compute summary for step 3
  const challengeCount =
    mode === "pack_play"
      ? packs.find((p) => p.id === selectedPackId)?.challengeCount || 0
      : selectedChallengeIds.length;

  const selectedPackName =
    mode === "pack_play"
      ? packs.find((p) => p.id === selectedPackId)?.name || ""
      : "";

  return (
    <div className="min-h-screen bg-page">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <h1 className="font-retro text-lg md:text-xl text-center text-retro-purple-light mb-1 drop-shadow-[0_0_20px_rgba(168,85,247,0.4)]">
          CREATE GAME
        </h1>
        <div className="h-px bg-gradient-to-r from-transparent via-retro-purple to-transparent mb-6" />

        <EventWizard
          currentStep={step}
          totalSteps={3}
          onNext={handleNext}
          onBack={handleBack}
          canAdvance={canAdvance}
          isSubmitting={isSubmitting}
        >
          {/* ─── STEP 1: BASICS ─── */}
          {step === 1 && (
            <div className="space-y-8">
              {/* Event name */}
              <div>
                <RetroInput
                  label="Event Name"
                  placeholder="Friday Fun Battle"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  maxLength={60}
                />
              </div>

              {/* Audience selector */}
              <div>
                <p className="font-retro text-[10px] uppercase tracking-wider text-retro-muted mb-3">
                  Audience
                </p>
                <div className="flex gap-3">
                  {AUDIENCE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setAudience(opt.value)}
                      className={cn(
                        "flex-1 flex flex-col items-center gap-2 py-4 px-3 border-2 transition-all duration-200 font-retro text-[10px] uppercase",
                        audience === opt.value
                          ? "border-retro-purple bg-retro-purple/10 text-retro-purple-light shadow-[0_0_16px_rgba(168,85,247,0.2)]"
                          : "border-retro-muted/20 bg-elevated text-retro-muted hover:border-retro-muted/40"
                      )}
                    >
                      <span className="text-2xl">{opt.icon}</span>
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Mode selector */}
              <div>
                <p className="font-retro text-[10px] uppercase tracking-wider text-retro-muted mb-3">
                  Game Mode
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {MODE_OPTIONS.map((opt) => (
                    <RetroCard
                      key={opt.value}
                      glow={mode === opt.value ? "purple" : "none"}
                      hoverable
                      padding="md"
                      className={cn(
                        "cursor-pointer transition-all",
                        mode === opt.value && "ring-1 ring-retro-purple/50"
                      )}
                    >
                      <div
                        onClick={() => setMode(opt.value)}
                        className="text-center space-y-2"
                      >
                        <span className="text-3xl">{opt.icon}</span>
                        <h3
                          className={cn(
                            "font-retro text-[10px] uppercase",
                            mode === opt.value
                              ? "text-retro-purple-light"
                              : "text-retro-text"
                          )}
                        >
                          {opt.label}
                        </h3>
                        <p className="font-body text-xs text-retro-muted">
                          {opt.description}
                        </p>
                      </div>
                    </RetroCard>
                  ))}
                </div>
              </div>

              {/* Team mode toggle */}
              <div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-retro text-[10px] uppercase tracking-wider text-retro-muted">
                      Team Mode
                    </p>
                    <p className="font-body text-xs text-retro-muted/60 mt-1">
                      Split players into competing teams
                    </p>
                  </div>
                  <button
                    onClick={() => setTeamMode(!teamMode)}
                    className={cn(
                      "relative w-14 h-7 rounded-full transition-all duration-300 border-2",
                      teamMode
                        ? "bg-retro-purple/30 border-retro-purple"
                        : "bg-elevated border-retro-muted/30"
                    )}
                  >
                    <div
                      className={cn(
                        "absolute top-0.5 w-5 h-5 rounded-full transition-all duration-300",
                        teamMode
                          ? "left-7 bg-retro-purple-light shadow-[0_0_8px_rgba(168,85,247,0.5)]"
                          : "left-0.5 bg-retro-muted"
                      )}
                    />
                  </button>
                </div>
              </div>

              {/* Team count selector (visible when team mode is on) */}
              {teamMode && (
                <div>
                  <p className="font-retro text-[10px] uppercase tracking-wider text-retro-muted mb-3">
                    Number of Teams
                  </p>
                  <div className="flex gap-3">
                    {[2, 3, 4].map((count) => (
                      <button
                        key={count}
                        onClick={() => setTeamCount(count)}
                        className={cn(
                          "flex-1 py-3 font-retro text-xs border-2 transition-all",
                          teamCount === count
                            ? "border-retro-purple bg-retro-purple/10 text-retro-purple-light shadow-[0_0_12px_rgba(168,85,247,0.2)]"
                            : "border-retro-muted/20 bg-elevated text-retro-muted hover:border-retro-muted/40"
                        )}
                      >
                        {count} Teams
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Location selector */}
              <div>
                <p className="font-retro text-[10px] uppercase tracking-wider text-retro-muted mb-3">
                  Location
                </p>
                <p className="font-body text-xs text-retro-muted/60 mb-3">
                  Filter challenges suited to your setting
                </p>
                <div className="flex flex-wrap gap-2">
                  {LOCATION_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setLocation(opt.value)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-2 border-2 transition-all duration-200 font-retro text-[9px] uppercase",
                        location === opt.value
                          ? "border-retro-green bg-retro-green/10 text-retro-green shadow-[0_0_12px_rgba(57,255,20,0.15)]"
                          : "border-retro-muted/20 bg-elevated text-retro-muted hover:border-retro-muted/40"
                      )}
                    >
                      <span className="text-base">{opt.icon}</span>
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ─── STEP 2: CHALLENGES ─── */}
          {step === 2 && (
            <div className="space-y-6">
              {/* Pack Play mode */}
              {mode === "pack_play" && (
                <div>
                  <p className="font-retro text-[10px] uppercase tracking-wider text-retro-muted mb-4">
                    Choose a Challenge Pack
                  </p>
                  {loadingPacks ? (
                    <div className="text-center py-12">
                      <p className="font-retro text-xs text-retro-purple-light animate-pulse">
                        LOADING PACKS...
                      </p>
                    </div>
                  ) : packs.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="font-retro text-xs text-retro-muted">
                        No packs available. Try Quick Play instead.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {packs.map((pack) => {
                        const isSelected = selectedPackId === pack.id;
                        return (
                          <RetroCard
                            key={pack.id}
                            glow={isSelected ? "green" : "none"}
                            hoverable
                            padding="md"
                            className={cn(
                              "cursor-pointer",
                              isSelected && "ring-1 ring-retro-green/50"
                            )}
                          >
                            <div
                              onClick={() => setSelectedPackId(isSelected ? null : pack.id)}
                              className="text-center space-y-2"
                            >
                              <span className="text-4xl">{packIcon(pack.icon)}</span>
                              <h3
                                className={cn(
                                  "font-retro text-[10px] uppercase",
                                  isSelected
                                    ? "text-retro-green"
                                    : "text-retro-text"
                                )}
                              >
                                {pack.name}
                              </h3>
                              <p className="font-body text-xs text-retro-muted">
                                {pack.description}
                              </p>
                              <span className="inline-block font-retro text-[8px] px-2 py-0.5 bg-elevated border border-retro-muted/20 text-retro-muted">
                                {pack.challengeCount} CHALLENGES
                              </span>
                              {isSelected && (
                                <div className="font-retro text-[9px] text-retro-green">
                                  SELECTED {"\u2713"}
                                </div>
                              )}
                            </div>
                          </RetroCard>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Quick Play mode */}
              {mode === "quick_play" && (
                <div>
                  <p className="font-retro text-[10px] uppercase tracking-wider text-retro-muted mb-4">
                    Pick Your Challenges
                  </p>
                  {loadingChallenges ? (
                    <div className="text-center py-12">
                      <p className="font-retro text-xs text-retro-purple-light animate-pulse">
                        LOADING CHALLENGES...
                      </p>
                    </div>
                  ) : (
                    <ChallengeLibrary
                      challenges={challenges}
                      selectedIds={selectedChallengeIds}
                      onToggleSelect={handleToggleChallenge}
                      selectable
                      filters
                      eventLocation={location !== "anywhere" ? location : undefined}
                    />
                  )}
                </div>
              )}

              {/* Tournament mode */}
              {mode === "tournament" && (
                <div className="space-y-6">
                  {/* Bracket size */}
                  <div>
                    <p className="font-retro text-[10px] uppercase tracking-wider text-retro-muted mb-3">
                      Bracket Size
                    </p>
                    <div className="flex gap-3">
                      {BRACKET_SIZES.map((size) => (
                        <button
                          key={size}
                          onClick={() => setBracketSize(size)}
                          className={cn(
                            "flex-1 py-3 font-retro text-xs border-2 transition-all",
                            bracketSize === size
                              ? "border-retro-gold bg-retro-gold/10 text-retro-gold shadow-[0_0_12px_rgba(255,215,0,0.2)]"
                              : "border-retro-muted/20 bg-elevated text-retro-muted hover:border-retro-muted/40"
                          )}
                        >
                          {size} Players
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Challenge picker */}
                  <div>
                    <p className="font-retro text-[10px] uppercase tracking-wider text-retro-muted mb-4">
                      Pick Challenges for Each Round
                    </p>
                    {loadingChallenges ? (
                      <div className="text-center py-12">
                        <p className="font-retro text-xs text-retro-purple-light animate-pulse">
                          LOADING CHALLENGES...
                        </p>
                      </div>
                    ) : (
                      <ChallengeLibrary
                        challenges={challenges}
                        selectedIds={selectedChallengeIds}
                        onToggleSelect={handleToggleChallenge}
                        selectable
                        filters
                        eventLocation={location !== "anywhere" ? location : undefined}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── STEP 3: LAUNCH ─── */}
          {step === 3 && (
            <div className="max-w-lg mx-auto space-y-6">
              {/* Event summary */}
              <RetroCard glow="purple" padding="lg">
                <h3 className="font-retro text-xs text-retro-purple-light mb-4 text-center">
                  EVENT SUMMARY
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-retro text-[9px] text-retro-muted uppercase">
                      Name
                    </span>
                    <span className="font-body text-sm text-retro-text">
                      {eventName}
                    </span>
                  </div>
                  <div className="h-px bg-retro-purple/10" />

                  <div className="flex justify-between items-center">
                    <span className="font-retro text-[9px] text-retro-muted uppercase">
                      Mode
                    </span>
                    <span className="font-body text-sm text-retro-text capitalize">
                      {mode.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="h-px bg-retro-purple/10" />

                  <div className="flex justify-between items-center">
                    <span className="font-retro text-[9px] text-retro-muted uppercase">
                      Audience
                    </span>
                    <span className="font-body text-sm text-retro-text capitalize">
                      {audience}
                    </span>
                  </div>
                  <div className="h-px bg-retro-purple/10" />

                  <div className="flex justify-between items-center">
                    <span className="font-retro text-[9px] text-retro-muted uppercase">
                      Team Mode
                    </span>
                    <span
                      className={cn(
                        "font-retro text-[9px]",
                        teamMode ? "text-retro-green" : "text-retro-muted"
                      )}
                    >
                      {teamMode ? `ON (${teamCount} teams)` : "OFF"}
                    </span>
                  </div>
                  <div className="h-px bg-retro-purple/10" />

                  <div className="flex justify-between items-center">
                    <span className="font-retro text-[9px] text-retro-muted uppercase">
                      Challenges
                    </span>
                    <span className="font-body text-sm text-retro-text">
                      {challengeCount}{" "}
                      {mode === "pack_play" && selectedPackName
                        ? `(${selectedPackName})`
                        : ""}
                    </span>
                  </div>

                  {mode === "tournament" && (
                    <>
                      <div className="h-px bg-retro-purple/10" />
                      <div className="flex justify-between items-center">
                        <span className="font-retro text-[9px] text-retro-muted uppercase">
                          Bracket Size
                        </span>
                        <span className="font-body text-sm text-retro-text">
                          {bracketSize}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </RetroCard>

              {/* Max participants */}
              <div>
                <RetroInput
                  label="Max Participants"
                  type="number"
                  min={2}
                  max={200}
                  value={maxParticipants}
                  onChange={(e) =>
                    setMaxParticipants(
                      Math.max(2, parseInt(e.target.value) || 2)
                    )
                  }
                />
                <p className="font-body text-xs text-retro-muted/60 mt-1">
                  Maximum number of players who can join (2-200)
                </p>
              </div>

              {/* Launch info */}
              <div className="text-center">
                <p className="font-body text-sm text-retro-muted">
                  A unique join code will be generated. Share it with your
                  players to start the battle!
                </p>
              </div>
            </div>
          )}
        </EventWizard>
      </div>
    </div>
  );
}
