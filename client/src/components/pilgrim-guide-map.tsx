import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useLanguage } from "@/contexts/language-context";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { type Pilgrim } from "@shared/schema";
import { Navigation, X, ChevronDown, ChevronUp, Clock, MapPin, RefreshCw, LocateFixed, MousePointer2, Users, AlertTriangle, ArrowRight, CheckCircle2, Search } from "lucide-react";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

type FacilityType = "hospital" | "water" | "mosque" | "bathroom" | "transport";

interface Facility {
  id: string; type: FacilityType;
  nameAr: string; nameEn: string;
  lat: number; lng: number;
  detailAr?: string; detailEn?: string;
}

const FACILITIES: Facility[] = [
  // Hospitals — verified real coordinates
  { id: "h1", type: "hospital", nameAr: "مدينة الملك عبدالله الطبية",  nameEn: "King Abdullah Medical City",   lat: 21.38135, lng: 39.88109, detailAr: "١٥٥٠ سرير · تخصصات متعددة",   detailEn: "1550 beds · Multi-specialty" },
  { id: "h2", type: "hospital", nameAr: "مستشفى أجياد الطوارئ",       nameEn: "Ajyad Emergency Hospital",     lat: 21.41940, lng: 39.82726, detailAr: "طوارئ ٢٤ ساعة · قرب الحرم",   detailEn: "24h Emergency · Near Haram" },
  { id: "h3", type: "hospital", nameAr: "مستشفى النور التخصصي",       nameEn: "Al-Nour Specialist Hospital",  lat: 21.38487, lng: 39.86052, detailAr: "٥٠٠ سرير · أمراض الحج",        detailEn: "500 beds · Hajj diseases" },
  { id: "h4", type: "hospital", nameAr: "مستشفى منى للطوارئ",         nameEn: "Mina Emergency Hospital",      lat: 21.41950, lng: 39.87200, detailAr: "قرب جسر الجمرات · ٢٠٠ سرير", detailEn: "Near Jamarat · 200 beds" },
  { id: "h5", type: "hospital", nameAr: "مستشفى مزدلفة الميداني",     nameEn: "Muzdalifah Field Hospital",    lat: 21.38880, lng: 39.93600, detailAr: "خدمات إسعاف ليلية",           detailEn: "Night emergency services" },
  // Water points
  { id: "w1", type: "water", nameAr: "زمزم — المسجد الحرام",          nameEn: "Zamzam — Grand Mosque",        lat: 21.42250, lng: 39.82620, detailAr: "أصل بئر زمزم المباركة",     detailEn: "Source of blessed Zamzam" },
  { id: "w2", type: "water", nameAr: "محطة مياه منى — الجمرات",       nameEn: "Mina Water — Jamarat Area",    lat: 21.41800, lng: 39.87500, detailAr: "مياه زمزم مجاناً",            detailEn: "Free Zamzam water" },
  { id: "w3", type: "water", nameAr: "محطة مياه منى — المخيمات",      nameEn: "Mina Water — Camps Area",      lat: 21.41200, lng: 39.89200, detailAr: "مياه معبأة مجاناً",           detailEn: "Free bottled water" },
  { id: "w4", type: "water", nameAr: "محطة مياه عرفات — مسجد نمرة",   nameEn: "Arafat Water — Nimrah Area",   lat: 21.35500, lng: 39.97200, detailAr: "مياه زمزم وعادية",           detailEn: "Zamzam & regular water" },
  { id: "w5", type: "water", nameAr: "محطة مياه مزدلفة",              nameEn: "Muzdalifah Water Station",     lat: 21.38880, lng: 39.93800, detailAr: "مياه متاحة طوال الليل",      detailEn: "Available all night" },
  { id: "w6", type: "water", nameAr: "نقطة مياه جسر الجمرات",         nameEn: "Jamarat Bridge Water Point",   lat: 21.41950, lng: 39.87030, detailAr: "قريبة من رمي الجمار",       detailEn: "Near stoning ritual area" },
  // Mosques — verified real coordinates
  { id: "m1", type: "mosque", nameAr: "المسجد الحرام",                nameEn: "Grand Mosque (Masjid al-Haram)", lat: 21.42250, lng: 39.82620, detailAr: "قبلة المسلمين",           detailEn: "Muslim Qibla direction" },
  { id: "m2", type: "mosque", nameAr: "مسجد نمرة — عرفات",           nameEn: "Nimrah Mosque — Arafat",       lat: 21.35296, lng: 39.96675, detailAr: "خطبة عرفة والظهر والعصر",   detailEn: "Arafat sermon & prayers" },
  { id: "m3", type: "mosque", nameAr: "مسجد الخيف — منى",            nameEn: "Al-Khayf Mosque — Mina",       lat: 21.41572, lng: 39.87863, detailAr: "صلاة أيام التشريق",         detailEn: "Tashreeq days prayers" },
  { id: "m4", type: "mosque", nameAr: "مسجد المشعر الحرام — مزدلفة", nameEn: "Mash'ar al-Haram Mosque",      lat: 21.38880, lng: 39.93600, detailAr: "الوقوف بالمشعر الحرام",    detailEn: "Night standing at Mash'ar" },
  // Restrooms
  { id: "b1", type: "bathroom", nameAr: "دورات مياه — شمال الحرم",   nameEn: "Restrooms — North Haram",      lat: 21.42500, lng: 39.82550, detailAr: "نظيفة ومتاحة ٢٤ ساعة",   detailEn: "Clean, 24h available" },
  { id: "b2", type: "bathroom", nameAr: "مرافق منى — منطقة الجمرات", nameEn: "Mina Facilities — Jamarat",    lat: 21.41800, lng: 39.87000, detailAr: "قرب جسر الجمرات",          detailEn: "Near Jamarat Bridge" },
  { id: "b3", type: "bathroom", nameAr: "مرافق منى — المخيمات",      nameEn: "Mina Facilities — Camps",      lat: 21.41200, lng: 39.89500, detailAr: "مع حمامات للاغتسال",       detailEn: "With shower facilities" },
  { id: "b4", type: "bathroom", nameAr: "مرافق سهل عرفات",           nameEn: "Arafat Plain Restrooms",       lat: 21.35500, lng: 39.98000, detailAr: "موزعة على سهل عرفات",     detailEn: "Spread across Arafat plain" },
  { id: "b5", type: "bathroom", nameAr: "مرافق مزدلفة",              nameEn: "Muzdalifah Restrooms",         lat: 21.38800, lng: 39.94000, detailAr: "متاحة طوال الليل",         detailEn: "Available all night" },
  // Transport — corrected (Hajj Metro, not Haramain)
  { id: "t1", type: "transport", nameAr: "موقف حافلات المسجد الحرام", nameEn: "Grand Mosque Bus Terminal",    lat: 21.42100, lng: 39.82400, detailAr: "حافلات لمنى وعرفات",       detailEn: "Buses to Mina & Arafat" },
  { id: "t2", type: "transport", nameAr: "محطة مترو الحجاج — جمرات", nameEn: "Hajj Metro — Jamarat Station", lat: 21.41950, lng: 39.87030, detailAr: "مترو الحجاج للمشاعر المقدسة",detailEn: "Pilgrim metro to holy sites" },
  { id: "t3", type: "transport", nameAr: "محطة مترو الحجاج — عرفات", nameEn: "Hajj Metro — Arafat Station",  lat: 21.35500, lng: 39.98400, detailAr: "مترو للعودة لمزدلفة ومنى",  detailEn: "Metro back to Muzdalifah" },
  { id: "t4", type: "transport", nameAr: "موقف مزدلفة — نقل ليلي",   nameEn: "Muzdalifah Night Transport",   lat: 21.38500, lng: 39.93200, detailAr: "نقل ليلي إلى منى",           detailEn: "Night buses to Mina" },
];

