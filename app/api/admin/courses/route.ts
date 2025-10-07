import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = createClient()

  const { data, error } = await (await supabase)
    .from("courses")
    .select("id, name, code, institute_id, created_at")
    .order("created_at", { ascending: false })

  console.log("Fetched courses from backend:", data)
  console.error("Error fetching courses:", error)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data || [])
}
