import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState, useCallback } from "react";
import { MapContainer, TileLayer, Circle, Marker, Popup, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle, MapPin, Activity } from "lucide-react";
import { type Pilgrim } from "@shared/schema";
import { useLanguage } from "@/contexts/language-context";

// Fix default icon paths broken by Vite bundling
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface Zone {
  id: string;
  nameAr: string;
  nameEn: string;
  lat: number;
  lng: number;
  radius: number;
  pilgrimCount: number;
  capacity: number;
  status: "normal" | "busy" | "warning" | "empty";
  sectorId: string;
  ritualAr: string;
  ritualEn: string;
  descAr: string;
  descEn: string;
}

const HAJJ_ZONES: Zone[] = [
  {
    id: "haram",
    nameAr: "المسجد الحرام",
    nameEn: "Grand Mosque",
    lat: 21.4225, lng: 39.8262, radius: 600,
    pilgrimCount: 42000, capacity: 60000, status: "busy", sectorId: "S5",
    ritualAr: "الطواف والسعي", ritualEn: "Tawaf & Sa'i",
    descAr: "المسجد الأعظم في العالم — قلب الإسلام ومقصد الحجاج والمعتمرين",
    descEn: "The largest mosque in the world — the heart of Islam",
  },
  {
    id: "mina",
    nameAr: "مِنىٰ", nameEn: "Mina",
    lat: 21.4133, lng: 39.8907, radius: 1800,
    pilgrimCount: 38000, capacity: 50000, status: "busy", sectorId: "S1",
    ritualAr: "المبيت ورمي الجمرات", ritualEn: "Staying & Stoning Ritual",
    descAr: "مخيم الحج — يُقيم فيه الحجاج ليالي التشريق في خيام ممتدة",
    descEn: "The Hajj campsite — pilgrims stay here in tent cities during Tashreeq",
  },
  {
    id: "jamarat",
    nameAr: "جسر الجمرات", nameEn: "Jamarat Bridge",
    lat: 21.4225, lng: 39.8734, radius: 350,
    pilgrimCount: 18000, capacity: 20000, status: "warning", sectorId: "S4",
    ritualAr: "رمي الجمرات", ritualEn: "Stoning of the Devil",
    descAr: "موقع رمي الجمرات الثلاث — أحد أهم شعائر الحج",
    descEn: "The site of stoning the three pillars — one of the most important Hajj rituals",
  },
  {
    id: "muzdalifah",
    nameAr: "مُزدلِفة", nameEn: "Muzdalifah",
    lat: 21.3833, lng: 39.9286, radius: 2500,
    pilgrimCount: 5000, capacity: 40000, status: "empty", sectorId: "S3",
    ritualAr: "المبيت وجمع الحصى", ritualEn: "Overnight stay & pebble collection",
    descAr: "المشعر الحرام — يبيت فيه الحجاج ليلة العيد ويجمعون الحصى للرمي",
    descEn: "Sacred grounds where pilgrims spend the night of Eid and collect pebbles",
  },
  {
    id: "arafat",
    nameAr: "عَرَفات", nameEn: "Arafat",
    lat: 21.3547, lng: 39.9845, radius: 4000,
    pilgrimCount: 3000, capacity: 80000, status: "empty", sectorId: "S2",
    ritualAr: "الوقوف بعرفة", ritualEn: "Standing at Arafat",
    descAr: "ركن الحج الأعظم — يقف فيه الحجاج يوم عرفة دعاءً وتضرعاً",
    descEn: "The pinnacle of Hajj — pilgrims stand here in prayer on the Day of Arafat",
  },
];

function zoneColor(status: Zone["status"]) {
  switch (status) {
    case "warning": return { stroke: "#EF4444", fill: "#EF444440" };
    case "busy":    return { stroke: "#F59E0B", fill: "#F59E0B30" };
    case "normal":  return { stroke: "#10B981", fill: "#10B98120" };
    case "empty":   return { stroke: "#6B7280", fill: "#6B728015" };
  }
}

