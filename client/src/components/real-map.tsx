import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState, useCallback } from "react";
import { MapContainer, TileLayer, Circle, Marker, Popup, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import { motion, AnimatePresence } from "framer-motion";
import { X, Users, AlertTriangle, MapPin, Activity } from "lucide-react";
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
    lat: 21.4225,
    lng: 39.8262,
    radius: 600,
    pilgrimCount: 42000,
    capacity: 60000,
    status: "busy",
    sectorId: "S5",
    ritualAr: "الطواف والسعي",
    ritualEn: "Tawaf & Sa'i",
    descAr: "المسجد الأعظم في العالم — قلب الإسلام ومقصد الحجاج والمعتمرين",
    descEn: "The largest mosque in the world — the heart of Islam",
  },
  {
    id: "mina",
    nameAr: "مِنىٰ",
    nameEn: "Mina",
    lat: 21.4133,
    lng: 39.8907,
    radius: 1800,
    pilgrimCount: 38000,
    capacity: 50000,
    status: "busy",
    sectorId: "S1",
    ritualAr: "المبيت ورمي الجمرات",
    ritualEn: "Staying & Stoning Ritual",
    descAr: "مخيم الحج — يُقيم فيه الحجاج ليالي التشريق في خيام ممتدة",
    descEn: "The Hajj campsite — pilgrims stay here in tent cities during Tashreeq",
  },
  {
    id: "jamarat",
    nameAr: "جسر الجمرات",
    nameEn: "Jamarat Bridge",
    lat: 21.4225,
    lng: 39.8734,
    radius: 350,
    pilgrimCount: 18000,
    capacity: 20000,
    status: "warning",
    sectorId: "S4",
    ritualAr: "رمي الجمرات",
    ritualEn: "Stoning of the Devil",
    descAr: "موقع رمي الجمرات الثلاث — أحد أهم شعائر الحج",
    descEn: "The site of stoning the three pillars — one of the most important Hajj rituals",
  },
  {
    id: "muzdalifah",
    nameAr: "مُزدلِفة",
    nameEn: "Muzdalifah",
    lat: 21.3833,
    lng: 39.9286,
    radius: 2500,
    pilgrimCount: 5000,
    capacity: 40000,
    status: "empty",
    sectorId: "S3",
    ritualAr: "المبيت وجمع الحصى",
    ritualEn: "Overnight stay & pebble collection",
    descAr: "المشعر الحرام — يبيت فيه الحجاج ليلة العيد ويجمعون الحصى للرمي",
    descEn: "Sacred grounds where pilgrims spend the night of Eid and collect pebbles",
  },
  {
    id: "arafat",
    nameAr: "عَرَفات",
    nameEn: "Arafat",
    lat: 21.3547,
    lng: 39.9845,
    radius: 4000,
    pilgrimCount: 3000,
    capacity: 80000,
    status: "empty",
    sectorId: "S2",
    ritualAr: "الوقوف بعرفة",
    ritualEn: "Standing at Arafat",
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

function makePilgrimIcon(emergency: boolean, expired: boolean) {
  const color = emergency ? "#EF4444" : expired ? "#F59E0B" : "#10B981";
  return L.divIcon({
    className: "",
    html: `<div style="
      width:14px;height:14px;
      background:${color};
      border:2px solid #fff;
      border-radius:50%;
      box-shadow:0 0 6px ${color}99;
      ${emergency ? `animation:pulse 1.2s infinite;` : ""}
    "></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

function makeZoneLabel(nameAr: string, nameEn: string, status: Zone["status"], lang: string) {
  const { stroke } = zoneColor(status);
  const name = lang === "ar" ? nameAr : nameEn;
  return L.divIcon({
    className: "",
    html: `<div style="
      background:rgba(0,0,0,0.75);
      backdrop-filter:blur(4px);
      color:#fff;
      font-size:11px;
      font-weight:700;
      padding:3px 8px;
      border-radius:6px;
      border:1px solid ${stroke};
      white-space:nowrap;
      font-family:monospace;
      pointer-events:none;
    ">${name}</div>`,
    iconSize: undefined,
    iconAnchor: undefined,
  });
}

function FitBounds() {
  const map = useMap();
  useEffect(() => {
    const bounds = L.latLngBounds(HAJJ_ZONES.map(z => [z.lat, z.lng]));
    map.fitBounds(bounds, { padding: [60, 60] });
  }, [map]);
  return null;
}

interface RealMapProps {
  pilgrims?: Pilgrim[];
  sectorData: { id: string; load: number; status: string }[];
  onZoneClick?: (zone: Zone) => void;
}

export function RealMap({ pilgrims, sectorData, onZoneClick }: RealMapProps) {
  const { lang, isRTL } = useLanguage();
  const ar = lang === "ar";
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);

  const enrichedZones = HAJJ_ZONES.map(z => {
    const sector = sectorData.find(s => s.id === z.sectorId);
    if (!sector) return z;
    const load = sector.load;
    const status: Zone["status"] =
      load >= 80 ? "warning" : load >= 50 ? "busy" : load >= 5 ? "normal" : "empty";
    return {
      ...z,
      pilgrimCount: Math.round((load / 100) * z.capacity),
      status,
    };
  });

  const handleZoneClick = useCallback((zone: Zone) => {
    setSelectedZone(zone);
    onZoneClick?.(zone);
  }, [onZoneClick]);

  return (
    <div className="relative w-full h-full">
      {/* Leaflet map */}
      <MapContainer
        center={[21.4225, 39.8900]}
        zoom={12}
        style={{ width: "100%", height: "100%", background: "#f5f5f0" }}
        zoomControl={false}
        attributionControl={false}
      >
        {/* Light CartoDB Positron tiles — similar to Google Maps */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          subdomains="abcd"
          maxZoom={20}
        />

        <FitBounds />

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
          const expired = pilgrim.permitStatus === "Expired";
          const icon = makePilgrimIcon(!!pilgrim.emergencyStatus, expired);
          return (
            <Marker
              key={pilgrim.id}
              position={[pilgrim.locationLat, pilgrim.locationLng]}
              icon={icon}
            >
              <Popup>
                <div style={{ fontFamily: "sans-serif", minWidth: 180, direction: isRTL ? "rtl" : "ltr" }}>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{pilgrim.name}</div>
                  <div style={{ fontSize: 11, color: "#888", marginBottom: 2 }}>{pilgrim.nationality}</div>
                  <div style={{ fontSize: 11, marginBottom: 2 }}>
                    {ar ? "المجموعة:" : "Group:"} {pilgrim.campaignGroup}
                  </div>
                  <div style={{ fontSize: 11, marginBottom: 6 }}>
                    {ar ? "التصريح:" : "Permit:"}{" "}
                    <b style={{ color: pilgrim.permitStatus === "Valid" ? "#10B981" : pilgrim.permitStatus === "Expired" ? "#F59E0B" : "#EF4444" }}>
                      {pilgrim.permitStatus}
                    </b>
                  </div>
                  {pilgrim.emergencyStatus && (
                    <div style={{ marginBottom: 6, padding: "3px 8px", background: "#FEE2E2", color: "#DC2626", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>
                      ⚠ {ar ? "طوارئ نشطة" : "Emergency Active"}
                    </div>
                  )}
                  <a
                    href="/pilgrims"
                    style={{
                      display: "block", textAlign: "center", padding: "5px 10px",
                      background: "#0E4D41", color: "#fff", borderRadius: 6,
                      fontSize: 11, fontWeight: 700, textDecoration: "none", marginTop: 4,
                    }}
                  >
                    {ar ? "عرض الملف الشخصي ←" : "View Profile →"}
                  </a>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Zone info popup (custom overlay) */}
      <AnimatePresence>
        {selectedZone && (
          <motion.div
            key="zone-popup"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className={`absolute bottom-6 ${isRTL ? "right-6" : "left-6"} z-[1000] w-80 bg-card/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl p-5`}
            dir={isRTL ? "rtl" : "ltr"}
          >
            <div className={`flex justify-between items-start mb-4 ${isRTL ? "flex-row-reverse" : ""}`}>
              <div>
                <h3 className="font-bold text-lg leading-tight">{ar ? selectedZone.nameAr : selectedZone.nameEn}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{ar ? selectedZone.ritualAr : selectedZone.ritualEn}</p>
              </div>
              <button onClick={() => setSelectedZone(null)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors -mt-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className={`text-sm text-muted-foreground mb-4 leading-relaxed ${isRTL ? "text-right" : ""}`}>
              {ar ? selectedZone.descAr : selectedZone.descEn}
            </p>

            {/* Density bar */}
            <div className="mb-3">
              <div className={`flex justify-between text-xs font-semibold mb-1.5 ${isRTL ? "flex-row-reverse" : ""}`}>
                <span className="text-muted-foreground">{ar ? "الكثافة الحالية" : "Current Density"}</span>
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

            <div className={`grid grid-cols-2 gap-3 text-sm mb-4 ${isRTL ? "text-right" : ""}`}>
              <div className="bg-secondary/50 rounded-xl p-3">
                <div className="text-xs text-muted-foreground mb-1">{ar ? "عدد الحجاج" : "Pilgrims"}</div>
                <div className="font-bold text-lg">{selectedZone.pilgrimCount.toLocaleString()}</div>
              </div>
              <div className="bg-secondary/50 rounded-xl p-3">
                <div className="text-xs text-muted-foreground mb-1">{ar ? "الطاقة الاستيعابية" : "Capacity"}</div>
                <div className="font-bold text-lg">{selectedZone.capacity.toLocaleString()}</div>
              </div>
            </div>

            {selectedZone.status === "warning" && (
              <div className={`flex items-center gap-2 bg-destructive/10 border border-destructive/30 text-destructive text-xs font-bold rounded-xl p-3 mb-4 ${isRTL ? "flex-row-reverse" : ""}`}>
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                {ar ? "تحذير: اكتظاظ شديد — يُنصح بتحويل المسارات" : "Warning: High congestion — redirect recommended"}
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

      {/* Legend overlay */}
      <div className={`absolute top-4 ${isRTL ? "right-4" : "left-4"} z-[1000] bg-card/90 backdrop-blur-xl border border-border rounded-xl p-3 shadow-xl`} dir={isRTL ? "rtl" : "ltr"}>
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
      <div className="absolute bottom-2 right-2 z-[1000] text-[10px] text-black/40 font-mono" dir="ltr">
        © CARTO / OpenStreetMap
      </div>
    </div>
  );
}
