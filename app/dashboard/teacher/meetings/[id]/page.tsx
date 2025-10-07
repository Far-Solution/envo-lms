"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "../components/StatusBadge";
import { Participants } from "../components/Participants";
import { Button } from "@/components/ui/button";
import MeetingIframe from "../components/MeetingIframe";

interface Session {
  id: string;
  title: string;
  type: "class" | "meeting";
  status: "upcoming" | "live" | "completed";
  mode: "online" | "offline";
  start_time: string;
  end_time: string;
  participants?: { id: string; name: string; avatar_url?: string }[];
  meeting_url?: string;
  location?: string;
}

export default function SessionDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [inMeeting, setInMeeting] = useState(false);

  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch(`/api/teacher/sessions/${id}`);
        const data = await res.json();
        if (data.ok) setSession(data.session);
        else setSession(null);
      } catch (err) {
        console.error("Error fetching session:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchSession();
  }, [id]);

  if (loading) return <p>Loading...</p>;
  if (!session) return <p>Session not found</p>;

  // ✅ Simple student-like flow
  if (session.mode === "online" && inMeeting && session.meeting_url) {
    return (
      <MeetingIframe
        meetingUrl={session.meeting_url}
        onLeave={() => setInMeeting(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex justify-between items-center">
          <CardTitle>{session.title}</CardTitle>
          <StatusBadge status={session.status} />
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p><strong>Type:</strong> {session.type}</p>

          {session.type === "meeting" && session.participants?.length ? (
            <div>
              <strong>Participants:</strong>
              <Participants participants={session.participants} />
            </div>
          ) : null}

          <p><strong>Mode:</strong> {session.mode === "online" ? "Online" : "Offline"}</p>
          {session.mode === "offline" && session.location && (
            <p><strong>Location:</strong> {session.location}</p>
          )}
          <p><strong>Start:</strong> {new Date(session.start_time).toLocaleString()}</p>
          <p><strong>End:</strong> {new Date(session.end_time).toLocaleString()}</p>

          {session.mode === "online" && session.meeting_url && (
            <Button onClick={() => setInMeeting(true)}>Start Meeting</Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
