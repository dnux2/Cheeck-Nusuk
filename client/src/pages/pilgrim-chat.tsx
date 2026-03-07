import { useState, useRef, useEffect } from "react";
import { Send, MessageSquare, Shield } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { type ChatMessage } from "@shared/schema";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { PilgrimLayout } from "@/components/pilgrim-layout";

const PILGRIM_ID = 1;

export function PilgrimChatPage() {
  const { lang, isRTL } = useLanguage();
  const ar = lang === "ar";
  const [chatInput, setChatInput] = useState("");
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const { data: chatMessages = [] } = useQuery<ChatMessage[]>({
    queryKey: ["/api/chat/messages"],
    refetchInterval: 3000,
  });

  const myMessages = chatMessages.filter(
    m => m.pilgrimId === PILGRIM_ID || m.pilgrimId === null
  );

  const sendChatMsg = useMutation({
    mutationFn: (msg: { message: string; pilgrimId: number; senderRole: string }) =>
      apiRequest("POST", "/api/chat/messages", msg),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/messages"] });
      setChatInput("");
    },
  });

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [myMessages]);

  const handleSend = () => {
    const trimmed = chatInput.trim();
    if (!trimmed) return;
    sendChatMsg.mutate({ message: trimmed, pilgrimId: PILGRIM_ID, senderRole: "pilgrim" });
  };

  return (
    <PilgrimLayout>
      <div className="flex flex-col h-screen" style={{ direction: isRTL ? "rtl" : "ltr" }}>

        {/* Header */}
        <div className="px-5 py-4 border-b border-border bg-card flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div className={isRTL ? "text-right" : ""}>
            <div className="font-bold text-primary text-sm">{ar ? "المشرف — حملة التوحيد" : "Supervisor — Al-Tawheed Group"}</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-2 h-2 bg-emerald-500 rounded-full" />
              <span className="text-xs text-muted-foreground">{ar ? "متاح الآن" : "Available now"}</span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-background">
          {myMessages.length === 0 && (
            <div className="text-center py-12">
              <MessageSquare className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">{ar ? "لا توجد رسائل بعد" : "No messages yet"}</p>
              <p className="text-xs text-muted-foreground mt-1">{ar ? "ابدأ محادثة مع مشرفك" : "Start a conversation with your supervisor"}</p>
            </div>
          )}
          {myMessages.map((msg, i) => {
            const isPilgrim = msg.senderRole === "pilgrim";
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                className={`flex ${isPilgrim ? (isRTL ? "justify-start" : "justify-end") : (isRTL ? "justify-end" : "justify-start")}`}
              >
                {!isPilgrim && (
                  <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1 mr-2 ml-2">
                    <Shield className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
                <div className={`max-w-[72%] ${isPilgrim ? "items-end" : "items-start"} flex flex-col`}>
                  <div
                    className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isRTL ? "text-right" : "text-left"}
                      ${isPilgrim
                        ? "bg-primary text-white rounded-br-sm"
                        : msg.pilgrimId === null
                        ? "bg-accent text-accent-foreground rounded-bl-sm"
                        : "bg-card text-foreground border border-border rounded-bl-sm shadow-sm"
                      }`}
                  >
                    {msg.pilgrimId === null && (
                      <div className="text-[10px] font-bold text-white/80 mb-1 uppercase tracking-wide">
                        {ar ? "📢 رسالة للجميع" : "📢 Broadcast"}
                      </div>
                    )}
                    {msg.message}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1 px-1">
                    {msg.timestamp ? format(new Date(msg.timestamp), "HH:mm") : ""}
                    {isPilgrim && <span className="mr-1 ml-1 text-emerald-500">✓✓</span>}
                  </div>
                </div>
              </motion.div>
            );
          })}
          <div ref={chatBottomRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 bg-card border-t border-border">
          <div className={`flex gap-2 items-end ${isRTL ? "flex-row-reverse" : ""}`}>
            <div className="flex-1 bg-card border border-border rounded-2xl px-4 py-2.5 shadow-sm">
              <textarea
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder={ar ? "اكتب رسالتك للمشرف..." : "Type a message to your supervisor..."}
                className={`w-full text-sm bg-transparent resize-none outline-none text-foreground placeholder:text-muted-foreground max-h-20 ${isRTL ? "text-right" : ""}`}
                rows={1}
                data-testid="input-chat-message"
              />
            </div>
            <button
              onClick={handleSend}
              disabled={!chatInput.trim() || sendChatMsg.isPending}
              className="w-10 h-10 rounded-2xl bg-primary hover:bg-[#0a3d34] disabled:opacity-40 flex items-center justify-center transition-colors flex-shrink-0 shadow-md"
              data-testid="btn-send-chat"
            >
              <Send className={`w-4 h-4 text-white ${isRTL ? "rotate-180" : ""}`} />
            </button>
          </div>
        </div>

      </div>
    </PilgrimLayout>
  );
}
