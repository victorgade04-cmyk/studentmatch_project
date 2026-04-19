"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getOrCreateConversation, getOrCreateConversationAdmin, sendMessage } from "./actions";

type Conversation = {
  id: string;
  student_id: string | null;
  company_id: string | null;
  admin_participant_id: string | null;
  updated_at: string;
  other_name?: string;
};

type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

export default function MessagesPage() {
  const searchParams = useSearchParams();
  const withUserId = searchParams.get("with");
  const adminTargetUserId = searchParams.get("user");

  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [sendError, setSendError] = useState<string | null>(null);
  const [initError, setInitError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      setUserId(user.id);
      const role = user.user_metadata?.role ?? user.app_metadata?.role ?? null;
      setUserRole(role);

      const convs = await loadConversations(user.id, supabase);

      if (adminTargetUserId && role === "admin") {
        const result = await getOrCreateConversationAdmin(adminTargetUserId);
        if ("conversationId" in result) {
          const fresh = await loadConversations(user.id, supabase);
          const conv = fresh.find(c => c.id === result.conversationId) ?? null;
          setSelectedConv(conv);
        } else {
          setInitError(result.error);
        }
      } else if (withUserId) {
        const result = await getOrCreateConversation(withUserId);
        if ("conversationId" in result) {
          const fresh = await loadConversations(user.id, supabase);
          const conv = fresh.find(c => c.id === result.conversationId) ?? null;
          setSelectedConv(conv);
        } else {
          setInitError(result.error);
        }
      } else if (convs.length > 0) {
        setSelectedConv(convs[0]);
      }
    });
  }, [withUserId, adminTargetUserId]);

  async function loadConversations(uid: string, supabase: ReturnType<typeof createClient>): Promise<Conversation[]> {
    const { data } = await supabase
      .from("conversations")
      .select("id, student_id, company_id, admin_participant_id, updated_at")
      .or(`student_id.eq.${uid},company_id.eq.${uid},admin_participant_id.eq.${uid}`)
      .order("updated_at", { ascending: false });

    const raw = (data as Conversation[]) || [];

    const withNames = await Promise.all(raw.map(async (conv) => {
      const otherId = conv.admin_participant_id === uid
        ? (conv.student_id || conv.company_id)
        : (conv.student_id !== uid ? conv.student_id : conv.company_id);
      if (!otherId) return conv;

      const { data: sp } = await supabase.from("student_profiles").select("full_name").eq("id", otherId).maybeSingle();
      if (sp?.full_name) return { ...conv, other_name: sp.full_name };

      const { data: cp } = await supabase.from("company_profiles").select("company_name").eq("id", otherId).maybeSingle();
      if (cp?.company_name) return { ...conv, other_name: cp.company_name };

      return conv;
    }));

    setConversations(withNames);
    setLoadingConvs(false);
    return withNames;
  }

  useEffect(() => {
    if (!selectedConv) return;
    const supabase = createClient();

    supabase.from("messages").select("*").eq("conversation_id", selectedConv.id)
      .order("created_at", { ascending: true })
      .then(({ data }) => setMessages((data as Message[]) || []));

    const channel = supabase.channel(`msgs:${selectedConv.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${selectedConv.id}` },
        (payload) => setMessages((prev) => [...prev, payload.new as Message]))
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedConv?.id]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || !selectedConv || sending) return;
    setSending(true);
    setSendError(null);
    setDraft("");
    const result = await sendMessage(selectedConv.id, text);
    if (result.error) { setSendError(result.error); setDraft(text); }
    else {
      // Manually reload messages in case WebSocket is down
      const supabase = createClient();
      const { data } = await supabase.from("messages").select("*")
        .eq("conversation_id", selectedConv.id)
        .order("created_at", { ascending: true });
      if (data) setMessages(data as Message[]);
    }
    setSending(false);
    inputRef.current?.focus();
  };

  function getOtherName(conv: Conversation): string {
    return conv.other_name || (userRole === "student" ? "Virksomhed" : userRole === "company" ? "Kandidat" : "Bruger");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <aside className="w-64 flex-shrink-0 border-r border-gray-100 bg-white flex flex-col">
        <div className="px-5 py-4 border-b border-gray-100">
          <h1 className="font-black text-gray-900 text-base">Beskeder</h1>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loadingConvs ? <p className="p-5 text-sm text-gray-400">Indlæser…</p> :
            conversations.length === 0 ? <p className="p-5 text-sm text-gray-400">Ingen samtaler endnu.</p> :
            conversations.map((conv) => (
              <button key={conv.id} onClick={() => setSelectedConv(conv)}
                className={`w-full text-left px-5 py-3.5 border-b border-gray-50 hover:bg-gray-50 transition-colors ${selectedConv?.id === conv.id ? "bg-gray-50 border-l-2 border-l-gray-900" : ""}`}>
                <p className="text-sm font-semibold text-gray-900 truncate">{getOtherName(conv)}</p>
                <p className="text-xs text-gray-400 mt-0.5">{new Date(conv.updated_at).toLocaleDateString("da-DK", { day: "numeric", month: "short" })}</p>
              </button>
            ))
          }
        </div>
      </aside>

      {selectedConv ? (
        <div className="flex-1 flex flex-col min-w-0">
          <div className="px-6 py-4 border-b border-gray-100 bg-white flex-shrink-0">
            <p className="font-bold text-gray-900">{getOtherName(selectedConv)}</p>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-3">
            {messages.length === 0 && <p className="text-center text-sm text-gray-400 py-8">Ingen beskeder endnu. Send den første besked!</p>}
            {messages.map((msg) => {
              const isMe = msg.sender_id === userId;
              return (
                <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm ${isMe ? "bg-gray-900 text-white" : "bg-white border border-gray-100 text-gray-800 shadow-sm"}`}>
                    <p>{msg.content}</p>
                    <p className="text-xs mt-1.5 opacity-60">{new Date(msg.created_at).toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
          <div className="p-4 border-t border-gray-100 bg-white flex-shrink-0">
            {sendError && <p className="text-xs text-red-600 mb-2">{sendError}</p>}
            <div className="flex gap-3">
              <input ref={inputRef} type="text" value={draft} onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Skriv en besked…"
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 placeholder-gray-400" />
              <button onClick={handleSend} disabled={!draft.trim() || sending}
                className="px-5 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 disabled:opacity-40 transition-colors">
                {sending ? "…" : "Send"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          {initError ? <p className="text-sm text-red-500">{initError}</p> : <p className="text-sm text-gray-400">Vælg en samtale for at begynde</p>}
        </div>
      )}
    </div>
  );
}