const TYPE_CONFIG: Record<FacilityType, { colorHex: string; lightHex: string; emoji: string; labelAr: string; labelEn: string }> = {
  hospital:  { colorHex: "#B03A2E", lightHex: "#f5dedd", emoji: "🏥", labelAr: "المستشفيات",   labelEn: "Hospitals" },
  water:     { colorHex: "#1A5C8A", lightHex: "#d6e9f5", emoji: "💧", labelAr: "نقاط المياه",  labelEn: "Water Points" },
  mosque:    { colorHex: "#0E4D41", lightHex: "#d4ede6", emoji: "🕌", labelAr: "المساجد",      labelEn: "Mosques" },
  bathroom:  { colorHex: "#7B5E3A", lightHex: "#ede5d8", emoji: "🚻", labelAr: "دورات المياه", labelEn: "Restrooms" },
  transport: { colorHex: "#C49A3C", lightHex: "#f5ecd6", emoji: "🚌", labelAr: "النقل",        labelEn: "Transport" },
};

function getCrowdScore(id: string, type: FacilityType, hour: number): number {
  const seed = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 20;
  const isPrayer   = [4,5,12,13,15,16,18,19,20,21].includes(hour);
  const isPostPray = [6,13,14,16,17,19,21,22].includes(hour);
  const isNight    = hour >= 23 || hour < 4;
  const isMidday   = hour >= 11 && hour <= 15;
  let base = 30;
  if (type === "mosque") {
    if (isPrayer) base = id === "m1" ? 98 : 78;
    else if (isPostPray) base = id === "m1" ? 75 : 42;
    else if (isNight) base = id === "m1" ? 55 : 15;
    else base = id === "m1" ? 70 : 35;
  } else if (type === "hospital") {
    base = isMidday ? 68 : isPrayer ? 45 : isNight ? 22 : 48;
  } else if (type === "water") {
    base = isPostPray || isMidday ? 74 : isPrayer ? 58 : isNight ? 18 : 38;
  } else if (type === "bathroom") {
    base = isPrayer ? 88 : isPostPray ? 52 : isNight ? 14 : 36;
  } else if (type === "transport") {
    base = [5,6,12,13,21,22].includes(hour) ? 82 : isNight ? 22 : 44;
  }
  return Math.min(100, Math.max(0, base + seed - 10));
}

function crowdColor(score: number) {
  if (score >= 75) return "#e74c3c";
  if (score >= 50) return "#e67e22";
  return "#27ae60";
}

function crowdBadgeHtml(score: number) {
  const color = crowdColor(score);
  return `<div style="position:absolute;top:-2px;right:-2px;width:13px;height:13px;background:${color};border:2px solid white;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.3)"></div>`;
}

