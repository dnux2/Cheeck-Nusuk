import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState, useCallback } from "react";
import { MapContainer, TileLayer, Circle, Marker, Popup, Tooltip, useMap, Polyline } from "react-leaflet";
import L from "leaflet";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle, MapPin, Activity, Navigation, Clock, ArrowLeft, ArrowRight, ArrowUp, CornerDownLeft, Footprints, Layers } from "lucide-react";
import { type Pilgrim } from "@shared/schema";
import { useLanguage } from "@/contexts/language-context";
import { useToast } from "@/hooks/use-toast";

function DisableParentScroll() {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    const locked: Array<{ el: HTMLElement; oy: string }> = [];

    const lock = () => {
      if (locked.length === 0) {
        let el = container.parentElement;
        while (el && el !== document.body) {
          const cs = getComputedStyle(el);
          if (cs.overflowY === "auto" || cs.overflowY === "scroll" || cs.overflow === "auto" || cs.overflow === "scroll") {
            locked.push({ el, oy: el.style.overflowY });
            el.style.overflowY = "hidden";
          }
          el = el.parentElement;
        }
      }
    };

    const unlock = () => {
      locked.forEach(({ el, oy }) => { el.style.overflowY = oy; });
      locked.length = 0;
    };

    container.addEventListener("mousedown", lock);
    document.addEventListener("mouseup", unlock);
    return () => {
      container.removeEventListener("mousedown", lock);
      document.removeEventListener("mouseup", unlock);
      unlock();
    };
  }, [map]);
  return null;
}

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// ── Facility data (real, verified coordinates — Mecca) ──────────────────────

export type FacilityType = "hospital" | "water" | "mosque" | "bathroom" | "transport";

export interface Facility {
  id: string; type: FacilityType;
  nameAr: string; nameEn: string;
  lat: number; lng: number;
  detailAr?: string; detailEn?: string;
}

