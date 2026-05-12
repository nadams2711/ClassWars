"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { RetroButton } from "@/components/ui/RetroButton";
import { RetroCard } from "@/components/ui/RetroCard";
import { RetroInput } from "@/components/ui/RetroInput";
import { ScanlineOverlay } from "@/components/ui/ScanlineOverlay";
import { cn } from "@/lib/utils";

interface Challenge {
  id: string;
  title: string;
  shortDescription: string | null;
  fullInstructions: string | null;
  audience: string | null;
  audiencePack: string | null;
  category: string | null;
  intensityTone: string | null;
  durationSeconds: number;
  movementLevel: string;
  noiseLevel: string;
  submissionType: string;
  scoringType: string;
  safetyFlags: string[];
  isSystem: boolean;
  interactiveData: unknown;
  isSimultaneous: boolean;
}

type EditingChallenge = Partial<Challenge> & { id?: string };

const AUDIENCE_OPTIONS = ["classroom", "office", "universal"];
const AUDIENCE_PACK_OPTIONS = [
  "classroom_funny",
  "classroom_low_noise",
  "office_fun",
  "office_professional",
  "universal",
  "recess_riot",
];
const INTENSITY_OPTIONS = ["chill", "balanced", "high-energy"];
const MOVEMENT_OPTIONS = ["seated", "standing", "active"];
const NOISE_OPTIONS = ["quiet", "medium", "loud"];
const SUBMISSION_TYPE_OPTIONS = [
  "completion_tap",
  "text",
  "photo",
  "judge",
  "vote",
  "hybrid",
];
const SCORING_TYPE_OPTIONS = ["completion", "speed", "judge", "vote", "hybrid"];

const DURATION_PRESETS = [30, 60, 90, 120, 180];