function makeFacilityIcon(type: FacilityType, highlighted = false, crowdScore?: number) {
  const cfg = TYPE_CONFIG[type];
  const size = highlighted ? 40 : 34;
  const badge = crowdScore !== undefined ? crowdBadgeHtml(crowdScore) : "";
  return L.divIcon({
    html: `<div style="position:relative;width:${size}px;height:${size}px">
      <div style="width:${size}px;height:${size}px;background:${highlighted ? cfg.colorHex : cfg.lightHex};border-radius:50%;border:${highlighted ? "3px" : "2.5px"} solid ${cfg.colorHex};display:flex;align-items:center;justify-content:center;font-size:${highlighted ? 17 : 15}px;box-shadow:0 2px 8px ${cfg.colorHex}${highlighted ? "88" : "44"}">${cfg.emoji}</div>
      ${badge}
    </div>`,
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function makeDestIcon(type: FacilityType) {
  const cfg = TYPE_CONFIG[type];
  return L.divIcon({
    html: `<div style="display:flex;flex-direction:column;align-items:center">
      <div style="width:42px;height:42px;background:${cfg.colorHex};border-radius:50%;border:3px solid white;display:flex;align-items:center;justify-content:center;font-size:19px;box-shadow:0 3px 12px ${cfg.colorHex}88">${cfg.emoji}</div>
      <div style="width:3px;height:10px;background:${cfg.colorHex};margin-top:1px;border-radius:2px"></div>
    </div>`,
    className: "",
    iconSize: [42, 53],
    iconAnchor: [21, 53],
  });
}

function makePilgrimIcon() {
  return L.divIcon({
    html: `
      <div style="position:relative;width:48px;height:48px;display:flex;align-items:center;justify-content:center">
        <div class="pilgrim-pulse-ring" style="position:absolute;top:0;left:0;width:48px;height:48px;border-radius:50%;background:rgba(16,185,129,0.5);pointer-events:none"></div>
        <div style="width:26px;height:26px;background:#0E4D41;border-radius:50%;border:3px solid white;box-shadow:0 2px 10px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center">
          <div style="width:8px;height:8px;background:#4ade80;border-radius:50%"></div>
        </div>
      </div>`,
    className: "",
    iconSize: [48, 48],
    iconAnchor: [24, 24],
  });
}

function PilgrimDot({ lat, lng, ar }: { lat: number; lng: number; ar: boolean }) {
  return (
    <Marker position={[lat, lng]} icon={makePilgrimIcon()} zIndexOffset={1000}>
      <Popup maxWidth={180}>
        <div style={{ textAlign: "center", fontFamily: "inherit", padding: "4px 0" }}>
          <div style={{ fontSize: 20, marginBottom: 4 }}>📍</div>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#0E4D41" }}>{ar ? "أنت هنا" : "You are here"}</div>
          <div style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>{ar ? "موقعك الحالي" : "Your current location"}</div>
        </div>
      </Popup>
    </Marker>
  );
}

function haversineM(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function fmtDist(m: number, ar: boolean) {
  return m < 1000
    ? ar ? `${Math.round(m)} م` : `${Math.round(m)} m`
    : ar ? `${(m / 1000).toFixed(1)} كم` : `${(m / 1000).toFixed(1)} km`;
}

function fmtTime(secs: number, ar: boolean) {
  if (secs < 60) return ar ? `أقل من دقيقة` : `< 1 min`;
  const mins = Math.round(secs / 60);
  if (mins < 60) return ar ? `${mins} دقيقة` : `${mins} min`;
  const h = Math.floor(mins / 60), m = mins % 60;
  return ar ? `${h} س ${m} د` : `${h}h ${m}m`;
}

interface NavStep {
  icon: string;
  textAr: string;
  textEn: string;
  distanceM: number;
  durationS: number;
}

interface NavRoute {
  coords: [number, number][];
  steps: NavStep[];
  totalDistM: number;
  totalDurationS: number;
  destination: Facility;
}

function maneuverToStep(type: string, modifier: string | undefined, name: string): { icon: string; textAr: string; textEn: string } {
  if (type === "depart") return { icon: "🚶", textAr: `ابدأ السير${name ? ` في ${name}` : ""}`, textEn: `Head ${name ? `along ${name}` : "out"}` };
  if (type === "arrive") return { icon: "🏁", textAr: "وصلت إلى وجهتك", textEn: "You have arrived" };
  const mod = modifier || "straight";
  const map: Record<string, [string, string, string]> = {
    "uturn":       ["↩️", "استدر للخلف", "Make a U-turn"],
    "sharp right": ["↱",  "انعطف يميناً حاداً", "Turn sharp right"],
    "right":       ["➡️", "انعطف يميناً", "Turn right"],
    "slight right":["↗️", "انحرف يميناً قليلاً", "Keep slight right"],
    "straight":    ["⬆️", "استمر للأمام", "Continue straight"],
    "slight left": ["↖️", "انحرف يساراً قليلاً", "Keep slight left"],
    "left":        ["⬅️", "انعطف يساراً", "Turn left"],
    "sharp left":  ["↰",  "انعطف يساراً حاداً", "Turn sharp left"],
  };
  const [icon, ar, en] = map[mod] || ["⬆️", "استمر للأمام", "Continue"];
  const streetAr = name ? ` في ${name}` : "";
  const streetEn = name ? ` on ${name}` : "";
  return { icon, textAr: ar + streetAr, textEn: en + streetEn };
}

type GpsStatus = "idle" | "requesting" | "granted" | "denied";

type CrowdAlt = { facility: Facility; crowdScore: number; distM: number };

function FacilitySheet({
  ar, isRTL, type, selectedId, myLat, myLng, currentHour, onNavigate, onClose,
}: {
  ar: boolean; isRTL: boolean;
  type: FacilityType; selectedId: string;
  myLat: number; myLng: number; currentHour: number;
  onNavigate: (f: Facility) => void; onClose: () => void;
}) {
  const cfg = TYPE_CONFIG[type];
  const facilities = FACILITIES
    .filter(f => f.type === type)
    .map(f => ({ f, distM: haversineM(myLat, myLng, f.lat, f.lng), cs: getCrowdScore(f.id, f.type, currentHour) }))
    .sort((a, b) => a.distM - b.distM);

  return (
    <div className="absolute bottom-0 left-0 right-0 z-[800] flex flex-col" style={{ maxHeight: "62%" }}>
      {/* backdrop tap-to-close strip */}
      <div className="flex-1" onClick={onClose} />
      <div className="rounded-t-3xl shadow-2xl flex flex-col overflow-hidden" style={{ background: "white", direction: isRTL ? "rtl" : "ltr" }}>
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>
        {/* Header */}
        <div className="px-4 pb-3 pt-1 flex items-center justify-between flex-shrink-0 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl flex items-center justify-center text-lg flex-shrink-0"
              style={{ background: cfg.lightHex, border: `2px solid ${cfg.colorHex}` }}>
              {cfg.emoji}
            </div>
            <div>
              <div className="font-bold text-gray-900 text-[15px]">{ar ? cfg.labelAr : cfg.labelEn}</div>
              <div className="text-[11px] text-gray-400">{facilities.length} {ar ? "مواقع قريبة" : "nearby locations"}</div>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 flex-shrink-0">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        {/* Legend */}
        <div className="px-4 py-2 flex items-center gap-3 flex-shrink-0" style={{ background: "#f9fafb" }}>
          <span className="text-[10px] text-gray-500">{ar ? "مستوى الزحام:" : "Crowd level:"}</span>
          {[{ c: "#27ae60", l: ar ? "هادئ" : "Calm" }, { c: "#e67e22", l: ar ? "متوسط" : "Moderate" }, { c: "#e74c3c", l: ar ? "شديد" : "Heavy" }].map(x => (
            <span key={x.c} className="flex items-center gap-1">
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: x.c, display: "inline-block" }} />
              <span className="text-[10px] text-gray-500">{x.l}</span>
            </span>
          ))}
        </div>
        {/* Nearest — prominent quick-navigate card */}
        {facilities[0] && (() => {
          const { f, distM, cs } = facilities[0];
          const cColor = crowdColor(cs);
          const cLabelAr = cs >= 75 ? "زحام شديد" : cs >= 50 ? "زحام متوسط" : "هادئ";
          const cLabelEn = cs >= 75 ? "Heavy" : cs >= 50 ? "Moderate" : "Calm";
          return (
            <div className="px-4 py-3 flex-shrink-0 border-b-2" style={{ borderColor: cfg.colorHex + "33", background: cfg.lightHex }}>
              <div className="flex items-center gap-1 mb-2">
                <span className="text-[10px] font-black uppercase tracking-wide" style={{ color: cfg.colorHex }}>
                  {ar ? "⚡ الأقرب إليك" : "⚡ Nearest to you"}
                </span>
                <div className="flex-1 h-px" style={{ background: cfg.colorHex + "33" }} />
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-gray-900 text-[14px] truncate">{ar ? f.nameAr : f.nameEn}</div>
                  {(ar ? f.detailAr : f.detailEn) && (
                    <div className="text-[11px] text-gray-500 truncate mt-0.5">{ar ? f.detailAr : f.detailEn}</div>
                  )}
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[11px] text-gray-600 font-semibold">📍 {fmtDist(distM, ar)}</span>
                    <span className="text-[11px] text-gray-500">🕐 {fmtTime(distM / 1.2, ar)}</span>
                    <span className="text-[10px] font-semibold" style={{ color: cColor }}>● {ar ? cLabelAr : cLabelEn}</span>
                  </div>
                </div>
                <button onClick={() => onNavigate(f)} data-testid={`nav-btn-nearest-${f.id}`}
                  className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-2xl font-bold text-xs"
                  style={{ background: cfg.colorHex, color: "white" }}>
                  <Navigation className="w-4 h-4" />
                  {ar ? "وجّهني" : "Go"}
                </button>
              </div>
            </div>
          );
        })()}

        {/* Full list */}
        <div className="overflow-y-auto" style={{ overscrollBehavior: "contain" }}>
          <div className="px-4 pt-2 pb-1 text-[10px] font-bold text-gray-400 uppercase tracking-wide">
            {ar ? "كل الخيارات" : "All options"}
          </div>
          {facilities.map(({ f, distM, cs }, idx) => {
            const cColor = crowdColor(cs);
            const cLabelAr = cs >= 75 ? "زحام شديد" : cs >= 50 ? "زحام متوسط" : "هادئ";
            const cLabelEn = cs >= 75 ? "Heavy" : cs >= 50 ? "Moderate" : "Calm";
            return (
              <div key={f.id}
                className="px-4 py-3 flex items-center gap-3 border-b border-gray-50 transition-colors"
                style={{ background: "white" }}
                data-testid={`facility-item-${f.id}`}>
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: idx === 0 ? cfg.colorHex : "#f0f0f0", color: idx === 0 ? "white" : "#888" }}>
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[13px] text-gray-900 truncate">{ar ? f.nameAr : f.nameEn}</div>
                  {(ar ? f.detailAr : f.detailEn) && (
                    <div className="text-[11px] text-gray-400 truncate mb-1">{ar ? f.detailAr : f.detailEn}</div>
                  )}
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-gray-500">📍 {fmtDist(distM, ar)}</span>
                    <span className="text-[11px] text-gray-500">🕐 {fmtTime(distM / 1.2, ar)}</span>
                    <span className="text-[10px] font-semibold" style={{ color: cColor }}>● {ar ? cLabelAr : cLabelEn} {cs}%</span>
                  </div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-gray-100 overflow-hidden w-full">
                    <div style={{ width: `${cs}%`, height: "100%", background: cColor, borderRadius: 4, transition: "width 0.5s" }} />
                  </div>
                </div>
                <button onClick={() => onNavigate(f)} data-testid={`nav-btn-${f.id}`}
                  className="flex-shrink-0 w-9 h-9 rounded-2xl flex items-center justify-center transition-colors"
                  style={{ background: "#0E4D41", color: "white" }}>
                  <Navigation className="w-4 h-4" />
                </button>
              </div>
            );
          })}
          <div className="h-4" />
        </div>
      </div>
    </div>
  );
}