export const FACILITIES: Facility[] = [
  { id: "h1", type: "hospital", nameAr: "مدينة الملك عبدالله الطبية",  nameEn: "King Abdullah Medical City",   lat: 21.38135, lng: 39.88109, detailAr: "١٥٥٠ سرير · تخصصات متعددة",    detailEn: "1550 beds · Multi-specialty" },
  { id: "h2", type: "hospital", nameAr: "مستشفى أجياد الطوارئ",       nameEn: "Ajyad Emergency Hospital",     lat: 21.41940, lng: 39.82726, detailAr: "طوارئ ٢٤ ساعة · قرب الحرم",    detailEn: "24h Emergency · Near Haram" },
  { id: "h3", type: "hospital", nameAr: "مستشفى النور التخصصي",       nameEn: "Al-Nour Specialist Hospital",  lat: 21.38487, lng: 39.86052, detailAr: "٥٠٠ سرير · أمراض الحج",         detailEn: "500 beds · Hajj diseases" },
  { id: "h4", type: "hospital", nameAr: "مستشفى منى للطوارئ",         nameEn: "Mina Emergency Hospital",      lat: 21.41950, lng: 39.87200, detailAr: "قرب جسر الجمرات · ٢٠٠ سرير",  detailEn: "Near Jamarat · 200 beds" },
  { id: "h5", type: "hospital", nameAr: "مستشفى مزدلفة الميداني",     nameEn: "Muzdalifah Field Hospital",    lat: 21.38880, lng: 39.93600, detailAr: "خدمات إسعاف ليلية",            detailEn: "Night emergency services" },
  { id: "w1", type: "water",    nameAr: "زمزم — المسجد الحرام",       nameEn: "Zamzam — Grand Mosque",        lat: 21.42250, lng: 39.82620, detailAr: "أصل بئر زمزم المباركة",      detailEn: "Source of blessed Zamzam" },
  { id: "w2", type: "water",    nameAr: "محطة مياه منى — الجمرات",    nameEn: "Mina Water — Jamarat Area",    lat: 21.41800, lng: 39.87500, detailAr: "مياه زمزم مجاناً",             detailEn: "Free Zamzam water" },
  { id: "w3", type: "water",    nameAr: "محطة مياه منى — المخيمات",   nameEn: "Mina Water — Camps Area",      lat: 21.41200, lng: 39.89200, detailAr: "مياه معبأة مجاناً",            detailEn: "Free bottled water" },
  { id: "w4", type: "water",    nameAr: "محطة مياه عرفات — نمرة",     nameEn: "Arafat Water — Nimrah Area",   lat: 21.35500, lng: 39.97200, detailAr: "مياه زمزم وعادية",            detailEn: "Zamzam & regular water" },
  { id: "w5", type: "water",    nameAr: "محطة مياه مزدلفة",           nameEn: "Muzdalifah Water Station",     lat: 21.38880, lng: 39.93800, detailAr: "مياه متاحة طوال الليل",       detailEn: "Available all night" },
  { id: "w6", type: "water",    nameAr: "نقطة مياه جسر الجمرات",      nameEn: "Jamarat Bridge Water Point",   lat: 21.41950, lng: 39.87030, detailAr: "قريبة من رمي الجمار",        detailEn: "Near stoning ritual area" },
  { id: "m1", type: "mosque",   nameAr: "المسجد الحرام",              nameEn: "Grand Mosque",                 lat: 21.42250, lng: 39.82620, detailAr: "قبلة المسلمين",              detailEn: "Muslim Qibla direction" },
  { id: "m2", type: "mosque",   nameAr: "مسجد نمرة — عرفات",         nameEn: "Nimrah Mosque — Arafat",       lat: 21.35296, lng: 39.96675, detailAr: "خطبة عرفة والظهر والعصر",    detailEn: "Arafat sermon & prayers" },
  { id: "m3", type: "mosque",   nameAr: "مسجد الخيف — منى",          nameEn: "Al-Khayf Mosque — Mina",       lat: 21.41572, lng: 39.87863, detailAr: "صلاة أيام التشريق",          detailEn: "Tashreeq days prayers" },
  { id: "m4", type: "mosque",   nameAr: "مسجد المشعر الحرام",        nameEn: "Mash'ar al-Haram Mosque",      lat: 21.38880, lng: 39.93600, detailAr: "الوقوف بالمشعر الحرام",     detailEn: "Night standing at Mash'ar" },
  { id: "b1", type: "bathroom", nameAr: "دورات مياه — شمال الحرم",   nameEn: "Restrooms — North Haram",      lat: 21.42500, lng: 39.82550, detailAr: "نظيفة ومتاحة ٢٤ ساعة",      detailEn: "Clean, 24h available" },
  { id: "b2", type: "bathroom", nameAr: "مرافق منى — الجمرات",       nameEn: "Mina Facilities — Jamarat",    lat: 21.41800, lng: 39.87000, detailAr: "قرب جسر الجمرات",           detailEn: "Near Jamarat Bridge" },
  { id: "b3", type: "bathroom", nameAr: "مرافق منى — المخيمات",      nameEn: "Mina Facilities — Camps",      lat: 21.41200, lng: 39.89500, detailAr: "مع حمامات للاغتسال",        detailEn: "With shower facilities" },
  { id: "b4", type: "bathroom", nameAr: "مرافق سهل عرفات",           nameEn: "Arafat Plain Restrooms",       lat: 21.35500, lng: 39.98000, detailAr: "موزعة على سهل عرفات",      detailEn: "Spread across Arafat plain" },
  { id: "b5", type: "bathroom", nameAr: "مرافق مزدلفة",              nameEn: "Muzdalifah Restrooms",         lat: 21.38800, lng: 39.94000, detailAr: "متاحة طوال الليل",          detailEn: "Available all night" },
  { id: "t1", type: "transport", nameAr: "موقف حافلات المسجد الحرام", nameEn: "Grand Mosque Bus Terminal",   lat: 21.42100, lng: 39.82400, detailAr: "حافلات لمنى وعرفات",        detailEn: "Buses to Mina & Arafat" },
  { id: "t2", type: "transport", nameAr: "محطة مترو الحجاج — جمرات", nameEn: "Hajj Metro — Jamarat",        lat: 21.41950, lng: 39.87030, detailAr: "مترو الحجاج للمشاعر",       detailEn: "Pilgrim metro to holy sites" },
  { id: "t3", type: "transport", nameAr: "محطة مترو الحجاج — عرفات", nameEn: "Hajj Metro — Arafat",         lat: 21.35500, lng: 39.98400, detailAr: "مترو للعودة لمزدلفة ومنى",   detailEn: "Metro back to Muzdalifah" },
  { id: "t4", type: "transport", nameAr: "موقف مزدلفة — نقل ليلي",   nameEn: "Muzdalifah Night Transport",  lat: 21.38500, lng: 39.93200, detailAr: "نقل ليلي إلى منى",           detailEn: "Night buses to Mina" },
];

export const TYPE_CFG: Record<FacilityType, { color: string; bg: string; emoji: string; labelAr: string; labelEn: string }> = {
  hospital:  { color: "#B03A2E", bg: "#f5dedd", emoji: "🏥", labelAr: "المستشفيات",   labelEn: "Hospitals" },
  water:     { color: "#1A5C8A", bg: "#d6e9f5", emoji: "💧", labelAr: "نقاط المياه",  labelEn: "Water" },
  mosque:    { color: "#0E4D41", bg: "#d4ede6", emoji: "🕌", labelAr: "المساجد",      labelEn: "Mosques" },
  bathroom:  { color: "#7B5E3A", bg: "#ede5d8", emoji: "🚻", labelAr: "دورات المياه", labelEn: "Restrooms" },
  transport: { color: "#B7860B", bg: "#f5ecd6", emoji: "🚌", labelAr: "النقل",        labelEn: "Transport" },
};

// ── Exported helpers for smart suggestion ────────────────────────────────────
export function haversineM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
}

export function getFacilityCrowdScore(id: string, type: FacilityType, hour: number): number {
  const seed = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 20;
  const isPrayer = [4,5,12,13,15,16,18,19,20,21].includes(hour);
  const base = type === "mosque" ? (isPrayer ? 85 : 30) : type === "transport" ? (hour < 6 || hour > 22 ? 20 : 60) : 40;
  return Math.min(99, Math.max(5, base + seed + (isPrayer && type !== "mosque" ? 15 : 0)));
}

