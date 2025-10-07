// app/api/get-access-token/route.ts
import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error || !session) {
      return NextResponse.json({ error: "No active session" }, { status: 401 })
    }

    return NextResponse.json({ data: { access_token: session.access_token } })
  } catch (err: any) {
    console.error("get-access-token error:", err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