function CrowdWarningModal({
  ar, facility, crowdScore, alternatives, analysis, loading, onNavigate, onPickAlt, onClose,
}: {
  ar: boolean;
  facility: Facility;
  crowdScore: number;
  alternatives: CrowdAlt[];
  analysis: string;
  loading: boolean;
  onNavigate: () => void;
  onPickAlt: (f: Facility) => void;
  onClose: () => void;
}) {
  const cfg = TYPE_CONFIG[facility.type];
  const color = crowdColor(crowdScore);
  const crowdLabelAr = crowdScore >= 75 ? "زحام شديد 🔴" : crowdScore >= 50 ? "زحام متوسط 🟡" : "هادئ نسبياً 🟢";
  const crowdLabelEn = crowdScore >= 75 ? "Heavy Crowd 🔴" : crowdScore >= 50 ? "Moderate Crowd 🟡" : "Relatively Calm 🟢";

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4" style={{ direction: ar ? "rtl" : "ltr" }}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 pt-5 pb-4" style={{ background: `linear-gradient(135deg, ${color}22 0%, white 100%)` }}>
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: cfg.lightHex, border: `2px solid ${cfg.colorHex}` }}>
                {cfg.emoji}
              </div>
              <div>
                <div className="font-bold text-gray-900 text-[15px] leading-tight">{ar ? facility.nameAr : facility.nameEn}</div>
                <div className="text-xs font-semibold mt-0.5" style={{ color }}>{ar ? crowdLabelAr : crowdLabelEn}</div>
              </div>
            </div>
            <button onClick={onClose} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 hover:bg-gray-200">
              <X className="w-3.5 h-3.5 text-gray-500" />
            </button>
          </div>
          {/* Crowd gauge */}
          <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${crowdScore}%`, background: color }} />
          </div>
          <div className="flex justify-between text-[10px] text-gray-400 mt-1">
            <span>{ar ? "هادئ" : "Calm"}</span>
            <span className="font-bold" style={{ color }}>{crowdScore}%</span>
            <span>{ar ? "ممتلئ" : "Full"}</span>
          </div>
        </div>

        {/* AI Analysis */}
        <div className="px-5 pb-4">
          <div className="flex items-center gap-1.5 mb-2">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center">
              <span className="text-white text-[9px] font-bold">AI</span>
            </div>
            <span className="text-xs font-bold text-gray-700">{ar ? "تحليل الذكاء الاصطناعي" : "AI Analysis"}</span>
          </div>
          {loading ? (
            <div className="flex items-center gap-2 py-3">
              <div className="w-4 h-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin flex-shrink-0" />
              <span className="text-xs text-gray-500">{ar ? "يتم التحليل…" : "Analyzing…"}</span>
            </div>
          ) : (
            <p className="text-[12px] text-gray-600 leading-relaxed">{analysis}</p>
          )}
        </div>

        {/* Alternatives */}
        {alternatives.length > 0 && (
          <div className="px-5 pb-4">
            <div className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1.5">
              <ArrowRight className="w-3.5 h-3.5" />{ar ? "بدائل مقترحة (مرتبة حسب الأقل زحاماً)" : "Suggested alternatives (least crowded first)"}
            </div>
            <div className="flex flex-col gap-2">
              {alternatives.map((alt) => (
                <button key={alt.facility.id} onClick={() => onPickAlt(alt.facility)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-2xl border-2 text-start hover:border-teal-400 hover:bg-teal-50 transition-all"
                  style={{ borderColor: crowdColor(alt.crowdScore) + "55", background: crowdColor(alt.crowdScore) + "08" }}
                  data-testid={`alt-${alt.facility.id}`}>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0"
                    style={{ background: TYPE_CONFIG[alt.facility.type].lightHex }}>
                    {TYPE_CONFIG[alt.facility.type].emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[12px] text-gray-800 truncate">{ar ? alt.facility.nameAr : alt.facility.nameEn}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-bold" style={{ color: crowdColor(alt.crowdScore) }}>
                        {alt.crowdScore < 50 ? (ar ? "هادئ" : "Calm") : alt.crowdScore < 75 ? (ar ? "متوسط" : "Moderate") : (ar ? "مزدحم" : "Crowded")} {alt.crowdScore}%
                      </span>
                      <span className="text-[10px] text-gray-400">· {fmtDist(alt.distM, ar)}</span>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" style={{ transform: ar ? "scaleX(-1)" : undefined }} />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="px-5 pb-5 flex gap-2">
          <button onClick={onNavigate} data-testid="btn-navigate-anyway"
            className="flex-1 py-3 rounded-2xl border-2 border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-colors">
            {ar ? "توجيه رغم الزحام" : "Navigate Anyway"}
          </button>
          <button onClick={onClose} data-testid="btn-crowd-cancel"
            className="py-3 px-4 rounded-2xl text-sm font-semibold text-white transition-colors"
            style={{ background: "#0E4D41" }}>
            {ar ? "إلغاء" : "Cancel"}
          </button>
        </div>
      </div>
    </div>
  );
}

function makeCustomOriginIcon() {
  return L.divIcon({
    html: `<div style="display:flex;flex-direction:column;align-items:center">
      <div style="width:36px;height:36px;background:#1A5C8A;border-radius:50%;border:3px solid white;display:flex;align-items:center;justify-content:center;font-size:17px;box-shadow:0 3px 10px rgba(26,92,138,0.5)">🚩</div>
      <div style="width:3px;height:8px;background:#1A5C8A;margin-top:1px;border-radius:2px"></div>
    </div>`,
    className: "",
    iconSize: [36, 47],
    iconAnchor: [18, 47],
  });
}

function MapClickHandler({ picking, onPick, onMapClick }: { picking: boolean; onPick: (lat: number, lng: number) => void; onMapClick: () => void }) {
  useMapEvents({
    click(e) {
      if (picking) onPick(e.latlng.lat, e.latlng.lng);
      else onMapClick();
    },
  });
  return null;
}

function FitRoute({ coords }: { coords: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (coords.length > 1) {
      map.fitBounds(L.latLngBounds(coords), { padding: [40, 40], animate: true, duration: 1.2 });
    }
  }, [coords]);
  return null;
}

function FlyToPos({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => { map.flyTo([lat, lng], 16, { duration: 1.5 }); }, [lat, lng]);
  return null;
}

function CenterOnNav({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => { map.setView([lat, lng], 18, { animate: true, duration: 0.6 }); }, [lat, lng]);
  return null;
}

export function PilgrimGuideMap() {
  const { lang, isRTL } = useLanguage();
  const { toast } = useToast();
  const ar = lang === "ar";

  const { data: pilgrim } = useQuery<Pilgrim>({ queryKey: ["/api/pilgrims/1"] });
  const fallbackLat = pilgrim?.locationLat ?? 21.4225;
  const fallbackLng = pilgrim?.locationLng ?? 39.8262;

  const [gpsStatus, setGpsStatus] = useState<GpsStatus>("idle");
  const [gpsPos, setGpsPos] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [flyToGps, setFlyToGps] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  const [customOrigin, setCustomOrigin] = useState<{ lat: number; lng: number } | null>(null);
  const [pickingOrigin, setPickingOrigin] = useState(false);

  const gpsLat = gpsPos?.lat ?? fallbackLat;
  const gpsLng = gpsPos?.lng ?? fallbackLng;
  const myLat = customOrigin?.lat ?? gpsLat;
  const myLng = customOrigin?.lng ?? gpsLng;

  const resetToGps = () => { setCustomOrigin(null); setPickingOrigin(false); };

  const requestGps = () => {
    if (!navigator.geolocation) { setGpsStatus("denied"); return; }
    setGpsStatus("requesting");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsPos({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy });
        setGpsStatus("granted");
        setFlyToGps(true);
        toast({ title: ar ? "✅ تم تحديد موقعك الحقيقي" : "✅ Real location detected" });
      },
      () => {
        setGpsStatus("denied");
        toast({ title: ar ? "⚠️ تعذّر الوصول للموقع" : "⚠️ Location access denied", variant: "destructive" });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => { requestGps(); return () => { if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current); }; }, []);

  const [activeFilters, setActiveFilters] = useState<Set<FacilityType>>(new Set(["hospital", "water", "mosque", "bathroom", "transport"] as FacilityType[]));
  const toggleFilter = (type: FacilityType) => setActiveFilters(prev => { const n = new Set(prev); n.has(type) ? n.delete(type) : n.add(type); return n; });

  const [navRoute, setNavRoute] = useState<NavRoute | null>(null);
  const [navLoading, setNavLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [remainingM, setRemainingM] = useState(0);
  const [remainingS, setRemainingS] = useState(0);
  const [stepsOpen, setStepsOpen] = useState(false);
  const [visitedCoords, setVisitedCoords] = useState<[number, number][]>([]);
  const [distToNextTurn, setDistToNextTurn] = useState<number | null>(null);
  const [approachingTurn, setApproachingTurn] = useState(false);

  const [crowdModal, setCrowdModal] = useState<{
    facility: Facility; crowdScore: number; alternatives: CrowdAlt[];
  } | null>(null);
  const [crowdAnalysis, setCrowdAnalysis] = useState("");
  const [crowdAnalysisLoading, setCrowdAnalysisLoading] = useState(false);

  const [facilitySheet, setFacilitySheet] = useState<{ type: FacilityType; selectedId: string } | null>(null);

  const [originPanelOpen, setOriginPanelOpen] = useState(false);
  const [originSearchQ, setOriginSearchQ] = useState("");
  const [originSearchResults, setOriginSearchResults] = useState<{ display_name: string; lat: string; lon: string }[]>([]);
  const [originSearchLoading, setOriginSearchLoading] = useState(false);
  const originSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchOriginByName = async (q: string) => {
    if (!q.trim()) { setOriginSearchResults([]); return; }
    setOriginSearchLoading(true);
    try {
      const params = new URLSearchParams({ q, format: "json", limit: "6", bounded: "1",
        viewbox: "39.7,21.2,40.1,21.6", addressdetails: "0" });
      const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
        headers: { "Accept-Language": ar ? "ar" : "en" }
      });
      const data = await res.json();
      setOriginSearchResults(Array.isArray(data) ? data : []);
    } catch {
      setOriginSearchResults([]);
    } finally {
      setOriginSearchLoading(false);
    }
  };

  const handleOriginSearchInput = (v: string) => {
    setOriginSearchQ(v);
    if (originSearchTimer.current) clearTimeout(originSearchTimer.current);
    originSearchTimer.current = setTimeout(() => searchOriginByName(v), 500);
  };

  const pickOriginFromSearch = (lat: string, lon: string, name: string) => {
    setCustomOrigin({ lat: parseFloat(lat), lng: parseFloat(lon) });
    setOriginPanelOpen(false);
    setOriginSearchQ("");
    setOriginSearchResults([]);
    setPickingOrigin(false);
    toast({ title: ar ? `📍 تم تحديد: ${name.split(",")[0]}` : `📍 Set to: ${name.split(",")[0]}` });
  };

  const currentHour = new Date().getHours();

  const stopNav = () => {
    setNavRoute(null);
    setCurrentStep(0);
    setVisitedCoords([]);
    setDistToNextTurn(null);
    setApproachingTurn(false);
    if (watchIdRef.current) { navigator.geolocation.clearWatch(watchIdRef.current); watchIdRef.current = null; }
  };

  const startLiveTracking = (route: NavRoute) => {
    if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    if (!navigator.geolocation) return;
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude, lng = pos.coords.longitude;
        setGpsPos({ lat, lng, accuracy: pos.coords.accuracy });

        setVisitedCoords(prev => {
          if (prev.length === 0) return [[lat, lng]];
          const last = prev[prev.length - 1];
          if (haversineM(last[0], last[1], lat, lng) > 3) return [...prev, [lat, lng]];
          return prev;
        });

        const distToDest = haversineM(lat, lng, route.destination.lat, route.destination.lng);
        setRemainingM(distToDest);
        const ratio = Math.max(0, distToDest / route.totalDistM);
        setRemainingS(Math.round(route.totalDurationS * ratio));

        if (route.steps.length > 0) {
          let stepIdx = 0;
          let cumDist = 0;
          const traveled = route.totalDistM - distToDest;
          for (let i = 0; i < route.steps.length; i++) {
            cumDist += route.steps[i].distanceM;
            if (traveled < cumDist) { stepIdx = i; break; }
            stepIdx = i;
          }
          const sIdx = Math.min(stepIdx, route.steps.length - 1);
          setCurrentStep(sIdx);

          if (sIdx + 1 < route.steps.length) {
            const nextStep = route.steps[sIdx + 1];
            const dToNext = route.steps[sIdx].distanceM - (traveled - (cumDist - route.steps[sIdx].distanceM));
            const d = Math.max(0, Math.round(dToNext));
            setDistToNextTurn(d);
            setApproachingTurn(d <= 60 && d > 0 && nextStep.icon !== "🏁");
          } else {
            setDistToNextTurn(null);
            setApproachingTurn(false);
          }
        }

        if (distToDest < 25) {
          toast({ title: ar ? "🏁 وصلت إلى وجهتك!" : "🏁 You have arrived!" });
          stopNav();
        }
      },
      () => {},
      { enableHighAccuracy: true }
    );
  };

  const executeNavigation = async (facility: Facility) => {
    setCrowdModal(null);
    setNavLoading(true);
    try {
      const url = `https://router.project-osrm.org/route/v1/foot/${myLng},${myLat};${facility.lng},${facility.lat}?overview=full&geometries=geojson&steps=true`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.code !== "Ok" || !data.routes?.[0]) throw new Error("No route");

      const route = data.routes[0];
      const coords: [number, number][] = route.geometry.coordinates.map(([lng, lat]: [number, number]) => [lat, lng]);

      const steps: NavStep[] = [];
      for (const leg of route.legs) {
        for (const step of leg.steps) {
          const m = step.maneuver;
          const { icon, textAr, textEn } = maneuverToStep(m.type, m.modifier, step.name || "");
          steps.push({ icon, textAr, textEn, distanceM: step.distance, durationS: step.duration });
        }
      }

      const navData: NavRoute = {
        coords, steps,
        totalDistM: route.distance,
        totalDurationS: route.duration,
        destination: facility,
      };

      setNavRoute(navData);
      setCurrentStep(0);
      setRemainingM(route.distance);
      setRemainingS(route.duration);
      setStepsOpen(false);

      if (gpsStatus === "granted") startLiveTracking(navData);

      toast({
        title: ar ? `🗺️ بدأ التوجيه إلى: ${facility.nameAr}` : `🗺️ Navigation started: ${facility.nameEn}`,
        description: ar
          ? `${fmtDist(route.distance, true)} · ${fmtTime(route.duration, true)} سيراً`
          : `${fmtDist(route.distance, false)} · ${fmtTime(route.duration, false)} walking`,
      });
    } catch {
      const distM = haversineM(myLat, myLng, facility.lat, facility.lng);
      const durationS = (distM / 1.2);
      setNavRoute({
        coords: [[myLat, myLng], [facility.lat, facility.lng]],
        steps: [
          { icon: "🚶", textAr: `توجه نحو ${facility.nameAr}`, textEn: `Head toward ${facility.nameEn}`, distanceM: distM, durationS },
          { icon: "🏁", textAr: "وصلت إلى وجهتك", textEn: "You have arrived", distanceM: 0, durationS: 0 },
        ],
        totalDistM: distM, totalDurationS: durationS, destination: facility,
      });
      setRemainingM(distM);
      setRemainingS(durationS);
      toast({ title: ar ? "⚠️ خريطة مباشرة — تحقق من الإنترنت" : "⚠️ Direct route — check internet", variant: "destructive" });
    } finally {
      setNavLoading(false);
    }
  };

  const handleNavigate = async (facility: Facility) => {
    const score = getCrowdScore(facility.id, facility.type, currentHour);
    if (score < 50) {
      executeNavigation(facility);
      return;
    }
    const alts: CrowdAlt[] = FACILITIES
      .filter(f => f.type === facility.type && f.id !== facility.id)
      .map(f => ({ facility: f, crowdScore: getCrowdScore(f.id, f.type, currentHour), distM: haversineM(myLat, myLng, f.lat, f.lng) }))
      .sort((a, b) => a.crowdScore - b.crowdScore)
      .slice(0, 3);
    setCrowdModal({ facility, crowdScore: score, alternatives: alts });
    setCrowdAnalysis("");
    setCrowdAnalysisLoading(true);
    try {
      const res = await fetch("/api/crowd-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          facility: { nameAr: facility.nameAr, nameEn: facility.nameEn, type: facility.type },
          alternatives: alts.map(a => ({ nameAr: a.facility.nameAr, nameEn: a.facility.nameEn, crowdScore: a.crowdScore, distM: a.distM })),
          crowdScore: score,
          lang,
          hour: currentHour,
        }),
      });
      const data = await res.json();
      setCrowdAnalysis(data.analysis ?? "");
    } catch {
      setCrowdAnalysis(ar ? "تعذّر تحميل التحليل. تحقق من الاتصال." : "Failed to load analysis. Check your connection.");
    } finally {
      setCrowdAnalysisLoading(false);
    }
  };

  const visibleFacilities = FACILITIES.filter(f => activeFilters.has(f.type));
  const destFacility = navRoute?.destination;

  return (
    <div className="flex flex-col h-full" style={{ direction: isRTL ? "rtl" : "ltr" }}>

      {gpsStatus === "requesting" && (
        <div className="px-4 py-2 text-xs flex items-center gap-2 border-b border-[#a8d4cb]" style={{ background: "#d4ede6", color: "#0E4D41" }}>
          <span className="animate-pulse">📡</span>
          <span className="font-semibold">{ar ? "جاري تحديد موقعك الحقيقي…" : "Detecting your real location…"}</span>
        </div>
      )}
      {gpsStatus === "denied" && (
        <div className="px-4 py-2 text-xs flex items-center justify-between gap-2 border-b border-orange-200 bg-orange-50">
          <span className="text-orange-700 font-semibold">{ar ? "⚠️ لم يُسمح بالوصول للموقع — يُعرض موقع افتراضي" : "⚠️ Location denied — showing default position"}</span>
          <button onClick={requestGps} className="text-[#0E4D41] font-bold underline text-[11px]">{ar ? "إعادة المحاولة" : "Retry"}</button>
        </div>
      )}
      {gpsStatus === "granted" && gpsPos && !navRoute && (
        <div className="px-4 py-2 text-xs flex items-center justify-between border-b border-[#a8d4cb]" style={{ background: "#d4ede6", color: "#0E4D41" }}>
          <span className="font-semibold">📍 {ar ? `موقعك الحقيقي · دقة ${Math.round(gpsPos.accuracy)} م` : `Real location · ±${Math.round(gpsPos.accuracy)} m`}</span>
          <button onClick={requestGps} className="opacity-60 hover:opacity-100 font-bold text-[11px] flex items-center gap-1">
            <RefreshCw className="w-3 h-3" />{ar ? "تحديث" : "Refresh"}
          </button>
        </div>
      )}

      {/* Origin picker bar */}
      {!navRoute && (
        <div className="flex-shrink-0 border-b border-border bg-card">
          {/* Status row */}
          <div className="px-4 py-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {pickingOrigin ? (
                <span className="text-xs font-bold text-blue-700 flex items-center gap-1.5 animate-pulse">
                  <MousePointer2 className="w-3.5 h-3.5 flex-shrink-0" />
                  {ar ? "انقر على الخريطة لتحديد نقطة البداية" : "Tap the map to set start location"}
                </span>
              ) : customOrigin ? (
                <span className="text-xs font-semibold text-[#1A5C8A] flex items-center gap-1.5 truncate">
                  <span>🚩</span>
                  <span>{ar ? "نقطة البداية: موقع مخصص" : "Start: Custom location"}</span>
                </span>
              ) : (
                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <LocateFixed className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{ar ? (gpsStatus === "granted" ? "نقطة البداية: GPS" : "نقطة البداية: افتراضي") : (gpsStatus === "granted" ? "Start: GPS location" : "Start: Default")}</span>
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {customOrigin && (
                <button onClick={resetToGps} data-testid="btn-reset-origin"
                  className="text-[11px] px-2 py-1 rounded-lg border border-[#a8d4cb] text-[#0E4D41] bg-[#eaf6f2] font-bold hover:bg-[#d4ede6] transition-colors flex items-center gap-1">
                  <LocateFixed className="w-3 h-3" />
                  {ar ? "موقعي" : "My GPS"}
                </button>
              )}
              {(pickingOrigin || originPanelOpen) ? (
                <button onClick={() => { setPickingOrigin(false); setOriginPanelOpen(false); setOriginSearchQ(""); setOriginSearchResults([]); }}
                  className="text-[11px] px-2 py-1 rounded-lg border border-red-200 text-red-600 bg-white font-bold hover:bg-red-50 transition-colors">
                  {ar ? "إلغاء" : "Cancel"}
                </button>
              ) : (
                <button onClick={() => setOriginPanelOpen(o => !o)} data-testid="btn-change-start"
                  className="text-[11px] px-2 py-1 rounded-lg border border-border text-foreground font-semibold hover:border-[#0E4D41] hover:text-[#0E4D41] transition-colors flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {ar ? "تغيير نقطة البداية" : "Change start"}
                </button>
              )}
            </div>
          </div>

          {/* Expanded panel — two options */}
          {originPanelOpen && !pickingOrigin && (
            <div className="border-t border-border">
              {/* Two option buttons */}
              <div className="px-3 pt-2 pb-2 flex gap-2">
                <button
                  onClick={() => { setOriginPanelOpen(false); setPickingOrigin(true); }}
                  data-testid="btn-pick-on-map"
                  className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 border-blue-200 bg-blue-50 text-blue-700 font-bold text-xs hover:bg-blue-100 transition-colors">
                  <MousePointer2 className="w-4 h-4 flex-shrink-0" />
                  <span>{ar ? "تحديد على الخريطة" : "Pick on map"}</span>
                </button>
                <button
                  onClick={() => {}}
                  data-testid="btn-search-location"
                  className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 border-[#0E4D41] bg-[#eaf6f2] text-[#0E4D41] font-bold text-xs hover:bg-[#d4ede6] transition-colors cursor-default">
                  <Search className="w-4 h-4 flex-shrink-0" />
                  <span>{ar ? "بحث بالاسم" : "Search by name"}</span>
                </button>
              </div>

              {/* Search input */}
              <div className="px-3 pb-1 relative">
                <div className="relative">
                  <Search className="absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"
                    style={{ [isRTL ? "right" : "left"]: "10px" }} />
                  <input
                    type="text"
                    autoFocus
                    data-testid="input-origin-search"
                    value={originSearchQ}
                    onChange={e => handleOriginSearchInput(e.target.value)}
                    placeholder={ar ? "ابحث عن موقع… (مثال: مسجد الحرام، منى)" : "Search location… (e.g. Masjid al-Haram, Mina)"}
                    className="w-full rounded-xl border border-border bg-background text-sm px-9 py-2.5 outline-none focus:border-[#0E4D41] transition-colors"
                    style={{ direction: isRTL ? "rtl" : "ltr", paddingInlineStart: "2.25rem", paddingInlineEnd: "0.75rem" }}
                  />
                  {originSearchLoading && (
                    <div className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 border-2 border-[#0E4D41] border-t-transparent rounded-full animate-spin"
                      style={{ [isRTL ? "left" : "right"]: "10px" }} />
                  )}
                </div>
              </div>

              {/* Results */}
              {originSearchResults.length > 0 && (
                <div className="mx-3 mb-2 rounded-xl border border-border overflow-hidden shadow-sm">
                  {originSearchResults.map((r, i) => (
                    <button key={i}
                      onClick={() => pickOriginFromSearch(r.lat, r.lon, r.display_name)}
                      className="w-full px-3 py-2.5 flex items-start gap-2 text-left border-b border-border/50 last:border-0 hover:bg-[#eaf6f2] transition-colors"
                      style={{ direction: isRTL ? "rtl" : "ltr" }}>
                      <MapPin className="w-3.5 h-3.5 text-[#0E4D41] flex-shrink-0 mt-0.5" />
                      <span className="text-xs text-foreground leading-snug line-clamp-2">{r.display_name}</span>
                    </button>
                  ))}
                </div>
              )}
              {originSearchQ.length > 1 && !originSearchLoading && originSearchResults.length === 0 && (
                <div className="px-3 pb-2 text-xs text-muted-foreground text-center">
                  {ar ? "لم يُعثر على نتائج. جرّب كلمة أخرى." : "No results found. Try another keyword."}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Filter bar — hide during nav */}
      {!navRoute && (
        <div className="px-3 py-2.5 bg-card border-b border-border overflow-x-auto flex-shrink-0">
          <div className={`flex gap-2 ${isRTL ? "flex-row-reverse" : ""}`} style={{ minWidth: "max-content" }}>
            {(Object.entries(TYPE_CONFIG) as [FacilityType, typeof TYPE_CONFIG[FacilityType]][]).map(([type, cfg]) => {
              const sheetOpen = facilitySheet?.type === type;
              const nearest = FACILITIES.filter(f => f.type === type)
                .sort((a, b) => haversineM(myLat, myLng, a.lat, a.lng) - haversineM(myLat, myLng, b.lat, b.lng))[0];
              return (
                <button
                  key={type}
                  data-testid={`filter-${type}`}
                  onClick={() => {
                    if (sheetOpen) { setFacilitySheet(null); return; }
                    if (!activeFilters.has(type)) toggleFilter(type);
                    if (nearest) setFacilitySheet({ type, selectedId: nearest.id });
                  }}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold transition-all border shadow-sm ${sheetOpen ? "shadow-md scale-95" : ""}`}
                  style={sheetOpen
                    ? { background: cfg.colorHex, color: "#fff", borderColor: cfg.colorHex }
                    : { background: cfg.lightHex, color: cfg.colorHex, borderColor: cfg.colorHex + "55" }}>
                  <span className="text-sm">{cfg.emoji}</span>
                  <div className="flex flex-col items-start leading-tight">
                    <span>{ar ? cfg.labelAr : cfg.labelEn}</span>
                    {nearest && (
                      <span className="font-normal opacity-80" style={{ fontSize: 9 }}>
                        {fmtDist(haversineM(myLat, myLng, nearest.lat, nearest.lng), ar)}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5 px-1">
            {ar ? "اضغط على النوع لرؤية الخيارات الأقرب إليك" : "Tap a type to see nearby options"}
          </p>
        </div>
      )}

      {/* Navigation HUD — Google Maps style */}
      {navRoute && (
        <div className="flex-shrink-0 border-b border-[#a8d4cb]" style={{ background: "#0E4D41" }}>

          {/* Progress bar */}
          <div className="h-1 w-full bg-white/20">
            <div
              className="h-full bg-white transition-all duration-700"
              style={{ width: `${Math.round(Math.max(0, 1 - remainingM / navRoute.totalDistM) * 100)}%` }}
            />
          </div>

          {/* Approaching-turn alert */}
          {approachingTurn && navRoute.steps[currentStep + 1] && (
            <div className="mx-3 mt-2 rounded-xl px-3 py-2 flex items-center gap-2 animate-pulse"
              style={{ background: "#f59e0b", color: "#7c2d12" }}>
              <span className="text-xl flex-shrink-0">{navRoute.steps[currentStep + 1].icon}</span>
              <div className="flex-1 min-w-0">
                <div className="font-black text-xs">
                  {ar ? `في ${fmtDist(distToNextTurn ?? 0, ar)} — ${navRoute.steps[currentStep + 1].textAr}`
                      : `In ${fmtDist(distToNextTurn ?? 0, ar)} — ${navRoute.steps[currentStep + 1].textEn}`}
                </div>
              </div>
            </div>
          )}

          {/* Current step — big & clear */}
          {navRoute.steps[currentStep] && (
            <div className="px-3 pt-2 pb-2 flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
                style={{ background: "rgba(255,255,255,0.15)" }}>
                {navRoute.steps[currentStep].icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white font-black text-base leading-tight">
                  {ar ? navRoute.steps[currentStep].textAr : navRoute.steps[currentStep].textEn}
                </div>
                {navRoute.steps[currentStep].distanceM > 0 && (
                  <div className="text-green-200 font-bold text-sm mt-1">
                    {distToNextTurn !== null
                      ? fmtDist(distToNextTurn, ar)
                      : fmtDist(navRoute.steps[currentStep].distanceM, ar)}
                  </div>
                )}
              </div>
              <button onClick={stopNav}
                className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(239,68,68,0.25)", border: "1.5px solid rgba(239,68,68,0.6)" }}>
                <X className="w-4 h-4 text-red-300" />
              </button>
            </div>
          )}

          {/* Destination + ETA row */}
          <div className="px-3 pb-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0"
                style={{ background: TYPE_CONFIG[navRoute.destination.type].colorHex + "33" }}>
                {TYPE_CONFIG[navRoute.destination.type].emoji}
              </div>
              <span className="text-green-100 text-xs font-semibold truncate">
                {ar ? navRoute.destination.nameAr : navRoute.destination.nameEn}
              </span>
            </div>
            <div className="flex items-center gap-3 text-green-200 text-xs font-bold flex-shrink-0">
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{fmtDist(remainingM, ar)}</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{fmtTime(remainingS, ar)}</span>
            </div>
          </div>

          {/* Steps list toggle */}
          <button
            onClick={() => setStepsOpen(!stepsOpen)}
            className="w-full px-4 py-2 flex items-center justify-between text-[11px] font-bold text-green-100 border-t border-white/10 hover:bg-white/5 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <Navigation className="w-3 h-3" />
              {ar ? `${navRoute.steps.length} خطوات التوجيه` : `${navRoute.steps.length} turn-by-turn steps`}
            </span>
            {stepsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {stepsOpen && (
            <div className="max-h-48 overflow-y-auto" style={{ background: "#0a3d2f" }}>
              {navRoute.steps.map((step, i) => (
                <div key={i} className={`px-4 py-2.5 flex items-start gap-3 border-b border-white/5 text-xs transition-colors ${i === currentStep ? "bg-white/10" : ""}`}>
                  <span className="text-base flex-shrink-0 mt-0.5">{step.icon}</span>
                  <div className="flex-1">
                    <div className={`font-semibold ${i === currentStep ? "text-white" : "text-green-200"}`}>
                      {ar ? step.textAr : step.textEn}
                    </div>
                    {step.distanceM > 0 && (
                      <div className={`mt-0.5 ${i === currentStep ? "text-yellow-300 font-bold" : "text-green-400"}`}>
                        {fmtDist(step.distanceM, ar)}
                      </div>
                    )}
                  </div>
                  {i === currentStep && (
                    <div className="w-2 h-2 rounded-full bg-yellow-300 flex-shrink-0 mt-1.5 animate-pulse" />
                  )}
                  {i < currentStep && (
                    <div className="w-4 h-4 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[8px] text-white font-bold">✓</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Map */}
      <div className="flex-1 relative" style={{ minHeight: 0 }}>
        {navLoading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
            <div className="bg-white rounded-2xl px-6 py-4 shadow-xl flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-[#0E4D41] border-t-transparent rounded-full animate-spin" />
              <span className="font-bold text-[#0E4D41] text-sm">{ar ? "جاري حساب المسار…" : "Calculating route…"}</span>
            </div>
          </div>
        )}
        <MapContainer center={[fallbackLat, fallbackLng]} zoom={14} style={{ width: "100%", height: "100%", cursor: pickingOrigin ? "crosshair" : undefined }} zoomControl={false}>
          <TileLayer attribution='© <a href="https://carto.com">CARTO</a>' url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />

          <MapClickHandler picking={pickingOrigin} onPick={(lat, lng) => {
            setCustomOrigin({ lat, lng });
            setPickingOrigin(false);
            toast({ title: ar ? "📍 تم اختيار نقطة البداية" : "📍 Start location set" });
          }} onMapClick={() => setFacilitySheet(null)} />

          {flyToGps && !navRoute && gpsPos && <FlyToPos lat={gpsPos.lat} lng={gpsPos.lng} />}
          {navRoute && <FitRoute coords={navRoute.coords} />}

          {customOrigin && (
            <Marker position={[customOrigin.lat, customOrigin.lng]} icon={makeCustomOriginIcon()} zIndexOffset={1000} />
          )}
          <PilgrimDot lat={myLat} lng={myLng} ar={ar} />

          {navRoute && (
            <>
              {/* Remaining route — blue */}
              <Polyline positions={navRoute.coords} pathOptions={{ color: "#1A5C8A", weight: 6, opacity: 0.9 }} />
              <Polyline positions={navRoute.coords} pathOptions={{ color: "#ffffff", weight: 2, opacity: 0.4, dashArray: "1,10" }} />
              {/* Traveled path — gray/green trail */}
              {visitedCoords.length >= 2 && (
                <Polyline positions={visitedCoords} pathOptions={{ color: "#22c55e", weight: 5, opacity: 0.8 }} />
              )}
              <Marker position={[navRoute.destination.lat, navRoute.destination.lng]} icon={makeDestIcon(navRoute.destination.type)} zIndexOffset={900} />
              {/* Auto-center on user during navigation */}
              {gpsPos && <CenterOnNav lat={gpsPos.lat} lng={gpsPos.lng} />}
            </>
          )}

          {!navRoute && visibleFacilities.map(facility => {
            const cs = getCrowdScore(facility.id, facility.type, currentHour);
            const isActive = facilitySheet?.selectedId === facility.id;
            return (
              <Marker
                key={facility.id}
                position={[facility.lat, facility.lng]}
                icon={makeFacilityIcon(facility.type, isActive, cs)}
                zIndexOffset={isActive ? 500 : 0}
                eventHandlers={{
                  click: () => setFacilitySheet({ type: facility.type, selectedId: facility.id }),
                }}
              />
            );
          })}

        </MapContainer>

        {/* Facility bottom sheet — overlays the map */}
        {facilitySheet && !navRoute && (
          <FacilitySheet
            ar={ar}
            isRTL={isRTL}
            type={facilitySheet.type}
            selectedId={facilitySheet.selectedId}
            myLat={myLat}
            myLng={myLng}
            currentHour={currentHour}
            onNavigate={(f) => { setFacilitySheet(null); handleNavigate(f); }}
            onClose={() => setFacilitySheet(null)}
          />
        )}
      </div>

      {crowdModal && (
        <CrowdWarningModal
          ar={ar}
          facility={crowdModal.facility}
          crowdScore={crowdModal.crowdScore}
          alternatives={crowdModal.alternatives}
          analysis={crowdAnalysis}
          loading={crowdAnalysisLoading}
          onNavigate={() => executeNavigation(crowdModal.facility)}
          onPickAlt={(f) => { setCrowdModal(null); executeNavigation(f); }}
          onClose={() => setCrowdModal(null)}
        />
      )}
    </div>
  );
}