function makeFacilityIcon(type: FacilityType) {
  const cfg = TYPE_CFG[type];
  return L.divIcon({
    className: "",
    html: `
      <div style="
        width:32px;height:32px;
        background:${cfg.bg};
        border:2.5px solid ${cfg.color};
        border-radius:8px;
        display:flex;align-items:center;justify-content:center;
        font-size:15px;
        box-shadow:0 2px 8px ${cfg.color}55;
      ">${cfg.emoji}</div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

// ── Zone definitions ─────────────────────────────────────────────────────────

interface Zone {
  id: string; nameAr: string; nameEn: string;
  lat: number; lng: number; radius: number;
  pilgrimCount: number; capacity: number;
  status: "normal" | "busy" | "warning" | "empty";
  sectorId: string; ritualAr: string; ritualEn: string;
  descAr: string; descEn: string;
}

// Real capacities — source: General Presidency of the Two Holy Mosques + Hajj 2024-2026 official data
export const HAJJ_ZONES: Zone[] = [
  { id: "haram", nameAr: "المسجد الحرام", nameEn: "Grand Mosque", lat: 21.4225, lng: 39.8262, radius: 600, pilgrimCount: 0, capacity: 2500000, status: "empty", sectorId: "S5", ritualAr: "الطواف والسعي", ritualEn: "Tawaf & Sa'i", descAr: "المسجد الأعظم في العالم — قلب الإسلام ومقصد الحجاج والمعتمرين", descEn: "The largest mosque in the world — the heart of Islam" },
  { id: "mina", nameAr: "مِنىٰ", nameEn: "Mina", lat: 21.4133, lng: 39.8907, radius: 1800, pilgrimCount: 0, capacity: 3000000, status: "empty", sectorId: "S1", ritualAr: "المبيت ورمي الجمرات", ritualEn: "Staying & Stoning Ritual", descAr: "مخيم الحج — يُقيم فيه الحجاج ليالي التشريق في خيام ممتدة", descEn: "The Hajj campsite — pilgrims stay here in tent cities during Tashreeq" },
  { id: "jamarat", nameAr: "جسر الجمرات", nameEn: "Jamarat Bridge", lat: 21.4225, lng: 39.8734, radius: 350, pilgrimCount: 0, capacity: 200000, status: "empty", sectorId: "S4", ritualAr: "رمي الجمرات", ritualEn: "Stoning of the Devil", descAr: "موقع رمي الجمرات الثلاث — أحد أهم شعائر الحج", descEn: "The site of stoning the three pillars — one of the most important Hajj rituals" },
  { id: "muzdalifah", nameAr: "مُزدلِفة", nameEn: "Muzdalifah", lat: 21.3833, lng: 39.9286, radius: 2500, pilgrimCount: 0, capacity: 3000000, status: "empty", sectorId: "S3", ritualAr: "المبيت وجمع الحصى", ritualEn: "Overnight stay & pebble collection", descAr: "المشعر الحرام — يبيت فيه الحجاج ليلة العيد ويجمعون الحصى للرمي", descEn: "Sacred grounds where pilgrims spend the night of Eid and collect pebbles" },
  { id: "arafat", nameAr: "عَرَفات", nameEn: "Arafat", lat: 21.3547, lng: 39.9845, radius: 4000, pilgrimCount: 0, capacity: 3000000, status: "empty", sectorId: "S2", ritualAr: "الوقوف بعرفة", ritualEn: "Standing at Arafat", descAr: "ركن الحج الأعظم — يقف فيه الحجاج يوم عرفة دعاءً وتضرعاً", descEn: "The pinnacle of Hajj — pilgrims stand here in prayer on the Day of Arafat" },
];

export const SUPERVISOR_POS = { lat: 21.4195, lng: 39.8233 };

function zoneColor(status: Zone["status"]) {
  switch (status) {
    case "warning": return { stroke: "#EF4444", fill: "#EF444440" };
    case "busy":    return { stroke: "#F59E0B", fill: "#F59E0B30" };
    case "normal":  return { stroke: "#10B981", fill: "#10B98120" };
    case "empty":   return { stroke: "#6B7280", fill: "#6B728015" };
  }
}

function makePilgrimIcon(emergency: boolean, expired: boolean, highlighted: boolean, live: boolean) {
  const color = emergency ? "#EF4444" : expired ? "#F59E0B" : "#10B981";
  const size = highlighted ? 22 : 14;
  const border = highlighted ? "3px solid #fff" : "2px solid #fff";
  const shadow = highlighted ? `0 0 14px 4px ${color}CC` : `0 0 6px ${color}99`;
  const anim = (emergency || highlighted) ? "animation:pulse 1.2s infinite;" : "";
  const outerSize = size + (live ? 20 : 0);
  const liveRing = live
    ? `<div style="position:absolute;inset:-8px;border:2.5px solid #10B981;border-radius:50%;animation:pulse 1s infinite;opacity:0.7;"></div>
       <div style="position:absolute;top:-18px;left:50%;transform:translateX(-50%);background:#10B981;color:#fff;font-size:9px;font-weight:900;padding:1px 5px;border-radius:4px;white-space:nowrap;letter-spacing:0.5px;">LIVE</div>`
    : "";
  return L.divIcon({
    className: "",
    html: `<div style="position:relative;width:${outerSize}px;height:${outerSize}px;display:flex;align-items:center;justify-content:center;">${liveRing}<div style="width:${size}px;height:${size}px;background:${color};border:${border};border-radius:50%;box-shadow:${shadow};${anim}"></div></div>`,
    iconSize: [outerSize, outerSize],
    iconAnchor: [outerSize / 2, outerSize / 2],
  });
}

function makeSupervisorIcon() {
  return L.divIcon({
    className: "",
    html: `<div style="width:32px;height:32px;display:flex;align-items:center;justify-content:center;filter:drop-shadow(0 0 8px #2563EBCC);">
      <div style="width:22px;height:22px;background:#2563EB;border:3px solid #fff;border-radius:5px;transform:rotate(45deg);box-shadow:0 2px 8px #2563EB99;"></div>
    </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

// ── Pedestrian routing (Valhalla primary, OSRM fallback) ─────────────────────

export interface NavStep { instruction: string; distanceM: number; type: string; modifier: string; }
export interface NavRoute {
  coords: [number, number][];
  distanceM: number;
  durationS: number;
  steps: NavStep[];
  targetName: string;
  targetColor: string;
}

function formatManeuver(step: any, ar: boolean): string {
  const type = step.maneuver?.type ?? "";
  const mod = step.maneuver?.modifier ?? "";
  const name = step.name || "";
  const on = name ? (ar ? ` في ${name}` : ` on ${name}`) : "";
  if (type === "depart") return ar ? `انطلق${on}` : `Head${on}`;
  if (type === "arrive") return ar ? "وصلت إلى وجهتك" : "Arrived at destination";
  if (mod === "left") return ar ? `انعطف يساراً${on}` : `Turn left${on}`;
  if (mod === "right") return ar ? `انعطف يميناً${on}` : `Turn right${on}`;
  if (mod === "sharp left") return ar ? `انعطف حاداً يساراً${on}` : `Sharp left${on}`;
  if (mod === "sharp right") return ar ? `انعطف حاداً يميناً${on}` : `Sharp right${on}`;
  if (mod === "uturn") return ar ? "استدر للخلف" : "Make a U-turn";
  if (mod === "straight") return ar ? `استمر مستقيماً${on}` : `Continue straight${on}`;
  return ar ? `استمر${on}` : `Continue${on}`;
}

// Decode Valhalla's polyline6 (precision 1e-6 vs standard 1e-5)
function decodePolyline6(encoded: string): [number, number][] {
  const coords: [number, number][] = [];
  let index = 0, lat = 0, lng = 0;
  while (index < encoded.length) {
    let b, shift = 0, result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lat += (result & 1) ? ~(result >> 1) : (result >> 1);
    shift = 0; result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lng += (result & 1) ? ~(result >> 1) : (result >> 1);
    coords.push([lat / 1e6, lng / 1e6]);
  }
  return coords;
}

// Map Valhalla maneuver type numbers → NavStep type/modifier
function valhallaAttrs(type: number): { stepType: string; modifier: string } {
  if (type >= 1 && type <= 3) return { stepType: "depart",  modifier: "" };
  if (type >= 4 && type <= 6) return { stepType: "arrive",  modifier: "" };
  if (type === 8)              return { stepType: "turn",    modifier: "straight" };
  if (type === 9)              return { stepType: "turn",    modifier: "slight right" };
  if (type === 10)             return { stepType: "turn",    modifier: "right" };
  if (type === 11)             return { stepType: "turn",    modifier: "sharp right" };
  if (type === 12 || type === 13) return { stepType: "turn", modifier: "uturn" };
  if (type === 14)             return { stepType: "turn",    modifier: "sharp left" };
  if (type === 15)             return { stepType: "turn",    modifier: "left" };
  if (type === 16)             return { stepType: "turn",    modifier: "slight left" };
  return { stepType: "turn", modifier: "straight" };
}

export async function fetchOSRM(ar: boolean, fromLat: number, fromLng: number, toLat: number, toLng: number, targetName: string, targetColor: string): Promise<NavRoute | null> {
  // Primary: Valhalla pedestrian — uses actual footpaths, plazas & walkways
  try {
    const body = {
      locations: [{ lon: fromLng, lat: fromLat }, { lon: toLng, lat: toLat }],
      costing: "pedestrian",
      costing_options: {
        pedestrian: {
          walking_speed: 4.5,
          use_ferry: 0.0,
          walkway_factor: 0.8,
          sidewalk_factor: 0.9,
          alley_factor: 0.5,
          driveway_factor: 0.4,
        }
      },
      directions_options: { units: "kilometers", language: ar ? "ar" : "en-US" },
    };
    const res = await fetch("https://valhalla1.openstreetmap.de/route", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const data = await res.json();
      const trip = data?.trip;
      if (trip?.legs?.[0]) {
        const leg = trip.legs[0];
        const coords = decodePolyline6(leg.shape);
        const distM = Math.round(trip.summary.length * 1000);
        const durationS = Math.round(trip.summary.time);
        const steps: NavStep[] = (leg.maneuvers as any[]).map((m) => {
          const { stepType, modifier } = valhallaAttrs(m.type);
          return {
            instruction: m.instruction ?? formatManeuver({ maneuver: { type: stepType, modifier }, name: "" }, ar),
            distanceM: Math.round((m.length ?? 0) * 1000),
            type: stepType,
            modifier,
          };
        });
        return { coords, distanceM: distM, durationS, steps, targetName, targetColor };
      }
    }
  } catch { /* fall through to OSRM */ }

  // Fallback: OSRM foot profile
  try {
    const url = `https://router.project-osrm.org/route/v1/foot/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson&steps=true`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    const data = await res.json();
    if (data.code !== "Ok" || !data.routes?.length) return null;
    const route = data.routes[0];
    const coords: [number, number][] = route.geometry.coordinates.map(([lng, lat]: [number, number]) => [lat, lng]);
    const steps: NavStep[] = route.legs[0].steps.map((s: any) => ({
      instruction: formatManeuver(s, ar),
      distanceM: Math.round(s.distance),
      type: s.maneuver?.type ?? "",
      modifier: s.maneuver?.modifier ?? "",
    }));
    return { coords, distanceM: Math.round(route.distance), durationS: Math.round(route.duration), steps, targetName, targetColor };
  } catch { return null; }
}

function formatDist(m: number, ar: boolean) {
  return m >= 1000 ? `${(m / 1000).toFixed(1)} ${ar ? "كم" : "km"}` : `${m} ${ar ? "م" : "m"}`;
}
function formatDuration(s: number, ar: boolean) {
  const mins = Math.max(1, Math.round(s / 60));
  return ar ? `${mins} دقيقة` : `${mins} min`;
}
function stepIcon(type: string, modifier: string) {
  if (type === "arrive") return <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0" />;
  if (type === "depart") return <Footprints className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />;
  if (modifier === "left" || modifier === "sharp left") return <ArrowLeft className="w-3.5 h-3.5 text-foreground/70 flex-shrink-0" />;
  if (modifier === "right" || modifier === "sharp right") return <ArrowRight className="w-3.5 h-3.5 text-foreground/70 flex-shrink-0" />;
  if (modifier === "uturn") return <CornerDownLeft className="w-3.5 h-3.5 text-foreground/70 flex-shrink-0" />;
  return <ArrowUp className="w-3.5 h-3.5 text-foreground/70 flex-shrink-0" />;
}

// ── Map helper components ────────────────────────────────────────────────────

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
    map.fitBounds(L.latLngBounds(HAJJ_ZONES.map(z => [z.lat, z.lng])), { padding: [60, 60] });
  }, [map]);
  return null;
}

