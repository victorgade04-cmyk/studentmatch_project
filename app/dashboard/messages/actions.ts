"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendNewMessageEmail } from "@/lib/email";

async function getUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Ikke logget ind");
  return { supabase, user };
}

export async function getOrCreateConversation(
  otherUserId: string
): Promise<{ conversationId: string } | { error: string }> {
  try {
    const { supabase, user } = await getUser();
    const role = user.user_metadata?.role as string;

    if (role !== "student" && role !== "company") {
      return { error: "Kun studerende og virksomheder kan starte samtaler." };
    }

    const studentId = role === "student" ? user.id : otherUserId;
    const companyId = role === "company" ? user.id : otherUserId;

    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .eq("student_id", studentId)
      .eq("company_id", companyId)
      .maybeSingle();

    if (existing) return { conversationId: existing.id };

    const { data: created, error } = await supabase
      .from("conversations")
      .insert({ student_id: studentId, company_id: companyId })
      .select("id")
      .single();

    if (error || !created) return { error: "Kunne ikke oprette samtale." };
    return { conversationId: created.id };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function getOrCreateConversationAdmin(
  targetUserId: string
): Promise<{ conversationId: string } | { error: string }> {
  try {
    const { user } = await getUser();
    if (user.user_metadata?.role !== "admin") {
      return { error: "Kun admins kan bruge denne funktion." };
    }

    const admin = createAdminClient();

    const { data: targetUser } = await admin
      .from("users")
      .select("role")
      .eq("id", targetUserId)
      .single();

    if (!targetUser) return { error: "Bruger ikke fundet." };
    const targetRole = targetUser.role as string;

    if (targetRole !== "student" && targetRole !== "company") {
      return { error: "Kan kun starte samtaler med studerende eller virksomheder." };
    }

    if (targetRole === "student") {
      const { data: profile } = await admin
        .from("student_profiles")
        .select("id")
        .eq("id", targetUserId)
        .maybeSingle();
      if (!profile) return { error: "Denne bruger har endnu ikke oprettet en kandidatprofil." };
    } else {
      const { data: profile } = await admin
        .from("company_profiles")
        .select("id")
        .eq("id", targetUserId)
        .maybeSingle();
      if (!profile) return { error: "Denne virksomhed har endnu ikke oprettet en profil." };
    }

    let existing: { id: string } | null = null;
    if (targetRole === "student") {
      const { data } = await admin
        .from("conversations")
        .select("id")
        .eq("admin_participant_id", user.id)
        .eq("student_id", targetUserId)
        .maybeSingle();
      existing = data;
    } else {
      const { data } = await admin
        .from("conversations")
        .select("id")
        .eq("admin_participant_id", user.id)
        .eq("company_id", targetUserId)
        .maybeSingle();
      existing = data;
    }

    if (existing) return { conversationId: existing.id };

    const insertData: Record<string, string> = { admin_participant_id: user.id };
    if (targetRole === "student") {
      insertData.student_id = targetUserId;
    } else {
      insertData.company_id = targetUserId;
    }

    const { data: created, error } = await admin
      .from("conversations")
      .insert(insertData)
      .select("id")
      .single();

    if (error || !created) return { error: "Kunne ikke oprette samtale." };
    return { conversationId: created.id };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function sendMessage(
  conversationId: string,
  content: string
): Promise<{ error?: string }> {
  try {
    const { supabase, user } = await getUser();

    const { data: conv } = await supabase
      .from("conversations")
      .select("id, student_id, company_id, admin_participant_id")
      .eq("id", conversationId)
      .single();

    const isParticipant =
      conv &&
      (conv.student_id === user.id ||
        conv.company_id === user.id ||
        conv.admin_participant_id === user.id);

    if (!conv || !isParticipant) {
      return { error: "Ikke autoriseret." };
    }

    const { error } = await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content,
    });

    if (error) return { error: error.message };

    await supabase
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversationId);

    try {
      const isAdmin = conv.admin_participant_id === user.id;
      const recipientId = isAdmin
        ? (conv.student_id || conv.company_id!)
        : (conv.student_id === user.id ? conv.company_id! : conv.student_id!);

      const { data: recipientUser } = await supabase
        .from("users")
        .select("email")
        .eq("id", recipientId)
        .single();

      if (recipientUser?.email) {
        await sendNewMessageEmail({
          recipientEmail: recipientUser.email,
          recipientName: "Bruger",
          senderName: isAdmin ? "Admin" : "Bruger",
          messagePreview: content.slice(0, 300),
        });
      }
    } catch {}

    return {};
  } catch (e: any) {
    return { error: e.message };
  }
}
