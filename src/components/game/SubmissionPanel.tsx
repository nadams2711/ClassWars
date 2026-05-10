"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { DrawingCanvas } from "@/components/game/DrawingCanvas";
import { TapFrenzy } from "@/components/game/TapFrenzy";
import { ReactionTime } from "@/components/game/ReactionTime";
import { PhotoSelfie } from "@/components/game/PhotoSelfie";
import { ShakeMeter } from "@/components/game/ShakeMeter";
import { MemorySequence } from "@/components/game/MemorySequence";
import { TiltTarget } from "@/components/game/TiltTarget";
import { SoundEffect } from "@/components/game/SoundEffect";
import { EmojiSlider } from "@/components/game/EmojiSlider";
import { GroupPhoto } from "@/components/game/GroupPhoto";
import { GroupTimer } from "@/components/game/GroupTimer";
import type { SubmissionType } from "@/types/game";
import type { InteractiveData } from "@/types/challenge";
import { PIXEL_AVATAR_COLORS } from "./PixelAvatar";

interface SubmissionPanelProps {
  submissionType: SubmissionType;
  onSubmit: (value: string) => void;
  disabled?: boolean;
  participants?: { id: string; nickname: string; avatarIndex: number }[];
  interactiveData?: InteractiveData | null;
  className?: string;
}

const AVATAR_COLORS = PIXEL_AVATAR_COLORS;

