import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { requireRole } from "@/lib/auth"

export async function PUT(req: Request) {
  try {
    const profile = await requireRole(["teacher"])
    const supabase = await createClient()
    const { id } = await req.json()

    if (!id) {
      return NextResponse.json({ error: "Assignment ID is required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("assignments")
      .update({ is_published: true })
      .eq("id", id)
      .select("*")
      .single()

    if (error) throw error

    return NextResponse.json({ assignment: data })
  } catch (error: any) {
    console.error("Publish error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
