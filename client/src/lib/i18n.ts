export type Language = "en" | "ar";

export const translations = {
  en: {
    // Nav
    home: "Home",
    dashboard: "Dashboard",
    pilgrims: "Pilgrims",
    crowdMonitoring: "Crowd Monitoring",
    securityAI: "Security & AI",
    emergency: "Emergency",
    alerts: "Alerts",
    unauthorized: "Unauthorized",
    services: "Pilgrim Services",
    translator: "AI Translator",
    settings: "Settings",
    controlCenter: "Control Center",

    // Header
    adminSupervisor: "Admin Supervisor",
    sector: "Sector 4",

    // Pilgrim page
    pilgrimRegistry: "Pilgrim Registry",
    manageAndTrack: "Manage and track registered pilgrims.",
    registerPilgrim: "Register Pilgrim",
    searchPlaceholder: "Search by name, passport, or campaign...",
    allStatus: "All Status",
    validPermit: "Valid Permit",
    expiredPermit: "Expired Permit",
    name: "Name",
    nationality: "Nationality",
    passport: "Passport",
    permitStatus: "Permit Status",
    location: "Location",
    actions: "Actions",
    loading: "Loading...",
    noPilgrimsFound: "No pilgrims found.",
    campaign: "Campaign",
    phone: "Phone",
    healthStatus: "Health Status",
    emergencyContact: "Emergency Contact",
    lastUpdated: "Last Updated",
    currentLocation: "Current Location",
    unknown: "Unknown",

    // Pilgrim Profile Popup
    pilgrimProfile: "Pilgrim Information",
    pilgrimInformation: "معلومات الحاج",
    trackRoute: "Track Route",
    sendMessage: "Send Message",
    close: "Close",
    profileImageAlt: "Pilgrim Profile",
    valid: "Valid",
    expired: "Expired",
    none: "None",
    stable: "Stable",
    critical: "Critical",
    unknown_status: "Unknown",

    // Dashboard
    totalPilgrims: "Total Pilgrims",
    activeAlerts: "Active Alerts",
    emergencies: "Emergencies",
    registeredToday: "Registered Today",

    // Emergency
    panicButton: "Send Emergency Alert",
    panicButtonDesc: "Press if you or a pilgrim requires immediate assistance.",
    activeEmergencies: "Active Emergencies",
    noEmergencies: "No active emergencies.",

    // Translator
    aiTranslator: "AI Translator",
    sourceText: "Enter text to translate",
    translatedText: "Translated Text",
    translate: "Translate",
    selectLanguage: "Select Target Language",
    translating: "Translating...",
    translationResult: "Translation Result",

    // Dashboard
    overviewTitle: "Overview",
    systemStatus: "System status across all sectors.",
    allSystemsNominal: "All Systems Nominal",
    totalPilgrimsTracked: "Total Pilgrims Tracked",
    activeEmergenciesCard: "Active Emergencies",
    securityAlerts: "Security Alerts",
    avgCrowdDensity: "Avg Crowd Density",
    liveSectorMap: "Live Sector Map",
    crowdDensityTrend: "Crowd Density Trend",
    recentAlerts: "Recent Alerts",
    justNow: "Just now",
    crowdManagementDesc: "Live density heatmap and predictive routing.",
    sectorStatus: "Sector Status",
    executeRedirection: "Execute Redirection",
    congestionWarning: "Congestion Warning",
    congestionDesc: "Sector 4 (Jamarat Bridge) is approaching 85% capacity. Predictive AI suggests redirecting Group A to Sector 5.",
    layers: "Layers",
  },
  ar: {
    // Nav
    home: "الرئيسية",
    dashboard: "لوحة التحكم",
    pilgrims: "الحجاج",
    crowdMonitoring: "مراقبة الحشود",
    securityAI: "الأمن والذكاء الاصطناعي",
    emergency: "الطوارئ",
    alerts: "التنبيهات",
    unauthorized: "غير مصرح",
    services: "خدمات الحجاج",
    translator: "المترجم الذكي",
    settings: "الإعدادات",
    controlCenter: "مركز التحكم",

    // Header
    adminSupervisor: "المشرف العام",
    sector: "القطاع 4",

    // Pilgrim page
    pilgrimRegistry: "سجل الحجاج",
    manageAndTrack: "إدارة وتتبع الحجاج المسجلين.",
    registerPilgrim: "تسجيل حاج",
    searchPlaceholder: "بحث بالاسم أو جواز السفر أو الحملة...",
    allStatus: "جميع الحالات",
    validPermit: "تصريح ساري",
    expiredPermit: "تصريح منتهي",
    name: "الاسم",
    nationality: "الجنسية",
    passport: "جواز السفر",
    permitStatus: "حالة التصريح",
    location: "الموقع",
    actions: "الإجراءات",
    loading: "جارٍ التحميل...",
    noPilgrimsFound: "لم يتم العثور على حجاج.",
    campaign: "الحملة",
    phone: "الهاتف",
    healthStatus: "الحالة الصحية",
    emergencyContact: "جهة الاتصال في الطوارئ",
    lastUpdated: "آخر تحديث",
    currentLocation: "الموقع الحالي",
    unknown: "غير معروف",

    // Pilgrim Profile Popup
    pilgrimProfile: "معلومات الحاج",
    pilgrimInformation: "Pilgrim Information",
    trackRoute: "تتبع المسار",
    sendMessage: "إرسال رسالة",
    close: "إغلاق",
    profileImageAlt: "صورة الحاج",
    valid: "ساري",
    expired: "منتهي",
    none: "لا يوجد",
    stable: "مستقر",
    critical: "حرج",
    unknown_status: "غير معروف",

    // Dashboard
    totalPilgrims: "إجمالي الحجاج",
    activeAlerts: "التنبيهات النشطة",
    emergencies: "حالات الطوارئ",
    registeredToday: "مسجل اليوم",

    // Emergency
    panicButton: "إرسال تنبيه طارئ",
    panicButtonDesc: "اضغط إذا كنت أو أحد الحجاج بحاجة لمساعدة فورية.",
    activeEmergencies: "حالات الطوارئ النشطة",
    noEmergencies: "لا توجد حالات طوارئ نشطة.",

    // Translator
    aiTranslator: "المترجم الذكي",
    sourceText: "أدخل النص للترجمة",
    translatedText: "النص المترجم",
    translate: "ترجمة",
    selectLanguage: "اختر اللغة المستهدفة",
    translating: "جارٍ الترجمة...",
    translationResult: "نتيجة الترجمة",

    // Dashboard
    overviewTitle: "نظرة عامة",
    systemStatus: "حالة النظام عبر جميع القطاعات.",
    allSystemsNominal: "جميع الأنظمة تعمل بشكل طبيعي",
    totalPilgrimsTracked: "إجمالي الحجاج المتتبعين",
    activeEmergenciesCard: "حالات الطوارئ النشطة",
    securityAlerts: "تنبيهات الأمن",
    avgCrowdDensity: "متوسط كثافة الحشود",
    liveSectorMap: "خريطة المشاعر المباشرة",
    crowdDensityTrend: "منحنى كثافة الحشود",
    recentAlerts: "آخر التنبيهات",
    justNow: "الآن",
    crowdManagementDesc: "خريطة حرارية مباشرة وتحسين المسارات.",
    sectorStatus: "حالة المناطق",
    executeRedirection: "تنفيذ إعادة التوجيه",
    congestionWarning: "تحذير من الازدحام",
    congestionDesc: "القطاع 4 (جسر الجمرات) يقترب من 85% من طاقته. يقترح الذكاء الاصطناعي إعادة توجيه المجموعة أ إلى القطاع 5.",
    layers: "الطبقات",
  },
};

export type TranslationKey = keyof typeof translations.en;

export function t(lang: Language, key: TranslationKey): string {
  return translations[lang][key] ?? translations.en[key] ?? key;
}
