"use client";

import { cn } from "@/lib/utils";
import { RetroButton } from "@/components/ui/RetroButton";

interface EventWizardProps {
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onBack: () => void;
  canAdvance: boolean;
  children: React.ReactNode;
  nextLabel?: string;
  backLabel?: string;
  isSubmitting?: boolean;
}

export function EventWizard({
  currentStep,
  totalSteps,
  onNext,
  onBack,
  canAdvance,
  children,
  nextLabel,
  backLabel,
  isSubmitting = false,
}: EventWizardProps) {
  const stepLabels = ["BASICS", "CHALLENGES", "LAUNCH"];

  return (
    <div className="flex flex-col min-h-[calc(100vh-6rem)]">
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {Array.from({ length: totalSteps }).map((_, i) => {
          const stepNum = i + 1;
          const isActive = stepNum === currentStep;
          const isCompleted = stepNum < currentStep;

          return (
            <div key={i} className="flex items-center gap-2">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={cn(
                    "w-8 h-8 flex items-center justify-center font-retro text-[10px] transition-all duration-300",
                    isActive &&
                      "bg-retro-purple text-white shadow-[0_0_16px_rgba(168,85,247,0.5)]",
                    isCompleted &&
                      "bg-retro-green/20 text-retro-green border border-retro-green/50",
                    !isActive &&
                      !isCompleted &&
                      "bg-elevated text-retro-muted border border-retro-muted/30"
                  )}
                >
                  {isCompleted ? "\u2713" : stepNum}
                </div>
                <span
                  className={cn(
                    "font-retro text-[7px] tracking-wider",
                    isActive && "text-retro-purple-light",
                    isCompleted && "text-retro-green",
                    !isActive && !isCompleted && "text-retro-muted/50"
                  )}
                >
                  {stepLabels[i] || `STEP ${stepNum}`}
                </span>
              </div>

              {i < totalSteps - 1 && (
                <div
                  className={cn(
                    "w-12 h-px mb-4",
                    isCompleted ? "bg-retro-green/50" : "bg-retro-muted/20"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Content area */}
      <div className="flex-1">{children}</div>

      {/* Footer navigation */}
      <div className="flex items-center justify-between pt-8 pb-4 border-t border-retro-purple/20 mt-8">
        <div>
          {currentStep > 1 && (
            <RetroButton
              variant="secondary"
              size="md"
              onClick={onBack}
              disabled={isSubmitting}
            >
              {backLabel || "\u2190 BACK"}
            </RetroButton>
          )}
        </div>

        <RetroButton
          variant={currentStep === totalSteps ? "gold" : "primary"}
          size="lg"
          onClick={onNext}
          disabled={!canAdvance || isSubmitting}
        >
          {isSubmitting
            ? "LOADING..."
            : nextLabel || (currentStep === totalSteps ? "LAUNCH GAME" : "NEXT \u2192")}
        </RetroButton>
      </div>
    </div>
  );
}
