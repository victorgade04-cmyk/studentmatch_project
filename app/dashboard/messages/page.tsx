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
  student_profiles: { full_name: string | null } | null;
  company_profiles: { company_name: string | null } | null;
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
  // ?with= is used by student/company flows; ?user= is used by admin
  const withUserId = searchParams.get("with");
  const adminTargetUserId = searchParams.get("user");

  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [sendError, setSendError] = useState<string | null>(null);
  const [initError, setInitError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load user + conversations, handle ?with= and ?user= params
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      setUserId(user.id);
      const role = user.user_metadata?.role ?? null;
      setUserRole(role);

      const convs = await loadConversations(user.id, supabase);

      if (adminTargetUserId && role === "admin") {
        // Admin flow: get or create conversation with any user
        const result = await getOrCreateConversationAdmin(adminTargetUserId);
        if ("conversationId" in result) {
          setSelectedId(result.conversationId);
          await loadConversations(user.id, supabase);
        } else {
          setInitError(result.error);
        }
      } else if (withUserId) {
        // Student/company flow: get or create conversation between roles
        const result = await getOrCreateConversation(withUserId);
        if ("conversationId" in result) {
          setSelectedId(result.conversationId);
          await loadConversations(user.id, supabase);
        } else {
          setInitError(result.error);
        }
      } else if (convs.length > 0) {
        setSelectedId(convs[0].id);
      }
    });
  }, [withUserId, adminTargetUserId]);

  async function loadConversations(
    uid: string,
    supabase: ReturnType<typeof createClient>
  ): Promise<Conversation[]> {
    const { data } = await supabase
      .from("conversations")
      .select(`
        id, student_id, company_id, admin_participant_id, updated_at,
        student_profiles(full_name),
        company_profiles(company_name)
      `)
      .or(`student_id.eq.${uid},company_id.eq.${uid},admin_participant_id.eq.${uid}`)
      .order("updated_at", { ascending: false });

    const convs = (data as unknown as Conversation[]) || [];
    setConversations(convs);
    setLoadingConvs(false);
    return convs;
  }

  // Load messages + subscribe to real-time updates for selected conversation
  useEffect(() => {
    if (!selectedId) return;
    const supabase = createClient();

    supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", selectedId)
      .order("created_at", { ascending: true })
      .then(({ data }) => setMessages((data as Message[]) || []));

    const channel = supabase
      .channel(`msgs:${selectedId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${selectedId}`,
        },
        (payload) => setMessages((prev) => [...prev, payload.new as Message])
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedId]);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || !selectedId || sending) return;
    setSending(true);
    setSendError(null);
    setDraft("");
    const result = await sendMessage(selectedId, text);
    if (result.error) {
      setSendError(result.error);
      setDraft(text);
    }
    setSending(false);
    inputRef.current?.focus();
  };

  function getOtherName(conv: Conversation): string {
    if (userRole === "admin") {
      // Admin conversation: the other party is whichever side is not admin
      return (
        conv.student_profiles?.full_name ||
        conv.company_profiles?.company_name ||
        "Bruger"
      );
    }
    if (userRole === "student") return conv.company_profiles?.company_name || "Virksomhed";
    return conv.student_profiles?.full_name || "Kandidat";
  }

  function getOtherRole(conv: Conversation): string {
    if (userRole === "admin") {
      return conv.student_id ? "Arbejdssøgende" : "Virksomhed";
    }
    if (userRole === "student") return "Virksomhed";
    return "Arbejdssøgende";
  }

  const selectedConv = conversations.find((c) => c.id === selectedId) ?? null;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* ── Left: conversation list ── */}
      <aside className="w-64 flex-shrink-0 border-r border-gray-100 bg-white flex flex-col">
        <div className="px-5 py-4 border-b border-gray-100">
          <h1 className="font-black text-gray-900 text-base">Beskeder</h1>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingConvs ? (
            <p className="p-5 text-sm text-gray-400">Indlæser…</p>
          ) : conversations.length === 0 ? (
            <div className="p-5 text-center">
              <p className="text-sm text-gray-400 leading-relaxed">
                Ingen samtaler endnu.
                {userRole === "company" && (
                  <>
                    {" "}
                    Find kandidater og klik på <strong>Send besked</strong>.
                  </>
                )}
                {userRole === "student" && (
                  <>
                    {" "}
                    Klik på <strong>Send besked</strong> på et jobopslag.
                  </>
                )}
              </p>
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedId(conv.id)}
                className={`w-full text-left px-5 py-3.5 border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                  selectedId === conv.id
                    ? "bg-gray-50 border-l-2 border-l-gray-900"
                    : ""
                }`}
              >
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {getOtherName(conv)}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {new Date(conv.updated_at).toLocaleDateString("da-DK", {
                    day: "numeric",
                    month: "short",
                  })}
                </p>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* ── Right: message thread ── */}
      {selectedConv ? (
        <div className="flex-1 flex flex-col min-w-0">
          {/* Thread header */}
          <div className="px-6 py-4 border-b border-gray-100 bg-white flex-shrink-0">
            <p className="font-bold text-gray-900">{getOtherName(selectedConv)}</p>
            <p className="text-xs text-gray-400 mt-0.5">{getOtherRole(selectedConv)}</p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-3">
            {messages.length === 0 && (
              <p className="text-center text-sm text-gray-400 py-8">
                Ingen beskeder endnu. Send den første besked!
              </p>
            )}
            {messages.map((msg) => {
              const isMe = msg.sender_id === userId;
              return (
                <div
                  key={msg.id}
                  className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      isMe
                        ? "bg-gray-900 text-white rounded-br-sm"
                        : "bg-white border border-gray-100 text-gray-800 rounded-bl-sm shadow-sm"
                    }`}
                  >
                    <p>{msg.content}</p>
                    <p className="text-xs mt-1.5 text-gray-400">
                      {new Date(msg.created_at).toLocaleTimeString("da-DK", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-100 bg-white flex-shrink-0">
            {sendError && <p className="text-xs text-red-600 mb-2">{sendError}</p>}
            <div className="flex gap-3">
              <input
                ref={inputRef}
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Skriv en besked…"
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 placeholder-gray-400"
              />
              <button
                onClick={handleSend}
                disabled={!draft.trim() || sending}
                className="px-5 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 disabled:opacity-40 transition-colors whitespace-nowrap"
              >
                {sending ? "…" : "Send"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          {initError ? (
            <p className="text-sm text-red-500">{initError}</p>
          ) : (
            <p className="text-sm text-gray-400">Vælg en samtale for at begynde</p>
          )}
        </div>
      )}
    </div>
  );
}
