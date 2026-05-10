"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SoundEffectProps {
  durationSeconds: number;
  onSubmit: (value: string) => void;
  disabled?: boolean;
}

type Phase = "idle" | "recording" | "preview" | "submitted";

export function SoundEffect({ durationSeconds, onSubmit, disabled = false }: SoundEffectProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [timeLeft, setTimeLeft] = useState(durationSeconds);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [visualBars, setVisualBars] = useState<number[]>(Array(12).fill(2));
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animRef = useRef<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      cancelAnimationFrame(animRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Audio visualization
      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 32;
      source.connect(analyser);
      analyserRef.current = analyser;

      const updateBars = () => {
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);
        const bars = Array.from(data).slice(0, 12).map((v) => Math.max(2, (v / 255) * 40));
        setVisualBars(bars);
        animRef.current = requestAnimationFrame(updateBars);
      };
      animRef.current = requestAnimationFrame(updateBars);

      // Recorder
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = () => {
        cancelAnimationFrame(animRef.current);
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setPhase("preview");
        stream.getTracks().forEach((t) => t.stop());
      };

      recorder.start();
      recorderRef.current = recorder;
      setPhase("recording");
      setTimeLeft(durationSeconds);

      // Countdown
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            recorder.stop();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch {
      // Microphone access denied
    }
  }, [durationSeconds]);

  const stopRecording = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    recorderRef.current?.stop();
  }, []);

  const reRecord = useCallback(() => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setVisualBars(Array(12).fill(2));
    startRecording();
  }, [audioUrl, startRecording]);

  const handleSubmit = useCallback(() => {
    // Convert blob to base64 data URL for submission
    const blob = new Blob(chunksRef.current, { type: "audio/webm" });
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      onSubmit(dataUrl);
      setPhase("submitted");
    };
    reader.readAsDataURL(blob);
  }, [onSubmit]);

  if (phase === "submitted") {
    return (
      <div className="flex flex-col items-center gap-4 py-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 12 }}
          className="w-14 h-14 bg-retro-green/20 border-2 border-retro-green flex items-center justify-center"
          style={{ boxShadow: "0 0 24px rgba(57,255,20,0.3)" }}
        >
          <span className="font-retro text-xl text-retro-green">{"\u2714"}</span>
        </motion.div>
        <p className="font-retro text-[10px] text-retro-green uppercase tracking-wider">
          SOUND SUBMITTED!
        </p>
      </div>
    );
  }

  if (phase === "preview" && audioUrl) {
    return (
      <div className="flex flex-col items-center gap-4 py-4">
        <p className="font-retro text-[10px] text-retro-purple-light uppercase tracking-wider">
          PREVIEW YOUR SOUND
        </p>
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <audio src={audioUrl} controls className="w-full max-w-xs" />
        <div className="flex gap-3 w-full max-w-xs">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={reRecord}
            disabled={disabled}
            className={cn(
              "flex-1 font-retro text-[10px] uppercase tracking-wider px-4 py-2.5",
              "border border-retro-muted/30 bg-elevated text-retro-muted",
              "disabled:opacity-40 disabled:cursor-not-allowed"
            )}
          >
            Re-record
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleSubmit}
            disabled={disabled}
            className={cn(
              "flex-1 font-retro text-[10px] uppercase tracking-wider px-4 py-2.5",
              "bg-retro-green text-page shadow-[0_4px_0_#1a8a09]",
              "active:translate-y-[2px] active:shadow-[0_0_0_#1a8a09]",
              "disabled:opacity-40 disabled:cursor-not-allowed"
            )}
          >
            Submit Sound
          </motion.button>
        </div>
      </div>
    );
  }

  if (phase === "recording") {
    return (
      <div className="flex flex-col items-center gap-4 py-4">
        {/* Visualizer bars */}
        <div className="flex items-end gap-1 h-12">
          {visualBars.map((h, i) => (
            <motion.div
              key={i}
              className="w-3 bg-retro-pink rounded-sm"
              animate={{ height: h }}
              transition={{ duration: 0.05 }}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-retro-pink animate-pulse" />
          <span className="font-retro text-xs text-retro-pink uppercase tracking-wider">
            RECORDING {timeLeft}s
          </span>
        </div>

        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={stopRecording}
          className={cn(
            "w-full max-w-xs py-4 font-retro text-[10px] uppercase tracking-wider",
            "bg-retro-pink text-white shadow-[0_4px_0_#8a1a3a]",
            "active:translate-y-[2px] active:shadow-[0_0_0_#8a1a3a]"
          )}
        >
          STOP RECORDING
        </motion.button>
      </div>
    );
  }

  // Idle
  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={startRecording}
        disabled={disabled}
        className={cn(
          "w-full max-w-xs py-8 font-retro text-sm uppercase tracking-wider transition-all",
          "bg-retro-pink text-white shadow-[0_6px_0_#8a1a3a]",
          "active:translate-y-1 active:shadow-[0_2px_0_#8a1a3a]",
          "disabled:opacity-40 disabled:cursor-not-allowed"
        )}
      >
        START RECORDING
      </motion.button>
      <p className="font-body text-xs text-retro-muted text-center">
        Record up to {durationSeconds} seconds of audio!
      </p>
    </div>
  );
}