function FlyToHighlighted({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => { map.flyTo([lat, lng], 17, { duration: 1.4 }); }, [lat, lng, map]);
  return null;
}

function FlyToRouteStart({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 16, { duration: 1.3, easeLinearity: 0.25 });
  }, [lat, lng, map]);
  return null;
}

function ClosePopupsOnNav({ active }: { active: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (active) map.closePopup();
  }, [active, map]);
  return null;
}

// ── Pilgrim marker ───────────────────────────────────────────────────────────

interface PilgrimMarkerProps {
  pilgrim: Pilgrim;
  isHighlighted: boolean;
  ar: boolean;
  isRTL: boolean;
  onNavigate: (lat: number, lng: number, name: string, color: string) => void;
}

function PilgrimMarker({ pilgrim, isHighlighted, ar, isRTL, onNavigate }: PilgrimMarkerProps) {
  const markerRef = useRef<L.Marker | null>(null);
  const expired = pilgrim.permitStatus === "Expired";
  const isLive = pilgrim.lastUpdated
    ? (Date.now() - new Date(pilgrim.lastUpdated).getTime()) < 30_000
    : false;
  const icon = makePilgrimIcon(!!pilgrim.emergencyStatus, expired, isHighlighted, isLive);

  useEffect(() => {
    if (isHighlighted && markerRef.current) {
      const timer = setTimeout(() => markerRef.current?.openPopup(), 600);
      return () => clearTimeout(timer);
    }
  }, [isHighlighted]);

  return (
    <Marker ref={markerRef} position={[pilgrim.locationLat!, pilgrim.locationLng!]} icon={icon}>
      <Popup>
        <div style={{ fontFamily: "sans-serif", minWidth: 190, direction: isRTL ? "rtl" : "ltr" }}>
          <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 4, color: "#0E4D41" }}>{pilgrim.name}</div>
          <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>{pilgrim.nationality}</div>
          <div style={{ fontSize: 12, marginBottom: 3 }}>
            {ar ? "المجموعة:" : "Group:"}{" "}<span style={{ color: "#444" }}>{pilgrim.campaignGroup ?? "—"}</span>
          </div>
          <div style={{ fontSize: 12, marginBottom: 3 }}>
            {ar ? "التصريح:" : "Permit:"}{" "}
            <b style={{ color: pilgrim.permitStatus === "Valid" ? "#10B981" : pilgrim.permitStatus === "Expired" ? "#F59E0B" : pilgrim.permitStatus === "Pending" ? "#8B5CF6" : "#EF4444" }}>
              {pilgrim.permitStatus}
            </b>
          </div>
          {pilgrim.lastUpdated && (() => {
            const mins = Math.round((Date.now() - new Date(pilgrim.lastUpdated).getTime()) / 60000);
            if (mins > 1440) return null;
            const label = mins < 1 ? (ar ? "الآن" : "just now") : ar ? `منذ ${mins} دقيقة` : `${mins} min ago`;
            const isLiveNow = mins < 1;
            return (
              <div style={{ fontSize: 11, marginBottom: 8, display: "flex", alignItems: "center", gap: 4, color: isLiveNow ? "#10B981" : "#888" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: isLiveNow ? "#10B981" : "#ccc", display: "inline-block", flexShrink: 0 }}></span>
                {ar ? `آخر تحديث: ${label}` : `Last update: ${label}`}
              </div>
            );
          })()}
          {pilgrim.emergencyStatus && (
            <div style={{ marginBottom: 8, padding: "4px 10px", background: "#FEE2E2", color: "#DC2626", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
              ⚠ {ar ? "طوارئ نشطة" : "Emergency Active"}
            </div>
          )}
          <button
            onClick={() => onNavigate(pilgrim.locationLat!, pilgrim.locationLng!, pilgrim.name, "#2563EB")}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: "100%", padding: "7px 12px", marginBottom: 6, background: "#2563EB", color: "#fff", borderRadius: 8, fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer" }}
          >
            <span style={{ fontSize: 14 }}>🧭</span>
            {ar ? "انقلني إليه" : "Navigate to pilgrim"}
          </button>
          <a
            href={`/pilgrims?pilgrimId=${pilgrim.id}`}
            style={{ display: "block", textAlign: "center", padding: "6px 12px", background: "#0E4D41", color: "#fff", borderRadius: 8, fontSize: 12, fontWeight: 700, textDecoration: "none" }}
          >
            {ar ? "عرض الملف الشخصي" : "View Profile"}
          </a>
        </div>
      </Popup>
    </Marker>
  );
}