export function SubmissionPanel({
  submissionType,
  onSubmit,
  disabled = false,
  participants = [],
  interactiveData,
  className,
}: SubmissionPanelProps) {
  const [submitted, setSubmitted] = useState(false);
  const [textValue, setTextValue] = useState("");
  const [selectedVote, setSelectedVote] = useState<string | null>(null);

  const handleSubmit = useCallback(
    (value: string) => {
      if (disabled || submitted) return;
      setSubmitted(true);
      onSubmit(value);
    },
    [disabled, submitted, onSubmit]
  );

  const isLocked = disabled || submitted;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={cn("bg-card border border-retro-purple/30 p-5 relative overflow-hidden", className)}
    >
      {/* Success overlay */}
      <AnimatePresence>
        {submitted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-card/95"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
              className="w-16 h-16 rounded-full bg-retro-green/20 border-2 border-retro-green flex items-center justify-center mb-3"
              style={{ boxShadow: "0 0 30px rgba(57,255,20,0.3)" }}
            >
              <span className="font-retro text-2xl text-retro-green">{"\u2714"}</span>
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="font-retro text-xs text-retro-green"
            >
              SUBMITTED!
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="font-body text-xs text-retro-muted mt-2"
            >
              Waiting for others...
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="mb-4">
        <h3 className="font-retro text-[10px] uppercase text-retro-muted tracking-wider mb-1">
          Your Response
        </h3>
        <div className="h-[2px] w-12 bg-retro-purple" />
      </div>

      {/* Interactive submission types */}
      {interactiveData?.type === "this_or_that" ? (
        <ThisOrThatSubmission
          choices={interactiveData.choices}
          onSubmit={handleSubmit}
          isLocked={isLocked}
        />
      ) : interactiveData?.type === "drawing" ? (
        <DrawingCanvas onSubmit={handleSubmit} disabled={isLocked} />
      ) : interactiveData?.type === "tap_frenzy" ? (
        <TapFrenzy
          durationSeconds={interactiveData.durationSeconds}
          onSubmit={handleSubmit}
          disabled={isLocked}
        />
      ) : interactiveData?.type === "reaction_time" ? (
        <ReactionTime
          rounds={interactiveData.rounds}
          onSubmit={handleSubmit}
          disabled={isLocked}
        />
      ) : interactiveData?.type === "photo_selfie" ? (
        <PhotoSelfie onSubmit={handleSubmit} disabled={isLocked} />
      ) : interactiveData?.type === "shake_meter" ? (
        <ShakeMeter
          durationSeconds={interactiveData.durationSeconds}
          onSubmit={handleSubmit}
          disabled={isLocked}
        />
      ) : interactiveData?.type === "memory_sequence" ? (
        <MemorySequence
          sequenceLength={interactiveData.sequenceLength}
          onSubmit={handleSubmit}
          disabled={isLocked}
        />
      ) : interactiveData?.type === "tilt_target" ? (
        <TiltTarget
          rounds={interactiveData.rounds}
          onSubmit={handleSubmit}
          disabled={isLocked}
        />
      ) : interactiveData?.type === "sound_effect" ? (
        <SoundEffect
          durationSeconds={interactiveData.durationSeconds}
          onSubmit={handleSubmit}
          disabled={isLocked}
        />
      ) : interactiveData?.type === "emoji_slider" ? (
        <EmojiSlider
          items={interactiveData.items}
          onSubmit={handleSubmit}
          disabled={isLocked}
        />
      ) : interactiveData?.type === "group_photo" ? (
        <GroupPhoto onSubmit={handleSubmit} disabled={isLocked} />
      ) : interactiveData?.type === "group_timer" ? (
        <GroupTimer
          activity={interactiveData.activity}
          onSubmit={handleSubmit}
          disabled={isLocked}
        />
      ) : (
        <>
          {/* Completion Tap */}
          {submissionType === "completion_tap" && (
            <CompletionTap onSubmit={() => handleSubmit("completed")} isLocked={isLocked} />
          )}

          {/* Text Submission */}
          {submissionType === "text" && (
            <TextSubmission
              value={textValue}
              onChange={setTextValue}
              onSubmit={() => handleSubmit(textValue)}
              isLocked={isLocked}
            />
          )}

          {/* Vote */}
          {submissionType === "vote" && (
            <VoteSubmission
              participants={participants}
              selectedVote={selectedVote}
              onSelect={setSelectedVote}
              onSubmit={() => selectedVote && handleSubmit(selectedVote)}
              isLocked={isLocked}
            />
          )}

          {/* Judge */}
          {submissionType === "judge" && (
            <JudgeSubmission isLocked={isLocked} />
          )}

          {/* Photo / Hybrid fallback to completion */}
          {(submissionType === "photo" || submissionType === "hybrid") && (
            <CompletionTap onSubmit={() => handleSubmit("completed")} isLocked={isLocked} />
          )}
        </>
      )}
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Sub-components                                                             */
/* -------------------------------------------------------------------------- */

function CompletionTap({
  onSubmit,
  isLocked,
}: {
  onSubmit: () => void;
  isLocked: boolean;
}) {
  const [pressing, setPressing] = useState(false);

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <p className="font-body text-sm text-retro-muted text-center">
        Tap the button when you have completed the challenge!
      </p>
      <motion.button
        whileTap={!isLocked ? { scale: 0.92 } : undefined}
        whileHover={!isLocked ? { scale: 1.03 } : undefined}
        onPointerDown={() => !isLocked && setPressing(true)}
        onPointerUp={() => setPressing(false)}
        onPointerLeave={() => setPressing(false)}
        onClick={onSubmit}
        disabled={isLocked}
        className={cn(
          "relative w-full max-w-xs py-6 font-retro text-sm uppercase tracking-wider transition-all duration-150",
          "disabled:opacity-40 disabled:cursor-not-allowed",
          !isLocked
            ? "bg-retro-green text-page shadow-[0_6px_0_#1a8a09] active:shadow-[0_2px_0_#1a8a09] active:translate-y-1"
            : "bg-retro-muted/20 text-retro-muted"
        )}
        style={
          !isLocked
            ? {
                boxShadow: pressing
                  ? "0 2px 0 #1a8a09, 0 0 30px rgba(57,255,20,0.3)"
                  : "0 6px 0 #1a8a09, 0 0 30px rgba(57,255,20,0.2)",
              }
            : undefined
        }
      >
        {/* Pulse ring */}
        {!isLocked && (
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.1, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 border-2 border-retro-green"
          />
        )}
        I DID IT!
      </motion.button>
    </div>
  );
}

function TextSubmission({
  value,
  onChange,
  onSubmit,
  isLocked,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  isLocked: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={isLocked}
        placeholder="Type your answer here..."
        maxLength={500}
        className={cn(
          "w-full h-28 bg-page border border-retro-purple/30 p-3",
          "font-body text-sm text-retro-text placeholder:text-retro-muted/40",
          "resize-none outline-none transition-colors",
          "focus:border-retro-purple-light focus:shadow-[0_0_12px_rgba(168,85,247,0.2)]",
          "disabled:opacity-40 disabled:cursor-not-allowed"
        )}
      />
      <div className="flex items-center justify-between">
        <span className="font-body text-[10px] text-retro-muted">
          {value.length}/500
        </span>
        <motion.button
          whileTap={!isLocked && value.trim() ? { scale: 0.95 } : undefined}
          onClick={onSubmit}
          disabled={isLocked || !value.trim()}
          className={cn(
            "font-retro text-[10px] uppercase tracking-wider px-6 py-2.5 transition-all duration-150",
            "disabled:opacity-40 disabled:cursor-not-allowed",
            value.trim() && !isLocked
              ? "bg-retro-purple text-white shadow-[0_4px_0_#4c1d95] hover:bg-retro-purple-light active:translate-y-[2px] active:shadow-[0_0_0_#4c1d95]"
              : "bg-retro-muted/20 text-retro-muted"
          )}
        >
          Submit
        </motion.button>
      </div>
    </div>
  );
}

function VoteSubmission({
  participants,
  selectedVote,
  onSelect,
  onSubmit,
  isLocked,
}: {
  participants: { id: string; nickname: string; avatarIndex: number }[];
  selectedVote: string | null;
  onSelect: (id: string) => void;
  onSubmit: () => void;
  isLocked: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      <p className="font-body text-sm text-retro-muted mb-1">
        Vote for the best performance:
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
        {participants.map((p) => {
          const color = AVATAR_COLORS[p.avatarIndex % AVATAR_COLORS.length];
          const isSelected = selectedVote === p.id;
          return (
            <motion.button
              key={p.id}
              whileTap={!isLocked ? { scale: 0.97 } : undefined}
              onClick={() => !isLocked && onSelect(p.id)}
              disabled={isLocked}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 border transition-all duration-150 text-left",
                "disabled:cursor-not-allowed",
                isSelected
                  ? "border-retro-purple-light bg-retro-purple/15"
                  : "border-retro-purple/20 bg-elevated/30 hover:border-retro-purple/40"
              )}
              style={
                isSelected
                  ? { boxShadow: `0 0 16px ${color}30` }
                  : undefined
              }
            >
              {/* Avatar circle */}
              <div
                className="w-8 h-8 flex items-center justify-center shrink-0"
                style={{ backgroundColor: color }}
              >
                <span className="font-retro text-[10px] text-white">
                  {p.nickname.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="font-retro text-[10px] text-retro-text truncate">
                {p.nickname}
              </span>
              {isSelected && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="ml-auto text-retro-purple-light font-retro text-xs"
                >
                  {"\u2714"}
                </motion.span>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Submit vote button */}
      <motion.button
        whileTap={!isLocked && selectedVote ? { scale: 0.95 } : undefined}
        onClick={onSubmit}
        disabled={isLocked || !selectedVote}
        className={cn(
          "font-retro text-[10px] uppercase tracking-wider px-6 py-2.5 transition-all duration-150 mt-2",
          "disabled:opacity-40 disabled:cursor-not-allowed",
          selectedVote && !isLocked
            ? "bg-retro-purple text-white shadow-[0_4px_0_#4c1d95] hover:bg-retro-purple-light active:translate-y-[2px] active:shadow-[0_0_0_#4c1d95]"
            : "bg-retro-muted/20 text-retro-muted"
        )}
      >
        Cast Vote
      </motion.button>
    </div>
  );
}

function JudgeSubmission({ isLocked }: { isLocked: boolean }) {
  return (
    <div className="flex flex-col items-center gap-3 py-6">
      <div
        className="w-14 h-14 rounded-full border-2 border-retro-gold/50 flex items-center justify-center"
        style={{ boxShadow: "0 0 20px rgba(255,215,0,0.15)" }}
      >
        <span className="text-2xl">{"\u2696"}</span>
      </div>
      <p className="font-retro text-[10px] text-retro-gold uppercase tracking-wider">
        Judge Scored
      </p>
      <p className="font-body text-sm text-retro-muted text-center max-w-xs">
        {isLocked
          ? "Score has been submitted by the judge."
          : "The host will judge and score this challenge. Give it your best!"}
      </p>
    </div>
  );
}

function ThisOrThatSubmission({
  choices,
  onSubmit,
  isLocked,
}: {
  choices: { a: string; b: string }[];
  onSubmit: (value: string) => void;
  isLocked: boolean;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [startTime] = useState(Date.now());

  const handlePick = useCallback(
    (pick: string) => {
      if (isLocked) return;
      const next = [...answers, pick];
      setAnswers(next);

      if (currentIndex + 1 >= choices.length) {
        const elapsed = Math.round((Date.now() - startTime) / 1000);
        onSubmit(JSON.stringify({ choices: next, elapsedSeconds: elapsed }));
      } else {
        setCurrentIndex(currentIndex + 1);
      }
    },
    [isLocked, answers, currentIndex, choices.length, startTime, onSubmit]
  );

  if (currentIndex >= choices.length) return null;

  const pair = choices[currentIndex];
  const progress = ((currentIndex) / choices.length) * 100;

  return (
    <div className="flex flex-col gap-4">
      {/* Progress bar */}
      <div className="h-2 bg-page/60 w-full border border-retro-purple/20">
        <motion.div
          className="h-full bg-retro-pink"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      <p className="font-retro text-[9px] text-retro-muted text-center uppercase tracking-wider">
        {currentIndex + 1} / {choices.length}
      </p>

      <div className="flex gap-3">
        <motion.button
          whileTap={!isLocked ? { scale: 0.92 } : undefined}
          onClick={() => handlePick(pair.a)}
          disabled={isLocked}
          className={cn(
            "flex-1 py-6 font-retro text-xs uppercase tracking-wider transition-all",
            "bg-retro-blue text-white shadow-[0_4px_0_#1a4a8a]",
            "active:translate-y-[2px] active:shadow-[0_0_0_#1a4a8a]",
            "disabled:opacity-40 disabled:cursor-not-allowed"
          )}
        >
          {pair.a}
        </motion.button>
        <motion.button
          whileTap={!isLocked ? { scale: 0.92 } : undefined}
          onClick={() => handlePick(pair.b)}
          disabled={isLocked}
          className={cn(
            "flex-1 py-6 font-retro text-xs uppercase tracking-wider transition-all",
            "bg-retro-pink text-white shadow-[0_4px_0_#8a1a3a]",
            "active:translate-y-[2px] active:shadow-[0_0_0_#8a1a3a]",
            "disabled:opacity-40 disabled:cursor-not-allowed"
          )}
        >
          {pair.b}
        </motion.button>
      </div>
    </div>
  );
}
