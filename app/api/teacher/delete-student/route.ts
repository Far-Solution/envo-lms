// app/api/admin/delete-student/route.ts
import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/service"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { studentId } = body

    console.log("Incoming delete request:", body)

    if (!studentId) {
      return NextResponse.json({ error: "Student ID required" }, { status: 400 })
    }

    const supabase = await createClient()
    const {
      data: { user: adminUser },
    } = await supabase.auth.getUser()

    if (!adminUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: adminProfile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("institute_id")
      .eq("id", adminUser.id)
      .single()

    if (profileError || !adminProfile) {
      return NextResponse.json({ error: "Admin profile not found" }, { status: 400 })
    }

    // 1. Delete student's course assignments
    const { error: coursesError } = await supabaseAdmin
      .from("student_courses") // ✅ changed
      .delete()
      .eq("profile_id", studentId)

    if (coursesError) {
      console.error("Error deleting student_courses:", coursesError)
      return NextResponse.json({ error: coursesError.message }, { status: 500 })
    }

    // 2. Delete student profile
    const { error: profileDeleteError } = await supabaseAdmin
      .from("profiles")
      .delete()
      .eq("id", studentId)
      .eq("institute_id", adminProfile.institute_id)

    if (profileDeleteError) {
      console.error("Error deleting profile:", profileDeleteError)
      return NextResponse.json({ error: profileDeleteError.message }, { status: 500 })
    }

    // 3. Delete auth user
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(studentId)

    if (authError) {
      console.error("Error deleting auth user:", authError)
      return NextResponse.json({ error: authError.message }, { status: 500 })
    }

    return NextResponse.json({ message: "✅ Student deleted successfully." })
  } catch (err) {
    console.error("❌ Server crash:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    )
  }
}

