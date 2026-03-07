import { useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Save, CheckCircle2, Star, Lock, Clock } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { type HajjNote } from "@shared/schema";
import { PilgrimLayout } from "@/components/pilgrim-layout";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const STAGES = [
  {
    key: "tarwiyah",
    dayAr: "اليوم الثامن — يوم التروية",
    dayEn: "Day 8 — Day of Tarwiyah",
    ritualAr: "الإحرام من مكة والتوجه إلى منى — المبيت ليلة عرفات",
    ritualEn: "Enter Ihram in Makkah and travel to Mina — stay overnight before Arafat",
    icon: "🕋",
    done: true,
  },
  {
    key: "arafat",
    dayAr: "اليوم التاسع — يوم عرفات",
    dayEn: "Day 9 — Day of Arafat",
    ritualAr: "الوقوف بعرفة من الزوال حتى الغروب — الدعاء والذكر والتضرع",
    ritualEn: "Stand at Arafat from midday to sunset — supplication, dhikr, and devotion",
    icon: "🌄",
    done: true,
  },
  {
    key: "muzdalifah",
    dayAr: "ليلة العاشر — مزدلفة",
    dayEn: "Night of Day 10 — Muzdalifah",
    ritualAr: "المبيت في مزدلفة وجمع حصى الجمرات — صلاة الفجر ثم التوجه لمنى",
    ritualEn: "Stay at Muzdalifah, collect pebbles — Fajr then head to Mina",
    icon: "🌙",
    current: true,
  },
  {
    key: "eid",
    dayAr: "اليوم العاشر — يوم النحر",
    dayEn: "Day 10 — Day of Eid al-Adha",
    ritualAr: "رمي جمرة العقبة، ذبح الهدي، الحلق أو التقصير، طواف الإفاضة، سعي الحج",
    ritualEn: "Jamarat, sacrifice, shaving, Tawaf al-Ifada, Hajj Sa'i",
    icon: "🐑",
  },
  {
    key: "tashreeq_11",
    dayAr: "اليوم الحادي عشر — أيام التشريق",
    dayEn: "Day 11 — Tashreeq Days",
    ritualAr: "المبيت في منى، رمي الجمرات الثلاثة بعد الزوال",
    ritualEn: "Stay in Mina, stone all three Jamarat after midday",
    icon: "⛏️",
  },
  {
    key: "tashreeq_12",
    dayAr: "اليوم الثاني عشر — التشريق",
    dayEn: "Day 12 — Tashreeq",
    ritualAr: "رمي الجمرات الثلاثة — إمكانية النفر الأول قبل الغروب",
    ritualEn: "Stone all three Jamarat — option for early departure before sunset",
    icon: "⛏️",
  },
  {
    key: "farewell",
    dayAr: "طواف الوداع",
    dayEn: "Farewell Tawaf",
    ritualAr: "طواف الوداع قبل مغادرة مكة المكرمة — آخر شعائر الحج",
    ritualEn: "Farewell Tawaf before leaving Makkah — final rite of Hajj",
    icon: "🤍",
  },
];

