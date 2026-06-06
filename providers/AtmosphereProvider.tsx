"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { Sparkles, Coffee, Moon, CloudRain, Leaf } from "lucide-react";

export const SCAPES = [
  {
    id: "default",
    name: "Standard",
    icon: Sparkles,
    color: "#0A0A0A",
    filter: "none",
    audio: null,
  },
  {
    id: "parchment",
    name: "Ancient Library",
    icon: Coffee,
    color: "#1a1612",
    filter: "sepia(0.2) contrast(1.1)",
    audio: "https://www.soundjay.com/misc/sounds/paper-flip-1.mp3",
  },
  {
    id: "midnight",
    name: "Midnight Code",
    icon: Moon,
    color: "#050510",
    filter: "hue-rotate(220deg) brightness(0.8)",
    audio: "https://www.soundjay.com/nature/sounds/cricket-chirp-1.mp3",
  },
  {
    id: "zen",
    name: "Rainy Haven",
    icon: CloudRain,
    color: "#0d110d",
    filter: "grayscale(0.3) brightness(0.8)",
    audio: "https://www.soundjay.com/nature/sounds/rain-07.mp3",
  },
  {
    id: "forest",
    name: "Bonsai Garden",
    icon: Leaf,
    color: "#050a05",
    filter: "hue-rotate(80deg) brightness(0.9)",
    audio: "https://www.soundjay.com/nature/sounds/wind-01.mp3",
  }
];

type Scape = typeof SCAPES[0];

interface AtmosphereContextType {
  activeScape: Scape;
  setActiveScape: (scape: Scape) => void;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
}

const AtmosphereContext = createContext<AtmosphereContextType | undefined>(undefined);

export const AtmosphereProvider = ({ children }: { children: React.ReactNode }) => {
  const [activeScape, setActiveScape] = useState(SCAPES[0]);
  const [isMuted, setIsMuted] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Apply styles to body
    const body = document.body;
    body.style.backgroundColor = activeScape.color;
    body.style.filter = activeScape.filter;
    body.style.transition = "all 2s cubic-bezier(0.4, 0, 0.2, 1)";

    // Setup audio
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }

    const audio = audioRef.current;
    audio.pause();
    
    if (activeScape.audio && !isMuted) {
      audio.src = activeScape.audio;
      audio.loop = true;
      audio.play().catch(e => console.log("Audio play blocked by browser policy"));
    }

    return () => {
      audio.pause();
    };
  }, [activeScape, isMuted]);

  return (
    <AtmosphereContext.Provider value={{ activeScape, setActiveScape, isMuted, setIsMuted }}>
      {children}
    </AtmosphereContext.Provider>
  );
};

export const useAtmosphere = () => {
  const context = useContext(AtmosphereContext);
  if (!context) throw new Error("useAtmosphere must be used within AtmosphereProvider");
  return context;
};
