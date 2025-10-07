import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE! // server-side only
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { session_id, speaker, chunk_text, is_final } = body;

    if (!chunk_text) {
      return NextResponse.json({ error: "missing chunk_text" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("live_transcripts")
      .insert([
        {
          session_id: session_id || null,
          speaker: speaker || null,
          chunk_text,
          is_final: !!is_final,
        },
      ])
      .select("*")
      .single();

    if (error) {
      console.error("Insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, data });
  } catch (err: any) {
    console.error("Ingest route error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