// ── Facility marker ───────────────────────────────────────────────────────────

interface FacilityMarkerProps {
  facility: Facility;
  ar: boolean;
  isRTL: boolean;
  onNavigate: (lat: number, lng: number, name: string, color: string) => void;
}

function FacilityMarker({ facility, ar, isRTL, onNavigate }: FacilityMarkerProps) {
  const cfg = TYPE_CFG[facility.type];
  return (
    <Marker position={[facility.lat, facility.lng]} icon={makeFacilityIcon(facility.type)} zIndexOffset={500}>
      <Popup>
        <div style={{ fontFamily: "sans-serif", minWidth: 185, direction: isRTL ? "rtl" : "ltr" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
            <span style={{ fontSize: 18 }}>{cfg.emoji}</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: 13, color: cfg.color }}>{ar ? facility.nameAr : facility.nameEn}</div>
              <div style={{ fontSize: 11, color: "#888" }}>{ar ? cfg.labelAr : cfg.labelEn}</div>
            </div>
          </div>
          {(ar ? facility.detailAr : facility.detailEn) && (
            <div style={{ fontSize: 11, color: "#555", marginBottom: 8, padding: "4px 8px", background: cfg.bg, borderRadius: 6 }}>
              {ar ? facility.detailAr : facility.detailEn}
            </div>
          )}
          <button
            onClick={() => onNavigate(facility.lat, facility.lng, ar ? facility.nameAr : facility.nameEn, cfg.color)}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: "100%", padding: "7px 12px", background: cfg.color, color: "#fff", borderRadius: 8, fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer" }}
          >
            <span style={{ fontSize: 13 }}>🧭</span>
            {ar ? "انقلني إليه" : "Navigate here"}
          </button>
        </div>
      </Popup>
      <Tooltip direction="top" offset={[0, -6]} opacity={0.9}>
        <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color }}>{ar ? facility.nameAr : facility.nameEn}</span>
      </Tooltip>
    </Marker>
  );
}

