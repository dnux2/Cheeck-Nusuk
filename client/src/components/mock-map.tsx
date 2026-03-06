import { motion } from "framer-motion";
import { MapPin, Navigation } from "lucide-react";
import { useState } from "react";
import { type Pilgrim } from "@shared/schema";
import { PilgrimPopup } from "@/components/pilgrim-popup";

interface MapPoint {
  id: number | string;
  x: number;
  y: number;
  isEmergency?: boolean;
  pilgrim?: Pilgrim;
  label?: string;
}

interface MockMapProps {
  activePoints?: number;
  pilgrims?: Pilgrim[];
}

function randomSeed(str: string) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = (h * 33) ^ str.charCodeAt(i);
  return Math.abs(h);
}

export function MockMap({ activePoints = 5, pilgrims }: MockMapProps) {
  const [selectedPilgrim, setSelectedPilgrim] = useState<Pilgrim | null>(null);

  const points: MapPoint[] = pilgrims && pilgrims.length > 0
    ? pilgrims.map((p) => {
        const seed = randomSeed(p.passportNumber);
        return {
          id: p.id,
          x: (seed % 70) + 10,
          y: ((seed >> 4) % 70) + 10,
          isEmergency: p.emergencyStatus ?? false,
          pilgrim: p,
        };
      })
    : Array.from({ length: activePoints }).map((_, i) => ({
        id: i,
        x: Math.floor(Math.random() * 80) + 10,
        y: Math.floor(Math.random() * 80) + 10,
        isEmergency: Math.random() > 0.8,
      }));

  return (
    <>
      <div className="w-full h-full min-h-[400px] bg-[#0A1A16] rounded-2xl relative overflow-hidden border border-primary/20 shadow-2xl">
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-grid opacity-20" />

        {/* Radar Sweep Effect */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/2 left-1/2 w-[200%] h-[200%] -translate-x-1/2 -translate-y-1/2 origin-center"
          style={{
            background: "conic-gradient(from 0deg, transparent 70%, rgba(14, 77, 65, 0.4) 100%)",
          }}
        />

        {/* Markers */}
        <div className="absolute inset-0">
          {points.map((point) => (
            <motion.div
              key={point.id}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: Math.random() * 1 }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 group ${point.pilgrim ? "cursor-pointer" : ""}`}
              style={{ left: `${point.x}%`, top: `${point.y}%` }}
              onClick={() => point.pilgrim && setSelectedPilgrim(point.pilgrim)}
              data-testid={point.pilgrim ? `map-marker-pilgrim-${point.id}` : undefined}
            >
              <div className="relative">
                <span
                  className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${
                    point.isEmergency ? "bg-destructive" : "bg-accent"
                  }`}
                />
                <div
                  className={`relative w-3.5 h-3.5 rounded-full shadow-lg border-2 border-white transition-transform group-hover:scale-150 ${
                    point.isEmergency ? "bg-destructive" : "bg-accent"
                  }`}
                />
                {point.pilgrim && (
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-10">
                    <div className="bg-black/80 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg shadow-lg backdrop-blur-sm border border-white/10">
                      {point.pilgrim.name}
                    </div>
                    <div className="w-2 h-2 bg-black/80 rotate-45 mx-auto -mt-1" />
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Map Controls */}
        <div className="absolute bottom-6 right-6 flex flex-col gap-2">
          <button className="w-10 h-10 bg-black/50 backdrop-blur-md border border-white/10 rounded-xl flex items-center justify-center text-white transition-colors">
            <Navigation className="w-5 h-5" />
          </button>
          <button className="w-10 h-10 bg-black/50 backdrop-blur-md border border-white/10 rounded-xl flex items-center justify-center text-white transition-colors">
            <MapPin className="w-5 h-5" />
          </button>
        </div>

        {/* Legend */}
        <div className="absolute top-6 left-6 bg-black/50 backdrop-blur-md border border-white/10 p-3 rounded-xl flex flex-col gap-2 text-xs font-medium text-white/80">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent" /> Normal Activity
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" /> Emergency
          </div>
          {pilgrims && (
            <div className="text-white/50 mt-1 text-[10px] border-t border-white/10 pt-1.5">
              Click marker for details
            </div>
          )}
        </div>
      </div>

      <PilgrimPopup pilgrim={selectedPilgrim} onClose={() => setSelectedPilgrim(null)} />
    </>
  );
}
