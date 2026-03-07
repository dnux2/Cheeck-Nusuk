import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, Save, CheckCircle2, Star, Lock, Clock,
  Camera, Image, Tag, X, Trash2, ZoomIn, ChevronLeft, ChevronRight, Plus,
  RefreshCcw, AlertCircle, SwitchCamera
} from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { type HajjNote, type PilgrimPhoto } from "@shared/schema";
import { PilgrimLayout } from "@/components/pilgrim-layout";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

const STAGES = [
  { key: "tarwiyah", dayAr: "اليوم الثامن — يوم التروية", dayEn: "Day 8 — Tarwiyah", ritualAr: "الإحرام من مكة والتوجه إلى منى — المبيت ليلة عرفات", ritualEn: "Enter Ihram in Makkah and travel to Mina — stay overnight before Arafat", icon: "🕋", done: true },
  { key: "arafat", dayAr: "اليوم التاسع — يوم عرفات", dayEn: "Day 9 — Day of Arafat", ritualAr: "الوقوف بعرفة من الزوال حتى الغروب — الدعاء والذكر والتضرع", ritualEn: "Stand at Arafat from midday to sunset — supplication, dhikr, and devotion", icon: "🌄", done: true },
  { key: "muzdalifah", dayAr: "ليلة العاشر — مزدلفة", dayEn: "Night 10 — Muzdalifah", ritualAr: "المبيت في مزدلفة وجمع حصى الجمرات — صلاة الفجر ثم التوجه لمنى", ritualEn: "Stay at Muzdalifah, collect pebbles — Fajr then head to Mina", icon: "🌙", current: true },
  { key: "eid", dayAr: "اليوم العاشر — يوم النحر", dayEn: "Day 10 — Eid al-Adha", ritualAr: "رمي جمرة العقبة، ذبح الهدي، الحلق أو التقصير، طواف الإفاضة، سعي الحج", ritualEn: "Jamarat, sacrifice, shaving, Tawaf al-Ifada, Hajj Sa'i", icon: "🐑" },
  { key: "tashreeq_11", dayAr: "اليوم الحادي عشر — أيام التشريق", dayEn: "Day 11 — Tashreeq", ritualAr: "المبيت في منى، رمي الجمرات الثلاثة بعد الزوال", ritualEn: "Stay in Mina, stone all three Jamarat after midday", icon: "⛏️" },
  { key: "tashreeq_12", dayAr: "اليوم الثاني عشر — التشريق", dayEn: "Day 12 — Tashreeq", ritualAr: "رمي الجمرات الثلاثة — إمكانية النفر الأول قبل الغروب", ritualEn: "Stone all three Jamarat — option for early departure before sunset", icon: "⛏️" },
  { key: "farewell", dayAr: "طواف الوداع", dayEn: "Farewell Tawaf", ritualAr: "طواف الوداع قبل مغادرة مكة المكرمة — آخر شعائر الحج", ritualEn: "Farewell Tawaf before leaving Makkah — final rite of Hajj", icon: "🤍" },
];

function compressDataUrl(dataUrl: string, maxKB = 350): Promise<string> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let { width, height } = img;
      const maxDim = 1200;
      if (width > maxDim || height > maxDim) {
        if (width > height) { height = Math.round((height * maxDim) / width); width = maxDim; }
        else { width = Math.round((width * maxDim) / height); height = maxDim; }
      }
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
      let quality = 0.85;
      const tryCompress = () => {
        const out = canvas.toDataURL("image/jpeg", quality);
        const kb = Math.round((out.length * 3) / 4 / 1024);
        if (kb > maxKB && quality > 0.2) { quality -= 0.1; tryCompress(); }
        else resolve(out);
      };
      tryCompress();
    };
    img.src = dataUrl;
  });
}

