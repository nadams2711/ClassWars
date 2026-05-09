"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { RetroButton } from "@/components/ui/RetroButton";
import { RetroCard } from "@/components/ui/RetroCard";
import { RetroInput } from "@/components/ui/RetroInput";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
      } else {
        router.push("/host");
      }
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <RetroCard glow="purple" padding="lg">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <h1 className="font-retro text-lg sm:text-xl text-retro-gold text-center text-glow-gold">
              HOST LOGIN
            </h1>

            {error && (
              <div className="bg-retro-pink/10 border-2 border-retro-pink/40 px-4 py-3 text-center">
                <p className="font-retro text-[9px] text-retro-pink uppercase tracking-wider">
                  {error}
                </p>
              </div>
            )}

            <RetroInput
              label="Email"
              type="email"
              placeholder="host@school.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />

            <RetroInput
              label="Password"
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />

            <RetroButton
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              disabled={loading}
            >
              {loading ? "SIGNING IN..." : "SIGN IN"}
            </RetroButton>

            <div className="flex flex-col items-center gap-3 pt-2">
              <Link
                href="/auth/signup"
                className="font-retro text-[9px] text-retro-purple-light hover:text-retro-blue transition-colors uppercase tracking-wider"
              >
                New host? Sign up
              </Link>
              <Link
                href="/join"
                className="font-retro text-[9px] text-retro-muted hover:text-retro-blue transition-colors uppercase tracking-wider"
              >
                Or join as player
              </Link>
            </div>
          </form>
        </RetroCard>
      </div>
    </div>
  );
}
