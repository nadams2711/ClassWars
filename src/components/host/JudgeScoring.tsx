"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { RetroButton } from "@/components/ui/RetroButton";
import { RetroCard } from "@/components/ui/RetroCard";

interface Submission {
  id: string;
  participantId: string;
  nickname: string;
  submissionType: string;
  textContent: string | null;
  mediaUrl: string | null;
}

interface JudgeScoringProps {
  submissions: Submission[];
  onScoreSubmit: (scores: Record<string, number>) => void;
}

export function JudgeScoring({ submissions, onScoreSubmit }: JudgeScoringProps) {
  const [scores, setScores] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    submissions.forEach((s) => {
      initial[s.id] = 5;
    });
    return initial;
  });
  const [submitting, setSubmitting] = useState(false);

  const handleScoreChange = (submissionId: string, score: number) => {
    setScores((prev) => ({ ...prev, [submissionId]: score }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onScoreSubmit(scores);
    } finally {
      setSubmitting(false);
    }
  };

  const allScored = submissions.every((s) => scores[s.id] !== undefined);

  return (
    <div className="space-y-4">
      <h3 className="font-retro text-xs text-retro-gold uppercase tracking-widest text-center mb-4">
        JUDGE SCORING
      </h3>

      {submissions.length === 0 ? (
        <div className="text-center py-8">
          <p className="font-retro text-[10px] text-retro-muted">
            NO SUBMISSIONS TO JUDGE
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {submissions.map((submission) => {
            const currentScore = scores[submission.id] ?? 5;

            return (
              <RetroCard key={submission.id} glow="none" padding="sm">
                <div className="space-y-3">
                  {/* Player name */}
                  <div className="flex items-center justify-between">
                    <span className="font-retro text-[10px] text-retro-blue">
                      {submission.nickname}
                    </span>
                    <span className="font-retro text-sm text-retro-gold">
                      {currentScore}/10
                    </span>
                  </div>

                  {/* Submission content */}
                  {submission.textContent && (
                    <p className="font-body text-sm text-retro-text/90 bg-page/50 px-3 py-2 border border-retro-purple/10">
                      {submission.textContent}
                    </p>
                  )}
                  {submission.mediaUrl && (
                    <div className="bg-page/50 px-3 py-2 border border-retro-purple/10">
                      <span className="font-body text-xs text-retro-muted">
                        [Media submission]
                      </span>
                    </div>
                  )}

                  {/* Score buttons 1-10 */}
                  <div className="flex flex-wrap gap-1">
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((score) => (
                      <button
                        key={score}
                        onClick={() => handleScoreChange(submission.id, score)}
                        className={cn(
                          "w-8 h-8 font-retro text-[10px] transition-all duration-150 border",
                          score === currentScore
                            ? "bg-retro-gold text-page border-retro-gold shadow-[0_0_10px_rgba(255,215,0,0.4)]"
                            : score <= currentScore
                              ? "bg-retro-gold/20 text-retro-gold border-retro-gold/30 hover:bg-retro-gold/30"
                              : "bg-elevated text-retro-muted border-retro-muted/20 hover:border-retro-muted/40"
                        )}
                      >
                        {score}
                      </button>
                    ))}
                  </div>

                  {/* Score slider alternative */}
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={currentScore}
                    onChange={(e) =>
                      handleScoreChange(submission.id, parseInt(e.target.value))
                    }
                    className="w-full h-1 bg-elevated appearance-none cursor-pointer accent-retro-gold"
                  />
                </div>
              </RetroCard>
            );
          })}
        </div>
      )}

      {/* Submit button */}
      {submissions.length > 0 && (
        <div className="flex justify-center pt-4">
          <RetroButton
            variant="gold"
            size="lg"
            onClick={handleSubmit}
            disabled={!allScored || submitting}
          >
            {submitting ? "SUBMITTING..." : "SUBMIT SCORES"}
          </RetroButton>
        </div>
      )}
    </div>
  );
}
