// app/api/admin/add-teacher/route.ts
import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/service"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { firstName, lastName, phone, courseId } = body  // ✅ include courseId

    if (!firstName || !lastName) {
      return NextResponse.json({ error: "First and last name required" }, { status: 400 })
    }

    if (!courseId) {
      return NextResponse.json({ error: "Course ID required" }, { status: 400 })
    }

    // Step 1: Generate email + temp password
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@domain.envo-lms.com`
    const tempPassword = `temp${Math.random().toString(36).slice(-8)}`

    // Step 2: Create user in Supabase Auth (service role)
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        role: "teacher",
        phone,
        requires_password_reset: true,
      },
    })

    if (userError || !userData?.user) {
      return NextResponse.json({ error: userError?.message || "Failed to create user" }, { status: 500 })
    }

    // Step 3: Get admin's institute_id
    const supabase = await createClient()
    const {
      data: { user: adminUser },
    } = await supabase.auth.getUser()

    if (!adminUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: adminProfile, error: profileError } = await supabase
      .from("profiles")
      .select("institute_id")
      .eq("id", adminUser.id)
      .single()

    if (profileError || !adminProfile) {
      return NextResponse.json({ error: "Admin profile not found" }, { status: 400 })
    }

    // Step 4: Insert teacher profile
    const { error: insertError } = await supabaseAdmin.from("profiles").insert({
      id: userData.user.id,
      first_name: firstName,
      last_name: lastName,
      full_name: `${firstName} ${lastName}`,
      email,
      role: "teacher",
      phone: phone || null,
      institute_id: adminProfile.institute_id,
    })

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // ✅ Step 5: Link teacher to selected course
    const { error: teacherCourseError } = await supabaseAdmin.from("teacher_courses").insert({
      course_id: courseId,
      profile_id: userData.user.id,
    })

    if (teacherCourseError) {
      return NextResponse.json({ error: teacherCourseError.message }, { status: 500 })
    }

    // ✅ Success
    return NextResponse.json({
      email,
      tempPassword,
      message: "Teacher created and assigned to course successfully.",
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 },
    )
  }
}
