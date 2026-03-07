import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { usePilgrims } from "@/hooks/use-pilgrims";
import { useLanguage } from "@/contexts/language-context";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { type ChatMessage, type Pilgrim } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Users, MessageSquare, ChevronLeft, ChevronRight, PanelLeftOpen, PanelLeftClose, Wifi, WifiOff, Bell, X } from "lucide-react";
import { format } from "date-fns";
import { useSearch } from "wouter";
import { useChatWebSocket } from "@/hooks/use-chat-ws";

const STORAGE_KEY = "supervisor_chat_lastread";

function timeAgo(timestamp: number, isAr: boolean): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return isAr ? "الآن" : "now";
  if (mins < 60) return isAr ? `${mins}د` : `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return isAr ? `${hours}س` : `${hours}h`;
  const days = Math.floor(hours / 24);
  return isAr ? `${days}ي` : `${days}d`;
}

function loadLastRead(): Record<string, number> {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}"); } catch { return {}; }
}
function saveLastRead(data: Record<string, number>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function ChatPage() {
  const { t, isRTL, lang } = useLanguage();
  const ar = lang === "ar";
  const { data: pilgrims } = usePilgrims();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const urlPilgrimId = params.get("pilgrimId") ? Number(params.get("pilgrimId")) : null;
  const [selectedPilgrimId, setSelectedPilgrimId] = useState<number | null>(urlPilgrimId);
  const [input, setInput] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const [lastRead, setLastRead] = useState<Record<string, number>>(() => loadLastRead());
  const lastReadRef = useRef(lastRead);
  const initializedRef = useRef(false);
  const [initialized, setInitialized] = useState(false);
  const loginNotifShownRef = useRef(false);
  const [loginNotif, setLoginNotif] = useState<{ count: number; names: string[] } | null>(null);
  const selectedRef = useRef(selectedPilgrimId);
  selectedRef.current = selectedPilgrimId;

  const wsStatusRef = useChatWebSocket((newMsg) => {
    setWsConnected(wsStatusRef.current === "open");
    const key = newMsg.pilgrimId === null ? "null" : String(newMsg.pilgrimId);
    const isCurrentThread = newMsg.pilgrimId === selectedRef.current;
    if (isCurrentThread && newMsg.senderRole === "pilgrim") {
      const updated = { ...lastReadRef.current, [key]: Date.now() };
      lastReadRef.current = updated;
      setLastRead(updated);
      saveLastRead(updated);
    }
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setWsConnected(wsStatusRef.current === "open");
    }, 1000);
    return () => clearInterval(interval);
  }, [wsStatusRef]);

  const { data: messages = [] } = useQuery<ChatMessage[]>({
    queryKey: ["/api/chat/messages"],
    refetchInterval: wsConnected ? false : 3000,
  });

  useEffect(() => {
    if (!initializedRef.current && messages.length > 0) {
      initializedRef.current = true;
      const existing = loadLastRead();
      const now = Date.now();
      const updated: Record<string, number> = { ...existing };
      messages.forEach(m => {
        const key = m.pilgrimId === null ? "null" : String(m.pilgrimId);
        if (!(key in updated)) updated[key] = now;
      });
      lastReadRef.current = updated;
      setLastRead(updated);
      saveLastRead(updated);
      setInitialized(true);
    }
  }, [messages]);

  const markRead = useCallback((id: number | null) => {
    const key = id === null ? "null" : String(id);
    const updated = { ...lastReadRef.current, [key]: Date.now() };
    lastReadRef.current = updated;
    setLastRead(updated);
    saveLastRead(updated);
  }, []);

  const sendMessage = useMutation({
    mutationFn: (msg: { message: string; pilgrimId: number | null; senderRole: string }) =>
      apiRequest("POST", "/api/chat/messages", msg),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/messages"] });
      setInput("");
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    sendMessage.mutate({
      message: trimmed,
      pilgrimId: selectedPilgrimId,
      senderRole: "supervisor",
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const selectPilgrim = (id: number | null) => {
    setSelectedPilgrimId(id);
    markRead(id);
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  const getUnread = useCallback((id: number | null): number => {
    const key = id === null ? "null" : String(id);
    const since = lastRead[key] ?? 0;
    return messages.filter(m => {
      const mKey = m.pilgrimId === null ? "null" : String(m.pilgrimId);
      return mKey === key && m.senderRole === "pilgrim" && new Date(m.timestamp ?? 0).getTime() > since;
    }).length;
  }, [messages, lastRead]);

  const totalUnread = useMemo(() => {
    const fromPilgrims = (pilgrims ?? []).reduce((acc, p) => acc + getUnread(p.id), 0);
    return fromPilgrims + getUnread(null);
  }, [pilgrims, getUnread]);

  const lastMsgTime = useMemo(() => {
    const map: Record<number, { time: number; text: string; fromPilgrim: boolean }> = {};
    messages.forEach(m => {
      if (m.pilgrimId) {
        const t = new Date(m.timestamp ?? 0).getTime();
        if (!map[m.pilgrimId] || t > map[m.pilgrimId].time) {
          map[m.pilgrimId] = {
            time: t,
            text: m.message.length > 28 ? m.message.slice(0, 28) + "…" : m.message,
            fromPilgrim: m.senderRole === "pilgrim",
          };
        }
      }
    });
    return map;
  }, [messages]);

  const sortedPilgrims = useMemo(() => {
    if (!pilgrims) return [];
    return [...pilgrims].sort((a, b) => {
      const ta = lastMsgTime[a.id]?.time ?? 0;
      const tb = lastMsgTime[b.id]?.time ?? 0;
      return tb - ta;
    });
  }, [pilgrims, lastMsgTime]);

  useEffect(() => {
    if (!loginNotifShownRef.current && initialized && totalUnread > 0 && pilgrims && pilgrims.length > 0) {
      loginNotifShownRef.current = true;
      const names: string[] = [];
      (pilgrims ?? []).forEach(p => {
        if (getUnread(p.id) > 0) names.push(p.name);
      });
      setLoginNotif({ count: totalUnread, names: names.slice(0, 3) });
    }
  }, [initialized, totalUnread, pilgrims]);

  const displayMessages = selectedPilgrimId === null
    ? messages.filter(m => m.pilgrimId === null)
    : messages.filter(m => m.pilgrimId === selectedPilgrimId);

  const getPilgrimName = (id: number | null) => {
    if (!id) return t("allPilgrimsLabel");
    return pilgrims?.find(p => p.id === id)?.name ?? `#${id}`;
  };

  const ToggleIcon = isRTL
    ? (sidebarOpen ? ChevronRight : ChevronLeft)
    : (sidebarOpen ? ChevronLeft : ChevronRight);

  return (
    <div className="flex h-[calc(100vh-5rem)] overflow-hidden relative" dir={isRTL ? "rtl" : "ltr"}>

      {/* Mobile backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="md:hidden fixed inset-0 z-20 bg-black/40 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar — pilgrim list */}
      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.div
            key="sidebar"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 288, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`
              flex-shrink-0 border-e border-border bg-card flex flex-col overflow-hidden
              md:relative md:z-auto
              fixed z-30 top-0 bottom-0
              ${isRTL ? "right-0 border-l border-r-0" : "left-0"}
            `}
            style={{ width: 288 }}
          >
            {/* Sidebar header */}
            <div className={`p-4 border-b border-border flex items-center justify-between gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
              <div className={isRTL ? "text-right" : ""}>
                <div className={`flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
                  <h2 className="font-display font-bold text-base leading-tight">{t("supervisorChat")}</h2>
                  {totalUnread > 0 && (
                    <span
                      data-testid="badge-total-unread-sidebar"
                      className="min-w-[20px] h-5 rounded-full bg-red-500 text-white text-[10px] font-extrabold flex items-center justify-center px-1.5 animate-pulse"
                    >
                      {totalUnread > 99 ? "99+" : totalUnread}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{t("supervisorChatDesc")}</p>
              </div>
              <button
                data-testid="button-close-chat-sidebar"
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground flex-shrink-0"
                title={ar ? "إغلاق القائمة" : "Close list"}
              >
                <ToggleIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {/* Broadcast row */}
              {(() => {
                const broadcastUnread = getUnread(null);
                const isActive = selectedPilgrimId === null;
                return (
                  <button
                    data-testid="chat-thread-broadcast"
                    onClick={() => selectPilgrim(null)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-start ${isRTL ? "flex-row-reverse text-right" : ""}
                      ${isActive ? "bg-primary text-primary-foreground shadow-md" : "hover:bg-secondary text-foreground"}`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isActive ? "bg-white/20" : "bg-primary/10"}`}>
                      <Users className={`w-4 h-4 ${isActive ? "text-white" : "text-primary"}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`font-semibold text-sm truncate ${isActive ? "text-primary-foreground" : ""}`}>{t("broadcastAnnouncement")}</p>
                      <p className={`text-xs truncate ${isActive ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{t("allPilgrimsLabel")}</p>
                    </div>
                    {broadcastUnread > 0 && !isActive && (
                      <span
                        data-testid="badge-unread-broadcast"
                        className="min-w-[20px] h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1 flex-shrink-0"
                      >
                        {broadcastUnread}
                      </span>
                    )}
                  </button>
                );
              })()}

              {/* Individual pilgrim rows — sorted by most recent message */}
              {sortedPilgrims.map((p: Pilgrim) => {
                const isActive = selectedPilgrimId === p.id;
                const unread = getUnread(p.id);
                const last = lastMsgTime[p.id];
                const timeAgoStr = last ? timeAgo(last.time, ar) : null;
                return (
                  <button
                    key={p.id}
                    data-testid={`chat-thread-pilgrim-${p.id}`}
                    onClick={() => selectPilgrim(p.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-start ${isRTL ? "flex-row-reverse text-right" : ""}
                      ${isActive ? "bg-primary text-primary-foreground shadow-md" : unread > 0 ? "bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/30 text-foreground" : "hover:bg-secondary text-foreground"}`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm ${isActive ? "bg-white/20 text-white" : unread > 0 ? "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400" : "bg-primary/10 text-primary"}`}>
                      {p.name.split(" ").map(w => w[0]).slice(0, 2).join("")}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className={`flex items-center justify-between gap-1 ${isRTL ? "flex-row-reverse" : ""}`}>
                        <p className={`font-semibold text-sm truncate ${isActive ? "text-primary-foreground" : ""}`}>{p.name}</p>
                        {timeAgoStr && (
                          <span className={`text-[10px] flex-shrink-0 ${isActive ? "text-primary-foreground/60" : "text-muted-foreground"}`}>{timeAgoStr}</span>
                        )}
                      </div>
                      <p className={`text-xs truncate ${isActive ? "text-primary-foreground/70" : unread > 0 ? "text-foreground/70 font-medium" : "text-muted-foreground"}`}>
                        {last
                          ? (last.fromPilgrim ? "" : (ar ? "أنت: " : "You: ")) + last.text
                          : p.nationality
                        }
                      </p>
                    </div>
                    {unread > 0 && !isActive && (
                      <span
                        data-testid={`badge-unread-pilgrim-${p.id}`}
                        className="min-w-[20px] h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1 flex-shrink-0 shadow-sm"
                      >
                        {unread}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat header */}
        <div className={`h-14 flex-shrink-0 border-b border-border bg-card px-4 flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>

          {/* Toggle button with unread badge */}
          <div className="relative flex-shrink-0">
            <button
              data-testid="button-toggle-chat-sidebar"
              onClick={() => {
                setSidebarOpen(v => !v);
              }}
              className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
              title={sidebarOpen ? (ar ? "إغلاق القائمة" : "Hide list") : (ar ? "فتح القائمة" : "Show list")}
            >
              {sidebarOpen
                ? <PanelLeftClose className="w-5 h-5" />
                : <PanelLeftOpen className="w-5 h-5" />
              }
            </button>
            {/* Unread badge on toggle button */}
            <AnimatePresence>
              {!sidebarOpen && totalUnread > 0 && (
                <motion.span
                  key="unread-badge"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 25 }}
                  data-testid="badge-unread-toggle"
                  className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[9px] font-extrabold flex items-center justify-center px-1 shadow-md pointer-events-none"
                >
                  {totalUnread > 99 ? "99+" : totalUnread}
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            {selectedPilgrimId === null
              ? <Users className="w-4 h-4 text-primary" />
              : <MessageSquare className="w-4 h-4 text-primary" />
            }
          </div>
          <div className={`flex-1 min-w-0 ${isRTL ? "text-right" : ""}`}>
            <p className="font-bold text-sm truncate">{getPilgrimName(selectedPilgrimId)}</p>
            <p className="text-xs text-muted-foreground truncate">
              {selectedPilgrimId === null ? t("allPilgrimsLabel") : `${t("sendingTo")} ${getPilgrimName(selectedPilgrimId)}`}
            </p>
          </div>

          {/* WS connection status */}
          <div
            data-testid="status-ws-connection"
            title={wsConnected ? (ar ? "متصل — رسائل فورية" : "Connected — live") : (ar ? "غير متصل — يعيد الاتصال..." : "Reconnecting...")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold flex-shrink-0 border transition-colors ${
              wsConnected
                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                : "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800"
            }`}
          >
            {wsConnected
              ? <><Wifi className="w-3 h-3" />{ar ? "مباشر" : "Live"}</>
              : <><WifiOff className="w-3 h-3" />{ar ? "يتصل..." : "..."}</>
            }
          </div>

          {/* Open sidebar shortcut when hidden */}
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              data-testid="button-open-chat-sidebar-badge"
              className={`flex items-center gap-1.5 px-3 py-1.5 bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold rounded-lg border border-border transition-colors flex-shrink-0 ${isRTL ? "flex-row-reverse" : ""}`}
            >
              <Users className="w-3.5 h-3.5" />
              {ar ? "قائمة الحجاج" : "Pilgrim list"}
              {totalUnread > 0 && (
                <span className="min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[9px] font-extrabold flex items-center justify-center px-1">
                  {totalUnread > 99 ? "99+" : totalUnread}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Login notification banner */}
        <AnimatePresence>
          {loginNotif && (
            <motion.div
              key="login-notif"
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
              data-testid="banner-login-notification"
              className={`flex items-start gap-3 px-4 py-3 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800 ${isRTL ? "flex-row-reverse text-right" : ""}`}
            >
              <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bell className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-amber-800 dark:text-amber-300">
                  {ar
                    ? `📨 لديك ${loginNotif.count} رسالة غير مقروءة`
                    : `📨 You have ${loginNotif.count} unread message${loginNotif.count > 1 ? "s" : ""}`
                  }
                </p>
                {loginNotif.names.length > 0 && (
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                    {ar
                      ? `من: ${loginNotif.names.join("، ")}${loginNotif.count > loginNotif.names.length ? " وآخرين" : ""}`
                      : `From: ${loginNotif.names.join(", ")}${loginNotif.count > loginNotif.names.length ? " and others" : ""}`
                    }
                  </p>
                )}
                <button
                  data-testid="button-open-from-notif"
                  onClick={() => { setSidebarOpen(true); setLoginNotif(null); }}
                  className="mt-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-200 underline underline-offset-2 transition-colors"
                >
                  {ar ? "عرض الرسائل ←" : "View messages →"}
                </button>
              </div>
              <button
                data-testid="button-dismiss-notif"
                onClick={() => setLoginNotif(null)}
                className="p-1 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-600 dark:text-amber-400 transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-background/50">
          {displayMessages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
              <MessageSquare className="w-12 h-12 opacity-20" />
              <p className="font-medium">{t("noMessages")}</p>
            </div>
          )}

          <AnimatePresence initial={false}>
            {displayMessages.map((msg) => {
              const isSupervisor = msg.senderRole === "supervisor";
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${isSupervisor ? (isRTL ? "flex-row" : "flex-row-reverse") : (isRTL ? "flex-row-reverse" : "flex-row")}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${isSupervisor ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}>
                    {isSupervisor ? "AS" : (msg.pilgrimId ? getPilgrimName(msg.pilgrimId).slice(0, 2).toUpperCase() : "H")}
                  </div>
                  <div className={`max-w-[70%] flex flex-col gap-1 ${isSupervisor ? (isRTL ? "items-start" : "items-end") : (isRTL ? "items-end" : "items-start")}`}>
                    <p className="text-[10px] text-muted-foreground font-medium">
                      {isSupervisor ? t("supervisorLabel") : (msg.pilgrimId ? getPilgrimName(msg.pilgrimId) : t("pilgrimLabel"))}
                    </p>
                    <div className={`px-4 py-2.5 rounded-2xl text-sm font-medium leading-relaxed ${
                      isSupervisor
                        ? "bg-primary text-primary-foreground rounded-ee-sm"
                        : "bg-card border border-border text-foreground rounded-es-sm"
                    }`}>
                      {msg.message}
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      {msg.timestamp ? format(new Date(msg.timestamp), "HH:mm") : ""}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className={`p-4 border-t border-border bg-card flex items-end gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
          <div className="flex-1 relative">
            <textarea
              data-testid="input-chat-message"
              rows={1}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={selectedPilgrimId === null ? `${t("broadcastAnnouncement")}...` : t("typeMessage")}
              dir={isRTL ? "rtl" : "ltr"}
              className={`w-full resize-none rounded-xl border-2 border-border bg-background px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all max-h-32 overflow-auto ${isRTL ? "text-right" : ""}`}
              style={{ minHeight: 48 }}
            />
          </div>
          <button
            data-testid="button-send-chat"
            onClick={handleSend}
            disabled={!input.trim() || sendMessage.isPending}
            className={`h-12 px-5 bg-primary text-primary-foreground rounded-xl font-bold flex items-center gap-2 disabled:opacity-50 hover:bg-primary/90 transition-colors flex-shrink-0 ${isRTL ? "flex-row-reverse" : ""}`}
          >
            <Send className="w-4 h-4" />
            {t("send")}
          </button>
        </div>
      </div>
    </div>
  );
}
