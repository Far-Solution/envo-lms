// app/api/jitsi-token/route.ts (Next.js route handler, Node)
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!;
const JITSI_DOMAIN = process.env.JITSI_DOMAIN!;
const JITSI_APP_SECRET = process.env.JITSI_APP_SECRET!;
const JITSI_ISS = process.env.JITSI_ISS || "envo-lms";

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { sessionId, roomName } = body;
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "");

    if (!token) return NextResponse.json({ error: "No auth token" }, { status: 401 });

    // 1) validate token with Supabase auth endpoint
    const userResp = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!userResp.ok) return NextResponse.json({ error: "Invalid user token" }, { status: 401 });
    const user = await userResp.json(); // has id, email, etc.

    // 2) authorization: ensure user is allowed to join session
    // Check if user is session owner OR a participant
    const { data: owner, error: ownerErr } = await supabaseAdmin
      .from("lms_sessions")
      .select("created_by")
      .eq("id", sessionId)
      .maybeSingle();
    if (ownerErr) throw ownerErr;
    const isOwner = owner?.created_by === user.id;

    const { data: participant } = await supabaseAdmin
      .from("session_participants")
      .select("id")
      .eq("session_id", sessionId)
      .eq("profile_id", user.id)
      .limit(1)
      .maybeSingle();

    if (!isOwner && !participant) {
      return NextResponse.json({ error: "Not authorized for this session" }, { status: 403 });
    }

    // 3) create JWT payload (short lived)
    const now = Math.floor(Date.now() / 1000);
    const exp = now + 60 * 60; // 1 hour
    const payload = {
      aud: "jitsi",
      iss: JITSI_ISS,
      sub: JITSI_DOMAIN,
      room: roomName || `lms-session-${sessionId}`, // optional room restriction
      exp,
      context: {
        user: {
          id: user.id,
          name: user.user_metadata?.full_name || user.email || "User",
          email: user.email,
          moderator: isOwner ? true : false,
        },
      },
    };

    const tokenJwt = jwt.sign(payload, JITSI_APP_SECRET, { algorithm: "HS256" });

    return NextResponse.json({ token: tokenJwt });
  } catch (err: any) {
    console.error("jitsi-token error", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
