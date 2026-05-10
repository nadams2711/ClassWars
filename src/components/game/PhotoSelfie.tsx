"use client";

import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface PhotoSelfieProps {
  onSubmit: (dataUrl: string) => void;
  disabled?: boolean;
}

export function PhotoSelfie({ onSubmit, disabled = false }: PhotoSelfieProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    try {
      setCapturing(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 300 }, height: { ideal: 300 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch {
      setCapturing(false);
    }
  }, []);

  const takePhoto = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Mirror the image (selfie mode)
    ctx.translate(300, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, 300, 300);
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
    setPreview(dataUrl);

    // Stop camera
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCapturing(false);
  }, []);

  const retake = useCallback(() => {
    setPreview(null);
    startCamera();
  }, [startCamera]);

  const handleSubmit = useCallback(() => {
    if (preview) {
      onSubmit(preview);
    }
  }, [preview, onSubmit]);

  if (preview) {
    return (
      <div className="flex flex-col items-center gap-3">
        <div className="relative border-2 border-retro-purple/40 overflow-hidden" style={{ width: 200, height: 200 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Your selfie" className="w-full h-full object-cover" />
        </div>
        <div className="flex gap-3 w-full max-w-xs">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={retake}
            disabled={disabled}
            className={cn(
              "flex-1 font-retro text-[10px] uppercase tracking-wider px-4 py-2.5 transition-all",
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
              "flex-1 font-retro text-[10px] uppercase tracking-wider px-4 py-2.5 transition-all",
              "bg-retro-green text-page shadow-[0_4px_0_#1a8a09]",
              "active:translate-y-[2px] active:shadow-[0_0_0_#1a8a09]",
              "disabled:opacity-40 disabled:cursor-not-allowed"
            )}
          >
            Submit Selfie
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {capturing ? (
        <>
          <div className="relative border-2 border-retro-purple/40 overflow-hidden" style={{ width: 200, height: 200 }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ transform: "scaleX(-1)" }}
            />
          </div>
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={takePhoto}
            disabled={disabled}
            className={cn(
              "w-16 h-16 rounded-full border-4 border-retro-pink bg-retro-pink/20 flex items-center justify-center",
              "active:bg-retro-pink/40 transition-colors",
              "disabled:opacity-40 disabled:cursor-not-allowed"
            )}
            style={{ boxShadow: "0 0 20px rgba(255,45,120,0.3)" }}
          >
            <div className="w-12 h-12 rounded-full bg-retro-pink" />
          </motion.button>
        </>
      ) : (
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={startCamera}
          disabled={disabled}
          className={cn(
            "w-full max-w-xs py-6 font-retro text-sm uppercase tracking-wider transition-all",
            "bg-retro-pink text-white shadow-[0_6px_0_#8a1a3a]",
            "active:translate-y-1 active:shadow-[0_2px_0_#8a1a3a]",
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
