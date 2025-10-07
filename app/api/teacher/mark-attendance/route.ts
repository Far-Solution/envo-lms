// app/api/teacher/mark-attendance/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = createClient();
  const body = await req.json();

  const { status = "present", remarks } = body;

  // ✅ Get current teacher’s user ID
  const {
    data: { user },
  } = await (await supabase).auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  // ✅ Insert attendance record
  const { data, error } = await (await supabase)
    .from("teacher_attendance")
    .insert({
      teacher_id: user.id,
      status,
      remarks,
      marked_by: user.id,
      is_self_marked: true,
    })
    .select()
    .single();

  if (error) {
    console.error("Error marking teacher attendance:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, data });
}