export function PilgrimHajjNotesPage() {
  const { lang, isRTL } = useLanguage();

  const { toast } = useToast();
  const ar = lang === "ar";
  const [draftNotes, setDraftNotes] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const pilgrimId = 1;

  const { data: notes = [] } = useQuery<HajjNote[]>({
    queryKey: ["/api/pilgrims", pilgrimId, "hajj-notes"],
    queryFn: () => fetch(`/api/pilgrims/${pilgrimId}/hajj-notes`).then(r => r.json()),
  });

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
      toast({ title: ar ? "✓ تم الحفظ" : "✓ Saved", description: ar ? "تم حفظ ملاحظتك بنجاح" : "Your note has been saved" });
    },
    onError: () => {
      setSaving(null);
      toast({ title: ar ? "خطأ" : "Error", variant: "destructive" });
    },
  });

  const getDraftOrSaved = (key: string) =>
    draftNotes[key] !== undefined ? draftNotes[key] : (noteMap[key] ?? "");

  const hasUnsaved = (key: string) => draftNotes[key] !== undefined && draftNotes[key] !== (noteMap[key] ?? "");

  return (
    <PilgrimLayout>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5" dir={isRTL ? "rtl" : "ltr"}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-secondary flex items-center justify-center text-primary">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">{ar ? "يوميات الحج" : "My Hajj Journal"}</h1>
              <p className="text-xs text-muted-foreground">{ar ? "سجّل ذكرياتك ومشاعرك في كل مرحلة" : "Record your memories and feelings at each stage"}</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="bg-card border border-border rounded-2xl p-4 mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">{ar ? "المراحل المسجّلة" : "Stages recorded"}</span>
              <span className="text-xs font-bold text-primary">{notes.length} / {STAGES.length}</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${(notes.length / STAGES.length) * 100}%` }}
              />
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
          const isFuture = !stage.done && !stage.current;

          return (
            <motion.div
              key={stage.key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className={`bg-card border rounded-3xl overflow-hidden transition-all duration-300
                ${isCurrent
                  ? "border-accent/60 shadow-md"
                  : isPast
                  ? "border-primary/20"
                  : "border-border opacity-80"}`}
            >
              {/* Stage header */}
              <div className="px-5 pt-4 pb-3 flex items-start gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl flex-shrink-0
                  ${isCurrent ? "bg-accent/10" : isPast ? "bg-secondary" : "bg-muted"}`}>
                  {isPast ? <CheckCircle2 className="w-5 h-5 text-primary" /> : isCurrent ? <Star className="w-5 h-5 text-accent" fill="currentColor" /> : <Clock className="w-5 h-5 text-muted-foreground/50" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-foreground">{ar ? stage.dayAr : stage.dayEn}</span>
                    {isCurrent && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
                        {ar ? "الشعيرة الحالية" : "Current"}
                      </span>
                    )}
                    {isFuture && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" /> {ar ? "قادم" : "Upcoming"}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{ar ? stage.ritualAr : stage.ritualEn}</p>
                </div>
              </div>

              {/* Note area */}
              <div className="px-5 pb-4">
                <div className="text-xs font-semibold text-muted-foreground mb-1.5">
                  {ar ? "ملاحظاتي" : "My notes"}{saved && <span className="text-primary ms-1">•</span>}
                </div>
                <Textarea
                  value={draft}
                  onChange={(e) => setDraftNotes(prev => ({ ...prev, [stage.key]: e.target.value }))}
                  placeholder={ar
                    ? `سجّل أفكارك وذكرياتك في ${stage.dayAr.split("—")[0].trim()}…`
                    : `Write your thoughts for ${stage.dayEn.split("—")[0].trim()}…`}
                  className="min-h-[80px] resize-none text-sm bg-background border-border rounded-2xl focus:border-primary/50 transition-colors"
                  dir={isRTL ? "rtl" : "ltr"}
                  data-testid={`textarea-note-${stage.key}`}
                />
                <div className="mt-2 flex items-center gap-2">
                  {unsaved && (
                    <Button
                      size="sm"
                      onClick={() => saveNote.mutate({ stageKey: stage.key, note: draft })}
                      disabled={isSavingThis}
                      className="rounded-full px-4 h-7 text-xs"
                      data-testid={`btn-save-note-${stage.key}`}
                    >
                      <Save className="w-3 h-3 me-1" />
                      {isSavingThis ? (ar ? "جاري الحفظ…" : "Saving…") : (ar ? "حفظ" : "Save")}
                    </Button>
                  )}
                  {saved && !unsaved && (
                    <span className="text-[10px] text-primary flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      {ar ? "تم الحفظ" : "Saved"}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}

        {/* Footer reminder */}
        <div className="text-center text-xs text-muted-foreground pb-4">
          {ar ? "يومياتك تُحفظ في السحابة — لن تضيع ذكرياتك أبداً ✨" : "Your journal is saved securely in the cloud — your memories are always safe ✨"}
        </div>
      </div>
    </PilgrimLayout>
  );
}
