import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { id } = params;

  // 1️⃣ Fetch session
  const { data: session, error } = await (await supabase)
    .from("lms_sessions")
    .select(`
      id,
      title,
      description,
      type,
      status,
      mode,
      start_time,
      end_time,
      meeting_url,
      location,
      course:course_id ( id, name )
    `)
    .eq("id", id)
    .single();

  if (error || !session) {
    console.error("Error fetching session:", error);
    return NextResponse.json(
      { ok: false, error: error?.message || "Session not found" },
      { status: 500 }
    );
  }

  // 2️⃣ Participants
  const { data: participants } = await (await supabase)
    .from("session_participants")
    .select(`
      id,
      role,
      profile:profile_id ( id, full_name, profile_picture_url )
    `)
    .eq("session_id", id);

  // 3️⃣ Notes
  const { data: notes } = await (await supabase)
    .from("session_notes")
    .select("id, notes, created_at")
    .eq("session_id", id)
    .maybeSingle();

  // 4️⃣ Format response
  const formatted = {
    ...session,
    participants:
      participants?.map((p: any) => ({
        id: p.profile.id,
        name: p.profile.full_name,
        avatar_url: p.profile.profile_picture_url,
        role: p.role,
      })) || [],
    notes: notes?.notes ?? null,
  };

  // ✅ Return inside function
  return NextResponse.json({ ok: true, session: formatted });
}