export default function AdminChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingChallenge, setEditingChallenge] = useState<EditingChallenge | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchChallenges = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/challenges");
      if (res.ok) {
        setChallenges(await res.json());
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  const filteredChallenges = challenges.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = () => {
    setEditingChallenge({
      title: "",
      shortDescription: "",
      fullInstructions: "",
      audience: "universal",
      audiencePack: "universal",
      category: "Creativity",
      intensityTone: "balanced",
      durationSeconds: 60,
      movementLevel: "seated",
      noiseLevel: "quiet",
      submissionType: "completion_tap",
      scoringType: "completion",
      safetyFlags: [],
      isSystem: false,
      isSimultaneous: false,
    });
    setIsCreating(true);
  };

  const handleEdit = (challenge: Challenge) => {
    setEditingChallenge({ ...challenge });
    setIsCreating(false);
  };

  const handleSave = async () => {
    if (!editingChallenge || !editingChallenge.title?.trim()) return;
    setSaving(true);
    try {
      if (isCreating) {
        const res = await fetch("/api/admin/challenges", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editingChallenge),
        });
        if (res.ok) {
          setEditingChallenge(null);
          setIsCreating(false);
          await fetchChallenges();
        }
      } else if (editingChallenge.id) {
        const res = await fetch(`/api/admin/challenges/${editingChallenge.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editingChallenge),
        });
        if (res.ok) {
          setEditingChallenge(null);
          await fetchChallenges();
        }
      }
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/challenges/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDeleteConfirmId(null);
        await fetchChallenges();
      }
    } catch {
      // ignore
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const res = await fetch("/api/admin/challenges/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        await fetchChallenges();
      }
    } catch {
      // ignore
    }
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleExport = () => {
    window.open("/api/admin/challenges/export", "_blank");
  };

  const handleDownloadTemplate = () => {
    const template = [
      {
        title: "Example Challenge",
        shortDescription: "A one-line summary shown in previews",
        fullInstructions: "Detailed rules displayed when the challenge starts.",
        audience: "universal",
        audiencePack: "universal",
        category: "Creativity",
        intensityTone: "balanced",
        durationSeconds: 60,
        movementLevel: "seated",
        noiseLevel: "quiet",
        submissionType: "completion_tap",
        scoringType: "completion",
        safetyFlags: [],
        isSystem: false,
        isSimultaneous: false,
        interactiveData: null,
      },
    ];
    const blob = new Blob([JSON.stringify(template, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "challenges-template.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const updateField = (field: string, value: unknown) => {
    setEditingChallenge((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  return (
    <div className="min-h-screen bg-page relative">
      <ScanlineOverlay />

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <h1
          className="font-retro text-lg md:text-xl text-center text-retro-purple-light mb-1"
          style={{ textShadow: "0 0 20px rgba(168,85,247,0.4)" }}
        >
          CHALLENGE ADMIN
        </h1>
        <div className="h-px bg-gradient-to-r from-transparent via-retro-purple to-transparent mb-6" />

        {/* Action bar */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImport}
          />
          <RetroButton
            variant="secondary"
            size="md"
            onClick={handleDownloadTemplate}
          >
            TEMPLATE
          </RetroButton>
          <RetroButton
            variant="secondary"
            size="md"
            onClick={() => fileInputRef.current?.click()}
          >
            IMPORT
          </RetroButton>
          <RetroButton variant="secondary" size="md" onClick={handleExport}>
            EXPORT
          </RetroButton>
          <div className="flex-1" />
          <button
            onClick={() => setShowHelp(true)}
            className="w-8 h-8 flex items-center justify-center font-retro text-xs border-2 border-retro-purple/40 bg-elevated text-retro-purple-light hover:border-retro-purple hover:bg-retro-purple/10 transition-all"
            title="Field reference"
          >
            ?
          </button>
          <RetroButton variant="success" size="md" onClick={handleCreate}>
            + NEW CHALLENGE
          </RetroButton>
        </div>

        {/* Search */}
        <div className="mb-6">
          <RetroInput
            placeholder="Search challenges..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Edit / Create form */}
        {editingChallenge && (
          <RetroCard glow="blue" padding="lg" className="mb-6">
            <div className="space-y-4">
              <h3 className="font-retro text-xs text-retro-blue text-center uppercase">
                {isCreating ? "NEW CHALLENGE" : "EDIT CHALLENGE"}
              </h3>

              <RetroInput
                label="Title"
                value={editingChallenge.title || ""}
                onChange={(e) => updateField("title", e.target.value)}
                maxLength={120}
              />

              <RetroInput
                label="Short Description"
                value={editingChallenge.shortDescription || ""}
                onChange={(e) => updateField("shortDescription", e.target.value)}
                maxLength={200}
              />

              <div>
                <label className="block font-retro text-[10px] uppercase tracking-wider text-retro-muted mb-2">
                  Full Instructions
                </label>
                <textarea
                  value={editingChallenge.fullInstructions || ""}
                  onChange={(e) => updateField("fullInstructions", e.target.value)}
                  rows={3}
                  maxLength={1000}
                  className="w-full px-3 py-2 bg-elevated border-2 border-retro-muted/20 text-retro-text font-body text-sm placeholder:text-retro-muted/40 focus:border-retro-blue focus:outline-none transition-colors resize-none"
                />
              </div>

              {/* Audience */}
              <div>
                <label className="block font-retro text-[10px] uppercase tracking-wider text-retro-muted mb-2">
                  Audience
                </label>
                <div className="flex gap-2">
                  {AUDIENCE_OPTIONS.map((a) => (
                    <button
                      key={a}
                      onClick={() => updateField("audience", a)}
                      className={cn(
                        "flex-1 py-2 font-retro text-[10px] border-2 transition-all uppercase",
                        editingChallenge.audience === a
                          ? "border-retro-blue bg-retro-blue/10 text-retro-blue"
                          : "border-retro-muted/20 bg-elevated text-retro-muted hover:border-retro-muted/40"
                      )}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>

              {/* Audience Pack */}
              <div>
                <label className="block font-retro text-[10px] uppercase tracking-wider text-retro-muted mb-2">
                  Audience Pack
                </label>
                <select
                  value={editingChallenge.audiencePack || "universal"}
                  onChange={(e) => updateField("audiencePack", e.target.value)}
                  className="w-full px-3 py-2 bg-elevated border-2 border-retro-muted/20 text-retro-text font-body text-sm focus:border-retro-blue focus:outline-none transition-colors"
                >
                  {AUDIENCE_PACK_OPTIONS.map((ap) => (
                    <option key={ap} value={ap}>
                      {ap.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category */}
              <RetroInput
                label="Category"
                value={editingChallenge.category || ""}
                onChange={(e) => updateField("category", e.target.value)}
                maxLength={60}
              />

              {/* Duration */}
              <div>
                <label className="block font-retro text-[10px] uppercase tracking-wider text-retro-muted mb-2">
                  Duration (seconds)
                </label>
                <div className="flex gap-2">
                  {DURATION_PRESETS.map((d) => (
                    <button
                      key={d}
                      onClick={() => updateField("durationSeconds", d)}
                      className={cn(
                        "flex-1 py-2 font-retro text-[10px] border-2 transition-all",
                        editingChallenge.durationSeconds === d
                          ? "border-retro-blue bg-retro-blue/10 text-retro-blue"
                          : "border-retro-muted/20 bg-elevated text-retro-muted hover:border-retro-muted/40"
                      )}
                    >
                      {d}s
                    </button>
                  ))}
                </div>
              </div>

              {/* Intensity Tone */}
              <div>
                <label className="block font-retro text-[10px] uppercase tracking-wider text-retro-muted mb-2">
                  Intensity
                </label>
                <select
                  value={editingChallenge.intensityTone || "balanced"}
                  onChange={(e) => updateField("intensityTone", e.target.value)}
                  className="w-full px-3 py-2 bg-elevated border-2 border-retro-muted/20 text-retro-text font-body text-sm focus:border-retro-blue focus:outline-none transition-colors"
                >
                  {INTENSITY_OPTIONS.map((i) => (
                    <option key={i} value={i}>{i}</option>
                  ))}
                </select>
              </div>

              {/* Movement Level */}
              <div>
                <label className="block font-retro text-[10px] uppercase tracking-wider text-retro-muted mb-2">
                  Movement Level
                </label>
                <div className="flex gap-2">
                  {MOVEMENT_OPTIONS.map((m) => (
                    <button
                      key={m}
                      onClick={() => updateField("movementLevel", m)}
                      className={cn(
                        "flex-1 py-2 font-retro text-[10px] border-2 transition-all uppercase",
                        editingChallenge.movementLevel === m
                          ? "border-retro-blue bg-retro-blue/10 text-retro-blue"
                          : "border-retro-muted/20 bg-elevated text-retro-muted hover:border-retro-muted/40"
                      )}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Noise Level */}
              <div>
                <label className="block font-retro text-[10px] uppercase tracking-wider text-retro-muted mb-2">
                  Noise Level
                </label>
                <div className="flex gap-2">
                  {NOISE_OPTIONS.map((n) => (
                    <button
                      key={n}
                      onClick={() => updateField("noiseLevel", n)}
                      className={cn(
                        "flex-1 py-2 font-retro text-[10px] border-2 transition-all uppercase",
                        editingChallenge.noiseLevel === n
                          ? "border-retro-blue bg-retro-blue/10 text-retro-blue"
                          : "border-retro-muted/20 bg-elevated text-retro-muted hover:border-retro-muted/40"
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submission Type */}
              <div>
                <label className="block font-retro text-[10px] uppercase tracking-wider text-retro-muted mb-2">
                  Submission Type
                </label>
                <select
                  value={editingChallenge.submissionType || "completion_tap"}
                  onChange={(e) => updateField("submissionType", e.target.value)}
                  className="w-full px-3 py-2 bg-elevated border-2 border-retro-muted/20 text-retro-text font-body text-sm focus:border-retro-blue focus:outline-none transition-colors"
                >
                  {SUBMISSION_TYPE_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                  ))}
                </select>
              </div>

              {/* Scoring Type */}
              <div>
                <label className="block font-retro text-[10px] uppercase tracking-wider text-retro-muted mb-2">
                  Scoring Type
                </label>
                <select
                  value={editingChallenge.scoringType || "completion"}
                  onChange={(e) => updateField("scoringType", e.target.value)}
                  className="w-full px-3 py-2 bg-elevated border-2 border-retro-muted/20 text-retro-text font-body text-sm focus:border-retro-blue focus:outline-none transition-colors"
                >
                  {SCORING_TYPE_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* isSystem toggle */}
              <div className="flex items-center justify-between">
                <label className="font-retro text-[10px] uppercase tracking-wider text-retro-muted">
                  System Challenge
                </label>
                <button
                  onClick={() => updateField("isSystem", !editingChallenge.isSystem)}
                  className={cn(
                    "relative w-14 h-7 rounded-full transition-all duration-300 border-2",
                    editingChallenge.isSystem
                      ? "bg-retro-purple/30 border-retro-purple"
                      : "bg-elevated border-retro-muted/30"
                  )}
                >
                  <div
                    className={cn(
                      "absolute top-0.5 w-5 h-5 rounded-full transition-all duration-300",
                      editingChallenge.isSystem
                        ? "left-7 bg-retro-purple-light shadow-[0_0_8px_rgba(168,85,247,0.5)]"
                        : "left-0.5 bg-retro-muted"
                    )}
                  />
                </button>
              </div>

              {/* isSimultaneous toggle */}
              <div className="flex items-center justify-between">
                <label className="font-retro text-[10px] uppercase tracking-wider text-retro-muted">
                  Simultaneous (Group)
                </label>
                <button
                  onClick={() => updateField("isSimultaneous", !editingChallenge.isSimultaneous)}
                  className={cn(
                    "relative w-14 h-7 rounded-full transition-all duration-300 border-2",
                    editingChallenge.isSimultaneous
                      ? "bg-retro-green/30 border-retro-green"
                      : "bg-elevated border-retro-muted/30"
                  )}
                >
                  <div
                    className={cn(
                      "absolute top-0.5 w-5 h-5 rounded-full transition-all duration-300",
                      editingChallenge.isSimultaneous
                        ? "left-7 bg-retro-green shadow-[0_0_8px_rgba(57,255,20,0.5)]"
                        : "left-0.5 bg-retro-muted"
                    )}
                  />
                </button>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 pt-2">
                <RetroButton
                  variant="secondary"
                  size="md"
                  className="flex-1"
                  onClick={() => {
                    setEditingChallenge(null);
                    setIsCreating(false);
                  }}
                >
                  CANCEL
                </RetroButton>
                <RetroButton
                  variant="primary"
                  size="md"
                  className="flex-1"
                  disabled={!editingChallenge.title?.trim() || saving}
                  onClick={handleSave}
                >
                  {saving ? "SAVING..." : isCreating ? "CREATE" : "SAVE"}
                </RetroButton>
              </div>
            </div>
          </RetroCard>
        )}

        {/* Challenge list */}
        {loading ? (
          <div className="text-center py-12">
            <p className="font-retro text-xs text-retro-purple-light animate-pulse">
              LOADING...
            </p>
          </div>
        ) : filteredChallenges.length === 0 ? (
          <div className="text-center py-12">
            <p className="font-retro text-xs text-retro-muted">
              {search ? "No challenges match your search." : "No challenges found."}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="font-retro text-[9px] text-retro-muted uppercase tracking-wider mb-3">
              {filteredChallenges.length} challenge{filteredChallenges.length !== 1 ? "s" : ""}
            </p>
            {filteredChallenges.map((c) => (
              <div key={c.id}>
                <div className="flex items-center justify-between px-4 py-3 bg-elevated border border-retro-purple/20 hover:border-retro-purple/40 transition-colors">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="font-retro text-[10px] text-retro-text truncate">
                      {c.title}
                    </span>
                    <span className="font-retro text-[8px] text-retro-muted shrink-0 bg-elevated px-1.5 py-0.5 border border-retro-muted/20">
                      {c.category || "—"}
                    </span>
                    <span className="font-retro text-[8px] text-retro-muted shrink-0">
                      {c.durationSeconds}s
                    </span>
                    <span className="font-retro text-[8px] text-retro-blue shrink-0 bg-retro-blue/10 px-1.5 py-0.5 border border-retro-blue/20">
                      {c.scoringType}
                    </span>
                    {c.isSimultaneous && (
                      <span className="font-retro text-[8px] text-retro-green shrink-0 bg-retro-green/10 px-1.5 py-0.5 border border-retro-green/20">
                        GROUP
                      </span>
                    )}
                    <span className="font-retro text-[8px] text-retro-muted shrink-0">
                      {c.audience || "—"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 ml-3 shrink-0">
                    <button
                      onClick={() => handleEdit(c)}
                      className="font-retro text-[9px] text-retro-blue hover:text-retro-blue/80"
                    >
                      EDIT
                    </button>
                    {deleteConfirmId === c.id ? (
                      <span className="flex items-center gap-1">
                        <span className="font-retro text-[8px] text-retro-pink">Sure?</span>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="font-retro text-[8px] text-retro-muted hover:text-retro-text"
                        >
                          NO
                        </button>
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="font-retro text-[8px] text-retro-pink hover:text-retro-pink/80"
                        >
                          YES
                        </button>
                      </span>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(c.id)}
                        className="font-retro text-[9px] text-retro-pink hover:text-retro-pink/80"
                      >
                        DELETE
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Help modal */}
      {showHelp && (
        <div
          className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center p-4"
          onClick={() => setShowHelp(false)}
        >
          <div
            className="bg-card border-2 border-retro-purple/40 max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowHelp(false)}
              className="absolute top-3 right-3 font-retro text-xs text-retro-muted hover:text-retro-pink transition-colors"
            >
              X
            </button>

            <h2
              className="font-retro text-sm text-retro-purple-light text-center mb-1"
              style={{ textShadow: "0 0 16px rgba(168,85,247,0.4)" }}
            >
              FIELD REFERENCE
            </h2>
            <div className="h-px bg-gradient-to-r from-transparent via-retro-purple to-transparent mb-5" />

            <div className="space-y-5 font-body text-sm text-retro-text leading-relaxed">
              {/* Title */}
              <div>
                <h3 className="font-retro text-[10px] text-retro-blue uppercase tracking-wider mb-1">Title</h3>
                <p className="text-retro-muted">Display name shown to players. Keep it short and punchy (max 120 chars).</p>
              </div>

              {/* Short Description */}
              <div>
                <h3 className="font-retro text-[10px] text-retro-blue uppercase tracking-wider mb-1">Short Description</h3>
                <p className="text-retro-muted">One-line summary shown in challenge previews and lobby cards (max 200 chars).</p>
              </div>

              {/* Full Instructions */}
              <div>
                <h3 className="font-retro text-[10px] text-retro-blue uppercase tracking-wider mb-1">Full Instructions</h3>
                <p className="text-retro-muted">Detailed rules displayed once the challenge starts. Can be multi-line (max 1000 chars).</p>
              </div>

              {/* Category */}
              <div>
                <h3 className="font-retro text-[10px] text-retro-blue uppercase tracking-wider mb-1">Category</h3>
                <p className="text-retro-muted">Free-text tag used for filtering and grouping (e.g. Creativity, Trivia, Physical).</p>
              </div>

              {/* Audience */}
              <div>
                <h3 className="font-retro text-[10px] text-retro-purple-light uppercase tracking-wider mb-1">Audience</h3>
                <p className="text-retro-muted mb-2">Who the challenge is designed for. Affects which challenges appear in a session.</p>
                <div className="border border-retro-muted/20 text-[11px]">
                  <div className="flex border-b border-retro-muted/20 bg-elevated">
                    <span className="w-28 shrink-0 px-2 py-1 font-retro text-[9px] text-retro-muted">Value</span>
                    <span className="px-2 py-1 font-retro text-[9px] text-retro-muted">Meaning</span>
                  </div>
                  <div className="flex border-b border-retro-muted/10">
                    <span className="w-28 shrink-0 px-2 py-1 text-retro-blue">classroom</span>
                    <span className="px-2 py-1 text-retro-muted">Students / school setting</span>
                  </div>
                  <div className="flex border-b border-retro-muted/10">
                    <span className="w-28 shrink-0 px-2 py-1 text-retro-blue">office</span>
                    <span className="px-2 py-1 text-retro-muted">Workplace / team-building</span>
                  </div>
                  <div className="flex">
                    <span className="w-28 shrink-0 px-2 py-1 text-retro-blue">universal</span>
                    <span className="px-2 py-1 text-retro-muted">Any audience</span>
                  </div>
                </div>
              </div>

              {/* Audience Pack */}
              <div>
                <h3 className="font-retro text-[10px] text-retro-purple-light uppercase tracking-wider mb-1">Audience Pack</h3>
                <p className="text-retro-muted mb-2">Sub-flavor within an audience. Controls tone and content style.</p>
                <div className="border border-retro-muted/20 text-[11px]">
                  <div className="flex border-b border-retro-muted/20 bg-elevated">
                    <span className="w-40 shrink-0 px-2 py-1 font-retro text-[9px] text-retro-muted">Pack</span>
                    <span className="px-2 py-1 font-retro text-[9px] text-retro-muted">Description</span>
                  </div>
                  {[
                    ["classroom_funny", "Silly, meme-friendly classroom challenges"],
                    ["classroom_low_noise", "Quieter activities for focused settings"],
                    ["office_fun", "Lighthearted team-building activities"],
                    ["office_professional", "Professional-safe icebreakers"],
                    ["universal", "Works everywhere"],
                    ["recess_riot", "High-energy, outdoor-friendly chaos"],
                  ].map(([pack, desc]) => (
                    <div key={pack} className="flex border-b border-retro-muted/10 last:border-0">
                      <span className="w-40 shrink-0 px-2 py-1 text-retro-blue">{pack}</span>
                      <span className="px-2 py-1 text-retro-muted">{desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div>
                <h3 className="font-retro text-[10px] text-retro-blue uppercase tracking-wider mb-1">Duration (seconds)</h3>
                <p className="text-retro-muted">How long players have to complete the challenge. Presets: 30, 60, 90, 120, 180.</p>
              </div>

              {/* Intensity */}
              <div>
                <h3 className="font-retro text-[10px] text-retro-blue uppercase tracking-wider mb-1">Intensity</h3>
                <p className="text-retro-muted"><strong>chill</strong> &mdash; relaxed pace. <strong>balanced</strong> &mdash; moderate energy. <strong>high-energy</strong> &mdash; fast and competitive.</p>
              </div>

              {/* Movement Level */}
              <div>
                <h3 className="font-retro text-[10px] text-retro-blue uppercase tracking-wider mb-1">Movement Level</h3>
                <p className="text-retro-muted"><strong>seated</strong> &mdash; no movement required. <strong>standing</strong> &mdash; players stand but stay in place. <strong>active</strong> &mdash; walking, running, or physical movement.</p>
              </div>

              {/* Noise Level */}
              <div>
                <h3 className="font-retro text-[10px] text-retro-blue uppercase tracking-wider mb-1">Noise Level</h3>
                <p className="text-retro-muted"><strong>quiet</strong> &mdash; silent or whisper. <strong>medium</strong> &mdash; normal conversation. <strong>loud</strong> &mdash; shouting, cheering, or music.</p>
              </div>

              {/* Submission Type */}
              <div>
                <h3 className="font-retro text-[10px] text-retro-purple-light uppercase tracking-wider mb-1">Submission Type</h3>
                <p className="text-retro-muted mb-2">How players submit their answer or proof of completion.</p>
                <div className="border border-retro-muted/20 text-[11px]">
                  <div className="flex border-b border-retro-muted/20 bg-elevated">
                    <span className="w-32 shrink-0 px-2 py-1 font-retro text-[9px] text-retro-muted">Type</span>
                    <span className="px-2 py-1 font-retro text-[9px] text-retro-muted">How it works</span>
                  </div>
                  {[
                    ["completion_tap", "Player taps \"Done\" when finished"],
                    ["text", "Player types a text answer"],
                    ["photo", "Player uploads or takes a photo"],
                    ["judge", "Host/judge manually scores each player"],
                    ["vote", "All players vote on the best submission"],
                    ["hybrid", "Combines multiple submission methods"],
                  ].map(([type, desc]) => (
                    <div key={type} className="flex border-b border-retro-muted/10 last:border-0">
                      <span className="w-32 shrink-0 px-2 py-1 text-retro-blue">{type}</span>
                      <span className="px-2 py-1 text-retro-muted">{desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Scoring Type */}
              <div>
                <h3 className="font-retro text-[10px] text-retro-purple-light uppercase tracking-wider mb-1">Scoring Type</h3>
                <p className="text-retro-muted mb-2">How points are awarded after submissions.</p>
                <div className="border border-retro-muted/20 text-[11px]">
                  <div className="flex border-b border-retro-muted/20 bg-elevated">
                    <span className="w-28 shrink-0 px-2 py-1 font-retro text-[9px] text-retro-muted">Type</span>
                    <span className="px-2 py-1 font-retro text-[9px] text-retro-muted">How points work</span>
                  </div>
                  {[
                    ["completion", "Everyone who finishes gets equal points"],
                    ["speed", "Faster completion = more points"],
                    ["judge", "Host assigns scores manually"],
                    ["vote", "Points based on peer votes received"],
                    ["hybrid", "Combines multiple scoring methods"],
                  ].map(([type, desc]) => (
                    <div key={type} className="flex border-b border-retro-muted/10 last:border-0">
                      <span className="w-28 shrink-0 px-2 py-1 text-retro-blue">{type}</span>
                      <span className="px-2 py-1 text-retro-muted">{desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* System Challenge */}
              <div>
                <h3 className="font-retro text-[10px] text-retro-blue uppercase tracking-wider mb-1">System Challenge</h3>
                <p className="text-retro-muted">When ON, this challenge is a built-in system challenge and cannot be deleted by regular users. Used for the default challenge pool.</p>
              </div>

              {/* Simultaneous */}
              <div>
                <h3 className="font-retro text-[10px] text-retro-blue uppercase tracking-wider mb-1">Simultaneous (Group)</h3>
                <p className="text-retro-muted">When ON, all players do the challenge at the same time instead of taking turns. Good for group activities, dance-offs, or anything where everyone participates together.</p>
              </div>

              {/* Interactive Data */}
              <div>
                <h3 className="font-retro text-[10px] text-retro-blue uppercase tracking-wider mb-1">Interactive Data</h3>
                <p className="text-retro-muted">Optional JSON payload for challenges that need extra config (e.g. quiz questions, drawing prompts). Only set via the API or import.</p>
              </div>

              {/* Safety Flags */}
              <div>
                <h3 className="font-retro text-[10px] text-retro-blue uppercase tracking-wider mb-1">Safety Flags</h3>
                <p className="text-retro-muted">Tags like &quot;physical&quot; or &quot;allergen&quot; that let hosts filter out challenges that may not be safe for their group. Managed via the API or import.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
