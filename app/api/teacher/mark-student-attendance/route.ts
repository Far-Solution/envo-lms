// app/api/teacher/mark-student-attendance/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = createClient();
  const body = await req.json();

  const { student_id, course_id, session_id, status = "present", remarks } = body;

  if (!student_id || !course_id) {
    return NextResponse.json(
      { ok: false, error: "Missing student_id or course_id" },
      { status: 400 }
    );
  }

  // ✅ Get current teacher’s user ID
  const {
    data: { user },
  } = await (await supabase).auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  // ✅ Insert student attendance
  const { data, error } = await (await supabase)
    .from("student_attendance")
    .insert({
      student_id,
      course_id,
      session_id,
      marked_by: user.id,
      status,
      remarks,
      is_self_marked: false,
    })
    .select()
    .single();

  if (error) {
    console.error("Error marking student attendance:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, data });
}
