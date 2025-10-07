import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server" // apne supabase client ka path

export async function PUT(req: Request) {
  try {
    const supabase = createClient()
    const body = await req.json()
    const { id, title, description, due_date, max_points } = body

    if (!id) {
      return NextResponse.json({ error: "Assignment ID required" }, { status: 400 })
    }

    const { data, error } = await (await supabase)
      .from("assignments")
      .update({
        title,
        description,
        due_date,
        max_points,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, assignment: data[0] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
