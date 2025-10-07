import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()

  // 1. Get logged-in teacher profile
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // 2. Get profile row
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .single()

  if (profileError || !profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 })
  }

  // 3. Fetch only courses assigned to this teacher
  const { data: courses, error } = await supabase
    .from("teacher_courses")
    .select(
      `
      course_id,
      courses (
        id,
        name,
        code,
        institute_id,
        created_at
      )
    `
    )
    .eq("profile_id", profile.id)
    .order("courses(created_at)", { ascending: false })

  if (error) {
    console.error("Error fetching teacher courses:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // 4. Format: return only course objects
  const formatted = courses?.map((tc) => tc.courses) || []

  return NextResponse.json(formatted)
}

