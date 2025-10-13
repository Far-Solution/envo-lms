import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireRole } from "@/lib/auth" // ✅ use this to get logged-in admin profile

export async function GET() {
  const adminProfile = await requireRole(["admin"]) // ✅ only admins allowed
  const supabase = await createClient()

  // ✅ Fetch courses only for admin’s institute
  const { data, error } = await supabase
    .from("courses")
    .select("id, name, code, institute_id, created_at")
    .eq("institute_id", adminProfile.institute_id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching courses:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data || [])
}
