import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/service"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.log("Incoming body:", body)

    // map frontend keys to backend vars ✅
    const {
      id: teacherId,
      first_name: firstName,
      last_name: lastName,
      phone,
      course_ids: courseIds,
    } = body

    if (!teacherId) {
      console.error("❌ Teacher ID missing")
      return NextResponse.json({ error: "Teacher ID required" }, { status: 400 })
    }

    // step 1: get logged-in admin + institute
    const supabase = await createClient()
    const {
      data: { user: adminUser },
    } = await supabase.auth.getUser()

    console.log("Admin user from auth:", adminUser)

    if (!adminUser) {
      console.error("❌ Unauthorized - no adminUser")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: adminProfile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("institute_id")
      .eq("id", adminUser.id)
      .single()

    console.log("Admin profile fetched:", adminProfile, "Error:", profileError)

    if (profileError || !adminProfile) {
      return NextResponse.json({ error: "Admin profile not found" }, { status: 400 })
    }

    // step 2: update teacher profile
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({
        first_name: firstName,
        last_name: lastName,
        full_name: `${firstName} ${lastName}`,
        phone: phone || null,
      })
      .eq("id", teacherId)
      .eq("institute_id", adminProfile.institute_id)

    if (updateError) {
      console.error("Update teacher error:", updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // step 3: reset + insert courses
    await supabaseAdmin.from("teacher_courses").delete().eq("profile_id", teacherId)

    if (courseIds && courseIds.length > 0) {
      const { error: insertError } = await supabaseAdmin.from("teacher_courses").insert(
        courseIds.map((cid: string) => ({
          course_id: cid,
          profile_id: teacherId,
        }))
      )

      if (insertError) {
        console.error("Insert courses error:", insertError)
        return NextResponse.json({ error: insertError.message }, { status: 500 })
      }
    }

    return NextResponse.json({ message: "✅ Teacher updated successfully." })
  } catch (err) {
    console.error("❌ Server crash:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    )
  }
}
