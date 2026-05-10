"use client";

import { useState, useMemo, useEffect } from "react";
import { cn } from "@/lib/utils";
import { RetroCard } from "@/components/ui/RetroCard";
import { RetroInput } from "@/components/ui/RetroInput";
import { RetroButton } from "@/components/ui/RetroButton";
import type { ChallengeTemplate } from "@/types/challenge";

interface ChallengeLibraryProps {
  challenges: ChallengeTemplate[];
  selectedIds?: string[];
  onToggleSelect?: (id: string) => void;
  selectable?: boolean;
  filters?: boolean;
  eventLocation?: string;
}

const PACK_OPTIONS = [
  { value: "", label: "All Packs" },
  { value: "classroom_funny", label: "Laugh Lab" },
  { value: "classroom_low_noise", label: "Quiet Chaos" },
  { value: "office_fun", label: "Friday Fun" },
  { value: "office_professional", label: "Workshop Boost" },
  { value: "universal", label: "Universal Hype" },
  { value: "recess_riot", label: "Recess Riot" },
];

// Categories matching the actual seed data values
const CATEGORY_OPTIONS = [
  { value: "", label: "All Categories" },
  { value: "Improv", label: "Improv" },
  { value: "Performance", label: "Performance" },
  { value: "Creativity", label: "Creativity" },
  { value: "Social courage", label: "Social Courage" },
  { value: "Teamwork", label: "Teamwork" },
  { value: "Observation", label: "Observation" },
  { value: "Gesture", label: "Gesture" },
  { value: "Quiet creativity", label: "Quiet Creativity" },
  { value: "Memory", label: "Memory" },
  { value: "Communication", label: "Communication" },
  { value: "Leadership", label: "Leadership" },
  { value: "Innovation", label: "Innovation" },
  { value: "Problem-solving", label: "Problem Solving" },
  { value: "Culture", label: "Culture" },
  { value: "Recognition", label: "Recognition" },
  { value: "Presentation", label: "Presentation" },
];

const INTENSITY_OPTIONS = [
  { value: "", label: "All Intensity" },
  { value: "mild", label: "Mild" },
  { value: "bold", label: "Bold" },
  { value: "chaos", label: "Chaos" },
  { value: "legend", label: "Legend" },
];

const MOVEMENT_OPTIONS = [
  { value: "", label: "All Movement" },
  { value: "seated", label: "Seated" },
  { value: "standing", label: "Standing" },
  { value: "light_movement", label: "Light Movement" },
];

const NOISE_OPTIONS = [
  { value: "", label: "All Noise" },
  { value: "quiet", label: "Quiet" },
  { value: "medium", label: "Medium" },
  { value: "loud", label: "Loud" },
];

const LOCATION_FILTER_OPTIONS = [
  { value: "", label: "All Locations" },
  { value: "classroom", label: "Classroom" },
  { value: "park", label: "Park" },
  { value: "restaurant", label: "Restaurant" },
  { value: "home", label: "Home" },
  { value: "beach", label: "Beach" },
  { value: "office", label: "Office" },
];

const INTERACTIVE_FILTER_OPTIONS = [
  { value: "", label: "All Types" },
  { value: "interactive", label: "Interactive Only" },
  { value: "standard", label: "Standard Only" },
];

const AUDIENCE_OPTIONS = [
  { value: "", label: "All Audiences" },
  { value: "classroom", label: "Classroom (Kids)" },
  { value: "office", label: "Office (Adults)" },
  { value: "universal", label: "Universal" },
];

const intensityColors: Record<string, string> = {
  mild: "bg-retro-blue/20 text-retro-blue border-retro-blue/40",
  bold: "bg-retro-purple/20 text-retro-purple-light border-retro-purple/40",
  chaos: "bg-retro-pink/20 text-retro-pink border-retro-pink/40",
  legend: "bg-retro-gold/20 text-retro-gold border-retro-gold/40",
  social: "bg-retro-green/20 text-retro-green border-retro-green/40",
  balanced: "bg-retro-muted/20 text-retro-muted border-retro-muted/40",
  professional: "bg-retro-blue/20 text-retro-blue border-retro-blue/40",
};

const movementIcons: Record<string, string> = {
  seated: "\u{1FA91}",
  standing: "\u{1F9CD}",
  light_movement: "\u{1F3C3}",
};

const noiseIcons: Record<string, string> = {
  quiet: "\u{1F910}",
  medium: "\u{1F5E3}",
  loud: "\u{1F4E2}",
};

