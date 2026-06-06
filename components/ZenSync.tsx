"use client";

import { useAtmosphere, SCAPES } from "@/providers/AtmosphereProvider";
import { 
  Volume2, 
  VolumeX,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "./ui/button";

export const ZenSync = () => {
  const { activeScape, setActiveScape, isMuted, setIsMuted } = useAtmosphere();

  return (
    <div className="flex items-center gap-2">
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={() => setIsMuted(!isMuted)}
        className="text-zinc-400 hover:text-white"
      >
        {isMuted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="bg-dark-3 border-white/10 text-white gap-2">
            <activeScape.icon className="size-4 text-blue-1" />
            <span className="max-md:hidden">{activeScape.name}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-dark-2 border-white/5 text-white w-48">
          <DropdownMenuLabel>Change Atmosphere</DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-white/5" />
          {SCAPES.map((scape) => (
            <DropdownMenuItem 
              key={scape.id} 
              onClick={() => setActiveScape(scape)}
              className="flex items-center gap-2 cursor-pointer focus:bg-white/5"
            >
              <scape.icon className="size-4 text-zinc-500" />
              <span>{scape.name}</span>
              {activeScape.id === scape.id && <div className="ml-auto size-2 rounded-full bg-blue-1" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
