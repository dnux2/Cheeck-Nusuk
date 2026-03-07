import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useLanguage } from "@/contexts/language-context";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { type Pilgrim } from "@shared/schema";

// Fix Leaflet default icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

type FacilityType = "hospital" | "water" | "mosque" | "bathroom" | "transport";

interface Facility {
  id: string;
  type: FacilityType;
  nameAr: string;
  nameEn: string;
  lat: number;
  lng: number;
  detailAr?: string;
  detailEn?: string;
}

const FACILITIES: Facility[] = [
  // Hospitals
  { id: "h1", type: "hospital", nameAr: "مستشفى الملك عبدالله",    nameEn: "King Abdullah Medical",    lat: 21.4180, lng: 39.8220, detailAr: "طوارئ ٢٤ ساعة",          detailEn: "24h Emergency" },
  { id: "h2", type: "hospital", nameAr: "مستشفى أجياد الطوارئ",    nameEn: "Ajyad Emergency Hospital", lat: 21.4195, lng: 39.8295, detailAr: "الحرم المكي",             detailEn: "Near Grand Mosque" },
  { id: "h3", type: "hospital", nameAr: "مستشفى النور التخصصي",    nameEn: "Al-Nour Specialist",       lat: 21.3990, lng: 39.8580, detailAr: "أمراض الحج",             detailEn: "Hajj Diseases" },
  { id: "h4", type: "hospital", nameAr: "مركز صحة منى",            nameEn: "Mina Health Center",       lat: 21.4120, lng: 39.8960, detailAr: "خدمات طبية شاملة",       detailEn: "Full medical services" },
  { id: "h5", type: "hospital", nameAr: "إسعاف مزدلفة",            nameEn: "Muzdalifah First Aid",     lat: 21.3820, lng: 39.9320, detailAr: "إسعاف ميداني",           detailEn: "Field first aid" },
  // Water
  { id: "w1", type: "water", nameAr: "زمزم — المسجد الحرام",       nameEn: "Zamzam — Grand Mosque",    lat: 21.4225, lng: 39.8262, detailAr: "أصل بئر زمزم المباركة", detailEn: "Source of Zamzam well" },
  { id: "w2", type: "water", nameAr: "محطة مياه منى ١",            nameEn: "Mina Water Station 1",     lat: 21.4140, lng: 39.8890, detailAr: "مياه معبأة مجاناً",       detailEn: "Free bottled water" },
  { id: "w3", type: "water", nameAr: "محطة مياه منى ٢",            nameEn: "Mina Water Station 2",     lat: 21.4100, lng: 39.8950, detailAr: "مياه معبأة مجاناً",       detailEn: "Free bottled water" },
  { id: "w4", type: "water", nameAr: "محطة مياه عرفات",            nameEn: "Arafat Water Station",     lat: 21.3550, lng: 39.9810, detailAr: "مياه زمزم وعادية",       detailEn: "Zamzam & regular water" },
  { id: "w5", type: "water", nameAr: "محطة مياه مزدلفة",           nameEn: "Muzdalifah Water",         lat: 21.3820, lng: 39.9340, detailAr: "مياه متاحة الليل",       detailEn: "Available all night" },
  { id: "w6", type: "water", nameAr: "نقطة مياه الجمرات",          nameEn: "Jamarat Water Point",      lat: 21.4050, lng: 39.8730, detailAr: "قريبة من رمي الجمار",    detailEn: "Near Jamarat area" },
  // Mosques
  { id: "m1", type: "mosque", nameAr: "المسجد الحرام",             nameEn: "Grand Mosque",             lat: 21.4225, lng: 39.8262, detailAr: "قبلة المسلمين",          detailEn: "Muslim Qibla" },
  { id: "m2", type: "mosque", nameAr: "مسجد نمرة — عرفات",         nameEn: "Nimrah Mosque — Arafat",   lat: 21.3549, lng: 39.9850, detailAr: "خطبة عرفة والظهر",       detailEn: "Arafat sermon & Dhuhr" },
  { id: "m3", type: "mosque", nameAr: "مسجد الخيف — منى",          nameEn: "Al-Khayf Mosque — Mina",   lat: 21.4115, lng: 39.8920, detailAr: "صلاة أيام التشريق",      detailEn: "Tashreeq days prayers" },
  { id: "m4", type: "mosque", nameAr: "مسجد المشعر — مزدلفة",      nameEn: "Mash'ar Mosque",           lat: 21.3820, lng: 39.9330, detailAr: "الوقوف بالمشعر الحرام", detailEn: "Standing at Mash'ar" },
  // Bathrooms
  { id: "b1", type: "bathroom", nameAr: "دورات مياه — شمال الحرم", nameEn: "Restrooms — North Haram",  lat: 21.4240, lng: 39.8255, detailAr: "نظيفة ومتاحة ٢٤ ساعة", detailEn: "Clean, 24h available" },
  { id: "b2", type: "bathroom", nameAr: "مرافق منى — المخيم أ",    nameEn: "Mina Facilities — Camp A", lat: 21.4130, lng: 39.8900, detailAr: "مع حمامات سباحة",        detailEn: "With shower facilities" },
  { id: "b3", type: "bathroom", nameAr: "مرافق منى — المخيم ب",    nameEn: "Mina Facilities — Camp B", lat: 21.4090, lng: 39.8970, detailAr: "مع حمامات سباحة",        detailEn: "With shower facilities" },
  { id: "b4", type: "bathroom", nameAr: "مرافق منطقة الجمرات",     nameEn: "Jamarat Restrooms",        lat: 21.4055, lng: 39.8720, detailAr: "قريبة من الجمرات",       detailEn: "Near Jamarat" },
  { id: "b5", type: "bathroom", nameAr: "مرافق سهل عرفات",         nameEn: "Arafat Plain Restrooms",   lat: 21.3580, lng: 39.9840, detailAr: "موزعة على السهل",        detailEn: "Spread across plain" },
  // Transport
  { id: "t1", type: "transport", nameAr: "موقف حافلات الحرم",      nameEn: "Grand Mosque Bus Stop",    lat: 21.4200, lng: 39.8240, detailAr: "خطوط منى وعرفات",       detailEn: "Lines to Mina & Arafat" },
  { id: "t2", type: "transport", nameAr: "محطة قطار الحرمين — منى", nameEn: "Haramain Train — Mina",    lat: 21.4080, lng: 39.8890, detailAr: "قطار سريع للحجاج",      detailEn: "Fast Hajj train" },
  { id: "t3", type: "transport", nameAr: "محطة حافلات عرفات",      nameEn: "Arafat Bus Terminal",      lat: 21.3540, lng: 39.9830, detailAr: "العودة لمزدلفة ومنى",   detailEn: "Return to Muzdalifah & Mina" },
  { id: "t4", type: "transport", nameAr: "موقف مزدلفة الليلي",     nameEn: "Muzdalifah Night Stop",    lat: 21.3800, lng: 39.9310, detailAr: "نقل ليلي لمنى",         detailEn: "Night transport to Mina" },
];

