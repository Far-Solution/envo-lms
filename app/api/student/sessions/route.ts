import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createClient();

  // later you can join with session_participants to filter by logged-in student
  const { data, error } = await (await supabase)
    .from("lms_sessions")
    .select("*")
    .order("start_time", { ascending: true });

  if (error) {
    console.error("Error fetching sessions:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const now = new Date();
  const upcoming = data.filter(s => new Date(s.start_time) > now);
  const past = data.filter(s => new Date(s.end_time) < now);

  return NextResponse.json({ upcoming, past });
}
