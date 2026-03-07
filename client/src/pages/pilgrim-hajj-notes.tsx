import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, Save, CheckCircle2, Star, Lock, Clock,
  Camera, Image, Tag, X, Trash2, ZoomIn, ChevronLeft, ChevronRight, Plus
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

function compressImage(file: File, maxKB = 350): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
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
          const dataUrl = canvas.toDataURL("image/jpeg", quality);
          const kb = Math.round((dataUrl.length * 3) / 4 / 1024);
          if (kb > maxKB && quality > 0.2) { quality -= 0.1; tryCompress(); }
          else resolve(dataUrl);
        };
        tryCompress();
      };
      img.onerror = reject;
      img.src = e.target!.result as string;
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
  const [uploadingStage, setUploadingStage] = useState<string | null>(null);
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
      setUploadingStage(null);
      toast({ title: ar ? "✓ تم حفظ الصورة" : "✓ Photo saved" });
    },
    onError: () => { setUploadingStage(null); toast({ title: ar ? "فشل الحفظ" : "Save failed", variant: "destructive" }); },
  });

  const deletePhoto = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/photos/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/pilgrims", pilgrimId, "photos"] }); setLightbox(null); },
  });

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
    setUploadingStage(addPhotoStage);
    savePhoto.mutate({ stageKey: addPhotoStage, photoData: pendingPhoto.dataUrl, caption: pendingPhoto.caption, tags: pendingPhoto.tags });
  };

  const getDraftOrSaved = (key: string) => draftNotes[key] !== undefined ? draftNotes[key] : (noteMap[key] ?? "");
  const hasUnsaved = (key: string) => draftNotes[key] !== undefined && draftNotes[key] !== (noteMap[key] ?? "");

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
                  placeholder={ar ? `سجّل أفكارك وذكرياتك…` : `Write your thoughts…`}
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
                  <button
                    data-testid={`button-add-photo-${stage.key}`}
                    onClick={() => { setAddPhotoStage(stage.key); setPendingPhoto(null); fileInputRef.current?.click(); }}
                    className={`flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors ${isRTL ? "flex-row-reverse" : ""}`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {ar ? "أضف صورة" : "Add photo"}
                  </button>
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
                        {/* Overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                          <ZoomIn className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        {/* Tags overlay */}
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
                    {/* Empty add slot */}
                    <button
                      onClick={() => { setAddPhotoStage(stage.key); setPendingPhoto(null); fileInputRef.current?.click(); }}
                      className="aspect-square rounded-2xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-all flex items-center justify-center text-muted-foreground hover:text-primary"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                )}

                {stagePhotos.length === 0 && (
                  <button
                    onClick={() => { setAddPhotoStage(stage.key); setPendingPhoto(null); fileInputRef.current?.click(); }}
                    className={`w-full py-4 rounded-2xl border-2 border-dashed border-border hover:border-primary/40 hover:bg-primary/5 transition-all flex items-center justify-center gap-2 text-muted-foreground hover:text-primary text-xs font-medium ${isRTL ? "flex-row-reverse" : ""}`}
                  >
                    <Camera className="w-4 h-4" />
                    {ar ? "اضغط لإضافة صور من هذه المرحلة" : "Tap to add photos from this stage"}
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground pb-4">
          {ar ? "يومياتك تُحفظ في السحابة — لن تضيع ذكرياتك أبداً ✨" : "Your journal is saved securely — your memories are always safe ✨"}
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Photo upload dialog */}
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
              {/* Dialog header */}
              <div className={`flex items-center justify-between px-5 pt-5 pb-3 ${isRTL ? "flex-row-reverse" : ""}`}>
                <h3 className="font-bold text-base">{ar ? "توثيق اللحظة" : "Capture the moment"}</h3>
                <button onClick={() => { setPendingPhoto(null); setAddPhotoStage(null); }} className="p-1.5 rounded-xl hover:bg-secondary transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Preview */}
              <div className="mx-5 rounded-2xl overflow-hidden aspect-video bg-muted">
                <img src={pendingPhoto.dataUrl} alt="preview" className="w-full h-full object-cover" />
              </div>

              <div className="px-5 pt-4 pb-5 space-y-4">
                {/* Caption input */}
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

                {/* Tags input */}
                <div>
                  <label className={`text-xs font-semibold text-muted-foreground block mb-1.5 flex items-center gap-1 ${isRTL ? "flex-row-reverse" : ""}`}>
                    <Tag className="w-3 h-3" />
                    {ar ? "التاقات" : "Tags"}
                    <span className="font-normal text-muted-foreground/60">{ar ? "(اضغط Enter أو فاصلة للإضافة)" : "(press Enter or comma to add)"}</span>
                  </label>

                  {/* Tag chips */}
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
                    <button
                      onClick={addTag}
                      className="px-3.5 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors text-sm font-semibold"
                    >
                      {ar ? "أضف" : "Add"}
                    </button>
                  </div>
                </div>

                {/* Actions */}
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
                    className="flex-2 flex-1 py-3 rounded-2xl font-bold text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60"
                  >
                    {savePhoto.isPending ? (ar ? "جاري الحفظ…" : "Saving…") : (ar ? "حفظ الصورة" : "Save Photo")}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lightbox viewer */}
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
            {/* Lightbox header */}
            <div className={`flex items-center justify-between px-4 py-3 flex-shrink-0 ${isRTL ? "flex-row-reverse" : ""}`} onClick={e => e.stopPropagation()}>
              <span className="text-white/60 text-sm font-medium">
                {lightbox.index + 1} / {lightbox.photos.length}
              </span>
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

            {/* Main image + navigation */}
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

            {/* Caption + Tags */}
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

            {/* Thumbnail strip */}
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
