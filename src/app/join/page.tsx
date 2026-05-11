"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { RetroButton } from "@/components/ui/RetroButton";
import { RetroCard } from "@/components/ui/RetroCard";
import { RetroInput } from "@/components/ui/RetroInput";
import Link from "next/link";

const CODE_LENGTH = 6;

export default function JoinPage() {
  const router = useRouter();
  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleCodeChange = useCallback(
    (index: number, value: string) => {
      // Only allow alphanumeric characters
      const char = value.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(-1);

      const newCode = [...code];
      newCode[index] = char;
      setCode(newCode);

      // Auto-advance to next input
      if (char && index < CODE_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [code]
  );

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace" && !code[index] && index > 0) {
        // Move to previous input on backspace if current is empty
        const newCode = [...code];
        newCode[index - 1] = "";
        setCode(newCode);
        inputRefs.current[index - 1]?.focus();
      }
    },
    [code]
  );

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/[^A-Za-z0-9]/g, "")
      .toUpperCase()
      .slice(0, CODE_LENGTH);

    if (pasted.length > 0) {
      const newCode = Array(CODE_LENGTH).fill("");
      for (let i = 0; i < pasted.length; i++) {
        newCode[i] = pasted[i];
      }
      setCode(newCode);

      // Focus the input after the last pasted character, or the last input
      const focusIndex = Math.min(pasted.length, CODE_LENGTH - 1);
      inputRefs.current[focusIndex]?.focus();
    }
  }, []);

  const joinCode = code.join("");
  const isCodeComplete = joinCode.length === CODE_LENGTH;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!isCodeComplete) {
      setError("Enter the full 6-character code");
      return;
    }

    if (!nickname.trim()) {
      setError("Choose a nickname");
      return;
    }

    if (nickname.trim().length > 16) {
      setError("Nickname max 16 characters");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/events/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          joinCode,
          nickname: nickname.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Could not join game");
        setLoading(false);
        return;
      }

      // Store participant info in localStorage for the player session
      localStorage.setItem(
        "deskwars_participant",
        JSON.stringify({
          participantId: data.participantId,
          eventId: data.eventId,
          nickname: nickname.trim(),
        })
      );

      router.push(`/lobby/${data.eventId}`);
    } catch {
      setError("Connection failed. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <RetroCard glow="blue" padding="lg">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <h1 className="font-retro text-lg sm:text-xl text-retro-blue text-center text-glow-blue">
              JOIN GAME
            </h1>

            {error && (
              <div className="bg-retro-pink/10 border-2 border-retro-pink/40 px-4 py-3 text-center">
                <p className="font-retro text-[9px] text-retro-pink uppercase tracking-wider">
                  {error}
                </p>
              </div>
            )}

            {/* 6-character code input */}
            <div className="flex flex-col gap-2">
              <label className="font-retro text-[10px] uppercase tracking-wider text-retro-muted">
                Game Code
              </label>
              <div className="flex gap-2 justify-center" onPaste={handlePaste}>
                {Array.from({ length: CODE_LENGTH }).map((_, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      inputRefs.current[i] = el;
                    }}
                    type="text"
                    inputMode="text"
                    maxLength={1}
                    value={code[i]}
                    onChange={(e) => handleCodeChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    className="w-11 h-14 sm:w-12 sm:h-16 bg-page text-retro-text font-retro text-xl sm:text-2xl text-center uppercase border-2 border-retro-blue/40 rounded-none outline-none transition-all duration-200 focus:border-retro-blue focus:shadow-[0_0_16px_rgba(0,212,255,0.25)]"
                    autoComplete="off"
                  />
                ))}
              </div>
            </div>

            {/* Nickname input */}
            <RetroInput
              label="Nickname"
              type="text"
              placeholder="Enter your name"
              value={nickname}
              onChange={(e) => setNickname(e.target.value.slice(0, 16))}
              maxLength={16}
              required
              autoComplete="off"
            />

            <RetroButton
              type="submit"
              variant="success"
              size="lg"
              fullWidth
              disabled={loading || !isCodeComplete}
            >
              {loading ? "JOINING..." : "JOIN"}
            </RetroButton>

            <div className="text-center pt-2">
              <Link
                href="/"
                className="font-retro text-[9px] text-retro-muted hover:text-retro-blue transition-colors uppercase tracking-wider"
              >
                Back to home
              </Link>
            </div>
          </form>
        </RetroCard>
      </div>

      {/* Fun waiting pixel decoration */}
      <div className="mt-8 flex gap-3" aria-hidden="true">
        <div
          className="w-2 h-2 bg-retro-blue opacity-60 animate-bounce"
          style={{ animationDelay: "0ms" }}
        />
        <div
          className="w-2 h-2 bg-retro-green opacity-60 animate-bounce"
          style={{ animationDelay: "150ms" }}
        />
        <div
          className="w-2 h-2 bg-retro-purple-light opacity-60 animate-bounce"
          style={{ animationDelay: "300ms" }}
        />
        <div
          className="w-2 h-2 bg-retro-gold opacity-60 animate-bounce"
          style={{ animationDelay: "450ms" }}
        />
        <div
          className="w-2 h-2 bg-retro-pink opacity-60 animate-bounce"
          style={{ animationDelay: "600ms" }}
        />
      </div>
    </div>
  );
}
