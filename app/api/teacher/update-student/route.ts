// app/api/teacher/update-student/route.ts
import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/service"
import { requireRole } from "@/lib/auth" // ✅ ye tum already use kar rahe ho teacher pages me

export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.log("Incoming body:", body)

    // Option B - support both naming conventions ✅
    const {
      id,
      studentId,
      first_name: firstName,
      last_name: lastName,
      phone,
      course_ids,
      courseIds,
    } = body

    const finalStudentId = id || studentId
    const finalCourseIds = course_ids || courseIds

    if (!finalStudentId) {
      return NextResponse.json({ error: "Student ID required" }, { status: 400 })
    }

    // step 1: ensure logged-in user is a teacher
    const teacherProfile = await requireRole(["teacher"]) // ✅ sirf teacher
    if (!teacherProfile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // step 2: update student profile (only if in same institute)
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({
        first_name: firstName,
        last_name: lastName,
        full_name: `${firstName} ${lastName}`,
        phone: phone || null,
      })
      .eq("id", finalStudentId)
      .eq("institute_id", teacherProfile.institute_id) // ✅ student must belong to same institute

    if (updateError) {
      console.error("Update student error:", updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // step 3: reset + insert courses
    await supabaseAdmin.from("student_courses").delete().eq("profile_id", finalStudentId)

    if (finalCourseIds && finalCourseIds.length > 0) {
      const { error: insertError } = await supabaseAdmin
        .from("student_courses")
        .insert(
          finalCourseIds.map((cid: string) => ({
            course_id: cid,
            profile_id: finalStudentId,
          }))
        )

      if (insertError) {
        console.error("Insert courses error:", insertError)
        return NextResponse.json({ error: insertError.message }, { status: 500 })
      }
    }

    return NextResponse.json({ message: "✅ Student updated successfully." })
  } catch (err) {
    console.error("❌ Server crash:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    )
  }
}