// ── Main RealMap component ───────────────────────────────────────────────────

interface RealMapProps {
  pilgrims?: Pilgrim[];
  sectorData: { id: string; load: number; status: string }[];
  onZoneClick?: (zone: Zone) => void;
  highlightedPilgrimId?: number;
  navRoute?: NavRoute | null;
  onNavRouteChange?: (r: NavRoute | null) => void;
  onSmartSuggest?: (type: FacilityType) => void;
}

export function RealMap({ pilgrims, sectorData, onZoneClick, highlightedPilgrimId, navRoute = null, onNavRouteChange, onSmartSuggest }: RealMapProps) {
  const { lang, isRTL } = useLanguage();
  const ar = lang === "ar";
  const { toast } = useToast();
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [loadingNav, setLoadingNav] = useState(false);
  const [showServices, setShowServices] = useState(false);
  const [activeTypes, setActiveTypes] = useState<Set<FacilityType>>(new Set(["hospital", "water", "mosque", "bathroom", "transport"]));

  const highlightedPilgrim = highlightedPilgrimId ? pilgrims?.find(p => p.id === highlightedPilgrimId) : undefined;

  const enrichedZones = HAJJ_ZONES.map(z => {
    const sector = sectorData.find(s => s.id === z.sectorId);
    if (!sector) return z;
    const load = sector.load;
    const status: Zone["status"] = load >= 80 ? "warning" : load >= 50 ? "busy" : load >= 5 ? "normal" : "empty";
    return { ...z, pilgrimCount: Math.round((load / 100) * z.capacity), status };
  });

  const handleZoneClick = useCallback((zone: Zone) => {
    setSelectedZone(zone);
    onZoneClick?.(zone);
  }, [onZoneClick]);

  const handleNavigate = useCallback(async (lat: number, lng: number, targetName: string, targetColor: string) => {
    setLoadingNav(true);
    onNavRouteChange?.(null);
    const route = await fetchOSRM(ar, SUPERVISOR_POS.lat, SUPERVISOR_POS.lng, lat, lng, targetName, targetColor);
    setLoadingNav(false);
    if (!route) {
      toast({ title: ar ? "تعذّر حساب المسار" : "Route unavailable", description: ar ? "لم نتمكن من الاتصال بخدمة التوجيه." : "Could not connect to routing service.", variant: "destructive" });
      return;
    }
    onNavRouteChange?.(route);
    setSelectedZone(null);
  }, [ar, toast]);

  const toggleType = (type: FacilityType) => {
    setActiveTypes(prev => {
      const next = new Set(prev);
      next.has(type) ? next.delete(type) : next.add(type);
      return next;
    });
  };

  const visibleFacilities = showServices ? FACILITIES.filter(f => activeTypes.has(f.type)) : [];

  return (
    <div className="relative w-full h-full" style={{ minHeight: 300, isolation: "isolate" }}>
      <MapContainer
        center={[21.4225, 39.8900]}
        zoom={12}
        scrollWheelZoom={true} touchZoom={true} doubleClickZoom={true} dragging={true}
        zoomControl={false} attributionControl={false}
        style={{ width: "100%", height: "100%", background: "#f5f5f0", position: "absolute", inset: 0 }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          subdomains="abcd" maxZoom={20}
        />
        <DisableParentScroll />
        <ZoomControls />
        <FitBounds />
        {highlightedPilgrim?.locationLat && highlightedPilgrim?.locationLng && !navRoute && (
          <FlyToHighlighted lat={highlightedPilgrim.locationLat} lng={highlightedPilgrim.locationLng} />
        )}
        <ClosePopupsOnNav active={!!navRoute} />
        {navRoute && <FlyToRouteStart lat={SUPERVISOR_POS.lat} lng={SUPERVISOR_POS.lng} />}

        {/* Zone circles */}
        {enrichedZones.map(zone => {
          const { stroke, fill } = zoneColor(zone.status);
          return (
            <Circle key={zone.id} center={[zone.lat, zone.lng]} radius={zone.radius}
              pathOptions={{ color: stroke, fillColor: fill, fillOpacity: 1, weight: zone.status === "warning" ? 2.5 : 1.5, dashArray: zone.status === "warning" ? "6 4" : undefined }}
              eventHandlers={{ click: () => handleZoneClick(zone) }}
            >
              <Tooltip direction="top" offset={[0, -6]} opacity={0.95}>
                <span style={{ fontWeight: 700, fontSize: 12 }}>{ar ? zone.nameAr : zone.nameEn}</span>
              </Tooltip>
            </Circle>
          );
        })}

        {/* Supervisor marker */}
        <Marker position={[SUPERVISOR_POS.lat, SUPERVISOR_POS.lng]} icon={makeSupervisorIcon()}>
          <Popup>
            <div style={{ fontFamily: "sans-serif", minWidth: 160, direction: isRTL ? "rtl" : "ltr" }}>
              <div style={{ fontWeight: 800, fontSize: 13, color: "#2563EB", marginBottom: 4 }}>
                🛡 {ar ? "موقع المشرف" : "Supervisor Location"}
              </div>
              <div style={{ fontSize: 11, color: "#888" }}>
                {ar ? "الموقع الافتراضي — قرب المسجد الحرام" : "Default position — near Grand Mosque"}
              </div>
            </div>
          </Popup>
          <Tooltip direction="top" offset={[0, -10]} opacity={0.95} permanent>
            <span style={{ fontWeight: 700, fontSize: 11, color: "#2563EB" }}>{ar ? "المشرف" : "Supervisor"}</span>
          </Tooltip>
        </Marker>

        {/* Route polyline */}
        {navRoute && (
          <Polyline positions={navRoute.coords}
            pathOptions={{ color: navRoute.targetColor, weight: 5, opacity: 0.85, dashArray: "10 6", lineCap: "round", lineJoin: "round" }}
          />
        )}

        {/* Facility markers */}
        {visibleFacilities.map(f => (
          <FacilityMarker key={f.id} facility={f} ar={ar} isRTL={isRTL} onNavigate={handleNavigate} />
        ))}

        {/* Pilgrim markers */}
        {pilgrims?.map(pilgrim => {
          if (!pilgrim.locationLat || !pilgrim.locationLng) return null;
          return (
            <PilgrimMarker
              key={pilgrim.id} pilgrim={pilgrim}
              isHighlighted={pilgrim.id === highlightedPilgrimId}
              ar={ar} isRTL={isRTL} onNavigate={handleNavigate}
            />
          );
        })}
      </MapContainer>

      {/* ── Services toggle button ────────────────────────────────────────── */}
      <motion.button
        data-testid="button-toggle-services"
        onClick={() => setShowServices(v => !v)}
        whileTap={{ scale: 0.93 }}
        className={`absolute bottom-16 ${isRTL ? "right-4" : "left-4"} flex items-center gap-2 px-3 py-2.5 rounded-xl shadow-xl border text-xs font-bold transition-all ${
          showServices
            ? "bg-primary text-primary-foreground border-primary/50 shadow-primary/30"
            : "bg-card/95 backdrop-blur-xl text-foreground border-border"
        }`}
        style={{ zIndex: 860 }}
        dir={isRTL ? "rtl" : "ltr"}
      >
        <Layers className="w-4 h-4 flex-shrink-0" />
        {ar ? "الخدمات" : "Services"}
        {showServices && <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground animate-pulse" />}
      </motion.button>

      {/* ── Filter chips (visible only when showServices is ON) ───────────── */}
      <AnimatePresence>
        {showServices && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className={`absolute bottom-36 ${isRTL ? "right-4" : "left-4"} flex flex-col gap-1.5`}
            style={{ zIndex: 855 }}
            dir={isRTL ? "rtl" : "ltr"}
          >
            {(Object.entries(TYPE_CFG) as [FacilityType, typeof TYPE_CFG[FacilityType]][]).map(([type, cfg]) => {
              const active = activeTypes.has(type);
              const count = FACILITIES.filter(f => f.type === type).length;
              return (
                <div key={type} className={`flex items-center gap-1 ${isRTL ? "flex-row-reverse" : ""}`}>
                  <motion.button
                    whileTap={{ scale: 0.94 }}
                    onClick={() => toggleType(type)}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all shadow-sm ${isRTL ? "flex-row-reverse" : ""}`}
                    style={{
                      background: active ? cfg.bg : "#f5f5f5",
                      borderColor: active ? cfg.color : "#ddd",
                      color: active ? cfg.color : "#999",
                      opacity: active ? 1 : 0.6,
                    }}
                  >
                    <span>{cfg.emoji}</span>
                    <span>{ar ? cfg.labelAr : cfg.labelEn}</span>
                    <span className="text-[10px] opacity-60">({count})</span>
                  </motion.button>
                  {onSmartSuggest && (
                    <motion.button
                      whileTap={{ scale: 0.88 }}
                      onClick={() => onSmartSuggest(type)}
                      title={ar ? `اقترح أفضل ${cfg.labelAr}` : `Best ${cfg.labelEn}`}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-xs border shadow-sm transition-all"
                      style={{ background: cfg.bg, borderColor: cfg.color, color: cfg.color }}
                      data-testid={`button-suggest-${type}`}
                    >
                      ✨
                    </motion.button>
                  )}
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Zone info popup ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedZone && (
          <motion.div
            key="zone-popup"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className={`absolute bottom-14 ${selectedZone.lng < 39.89 ? "right-4" : "left-4"} w-72 bg-card/97 backdrop-blur-xl border border-border rounded-2xl shadow-2xl p-5`}
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
                <span className={selectedZone.status === "warning" ? "text-destructive" : selectedZone.status === "busy" ? "text-accent" : "text-primary"}>
                  {Math.round((selectedZone.pilgrimCount / selectedZone.capacity) * 100)}%
                </span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${selectedZone.status === "warning" ? "bg-destructive" : selectedZone.status === "busy" ? "bg-accent" : "bg-primary"}`}
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
            <div className={`flex gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
              <button
                className={`flex-1 py-2.5 bg-primary text-primary-foreground text-sm font-bold rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}
                onClick={() => {
                  toast({ title: ar ? "جارٍ تحويل المسار" : "Rerouting in Progress", description: ar ? `تم إرسال تعليمات تحويل الحشود بعيداً عن ${selectedZone?.nameAr}.` : `Crowd diversion instructions sent away from ${selectedZone?.nameEn}.` });
                  setSelectedZone(null);
                }}
              >
                <Navigation className="w-4 h-4" />
                {ar ? "تحويل المسار" : "Redirect Route"}
              </button>
              <button className="py-2.5 px-3 bg-secondary text-secondary-foreground rounded-xl hover:bg-secondary/80 transition-colors">
                <Activity className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Loading spinner ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {loadingNav && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm"
            style={{ zIndex: 870 }}
          >
            <div className="bg-card rounded-2xl shadow-2xl px-6 py-5 flex items-center gap-3 border border-border" dir={isRTL ? "rtl" : "ltr"}>
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
              <span className="font-semibold text-sm">{ar ? "جارٍ حساب المسار…" : "Calculating route…"}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Highlighted pilgrim banner ────────────────────────────────────── */}
      <AnimatePresence>
        {highlightedPilgrim && !navRoute && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className={`absolute top-4 ${isRTL ? "left-16" : "right-16"} flex items-center gap-2 bg-card/95 backdrop-blur-xl border border-border text-foreground text-xs font-bold px-3 py-2 rounded-xl shadow-lg`}
            style={{ zIndex: 850 }}
            dir={isRTL ? "rtl" : "ltr"}
          >
            <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-primary" />
            {ar ? `تتبع: ${highlightedPilgrim.name}` : `Tracking: ${highlightedPilgrim.name}`}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Attribution */}
      <div className="absolute bottom-2 right-12 text-[10px] text-black/40 font-mono pointer-events-none" style={{ zIndex: 850 }} dir="ltr">
        © CARTO / OpenStreetMap
      </div>
    </div>
  );
}
