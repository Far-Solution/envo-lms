import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server" // apna supabase client import path

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Assignment ID required" }, { status: 400 })
    }

    const supabase = createClient()

    // ⚠️ Agar tum chahte ho ke assignment ke saath submissions bhi delete ho to
    // ya to Supabase mein cascade relation lagao, ya pehle submissions delete karo.
    // Example:
    // await supabase.from("assignment_submissions").delete().eq("assignment_id", id)

    const { error } = await (await supabase).from("assignments").delete().eq("id", id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