function compressImage(file: File, maxKB = 350): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      compressDataUrl(e.target!.result as string, maxKB).then(resolve).catch(reject);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function PilgrimHajjNotesPage() {
  const { lang, isRTL } = useLanguage();
  const { toast } = useToast();
  const ar = lang === "ar";

  const [draftNotes, setDraftNotes] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<{ photos: PilgrimPhoto[]; index: number } | null>(null);
  const [addPhotoStage, setAddPhotoStage] = useState<string | null>(null);
  const [pendingPhoto, setPendingPhoto] = useState<{ dataUrl: string; caption: string; tags: string[]; tagInput: string } | null>(null);

  // Camera states
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<"environment" | "user">("environment");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const pilgrimId = Number(localStorage.getItem("pilgrimId") || "1");

  const { data: notes = [] } = useQuery<HajjNote[]>({
    queryKey: ["/api/pilgrims", pilgrimId, "hajj-notes"],
    queryFn: () => fetch(`/api/pilgrims/${pilgrimId}/hajj-notes`).then(r => r.json()),
  });

  const { data: allPhotos = [] } = useQuery<PilgrimPhoto[]>({
    queryKey: ["/api/pilgrims", pilgrimId, "photos"],
    queryFn: () => fetch(`/api/pilgrims/${pilgrimId}/photos`).then(r => r.json()),
  });

  const photosByStage = (key: string) => allPhotos.filter(p => p.stageKey === key);

  const noteMap: Record<string, string> = {};
  notes.forEach(n => { noteMap[n.stageKey] = n.note; });

  // ── Camera helpers ──────────────────────────────────────────────────────────

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }, []);

  const startCamera = useCallback(async (facing: "environment" | "user") => {
    stopStream();
    setCameraReady(false);
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => setCameraReady(true);
      }
    } catch (err: any) {
      const msg = err?.name === "NotAllowedError"
        ? (ar ? "تم رفض إذن الكاميرا. يرجى السماح بالوصول من إعدادات المتصفح." : "Camera permission denied. Please allow access in browser settings.")
        : (ar ? "تعذّر الوصول إلى الكاميرا." : "Could not access camera.");
      setCameraError(msg);
    }
  }, [stopStream, ar]);

  const openCamera = useCallback((stageKey: string) => {
    setAddPhotoStage(stageKey);
    setPendingPhoto(null);
    setCameraOpen(true);
    setCameraFacing("environment");
    startCamera("environment");
  }, [startCamera]);

  const closeCamera = useCallback(() => {
    stopStream();
    setCameraOpen(false);
    setCameraReady(false);
    setCameraError(null);
  }, [stopStream]);

  const flipCamera = useCallback(() => {
    const next = cameraFacing === "environment" ? "user" : "environment";
    setCameraFacing(next);
    startCamera(next);
  }, [cameraFacing, startCamera]);

  const capturePhoto = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !cameraReady) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")!.drawImage(video, 0, 0);
    const rawDataUrl = canvas.toDataURL("image/jpeg", 0.95);
    closeCamera();
    const compressed = await compressDataUrl(rawDataUrl);
    setPendingPhoto({ dataUrl: compressed, caption: "", tags: [], tagInput: "" });
  }, [cameraReady, closeCamera]);

  // ── Mutations ───────────────────────────────────────────────────────────────

  const saveNote = useMutation({
    mutationFn: ({ stageKey, note }: { stageKey: string; note: string }) =>
      apiRequest("PATCH", `/api/pilgrims/${pilgrimId}/hajj-notes/${stageKey}`, { note }),
    onMutate: ({ stageKey }) => setSaving(stageKey),
    onSuccess: (_, { stageKey }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/pilgrims", pilgrimId, "hajj-notes"] });
      setDraftNotes(prev => { const n = { ...prev }; delete n[stageKey]; return n; });
      setSaving(null);
      toast({ title: ar ? "✓ تم الحفظ" : "✓ Saved" });
    },
    onError: () => { setSaving(null); toast({ title: ar ? "خطأ" : "Error", variant: "destructive" }); },
  });

  const savePhoto = useMutation({
    mutationFn: ({ stageKey, photoData, caption, tags }: { stageKey: string; photoData: string; caption: string; tags: string[] }) =>
      apiRequest("POST", `/api/pilgrims/${pilgrimId}/photos`, { stageKey, photoData, caption, tags }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pilgrims", pilgrimId, "photos"] });
      setPendingPhoto(null);
      setAddPhotoStage(null);
      toast({ title: ar ? "✓ تم حفظ الصورة" : "✓ Photo saved" });
    },
    onError: () => { toast({ title: ar ? "فشل الحفظ" : "Save failed", variant: "destructive" }); },
  });

  const deletePhoto = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/photos/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/pilgrims", pilgrimId, "photos"] }); setLightbox(null); },
  });

  // ── File picker ─────────────────────────────────────────────────────────────

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImage(file);
      setPendingPhoto({ dataUrl, caption: "", tags: [], tagInput: "" });
    } catch {
      toast({ title: ar ? "فشل تحميل الصورة" : "Failed to load image", variant: "destructive" });
    }
    e.target.value = "";
  };

  const openGallery = (stageKey: string) => {
    setAddPhotoStage(stageKey);
    setPendingPhoto(null);
    fileInputRef.current?.click();
  };

  // ── Tags ────────────────────────────────────────────────────────────────────

  const addTag = () => {
    if (!pendingPhoto) return;
    const tag = pendingPhoto.tagInput.trim().replace(/^#/, "");
    if (!tag || pendingPhoto.tags.includes(tag)) { setPendingPhoto(p => p ? { ...p, tagInput: "" } : p); return; }
    setPendingPhoto(p => p ? { ...p, tags: [...p.tags, tag], tagInput: "" } : p);
  };

  const removeTag = (tag: string) => {
    setPendingPhoto(p => p ? { ...p, tags: p.tags.filter(t => t !== tag) } : p);
  };

  const handleSavePhoto = () => {
    if (!pendingPhoto || !addPhotoStage) return;
    savePhoto.mutate({ stageKey: addPhotoStage, photoData: pendingPhoto.dataUrl, caption: pendingPhoto.caption, tags: pendingPhoto.tags });
  };

  // ── Derived ─────────────────────────────────────────────────────────────────

  const getDraftOrSaved = (key: string) => draftNotes[key] !== undefined ? draftNotes[key] : (noteMap[key] ?? "");
  const hasUnsaved = (key: string) => draftNotes[key] !== undefined && draftNotes[key] !== (noteMap[key] ?? "");

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <PilgrimLayout>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5" dir={isRTL ? "rtl" : "ltr"}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className={`flex items-center gap-3 mb-1 ${isRTL ? "flex-row-reverse" : ""}`}>
            <div className="w-10 h-10 rounded-2xl bg-secondary flex items-center justify-center text-primary">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className={isRTL ? "text-right" : ""}>
              <h1 className="text-xl font-bold text-foreground">{ar ? "يوميات الحج" : "My Hajj Journal"}</h1>
              <p className="text-xs text-muted-foreground">{ar ? "سجّل ذكرياتك ومشاعرك وصورك في كل مرحلة" : "Record your memories, thoughts and photos at each stage"}</p>
            </div>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4 mt-4">
            <div className={`flex items-center justify-between mb-2 ${isRTL ? "flex-row-reverse" : ""}`}>
              <span className="text-xs text-muted-foreground">{ar ? "المراحل المسجّلة" : "Stages recorded"}</span>
              <div className={`flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
                <span className="text-xs font-bold text-primary">{notes.length} / {STAGES.length} {ar ? "ملاحظة" : "notes"}</span>
                <span className="text-xs font-bold text-accent">{allPhotos.length} {ar ? "صورة" : "photos"}</span>
              </div>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${(notes.length / STAGES.length) * 100}%` }} />
            </div>
          </div>
        </motion.div>

        {/* Stage cards */}
        {STAGES.map((stage, i) => {
          const saved = noteMap[stage.key];
          const draft = getDraftOrSaved(stage.key);
          const unsaved = hasUnsaved(stage.key);
          const isSavingThis = saving === stage.key;
          const isPast = stage.done;
          const isCurrent = stage.current;
          const stagePhotos = photosByStage(stage.key);

          return (
            <motion.div
              key={stage.key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className={`bg-card border rounded-3xl overflow-hidden transition-all duration-300
                ${isCurrent ? "border-accent/60 shadow-md" : isPast ? "border-primary/20" : "border-border opacity-80"}`}
            >
              {/* Stage header */}
              <div className={`px-5 pt-4 pb-3 flex items-start gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0
                  ${isCurrent ? "bg-accent/10" : isPast ? "bg-secondary" : "bg-muted"}`}>
                  {isPast ? <CheckCircle2 className="w-5 h-5 text-primary" /> : isCurrent ? <Star className="w-5 h-5 text-accent" fill="currentColor" /> : <Clock className="w-5 h-5 text-muted-foreground/50" />}
                </div>
                <div className={`flex-1 ${isRTL ? "text-right" : ""}`}>
                  <div className={`flex items-center gap-2 flex-wrap ${isRTL ? "flex-row-reverse" : ""}`}>
                    <span className="font-bold text-sm text-foreground">{ar ? stage.dayAr : stage.dayEn}</span>
                    {isCurrent && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">{ar ? "الشعيرة الحالية" : "Current"}</span>}
                    {!isPast && !isCurrent && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground flex items-center gap-1"><Lock className="w-2.5 h-2.5" /> {ar ? "قادم" : "Upcoming"}</span>}
                    {stagePhotos.length > 0 && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary flex items-center gap-1 ${isRTL ? "flex-row-reverse" : ""}`}>
                        <Image className="w-2.5 h-2.5" /> {stagePhotos.length}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{ar ? stage.ritualAr : stage.ritualEn}</p>
                </div>
              </div>

              {/* Note area */}
              <div className="px-5 pb-4">
                <div className={`text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1 ${isRTL ? "flex-row-reverse" : ""}`}>
                  <BookOpen className="w-3 h-3" />
                  {ar ? "ملاحظاتي" : "My notes"}{saved && <span className="text-primary ms-1">•</span>}
                </div>
                <Textarea
                  value={draft}
                  onChange={(e) => setDraftNotes(prev => ({ ...prev, [stage.key]: e.target.value }))}
                  placeholder={ar ? "سجّل أفكارك وذكرياتك…" : "Write your thoughts…"}
                  className="min-h-[72px] resize-none text-sm bg-background border-border rounded-2xl focus:border-primary/50 transition-colors"
                  dir={isRTL ? "rtl" : "ltr"}
                  data-testid={`textarea-note-${stage.key}`}
                />
                <div className={`mt-2 flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
                  {unsaved && (
                    <Button size="sm" onClick={() => saveNote.mutate({ stageKey: stage.key, note: draft })} disabled={isSavingThis} className="rounded-full px-4 h-7 text-xs" data-testid={`btn-save-note-${stage.key}`}>
                      <Save className="w-3 h-3 me-1" />
                      {isSavingThis ? (ar ? "جاري الحفظ…" : "Saving…") : (ar ? "حفظ" : "Save")}
                    </Button>
                  )}
                  {saved && !unsaved && (
                    <span className={`text-[10px] text-primary flex items-center gap-1 ${isRTL ? "flex-row-reverse" : ""}`}>
                      <CheckCircle2 className="w-3 h-3" />
                      {ar ? "تم الحفظ" : "Saved"}
                    </span>
                  )}
                </div>
              </div>

              {/* Photos section */}
              <div className="px-5 pb-5">
                <div className={`flex items-center justify-between mb-2.5 ${isRTL ? "flex-row-reverse" : ""}`}>
                  <div className={`text-xs font-semibold text-muted-foreground flex items-center gap-1.5 ${isRTL ? "flex-row-reverse" : ""}`}>
                    <Camera className="w-3 h-3" />
                    {ar ? "الصور" : "Photos"}
                    {stagePhotos.length > 0 && <span className="px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">{stagePhotos.length}</span>}
                  </div>
                  {/* Add photo buttons */}
                  <div className={`flex items-center gap-1.5 ${isRTL ? "flex-row-reverse" : ""}`}>
                    <button
                      data-testid={`button-camera-${stage.key}`}
                      onClick={() => openCamera(stage.key)}
                      title={ar ? "التقاط صورة بالكاميرا" : "Take photo with camera"}
                      className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary/80 px-2.5 py-1.5 rounded-xl hover:bg-primary/10 transition-all"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      {ar ? "كاميرا" : "Camera"}
                    </button>
                    <button
                      data-testid={`button-gallery-${stage.key}`}
                      onClick={() => openGallery(stage.key)}
                      title={ar ? "اختيار من المعرض" : "Choose from gallery"}
                      className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded-xl hover:bg-secondary transition-all"
                    >
                      <Image className="w-3.5 h-3.5" />
                      {ar ? "معرض" : "Gallery"}
                    </button>
                  </div>
                </div>

                {/* Photo grid */}
                {stagePhotos.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {stagePhotos.map((photo, idx) => (
                      <motion.button
                        key={photo.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        data-testid={`photo-thumb-${photo.id}`}
                        onClick={() => setLightbox({ photos: stagePhotos, index: idx })}
                        className="relative aspect-square rounded-2xl overflow-hidden bg-muted group"
                      >
                        <img src={photo.photoData} alt={photo.caption || ""} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                          <ZoomIn className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        {(photo.tags && photo.tags.length > 0) && (
                          <div className="absolute bottom-0 inset-x-0 p-1.5 bg-gradient-to-t from-black/60 to-transparent">
                            <div className="flex flex-wrap gap-1">
                              {photo.tags.slice(0, 2).map(tag => (
                                <span key={tag} className="text-[9px] font-bold text-white bg-white/20 backdrop-blur-sm rounded-full px-1.5 py-0.5">#{tag}</span>
                              ))}
                              {photo.tags.length > 2 && <span className="text-[9px] font-bold text-white">+{photo.tags.length - 2}</span>}
                            </div>
                          </div>
                        )}
                      </motion.button>
                    ))}
                    <button
                      onClick={() => openCamera(stage.key)}
                      className="aspect-square rounded-2xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-all flex items-center justify-center text-muted-foreground hover:text-primary"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                )}

                {stagePhotos.length === 0 && (
                  <div className={`grid grid-cols-2 gap-2`}>
                    <button
                      data-testid={`button-add-camera-${stage.key}`}
                      onClick={() => openCamera(stage.key)}
                      className={`py-5 rounded-2xl border-2 border-dashed border-primary/30 hover:border-primary/60 bg-primary/5 hover:bg-primary/10 transition-all flex flex-col items-center justify-center gap-1.5 text-primary`}
                    >
                      <Camera className="w-5 h-5" />
                      <span className="text-xs font-semibold">{ar ? "التقط صورة" : "Take photo"}</span>
                    </button>
                    <button
                      data-testid={`button-add-gallery-${stage.key}`}
                      onClick={() => openGallery(stage.key)}
                      className={`py-5 rounded-2xl border-2 border-dashed border-border hover:border-primary/40 hover:bg-secondary transition-all flex flex-col items-center justify-center gap-1.5 text-muted-foreground hover:text-foreground`}
                    >
                      <Image className="w-5 h-5" />
                      <span className="text-xs font-semibold">{ar ? "من المعرض" : "From gallery"}</span>
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}

        <div className="text-center text-xs text-muted-foreground pb-4">
          {ar ? "يومياتك تُحفظ في السحابة — لن تضيع ذكرياتك أبداً ✨" : "Your journal is saved securely — your memories are always safe ✨"}
        </div>
      </div>

      {/* Hidden gallery file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* ── Live Camera Modal ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {cameraOpen && (
          <motion.div
            key="camera-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex flex-col"
          >
            {/* Camera header */}
            <div className={`absolute top-0 inset-x-0 z-10 flex items-center justify-between px-4 pt-safe pt-4 pb-3 bg-gradient-to-b from-black/60 to-transparent ${isRTL ? "flex-row-reverse" : ""}`}>
              <button
                data-testid="button-close-camera"
                onClick={closeCamera}
                className="p-2.5 rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <span className="text-white font-semibold text-sm">
                {ar ? "التقاط صورة" : "Take Photo"}
              </span>
              <button
                data-testid="button-flip-camera"
                onClick={flipCamera}
                title={ar ? "تبديل الكاميرا" : "Flip camera"}
                className="p-2.5 rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 transition-colors"
              >
                <SwitchCamera className="w-5 h-5" />
              </button>
            </div>

            {/* Video preview */}
            <div className="flex-1 relative flex items-center justify-center overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${cameraFacing === "user" ? "scale-x-[-1]" : ""}`}
              />

              {/* Loading overlay */}
              {!cameraReady && !cameraError && (
                <div className="absolute inset-0 flex items-center justify-center bg-black">
                  <div className="flex flex-col items-center gap-3 text-white">
                    <div className="w-10 h-10 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    <p className="text-sm font-medium">{ar ? "جاري تشغيل الكاميرا…" : "Starting camera…"}</p>
                  </div>
                </div>
              )}

              {/* Error state */}
              {cameraError && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/90 px-6">
                  <div className="flex flex-col items-center gap-4 text-center max-w-xs">
                    <div className="w-14 h-14 rounded-full bg-destructive/20 flex items-center justify-center">
                      <AlertCircle className="w-7 h-7 text-destructive" />
                    </div>
                    <p className="text-white text-sm leading-relaxed">{cameraError}</p>
                    <div className={`flex gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
                      <button
                        onClick={() => startCamera(cameraFacing)}
                        className="px-4 py-2.5 rounded-xl bg-white/10 text-white text-sm font-semibold hover:bg-white/20 transition-colors flex items-center gap-1.5"
                      >
                        <RefreshCcw className="w-4 h-4" />
                        {ar ? "إعادة المحاولة" : "Retry"}
                      </button>
                      <button
                        onClick={() => { closeCamera(); openGallery(addPhotoStage!); }}
                        className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center gap-1.5"
                      >
                        <Image className="w-4 h-4" />
                        {ar ? "من المعرض" : "Gallery"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Guide frame overlay */}
              {cameraReady && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-64 h-64 rounded-3xl border-2 border-white/30" />
                </div>
              )}
            </div>

            {/* Bottom controls */}
            <div className="absolute bottom-0 inset-x-0 pb-safe pb-8 pt-6 bg-gradient-to-t from-black/70 to-transparent flex flex-col items-center gap-4">
              {/* Capture button */}
              <button
                data-testid="button-capture-photo"
                onClick={capturePhoto}
                disabled={!cameraReady || !!cameraError}
                className="w-20 h-20 rounded-full bg-white disabled:opacity-40 hover:scale-105 active:scale-95 transition-transform shadow-2xl flex items-center justify-center"
              >
                <div className="w-16 h-16 rounded-full border-4 border-black/10 bg-white" />
              </button>
              {/* Gallery shortcut */}
              <button
                onClick={() => { closeCamera(); openGallery(addPhotoStage!); }}
                className={`flex items-center gap-1.5 text-white/80 text-xs font-medium hover:text-white transition-colors ${isRTL ? "flex-row-reverse" : ""}`}
              >
                <Image className="w-4 h-4" />
                {ar ? "أو اختر من المعرض" : "or choose from gallery"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Photo caption/tags dialog ─────────────────────────────────────────── */}
      <AnimatePresence>
        {pendingPhoto && addPhotoStage && (
          <motion.div
            key="upload-dialog"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => { setPendingPhoto(null); setAddPhotoStage(null); }}
          >
            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              onClick={e => e.stopPropagation()}
              className={`bg-card w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden ${isRTL ? "text-right" : ""}`}
              dir={isRTL ? "rtl" : "ltr"}
            >
              <div className={`flex items-center justify-between px-5 pt-5 pb-3 ${isRTL ? "flex-row-reverse" : ""}`}>
                <h3 className="font-bold text-base">{ar ? "توثيق اللحظة" : "Capture the moment"}</h3>
                <button onClick={() => { setPendingPhoto(null); setAddPhotoStage(null); }} className="p-1.5 rounded-xl hover:bg-secondary transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mx-5 rounded-2xl overflow-hidden aspect-video bg-muted">
                <img src={pendingPhoto.dataUrl} alt="preview" className="w-full h-full object-cover" />
              </div>

              <div className="px-5 pt-4 pb-5 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                    {ar ? "وصف الصورة (اختياري)" : "Caption (optional)"}
                  </label>
                  <input
                    type="text"
                    value={pendingPhoto.caption}
                    onChange={e => setPendingPhoto(p => p ? { ...p, caption: e.target.value } : p)}
                    placeholder={ar ? "صِف هذه اللحظة…" : "Describe this moment…"}
                    dir={isRTL ? "rtl" : "ltr"}
                    data-testid="input-photo-caption"
                    className="w-full px-3.5 py-2.5 rounded-xl border-2 border-border bg-background text-sm focus:outline-none focus:border-primary transition-colors"
                  />
                </div>

                <div>
                  <label className={`text-xs font-semibold text-muted-foreground block mb-1.5 flex items-center gap-1 ${isRTL ? "flex-row-reverse" : ""}`}>
                    <Tag className="w-3 h-3" />
                    {ar ? "التاقات" : "Tags"}
                    <span className="font-normal text-muted-foreground/60">{ar ? "(اضغط Enter للإضافة)" : "(press Enter to add)"}</span>
                  </label>
                  {pendingPhoto.tags.length > 0 && (
                    <div className={`flex flex-wrap gap-1.5 mb-2 ${isRTL ? "flex-row-reverse" : ""}`}>
                      {pendingPhoto.tags.map(tag => (
                        <span key={tag} className={`flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold ${isRTL ? "flex-row-reverse" : ""}`}>
                          #{tag}
                          <button onClick={() => removeTag(tag)} className="hover:text-destructive transition-colors">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <div className={`flex gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
                    <input
                      type="text"
                      value={pendingPhoto.tagInput}
                      onChange={e => setPendingPhoto(p => p ? { ...p, tagInput: e.target.value } : p)}
                      onKeyDown={e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(); } }}
                      placeholder={ar ? "#الكعبة، #عرفة…" : "#kaaba, #arafat…"}
                      dir={isRTL ? "rtl" : "ltr"}
                      data-testid="input-photo-tag"
                      className="flex-1 px-3.5 py-2.5 rounded-xl border-2 border-border bg-background text-sm focus:outline-none focus:border-primary transition-colors"
                    />
                    <button onClick={addTag} className="px-3.5 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors text-sm font-semibold">
                      {ar ? "أضف" : "Add"}
                    </button>
                  </div>
                </div>

                <div className={`flex gap-3 pt-1 ${isRTL ? "flex-row-reverse" : ""}`}>
                  <button
                    onClick={() => { setPendingPhoto(null); setAddPhotoStage(null); }}
                    className="flex-1 py-3 rounded-2xl font-semibold text-sm border border-border hover:bg-secondary transition-colors"
                  >
                    {ar ? "إلغاء" : "Cancel"}
                  </button>
                  <button
                    data-testid="button-save-photo"
                    onClick={handleSavePhoto}
                    disabled={savePhoto.isPending}
                    className="flex-1 py-3 rounded-2xl font-bold text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60"
                  >
                    {savePhoto.isPending ? (ar ? "جاري الحفظ…" : "Saving…") : (ar ? "حفظ الصورة" : "Save Photo")}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Lightbox viewer ───────────────────────────────────────────────────── */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            key="lightbox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex flex-col"
            onClick={() => setLightbox(null)}
          >
            <div className={`flex items-center justify-between px-4 py-3 flex-shrink-0 ${isRTL ? "flex-row-reverse" : ""}`} onClick={e => e.stopPropagation()}>
              <span className="text-white/60 text-sm font-medium">{lightbox.index + 1} / {lightbox.photos.length}</span>
              <div className={`flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
                <button
                  data-testid={`button-delete-photo-${lightbox.photos[lightbox.index]?.id}`}
                  onClick={() => deletePhoto.mutate(lightbox.photos[lightbox.index].id)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-destructive/80 text-white transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button onClick={() => setLightbox(null)} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 flex items-center justify-center relative min-h-0" onClick={e => e.stopPropagation()}>
              {lightbox.photos.length > 1 && (
                <button
                  onClick={() => setLightbox(l => l ? { ...l, index: (l.index - 1 + l.photos.length) % l.photos.length } : l)}
                  className={`absolute ${isRTL ? "right-2" : "left-2"} p-2.5 rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors z-10`}
                >
                  <ChevronLeft className={`w-5 h-5 ${isRTL ? "rotate-180" : ""}`} />
                </button>
              )}
              <AnimatePresence mode="wait">
                <motion.img
                  key={lightbox.photos[lightbox.index]?.id}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  src={lightbox.photos[lightbox.index]?.photoData}
                  alt=""
                  className="max-w-full max-h-full object-contain px-14"
                />
              </AnimatePresence>
              {lightbox.photos.length > 1 && (
                <button
                  onClick={() => setLightbox(l => l ? { ...l, index: (l.index + 1) % l.photos.length } : l)}
                  className={`absolute ${isRTL ? "left-2" : "right-2"} p-2.5 rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors z-10`}
                >
                  <ChevronRight className={`w-5 h-5 ${isRTL ? "rotate-180" : ""}`} />
                </button>
              )}
            </div>

            {(lightbox.photos[lightbox.index]?.caption || (lightbox.photos[lightbox.index]?.tags?.length ?? 0) > 0) && (
              <div className="flex-shrink-0 px-6 py-4 space-y-2" onClick={e => e.stopPropagation()} dir={isRTL ? "rtl" : "ltr"}>
                {lightbox.photos[lightbox.index]?.caption && (
                  <p className="text-white text-sm font-medium text-center">{lightbox.photos[lightbox.index].caption}</p>
                )}
                {(lightbox.photos[lightbox.index]?.tags?.length ?? 0) > 0 && (
                  <div className={`flex flex-wrap gap-1.5 justify-center ${isRTL ? "flex-row-reverse" : ""}`}>
                    {lightbox.photos[lightbox.index].tags?.map(tag => (
                      <span key={tag} className="text-xs font-semibold text-white/70 bg-white/10 rounded-full px-2.5 py-1">#{tag}</span>
                    ))}
                  </div>
                )}
                {lightbox.photos[lightbox.index]?.timestamp && (
                  <p className="text-white/40 text-xs text-center">
                    {format(new Date(lightbox.photos[lightbox.index].timestamp!), "dd MMM yyyy • HH:mm")}
                  </p>
                )}
              </div>
            )}

            {lightbox.photos.length > 1 && (
              <div className="flex-shrink-0 px-4 pb-4 flex gap-2 justify-center overflow-x-auto" onClick={e => e.stopPropagation()}>
                {lightbox.photos.map((p, idx) => (
                  <button
                    key={p.id}
                    onClick={() => setLightbox(l => l ? { ...l, index: idx } : l)}
                    className={`w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 transition-all ${idx === lightbox.index ? "ring-2 ring-primary opacity-100" : "opacity-50 hover:opacity-75"}`}
                  >
                    <img src={p.photoData} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </PilgrimLayout>
  );
}
