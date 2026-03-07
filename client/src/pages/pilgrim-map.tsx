import { useState } from "react";
import { useLanguage } from "@/contexts/language-context";
import { PilgrimLayout } from "@/components/pilgrim-layout";
import { PilgrimGuideMap } from "@/components/pilgrim-guide-map";
import { MapPin, Maximize2, Minimize2 } from "lucide-react";

export function PilgrimMapPage() {
  const { lang, isRTL } = useLanguage();
  const ar = lang === "ar";
  const [expanded, setExpanded] = useState(false);

  return (
    <PilgrimLayout>
      <div
        className={`flex flex-col ${expanded ? "h-screen" : ""}`}
        style={{ direction: isRTL ? "rtl" : "ltr", background: "linear-gradient(160deg, #d4ede6 0%, #ffffff 100%)" }}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#a8d4cb] bg-transparent flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#0E4D41]" />
              <div>
                <h1 className="font-bold text-[#0E4D41] text-base">{ar ? "خريطتي المساعدة" : "My Guide Map"}</h1>
                <p className="text-xs text-[#2d7a5f]/70">
                  {ar ? "موقعك + أقرب المنشآت والخدمات" : "Your location + nearest facilities & services"}
                </p>
              </div>
            </div>
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-2 rounded-xl hover:bg-[#a8d4cb]/40 transition-colors text-[#2d7a5f] hover:text-[#0E4D41]"
              data-testid="btn-map-expand"
              title={ar ? (expanded ? "تصغير" : "تكبير") : (expanded ? "Minimize" : "Expand")}
            >
              {expanded ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Map */}
        {expanded ? (
          <div className="flex-1" style={{ minHeight: 0 }}>
            <PilgrimGuideMap />
          </div>
        ) : (
          <div className="px-4 py-4">
            <div className="rounded-2xl overflow-hidden border border-[#a8d4cb] shadow-sm" style={{ height: 380 }}>
              <PilgrimGuideMap />
            </div>
          </div>
        )}
      </div>
    </PilgrimLayout>
  );
}
