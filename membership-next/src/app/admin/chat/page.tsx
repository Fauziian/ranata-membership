"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Send, Bot, User, Clock, Search, MessageSquare, 
  Sparkles, ShieldAlert, ArrowLeft, BrainCircuit
} from "lucide-react";
import { toast } from "sonner";
import { adminApi } from "@/lib/api";

interface ChatMessage {
  id: number;
  sender: "customer" | "admin" | "system";
  text: string;
  time: string;
  imageUrl?: string;
}

interface ChatSession {
  member_id: string;
  user_name: string;
  user_tier: string;
  active_service: string | null;
  is_handled_by_ai: boolean;
  last_message_time: number;
  last_admin_reply_time: number | null;
  messages: ChatMessage[];
}

export default function AdminChatPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [replyInput, setReplyInput] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const prevMsgCountRef = useRef(0);
  const prevSessionIdRef = useRef<string | null>(null);

  // Load and sync sessions from Laravel API
  const loadSessions = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const res = await adminApi.getChats();
      if (res.success && res.data) {
        const newSessions = res.data;
        setSessions(prev => {
          if (JSON.stringify(prev) !== JSON.stringify(newSessions)) {
            return newSessions;
          }
          return prev;
        });
      }
    } catch (e) {
      console.error("Failed to load chat sessions:", e);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions(true);
    const interval = setInterval(() => loadSessions(false), 2000);
    return () => clearInterval(interval);
  }, []);

  // Auto scroll to bottom of chat
  useEffect(() => {
    const selectedSession = sessions.find(s => s.member_id === selectedSessionId);
    if (selectedSession) {
      const msgCount = selectedSession.messages ? selectedSession.messages.length : 0;
      const sessionChanged = prevSessionIdRef.current !== selectedSessionId;
      
      if (sessionChanged || msgCount > prevMsgCountRef.current) {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
      }
      prevMsgCountRef.current = msgCount;
      prevSessionIdRef.current = selectedSessionId;
    } else {
      prevMsgCountRef.current = 0;
      prevSessionIdRef.current = null;
    }
  }, [selectedSessionId, sessions]);

  // Send admin manual response
  const handleSendReply = async () => {
    if (!selectedSessionId || !replyInput.trim()) return;

    const nowTime = new Date().toLocaleTimeString("id-ID", { 
      hour: "2-digit", 
      minute: "2-digit" 
    });

    const textToSend = replyInput.trim();
    setReplyInput("");

    try {
      const res = await adminApi.sendChatMessage(selectedSessionId, textToSend, nowTime);
      if (res.success && res.data) {
        // Update local session data immediately
        setSessions(prev => prev.map(s => s.member_id === selectedSessionId ? res.data : s));
        toast.success("Pesan admin terkirim!");
      } else {
        toast.error("Gagal mengirim pesan");
      }
    } catch (e) {
      console.error(e);
      toast.error("Gagal mengirim pesan");
    }
  };

  // Toggle AI Mode manually from admin panel
  const toggleAIMode = async (memberId: string, setAI: boolean) => {
    try {
      const res = await adminApi.toggleAI(memberId, setAI);
      if (res.success && res.data) {
        setSessions(prev => prev.map(s => s.member_id === memberId ? res.data : s));
        toast.success(setAI ? "AI Agent Aktif" : "Ambil Alih Manual Aktif");
      }
    } catch (e) {
      console.error(e);
      toast.error("Gagal mengubah mode");
    }
  };

  // Simulate 1 hour of inactivity/idle time immediately for testing
  const simulateOneHourIdle = async (memberId: string) => {
    try {
      const res = await adminApi.simulateIdle(memberId);
      if (res.success && res.data) {
        setSessions(prev => prev.map(s => s.member_id === memberId ? res.data : s));
        toast.info("Simulasi 1 jam berlalu berhasil dilakukan!");
      }
    } catch (e) {
      console.error(e);
      toast.error("Gagal menjalankan simulasi");
    }
  };

  // Filtered sessions based on search query
  const filteredSessions = sessions.filter(s => 
    s.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.member_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedSession = sessions.find(s => s.member_id === selectedSessionId);

  // Helper colors for member tiers
  const getTierColor = (tier: string) => {
    const t = tier.toLowerCase();
    if (t === "platinum") return "border-red-200 bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400";
    if (t === "gold") return "border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400";
    if (t === "silver") return "border-slate-200 bg-slate-50 text-slate-700 dark:bg-slate-900/20 dark:text-slate-400";
    return "border-gray-200 bg-gray-50 text-gray-700 dark:bg-gray-800/20 dark:text-gray-400";
  };

  return (
    <div className="max-w-7xl mx-auto px-6 pt-4 pb-6 flex flex-col md:h-[calc(100vh-56px)] md:overflow-hidden">
      {/* Title & Subtitle */}
      <div className="mb-4 flex-shrink-0">
        <h1 className="text-xl font-bold text-foreground" style={{ fontFamily: "Montserrat, sans-serif" }}>
          Layanan Chat Pelanggan
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Kelola chat dari member Ranata Tour, pantau status respon AI Agent, dan ambil alih kontrol manual jika diperlukan.
        </p>
      </div>

      {/* Main Grid Workspace */}
      <div className="grid md:grid-cols-3 gap-6 rounded-3xl border border-border bg-white overflow-hidden shadow-xs md:flex-1 md:min-h-0">
        {/* Left Side: Sessions Directory */}
        <div className="border-r border-border flex flex-col h-full min-h-0 bg-secondary/10">
          <div className="p-4 border-b border-border bg-white flex-shrink-0">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <input
                type="text"
                placeholder="Cari member / ID..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-border rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-background/50"
              />
            </div>
          </div>

          {/* Sessions List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {loading ? (
              <div className="py-12 text-center text-muted-foreground flex flex-col items-center justify-center">
                <div className="w-8 h-8 border-4 border-[#800000] border-t-transparent rounded-full animate-spin mb-3"></div>
                <p className="text-xs font-semibold">Memuat chat...</p>
              </div>
            ) : filteredSessions.length > 0 ? (
              filteredSessions.map(s => {
                const isSelected = selectedSessionId === s.member_id;
                const lastMsg = s.messages && s.messages.length > 0 ? s.messages[s.messages.length - 1] : null;
                
                // Determine status badge
                let statusLabel = "AI Agent";
                let statusBg = "bg-blue-50 text-blue-700 border-blue-100";
                if (!s.is_handled_by_ai) {
                  if (lastMsg && lastMsg.sender === "customer") {
                    statusLabel = "Butuh Respon";
                    statusBg = "bg-amber-50 text-amber-700 border-amber-200 animate-pulse";
                  } else {
                    statusLabel = "Manual Admin";
                    statusBg = "bg-emerald-50 text-emerald-700 border-emerald-100";
                  }
                }

                return (
                  <button
                    key={s.member_id}
                    onClick={() => setSelectedSessionId(s.member_id)}
                    className={`w-full flex items-start gap-3 p-3 rounded-2xl text-left transition-all border ${
                      isSelected 
                        ? "border-primary bg-white shadow-xs" 
                        : "border-transparent hover:bg-white/60 bg-transparent"
                    }`}
                  >
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs flex-shrink-0">
                      {s.user_name.charAt(0)}
                    </div>
                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1.5 mb-1">
                        <span className="text-xs font-bold text-foreground truncate">{s.user_name}</span>
                        <span className="text-[9px] text-muted-foreground whitespace-nowrap">{lastMsg?.time || ""}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className={`text-[8.5px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider border ${getTierColor(s.user_tier)}`}>
                          {s.user_tier}
                        </span>
                        <span className={`text-[8.5px] px-1.5 py-0.5 rounded-md font-bold border ${statusBg}`}>
                          {statusLabel}
                        </span>
                      </div>
                      {s.active_service && (
                        <div className="text-[10px] text-primary font-semibold mb-1 truncate">
                          🎯 {s.active_service}
                        </div>
                      )}
                      <div className="text-[11px] text-muted-foreground truncate">
                        {lastMsg ? lastMsg.text : "Belum ada pesan."}
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="py-12 text-center text-muted-foreground flex flex-col items-center justify-center">
                <MessageSquare className="w-8 h-8 text-muted-foreground/50 mb-2" />
                <p className="text-xs font-semibold">Tidak ada chat ditemukan</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Conversation Workspace */}
        <div className="md:col-span-2 flex flex-col h-full min-h-0 overflow-hidden bg-background/35">
          {selectedSession ? (
            <>
              {/* Active Header */}
              <div className="pt-4 pb-3 px-5 border-b border-border bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold shadow-xs">
                    {selectedSession.user_name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-foreground" style={{ fontFamily: "Montserrat, sans-serif" }}>
                      {selectedSession.user_name}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-muted-foreground font-mono">{selectedSession.member_id}</span>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded-md font-bold uppercase border ${getTierColor(selectedSession.user_tier)}`}>
                        {selectedSession.user_tier}
                      </span>
                    </div>
                  </div>
                </div>

                {/* AI / Manual Controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleAIMode(selectedSession.member_id, !selectedSession.is_handled_by_ai)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-xs ${
                      selectedSession.is_handled_by_ai
                        ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                    }`}
                  >
                    {selectedSession.is_handled_by_ai ? (
                      <>
                        <Bot className="w-3.5 h-3.5" />
                        <span>AI Agent Aktif</span>
                      </>
                    ) : (
                      <>
                        <User className="w-3.5 h-3.5" />
                        <span>Kontrol Manual</span>
                      </>
                    )}
                  </button>

                  {/* Simulate Inactivity Button */}
                  {!selectedSession.is_handled_by_ai && (
                    <button
                      onClick={() => simulateOneHourIdle(selectedSession.member_id)}
                      title="Simulasikan 1 Jam tanpa balasan Admin untuk mengembalikan ke AI Agent"
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-amber-200 bg-amber-50/50 hover:bg-amber-100 text-amber-700 text-xs font-bold transition-all shadow-xs"
                    >
                      <Clock className="w-3.5 h-3.5 animate-pulse" />
                      <span className="hidden sm:inline">Simulasi 1 Jam Diam</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Messages viewport */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {selectedSession.messages && selectedSession.messages.map((m) => {
                  const isAdmin = m.sender === "admin";
                  const isSystem = m.sender === "system";

                  if (isSystem) {
                    return (
                      <div key={m.id} className="flex justify-center my-2 animate-in fade-in zoom-in-95">
                        <div className="bg-amber-50 text-amber-800 text-[10px] font-semibold px-3.5 py-1.5 rounded-full border border-amber-200 flex items-center gap-1.5">
                          <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                          <span>{m.text}</span>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={m.id} className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
                      {!isAdmin && (
                        <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-[10px] font-bold mr-2.5 mt-auto flex-shrink-0 shadow-xs">
                          {selectedSession.user_name.charAt(0)}
                        </div>
                      )}
                      <div
                        className={`max-w-md rounded-2xl px-4.5 py-3 text-sm shadow-xs ${
                          isAdmin
                            ? "text-white rounded-br-none"
                            : "bg-white text-foreground rounded-bl-none border border-border"
                        }`}
                        style={isAdmin ? { background: "#800000" } : {}}
                      >
                        {m.imageUrl && (
                          <div className="mb-2 max-w-xs overflow-hidden rounded-xl border border-white/20">
                            <img src={m.imageUrl} alt="Chat Attachment" className="w-full object-cover max-h-48" />
                          </div>
                        )}
                        <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>
                        <p className={`text-[10px] mt-1.5 font-medium ${isAdmin ? "text-white/60 text-right" : "text-muted-foreground"}`}>
                          {m.time}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply Input Area */}
              <div className="p-4 border-t border-border bg-white flex-shrink-0">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder={
                      selectedSession.is_handled_by_ai
                        ? "Ketik untuk menjawab manual (otomatis mematikan AI Agent)..."
                        : "Ketik balasan Anda disini..."
                    }
                    value={replyInput}
                    onChange={e => setReplyInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter") handleSendReply();
                    }}
                    className="flex-1 px-4 py-3 border border-border rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-background/50"
                  />
                  <button
                    onClick={handleSendReply}
                    className="h-10 w-10 bg-primary hover:bg-primary-dark text-white rounded-xl flex items-center justify-center transition-colors shadow-sm flex-shrink-0"
                    style={{ background: "#800000" }}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                {selectedSession.is_handled_by_ai && (
                  <p className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1">
                    <BrainCircuit className="w-3.5 h-3.5 text-blue-500" />
                    <span>AI Agent sedang aktif. Mengirim pesan akan otomatis menonaktifkan AI Agent dan masuk mode Kontrol Manual.</span>
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                <MessageSquare className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-bold text-sm text-foreground">Pilih Chat Pelanggan</h3>
              <p className="text-xs text-muted-foreground max-w-xs mt-1">
                Silakan pilih salah satu member dari menu direktori di sebelah kiri untuk melihat percakapan dan status respon.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
