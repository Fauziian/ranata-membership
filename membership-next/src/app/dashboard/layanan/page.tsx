"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  Send, Paperclip, X, Image as ImageIcon, Check, ChevronRight, 
  MessageCircle, Inbox, Sparkles, AlertCircle
} from "lucide-react";
import { getServicesList, getInitMessages } from "@/lib/data-fetchers";
import { memberApi, getToken } from "@/lib/api";
import { toast } from "sonner";

interface ChatMessage {
  id: number;
  sender: "customer" | "admin";
  text: string;
  time: string;
  imageUrl?: string;
}

export default function ChatLayananPage() {
  const router = useRouter();
  
  // Load services list
  const services = getServicesList();
  
  // State for user profile
  const [userName, setUserName] = useState<string>("Ahmad Fauzi");
  const [userTier, setUserTier] = useState<string>("Bronze");
  const [memberId, setMemberId] = useState<string>("RT-2024-001");
  const [loading, setLoading] = useState<boolean>(true);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [selectedSvc, setSelectedSvc] = useState<string | null>(null);
  const [isInitialLoaded, setIsInitialLoaded] = useState(false);
  const prevMsgLengthRef = useRef(0);

  // File attachments state (local preview only)
  const [attachment, setAttachment] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Messages container ref for scrolling
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  // Timers ref for cleanup
  const timersRef = useRef<NodeJS.Timeout[]>([]);

  // Fetch profile and chat session on load
  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/auth");
      return;
    }

    const fetchProfileAndChat = async () => {
      try {
        const res = await memberApi.getProfile();
        if (res.success && res.data) {
          const profileData = res.data;
          setUserName(profileData.name);
          setUserTier(profileData.tier || "Bronze");
          const mId = profileData.member_id || "RT-XXXX-XXX";
          setMemberId(mId);

          const chatRes = await memberApi.getChat();
          if (chatRes.success && chatRes.data) {
            setMessages(chatRes.data.messages || []);
            if (chatRes.data.active_service) {
              setSelectedSvc(chatRes.data.active_service);
            }
          }
          setIsInitialLoaded(true);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileAndChat();
  }, [router]);

  // Real-time synchronization interval with Laravel API (every 2 seconds)
  useEffect(() => {
    if (!memberId || memberId === "RT-XXXX-XXX") return;

    const syncMessages = async () => {
      try {
        const chatRes = await memberApi.getChat();
        if (chatRes.success && chatRes.data) {
          const newMsgs = chatRes.data.messages || [];
          setMessages(prev => {
            if (JSON.stringify(prev) !== JSON.stringify(newMsgs)) {
              return newMsgs;
            }
            return prev;
          });
          if (chatRes.data.active_service) {
            setSelectedSvc(chatRes.data.active_service);
          }
        }
      } catch (e) {
        console.error("Failed to sync chat messages:", e);
      }
    };

    const interval = setInterval(syncMessages, 2000);

    return () => {
      clearInterval(interval);
    };
  }, [memberId]);

  // Auto-scroll to the bottom when messages count increases or initial load completes
  useEffect(() => {
    if (messages.length > 0) {
      if (!isInitialLoaded || messages.length > prevMsgLengthRef.current) {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTo({
            top: messagesContainerRef.current.scrollHeight,
            behavior: "smooth"
          });
        }
      }
      prevMsgLengthRef.current = messages.length;
    }
  }, [messages, isInitialLoaded]);

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Ukuran file gambar maksimal 5MB");
        return;
      }
      setAttachment(file);
      setAttachmentPreview(URL.createObjectURL(file));
    }
  };

  const removeAttachment = () => {
    setAttachment(null);
    if (attachmentPreview) {
      URL.revokeObjectURL(attachmentPreview);
      setAttachmentPreview(null);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSend = async () => {
    if (!input.trim() && !attachment) return;

    const now = new Date().toLocaleTimeString("id-ID", { 
      hour: "2-digit", 
      minute: "2-digit" 
    });

    const typedText = input.trim();
    setInput("");
    setAttachment(null);
    setAttachmentPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";

    try {
      const res = await memberApi.sendChatMessage(typedText, now, attachmentPreview || undefined);
      if (res.success && res.data) {
        setMessages(res.data.messages || []);
        toast.success("Pesan terkirim ke admin");
      } else {
        toast.error(res.message || "Gagal mengirim pesan");
      }
    } catch (e) {
      console.error(e);
      toast.error("Gagal mengirim pesan");
    }
  };

  const handleServiceSelect = async (serviceLabel: string) => {
    setSelectedSvc(serviceLabel);
    const now = new Date().toLocaleTimeString("id-ID", { 
      hour: "2-digit", 
      minute: "2-digit" 
    });

    try {
      const res = await memberApi.selectService(serviceLabel, now);
      if (res.success && res.data) {
        setMessages(res.data.messages || []);
        toast.info(`Request layanan ${serviceLabel} ditambahkan ke chat`);
      } else {
        toast.error(res.message || "Gagal memilih layanan");
      }
    } catch (e) {
      console.error(e);
      toast.error("Gagal memilih layanan");
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-[#800000] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-xs text-muted-foreground font-semibold">Memuat Ruang Layanan Chat...</p>
      </div>
    );
  }

  const isBronze = userTier.toLowerCase() === "bronze";

  return (
    <div className="max-w-7xl mx-auto px-6 pt-4 pb-6 flex flex-col md:h-[calc(100vh-56px)] md:overflow-hidden">
      {/* Back Button */}
      <button
        onClick={() => router.push("/dashboard")}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-4 transition-colors flex-shrink-0"
      >
        <ChevronRight className="w-4 h-4 rotate-180" />
        Kembali ke Dashboard
      </button>

      {/* ─── DYNAMIC TIER BANNER FOR BOOKING ─── */}
      {isBronze ? (
        <div className="mb-4 p-4 rounded-2xl border border-red-200 bg-red-50/20 text-xs text-red-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 flex-shrink-0">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>
              <strong>🔴 Status Bronze</strong> • Anda dapat memesan layanan tiket/hotel via chat, tetapi <strong>tidak mendapatkan poin bonus, free airport transport, maupun airport handling</strong>. Beli paket membership Silver/Gold/Platinum sebelum booking untuk mengaktifkan benefit instan!
            </span>
          </div>
          <button 
            onClick={() => router.push("/dashboard/membership")} 
            className="text-[10px] font-bold text-white bg-red-650 hover:bg-red-700 px-3.5 py-1.5 rounded-xl transition-colors shrink-0 whitespace-nowrap shadow-sm"
          >
            Upgrade Membership
          </button>
        </div>
      ) : (
        <div className="mb-4 p-4 rounded-2xl border border-green-200 bg-green-50/25 text-xs text-green-800 flex items-center gap-2.5 flex-shrink-0">
          <Sparkles className="w-4.5 h-4.5 text-green-700 shrink-0" />
          <span>
            <strong>✅ Benefit Aktif ({userTier})</strong> • Pemesanan Anda otomatis terintegrasi dengan poin multiplier dan fasilitas handling fisik Ranata Tour (Airport/Hotel handling sesuai paket membership Anda).
          </span>
        </div>
      )}

      <div 
        className="grid md:grid-cols-3 gap-6 rounded-3xl border border-border bg-white overflow-hidden shadow-xs md:flex-1 md:min-h-0"
      >
        {/* Left Sidebar: Service Selector */}
        <div className="border-r border-border flex flex-col h-full min-h-0 bg-secondary/10">
          <div className="pt-6 pb-4 px-5 border-b border-border bg-white flex-shrink-0">
            <h3 className="font-bold text-sm text-foreground" style={{ fontFamily: "Montserrat, sans-serif" }}>
              Pilih Layanan
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Request & booking langsung via chat ke admin
            </p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3.5 space-y-1.5">
            {services.map(s => {
              const ServiceIcon = s.icon;
              const isSelected = selectedSvc === s.label;
              
              return (
                <button 
                  key={s.label} 
                  onClick={() => handleServiceSelect(s.label)} 
                  className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl text-left transition-all border ${
                    isSelected 
                      ? "border-primary bg-white shadow-xs" 
                      : "border-transparent hover:bg-white/60 bg-transparent"
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(128,0,0,0.08)" }}>
                    <ServiceIcon className="w-3.5 h-3.5" style={{ color: "#800000" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-foreground truncate">{s.label}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{s.desc}</div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-primary ml-auto flex-shrink-0" />}
                </button>
              );
            })}
          </div>

          <div className="p-4 border-t border-border bg-white flex-shrink-0 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-xs font-semibold text-muted-foreground">Admin Rina sedang online</span>
          </div>
        </div>

        {/* Right Section: Chat Interface */}
        <div className="md:col-span-2 flex flex-col h-full min-h-0 overflow-hidden bg-background/35">
          {/* Chat Header */}
          <div className="pt-6 pb-4 px-5 border-b border-border bg-white flex items-center gap-3.5 flex-shrink-0">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-xs" style={{ background: "#800000" }}>
              R
            </div>
            <div>
              <div className="font-bold text-sm text-foreground" style={{ fontFamily: "Montserrat, sans-serif" }}>
                Admin Ranata Tour
              </div>
              <div className="flex items-center gap-1 text-[11px] text-green-600 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                Online
              </div>
            </div>
            <div className="ml-auto text-xs text-muted-foreground bg-secondary/80 border border-border rounded-xl px-3 py-1.5 font-semibold">
              {memberId} • {userTier}
            </div>
          </div>

          {/* Messages Area */}
          <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-6 space-y-5">
            {messages.length > 0 ? (
              messages.map(m => {
                const isCustomer = m.sender === "customer";
                const isSystem = (m.sender as string) === "system";

                if (isSystem) {
                  return (
                    <div key={m.id} className="flex justify-center my-2 select-none animate-in fade-in zoom-in-95 duration-150">
                      <div className="bg-secondary/80 text-muted-foreground text-[10px] font-semibold px-3.5 py-1.5 rounded-full border border-border flex items-center gap-1.5">
                        <AlertCircle className="w-3 h-3 text-muted-foreground" />
                        <span>{m.text}</span>
                      </div>
                    </div>
                  );
                }
                
                return (
                  <div key={m.id} className={`flex ${isCustomer ? "justify-end" : "justify-start"}`}>
                    {!isCustomer && (
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold mr-2.5 mt-auto flex-shrink-0 shadow-xs" style={{ background: "#800000" }}>
                        R
                      </div>
                    )}
                    <div 
                      className={`max-w-md rounded-2xl px-4.5 py-3 text-sm shadow-xs ${
                        isCustomer 
                          ? "text-white rounded-br-none" 
                          : "bg-white text-foreground rounded-bl-none border border-border"
                      }`}
                      style={isCustomer ? { background: "#800000" } : {}}
                    >
                      {/* Image render if present */}
                      {m.imageUrl && (
                        <div className="mb-2 max-w-xs overflow-hidden rounded-xl border border-white/20">
                          <img src={m.imageUrl} alt="Chat Attachment" className="w-full object-cover max-h-48" />
                        </div>
                      )}
                      
                      <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>
                      <p className={`text-[10px] mt-1.5 font-medium ${
                        isCustomer ? "text-white/60 text-right" : "text-muted-foreground"
                      }`}>
                        {m.time}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              /* Empty state if all messages cleared */
              <div className="h-full flex flex-col items-center justify-center text-center">
                <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center mb-3">
                  <Inbox className="w-7 h-7 text-muted-foreground" />
                </div>
                <h3 className="font-bold text-sm text-foreground">Mulai Request Layanan</h3>
                <p className="text-xs text-muted-foreground max-w-xs mt-1">
                  Kirimkan detail kebutuhan tiket, hotel, atau transportasi Anda pada chatbox.
                </p>
              </div>
            )}
            {/* Scroll Anchor */}
          </div>

          {/* Chat Input Bar */}
          <div className="p-4 border-t border-border bg-white flex-shrink-0">
            {/* Attachment preview panel */}
            {attachmentPreview && (
              <div className="mb-3 p-2 bg-secondary/50 rounded-2xl border border-border flex items-center gap-3 max-w-sm animate-in fade-in slide-in-from-bottom-1 duration-150">
                <div className="w-12 h-12 rounded-xl overflow-hidden border border-border relative flex-shrink-0 bg-white">
                  <img src={attachmentPreview} alt="Upload Preview" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-foreground truncate">{attachment?.name}</div>
                  <div className="text-[10px] text-muted-foreground font-mono">{(attachment!.size / 1024).toFixed(1)} KB</div>
                </div>
                <button 
                  onClick={removeAttachment}
                  className="p-1.5 rounded-full hover:bg-secondary border border-border/80 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="flex items-end gap-3">
              {/* Attachment trigger button */}
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-11 h-11 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-colors flex-shrink-0"
                title="Unggah Gambar"
              >
                <Paperclip className="w-5 h-5" />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleAttachmentChange}
              />

              <textarea 
                value={input} 
                onChange={e => setInput(e.target.value)} 
                onKeyDown={e => { 
                  if (e.key === "Enter" && !e.shiftKey) { 
                    e.preventDefault(); 
                    handleSend(); 
                  } 
                }}
                placeholder="Tulis pesan Anda disini (Contoh: Butuh tiket pesawat ke Lombok...)" 
                className="flex-1 border border-border rounded-xl px-4 py-3 text-sm resize-none outline-none focus:border-primary transition-colors min-h-[44px] max-h-24" 
                rows={1} 
              />
              
              <button 
                onClick={handleSend} 
                disabled={!input.trim() && !attachment}
                className={`w-11 h-11 rounded-xl flex items-center justify-center text-white transition-all flex-shrink-0 ${
                  (input.trim() || attachment) ? "hover:opacity-90 active:scale-98" : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
                style={(input.trim() || attachment) ? { background: "#800000" } : {}}
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
