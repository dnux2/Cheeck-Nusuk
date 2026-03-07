import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useLanguage } from "@/contexts/language-context";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { type Pilgrim } from "@shared/schema";
import { Navigation, X, ChevronDown, ChevronUp, Clock, MapPin, RefreshCw } from "lucide-react";

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

function makeFacilityIcon(type: FacilityType, highlighted = false) {
  const cfg = TYPE_CONFIG[type];
  const size = highlighted ? 40 : 34;
  return L.divIcon({
    html: `<div style="width:${size}px;height:${size}px;background:${highlighted ? cfg.colorHex : cfg.lightHex};border-radius:50%;border:${highlighted ? "3px" : "2.5px"} solid ${cfg.colorHex};display:flex;align-items:center;justify-content:center;font-size:${highlighted ? 17 : 15}px;box-shadow:0 2px 8px ${cfg.colorHex}${highlighted ? "88" : "44"}">${cfg.emoji}</div>`,
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

  const myLat = gpsPos?.lat ?? fallbackLat;
  const myLng = gpsPos?.lng ?? fallbackLng;

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

  const [activeFilters, setActiveFilters] = useState<Set<FacilityType>>(new Set(["hospital", "water", "mosque", "bathroom", "transport"]));
  const toggleFilter = (type: FacilityType) => setActiveFilters(prev => { const n = new Set(prev); n.has(type) ? n.delete(type) : n.add(type); return n; });

  const [navRoute, setNavRoute] = useState<NavRoute | null>(null);
  const [navLoading, setNavLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [remainingM, setRemainingM] = useState(0);
  const [remainingS, setRemainingS] = useState(0);
  const [stepsOpen, setStepsOpen] = useState(false);

  const stopNav = () => {
    setNavRoute(null);
    setCurrentStep(0);
    if (watchIdRef.current) { navigator.geolocation.clearWatch(watchIdRef.current); watchIdRef.current = null; }
  };

  const startLiveTracking = (route: NavRoute) => {
    if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    if (!navigator.geolocation) return;
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude, lng = pos.coords.longitude;
        setGpsPos({ lat, lng, accuracy: pos.coords.accuracy });
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
          setCurrentStep(Math.min(stepIdx, route.steps.length - 1));
        }
        if (distToDest < 25) {
          toast({ title: ar ? "🏁 وصلت إلى وجهتك!" : "🏁 You have arrived!" });
          stopNav();
        }
      },
      () => {},
      { enableHighAccuracy: true, distanceFilter: 5 }
    );
  };

  const handleNavigate = async (facility: Facility) => {
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

      {/* Filter bar — hide during nav */}
      {!navRoute && (
        <div className="px-4 py-3 bg-card border-b border-border overflow-x-auto flex-shrink-0">
          <div className={`flex gap-2 ${isRTL ? "flex-row-reverse" : ""}`} style={{ minWidth: "max-content" }}>
            {(Object.entries(TYPE_CONFIG) as [FacilityType, typeof TYPE_CONFIG[FacilityType]][]).map(([type, cfg]) => {
              const active = activeFilters.has(type);
              return (
                <button key={type} onClick={() => toggleFilter(type)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border shadow-sm ${active ? "" : "bg-background border-border text-muted-foreground"}`}
                  style={active ? { background: cfg.lightHex, color: cfg.colorHex, borderColor: cfg.colorHex + "55" } : {}}
                  data-testid={`filter-${type}`}>
                  <span>{cfg.emoji}</span>
                  <span>{ar ? cfg.labelAr : cfg.labelEn}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Navigation HUD */}
      {navRoute && (
        <div className="flex-shrink-0 border-b border-[#a8d4cb]" style={{ background: "linear-gradient(160deg, #d4ede6 0%, #f0faf7 100%)" }}>
          {/* Destination header */}
          <div className="px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-base flex-shrink-0"
                style={{ background: TYPE_CONFIG[navRoute.destination.type].lightHex, border: `2px solid ${TYPE_CONFIG[navRoute.destination.type].colorHex}` }}>
                {TYPE_CONFIG[navRoute.destination.type].emoji}
              </div>
              <div className="min-w-0">
                <div className="font-bold text-[#0E4D41] text-sm truncate">{ar ? navRoute.destination.nameAr : navRoute.destination.nameEn}</div>
                <div className="flex items-center gap-3 text-[11px] text-[#2d7a5f] mt-0.5">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{fmtDist(remainingM, ar)}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{fmtTime(remainingS, ar)}</span>
                </div>
              </div>
            </div>
            <button onClick={stopNav} className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 hover:bg-red-50 transition-colors" style={{ border: "1.5px solid #e05555" }}>
              <X className="w-4 h-4 text-red-500" />
            </button>
          </div>

          {/* Current step */}
          {navRoute.steps[currentStep] && (
            <div className="px-4 pb-3">
              <div className="rounded-2xl px-4 py-3 flex items-center gap-3" style={{ background: "#0E4D41" }}>
                <span className="text-2xl flex-shrink-0">{navRoute.steps[currentStep].icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-bold text-sm leading-tight">
                    {ar ? navRoute.steps[currentStep].textAr : navRoute.steps[currentStep].textEn}
                  </div>
                  {navRoute.steps[currentStep].distanceM > 0 && (
                    <div className="text-green-200 text-[11px] mt-0.5">{fmtDist(navRoute.steps[currentStep].distanceM, ar)}</div>
                  )}
                </div>
                {navRoute.steps[currentStep + 1] && (
                  <div className="flex-shrink-0 text-right">
                    <div className="text-green-200 text-[10px] mb-0.5">{ar ? "بعدها" : "Then"}</div>
                    <span className="text-lg">{navRoute.steps[currentStep + 1].icon}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Steps list toggle */}
          <button
            onClick={() => setStepsOpen(!stepsOpen)}
            className="w-full px-4 py-2 flex items-center justify-between text-[11px] font-bold text-[#0E4D41] border-t border-[#a8d4cb] hover:bg-[#a8d4cb]/20 transition-colors"
          >
            <span className="flex items-center gap-1.5"><Navigation className="w-3 h-3" />{ar ? `${navRoute.steps.length} خطوات التوجيه` : `${navRoute.steps.length} navigation steps`}</span>
            {stepsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {stepsOpen && (
            <div className="max-h-44 overflow-y-auto border-t border-[#a8d4cb]">
              {navRoute.steps.map((step, i) => (
                <div key={i} className={`px-4 py-2.5 flex items-start gap-3 border-b border-[#a8d4cb]/40 text-xs transition-colors ${i === currentStep ? "bg-[#0E4D41]/8" : "bg-transparent"}`}>
                  <span className="text-base flex-shrink-0 mt-0.5">{step.icon}</span>
                  <div className="flex-1">
                    <div className={`font-semibold ${i === currentStep ? "text-[#0E4D41]" : "text-[#2d7a5f]"}`}>{ar ? step.textAr : step.textEn}</div>
                    {step.distanceM > 0 && <div className="text-[#5a9e80] mt-0.5">{fmtDist(step.distanceM, ar)}</div>}
                  </div>
                  {i === currentStep && <div className="w-2 h-2 rounded-full bg-[#0E4D41] flex-shrink-0 mt-1.5" />}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Map */}
      <div className="flex-1" style={{ minHeight: 0 }}>
        {navLoading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
            <div className="bg-white rounded-2xl px-6 py-4 shadow-xl flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-[#0E4D41] border-t-transparent rounded-full animate-spin" />
              <span className="font-bold text-[#0E4D41] text-sm">{ar ? "جاري حساب المسار…" : "Calculating route…"}</span>
            </div>
          </div>
        )}
        <MapContainer center={[fallbackLat, fallbackLng]} zoom={14} style={{ width: "100%", height: "100%" }} zoomControl={false}>
          <TileLayer attribution='© <a href="https://carto.com">CARTO</a>' url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />

          {flyToGps && !navRoute && gpsPos && <FlyToPos lat={gpsPos.lat} lng={gpsPos.lng} />}
          {navRoute && <FitRoute coords={navRoute.coords} />}

          <PilgrimDot lat={myLat} lng={myLng} ar={ar} />

          {navRoute && (
            <>
              <Polyline positions={navRoute.coords} pathOptions={{ color: "#1A5C8A", weight: 5, opacity: 0.9 }} />
              <Polyline positions={navRoute.coords} pathOptions={{ color: "#ffffff", weight: 2, opacity: 0.5, dashArray: "1,10" }} />
              <Marker position={[navRoute.destination.lat, navRoute.destination.lng]} icon={makeDestIcon(navRoute.destination.type)} zIndexOffset={900} />
            </>
          )}

          {!navRoute && visibleFacilities.map(facility => {
            const distM = haversineM(myLat, myLng, facility.lat, facility.lng);
            const distLabel = fmtDist(distM, ar);
            return (
              <Marker key={facility.id} position={[facility.lat, facility.lng]} icon={makeFacilityIcon(facility.type)}>
                <Popup maxWidth={210}>
                  <div style={{ direction: isRTL ? "rtl" : "ltr", fontFamily: "inherit", minWidth: 170 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4, color: TYPE_CONFIG[facility.type].colorHex }}>
                      {TYPE_CONFIG[facility.type].emoji} {ar ? facility.nameAr : facility.nameEn}
                    </div>
                    {(ar ? facility.detailAr : facility.detailEn) && (
                      <div style={{ fontSize: 11, color: "#6B4F35", marginBottom: 4 }}>{ar ? facility.detailAr : facility.detailEn}</div>
                    )}
                    <div style={{ fontSize: 11, color: "#8B6E4E", marginBottom: 10, display: "flex", gap: 10 }}>
                      <span>📍 {distLabel}</span>
                      <span>🕐 {fmtTime(distM / 1.2, ar)}</span>
                    </div>
                    <button
                      onClick={() => handleNavigate(facility)}
                      style={{ display: "block", width: "100%", padding: "7px 12px", background: "#0E4D41", color: "#fff", borderRadius: 10, fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer" }}
                    >
                      🗺️ {ar ? "وجّهني الآن" : "Navigate Now"}
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}

        </MapContainer>
      </div>
    </div>
  );
}
