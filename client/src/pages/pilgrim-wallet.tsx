import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Heart, Phone, Edit3, CheckCircle2, AlertCircle, Clock, User } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { type Pilgrim } from "@shared/schema";
import { PilgrimLayout } from "@/components/pilgrim-layout";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export function PilgrimWalletPage() {
  const { lang, isRTL } = useLanguage();

  const { toast } = useToast();
  const ar = lang === "ar";
  const [editOpen, setEditOpen] = useState(false);
  const [editEmergencyOpen, setEditEmergencyOpen] = useState(false);
  const [emergencyForm, setEmergencyForm] = useState({ emergencyContact: "" });

  const pilgrimId = Number(localStorage.getItem("pilgrimId") || "1");

  const { data: pilgrim, isLoading } = useQuery<Pilgrim>({
    queryKey: ["/api/pilgrims", pilgrimId],
    queryFn: () => fetch(`/api/pilgrims/${pilgrimId}`).then(r => r.json()),
  });

  const [form, setForm] = useState({
    bloodType: "",
    allergies: "",
    medicalConditions: "",
    emergencyContact: "",
    healthStatus: "Good" as "Good" | "Stable" | "NeedsAttention",
  });

  const updateHealth = useMutation({
    mutationFn: (data: typeof form) => apiRequest("PATCH", `/api/pilgrims/${pilgrimId}/health`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pilgrims", pilgrimId] });
      queryClient.invalidateQueries({ queryKey: ["/api/pilgrims"] });
      setEditOpen(false);
      toast({ title: ar ? "✅ تم حفظ البيانات الصحية" : "✅ Health data saved" });
    },
    onError: () => {
      toast({ title: ar ? "خطأ في الحفظ" : "Save failed", variant: "destructive" });
    },
  });

  const updateEmergency = useMutation({
    mutationFn: (data: { emergencyContact: string }) =>
      apiRequest("PATCH", `/api/pilgrims/${pilgrimId}/health`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pilgrims", pilgrimId] });
      queryClient.invalidateQueries({ queryKey: ["/api/pilgrims"] });
      setEditEmergencyOpen(false);
      toast({ title: ar ? "✅ تم حفظ رقم التواصل الطارئ" : "✅ Emergency contact saved" });
    },
    onError: () => {
      toast({ title: ar ? "خطأ في الحفظ" : "Save failed", variant: "destructive" });
    },
  });

  const handleEditEmergency = () => {
    setEmergencyForm({ emergencyContact: pilgrim?.emergencyContact || "" });
    setEditEmergencyOpen(true);
  };

  const handleEdit = () => {
    setForm({
      bloodType: pilgrim?.bloodType || "",
      allergies: pilgrim?.allergies || "",
      medicalConditions: pilgrim?.medicalConditions || "",
      emergencyContact: pilgrim?.emergencyContact || "",
      healthStatus: (pilgrim?.healthStatus as "Good" | "Stable" | "NeedsAttention") || "Good",
    });
    setEditOpen(true);
  };

  const permitColor =
    pilgrim?.permitStatus === "Valid" ? { bg: "from-[#c49a3c] to-[#8a6520]", badge: "bg-white/20 text-white border-white/30" }
    : pilgrim?.permitStatus === "Expired" ? { bg: "from-amber-600 to-amber-700", badge: "bg-amber-400/20 text-white border-white/30" }
    : { bg: "from-violet-600 to-violet-700", badge: "bg-violet-400/20 text-white border-white/30" };

  const permitLabel =
    pilgrim?.permitStatus === "Valid" ? (ar ? "ساري المفعول" : "Valid")
    : pilgrim?.permitStatus === "Expired" ? (ar ? "منتهي الصلاحية" : "Expired")
    : (ar ? "قيد التحقق" : "Pending Verification");

  const healthLabel =
    pilgrim?.healthStatus === "NeedsAttention" ? (ar ? "تحتاج متابعة" : "Needs Attention")
    : pilgrim?.healthStatus === "Stable" ? (ar ? "مستقرة" : "Stable")
    : (ar ? "جيدة" : "Good");

  const healthColor =
    pilgrim?.healthStatus === "NeedsAttention" ? "text-red-600 bg-red-50 border-red-200"
    : pilgrim?.healthStatus === "Stable" ? "text-amber-600 bg-amber-50 border-amber-200"
    : "text-emerald-600 bg-emerald-50 border-emerald-200";

  return (
    <PilgrimLayout>
      <div className="max-w-xl mx-auto px-4 py-6 space-y-5" dir={isRTL ? "rtl" : "ltr"}>

        {/* Title */}
        <div>
          <h1 className="font-bold text-primary text-xl">{ar ? "المحفظة الرقمية" : "Digital Wallet"}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{ar ? "تصريحك وبياناتك الصحية في مكان واحد" : "Your permit and health data in one place"}</p>
        </div>

        {/* Permit Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className={`rounded-3xl overflow-hidden shadow-lg bg-gradient-to-br ${permitColor.bg}`}
        >
          {/* Card top */}
          <div className="px-6 pt-5 pb-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs text-white/70 mb-1 font-medium">{ar ? "تصريح الحج الرسمي" : "Official Hajj Permit"}</div>
                <div className="text-lg font-bold text-white">{isLoading ? "..." : pilgrim?.name}</div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-card/15 flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          {/* Card mid */}
          <div className="px-6 pb-4 grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-white/60">{ar ? "رقم الجواز" : "Passport No."}</div>
              <div className="text-sm font-bold text-white mt-0.5 font-mono">{pilgrim?.passportNumber || "—"}</div>
            </div>
            <div>
              <div className="text-xs text-white/60">{ar ? "الجنسية" : "Nationality"}</div>
              <div className="text-sm font-bold text-white mt-0.5">{pilgrim?.nationality || "—"}</div>
            </div>
            <div>
              <div className="text-xs text-white/60">{ar ? "المجموعة" : "Campaign"}</div>
              <div className="text-sm font-bold text-white mt-0.5">{pilgrim?.campaignGroup || "—"}</div>
            </div>
            <div>
              <div className="text-xs text-white/60">{ar ? "الهاتف" : "Phone"}</div>
              <div className="text-sm font-bold text-white mt-0.5 font-mono" dir="ltr">{pilgrim?.phone || "—"}</div>
            </div>
          </div>

          {/* Card bottom */}
          <div className="px-6 pb-5 flex items-center justify-between">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${permitColor.badge}`}>
              {pilgrim?.permitStatus === "Valid"
                ? <CheckCircle2 className="w-3.5 h-3.5" />
                : pilgrim?.permitStatus === "Expired"
                ? <AlertCircle className="w-3.5 h-3.5" />
                : <Clock className="w-3.5 h-3.5" />}
              <span className="text-xs font-bold">{permitLabel}</span>
            </div>
            {/* QR placeholder */}
            <div className="w-12 h-12 border-2 border-white/30 rounded-xl flex items-center justify-center">
              <div className="grid grid-cols-3 gap-0.5">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="w-2 h-2 rounded-[1px]" style={{ background: [0,2,4,6,8].includes(i) ? "rgba(255,255,255,0.8)" : "transparent" }} />
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Health Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
          className="rounded-3xl bg-card border border-border shadow-sm overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-red-500" />
              <span className="font-bold text-sm text-foreground">{ar ? "البيانات الصحية" : "Health Data"}</span>
            </div>
            <button
              onClick={handleEdit}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary hover:bg-secondary/80 text-primary text-xs font-bold transition-colors"
              data-testid="btn-edit-health"
            >
              <Edit3 className="w-3.5 h-3.5" />
              {ar ? "تحديث" : "Update"}
            </button>
          </div>
          <div className="px-5 py-4 grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-muted-foreground mb-1">{ar ? "فصيلة الدم" : "Blood Type"}</div>
              <div className="font-bold text-foreground text-sm">{pilgrim?.bloodType || (ar ? "غير محدد" : "Not set")}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">{ar ? "الحالة الصحية" : "Health Status"}</div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${healthColor}`}>{healthLabel}</span>
            </div>
            <div className="col-span-2">
              <div className="text-xs text-muted-foreground mb-1">{ar ? "الحساسية" : "Allergies"}</div>
              <div className="text-sm text-foreground">{pilgrim?.allergies || (ar ? "لا يوجد" : "None reported")}</div>
            </div>
            <div className="col-span-2">
              <div className="text-xs text-muted-foreground mb-1">{ar ? "الأمراض المزمنة" : "Chronic Conditions"}</div>
              <div className="text-sm text-foreground">{pilgrim?.medicalConditions || (ar ? "لا يوجد" : "None")}</div>
            </div>
          </div>
        </motion.div>

        {/* Emergency Contact Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
          className="rounded-3xl bg-card border border-border shadow-sm overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-primary" />
              <span className="font-bold text-sm text-foreground">{ar ? "معلومات الطوارئ" : "Emergency Info"}</span>
            </div>
            <button
              onClick={handleEditEmergency}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary hover:bg-secondary/80 text-primary text-xs font-bold transition-colors"
              data-testid="btn-edit-emergency"
            >
              <Edit3 className="w-3.5 h-3.5" />
              {ar ? "تحديث" : "Update"}
            </button>
          </div>
          <div className="px-5 py-4 space-y-3">
            <div>
              <div className="text-xs text-muted-foreground mb-1">{ar ? "رقمي للتواصل الطارئ" : "Emergency Contact"}</div>
              <div className="text-sm font-semibold text-foreground" dir="ltr">{pilgrim?.phone || (ar ? "غير محدد" : "Not set")}</div>
            </div>
            <div className="border-t border-border pt-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{ar ? "خط دعم وزارة الحج" : "Ministry of Hajj Hotline"}</span>
                <span className="font-mono font-bold text-primary" dir="ltr">920 002 814</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{ar ? "الإسعاف" : "Ambulance"}</span>
                <span className="font-mono font-bold text-red-600" dir="ltr">911</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{ar ? "مشرف المجموعة" : "Group Supervisor"}</span>
                <span className="font-mono font-bold text-primary" dir="ltr">+966 50 123 4567</span>
              </div>
            </div>
          </div>
        </motion.div>

      </div>

      {/* Edit Health Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md rounded-3xl" dir={isRTL ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle>{ar ? "تحديث البيانات الصحية" : "Update Health Data"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label className="text-xs text-muted-foreground">{ar ? "فصيلة الدم" : "Blood Type"}</Label>
              <Select value={form.bloodType} onValueChange={v => setForm(f => ({ ...f, bloodType: v }))}>
                <SelectTrigger className="mt-1 rounded-xl" data-testid="select-blood-type">
                  <SelectValue placeholder={ar ? "اختر فصيلة الدم" : "Select blood type"} />
                </SelectTrigger>
                <SelectContent>
                  {BLOOD_TYPES.map(bt => <SelectItem key={bt} value={bt}>{bt}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">{ar ? "الحالة الصحية" : "Health Status"}</Label>
              <Select value={form.healthStatus} onValueChange={v => setForm(f => ({ ...f, healthStatus: v as any }))}>
                <SelectTrigger className="mt-1 rounded-xl" data-testid="select-health-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Good">{ar ? "جيدة" : "Good"}</SelectItem>
                  <SelectItem value="Stable">{ar ? "مستقرة" : "Stable"}</SelectItem>
                  <SelectItem value="NeedsAttention">{ar ? "تحتاج متابعة" : "Needs Attention"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">{ar ? "الحساسية (إن وجدت)" : "Allergies (if any)"}</Label>
              <Input
                value={form.allergies}
                onChange={e => setForm(f => ({ ...f, allergies: e.target.value }))}
                placeholder={ar ? "مثال: حساسية من البنسلين" : "e.g. Penicillin allergy"}
                className="mt-1 rounded-xl"
                data-testid="input-allergies"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">{ar ? "الأمراض المزمنة" : "Chronic Conditions"}</Label>
              <Textarea
                value={form.medicalConditions}
                onChange={e => setForm(f => ({ ...f, medicalConditions: e.target.value }))}
                placeholder={ar ? "مثال: ضغط الدم، السكري" : "e.g. Hypertension, Diabetes"}
                className="mt-1 rounded-xl resize-none"
                rows={2}
                data-testid="input-medical-conditions"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">{ar ? "رقمي للتواصل الطارئ" : "Emergency Contact"}</Label>
              <Input
                value={form.emergencyContact}
                onChange={e => setForm(f => ({ ...f, emergencyContact: e.target.value }))}
                placeholder={ar ? "الاسم + رقم الهاتف" : "Name + phone number"}
                className="mt-1 rounded-xl"
                data-testid="input-emergency-contact"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                onClick={() => setEditOpen(false)}
                className="flex-1 rounded-xl"
                data-testid="btn-cancel-health"
              >
                {ar ? "إلغاء" : "Cancel"}
              </Button>
              <Button
                onClick={() => updateHealth.mutate(form)}
                disabled={updateHealth.isPending}
                className="flex-1 rounded-xl bg-primary hover:bg-[#0a3d34] text-white"
                data-testid="btn-save-health"
              >
                {updateHealth.isPending ? (ar ? "جاري الحفظ..." : "Saving...") : (ar ? "حفظ" : "Save")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Emergency Contact Dialog */}
      <Dialog open={editEmergencyOpen} onOpenChange={setEditEmergencyOpen}>
        <DialogContent className="max-w-sm rounded-3xl" dir={isRTL ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle>{ar ? "تحديث رقم التواصل الطارئ" : "Update Emergency Contact"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="p-3 rounded-xl bg-secondary/50 text-xs text-muted-foreground">
              {ar
                ? "أضف رقم هاتف شخص قريب منك يمكن التواصل معه في حالات الطوارئ"
                : "Add a phone number of a close person reachable in emergencies"}
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">{ar ? "رقمي للتواصل الطارئ" : "Emergency Contact"}</Label>
              <Input
                value={emergencyForm.emergencyContact}
                onChange={e => setEmergencyForm({ emergencyContact: e.target.value })}
                placeholder={ar ? "الاسم + رقم الهاتف" : "Name + phone number"}
                className="mt-1 rounded-xl"
                data-testid="input-emergency-contact-dialog"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                onClick={() => setEditEmergencyOpen(false)}
                className="flex-1 rounded-xl"
              >
                {ar ? "إلغاء" : "Cancel"}
              </Button>
              <Button
                onClick={() => updateEmergency.mutate(emergencyForm)}
                disabled={updateEmergency.isPending}
                className="flex-1 rounded-xl bg-primary hover:bg-[#0a3d34] text-white"
                data-testid="btn-save-emergency"
              >
                {updateEmergency.isPending ? (ar ? "جاري الحفظ..." : "Saving...") : (ar ? "حفظ" : "Save")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </PilgrimLayout>
  );
}
