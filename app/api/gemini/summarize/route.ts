// app/api/gemini/summarize/route.ts
import { NextResponse } from "next/server";

const MODEL = "gemini-2.0-flash"; // change if you prefer another model

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { transcript } = body;
    if (!transcript) return NextResponse.json({ error: "missing transcript" }, { status: 400 });

    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) return NextResponse.json({ error: "server misconfigured" }, { status: 500 });

    const prompt = `
You are a meeting summarizer. Output a JSON object with:
- "summary": 2-3 sentence high-level summary
- "bullets": short bullet points (5 or fewer) of main topics
- "action_items": list of { assignee: string|null, action: string, due: string|null }
Return only JSON.
Transcript:
${transcript}
`;

    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": API_KEY, // safer than ?key= in logs
        },
        body: JSON.stringify({
          contents: [
            { parts: [{ text: prompt }] }
          ],
          // optional: control generation via generationConfig
          generationConfig: { maxOutputTokens: 800 }
        }),
      }
    );

    const data = await resp.json();
    if (!resp.ok) {
      console.error("Gemini error:", data);
      return NextResponse.json({ error: "Gemini API error", detail: data }, { status: 500 });
    }

    // Response shape: see docs; usually data.candidates / data.candidates[0].content/parts...
    // We'll try to extract plain text safely:
    const first = data?.candidates?.[0];
    const text = first?.content?.map?.((c:any)=> c.parts?.map((p:any)=>p.text).join("") ).join("\n")
      ?? data?.text
      ?? JSON.stringify(data);

    // return whatever Gemini sent (you can parse the JSON if the model obeys the JSON-only instruction)
    let parsed = null;
    try { parsed = JSON.parse(text); } catch(e) { parsed = { raw: text }; }

    return NextResponse.json({ ok: true, result: parsed });
  } catch (err:any) {
    console.error(err);
    return NextResponse.json({ error: err.message || "server error" }, { status: 500 });
  }
}
