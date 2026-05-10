"use client";

import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GroupPhotoProps {
  onSubmit: (dataUrl: string) => void;
  disabled?: boolean;
}

export function GroupPhoto({ onSubmit, disabled = false }: GroupPhotoProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    try {
      setCapturing(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch {
      // Fall back to front camera
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch {
        setCapturing(false);
      }
    }
  }, []);

  const takePhoto = useCallback(() => {
    // 3-second countdown
    setCountdown(3);
    let c = 3;
    const interval = setInterval(() => {
      c--;
      if (c <= 0) {
        clearInterval(interval);
        setCountdown(null);

        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;

        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(video, 0, 0);

        const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
        setPreview(dataUrl);

        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        setCapturing(false);
      } else {
        setCountdown(c);
      }
    }, 1000);
  }, []);

  const retake = useCallback(() => {
    setPreview(null);
    startCamera();
  }, [startCamera]);

  const handleSubmit = useCallback(() => {
    if (preview) onSubmit(preview);
  }, [preview, onSubmit]);

  if (preview) {
    return (
      <div className="flex flex-col items-center gap-3">
        <div className="relative border-2 border-retro-green/40 overflow-hidden w-full" style={{ maxWidth: 320 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Group photo" className="w-full" />
        </div>
        <div className="flex gap-3 w-full max-w-xs">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={retake}
            disabled={disabled}
            className={cn(
              "flex-1 font-retro text-[10px] uppercase tracking-wider px-4 py-2.5",
              "border border-retro-muted/30 bg-elevated text-retro-muted",
              "disabled:opacity-40 disabled:cursor-not-allowed"
            )}
          >
            Retake
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
            Submit Photo
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {capturing ? (
        <>
          <div className="relative border-2 border-retro-purple/40 overflow-hidden w-full" style={{ maxWidth: 320 }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full"
            />
            {countdown !== null && (
              <motion.div
                key={countdown}
                initial={{ scale: 2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="absolute inset-0 flex items-center justify-center bg-black/40"
              >
                <span
                  className="font-retro text-6xl text-white"
                  style={{ textShadow: "0 0 30px rgba(255,255,255,0.8)" }}
                >
                  {countdown}
                </span>
              </motion.div>
            )}
          </div>
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={takePhoto}
            disabled={disabled || countdown !== null}
            className={cn(
              "w-full max-w-xs py-4 font-retro text-sm uppercase tracking-wider",
              "bg-retro-green text-page shadow-[0_6px_0_#1a8a09]",
              "active:translate-y-1 active:shadow-[0_2px_0_#1a8a09]",
              "disabled:opacity-40 disabled:cursor-not-allowed"
            )}
          >
            {countdown !== null ? "SAY CHEESE!" : "TAKE GROUP PHOTO"}
          </motion.button>
          <p className="font-body text-[10px] text-retro-muted/60 text-center">
            3-second countdown so everyone can get ready!
          </p>
        </>
      ) : (
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={startCamera}
          disabled={disabled}
          className={cn(
            "w-full max-w-xs py-8 font-retro text-sm uppercase tracking-wider transition-all",
            "bg-retro-green text-page shadow-[0_6px_0_#1a8a09]",
            "active:translate-y-1 active:shadow-[0_2px_0_#1a8a09]",
            "disabled:opacity-40 disabled:cursor-not-allowed"
          )}
        >
          OPEN CAMERA
        </motion.button>
      )}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