function makePilgrimIcon(emergency: boolean, expired: boolean, highlighted: boolean) {
  const color = emergency ? "#EF4444" : expired ? "#F59E0B" : "#10B981";
  const size = highlighted ? 22 : 14;
  const border = highlighted ? "3px solid #fff" : "2px solid #fff";
  const shadow = highlighted ? `0 0 14px 4px ${color}CC` : `0 0 6px ${color}99`;
  const anim = (emergency || highlighted) ? "animation:pulse 1.2s infinite;" : "";
  return L.divIcon({
    className: "",
    html: `<div style="
      width:${size}px;height:${size}px;
      background:${color};
      border:${border};
      border-radius:50%;
      box-shadow:${shadow};
      ${anim}
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

// ── Helper map-context components ──────────────────────────────────────────

function ZoomControls() {
  const map = useMap();
  useEffect(() => {
    const ctrl = L.control.zoom({ position: "bottomright" });
    ctrl.addTo(map);
    return () => { ctrl.remove(); };
  }, [map]);
  return null;
}

function FitBounds() {
  const map = useMap();
  useEffect(() => {
    const bounds = L.latLngBounds(HAJJ_ZONES.map(z => [z.lat, z.lng]));
    map.fitBounds(bounds, { padding: [60, 60] });
  }, [map]);
  return null;
}

function FlyToHighlighted({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 17, { duration: 1.4 });
  }, [lat, lng, map]);
  return null;
}

// ── Pilgrim marker component (manages its own popup auto-open) ─────────────

interface PilgrimMarkerProps {
  pilgrim: Pilgrim;
  isHighlighted: boolean;
  ar: boolean;
  isRTL: boolean;
}

function PilgrimMarker({ pilgrim, isHighlighted, ar, isRTL }: PilgrimMarkerProps) {
  const markerRef = useRef<L.Marker | null>(null);
  const expired = pilgrim.permitStatus === "Expired";
  const icon = makePilgrimIcon(!!pilgrim.emergencyStatus, expired, isHighlighted);

  useEffect(() => {
    if (isHighlighted && markerRef.current) {
      const timer = setTimeout(() => markerRef.current?.openPopup(), 600);
      return () => clearTimeout(timer);
    }
  }, [isHighlighted]);

  return (
    <Marker
      ref={markerRef}
      position={[pilgrim.locationLat!, pilgrim.locationLng!]}
      icon={icon}
    >
      <Popup>
        <div style={{ fontFamily: "sans-serif", minWidth: 190, direction: isRTL ? "rtl" : "ltr" }}>
          <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 4, color: "#0E4D41" }}>
            {pilgrim.name}
          </div>
          <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>
            {pilgrim.nationality}
          </div>
          <div style={{ fontSize: 12, marginBottom: 3 }}>
            {ar ? "المجموعة:" : "Group:"}{" "}
            <span style={{ color: "#444" }}>{pilgrim.campaignGroup ?? "—"}</span>
          </div>
          <div style={{ fontSize: 12, marginBottom: 8 }}>
            {ar ? "التصريح:" : "Permit:"}{" "}
            <b style={{
              color: pilgrim.permitStatus === "Valid" ? "#10B981"
                : pilgrim.permitStatus === "Expired" ? "#F59E0B" : "#EF4444"
            }}>
              {pilgrim.permitStatus}
            </b>
          </div>
          {pilgrim.emergencyStatus && (
            <div style={{ marginBottom: 8, padding: "4px 10px", background: "#FEE2E2", color: "#DC2626", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
              ⚠ {ar ? "طوارئ نشطة" : "Emergency Active"}
            </div>
          )}
          <a
            href="/pilgrims"
            style={{
              display: "block", textAlign: "center", padding: "6px 12px",
              background: "#0E4D41", color: "#fff", borderRadius: 8,
              fontSize: 12, fontWeight: 700, textDecoration: "none",
            }}
          >
            {ar ? "عرض الملف الشخصي" : "View Profile"}
          </a>
        </div>
      </Popup>
    </Marker>
  );
}

// ── Main RealMap component ─────────────────────────────────────────────────

interface RealMapProps {
  pilgrims?: Pilgrim[];
  sectorData: { id: string; load: number; status: string }[];
  onZoneClick?: (zone: Zone) => void;
  highlightedPilgrimId?: number;
}

export function RealMap({ pilgrims, sectorData, onZoneClick, highlightedPilgrimId }: RealMapProps) {
  const { lang, isRTL } = useLanguage();
  const ar = lang === "ar";
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);

  const highlightedPilgrim = highlightedPilgrimId
    ? pilgrims?.find(p => p.id === highlightedPilgrimId)
    : undefined;

  const enrichedZones = HAJJ_ZONES.map(z => {
    const sector = sectorData.find(s => s.id === z.sectorId);
    if (!sector) return z;
    const load = sector.load;
    const status: Zone["status"] =
      load >= 80 ? "warning" : load >= 50 ? "busy" : load >= 5 ? "normal" : "empty";
    return { ...z, pilgrimCount: Math.round((load / 100) * z.capacity), status };
  });

  const handleZoneClick = useCallback((zone: Zone) => {
    setSelectedZone(zone);
    onZoneClick?.(zone);
  }, [onZoneClick]);

  return (
    <div className="relative w-full h-full" style={{ minHeight: 300, isolation: "isolate" }}>
      <MapContainer
        center={[21.4225, 39.8900]}
        zoom={12}
        scrollWheelZoom={true}
        touchZoom={true}
        doubleClickZoom={true}
        dragging={true}
        zoomControl={false}
        attributionControl={false}
        style={{ width: "100%", height: "100%", background: "#f5f5f0", position: "absolute", inset: 0 }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          subdomains="abcd"
          maxZoom={20}
        />

        <ZoomControls />
        <FitBounds />

        {/* Fly to highlighted pilgrim */}
        {highlightedPilgrim?.locationLat && highlightedPilgrim?.locationLng && (
          <FlyToHighlighted
            lat={highlightedPilgrim.locationLat}
            lng={highlightedPilgrim.locationLng}
          />
        )}

        {/* Zone circles */}
        {enrichedZones.map(zone => {
          const { stroke, fill } = zoneColor(zone.status);
          return (
            <Circle
              key={zone.id}
              center={[zone.lat, zone.lng]}
              radius={zone.radius}
              pathOptions={{
                color: stroke,
                fillColor: fill,
                fillOpacity: 1,
                weight: zone.status === "warning" ? 2.5 : 1.5,
                dashArray: zone.status === "warning" ? "6 4" : undefined,
              }}
              eventHandlers={{ click: () => handleZoneClick(zone) }}
            >
              <Tooltip direction="top" offset={[0, -6]} opacity={0.95}>
                <span style={{ fontWeight: 700, fontSize: 12 }}>
                  {ar ? zone.nameAr : zone.nameEn}
                </span>
              </Tooltip>
            </Circle>
          );
        })}

        {/* Pilgrim markers */}
        {pilgrims?.map(pilgrim => {
          if (!pilgrim.locationLat || !pilgrim.locationLng) return null;
          return (
            <PilgrimMarker
              key={pilgrim.id}
              pilgrim={pilgrim}
              isHighlighted={pilgrim.id === highlightedPilgrimId}
              ar={ar}
              isRTL={isRTL}
            />
          );
        })}
      </MapContainer>

      {/* Zone info popup */}
      <AnimatePresence>
        {selectedZone && (
          <motion.div
            key="zone-popup"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className={`absolute bottom-14 ${isRTL ? "right-4" : "left-4"} w-72 bg-card/97 backdrop-blur-xl border border-border rounded-2xl shadow-2xl p-5`}
            style={{ zIndex: 850 }}
            dir={isRTL ? "rtl" : "ltr"}
          >
            <div className={`flex justify-between items-start mb-3 ${isRTL ? "flex-row-reverse" : ""}`}>
              <div>
                <h3 className="font-bold text-base leading-tight">{ar ? selectedZone.nameAr : selectedZone.nameEn}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{ar ? selectedZone.ritualAr : selectedZone.ritualEn}</p>
              </div>
              <button onClick={() => setSelectedZone(null)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors -mt-1 flex-shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className={`text-xs text-muted-foreground mb-4 leading-relaxed ${isRTL ? "text-right" : ""}`}>
              {ar ? selectedZone.descAr : selectedZone.descEn}
            </p>

            <div className="mb-3">
              <div className={`flex justify-between text-xs font-semibold mb-1.5 ${isRTL ? "flex-row-reverse" : ""}`}>
                <span className="text-muted-foreground">{ar ? "الكثافة" : "Density"}</span>
                <span className={
                  selectedZone.status === "warning" ? "text-destructive" :
                  selectedZone.status === "busy" ? "text-accent" : "text-primary"
                }>
                  {Math.round((selectedZone.pilgrimCount / selectedZone.capacity) * 100)}%
                </span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    selectedZone.status === "warning" ? "bg-destructive" :
                    selectedZone.status === "busy" ? "bg-accent" : "bg-primary"
                  }`}
                  style={{ width: `${Math.round((selectedZone.pilgrimCount / selectedZone.capacity) * 100)}%` }}
                />
              </div>
            </div>

            <div className={`grid grid-cols-2 gap-2 text-sm mb-4 ${isRTL ? "text-right" : ""}`}>
              <div className="bg-secondary/50 rounded-xl p-3">
                <div className="text-xs text-muted-foreground mb-1">{ar ? "الحجاج" : "Pilgrims"}</div>
                <div className="font-bold">{selectedZone.pilgrimCount.toLocaleString()}</div>
              </div>
              <div className="bg-secondary/50 rounded-xl p-3">
                <div className="text-xs text-muted-foreground mb-1">{ar ? "الطاقة" : "Capacity"}</div>
                <div className="font-bold">{selectedZone.capacity.toLocaleString()}</div>
              </div>
            </div>

            {selectedZone.status === "warning" && (
              <div className={`flex items-center gap-2 bg-destructive/10 border border-destructive/30 text-destructive text-xs font-bold rounded-xl p-3 mb-4 ${isRTL ? "flex-row-reverse" : ""}`}>
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                {ar ? "تحذير: اكتظاظ شديد" : "Warning: High congestion"}
              </div>
            )}

            <div className="flex gap-2">
              <button className="flex-1 py-2.5 bg-primary text-primary-foreground text-sm font-bold rounded-xl hover:bg-primary/90 transition-colors">
                {ar ? "تحويل المسار" : "Redirect Route"}
              </button>
              <button className="py-2.5 px-3 bg-secondary text-secondary-foreground rounded-xl hover:bg-secondary/80 transition-colors">
                <Activity className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Highlighted pilgrim banner */}
      <AnimatePresence>
        {highlightedPilgrim && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`absolute top-4 ${isRTL ? "left-4" : "right-4"} flex items-center gap-2 bg-primary text-primary-foreground text-xs font-bold px-3 py-2 rounded-xl shadow-lg`}
            style={{ zIndex: 850 }}
            dir={isRTL ? "rtl" : "ltr"}
          >
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            {ar ? `تتبع: ${highlightedPilgrim.name}` : `Tracking: ${highlightedPilgrim.name}`}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <div className={`absolute top-4 ${isRTL ? "right-4" : "left-4"} bg-card/92 backdrop-blur-xl border border-border rounded-xl p-3 shadow-xl`} style={{ zIndex: 850 }} dir={isRTL ? "rtl" : "ltr"}>
        <div className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wider">{ar ? "مستوى الازدحام" : "Density"}</div>
        {[
          { color: "#EF4444", label: ar ? "تحذير" : "Warning" },
          { color: "#F59E0B", label: ar ? "مزدحم" : "Busy" },
          { color: "#10B981", label: ar ? "طبيعي" : "Normal" },
          { color: "#6B7280", label: ar ? "فارغ" : "Empty" },
        ].map(item => (
          <div key={item.label} className={`flex items-center gap-2 text-xs mb-1.5 ${isRTL ? "flex-row-reverse" : ""}`}>
            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: item.color }} />
            <span className="text-foreground/80">{item.label}</span>
          </div>
        ))}
        <div className="border-t border-border/50 mt-2 pt-2">
          <div className={`flex items-center gap-2 text-xs mb-1 ${isRTL ? "flex-row-reverse" : ""}`}>
            <span className="w-3 h-3 rounded-full bg-emerald-500 flex-shrink-0" />
            <span className="text-foreground/80">{ar ? "حاج طبيعي" : "Normal"}</span>
          </div>
          <div className={`flex items-center gap-2 text-xs mb-1 ${isRTL ? "flex-row-reverse" : ""}`}>
            <span className="w-3 h-3 rounded-full bg-amber-400 flex-shrink-0" />
            <span className="text-foreground/80">{ar ? "تصريح منتهي" : "Expired Permit"}</span>
          </div>
          <div className={`flex items-center gap-2 text-xs ${isRTL ? "flex-row-reverse" : ""}`}>
            <span className="w-3 h-3 rounded-full bg-red-500 flex-shrink-0" />
            <span className="text-foreground/80">{ar ? "حالة طوارئ" : "Emergency"}</span>
          </div>
        </div>
      </div>

      {/* Attribution */}
      <div className="absolute bottom-2 right-12 text-[10px] text-black/40 font-mono pointer-events-none" style={{ zIndex: 850 }} dir="ltr">
        © CARTO / OpenStreetMap
      </div>
    </div>
  );
}