// Location constraints: what movement/noise levels are appropriate per location
const LOCATION_CONSTRAINTS: Record<string, { movement: string[]; noise: string[] }> = {
  classroom: { movement: ["seated", "standing"], noise: ["quiet", "medium"] },
  park: { movement: ["seated", "standing", "light_movement"], noise: ["quiet", "medium", "loud"] },
  restaurant: { movement: ["seated"], noise: ["quiet", "medium"] },
  home: { movement: ["seated", "standing", "light_movement"], noise: ["quiet", "medium"] },
  beach: { movement: ["seated", "standing", "light_movement"], noise: ["quiet", "medium", "loud"] },
  office: { movement: ["seated", "standing"], noise: ["quiet", "medium"] },
};

const PAGE_SIZE = 24;

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (val: string) => void;
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-elevated text-retro-text font-retro text-[9px] uppercase tracking-wider px-3 py-2 border border-retro-purple/30 outline-none focus:border-retro-purple transition-colors cursor-pointer appearance-none"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value} className="bg-card">
          {opt.label}
        </option>
      ))}
    </select>
  );
}

export function ChallengeLibrary({
  challenges,
  selectedIds = [],
  onToggleSelect,
  selectable = false,
  filters = true,
  eventLocation,
}: ChallengeLibraryProps) {
  const [search, setSearch] = useState("");
  const [packFilter, setPackFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [intensityFilter, setIntensityFilter] = useState("");
  const [movementFilter, setMovementFilter] = useState("");
  const [noiseFilter, setNoiseFilter] = useState("");
  const [audienceFilter, setAudienceFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState(eventLocation || "");
  const [interactiveFilter, setInteractiveFilter] = useState("");
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    return challenges.filter((c) => {
      if (search && !c.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (packFilter && c.audiencePack !== packFilter) return false;
      if (categoryFilter && c.category !== categoryFilter) return false;
      if (intensityFilter && c.intensityTone !== intensityFilter) return false;
      if (movementFilter && c.movementLevel !== movementFilter) return false;
      if (noiseFilter && c.noiseLevel !== noiseFilter) return false;
      if (audienceFilter && c.audience !== audienceFilter) return false;
      if (interactiveFilter === "interactive" && !c.interactiveData) return false;
      if (interactiveFilter === "standard" && c.interactiveData) return false;
      if (locationFilter) {
        // If challenge is explicitly tagged for a location, check it matches
        const iData = c.interactiveData as Record<string, unknown> | null | undefined;
        if (iData && Array.isArray(iData.locations) && iData.locations.length > 0) {
          if (!iData.locations.includes(locationFilter) && !iData.locations.includes("anywhere")) {
            return false;
          }
        } else {
          // For challenges without explicit location tags, filter by movement/noise constraints
          const constraints = LOCATION_CONSTRAINTS[locationFilter];
          if (constraints) {
            if (!constraints.movement.includes(c.movementLevel)) return false;
            if (!constraints.noise.includes(c.noiseLevel)) return false;
          }
        }
      }
      return true;
    });
  }, [challenges, search, packFilter, categoryFilter, intensityFilter, movementFilter, noiseFilter, audienceFilter, locationFilter, interactiveFilter]);

  // Reset to first page whenever any filter changes
  useEffect(() => {
    setPage(0);
  }, [search, packFilter, categoryFilter, intensityFilter, movementFilter, noiseFilter, audienceFilter, locationFilter, interactiveFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageItems = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="space-y-4">
      {/* Search */}
      {filters && (
        <RetroInput
          placeholder="Search challenges..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
      )}

      {/* Filters */}
      {filters && (
        <div className="flex flex-wrap gap-2">
          <FilterSelect
            label="Audience"
            value={audienceFilter}
            options={AUDIENCE_OPTIONS}
            onChange={setAudienceFilter}
          />
          <FilterSelect
            label="Pack"
            value={packFilter}
            options={PACK_OPTIONS}
            onChange={setPackFilter}
          />
          <FilterSelect
            label="Category"
            value={categoryFilter}
            options={CATEGORY_OPTIONS}
            onChange={setCategoryFilter}
          />
          <FilterSelect
            label="Intensity"
            value={intensityFilter}
            options={INTENSITY_OPTIONS}
            onChange={setIntensityFilter}
          />
          <FilterSelect
            label="Movement"
            value={movementFilter}
            options={MOVEMENT_OPTIONS}
            onChange={setMovementFilter}
          />
          <FilterSelect
            label="Noise"
            value={noiseFilter}
            options={NOISE_OPTIONS}
            onChange={setNoiseFilter}
          />
          <FilterSelect
            label="Location"
            value={locationFilter}
            options={LOCATION_FILTER_OPTIONS}
            onChange={setLocationFilter}
          />
          <FilterSelect
            label="Type"
            value={interactiveFilter}
            options={INTERACTIVE_FILTER_OPTIONS}
            onChange={setInteractiveFilter}
          />
        </div>
      )}

      {/* Selection count + result count */}
      <div className="flex items-center justify-between">
        {selectable && (
          <div className="font-retro text-[10px] text-retro-purple-light">
            {selectedIds.length} CHALLENGE{selectedIds.length !== 1 ? "S" : ""} SELECTED
          </div>
        )}
        <div className="font-retro text-[10px] text-retro-muted">
          {filtered.length} RESULT{filtered.length !== 1 ? "S" : ""}
        </div>
      </div>

      {/* Challenge grid */}
      {pageItems.length === 0 ? (
        <div className="text-center py-12">
          <p className="font-retro text-xs text-retro-muted">NO CHALLENGES FOUND</p>
          <p className="font-body text-sm text-retro-muted/60 mt-2">
            Try adjusting your filters
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {pageItems.map((challenge) => {
            const isSelected = selectedIds.includes(challenge.id);
            const intensity = intensityColors[challenge.intensityTone] || intensityColors.balanced;

            return (
              <RetroCard
                key={challenge.id}
                glow={isSelected ? "green" : "none"}
                hoverable={selectable}
                padding="sm"
                className={cn(
                  "relative transition-all duration-200",
                  selectable && "cursor-pointer",
                  isSelected && "ring-1 ring-retro-green/50"
                )}
              >
                <div
                  onClick={() => selectable && onToggleSelect?.(challenge.id)}
                  className="space-y-2"
                >
                  {/* Selection indicator */}
                  {selectable && (
                    <div
                      className={cn(
                        "absolute top-2 right-2 w-5 h-5 flex items-center justify-center text-[10px] font-retro border transition-all",
                        isSelected
                          ? "bg-retro-green/20 border-retro-green text-retro-green"
                          : "bg-elevated border-retro-muted/30 text-transparent"
                      )}
                    >
                      {isSelected ? "\u2713" : ""}
                    </div>
                  )}

                  {/* Title */}
                  <h3 className="font-retro text-[10px] text-retro-text pr-6 leading-relaxed">
                    {challenge.title}
                  </h3>

                  {/* Description */}
                  <p className="font-body text-xs text-retro-muted/80 line-clamp-2">
                    {challenge.shortDescription}
                  </p>

                  {/* Badges row */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="font-retro text-[7px] px-1.5 py-0.5 bg-elevated text-retro-muted border border-retro-muted/20">
                      {challenge.durationSeconds}s
                    </span>
                    <span className="font-retro text-[7px] px-1.5 py-0.5 bg-elevated text-retro-muted border border-retro-muted/20">
                      {movementIcons[challenge.movementLevel] || ""}{" "}
                      {challenge.movementLevel.replace(/_/g, " ")}
                    </span>
                    <span className="font-retro text-[7px] px-1.5 py-0.5 bg-elevated text-retro-muted border border-retro-muted/20">
                      {noiseIcons[challenge.noiseLevel] || ""} {challenge.noiseLevel}
                    </span>
                    <span className="font-retro text-[7px] px-1.5 py-0.5 bg-elevated text-retro-muted border border-retro-muted/20">
                      {challenge.submissionType.replace(/_/g, " ")}
                    </span>
                  </div>

                  {/* Category + intensity + audience tags */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-retro text-[7px] px-1.5 py-0.5 bg-retro-purple/10 text-retro-purple-light border border-retro-purple/30 capitalize">
                      {challenge.category}
                    </span>
                    <span
                      className={cn(
                        "font-retro text-[7px] px-1.5 py-0.5 border capitalize",
                        intensity
                      )}
                    >
                      {challenge.intensityTone}
                    </span>
                    <span className="font-retro text-[7px] px-1.5 py-0.5 bg-retro-green/10 text-retro-green border border-retro-green/30 capitalize">
                      {challenge.audience}
                    </span>
                    {challenge.interactiveData && (
                      <span className="font-retro text-[7px] px-1.5 py-0.5 bg-retro-pink/10 text-retro-pink border border-retro-pink/30 uppercase">
                        {challenge.interactiveData.type.replace(/_/g, " ")}
                      </span>
                    )}
                  </div>
                </div>
              </RetroCard>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <RetroButton
            variant="secondary"
            size="sm"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            PREV
          </RetroButton>
          <span className="font-retro text-[10px] text-retro-muted tabular-nums">
            {page + 1} / {totalPages}
          </span>
          <RetroButton
            variant="secondary"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
          >
            NEXT
          </RetroButton>
        </div>
      )}
    </div>
  );
}
