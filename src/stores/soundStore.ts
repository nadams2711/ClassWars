import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SoundStore {
  isMuted: boolean;
  volume: number;
  toggleMute: () => void;
  setVolume: (volume: number) => void;
}

export const useSoundStore = create<SoundStore>()(
  persist(
    (set) => ({
      isMuted: false,
      volume: 0.7,
      toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
      setVolume: (volume) => set({ volume }),
    }),
    { name: "deskwars-sound" }
  )
);
