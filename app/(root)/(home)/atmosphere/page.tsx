"use client";

import React from 'react';
import { 
  Zap,
} from 'lucide-react';
import { useAtmosphere, SCAPES } from '@/providers/AtmosphereProvider';

const AtmospherePage = () => {
  const { activeScape, setActiveScape } = useAtmosphere();

  // Create a mapping of description and styles for the page cards
  const cardDetails: Record<string, { description: string; color: string; accent: string }> = {
    default: {
        description: "The standard high-contrast workspace theme for clear thinking and utility.",
        color: "from-[#1a1a1a] to-[#0a0a0a]",
        accent: "text-zinc-500",
    },
    parchment: {
      description: "Warm, tactile sepia tones with the subtle sound of turning pages and a light piano in the distance.",
      color: "from-[#2c241a] to-[#1a1612]",
      accent: "text-orange-1",
    },
    midnight: {
      description: "A deep, focused dark mode with cool blue highlights and the rhythmic hum of a quiet server room.",
      color: "from-[#0a0a20] to-[#050510]",
      accent: "text-blue-1",
    },
    zen: {
      description: "A grayscale, misty environment with the soothing sound of continuous mountain rain.",
      color: "from-[#1a1a1a] to-[#0d110d]",
      accent: "text-sky-3",
    },
    forest: {
      description: "Soft green hues and ambient forest sounds to keep you grounded during stressful calls.",
      color: "from-[#0d1a0d] to-[#050a05]",
      accent: "text-green-500",
    }
  };

  return (
    <section className="flex size-full flex-col gap-10 text-white">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold lg:text-4xl">Zen Sync Environments</h1>
        <p className="text-zinc-400">Select an atmosphere to synchronize your focus and mental state.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {SCAPES.map((scape) => {
          const detail = cardDetails[scape.id] || cardDetails.default;
          const isActive = activeScape.id === scape.id;

          return (
            <div 
              key={scape.id}
              onClick={() => setActiveScape(scape)}
              className={`group relative overflow-hidden rounded-2xl border ${isActive ? 'border-blue-1 ring-1 ring-blue-1' : 'border-white/5'} bg-gradient-to-br ${detail.color} p-8 transition-all hover:scale-[1.02] hover:border-white/10 shadow-2xl cursor-pointer`}
            >
              <div className="relative z-10 flex flex-col gap-4">
                <div className={`rounded-xl bg-white/5 p-3 w-fit ${detail.accent}`}>
                  <scape.icon className="size-8" />
                </div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  {scape.name}
                  {isActive && <div className="size-2 rounded-full bg-blue-1 animate-pulse" />}
                </h2>
                <p className="text-zinc-400 leading-relaxed">
                  {detail.description}
                </p>
                
                <button 
                  className={`mt-4 w-fit rounded-lg px-6 py-2 text-sm font-semibold transition-all ${
                    isActive ? 'bg-blue-1 text-white' : 'bg-white/10 text-zinc-400 group-hover:bg-white/20'
                  }`}
                >
                  {isActive ? 'Current Atmosphere' : 'Activate Atmosphere'}
                </button>
              </div>
              
              {/* Aesthetic Glow */}
              <div className="absolute -right-10 -top-10 size-40 rounded-full bg-white/5 blur-3xl transition-all group-hover:bg-white/10" />
            </div>
          );
        })}
      </div>

      <div className="mt-10 rounded-2xl border border-blue-1/20 bg-blue-1/5 p-8 flex items-start gap-6">
        <div className="rounded-full bg-blue-1/20 p-3">
            <Zap className="size-6 text-blue-1" />
        </div>
        <div className="flex flex-col gap-2">
            <h3 className="text-xl font-bold italic">Why Zen Sync?</h3>
            <p className="text-zinc-400">
                Traditional meeting tools are designed for utility, but MeetSync is designed for the **Human Senses**. 
                Recent studies show that environmental synchronization can reduce digital fatigue by up to 30%. 
                Switch scapes throughout your day to match your energy levels.
            </p>
        </div>
      </div>
    </section>
  );
};

export default AtmospherePage;