const TYPE_CONFIG: Record<FacilityType, { colorHex: string; emoji: string; labelAr: string; labelEn: string }> = {
  hospital:  { colorHex: "#EF4444", emoji: "🏥", labelAr: "المستشفيات",   labelEn: "Hospitals" },
  water:     { colorHex: "#3B82F6", emoji: "💧", labelAr: "نقاط المياه",  labelEn: "Water Points" },
  mosque:    { colorHex: "#10B981", emoji: "🕌", labelAr: "المساجد",      labelEn: "Mosques" },
  bathroom:  { colorHex: "#8B5CF6", emoji: "🚻", labelAr: "دورات المياه", labelEn: "Restrooms" },
  transport: { colorHex: "#F59E0B", emoji: "🚌", labelAr: "النقل",        labelEn: "Transport" },
};

function makeFacilityIcon(type: FacilityType) {
  const cfg = TYPE_CONFIG[type];
  return L.divIcon({
    html: `<div style="width:32px;height:32px;background:${cfg.colorHex};border-radius:50%;border:2px solid white;display:flex;align-items:center;justify-content:center;font-size:14px;box-shadow:0 2px 6px rgba(0,0,0,0.3)">${cfg.emoji}</div>`,
    className: "",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
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
  const map = useMap();
  useEffect(() => { map.setView([lat, lng], map.getZoom()); }, [lat, lng]);
  return (
    <Marker position={[lat, lng]} icon={makePilgrimIcon()} zIndexOffset={1000}>
      <Popup maxWidth={180}>
        <div style={{ textAlign: "center", fontFamily: "inherit", padding: "4px 0" }}>
          <div style={{ fontSize: 20, marginBottom: 4 }}>📍</div>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#0E4D41" }}>
            {ar ? "أنت هنا" : "You are here"}
          </div>
          <div style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>
            {ar ? "موقعك الحالي" : "Your current location"}
          </div>
        </div>
      </Popup>
    </Marker>
  );
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function PilgrimGuideMap() {
  const { lang, isRTL } = useLanguage();
  const { toast } = useToast();
  const ar = lang === "ar";

  const { data: pilgrim } = useQuery<Pilgrim>({ queryKey: ["/api/pilgrims/1"] });
  const pilgrimLat = pilgrim?.locationLat ?? 21.4225;
  const pilgrimLng = pilgrim?.locationLng ?? 39.8262;

  const [activeFilters, setActiveFilters] = useState<Set<FacilityType>>(new Set(["hospital", "water", "mosque", "bathroom", "transport"]));
  const [routeLine, setRouteLine] = useState<[number, number][] | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ name: string; km: number } | null>(null);

  const toggleFilter = (type: FacilityType) => {
    setActiveFilters(prev => {
      const next = new Set(prev);
      if (next.has(type)) { next.delete(type); } else { next.add(type); }
      return next;
    });
  };

  const handleNavigate = (facility: Facility) => {
    const km = haversineKm(pilgrimLat, pilgrimLng, facility.lat, facility.lng);
    const mins = Math.round((km / 5) * 60);
    setRouteLine([[pilgrimLat, pilgrimLng], [facility.lat, facility.lng]]);
    setRouteInfo({ name: ar ? facility.nameAr : facility.nameEn, km });
    toast({
      title: ar ? `🗺️ توجيه إلى: ${facility.nameAr}` : `🗺️ Navigating to: ${facility.nameEn}`,
      description: ar
        ? `المسافة: ${km < 1 ? `${Math.round(km * 1000)} م` : `${km.toFixed(1)} كم`} · حوالي ${mins} دقيقة سيراً`
        : `Distance: ${km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`} · ~${mins} min walk`,
    });
  };

  const visibleFacilities = FACILITIES.filter(f => activeFilters.has(f.type));

  return (
    <div className="flex flex-col h-full" style={{ direction: isRTL ? "rtl" : "ltr" }}>

      {/* Filter bar */}
      <div className="px-4 py-3 bg-card border-b border-border overflow-x-auto">
        <div className={`flex gap-2 ${isRTL ? "flex-row-reverse" : ""}`} style={{ minWidth: "max-content" }}>
          {(Object.entries(TYPE_CONFIG) as [FacilityType, typeof TYPE_CONFIG[FacilityType]][]).map(([type, cfg]) => {
            const active = activeFilters.has(type);
            return (
              <button
                key={type}
                onClick={() => toggleFilter(type)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${active ? "text-white border-transparent shadow-sm" : "bg-background border-border text-muted-foreground"}`}
                style={active ? { background: cfg.colorHex } : {}}
                data-testid={`filter-${type}`}
              >
                <span>{cfg.emoji}</span>
                <span>{ar ? cfg.labelAr : cfg.labelEn}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Route info banner */}
      {routeInfo && (
        <div className={`px-4 py-2 bg-primary text-primary-foreground text-xs flex items-center justify-between ${isRTL ? "flex-row-reverse" : ""}`}>
          <span className="font-bold">{ar ? `المسار إلى: ${routeInfo.name}` : `Route to: ${routeInfo.name}`}</span>
          <div className={`flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
            <span>{routeInfo.km < 1 ? `${Math.round(routeInfo.km * 1000)} م` : `${routeInfo.km.toFixed(1)} كم`}</span>
            <button onClick={() => { setRouteLine(null); setRouteInfo(null); }} className="text-primary-foreground/70 hover:text-primary-foreground text-base leading-none">✕</button>
          </div>
        </div>
      )}

      {/* Map */}
      <div className="flex-1" style={{ minHeight: 0 }}>
        <MapContainer
          center={[pilgrimLat, pilgrimLng]}
          zoom={14}
          style={{ width: "100%", height: "100%" }}
          zoomControl={false}
        >
          <TileLayer
            attribution='© <a href="https://carto.com">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />

          {/* Pilgrim location — pulsing dot */}
          <PilgrimDot lat={pilgrimLat} lng={pilgrimLng} ar={ar} />

          {/* Route line */}
          {routeLine && (
            <Polyline
              positions={routeLine}
              pathOptions={{ color: "#0E4D41", weight: 4, dashArray: "8,6", opacity: 0.85 }}
            />
          )}

          {/* Facility markers */}
          {visibleFacilities.map(facility => {
            const km = haversineKm(pilgrimLat, pilgrimLng, facility.lat, facility.lng);
            const distLabel = km < 1 ? `${Math.round(km * 1000)} م` : `${km.toFixed(1)} كم`;
            return (
              <Marker
                key={facility.id}
                position={[facility.lat, facility.lng]}
                icon={makeFacilityIcon(facility.type)}
              >
                <Popup maxWidth={200}>
                  <div style={{ direction: isRTL ? "rtl" : "ltr", fontFamily: "inherit", minWidth: 160 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4, color: TYPE_CONFIG[facility.type].colorHex }}>
                      {TYPE_CONFIG[facility.type].emoji} {ar ? facility.nameAr : facility.nameEn}
                    </div>
                    {(ar ? facility.detailAr : facility.detailEn) && (
                      <div style={{ fontSize: 11, color: "#6B4F35", marginBottom: 6 }}>
                        {ar ? facility.detailAr : facility.detailEn}
                      </div>
                    )}
                    <div style={{ fontSize: 11, color: "#8B6E4E", marginBottom: 8 }}>
                      📍 {ar ? `المسافة: ${distLabel}` : `Distance: ${distLabel}`}
                    </div>
                    <button
                      onClick={() => handleNavigate(facility)}
                      style={{
                        display: "block", width: "100%", padding: "6px 12px",
                        background: "#0E4D41", color: "#fff", borderRadius: 8,
                        fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer",
                      }}
                    >
                      {ar ? "🗺️ توجيهني" : "🗺️ Navigate"}
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
